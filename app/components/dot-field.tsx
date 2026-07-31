"use client";

import { useEffect, useRef } from "react";

import { mulberry32 } from "../lib/rng";

const PITCH = 9; // grid spacing, CSS px
const SIZE = 6; // cell edge, CSS px — 6 on a 9 pitch leaves a 3px gap
const RADIUS = 0.5; // cell corner rounding — the reference reads near-square

const PAC_DIAMETER = 6.5;
const PAC_SPEED = 26; // CSS px per second
const PAC_CHOMP_HZ = 5;
const PAC_TURN_CHANCE = 0.18; // per cell arrival
const PAC_AREA_PER = 38_000; // one walker per this many CSS px² of visible band
const PAC_MAX = 90;

const REGROW_MIN = 7000; // ms before an eaten cell returns
const REGROW_VAR = 7000;

/**
 * The pointer trail is *not* on the lattice. In the reference its squares sit
 * in the gaps between cells, spaced about half a pitch apart — they are free
 * particles dropped along the pointer's path, smaller than a resting cell, and
 * drawn over the field rather than replacing part of it.
 */
const TRAIL_SIZE = 4.2; // particle edge, CSS px
const TRAIL_STEP = 7; // distance between particles — wide enough to read as dots
const TRAIL_LIFE = 0.55; // seconds to fade out — sets how long the ribbon reads
const MAX_PARTICLES = 800;

/**
 * Discrete intensity steps, in the spirit of a contribution graph: neighbouring
 * particles land on different rungs, so the ribbon reads as varied rather than
 * as one flat stroke.
 */
const TRAIL_LEVELS = [0.35, 0.55, 0.78, 1] as const;

/**
 * When the pointer stops, particles are born *at the cursor tip* and radiate
 * outward, fading as they go — they are not sprayed across a disc. Tracking
 * individual dots across frames in the reference gives ~75px/s outward, which
 * over their lifetime carries them to about 40px.
 */
const IDLE_DELAY = 240; // ms of stillness before the scatter starts
const IDLE_RATE = 55; // particles per second
const IDLE_SPEED = 75; // CSS px per second, outward
const IDLE_SPEED_VAR = 0.45; // ±fraction, so they do not travel in lockstep
const IDLE_LIFE = 0.5; // seconds — long enough to reach ~40px

/**
 * The resting field occupies the top of the *document*, not the viewport: full
 * strength at the very top, ramping to nothing at this fraction of a viewport
 * height, and it scrolls away with the page. Measured off the reference.
 */
const FADE_END = 0.45;

const DIRS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;

type Pac = {
  col: number;
  row: number;
  dir: number;
  /** 0–1 progress from the current cell toward the next. */
  step: number;
};

/**
 * Background lattice with wandering Pac-Men, plus a particle pointer trail.
 *
 * Everything is addressed in document coordinates and the canvas — which is
 * fixed to the viewport — draws with a `-scrollY` offset, so the resting grid
 * and walkers stay anchored to the top of the page while the trail works
 * anywhere the pointer goes.
 *
 * The lattice is painted once offscreen and blitted; only eaten cells are
 * redrawn. The trail is a separate particle system with no grid alignment.
 */
export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const trailCanvas = trailRef.current;
    if (!canvas || !trailCanvas) return;
    const ctx = canvas.getContext("2d");
    const trailCtx = trailCanvas.getContext("2d");
    if (!ctx || !trailCtx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const base = document.createElement("canvas");
    const baseCtx = base.getContext("2d");
    if (!baseCtx) return;

    let width = 0;
    let height = 0; // viewport height
    let bandHeight = 0; // where the resting field fades to nothing
    let cols = 0;
    let bandRows = 0;
    let dpr = 1;

    let jitter = new Float32Array(0);
    let eatenUntil = new Float64Array(0);
    let chewed = new Set<number>();
    let pacs: Pac[] = [];

    // Particle pool, swap-removed on death so there is no per-frame allocation.
    const partX = new Float32Array(MAX_PARTICLES);
    const partY = new Float32Array(MAX_PARTICLES);
    // Path particles stay put; idle ones drift outward from the cursor.
    const partVX = new Float32Array(MAX_PARTICLES);
    const partVY = new Float32Array(MAX_PARTICLES);
    const partLevel = new Float32Array(MAX_PARTICLES);
    const partLife = new Float32Array(MAX_PARTICLES);
    const partMax = new Float32Array(MAX_PARTICLES);
    let partCount = 0;

    let rgb = "17, 17, 17";
    let baseAlpha = 0.066;
    let hotAlpha = 0.55;
    let pacAlpha = 0.33;

    let pointer: { x: number; y: number } | null = null;
    /** Where the last particle was dropped, so spacing is distance-based. */
    let lastDrop: { x: number; y: number } | null = null;
    let lastMoveAt = 0;
    let idleDebt = 0;
    let frame = 0;
    let last = performance.now();

    const random = mulberry32(9973);

    function readTheme() {
      const styles = getComputedStyle(document.documentElement);
      rgb = styles.getPropertyValue("--cell-rgb").trim() || "17, 17, 17";
      baseAlpha = Number(styles.getPropertyValue("--cell-base")) || 0.066;
      hotAlpha = Number(styles.getPropertyValue("--cell-hot")) || 0.55;
      pacAlpha = Number(styles.getPropertyValue("--pac-alpha")) || 0.33;
    }

    /** Vertical ramp over document space: 1 at page top, 0 at bandHeight. */
    function fade(docY: number) {
      if (docY >= bandHeight) return 0;
      return 1 - docY / bandHeight;
    }

    function cellX(col: number) {
      return col * PITCH + (PITCH - SIZE) / 2;
    }
    function cellY(row: number) {
      return row * PITCH + (PITCH - SIZE) / 2;
    }

    function buildBase() {
      base.width = Math.floor(width * dpr);
      base.height = Math.max(1, Math.floor(bandHeight * dpr));
      baseCtx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      baseCtx!.clearRect(0, 0, width, bandHeight);
      baseCtx!.fillStyle = `rgb(${rgb})`;
      for (let row = 0; row < bandRows; row++) {
        const ramp = fade(cellY(row));
        if (ramp <= 0) break;
        for (let col = 0; col < cols; col++) {
          const alpha = baseAlpha * jitter[row * cols + col] * ramp;
          if (alpha <= 0.002) continue;
          baseCtx!.globalAlpha = alpha;
          baseCtx!.beginPath();
          baseCtx!.roundRect(cellX(col), cellY(row), SIZE, SIZE, RADIUS);
          baseCtx!.fill();
        }
      }
      baseCtx!.globalAlpha = 1;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      bandHeight = height * FADE_END;

      for (const c of [canvas!, trailCanvas!]) {
        c.width = Math.floor(width * dpr);
        c.height = Math.floor(height * dpr);
        c.style.width = `${width}px`;
        c.style.height = `${height}px`;
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      trailCtx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(width / PITCH) + 1;
      bandRows = Math.max(1, Math.ceil(bandHeight / PITCH) + 1);
      const count = cols * bandRows;

      const seeded = mulberry32(9973);
      jitter = new Float32Array(count);
      for (let i = 0; i < count; i++) jitter[i] = 0.45 + seeded() * 0.55;
      eatenUntil = new Float64Array(count);
      chewed = new Set();

      const target = Math.min(
        PAC_MAX,
        Math.max(4, Math.round((width * bandHeight) / PAC_AREA_PER)),
      );
      pacs = Array.from({ length: target }, () => ({
        col: Math.floor(random() * cols),
        row: Math.floor(random() * bandRows),
        dir: Math.floor(random() * 4),
        step: random(),
      }));

      readTheme();
      buildBase();
      if (reduced.matches) drawStatic();
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, width, height);
      ctx!.drawImage(base, 0, -window.scrollY, width, bandHeight);
    }

    function emit(x: number, y: number, life: number, vx = 0, vy = 0) {
      // Oldest particle is sacrificed if the pool is full.
      const i = partCount < MAX_PARTICLES ? partCount++ : 0;
      partX[i] = x;
      partY[i] = y;
      partVX[i] = vx;
      partVY[i] = vy;
      partLevel[i] = TRAIL_LEVELS[Math.floor(random() * TRAIL_LEVELS.length)];
      partLife[i] = life;
      partMax[i] = life;
    }

    /** Drop particles along the path at a fixed spacing, not per frame. */
    function trailTo(to: { x: number; y: number }) {
      if (!lastDrop) {
        lastDrop = { x: to.x, y: to.y };
        emit(to.x, to.y, TRAIL_LIFE);
        return;
      }
      let dx = to.x - lastDrop.x;
      let dy = to.y - lastDrop.y;
      let dist = Math.hypot(dx, dy);
      // Bounded so a pointer jump across the page cannot flood the pool.
      let guard = 200;
      while (dist >= TRAIL_STEP && guard-- > 0) {
        const t = TRAIL_STEP / dist;
        lastDrop = { x: lastDrop.x + dx * t, y: lastDrop.y + dy * t };
        emit(lastDrop.x, lastDrop.y, TRAIL_LIFE);
        dx = to.x - lastDrop.x;
        dy = to.y - lastDrop.y;
        dist = Math.hypot(dx, dy);
      }
    }

    /** While the pointer holds still, churn a tight cluster around it. */
    function scatterIdle(now: number, dt: number) {
      if (!pointer || now - lastMoveAt < IDLE_DELAY) {
        idleDebt = 0;
        return;
      }
      idleDebt += IDLE_RATE * dt;
      let budget = 12;
      while (idleDebt >= 1 && budget-- > 0) {
        idleDebt -= 1;
        const angle = random() * Math.PI * 2;
        const speed = IDLE_SPEED * (1 + (random() * 2 - 1) * IDLE_SPEED_VAR);
        // Born at the tip, carried outward by its own velocity.
        emit(
          pointer.x,
          pointer.y,
          IDLE_LIFE,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
        );
      }
      idleDebt = Math.min(idleDebt, 2);
    }

    function advanceParticles(dt: number) {
      for (let i = 0; i < partCount; i++) {
        partX[i] += partVX[i] * dt;
        partY[i] += partVY[i] * dt;
        partLife[i] -= dt;
        if (partLife[i] <= 0) {
          const lastIndex = --partCount;
          partX[i] = partX[lastIndex];
          partY[i] = partY[lastIndex];
          partVX[i] = partVX[lastIndex];
          partVY[i] = partVY[lastIndex];
          partLevel[i] = partLevel[lastIndex];
          partLife[i] = partLife[lastIndex];
          partMax[i] = partMax[lastIndex];
          i--;
        }
      }
    }

    function canEnter(col: number, row: number) {
      return col >= 0 && row >= 0 && col < cols && row < bandRows;
    }

    function advancePacs(dt: number, now: number) {
      const perCell = PITCH / PAC_SPEED; // seconds to cross one cell
      for (const pac of pacs) {
        pac.step += dt / perCell;
        while (pac.step >= 1) {
          pac.step -= 1;
          pac.col += DIRS[pac.dir][0];
          pac.row += DIRS[pac.dir][1];

          if (canEnter(pac.col, pac.row)) {
            const index = pac.row * cols + pac.col;
            eatenUntil[index] = now + REGROW_MIN + random() * REGROW_VAR;
            chewed.add(index);
          }

          const ahead = [
            pac.col + DIRS[pac.dir][0],
            pac.row + DIRS[pac.dir][1],
          ] as const;
          if (!canEnter(ahead[0], ahead[1]) || random() < PAC_TURN_CHANCE) {
            const turn = random() < 0.5 ? 1 : 3; // never reverse
            const first = (pac.dir + turn) % 4;
            const second = (pac.dir + (turn === 1 ? 3 : 1)) % 4;
            pac.dir = canEnter(
              pac.col + DIRS[first][0],
              pac.row + DIRS[first][1],
            )
              ? first
              : second;
          }
        }
      }
    }

    function drawPac(pac: Pac, now: number, scrollY: number) {
      const [dx, dy] = DIRS[pac.dir];
      const docX = (pac.col + pac.step * dx) * PITCH + PITCH / 2;
      const docY = (pac.row + pac.step * dy) * PITCH + PITCH / 2;
      const ramp = fade(docY);
      if (ramp <= 0) return;

      const y = docY - scrollY;
      if (y < -PITCH || y > height + PITCH) return;

      const facing = Math.atan2(dy, dx);
      const chomp =
        (Math.sin(now * 0.001 * PAC_CHOMP_HZ * Math.PI * 2) + 1) / 2;
      const mouth = 0.05 * Math.PI + chomp * 0.17 * Math.PI;

      ctx!.globalAlpha = pacAlpha * ramp;
      ctx!.beginPath();
      ctx!.moveTo(docX, y);
      ctx!.arc(
        docX,
        y,
        PAC_DIAMETER / 2,
        facing + mouth,
        facing - mouth + Math.PI * 2,
      );
      ctx!.closePath();
      ctx!.fill();
    }

    function draw(now: number) {
      const scrollY = window.scrollY;

      ctx!.clearRect(0, 0, width, height);
      ctx!.drawImage(base, 0, -scrollY, width, bandHeight);
      ctx!.fillStyle = `rgb(${rgb})`;

      // Eaten cells: punch them out of the blitted band.
      for (const index of chewed) {
        if (eatenUntil[index] <= now) {
          eatenUntil[index] = 0;
          chewed.delete(index);
          continue;
        }
        const col = index % cols;
        const row = (index - col) / cols;
        const y = cellY(row) - scrollY;
        if (y < -PITCH || y > height) continue;
        ctx!.clearRect(cellX(col) - 1, y - 1, SIZE + 2, SIZE + 2);
      }

      for (const pac of pacs) drawPac(pac, now, scrollY);
      ctx!.globalAlpha = 1;

      // Trail particles live on their own layer *above* the page content, so
      // they stay visible over cards and panels. Deliberately not multiplied
      // by the vertical ramp, so they read on the plain area below the field.
      trailCtx!.clearRect(0, 0, width, height);
      trailCtx!.fillStyle = `rgb(${rgb})`;
      const half = TRAIL_SIZE / 2;
      for (let i = 0; i < partCount; i++) {
        const y = partY[i] - scrollY;
        if (y < -TRAIL_SIZE || y > height + TRAIL_SIZE) continue;
        const alpha = hotAlpha * partLevel[i] * (partLife[i] / partMax[i]);
        if (alpha <= 0.002) continue;
        trailCtx!.globalAlpha = alpha;
        // Rounded to whole pixels so the squares stay crisp.
        trailCtx!.fillRect(
          Math.round(partX[i] - half),
          Math.round(y - half),
          TRAIL_SIZE,
          TRAIL_SIZE,
        );
      }
      trailCtx!.globalAlpha = 1;
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (pointer) {
        trailTo(pointer);
        scatterIdle(now, dt);
      }
      advanceParticles(dt);
      advancePacs(dt, now);
      draw(now);
      frame = requestAnimationFrame(tick);
    }

    function onPointerMove(event: PointerEvent) {
      const next = { x: event.clientX, y: event.clientY + window.scrollY };
      if (!pointer || Math.hypot(next.x - pointer.x, next.y - pointer.y) > 1) {
        lastMoveAt = performance.now();
      }
      pointer = next;
    }
    function onPointerLeave() {
      pointer = null;
      lastDrop = null;
    }

    const themeObserver = new MutationObserver(() => {
      readTheme();
      buildBase();
      if (reduced.matches) drawStatic();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    resize();
    window.addEventListener("resize", resize);

    if (reduced.matches) {
      window.addEventListener("scroll", drawStatic, { passive: true });
    } else {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", drawStatic);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      />
      {/* Above the project cards (z-30) and the corner controls (z-40), so the
          trail stays visible wherever the pointer goes. */}
      <canvas
        ref={trailRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50"
      />
    </>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * The theme change is revealed by a circle expanding from the toggle to the
 * furthest viewport corner. Measured off the reference: ~430ms, standard
 * ease-out (45% of the way at a quarter of the duration, 83% at 72%).
 */
const REVEAL_MS = 430;

/**
 * The incoming theme also arrives blurred and resolves. Measuring text
 * sharpness through the transition: it bottoms out at a quarter of its
 * settled value as the circle passes, then climbs back over ~800ms — well
 * after the circle itself has finished.
 */
const BLUR_MS = 1000;
const BLUR_PX = 4;

/**
 * The real sounds, lifted from the reference recording rather than
 * synthesised. Its system-audio capture had a digital-zero noise floor, so
 * each clip is the original waveform, trimmed to its own onset and decay.
 *
 * Levels are the reference's own: each clip is scaled to the median peak of
 * its family across the whole recording, so no single loud or quiet take sets
 * the level. Normalising them all to a common peak — as an earlier pass did —
 * both raised the volume ~4-8x and flattened the balance between them.
 *
 *   hover   65ms   a bright noisy tick
 *   card    115ms  noise transient, then a near-pure 3211 Hz body 16ms behind
 *   button  97ms   short pitched click
 *   toggle  351ms  two tones a fifth apart, 1567 Hz over 1052 Hz
 */
const CLIPS = {
  hover: "/sounds/hover.wav",
  card: "/sounds/card.wav",
  button: "/sounds/button.wav",
  toggle: "/sounds/toggle.wav",
} as const;

type Clip = keyof typeof CLIPS;

/**
 * The clips carry the reference's own peaks — hover 0.164, card 0.188,
 * button 0.088, toggle 0.269 — so gain of 1 reproduces it exactly. Hover is
 * pulled below that on purpose: it fires on every pointer pass, so what reads
 * as balanced in a short demo becomes wearing in use.
 */
const LEVEL: Record<Clip, number> = {
  hover: 0.55,
  card: 1,
  button: 1,
  toggle: 1,
};

/** Not in TypeScript's DOM lib yet; absent in older browsers. */
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

/** Tracks the `dark` class on <html>, whoever set it. */
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

/**
 * The fixed bottom-left pair: sound, then theme.
 *
 * Sounds are short clips played through Web Audio. The context is created
 * lazily on the first gesture, since browsers block it before that.
 */
export function CornerControls() {
  const [sound, setSound] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  // The inline script in the layout sets the class before paint; read it
  // rather than mirroring it into state. Server snapshot is `false` so the
  // markup matches, then React corrects it on hydration.
  const dark = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  /** Lazily created on the first gesture; browsers block it before that. */
  const context = useCallback(() => {
    let ctx = audioRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      audioRef.current = ctx;
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }, []);

  /** Decoded clips, fetched once on first use and cached. */
  const buffers = useRef(new Map<Clip, AudioBuffer>());
  /** The element the hover sound last spoke for, to avoid retriggering. */
  const spoken = useRef<Element | null>(null);

  const play = useCallback(
    async (clip: Clip, force = false) => {
      if (!sound && !force) return;
      const ctx = context();

      let buffer = buffers.current.get(clip);
      if (!buffer) {
        try {
          const response = await fetch(CLIPS[clip]);
          buffer = await ctx.decodeAudioData(await response.arrayBuffer());
          buffers.current.set(clip, buffer);
        } catch {
          return; // offline or blocked — silence is an acceptable outcome
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const amp = ctx.createGain();
      amp.gain.value = LEVEL[clip];
      source.connect(amp).connect(ctx.destination);
      source.start();
    },
    [sound, context],
  );

  // One delegated listener each, rather than handlers on every element.
  useEffect(() => {
    if (!sound) return;
    const interactive = "a, button, [role='button']";
    // `pointerover` bubbles from every descendant, so crossing a card's pill,
    // icon and tags re-fires it while the hovered card never changed. Track
    // which element is hovered and speak only when that actually differs.
    let hovering: Element | null = null;

    function onOver(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      const el = target?.closest(interactive) ?? null;
      hovering = el;
      // The corner controls speak only when pressed, never on hover.
      if (!el || el.closest('[data-sound="control"]')) return;
      if (el === spoken.current) return;
      spoken.current = el;
      void play("hover");
    }

    function onOut(event: PointerEvent) {
      // Only clear once the pointer has genuinely left the element, not when
      // it moves onto one of its own children.
      const to = event.relatedTarget as HTMLElement | null;
      if (to && hovering && hovering.contains(to)) return;
      if (spoken.current && (!to || !spoken.current.contains(to))) {
        spoken.current = null;
      }
    }
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const el = target?.closest(interactive);
      if (!el) return;
      // Project cards have their own sound in the reference.
      void play(el.closest('[data-sound="card"]') ? "card" : "button");
    }

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("click", onClick);
    };
  }, [sound, play]);

  function toggleTheme(event: React.MouseEvent<HTMLButtonElement>) {
    const next = !dark;
    const apply = () => {
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem("theme", next ? "dark" : "light");
      } catch {
        // Private mode — the toggle still works for this session.
      }
    };

    const doc = document as ViewTransitionDocument;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || typeof doc.startViewTransition !== "function") {
      apply();
      return;
    }

    // Circle grows from the button to whichever viewport corner is furthest.
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const reach = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = doc.startViewTransition(apply);
    void transition.ready.then(() => {
      const root = document.documentElement;
      // Only the incoming theme is touched; the old one sits beneath.
      const incoming = "::view-transition-new(root)";

      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${reach}px at ${x}px ${y}px)`,
          ],
        },
        { duration: REVEAL_MS, easing: "ease-out", pseudoElement: incoming },
      );

      // Separate animation: the blur outlasts the circle by a wide margin.
      root.animate(
        { filter: [`blur(${BLUR_PX}px)`, "blur(0px)"] },
        { duration: BLUR_MS, easing: "linear", pseudoElement: incoming },
      );
    });
  }

  return (
    // On a phone the content column runs full width, so these would sit on top
    // of the text. A backdrop keeps them legible; from sm up they go bare
    // again, matching the reference.
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-4 rounded-full bg-bg/85 p-2 backdrop-blur-sm sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <button
        type="button"
        onClick={() => {
          // Plays regardless of state, so switching sound ON is audible.
          void play("toggle", true);
          setSound((on) => !on);
        }}
        data-sound="control"
        aria-pressed={sound}
        aria-label={sound ? "Mute interface sounds" : "Enable interface sounds"}
        title={sound ? "Sound on" : "Sound off"}
        className="text-muted transition-colors hover:text-fg"
      >
        {sound ? <SpeakerOn /> : <SpeakerOff />}
      </button>

      <button
        type="button"
        data-sound="control"
        onClick={toggleTheme}
        aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
        title={dark ? "Light theme" : "Dark theme"}
        className="text-muted transition-colors hover:text-fg"
      >
        {dark ? <Sun /> : <Moon />}
      </button>
    </div>
  );
}

const stroke = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function SpeakerOn() {
  return (
    <svg {...stroke}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function SpeakerOff() {
  return (
    <svg {...stroke}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 6" />
      <path d="m21 9-5 6" />
    </svg>
  );
}

function Moon() {
  return (
    <svg {...stroke}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

function Sun() {
  return (
    <svg {...stroke}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

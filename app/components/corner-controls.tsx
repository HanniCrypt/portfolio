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
 * Peak gain of the interface blips. Well under 1 to leave headroom — a bare
 * sine at these levels is clean, but pushing past ~0.3 starts to sound harsh
 * on laptop speakers.
 */
const HOVER_GAIN = 0.08;
const CLICK_GAIN = 0.2;

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
 * Sound is synthesised with Web Audio rather than shipped as assets — a short
 * blip on hover of anything interactive, a lower one on click. The context is
 * created lazily on the first gesture, since browsers block it before that.
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

  const blip = useCallback(
    (frequency: number, gain: number) => {
      if (!sound) return;
      let ctx = audioRef.current;
      if (!ctx) {
        ctx = new AudioContext();
        audioRef.current = ctx;
      }
      if (ctx.state === "suspended") void ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, now);
      amp.gain.setValueAtTime(0, now);
      amp.gain.linearRampToValueAtTime(gain, now + 0.006);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(amp).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    },
    [sound],
  );

  // One delegated listener each, rather than handlers on every element.
  useEffect(() => {
    if (!sound) return;
    const interactive = "a, button, [role='button']";

    function onOver(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(interactive)) blip(1180, HOVER_GAIN);
    }
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(interactive)) blip(560, CLICK_GAIN);
    }

    document.addEventListener("pointerover", onOver);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("click", onClick);
    };
  }, [sound, blip]);

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
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setSound((on) => !on)}
        aria-pressed={sound}
        aria-label={sound ? "Mute interface sounds" : "Enable interface sounds"}
        title={sound ? "Sound on" : "Sound off"}
        className="text-muted transition-colors hover:text-fg"
      >
        {sound ? <SpeakerOn /> : <SpeakerOff />}
      </button>

      <button
        type="button"
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

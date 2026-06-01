"use client";

/**
 * Eye intro + audio consent overlay. Timeline constants: audioConsentTiming.ts
 */
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSiteAudio } from "@/hooks/useSiteAudio";
import { AUDIO_CONSENT_TIMING } from "@/lib/audioConsentTiming";
import { EYE_CONTROL_SIZE_CLASS } from "@/lib/eyeConsentLayout";
import { usePortfolioStore } from "@/lib/store";
import { EyeConsentSvg } from "./EyeConsentSvg";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AudioConsentGate() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const upperLidRef = useRef<SVGPathElement>(null);
  const lowerLidRef = useRef<SVGPathElement>(null);
  const scleraExtrasRef = useRef<SVGGElement>(null);
  const irisRef = useRef<SVGCircleElement>(null);
  const pupilRef = useRef<SVGCircleElement>(null);
  const pupilHighlightRef = useRef<SVGCircleElement>(null);
  const playRingRef = useRef<SVGCircleElement>(null);
  const playIconRef = useRef<SVGPolygonElement>(null);
  const pauseIconRef = useRef<SVGGElement>(null);
  const iconGroupRef = useRef<SVGGElement>(null);

  const timelineCompleteRef = useRef(false);
  const dismissStartedRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [visible, setVisible] = useState(true);
  const [interactive, setInteractive] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [reducedMotion] = useState(prefersReducedMotion);

  const sceneBootstrapped = usePortfolioStore((s) => s.sceneBootstrapped);
  const {
    soundEnabled,
    setSoundEnabled,
    unlockFromGesture,
    playConsentSting,
    startAmbientIfEnabled,
    stopAmbient,
  } = useSiteAudio();

  const eyeRefs = {
    upperLid: upperLidRef,
    lowerLid: lowerLidRef,
    scleraExtras: scleraExtrasRef,
    iris: irisRef,
    pupil: pupilRef,
    pupilHighlight: pupilHighlightRef,
    playRing: playRingRef,
    playIcon: playIconRef,
    pauseIcon: pauseIconRef,
    iconGroup: iconGroupRef,
  };

  const syncPlayPauseIcons = useCallback((enabled: boolean) => {
    const play = playIconRef.current;
    const pause = pauseIconRef.current;
    if (!play || !pause) return;
    gsap.set(play, { opacity: enabled ? 0 : 1 });
    gsap.set(pause, { opacity: enabled ? 1 : 0 });
  }, []);

  const pulseControl = useCallback(() => {
    const btn = controlRef.current;
    if (!btn) return;
    gsap.fromTo(
      btn,
      { scale: 1 },
      {
        scale: 1.08,
        duration: 0.08,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
        transformOrigin: "center center",
      },
    );
  }, []);

  const runDismissFade = useCallback(() => {
    if (dismissStartedRef.current) return;
    dismissStartedRef.current = true;
    setDismissing(true);
    setInteractive(false);

    const overlay = overlayRef.current;
    if (!overlay) {
      setVisible(false);
      startAmbientIfEnabled();
      return;
    }

    overlay.style.pointerEvents = "none";

    gsap.to(overlay, {
      opacity: 0,
      duration: AUDIO_CONSENT_TIMING.overlayFade,
      ease: "power2.inOut",
      onComplete: () => {
        setVisible(false);
        startAmbientIfEnabled();
      },
    });
  }, [startAmbientIfEnabled]);

  const tryDismissRef = useRef(() => {});

  const tryDismiss = useCallback(() => {
    if (
      !timelineCompleteRef.current ||
      !usePortfolioStore.getState().sceneBootstrapped ||
      dismissStartedRef.current
    ) {
      return;
    }
    runDismissFade();
  }, [runDismissFade]);

  tryDismissRef.current = tryDismiss;

  useEffect(() => {
    tryDismissRef.current();
  }, [sceneBootstrapped]);

  useEffect(() => {
    const t = AUDIO_CONSENT_TIMING;

    const upper = upperLidRef.current;
    const lower = lowerLidRef.current;
    const sclera = scleraExtrasRef.current;
    const iris = irisRef.current;
    const pupil = pupilRef.current;
    const highlight = pupilHighlightRef.current;
    const ring = playRingRef.current;
    const play = playIconRef.current;

    if (!upper || !lower || !iris || !pupil || !ring || !play) return;

    gsap.set(ring, { opacity: 0 });
    gsap.set(play, { opacity: 0 });
    syncPlayPauseIcons(false);

    const tl = gsap.timeline({
      onComplete: () => {
        timelineCompleteRef.current = true;
        tryDismissRef.current();
      },
    });
    timelineRef.current = tl;

    if (reducedMotion) {
      gsap.set([upper, lower, sclera], { opacity: 0 });
      gsap.set(highlight, { opacity: 0 });
      gsap.set(pupil, { opacity: 0 });
      gsap.set(iris, {
        fill: "transparent",
        stroke: "rgba(165, 243, 252, 0.85)",
        strokeWidth: 2,
      });
      gsap.set(ring, { opacity: 1 });
      gsap.set(play, { opacity: 1 });

      tl.call(() => setInteractive(true), [], 0);
      tl.to({}, { duration: t.reducedMotionHold });
    } else {
      tl.to(upper, { y: -38, duration: t.lidOpen, ease: "power2.inOut" }, 0);
      tl.to(lower, { y: 38, duration: t.lidOpen, ease: "power2.inOut" }, 0);

      tl.to(
        [upper, lower, sclera],
        { opacity: 0, duration: t.isolateEye, ease: "power2.inOut" },
        t.lidOpen,
      );

      const morphStart = t.lidOpen + t.isolateEye;
      tl.to(
        highlight,
        { opacity: 0, duration: t.morphToPlay * 0.5, ease: "power2.inOut" },
        morphStart,
      );
      tl.to(
        pupil,
        { opacity: 0, duration: t.morphToPlay * 0.6, ease: "power2.inOut" },
        morphStart,
      );
      tl.to(
        iris,
        {
          fill: "transparent",
          stroke: "rgba(165, 243, 252, 0.85)",
          strokeWidth: 2,
          duration: t.morphToPlay,
          ease: "power2.inOut",
        },
        morphStart,
      );
      tl.to(
        ring,
        { opacity: 1, duration: t.morphToPlay, ease: "power2.inOut" },
        morphStart,
      );
      tl.to(
        play,
        { opacity: 1, duration: t.morphToPlay * 0.7, ease: "power2.inOut" },
        morphStart + t.morphToPlay * 0.25,
      );

      const morphEnd = morphStart + t.morphToPlay;
      tl.call(() => setInteractive(true), [], morphEnd);
      tl.to({}, { duration: t.hold }, morphEnd);
    }

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, [reducedMotion, syncPlayPauseIcons]);

  useEffect(() => {
    syncPlayPauseIcons(soundEnabled);
  }, [soundEnabled, syncPlayPauseIcons]);

  const handleControlClick = useCallback(() => {
    if (!interactive || dismissing) return;

    const next = !soundEnabled;
    setSoundEnabled(next);
    pulseControl();
    syncPlayPauseIcons(next);

    if (next) {
      unlockFromGesture();
      playConsentSting();
    } else {
      stopAmbient();
    }
  }, [
    interactive,
    dismissing,
    soundEnabled,
    setSoundEnabled,
    pulseControl,
    syncPlayPauseIcons,
    unlockFromGesture,
    playConsentSting,
    stopAmbient,
  ]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 grid place-items-center bg-[#030508]"
      role="dialog"
      aria-label="Enable site audio"
      aria-modal="true"
    >
      <button
        ref={controlRef}
        type="button"
        className={`${EYE_CONTROL_SIZE_CLASS} flex items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:cursor-default`}
        onClick={handleControlClick}
        disabled={!interactive || dismissing}
        aria-label={
          soundEnabled
            ? "Sound on. Tap to mute."
            : "Enable sound. Tap to play."
        }
        aria-pressed={soundEnabled}
      >
        <EyeConsentSvg refs={eyeRefs} />
      </button>
    </div>
  );
}

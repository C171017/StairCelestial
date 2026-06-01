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
import { EYE_LID_PATHS, EyeConsentSvg } from "./EyeConsentSvg";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AudioConsentGate() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const eyeApertureRef = useRef<SVGPathElement>(null);
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
  const soundEnabledRef = useRef(false);

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

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const eyeRefs = {
    eyeAperture: eyeApertureRef,
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
    timelineCompleteRef.current = false;

    const control = controlRef.current;
    const aperture = eyeApertureRef.current;
    const upper = upperLidRef.current;
    const lower = lowerLidRef.current;
    const sclera = scleraExtrasRef.current;
    const iris = irisRef.current;
    const pupil = pupilRef.current;
    const highlight = pupilHighlightRef.current;
    const ring = playRingRef.current;
    const play = playIconRef.current;

    if (
      !control ||
      !aperture ||
      !upper ||
      !lower ||
      !iris ||
      !pupil ||
      !ring ||
      !play
    ) {
      return;
    }

    gsap.set(control, {
      opacity: 0,
      scale: 0.985,
      transformOrigin: "center center",
    });
    gsap.set(aperture, {
      attr: { d: EYE_LID_PATHS.apertureClosed },
    });
    gsap.set(upper, {
      attr: { d: EYE_LID_PATHS.upperClosed },
      opacity: 0,
      y: 0,
    });
    gsap.set(lower, {
      attr: { d: EYE_LID_PATHS.lowerClosed },
      opacity: 0,
      y: 0,
    });
    gsap.set(sclera, { opacity: 0 });
    gsap.set([iris, pupil, highlight], { opacity: 1 });
    gsap.set(ring, { opacity: 0 });
    gsap.set(play, { opacity: 0 });
    gsap.set(pauseIconRef.current, { opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        timelineCompleteRef.current = true;
        tryDismissRef.current();
      },
    });
    timelineRef.current = tl;

    if (reducedMotion) {
      gsap.set(control, { opacity: 1, scale: 1 });
      gsap.set([upper, lower, sclera, iris, pupil, highlight], { opacity: 0 });
      gsap.set(ring, { opacity: 1 });

      tl.call(() => {
        timelineCompleteRef.current = true;
        syncPlayPauseIcons(soundEnabledRef.current);
        setInteractive(true);
      }, [], 0);
      tl.to({}, { duration: t.reducedMotionHold });
    } else {
      tl.to(
        control,
        {
          opacity: 1,
          scale: 1,
          duration: t.revealClosedEye,
          ease: "power1.out",
        },
        t.blackHold,
      );

      const openStart = t.blackHold + t.revealClosedEye + t.closedEyeHold;
      tl.to(
        [upper, lower],
        {
          opacity: 1,
          duration: t.revealClosedEye,
          ease: "power1.out",
        },
        t.blackHold,
      );
      tl.to(
        aperture,
        {
          attr: { d: EYE_LID_PATHS.apertureOpen },
          duration: t.lidOpen,
          ease: "power3.inOut",
        },
        openStart,
      );
      tl.to(
        upper,
        {
          attr: { d: EYE_LID_PATHS.upperOpen },
          duration: t.lidOpen,
          ease: "power3.inOut",
        },
        openStart,
      );
      tl.to(
        lower,
        {
          attr: { d: EYE_LID_PATHS.lowerOpen },
          duration: t.lidOpen,
          ease: "power3.inOut",
        },
        openStart,
      );
      tl.to(
        sclera,
        { opacity: 1, duration: t.lidOpen * 0.6, ease: "power2.out" },
        openStart + t.lidOpen * 0.22,
      );

      const isolateStart = openStart + t.lidOpen + t.openEyeHold;
      tl.to(
        [upper, lower, sclera],
        { opacity: 0, duration: t.isolateEye, ease: "power2.inOut" },
        isolateStart,
      );

      const morphStart = isolateStart + t.isolateEye * 0.45;
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
        { opacity: 0, duration: t.morphToPlay, ease: "power2.inOut" },
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
      tl.call(() => {
        syncPlayPauseIcons(soundEnabledRef.current);
        setInteractive(true);
      }, [], morphEnd);
      tl.to({}, { duration: t.hold }, morphEnd);
    }

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, [reducedMotion, syncPlayPauseIcons]);

  useEffect(() => {
    if (!timelineCompleteRef.current) return;
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
        className={`${EYE_CONTROL_SIZE_CLASS} flex items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-100/60 disabled:cursor-default`}
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

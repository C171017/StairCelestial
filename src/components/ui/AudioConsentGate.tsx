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

  const dismissStartedRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const transitionStartedRef = useRef(false);
  const waitingMainRevealDurationRef = useRef<number | null>(null);
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
  const startAmbientIfEnabledRef = useRef(startAmbientIfEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    startAmbientIfEnabledRef.current = startAmbientIfEnabled;
  }, [startAmbientIfEnabled]);

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

  const setIntroReveal = useCallback(
    (reveal: {
      introMainOpacity?: number;
      introShootingStarIntensity?: number;
      introStarsOpacity?: number;
    }) => {
      usePortfolioStore.getState().setIntroReveal(reveal);
    },
    [],
  );

  const completeIntro = useCallback(() => {
    setIntroReveal({
      introMainOpacity: 1,
      introShootingStarIntensity: 1,
      introStarsOpacity: 1,
    });
    setVisible(false);
    startAmbientIfEnabledRef.current();
  }, [setIntroReveal]);

  const revealMainAndFinish = useCallback(
    (duration: number) => {
      waitingMainRevealDurationRef.current = null;

      const overlay = overlayRef.current;
      if (overlay) {
        overlay.style.pointerEvents = "none";
        gsap.to(overlay, {
          opacity: 0,
          duration,
          ease: "sine.inOut",
          overwrite: true,
        });
      }

      const revealState = {
        main: usePortfolioStore.getState().introMainOpacity,
      };

      gsap.to(revealState, {
        main: 1,
        duration,
        ease: "sine.inOut",
        onUpdate: () => {
          setIntroReveal({ introMainOpacity: revealState.main });
        },
        onComplete: completeIntro,
      });
    },
    [completeIntro, setIntroReveal],
  );

  const requestMainReveal = useCallback(
    (duration: number) => {
      if (!usePortfolioStore.getState().sceneBootstrapped) {
        waitingMainRevealDurationRef.current = duration;
        return;
      }

      revealMainAndFinish(duration);
    },
    [revealMainAndFinish],
  );

  useEffect(() => {
    const duration = waitingMainRevealDurationRef.current;
    if (!sceneBootstrapped || duration === null) return;
    revealMainAndFinish(duration);
  }, [revealMainAndFinish, sceneBootstrapped]);

  const startPlayToSceneTransition = useCallback(() => {
    if (transitionStartedRef.current || dismissStartedRef.current) return;
    transitionStartedRef.current = true;

    const t = AUDIO_CONSENT_TIMING;
    const overlay = overlayRef.current;
    const control = controlRef.current;
    const currentReveal = usePortfolioStore.getState();
    const revealState = {
      shooting: currentReveal.introShootingStarIntensity,
      stars: currentReveal.introStarsOpacity,
    };

    const tl = gsap.timeline();
    transitionTimelineRef.current = tl;

    tl.call(
      () => {
        setDismissing(true);
        setInteractive(false);
        requestMainReveal(t.mainReveal);
      },
      [],
      t.starCrossfade + t.starOnlyHold,
    );

    tl.to(
      revealState,
      {
        stars: 1,
        shooting: 1,
        duration: t.starCrossfade,
        ease: "sine.inOut",
        onUpdate: () => {
          setIntroReveal({
            introShootingStarIntensity: revealState.shooting,
            introStarsOpacity: revealState.stars,
          });
        },
      },
      0,
    );

    if (overlay) {
      tl.to(
        overlay,
        {
          backgroundColor: "rgba(3, 5, 8, 0)",
          duration: t.starCrossfade,
          ease: "sine.inOut",
        },
        0,
      );
    }

    if (control) {
      tl.to(
        control,
        {
          opacity: 0,
          scale: 0.98,
          duration: t.starCrossfade,
          ease: "sine.inOut",
        },
        0.08,
      );
    }
  }, [requestMainReveal, setIntroReveal]);

  const startClickedTransition = useCallback(() => {
    if (dismissStartedRef.current) return;
    dismissStartedRef.current = true;
    setDismissing(true);
    setInteractive(false);

    transitionTimelineRef.current?.kill();

    const t = AUDIO_CONSENT_TIMING;
    const overlay = overlayRef.current;
    const control = controlRef.current;
    const currentReveal = usePortfolioStore.getState();
    const revealState = {
      shooting: Math.max(currentReveal.introShootingStarIntensity, 0.35),
      stars: currentReveal.introStarsOpacity,
    };

    const tl = gsap.timeline({
      onComplete: () => {
        requestMainReveal(t.clickedMainReveal);
      },
    });
    transitionTimelineRef.current = tl;

    if (control) {
      gsap.killTweensOf(control);
      tl.fromTo(
        control,
        {
          scale: 1.08,
        },
        {
          opacity: 0,
          scale: 0.92,
          duration: t.clickedStarCrossfade,
          ease: "sine.inOut",
        },
        0,
      );
    }

    if (overlay) {
      tl.to(
        overlay,
        {
          backgroundColor: "rgba(3, 5, 8, 0)",
          duration: t.clickedStarCrossfade,
          ease: "sine.inOut",
        },
        0,
      );
    }

    tl.to(
      revealState,
      {
        stars: 1,
        shooting: 1,
        duration: t.clickedStarCrossfade,
        ease: "sine.inOut",
        onUpdate: () => {
          setIntroReveal({
            introShootingStarIntensity: revealState.shooting,
            introStarsOpacity: revealState.stars,
          });
        },
      },
      0,
    );
  }, [requestMainReveal, setIntroReveal]);

  useEffect(() => {
    const t = AUDIO_CONSENT_TIMING;
    dismissStartedRef.current = false;
    transitionStartedRef.current = false;
    waitingMainRevealDurationRef.current = null;
    setDismissing(false);
    setInteractive(false);
    setIntroReveal({
      introMainOpacity: 0,
      introShootingStarIntensity: 0,
      introStarsOpacity: 0,
    });

    const control = controlRef.current;
    const overlay = overlayRef.current;
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

    if (overlay) {
      gsap.set(overlay, {
        backgroundColor: "#030508",
        opacity: 1,
      });
      overlay.style.pointerEvents = "auto";
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

    const tl = gsap.timeline();
    timelineRef.current = tl;

    if (reducedMotion) {
      gsap.set(control, { opacity: 1, scale: 1 });
      gsap.set([upper, lower, sclera, iris, pupil, highlight], { opacity: 0 });
      gsap.set(ring, { opacity: 1 });

      tl.call(() => {
        setIntroReveal({
          introMainOpacity: 1,
          introShootingStarIntensity: 1,
          introStarsOpacity: 1,
        });
        syncPlayPauseIcons(soundEnabledRef.current);
        setInteractive(true);
      }, [], 0);
      tl.to(
        control,
        {
          opacity: 0,
          duration: t.reducedMotionHold,
          ease: "power1.out",
        },
        0.1,
      );
      tl.call(() => {
        setDismissing(true);
        setInteractive(false);
        requestMainReveal(t.mainReveal);
      }, [], t.reducedMotionHold);
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
        startPlayToSceneTransition();
      }, [], morphEnd);
    }

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      transitionTimelineRef.current?.kill();
      transitionTimelineRef.current = null;
    };
  }, [
    reducedMotion,
    requestMainReveal,
    setIntroReveal,
    startPlayToSceneTransition,
    syncPlayPauseIcons,
  ]);

  useEffect(() => {
    if (!interactive) return;
    syncPlayPauseIcons(soundEnabled);
  }, [interactive, soundEnabled, syncPlayPauseIcons]);

  const handleControlClick = useCallback(() => {
    if (!interactive || dismissing) return;

    const next = !soundEnabled;
    setSoundEnabled(next);
    syncPlayPauseIcons(next);

    if (next) {
      unlockFromGesture();
      playConsentSting();
    } else {
      stopAmbient();
    }

    startClickedTransition();
  }, [
    interactive,
    dismissing,
    soundEnabled,
    setSoundEnabled,
    syncPlayPauseIcons,
    unlockFromGesture,
    playConsentSting,
    stopAmbient,
    startClickedTransition,
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

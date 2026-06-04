"use client";

/**
 * Eye intro + audio consent overlay. Timeline constants: audioConsentTiming.ts
 */
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSiteAudio } from "@/hooks/useSiteAudio";
import {
  AUDIO_CONSENT_TIMING,
  getLidOpenStart,
  getStarRevealStart,
} from "@/lib/audioConsentTiming";
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
  const eyeInteriorRef = useRef<SVGGElement>(null);
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
  const starRevealDoneRef = useRef(false);
  const runStarRevealRef = useRef<(() => void) | null>(null);

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
    eyeInterior: eyeInteriorRef,
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

  useEffect(() => {
    if (!sceneBootstrapped) return;
    runStarRevealRef.current?.();
  }, [sceneBootstrapped]);

  const startPlayToSceneTransition = useCallback(() => {
    if (transitionStartedRef.current || dismissStartedRef.current) return;
    transitionStartedRef.current = true;

    const t = AUDIO_CONSENT_TIMING;
    const control = controlRef.current;
    const overlay = overlayRef.current;
    const crossfade = {
      main: usePortfolioStore.getState().introMainOpacity,
      control: 1,
      overlay: 1,
    };

    const tl = gsap.timeline({
      onComplete: () => {
        setDismissing(true);
        setInteractive(false);
        if (overlay) {
          overlay.style.pointerEvents = "none";
        }
        completeIntro();
      },
    });
    transitionTimelineRef.current = tl;

    tl.to(
      crossfade,
      {
        main: 1,
        control: 0,
        overlay: 0,
        duration: t.playSceneCrossfade,
        ease: "sine.inOut",
        onUpdate: () => {
          setIntroReveal({ introMainOpacity: crossfade.main });
          if (control) {
            gsap.set(control, {
              opacity: crossfade.control,
              scale: 0.96 + crossfade.control * 0.04,
            });
          }
          if (overlay) {
            gsap.set(overlay, { opacity: crossfade.overlay });
          }
        },
      },
      0,
    );
  }, [completeIntro, setIntroReveal]);

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
    const currentMain = currentReveal.introMainOpacity;
    const crossfade = {
      main: currentMain,
      control: control ? (gsap.getProperty(control, "opacity") as number) : 0,
      overlay: overlay ? (gsap.getProperty(overlay, "opacity") as number) : 0,
      shooting: Math.max(currentReveal.introShootingStarIntensity, 0.35),
      stars: currentReveal.introStarsOpacity,
    };

    const tl = gsap.timeline({
      onComplete: () => {
        if (overlay) {
          overlay.style.pointerEvents = "none";
        }
        completeIntro();
      },
    });
    transitionTimelineRef.current = tl;

    if (control) {
      gsap.killTweensOf(control);
    }

    tl.to(
      crossfade,
      {
        main: 1,
        control: 0,
        overlay: 0,
        shooting: 1,
        stars: 1,
        duration: t.clickedSceneCrossfade,
        ease: "sine.inOut",
        onUpdate: () => {
          setIntroReveal({
            introMainOpacity: crossfade.main,
            introShootingStarIntensity: crossfade.shooting,
            introStarsOpacity: crossfade.stars,
          });
          if (control) {
            gsap.set(control, {
              opacity: crossfade.control,
              scale: 0.92 + crossfade.control * 0.16,
            });
          }
          if (overlay) {
            gsap.set(overlay, {
              opacity: crossfade.overlay,
              backgroundColor: "rgba(3, 5, 8, 0)",
            });
          }
        },
      },
      0,
    );
  }, [completeIntro, setIntroReveal]);

  useEffect(() => {
    const t = AUDIO_CONSENT_TIMING;
    const store = usePortfolioStore.getState();
    if (store.introEpochMs === null) {
      store.setIntroEpochMs(performance.now());
    }

    dismissStartedRef.current = false;
    transitionStartedRef.current = false;
    waitingMainRevealDurationRef.current = null;
    starRevealDoneRef.current = false;
    runStarRevealRef.current = null;
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
    const eyeInterior = eyeInteriorRef.current;
    const upper = upperLidRef.current;
    const lower = lowerLidRef.current;
    const sclera = scleraExtrasRef.current;
    const iris = irisRef.current;
    const pupil = pupilRef.current;
    const highlight = pupilHighlightRef.current;
    const ring = playRingRef.current;
    const play = playIconRef.current;
    const iconGroup = iconGroupRef.current;

    if (
      !control ||
      !aperture ||
      !eyeInterior ||
      !upper ||
      !lower ||
      !iris ||
      !pupil ||
      !ring ||
      !play ||
      !iconGroup
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
    gsap.set(eyeInterior, { opacity: 1 });
    gsap.set([iris, pupil, highlight], { opacity: 1 });
    gsap.set(ring, { opacity: 0 });
    gsap.set(iconGroup, { opacity: 0 });
    gsap.set(play, { opacity: 0 });
    gsap.set(pauseIconRef.current, { opacity: 0 });

    const tl = gsap.timeline();
    timelineRef.current = tl;
    const revealState = {
      shooting: 0,
      stars: 0,
    };

    const runStarReveal = () => {
      if (starRevealDoneRef.current) return;
      if (!usePortfolioStore.getState().sceneBootstrapped) return;

      starRevealDoneRef.current = true;
      gsap.killTweensOf(revealState);
      gsap.to(revealState, {
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
      });
      if (overlay) {
        gsap.to(overlay, {
          backgroundColor: "rgba(3, 5, 8, 0)",
          duration: t.starCrossfade,
          ease: "sine.inOut",
        });
      }
    };

    if (reducedMotion) {
      runStarRevealRef.current = () => {
        if (starRevealDoneRef.current) return;
        if (!usePortfolioStore.getState().sceneBootstrapped) return;
        starRevealDoneRef.current = true;
        setIntroReveal({
          introMainOpacity: 1,
          introShootingStarIntensity: 1,
          introStarsOpacity: 1,
        });
        if (overlay) {
          gsap.set(overlay, { backgroundColor: "rgba(3, 5, 8, 0)" });
        }
      };

      gsap.set(control, { opacity: 1, scale: 1 });
      gsap.set([upper, lower, sclera, eyeInterior], { opacity: 0 });
      gsap.set([ring, iconGroup], { opacity: 1 });

      tl.call(() => {
        runStarRevealRef.current?.();
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
      runStarRevealRef.current = runStarReveal;

      const openStart = getLidOpenStart(t);
      const starRevealStart = getStarRevealStart(t);

      tl.to(
        control,
        {
          opacity: 1,
          scale: 1,
          duration: t.revealClosedEye,
          ease: "sine.inOut",
        },
        t.blackHold,
      );
      tl.to(
        [upper, lower],
        {
          opacity: 1,
          duration: t.revealClosedEye,
          ease: "sine.inOut",
        },
        t.blackHold,
      );
      tl.to(
        aperture,
        {
          attr: { d: EYE_LID_PATHS.apertureOpen },
          duration: t.lidOpen,
          ease: "power2.inOut",
        },
        openStart,
      );
      tl.to(
        upper,
        {
          attr: { d: EYE_LID_PATHS.upperOpen },
          duration: t.lidOpen,
          ease: "power2.inOut",
        },
        openStart,
      );
      tl.to(
        lower,
        {
          attr: { d: EYE_LID_PATHS.lowerOpen },
          duration: t.lidOpen,
          ease: "power2.inOut",
        },
        openStart,
      );
      tl.to(
        sclera,
        { opacity: 1, duration: t.lidOpen * 0.6, ease: "power2.out" },
        openStart + t.lidOpen * 0.22,
      );

      tl.call(runStarReveal, [], starRevealStart);

      const vanishStart = starRevealStart + t.openEyeHold;
      const eyeArtwork = [upper, lower, sclera, eyeInterior, iris, pupil, highlight];

      const playRevealStart = vanishStart + t.playControlRevealDelay;

      tl.to(
        eyeArtwork,
        {
          opacity: 0,
          duration: t.eyeVanishAfterOpen,
          ease: "sine.inOut",
        },
        vanishStart,
      );
      tl.to(
        ring,
        {
          opacity: 0.85,
          duration: t.playControlReveal,
          ease: "sine.inOut",
        },
        playRevealStart,
      );
      tl.to(
        iconGroup,
        {
          opacity: 1,
          duration: t.playControlReveal * 0.75,
          ease: "sine.inOut",
        },
        playRevealStart,
      );
      tl.to(
        play,
        {
          opacity: 1,
          duration: t.playControlReveal * 0.7,
          ease: "sine.inOut",
        },
        playRevealStart + t.playControlReveal * 0.1,
      );

      const playPhaseEnd =
        playRevealStart +
        Math.max(
          t.eyeVanishAfterOpen - t.playControlRevealDelay,
          t.playControlReveal,
        );
      tl.call(() => {
        syncPlayPauseIcons(soundEnabledRef.current);
        setInteractive(true);
        startPlayToSceneTransition();
      }, [], playPhaseEnd);
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

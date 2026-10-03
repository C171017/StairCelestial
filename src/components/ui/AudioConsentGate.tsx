"use client";

/**
 * Eye intro overlay (SVG). 3D play control + enter transition live in PlayControl3D.
 */
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  AUDIO_CONSENT_TIMING,
  getLidOpenStart,
  getStarRevealStart,
} from "@/lib/audioConsentTiming";
import {
  getDynamicViewportSize,
  getEyeControlSidePx,
} from "@/lib/eyeControlMetrics";
import { CONTROL_EYE_DISSOLVE_SECONDS } from "@/lib/controlEntrance";
import { EYE_CONTROL_SIZE_CLASS } from "@/lib/eyeConsentLayout";
import { usePortfolioStore } from "@/lib/store";
import { EYE_LID_PATHS, EyeConsentSvg } from "./EyeConsentSvg";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AudioConsentGate({ theme = "original" }: { theme?: "original" | "cloud" }) {
  const backdrop = theme === "cloud" ? "#edf3f5" : "#030508";
  const clearBackdrop = theme === "cloud" ? "rgba(237, 243, 245, 0)" : "rgba(3, 5, 8, 0)";
  const overlayRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const eyeApertureRef = useRef<SVGPathElement>(null);
  const dissolveWarpRef = useRef<SVGFEDisplacementMapElement>(null);
  const dissolveBlurRef = useRef<SVGFEGaussianBlurElement>(null);
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

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const starRevealDoneRef = useRef(false);
  const runStarRevealRef = useRef<(() => void) | null>(null);

  const [visible, setVisible] = useState(true);
  const [reducedMotion] = useState(prefersReducedMotion);
  const introPlayPhase = usePortfolioStore((s) => s.introPlayPhase);

  const sceneBootstrapped = usePortfolioStore((s) => s.sceneBootstrapped);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const viewport = window.visualViewport;
    const syncControlSide = () => {
      const { width, height } = getDynamicViewportSize(
        window.innerWidth,
        window.innerHeight,
      );
      root.style.setProperty(
        "--eye-control-side",
        `${getEyeControlSidePx(width, height)}px`,
      );
    };

    syncControlSide();
    window.addEventListener("resize", syncControlSide);
    viewport?.addEventListener("resize", syncControlSide);
    viewport?.addEventListener("scroll", syncControlSide);

    return () => {
      window.removeEventListener("resize", syncControlSide);
      viewport?.removeEventListener("resize", syncControlSide);
      viewport?.removeEventListener("scroll", syncControlSide);
    };
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
  }, [setIntroReveal]);

  const showPlayControl = useCallback(() => {
    usePortfolioStore.getState().setIntroPlayPhase("awaitClick");
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.style.pointerEvents = "none";
    }
  }, []);

  const finishPlayControlHandoff = useCallback(() => {
    const overlay = overlayRef.current;
    const control = controlRef.current;

    if (control) {
      gsap.set(control, { opacity: 0 });
    }
    if (overlay) {
      overlay.style.pointerEvents = "none";
    }
  }, []);

  useEffect(() => {
    if (introPlayPhase !== "active") return;
    const overlay = overlayRef.current;
    if (overlay) {
      gsap.to(overlay, {
        opacity: 0,
        duration: AUDIO_CONSENT_TIMING.overlayFade,
        ease: "sine.inOut",
      });
    }
    completeIntro();
  }, [introPlayPhase, completeIntro]);

  useEffect(() => {
    if (!sceneBootstrapped) return;
    runStarRevealRef.current?.();
  }, [sceneBootstrapped]);

  useEffect(() => {
    // Start the handoff only when its 3D counterpart is ready to render.
    if (!sceneBootstrapped) return;
    const t = AUDIO_CONSENT_TIMING;
    const store = usePortfolioStore.getState();
    // Effect replay must not restart an entrance whose DOM handoff has already
    // completed. The active overlay has no DOM refs and cannot restart safely.
    if (store.introPlayPhase !== "hidden") {
      finishPlayControlHandoff();
      if (overlayRef.current) gsap.set(overlayRef.current, { backgroundColor: clearBackdrop });
      if (store.introPlayPhase === "active") completeIntro();
      return;
    }
    if (store.introEpochMs === null) {
      store.setIntroEpochMs(performance.now());
    }

    starRevealDoneRef.current = false;
    runStarRevealRef.current = null;
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

    if (
      !control ||
      !aperture ||
      !eyeInterior ||
      !upper ||
      !lower ||
      !iris ||
      !pupil
    ) {
      return;
    }

    if (overlay) {
      gsap.set(overlay, {
        backgroundColor: backdrop,
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
    gsap.set(dissolveWarpRef.current, { attr: { scale: 0 } });
    gsap.set(dissolveBlurRef.current, { attr: { stdDeviation: 0 } });
    gsap.set(eyeInterior, { opacity: 1 });
    gsap.set([iris, pupil, highlight], { opacity: 1 });

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
          backgroundColor: clearBackdrop,
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
          introShootingStarIntensity: 1,
          introStarsOpacity: 1,
        });
        if (overlay) {
          gsap.set(overlay, { backgroundColor: clearBackdrop });
        }
      };

      gsap.set([upper, lower, sclera, eyeInterior], { opacity: 0 });

      tl.call(() => {
        runStarRevealRef.current?.();
        showPlayControl();
        finishPlayControlHandoff();
      }, [], 0);
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
      const eyeArtwork = [upper, lower, sclera, eyeInterior];
      const dissolveDuration = theme === "cloud" ? CONTROL_EYE_DISSOLVE_SECONDS : t.eyeVanishAfterOpen;
      if (theme === "cloud") {
        tl.to(dissolveWarpRef.current, { attr: { scale: 9 }, duration: dissolveDuration, ease: "sine.in" }, vanishStart);
        tl.to(dissolveBlurRef.current, { attr: { stdDeviation: 1.1 }, duration: dissolveDuration, ease: "sine.in" }, vanishStart);
        tl.to(control, { scale: 1.025, duration: dissolveDuration, ease: "sine.inOut" }, vanishStart);
      }

      tl.to(
        eyeArtwork,
        {
          opacity: 0,
          duration: dissolveDuration,
          ease: "sine.inOut",
        },
        vanishStart,
      );

      const handoffAt = vanishStart + dissolveDuration;
      tl.call(showPlayControl, [], vanishStart);
      tl.call(finishPlayControlHandoff, [], handoffAt);
      tl.set(control, { opacity: 0 }, handoffAt);
    }

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      gsap.killTweensOf(revealState);
      if (overlay) gsap.killTweensOf(overlay);
    };
  }, [backdrop, clearBackdrop, completeIntro, finishPlayControlHandoff, reducedMotion, sceneBootstrapped, showPlayControl, setIntroReveal, theme]);

  if (!visible) return null;

  const eyeRefs = {
    eyeAperture: eyeApertureRef,
    dissolveWarp: dissolveWarpRef,
    dissolveBlur: dissolveBlurRef,
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

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 grid h-dvh w-dvw place-items-center"
      data-eye-theme={theme}
      style={{ backgroundColor: backdrop }}
      role="dialog"
      aria-label="Site intro"
      aria-modal={introPlayPhase !== "active"}
    >
      <div
        ref={controlRef}
        className={`${EYE_CONTROL_SIZE_CLASS} flex items-center justify-center pointer-events-none`}
        style={{ filter: theme === "cloud" ? "invert(1) hue-rotate(180deg) saturate(.35)" : undefined }}
        aria-hidden
      >
        <EyeConsentSvg refs={eyeRefs} />
      </div>
    </div>
  );
}

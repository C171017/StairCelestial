"use client";

/** The SVG loading eye starts before the dynamically loaded 3D scene. */
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AUDIO_CONSENT_TIMING } from "@/lib/audioConsentTiming";
import { getDynamicViewportSize, getEyeControlSidePx } from "@/lib/eyeControlMetrics";
import { CONTROL_EYE_DISSOLVE_SECONDS } from "@/lib/controlEntrance";
import { EYE_CONTROL_SIZE_CLASS } from "@/lib/eyeConsentLayout";
import { createIntroEyeReadiness } from "@/lib/introEyeReadiness";
import { usePortfolioStore } from "@/lib/store";
import { EYE_LID_PATHS, EyeConsentSvg } from "./EyeConsentSvg";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AudioConsentGate({ theme = "original", loadingFailed = false }: {
  theme?: "original" | "cloud";
  loadingFailed?: boolean;
}) {
  const backdrop = theme === "cloud" ? "#edf3f5" : "#030508";
  const clearBackdrop = theme === "cloud" ? "rgba(237, 243, 245, 0)" : "rgba(3, 5, 8, 0)";
  const overlayRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const eyeApertureRef = useRef<SVGPathElement>(null);
  const eyeInteriorRef = useRef<SVGGElement>(null);
  const upperLidRef = useRef<SVGPathElement>(null);
  const lowerLidRef = useRef<SVGPathElement>(null);
  const scleraExtrasRef = useRef<SVGGElement>(null);
  const irisRef = useRef<SVGCircleElement>(null);
  const pupilRef = useRef<SVGCircleElement>(null);
  const playRingRef = useRef<SVGCircleElement>(null);
  const playIconRef = useRef<SVGPolygonElement>(null);
  const pauseIconRef = useRef<SVGGElement>(null);
  const iconGroupRef = useRef<SVGGElement>(null);
  const [reducedMotion] = useState(prefersReducedMotion);
  const introPlayPhase = usePortfolioStore((s) => s.introPlayPhase);
  const sceneBootstrapped = usePortfolioStore((s) => s.sceneBootstrapped);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    const syncControlSide = () => {
      const { width, height } = getDynamicViewportSize(window.innerWidth, window.innerHeight);
      root.style.setProperty("--eye-control-side", `${getEyeControlSidePx(width, height)}px`);
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

  useEffect(() => {
    if (introPlayPhase !== "active") return;
    usePortfolioStore.getState().setIntroReveal({
      introMainOpacity: 1,
      introShootingStarIntensity: 1,
      introStarsOpacity: 1,
    });
  }, [introPlayPhase]);

  useEffect(() => {
    if (loadingFailed) return;
    const overlay = overlayRef.current;
    const control = controlRef.current;
    const aperture = eyeApertureRef.current;
    const eyeInterior = eyeInteriorRef.current;
    const upper = upperLidRef.current;
    const lower = lowerLidRef.current;
    const sclera = scleraExtrasRef.current;
    if (!overlay || !control || !aperture || !eyeInterior || !upper || !lower || !sclera) return;

    const store = usePortfolioStore.getState();
    // Strict Mode and Fast Refresh must preserve an already completed handoff.
    if (store.introPlayPhase !== "hidden") {
      gsap.set(control, { opacity: 0 });
      gsap.set(overlay, { backgroundColor: clearBackdrop });
      overlay.style.pointerEvents = "none";
      return;
    }

    const t = AUDIO_CONSENT_TIMING;
    const eyeArtwork = [upper, lower, sclera, eyeInterior];
    const revealState = { stars: 0, shooting: 0 };
    let openingTimeline: gsap.core.Timeline | null = null;
    let blinkTimeline: gsap.core.Timeline | null = null;
    let blinkTimer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe = () => {};
    gsap.set(overlay, { backgroundColor: backdrop, opacity: 1 });
    overlay.style.pointerEvents = "auto";
    gsap.set(control, { opacity: 1, scale: 1, transformOrigin: "center center" });
    gsap.set(aperture, { attr: { d: EYE_LID_PATHS.apertureClosed } });
    gsap.set(upper, { attr: { d: EYE_LID_PATHS.upperClosed }, opacity: 1, y: 0 });
    gsap.set(lower, { attr: { d: EYE_LID_PATHS.lowerClosed }, opacity: 1, y: 0 });
    gsap.set(sclera, { opacity: 0 });
    gsap.set(eyeInterior, { opacity: 1 });
    store.setIntroReveal({ introMainOpacity: 0, introShootingStarIntensity: 0, introStarsOpacity: 0 });

    const revealBackground = () => {
      gsap.to(revealState, {
        stars: 1, shooting: 1,
        duration: reducedMotion ? 0 : t.starCrossfade,
        ease: "sine.inOut",
        onUpdate: () => usePortfolioStore.getState().setIntroReveal({
          introShootingStarIntensity: revealState.shooting,
          introStarsOpacity: revealState.stars,
        }),
      });
      gsap.to(overlay, {
        backgroundColor: clearBackdrop,
        duration: reducedMotion ? 0 : t.starCrossfade,
        ease: "sine.inOut",
      });
    };
    const handoff = () => {
      usePortfolioStore.getState().setIntroPlayPhase("awaitClick");
      overlay.style.pointerEvents = "none";
    };
    const open = () => {
      unsubscribe();
      if (blinkTimer) clearTimeout(blinkTimer);
      blinkTimeline?.kill();
      const state = usePortfolioStore.getState();
      if (state.introEpochMs === null) state.setIntroEpochMs(performance.now());
      if (reducedMotion) {
        gsap.set(eyeArtwork, { opacity: 0 });
        gsap.set(control, { opacity: 0 });
        revealBackground();
        handoff();
        return;
      }
      openingTimeline = gsap.timeline();
      openingTimeline.to(aperture, {
        attr: { d: EYE_LID_PATHS.apertureOpen }, duration: t.lidOpen, ease: "power2.inOut",
      }, 0);
      openingTimeline.to(upper, {
        attr: { d: EYE_LID_PATHS.upperOpen }, duration: t.lidOpen, ease: "power2.inOut",
      }, 0);
      openingTimeline.to(lower, {
        attr: { d: EYE_LID_PATHS.lowerOpen }, duration: t.lidOpen, ease: "power2.inOut",
      }, 0);
      openingTimeline.to(sclera, {
        opacity: 1, duration: t.lidOpen * 0.6, ease: "power2.out",
      }, t.lidOpen * 0.22);
      openingTimeline.call(revealBackground, [], t.lidOpen);
      const vanishStart = t.lidOpen + t.openEyeHold;
      const dissolveDuration = theme === "cloud" ? CONTROL_EYE_DISSOLVE_SECONDS : t.eyeVanishAfterOpen;
      openingTimeline.to(eyeArtwork, {
        opacity: 0, duration: dissolveDuration, ease: "sine.inOut",
      }, vanishStart);
      openingTimeline.call(handoff, [], vanishStart);
      openingTimeline.set(control, { opacity: 0 }, vanishStart + dissolveDuration);
    };
    const readiness = createIntroEyeReadiness(open);
    const scheduleBlink = () => {
      blinkTimer = setTimeout(() => blink(false), 1100);
    };
    const blink = (initial: boolean) => {
      if (!readiness.beginBlink()) return;
      blinkTimeline = gsap.timeline({ onComplete: () => {
        readiness.finishBlink();
        if (!usePortfolioStore.getState().sceneBootstrapped) scheduleBlink();
      } });
      if (!initial) {
        blinkTimeline.to(aperture, { attr: { d: EYE_LID_PATHS.apertureClosed }, duration: 0.11 }, 0);
        blinkTimeline.to(upper, { attr: { d: EYE_LID_PATHS.upperClosed }, duration: 0.11 }, 0);
        blinkTimeline.to(lower, { attr: { d: EYE_LID_PATHS.lowerClosed }, duration: 0.11 }, 0);
      }
      const reopenAt = initial ? 0 : 0.155;
      blinkTimeline.to(aperture, {
        attr: { d: EYE_LID_PATHS.apertureWaiting }, duration: 0.28, ease: "sine.inOut",
      }, reopenAt);
      blinkTimeline.to(upper, {
        attr: { d: EYE_LID_PATHS.upperWaiting }, duration: 0.28, ease: "sine.inOut",
      }, reopenAt);
      blinkTimeline.to(lower, {
        attr: { d: EYE_LID_PATHS.lowerWaiting }, duration: 0.28, ease: "sine.inOut",
      }, reopenAt);
    };
    // Subscribe directly so scene readiness never tears down a loading blink.
    unsubscribe = usePortfolioStore.subscribe(state => readiness.setReady(state.sceneBootstrapped));
    readiness.setReady(store.sceneBootstrapped);
    if (!store.sceneBootstrapped && !reducedMotion) blink(true);
    return () => {
      readiness.dispose();
      unsubscribe();
      if (blinkTimer) clearTimeout(blinkTimer);
      blinkTimeline?.kill();
      openingTimeline?.kill();
      gsap.killTweensOf(revealState);
      gsap.killTweensOf(overlay);
    };
  }, [backdrop, clearBackdrop, loadingFailed, reducedMotion, theme]);

  if (introPlayPhase === "active") return null;
  const eyeRefs = {
    eyeAperture: eyeApertureRef, eyeInterior: eyeInteriorRef,
    upperLid: upperLidRef, lowerLid: lowerLidRef, scleraExtras: scleraExtrasRef,
    iris: irisRef, pupil: pupilRef, playRing: playRingRef,
    playIcon: playIconRef, pauseIcon: pauseIconRef, iconGroup: iconGroupRef,
  };
  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 grid h-dvh w-dvw place-items-center"
      data-eye-theme={theme} data-eye-loading={!sceneBootstrapped && !loadingFailed}
      style={{ backgroundColor: backdrop }} role="dialog" aria-label="Site intro"
      aria-modal={introPlayPhase === "hidden" && !loadingFailed} aria-busy={!sceneBootstrapped && !loadingFailed}>
      <div ref={controlRef} className={`${EYE_CONTROL_SIZE_CLASS} flex items-center justify-center pointer-events-none`}
        style={{ filter: theme === "cloud" ? "invert(1) hue-rotate(180deg) saturate(.35)" : undefined }} aria-hidden>
        <EyeConsentSvg refs={eyeRefs} />
      </div>
      <span className="sr-only" role="status">{loadingFailed ? "The scene is taking longer to load. Retry or explore a project below." : introPlayPhase === "hidden" ? "Preparing the scene." : "The scene is ready. The central control enables sound."}</span>
    </div>
  );
}

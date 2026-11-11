"use client";

/** The SVG loading eye starts before the dynamically loaded 3D scene. */
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AUDIO_CONSENT_TIMING } from "@/lib/audioConsentTiming";
import { getArtworkViewportSize, getEyeControlSidePx } from "@/lib/eyeControlMetrics";
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
  const eyeSvgRef = useRef<SVGSVGElement>(null);
  const [reducedMotion] = useState(prefersReducedMotion);
  const introPlayPhase = usePortfolioStore((s) => s.introPlayPhase);
  const sceneBootstrapped = usePortfolioStore((s) => s.sceneBootstrapped);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    const syncControlSide = () => {
      const { width, height } = getArtworkViewportSize(window.innerWidth, window.innerHeight);
      root.style.setProperty("--eye-control-side", `${getEyeControlSidePx(width, height)}px`);
    };
    syncControlSide();
    const surface = document.getElementById("portfolio-scroll-surface");
    const observer = new ResizeObserver(syncControlSide);
    if (surface) observer.observe(surface);
    window.addEventListener("resize", syncControlSide);
    viewport?.addEventListener("resize", syncControlSide);
    viewport?.addEventListener("scroll", syncControlSide);
    return () => {
      observer.disconnect();
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
    const eye = eyeSvgRef.current;
    if (!overlay || !control || !eye) return;

    const store = usePortfolioStore.getState();
    // Strict Mode and Fast Refresh must preserve an already completed handoff.
    if (store.introPlayPhase !== "hidden") {
      gsap.set(control, { opacity: 0 });
      gsap.set(overlay, { backgroundColor: clearBackdrop });
      overlay.style.pointerEvents = "none";
      return;
    }

    const t = AUDIO_CONSENT_TIMING;
    const eyeArtwork = eye.querySelectorAll<SVGElement>("[data-eye-artwork]");
    const lidDetails = eye.querySelector<SVGGElement>("[data-eye-lid-details]");
    const lidPaths = Object.entries(EYE_LID_PATHS).map(([name, paths]) => ({
      element: eye.querySelector<SVGPathElement>(`[data-eye-lid="${name}"]`),
      paths,
    }));
    const revealState = { stars: 0, shooting: 0 };
    let eyeIsOpen = false;
    let openingTimeline: gsap.core.Timeline | null = null;
    let blinkTimeline: gsap.core.Timeline | null = null;
    let blinkTimer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe = () => {};
    gsap.set(overlay, { backgroundColor: backdrop, opacity: 1 });
    overlay.style.pointerEvents = "auto";
    gsap.set(control, { opacity: 1, scale: 1, transformOrigin: "center center" });
    for (const { element, paths } of lidPaths) {
      gsap.set(element, { attr: { d: paths.closed } });
    }
    gsap.set(eyeArtwork, { opacity: 1 });
    gsap.set(lidDetails, { opacity: 0 });
    store.setIntroReveal({ introMainOpacity: 0, introShootingStarIntensity: 0, introStarsOpacity: 0 });

    const tweenLids = (
      timeline: gsap.core.Timeline,
      openness: number,
      duration: number,
      ease: string,
      at: number,
    ) => {
      for (const { element, paths } of lidPaths) {
        const d = gsap.utils.interpolate(paths.closed, paths.open, openness);
        timeline.to(element, { attr: { d }, duration, ease }, at);
      }
      // Keep the lid seam visible at contact instead of dissolving the whole eye.
      timeline.to(lidDetails, { opacity: 1, duration, ease }, at);
    };
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
      const openingDuration = eyeIsOpen ? 0 : t.lidOpen;
      if (!eyeIsOpen) tweenLids(openingTimeline, 1, openingDuration, "power2.inOut", 0);
      openingTimeline.call(revealBackground, [], openingDuration);
      const vanishStart = openingDuration + t.openEyeHold;
      const dissolveDuration = theme === "cloud" ? CONTROL_EYE_DISSOLVE_SECONDS : t.eyeVanishAfterOpen;
      openingTimeline.to(eyeArtwork, {
        opacity: 0, duration: dissolveDuration, ease: "sine.inOut",
      }, vanishStart);
      openingTimeline.call(handoff, [], vanishStart);
      openingTimeline.set(control, { opacity: 0 }, vanishStart + dissolveDuration);
    };
    const readiness = createIntroEyeReadiness(open);
    let lastBlinkWasFollowup = false;
    const scheduleBlink = () => {
      // Irregular rests, with an occasional quick second blink (never a chain).
      const followup = !lastBlinkWasFollowup && Math.random() < 0.16;
      lastBlinkWasFollowup = followup;
      const pause = followup ? gsap.utils.random(180, 310) : gsap.utils.random(1800, 4100);
      blinkTimer = setTimeout(() => blink(false), pause);
    };
    const blink = (initial: boolean) => {
      if (!readiness.beginBlink()) return;
      blinkTimeline = gsap.timeline({ onComplete: () => {
        eyeIsOpen = true;
        readiness.finishBlink();
        if (!usePortfolioStore.getState().sceneBootstrapped) scheduleBlink();
      } });
      const closeDuration = gsap.utils.random(0.085, 0.12);
      const contactHold = gsap.utils.random(0.018, 0.035);
      const reopenStart = initial ? 0 : closeDuration + contactHold;
      const reopenDuration = initial ? 0.3 : gsap.utils.random(0.17, 0.23);
      if (!initial) {
        eyeIsOpen = false;
        tweenLids(blinkTimeline, 0, closeDuration, "power2.inOut", 0);
      }
      // Release briskly, then let the lid gently settle into its resting shape.
      tweenLids(blinkTimeline, 0.96, reopenDuration, "power2.out", reopenStart);
      tweenLids(blinkTimeline, 1, gsap.utils.random(0.12, 0.18), "sine.out", reopenStart + reopenDuration);
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
  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 grid h-dvh w-dvw place-items-center"
      data-eye-theme={theme} data-eye-loading={!sceneBootstrapped && !loadingFailed}
      style={{ backgroundColor: backdrop }} role="dialog" aria-label="Site intro"
      aria-modal={introPlayPhase === "hidden" && !loadingFailed} aria-busy={!sceneBootstrapped && !loadingFailed}>
      <div ref={controlRef} className={`${EYE_CONTROL_SIZE_CLASS} flex items-center justify-center pointer-events-none`}
        style={{ filter: theme === "cloud" ? "invert(1) hue-rotate(180deg) saturate(.35)" : undefined }} aria-hidden>
        <EyeConsentSvg svgRef={eyeSvgRef} />
      </div>
      <span className="sr-only" role="status">{loadingFailed ? "The scene is taking longer to load. Retry or explore a project below." : introPlayPhase === "hidden" ? "Preparing the scene." : "The scene is ready. The central control enables sound."}</span>
    </div>
  );
}

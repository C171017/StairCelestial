"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AUDIO_PATHS,
  pickAmbientLoopSrc,
} from "@/lib/siteAudioPaths";

const STING_VOLUME = 0.6;
const AMBIENT_VOLUME = 0.35;
const AMBIENT_FADE_MS = 900;

type SiteAudioContextValue = {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => boolean;
  unlockFromGesture: () => void;
  playConsentSting: () => void;
  fadeAmbientIn: () => void;
  fadeAmbientOut: () => void;
  stopAmbient: () => void;
};

const SiteAudioContext = createContext<SiteAudioContextValue | null>(null);

function createAudio(src: string, loop: boolean, volume: number): HTMLAudioElement {
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  audio.preload = "auto";
  return audio;
}

export function SiteAudioProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const unlockedRef = useRef(false);
  const stingRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const warnedRef = useRef({ sting: false, ambient: false });
  const fadeRef = useRef<{ raf: number | null; gen: number }>({
    raf: null,
    gen: 0,
  });
  const soundEnabledRef = useRef(false);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
    setSoundEnabledState(enabled);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stingSrc = AUDIO_PATHS.consentStingM4a;
    const ambientSrc = pickAmbientLoopSrc();

    const sting = createAudio(stingSrc, false, STING_VOLUME);
    const ambient = createAudio(ambientSrc, true, AMBIENT_VOLUME);

    const warnOnce = (key: "sting" | "ambient", src: string) => {
      if (warnedRef.current[key]) return;
      warnedRef.current[key] = true;
      console.warn(
        `[SiteAudio] Could not load ${src}. Add the file under public/audio/ or replace it.`,
      );
    };

    sting.addEventListener("error", () => warnOnce("sting", stingSrc));
    ambient.addEventListener("error", () => warnOnce("ambient", ambientSrc));

    stingRef.current = sting;
    ambientRef.current = ambient;

    return () => {
      if (fadeRef.current.raf !== null) {
        cancelAnimationFrame(fadeRef.current.raf);
        fadeRef.current.raf = null;
      }
      sting.pause();
      ambient.pause();
      sting.src = "";
      ambient.src = "";
      stingRef.current = null;
      ambientRef.current = null;
    };
  }, []);

  const cancelAmbientFade = useCallback(() => {
    if (fadeRef.current.raf !== null) {
      cancelAnimationFrame(fadeRef.current.raf);
      fadeRef.current.raf = null;
    }
    fadeRef.current.gen += 1;
  }, []);

  const fadeAmbientVolume = useCallback(
    (targetVolume: number, durationMs: number): Promise<void> =>
      new Promise((resolve) => {
        const ambient = ambientRef.current;
        if (!ambient) {
          resolve();
          return;
        }

        cancelAmbientFade();
        const gen = fadeRef.current.gen;
        const startVolume = ambient.volume;
        const startTime = performance.now();

        const tick = () => {
          if (fadeRef.current.gen !== gen) {
            resolve();
            return;
          }

          const t = Math.min(1, (performance.now() - startTime) / durationMs);
          const eased = t * t * (3 - 2 * t);
          ambient.volume = startVolume + (targetVolume - startVolume) * eased;

          if (t < 1) {
            fadeRef.current.raf = requestAnimationFrame(tick);
            return;
          }

          fadeRef.current.raf = null;
          resolve();
        };

        fadeRef.current.raf = requestAnimationFrame(tick);
      }),
    [cancelAmbientFade],
  );

  const unlockFromGesture = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    const ambient = ambientRef.current;
    if (!ambient) return;
    ambient
      .play()
      .then(() => {
        ambient.pause();
        ambient.currentTime = 0;
      })
      .catch(() => {
        /* unlock may fail until a user gesture; unmute click will retry */
      });
  }, []);

  const playConsentSting = useCallback(() => {
    const sting = stingRef.current;
    if (!sting) return;
    sting.currentTime = 0;
    void sting.play().catch(() => {
      /* missing file or autoplay blocked */
    });
  }, []);

  const stopAmbient = useCallback(() => {
    cancelAmbientFade();
    const ambient = ambientRef.current;
    if (!ambient) return;
    ambient.pause();
    ambient.currentTime = 0;
    ambient.volume = AMBIENT_VOLUME;
  }, [cancelAmbientFade]);

  const fadeAmbientIn = useCallback(() => {
    if (!soundEnabledRef.current) return;
    const ambient = ambientRef.current;
    if (!ambient) return;

    cancelAmbientFade();
    ambient.volume = 0;
    void ambient
      .play()
      .then(() => fadeAmbientVolume(AMBIENT_VOLUME, AMBIENT_FADE_MS))
      .catch(() => {
        /* missing file or autoplay blocked */
      });
  }, [cancelAmbientFade, fadeAmbientVolume]);

  const fadeAmbientOut = useCallback(() => {
    const ambient = ambientRef.current;
    if (!ambient) return;

    void fadeAmbientVolume(0, AMBIENT_FADE_MS).then(() => {
      if (soundEnabledRef.current) return;
      ambient.pause();
    });
  }, [fadeAmbientVolume]);

  const toggleSound = useCallback(() => {
    let next = false;
    setSoundEnabledState((prev) => {
      next = !prev;
      soundEnabledRef.current = next;
      return next;
    });
    return next;
  }, []);

  const value = useMemo<SiteAudioContextValue>(
    () => ({
      soundEnabled,
      setSoundEnabled,
      toggleSound,
      unlockFromGesture,
      playConsentSting,
      fadeAmbientIn,
      fadeAmbientOut,
      stopAmbient,
    }),
    [
      soundEnabled,
      setSoundEnabled,
      toggleSound,
      unlockFromGesture,
      playConsentSting,
      fadeAmbientIn,
      fadeAmbientOut,
      stopAmbient,
    ],
  );

  return (
    <SiteAudioContext.Provider value={value}>
      {children}
    </SiteAudioContext.Provider>
  );
}

export function useSiteAudio(): SiteAudioContextValue {
  const ctx = useContext(SiteAudioContext);
  if (!ctx) {
    throw new Error("useSiteAudio must be used within SiteAudioProvider");
  }
  return ctx;
}

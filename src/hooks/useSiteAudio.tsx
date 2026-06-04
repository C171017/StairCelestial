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
import { mediaVolumeControlWorks } from "@/lib/mediaVolumeControl";
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
  audio.setAttribute("playsinline", "");
  return audio;
}

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  );
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
  const usesGainRef = useRef(false);
  const gainRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
    setSoundEnabledState(enabled);
  }, []);

  const ensureAmbientGain = useCallback((ambient: HTMLAudioElement): boolean => {
    if (usesGainRef.current && gainRef.current) return true;
    if (mediaVolumeControlWorks()) return false;

    const Ctx = getAudioContextCtor();
    if (!Ctx) return false;

    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(ambient);
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);
    ambient.volume = 1;
    gain.gain.value = AMBIENT_VOLUME;

    audioCtxRef.current = ctx;
    gainRef.current = gain;
    usesGainRef.current = true;
    return true;
  }, []);

  const getAmbientLevel = useCallback((ambient: HTMLAudioElement): number => {
    if (usesGainRef.current && gainRef.current) {
      return gainRef.current.gain.value;
    }
    return ambient.volume;
  }, []);

  const setAmbientLevel = useCallback(
    (ambient: HTMLAudioElement, level: number) => {
      if (ensureAmbientGain(ambient) && gainRef.current) {
        gainRef.current.gain.value = level;
        return;
      }
      ambient.volume = level;
    },
    [ensureAmbientGain],
  );

  const resumeAmbientAudio = useCallback(async () => {
    const ctx = audioCtxRef.current;
    if (ctx?.state === "suspended") {
      await ctx.resume();
    }
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
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
      gainRef.current = null;
      usesGainRef.current = false;
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
        const startVolume = getAmbientLevel(ambient);
        const startTime = performance.now();

        const tick = () => {
          if (fadeRef.current.gen !== gen) {
            resolve();
            return;
          }

          const t = Math.min(1, (performance.now() - startTime) / durationMs);
          const eased = t * t * (3 - 2 * t);
          setAmbientLevel(
            ambient,
            startVolume + (targetVolume - startVolume) * eased,
          );

          if (t < 1) {
            fadeRef.current.raf = requestAnimationFrame(tick);
            return;
          }

          fadeRef.current.raf = null;
          resolve();
        };

        fadeRef.current.raf = requestAnimationFrame(tick);
      }),
    [cancelAmbientFade, getAmbientLevel, setAmbientLevel],
  );

  const primeAmbientFromGesture = useCallback(async () => {
    const ambient = ambientRef.current;
    if (!ambient) return;
    ensureAmbientGain(ambient);
    setAmbientLevel(ambient, 0);
    await resumeAmbientAudio();
    try {
      await ambient.play();
    } catch {
      /* unlock may fail until a user gesture; unmute click will retry */
    }
  }, [ensureAmbientGain, resumeAmbientAudio, setAmbientLevel]);

  const unlockFromGesture = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    void primeAmbientFromGesture();
  }, [primeAmbientFromGesture]);

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
    setAmbientLevel(ambient, AMBIENT_VOLUME);
  }, [cancelAmbientFade, setAmbientLevel]);

  const fadeAmbientIn = useCallback(() => {
    if (!soundEnabledRef.current) return;
    const ambient = ambientRef.current;
    if (!ambient) return;

    cancelAmbientFade();
    ensureAmbientGain(ambient);
    setAmbientLevel(ambient, 0);

    const startFade = () => {
      void fadeAmbientVolume(AMBIENT_VOLUME, AMBIENT_FADE_MS);
    };

    void resumeAmbientAudio().then(async () => {
      if (ambient.paused) {
        try {
          await ambient.play();
        } catch {
          /* missing file or autoplay blocked */
          return;
        }
      }
      startFade();
    });
  }, [
    cancelAmbientFade,
    ensureAmbientGain,
    fadeAmbientVolume,
    resumeAmbientAudio,
    setAmbientLevel,
  ]);

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

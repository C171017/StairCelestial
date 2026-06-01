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

type SiteAudioContextValue = {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => boolean;
  unlockFromGesture: () => void;
  playConsentSting: () => void;
  startAmbientIfEnabled: () => void;
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
  const [soundEnabled, setSoundEnabled] = useState(false);
  const unlockedRef = useRef(false);
  const stingRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const warnedRef = useRef({ sting: false, ambient: false });

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
      sting.pause();
      ambient.pause();
      sting.src = "";
      ambient.src = "";
      stingRef.current = null;
      ambientRef.current = null;
    };
  }, []);

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
    const ambient = ambientRef.current;
    if (!ambient) return;
    ambient.pause();
    ambient.currentTime = 0;
  }, []);

  const startAmbientIfEnabled = useCallback(() => {
    if (!soundEnabled) return;
    const ambient = ambientRef.current;
    if (!ambient) return;
    void ambient.play().catch(() => {
      /* missing file */
    });
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    let next = false;
    setSoundEnabled((prev) => {
      next = !prev;
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
      startAmbientIfEnabled,
      stopAmbient,
    }),
    [
      soundEnabled,
      toggleSound,
      unlockFromGesture,
      playConsentSting,
      startAmbientIfEnabled,
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

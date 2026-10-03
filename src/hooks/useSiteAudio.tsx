"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { AmbientPlayback } from "@/lib/ambientPlayback";
import { createAmbientOutput } from "@/lib/ambientOutput";
import { AUDIO_PATHS, getAmbientSources } from "@/lib/siteAudioPaths";

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

export function SiteAudioProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const soundEnabledRef = useRef(false);
  const stingRef = useRef<HTMLAudioElement | null>(null);
  const playbackRef = useRef<AmbientPlayback | null>(null);

  useEffect(() => {
    const sting = new Audio(AUDIO_PATHS.consentStingM4a);
    sting.volume = 0.6;
    sting.preload = "metadata";
    const ambient = new Audio();
    ambient.loop = false;
    ambient.preload = "none";
    ambient.setAttribute("playsinline", "");
    const resetSoundState = () => {
      soundEnabledRef.current = false;
      setSoundEnabledState(false);
    };
    const playback = new AmbientPlayback(ambient, createAmbientOutput(ambient), getAmbientSources(), (error) => {
      resetSoundState();
      console.warn("[SiteAudio] Background playback failed; click the triangle to retry.", error);
    }, resetSoundState);
    stingRef.current = sting;
    playbackRef.current = playback;
    return () => {
      sting.pause();
      sting.src = "";
      playback.dispose();
      stingRef.current = null;
      playbackRef.current = null;
    };
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
    setSoundEnabledState(enabled);
    if (enabled) playbackRef.current?.play();
    else playbackRef.current?.pause();
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundEnabledRef.current;
    setSoundEnabled(next);
    return next;
  }, [setSoundEnabled]);

  const unlockFromGesture = useCallback(() => playbackRef.current?.unlock(), []);
  const playConsentSting = useCallback(() => {
    const sting = stingRef.current;
    if (!sting) return;
    sting.currentTime = 0;
    void sting.play().catch(() => {});
  }, []);
  const fadeAmbientIn = useCallback(() => {
    if (soundEnabledRef.current) playbackRef.current?.play();
  }, []);
  const fadeAmbientOut = useCallback(() => playbackRef.current?.pause(), []);
  const stopAmbient = useCallback(() => {
    playbackRef.current?.stop();
    soundEnabledRef.current = false;
    setSoundEnabledState(false);
  }, []);

  const value = useMemo<SiteAudioContextValue>(() => ({
    soundEnabled, setSoundEnabled, toggleSound, unlockFromGesture, playConsentSting,
    fadeAmbientIn, fadeAmbientOut, stopAmbient,
  }), [soundEnabled, setSoundEnabled, toggleSound, unlockFromGesture, playConsentSting,
    fadeAmbientIn, fadeAmbientOut, stopAmbient]);

  return <SiteAudioContext.Provider value={value}>{children}</SiteAudioContext.Provider>;
}

export function useSiteAudio(): SiteAudioContextValue {
  const context = useContext(SiteAudioContext);
  if (!context) throw new Error("useSiteAudio must be used within SiteAudioProvider");
  return context;
}

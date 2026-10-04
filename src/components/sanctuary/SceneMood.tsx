"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { advanceSceneMood, sampleSceneMood, type SceneMoodState } from "@/lib/sceneMood";
import type { RibbonMotionState } from "@/lib/ribbonMotion";

const defaultMood = { current: sampleSceneMood() };
const MoodContext = createContext<RefObject<SceneMoodState>>(defaultMood);

export function useSceneMood() { return useContext(MoodContext); }

/** Isolated sky study controls; the portfolio uses accumulated travel below. */
export function SceneMoodPreview({ value, children }: { value: number; children: ReactNode }) {
  const mood = useMemo(() => ({ current: sampleSceneMood(value) }), [value]);
  return <MoodContext.Provider value={mood}>{children}</MoodContext.Provider>;
}

export function SceneMood({ motion, children }: { motion: RefObject<RibbonMotionState>; children: ReactNode }) {
  const mood = useRef(sampleSceneMood());
  useFrame(({ gl }, delta) => {
    advanceSceneMood(mood.current, motion.current.userTravel, delta);
    if (process.env.NODE_ENV === "development") {
      gl.domElement.dataset.sceneMood = mood.current.value.toFixed(5);
      gl.domElement.dataset.userAscent = mood.current.ascent.toFixed(5);
      gl.domElement.dataset.ribbonTurns = motion.current.position.toFixed(5);
    }
  }, -1.5);
  return <MoodContext.Provider value={mood}>{children}</MoodContext.Provider>;
}

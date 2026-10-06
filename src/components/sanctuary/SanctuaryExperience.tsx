"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { sanctuaryProjects } from "@/lib/sanctuaryContent";
import { AudioConsentGate } from "@/components/ui/AudioConsentGate";
import { SiteAudioProvider } from "@/hooks/useSiteAudio";
import { usePortfolioStore } from "@/lib/store";
import { retainIntroSession } from "@/lib/introSession";
import type { Selection } from "./SanctuaryScene";

const Scene = dynamic(() => import("./SanctuaryScene").then((module) => module.SanctuaryScene), { ssr: false });

class SceneBoundary extends Component<{children: ReactNode; onError: () => void}, {failed:boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function SanctuaryExperience() {
  return <SiteAudioProvider><SanctuaryContent /></SiteAudioProvider>;
}

function SanctuaryContent() {
  const [ready, setReady] = useState(false);
  const phase = usePortfolioStore(state => state.introPlayPhase);
  const entered = phase === "active";
  const [failed, setFailed] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyHandler = useCallback(() => { setReady(true); usePortfolioStore.getState().setSceneBootstrapped(true); }, []);
  const errorHandler = useCallback(() => { setFailed(true); setReady(false); usePortfolioStore.getState().setSceneBootstrapped(false); }, []);
  const placeholder = useCallback((name: string) => {
    setNotice(`${name} — personal link to be added.`);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 4000);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // Strict Mode and live updates replay effects; only a real exit ends the visit.
  useEffect(retainIntroSession, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!entered || !root.classList.contains("native-ribbon-scroll")) return;
    // Place the document layer before its first paint. Mobile swipes move the
    // ribbon internally, leaving this canvas at the same document coordinate.
    root.style.setProperty("--ribbon-scroll-position", `${window.scrollY}px`);
  }, [entered]);
  useEffect(() => {
    const timeout = setTimeout(() => { if (!ready) setFailed(true); }, 15000);
    return () => clearTimeout(timeout);
  }, [ready]);
  useEffect(() => {
    function key(event: KeyboardEvent) { if (event.key === "Escape") setSelection(null); }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const project = selection ? sanctuaryProjects[selection.index] : null;
  return <main id="portfolio-scroll-surface" data-intro-phase={phase} className={`sanctuary${entered ? " has-entered" : ""}${project ? " has-selection" : ""}`}>
    <div className="world-layer original-intro-world" style={{ opacity: 1, transition: "none" }} aria-label="An infinite polished white marble ribbon beneath floating black metal and gold glass portals">
      <SceneBoundary onError={errorHandler}>
        <Scene active={entered} selection={selection} onSelect={setSelection} onReady={readyHandler} onPlaceholder={placeholder} />
      </SceneBoundary>
    </div>
    <AudioConsentGate theme="cloud" />
    {failed && !entered && <div className="original-intro-fallback">{sanctuaryProjects.map(p => <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Explore ${p.title}`}>↗</a>)}</div>}
    {entered && <>
      <div className={`project-detail${project ? " is-visible" : ""}`} aria-live="polite">
        {project && <>
          <a className="sr-only" href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`Explore ${project.title}`} />
        </>}
      </div>
    </>}
    {notice && <div className="sr-only" role="status">{notice}</div>}
  </main>;
}

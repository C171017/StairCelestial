"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { sanctuaryProjects } from "@/lib/sanctuaryContent";
import type { Selection } from "./SanctuaryScene";

const Scene = dynamic(() => import("./SanctuaryScene").then((module) => module.SanctuaryScene), { ssr: false });

function Eye({ small = false }: { small?: boolean }) {
  return <svg viewBox="0 0 160 90" fill="none" aria-hidden className={small ? "identity-eye" : "entrance-eye"}>
    <path d="M8 45C43 1 117 1 152 45C117 89 43 89 8 45Z" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="80" cy="45" r="23" stroke="currentColor" strokeWidth="0.75" />
    <circle cx="80" cy="45" r="29" stroke="currentColor" strokeWidth="0.4" opacity=".4" />
    <path d="M75 36L90 45L75 54Z" fill="currentColor" />
  </svg>;
}

class SceneBoundary extends Component<{children: ReactNode; onError: () => void}, {failed:boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function SanctuaryExperience() {
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const [requested, setRequested] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyHandler = useCallback(() => setReady(true), []);
  const errorHandler = useCallback(() => { setFailed(true); setEntered(false); setReady(false); }, []);
  const placeholder = useCallback((name: string) => {
    setNotice(`${name} — personal link to be added.`);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 4000);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!ready || !requested) return;
    const timeout = setTimeout(() => setEntered(true), 180);
    return () => clearTimeout(timeout);
  }, [ready, requested]);
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
  return <main id="portfolio-scroll-surface" className={`sanctuary${entered ? " has-entered" : ""}${project ? " has-selection" : ""}`}>
    <div className="world-layer" aria-label="An infinite glass ribbon carrying four project sculptures">
      <SceneBoundary onError={errorHandler}>
        <Scene active={entered} selection={selection} onSelect={setSelection} onReady={readyHandler} onPlaceholder={placeholder} />
      </SceneBoundary>
    </div>
    <header className="sanctuary-identity"><Eye small /><span>c171017</span><span className="identity-divider" /><span className="identity-caption">A world of curiosities</span></header>
    <div className="collection-caption" aria-hidden><span>SELECTED WORK</span><span>AN INFINITE COLLECTION</span></div>
    {!entered && <section className={`sanctuary-entrance${requested ? " is-opening" : ""}`} aria-label="Welcome">
      <div className="entrance-content">
        <span className="eyebrow">A DIFFERENT PERSPECTIVE</span>
        <button className="eye-enter" onClick={() => setRequested(true)} aria-label="Open your eyes and enter the portfolio"><Eye /></button>
        <h1>Open your eyes.</h1><p>A little curiosity goes a long way.</p>
        <button className="enter-link" onClick={() => setRequested(true)}>{requested ? "Take a breath" : "Step inside"}<span aria-hidden>↗</span></button>
        {failed && <div className="entrance-fallback"><p>The quiet view is ready to explore.</p>{sanctuaryProjects.map(p => <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">{p.title} ↗</a>)}</div>}
      </div><span className="entrance-bottom">WORK · EXPLORATION · CONNECTION</span>
    </section>}
    {entered && <>
      <div className={`project-detail${project ? " is-visible" : ""}`} aria-live="polite">
        {project && <>
          <button className="detail-close" onClick={() => setSelection(null)} aria-label="Return to the ribbon">×</button>
          <span className="eyebrow">{project.number} / {project.category}</span>
          <h2>{project.title}</h2><p>{project.summary}</p>
          <a href={project.url} target="_blank" rel="noopener noreferrer">Explore project <span aria-hidden>↗</span></a>
        </>}
      </div>
      <footer className="scene-footer"><span className="scroll-hint"><span className="scroll-line" />{project ? "SCROLL TO RETURN" : "SCROLL TO WANDER"}</span><span className="footer-note">Made of ideas, held by light.</span><span className="edition">01 — ∞</span></footer>
    </>}
    {notice && <div className="scene-notice" role="status">{notice}</div>}
  </main>;
}

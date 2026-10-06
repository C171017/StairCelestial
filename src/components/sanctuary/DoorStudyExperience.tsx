"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import { doorStudies } from "@/lib/doorStudies";
import palette from "@/lib/doorPalette.json";

const Scene = dynamic(() => import("./DoorStudyScene").then(m => m.DoorStudyScene), { ssr: false });

class StudyBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    return this.state.failed ? <div className="study-error">The 3D preview couldn’t load. <Link href="/">Return to the ribbon</Link>.</div> : this.props.children;
  }
}

export function DoorStudyExperience() {
  const [selected, setSelected] = useState<number | null>(null);
  const [amount, setAmount] = useState(0);
  const [angle, setAngle] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).matches("input")) return;
      if (event.key === "Escape") { setSelected(null); setAmount(0); }
      const index = Number(event.key) - 1;
      if (index >= 0 && index < doorStudies.length) { setSelected(index); setAmount(0); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function choose(index: number | null) { setSelected(index); setAmount(0); setAngle(0); }
  function selectSlab(index: number) {
    if (selected === index) setAmount(value => value === 100 ? 0 : 100);
    else choose(index);
  }
  const study = selected === null ? null : doorStudies[selected];
  return <main className="door-study-room">
    <div className="door-study-canvas" aria-label="Six colored glass slabs in satin black metal surrounds with brushed gold reveals">
      <StudyBoundary onError={onError}><Scene selected={selected} amount={amount} angle={angle} onSelect={selectSlab} onReady={onReady} /></StudyBoundary>
    </div>
    <header className="study-heading">
      <div><span className="study-eyebrow">SANCTUARY / FORM STUDIES</span><h1>Possible passages.</h1><p>Six ways to open somewhere else.</p></div>
      <Link href="/" className="study-ribbon-link">On the ribbon <span aria-hidden="true">↗</span></Link>
    </header>
    {!ready && !failed && <div className="study-loading" role="status">Gathering the glass…</div>}
    <footer className="study-controls">
      <div className="study-selection" aria-live="polite">
        <span>{study ? `${study.number} / ${study.name} · ${palette.doors[study.id].name}` : "01—06 / Black metal & brushed gold"}</span>
        <p>{study ? study.note : "Select a slab to study its shape."}</p>
      </div>
      <nav className="study-picker" aria-label="Choose a door study">
        <button onClick={() => choose(null)} aria-pressed={selected === null}>All six</button>
        {doorStudies.map((door, index) => <button key={door.id} aria-pressed={selected === index} onClick={() => choose(index)} aria-label={`${door.number} ${door.name}`}>
          <span>{door.number}</span><span className="study-picker-name">{door.name}</span>
        </button>)}
      </nav>
      <div className="study-experiments">
        <label><span>Present</span><input aria-label="Slab dissolve" type="range" min="0" max="100" value={amount} onChange={e => setAmount(Number(e.target.value))} /><span>Absent</span></label>
        <label className="study-turn"><span>Turn</span><input aria-label="Viewing angle" type="range" min="-60" max="60" value={angle} onChange={e => setAngle(Number(e.target.value))} /></label>
      </div>
    </footer>
  </main>;
}

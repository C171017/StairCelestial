"use client";

import { usePortfolioStore } from "@/lib/store";

export function ProjectOverlay() {
  const currentProject = usePortfolioStore((s) => s.currentProject);
  const openedDoorId = usePortfolioStore((s) => s.openedDoorId);
  const scrollProgress = usePortfolioStore((s) => s.scrollProgress);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-end p-6 md:p-10">
      <footer className="flex items-end justify-between gap-4">
        <p className="text-xs text-slate-400">
          Scroll {Math.round(scrollProgress * 100)}%
        </p>

        {currentProject && openedDoorId && (
          <div className="pointer-events-auto max-w-sm rounded-xl border border-cyan-300/20 bg-slate-950/70 p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-widest text-cyan-200/80">
              Preview open
            </p>
            <h2 className="mt-1 text-lg font-medium text-white">
              {currentProject.title}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {currentProject.description}
            </p>
            <p className="mt-3 text-xs text-cyan-100/70">
              Click the door again to visit →
            </p>
          </div>
        )}
      </footer>
    </div>
  );
}

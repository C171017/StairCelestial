export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#030508] text-slate-300">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">
          Loading
        </p>
        <p className="mt-3 text-sm">Preparing celestial stairway…</p>
      </div>
    </div>
  );
}

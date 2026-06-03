export function LoadingScreen() {
  return (
    <div
      className="grid h-screen w-screen place-items-center bg-[#030508]"
      role="status"
      aria-label="Loading"
    >
      <svg
        viewBox="0 0 200 200"
        className="size-[min(34vmin,12rem)] animate-pulse"
        aria-hidden
      >
        <defs>
          <radialGradient id="loading-eye-core" cx="43%" cy="38%" r="76%">
            <stop offset="0%" stopColor="#d7e3ce" stopOpacity="0.58" />
            <stop offset="46%" stopColor="#597f78" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#030507" stopOpacity="1" />
          </radialGradient>
          <filter id="loading-eye-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M 38 100 C 64 84 136 82 162 100 C 136 116 64 118 38 100 Z"
          fill="url(#loading-eye-core)"
          opacity={0.64}
        />
        <circle cx="100" cy="100" r="12" fill="#020305" />
        <path
          d="M 36 100 C 63 81 138 79 164 100"
          fill="none"
          stroke="rgba(205, 215, 193, 0.42)"
          strokeLinecap="round"
          strokeWidth={1}
          filter="url(#loading-eye-glow)"
        />
        <path
          d="M 42 103 C 68 118 132 118 158 102"
          fill="none"
          stroke="rgba(93, 126, 119, 0.26)"
          strokeLinecap="round"
          strokeWidth={0.8}
        />
      </svg>
    </div>
  );
}

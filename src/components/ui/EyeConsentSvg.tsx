"use client";

import type { RefObject } from "react";

type EyeConsentSvgProps = {
  svgRef: RefObject<SVGSVGElement | null>;
};

const CX = 100;
const CY = 100;
const IRIS_R = 29;
const PUPIL_R = 12;
const IRIS_RAY_COUNT = 40;

// The lids meet below the iris center: the upper lid travels much farther.
// Matching curves fully seal the aperture without pinching the eye's corners.
const closedAperture = "M 11 103 C 57 125 158 118 190 94 C 158 118 57 125 11 103 Z";
const closedUpperLid = "M 11 103 C 57 125 158 118 190 94";
const closedLowerLid = closedUpperLid;

// Each pair has matching SVG commands so the details morph with the aperture.
export const EYE_LID_PATHS = {
  aperture: {
    closed: closedAperture,
    open: "M 11 103 C 43 66 127 48 190 94 C 158 131 57 140 11 103 Z",
  },
  upperLid: { closed: closedUpperLid, open: "M 11 103 C 43 66 127 48 190 94" },
  lowerLid: { closed: closedLowerLid, open: "M 11 103 C 57 140 158 131 190 94" },
  lidFill: {
    closed: closedAperture,
    open: "M 11 103 C 43 66 127 48 190 94 C 156 115 58 122 11 103 Z",
  },
  lidShadow: {
    closed: closedAperture,
    open: "M 11 103 C 42 77 133 66 190 94 C 156 135 54 143 11 103 Z",
  },
  upperHighlight: { closed: closedUpperLid, open: "M 11 103 C 43 68 127 48 190 94" },
  upperContour: { closed: closedUpperLid, open: "M 11 103 C 44 67 127 49 190 94" },
  lowerContour: { closed: closedLowerLid, open: "M 11 103 C 58 138 157 130 190 94" },
  upperFold: {
    closed: "M 27 105 C 63 115 131 113 171 100",
    open: "M 27 102 C 63 87 131 83 171 96",
  },
  lowerFold: {
    closed: "M 27 109 C 67 123 132 118 171 103",
    open: "M 27 108 C 67 123 132 119 171 99",
  },
};

function lidPath(name: keyof typeof EYE_LID_PATHS) {
  return { "data-eye-lid": name, d: EYE_LID_PATHS[name].closed };
}

export function EyeConsentSvg({ svgRef }: EyeConsentSvgProps) {
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      className="size-full"
      aria-hidden
    >
      <defs>
        <clipPath id="eye-consent-aperture">
          <path {...lidPath("aperture")} />
        </clipPath>
        <radialGradient id="eye-consent-iris" cx="47%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#f3ecd4" stopOpacity="0.72" />
          <stop offset="18%" stopColor="#bbc8b7" stopOpacity="0.58" />
          <stop offset="47%" stopColor="#4e6967" stopOpacity="0.7" />
          <stop offset="76%" stopColor="#111d1d" stopOpacity="0.97" />
          <stop offset="100%" stopColor="#030507" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="eye-consent-void" cx="50%" cy="50%" r="56%">
          <stop offset="0%" stopColor="#000000" stopOpacity="1" />
          <stop offset="68%" stopColor="#020305" stopOpacity="1" />
          <stop offset="100%" stopColor="#17211f" stopOpacity="0.2" />
        </radialGradient>
        <radialGradient id="eye-consent-aperture-shadow" cx="52%" cy="45%" r="76%">
          <stop offset="0%" stopColor="#9bab9b" stopOpacity="0.14" />
          <stop offset="45%" stopColor="#152322" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#030508" stopOpacity="0.96" />
        </radialGradient>
        <linearGradient id="eye-consent-upper-lid" x1="7%" y1="52%" x2="90%" y2="38%">
          <stop offset="0%" stopColor="#030508" stopOpacity="0" />
          <stop offset="24%" stopColor="#899385" stopOpacity="0.1" />
          <stop offset="48%" stopColor="#f1ead0" stopOpacity="0.56" />
          <stop offset="72%" stopColor="#6f786d" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#030508" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="eye-consent-lower-lid" x1="10%" y1="54%" x2="88%" y2="73%">
          <stop offset="0%" stopColor="#030508" stopOpacity="0" />
          <stop offset="43%" stopColor="#eadfc2" stopOpacity="0.34" />
          <stop offset="67%" stopColor="#f3ecd4" stopOpacity="0.56" />
          <stop offset="100%" stopColor="#746e5c" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="eye-consent-iris-vignette" cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor="#030508" stopOpacity="0" />
          <stop offset="64%" stopColor="#030508" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#030508" stopOpacity="0.78" />
        </radialGradient>
        <filter id="eye-consent-soft-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="0.95" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g data-eye-artwork data-eye-lid-details opacity={0}>
        <path
          {...lidPath("lidFill")}
          fill="#030508"
          opacity={0.82}
        />
        <path
          {...lidPath("lidShadow")}
          fill="url(#eye-consent-aperture-shadow)"
          opacity={0.9}
        />
        <path
          {...lidPath("upperHighlight")}
          fill="none"
          stroke="rgba(245, 239, 214, 0.28)"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.5}
        />
        <path
          {...lidPath("upperContour")}
          fill="none"
          stroke="url(#eye-consent-upper-lid)"
          strokeWidth={3.2}
          strokeLinecap="round"
          opacity={0.88}
        />
        <path
          {...lidPath("lowerContour")}
          fill="none"
          stroke="url(#eye-consent-lower-lid)"
          strokeWidth={2.4}
          strokeLinecap="round"
          opacity={0.8}
        />
        <path
          {...lidPath("upperFold")}
          fill="none"
          stroke="rgba(184, 194, 179, 0.08)"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
        <path
          {...lidPath("lowerFold")}
          fill="none"
          stroke="rgba(233, 223, 195, 0.15)"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      </g>

      <g data-eye-artwork clipPath="url(#eye-consent-aperture)">
        <path
          d={EYE_LID_PATHS.aperture.open}
          fill="url(#eye-consent-aperture-shadow)"
          opacity={0.92}
        />
        <circle
          cx={CX}
          cy={CY}
          r={IRIS_R}
          fill="url(#eye-consent-iris)"
          stroke="rgba(226, 222, 198, 0.36)"
          strokeWidth={1.1}
          filter="url(#eye-consent-soft-glow)"
        />
        <circle
          cx={CX}
          cy={CY}
          r={IRIS_R}
          fill="url(#eye-consent-iris-vignette)"
          opacity={0.84}
        />
        <g opacity={0.34}>
          {Array.from({ length: IRIS_RAY_COUNT }, (_, i) => (
            <line
              key={`iris-ray-${i}`}
              x1={CX + (i % 2 === 0 ? 0.3 : -0.3)}
              y1={CY - PUPIL_R - 1 - (i % 3) * 0.8}
              x2={CX}
              y2={CY - IRIS_R + 3 + (i % 5) * 0.9}
              stroke="rgba(229, 233, 212, 0.32)"
              strokeLinecap="round"
              strokeWidth={i % 5 === 0 ? 0.58 : 0.28}
              opacity={i % 7 === 0 ? 0.34 : 1}
              transform={`rotate(${(360 / IRIS_RAY_COUNT) * i} ${CX} ${CY})`}
            />
          ))}
        </g>
        <circle
          cx={CX}
          cy={CY}
          r={IRIS_R - 6}
          fill="transparent"
          stroke="rgba(231, 225, 200, 0.16)"
          strokeWidth={0.8}
        />
        <circle
          cx={CX}
          cy={CY}
          r={IRIS_R - 13}
          fill="transparent"
          stroke="rgba(231, 225, 200, 0.1)"
          strokeWidth={0.7}
        />

        <circle
          cx={CX}
          cy={CY}
          r={PUPIL_R}
          fill="url(#eye-consent-void)"
        />
      </g>

      <circle
        cx={CX}
        cy={CY}
        r={23}
        fill="transparent"
        stroke="rgba(220, 218, 196, 0.3)"
        strokeWidth={0.9}
        opacity={0}
      />

      <g opacity={0}>
        <circle
          cx={CX}
          cy={CY}
          r={17.5}
          fill="transparent"
          stroke="rgba(224, 225, 204, 0.12)"
          strokeWidth={0.7}
        />
        <polygon
          points={`${CX - 5},${CY - 7} ${CX - 5},${CY + 7} ${CX + 8},${CY}`}
          fill="rgba(222, 225, 205, 0.64)"
          stroke="rgba(246, 239, 212, 0.2)"
          strokeWidth={0.45}
          opacity={0}
        />
        <g opacity={0}>
          <rect
            x={CX - 7}
            y={CY - 7}
            width={14}
            height={14}
            rx={0.6}
            fill="rgba(216, 222, 202, 0.62)"
            stroke="rgba(246, 239, 212, 0.2)"
            strokeWidth={0.45}
          />
        </g>
      </g>

      <path
        {...lidPath("upperLid")}
        data-eye-artwork
        fill="none"
        stroke="url(#eye-consent-upper-lid)"
        strokeWidth={1.65}
        strokeLinecap="round"
        opacity={0.92}
      />
      <path
        {...lidPath("lowerLid")}
        data-eye-artwork
        fill="none"
        stroke="url(#eye-consent-lower-lid)"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.88}
      />
    </svg>
  );
}

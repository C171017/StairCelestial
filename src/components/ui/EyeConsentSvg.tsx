"use client";

import type { RefObject } from "react";

export type EyeConsentRefs = {
  eyeAperture: RefObject<SVGPathElement | null>;
  upperLid: RefObject<SVGPathElement | null>;
  lowerLid: RefObject<SVGPathElement | null>;
  scleraExtras: RefObject<SVGGElement | null>;
  iris: RefObject<SVGCircleElement | null>;
  pupil: RefObject<SVGCircleElement | null>;
  pupilHighlight: RefObject<SVGCircleElement | null>;
  playRing: RefObject<SVGCircleElement | null>;
  playIcon: RefObject<SVGPolygonElement | null>;
  pauseIcon: RefObject<SVGGElement | null>;
  iconGroup: RefObject<SVGGElement | null>;
};

type EyeConsentSvgProps = {
  refs: EyeConsentRefs;
};

const CX = 100;
const CY = 100;
const IRIS_R = 29;
const PUPIL_R = 12;
const IRIS_RAY_COUNT = 40;

export const EYE_LID_PATHS = {
  apertureClosed: "M 12 103 C 48 99 143 96 190 96 C 145 104 51 107 12 103 Z",
  apertureOpen: "M 11 103 C 43 55 127 31 190 94 C 158 145 57 157 11 103 Z",
  upperClosed: "M 12 103 C 48 99 143 96 190 96",
  lowerClosed: "M 12 103 C 51 107 145 104 190 96",
  upperOpen: "M 11 103 C 43 55 127 31 190 94",
  lowerOpen: "M 11 103 C 57 157 158 145 190 94",
};

export function EyeConsentSvg({ refs }: EyeConsentSvgProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="size-full"
      aria-hidden
    >
      <defs>
        <clipPath id="eye-consent-aperture">
          <path ref={refs.eyeAperture} d={EYE_LID_PATHS.apertureClosed} />
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
        <filter id="eye-consent-rim-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g ref={refs.scleraExtras} opacity={0}>
        <path
          d="M 10 103 C 44 53 128 31 191 94 C 156 121 58 130 10 103 Z"
          fill="#030508"
          opacity={0.82}
        />
        <path
          d="M 9 103 C 42 70 133 55 191 94 C 156 151 54 162 9 103 Z"
          fill="url(#eye-consent-aperture-shadow)"
          opacity={0.9}
        />
        <path
          d="M 12 101 C 43 58 127 31 189 93"
          fill="none"
          stroke="rgba(245, 239, 214, 0.18)"
          strokeWidth={8}
          strokeLinecap="round"
          filter="url(#eye-consent-rim-glow)"
          opacity={0.42}
        />
        <path
          d="M 13 101 C 44 56 127 32 188 93"
          fill="none"
          stroke="url(#eye-consent-upper-lid)"
          strokeWidth={3.4}
          strokeLinecap="round"
          filter="url(#eye-consent-rim-glow)"
          opacity={0.94}
        />
        <path
          d="M 13 104 C 58 153 157 144 189 94"
          fill="none"
          stroke="url(#eye-consent-lower-lid)"
          strokeWidth={2.5}
          strokeLinecap="round"
          filter="url(#eye-consent-rim-glow)"
          opacity={0.84}
        />
        <path
          d="M 27 102 C 63 83 131 77 171 96"
          fill="none"
          stroke="rgba(184, 194, 179, 0.08)"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
        <path
          d="M 27 110 C 67 129 132 124 171 99"
          fill="none"
          stroke="rgba(233, 223, 195, 0.15)"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      </g>

      <g clipPath="url(#eye-consent-aperture)">
        <path
          d={EYE_LID_PATHS.apertureOpen}
          fill="url(#eye-consent-aperture-shadow)"
          opacity={0.92}
        />
        <circle
          ref={refs.iris}
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
          ref={refs.pupil}
          cx={CX}
          cy={CY}
          r={PUPIL_R}
          fill="url(#eye-consent-void)"
        />

        <circle
          ref={refs.pupilHighlight}
          cx={CX - 8}
          cy={CY - 9}
          r={1.3}
          fill="rgba(240, 234, 208, 0.28)"
        />
      </g>

      <circle
        ref={refs.playRing}
        cx={CX}
        cy={CY}
        r={23}
        fill="transparent"
        stroke="rgba(220, 218, 196, 0.26)"
        strokeWidth={0.9}
        filter="url(#eye-consent-soft-glow)"
        opacity={0}
      />

      <g ref={refs.iconGroup} opacity={0}>
        <circle
          cx={CX}
          cy={CY}
          r={17.5}
          fill="transparent"
          stroke="rgba(224, 225, 204, 0.12)"
          strokeWidth={0.7}
        />
        <circle
          cx={CX}
          cy={CY}
          r={28}
          fill="transparent"
          stroke="rgba(224, 225, 204, 0.09)"
          strokeWidth={0.65}
          strokeDasharray="2 8"
        />
        <polygon
          ref={refs.playIcon}
          points={`${CX - 5},${CY - 7} ${CX - 5},${CY + 7} ${CX + 8},${CY}`}
          fill="rgba(222, 225, 205, 0.64)"
          stroke="rgba(246, 239, 212, 0.2)"
          strokeWidth={0.45}
          opacity={0}
        />
        <g ref={refs.pauseIcon} opacity={0}>
          <rect
            x={CX - 8}
            y={CY - 9}
            width={4.5}
            height={18}
            rx={1}
            fill="rgba(216, 222, 202, 0.62)"
          />
          <rect
            x={CX + 3.5}
            y={CY - 9}
            width={4.5}
            height={18}
            rx={1}
            fill="rgba(216, 222, 202, 0.62)"
          />
        </g>
      </g>

      <path
        ref={refs.upperLid}
        d={EYE_LID_PATHS.upperClosed}
        fill="none"
        stroke="url(#eye-consent-upper-lid)"
        strokeWidth={1.55}
        strokeLinecap="round"
        filter="url(#eye-consent-rim-glow)"
      />
      <path
        ref={refs.lowerLid}
        d={EYE_LID_PATHS.lowerClosed}
        fill="none"
        stroke="url(#eye-consent-lower-lid)"
        strokeWidth={1.15}
        strokeLinecap="round"
        filter="url(#eye-consent-soft-glow)"
      />
    </svg>
  );
}

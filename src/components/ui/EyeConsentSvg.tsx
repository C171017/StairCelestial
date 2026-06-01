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
const IRIS_R = 32;
const PUPIL_R = 11;

export const EYE_LID_PATHS = {
  apertureClosed: "M 34 100 C 62 100 138 100 166 100 C 138 100 62 100 34 100 Z",
  apertureOpen: "M 34 100 C 58 48 142 48 166 100 C 142 152 58 152 34 100 Z",
  upperClosed: "M 34 100 C 62 100 138 100 166 100",
  lowerClosed: "M 34 100 C 62 100 138 100 166 100",
  upperOpen: "M 34 100 C 58 48 142 48 166 100",
  lowerOpen: "M 34 100 C 58 152 142 152 166 100",
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
        <radialGradient id="eye-consent-iris" cx="42%" cy="36%" r="72%">
          <stop offset="0%" stopColor="#f8e7bd" stopOpacity="0.92" />
          <stop offset="42%" stopColor="#8fb7a5" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#243635" stopOpacity="0.98" />
        </radialGradient>
        <radialGradient id="eye-consent-sheen" cx="48%" cy="50%" r="54%">
          <stop offset="0%" stopColor="#f5deb3" stopOpacity="0.18" />
          <stop offset="64%" stopColor="#f5deb3" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#f5deb3" stopOpacity="0" />
        </radialGradient>
        <filter id="eye-consent-soft-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g ref={refs.scleraExtras} opacity={0}>
        <path
          d={EYE_LID_PATHS.apertureOpen}
          fill="url(#eye-consent-sheen)"
          opacity={0.85}
        />
        <path
          d="M 55 98 C 76 76 124 76 145 98"
          fill="none"
          stroke="rgba(245, 222, 179, 0.18)"
          strokeWidth={0.9}
          strokeLinecap="round"
        />
        <path
          d="M 57 103 C 78 124 122 124 143 103"
          fill="none"
          stroke="rgba(143, 183, 165, 0.14)"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      </g>

      <g clipPath="url(#eye-consent-aperture)">
        <circle
          ref={refs.iris}
          cx={CX}
          cy={CY}
          r={IRIS_R}
          fill="url(#eye-consent-iris)"
          stroke="rgba(245, 222, 179, 0.55)"
          strokeWidth={1.4}
          filter="url(#eye-consent-soft-glow)"
        />

        <circle
          ref={refs.pupil}
          cx={CX}
          cy={CY}
          r={PUPIL_R}
          fill="#020305"
        />

        <circle
          ref={refs.pupilHighlight}
          cx={CX - 7}
          cy={CY - 7}
          r={4}
          fill="rgba(248, 231, 189, 0.42)"
        />
      </g>

      <circle
        ref={refs.playRing}
        cx={CX}
        cy={CY}
        r={IRIS_R}
        fill="transparent"
        stroke="rgba(245, 222, 179, 0.92)"
        strokeWidth={1.8}
        filter="url(#eye-consent-soft-glow)"
        opacity={0}
      />

      <g ref={refs.iconGroup}>
        <polygon
          ref={refs.playIcon}
          points={`${CX - 9},${CY - 12} ${CX - 9},${CY + 12} ${CX + 14},${CY}`}
          fill="rgba(245, 222, 179, 0.96)"
          opacity={0}
        />
        <g ref={refs.pauseIcon} opacity={0}>
          <rect
            x={CX - 11}
            y={CY - 12}
            width={7}
            height={24}
            rx={1}
            fill="rgba(245, 222, 179, 0.96)"
          />
          <rect
            x={CX + 4}
            y={CY - 12}
            width={7}
            height={24}
            rx={1}
            fill="rgba(245, 222, 179, 0.96)"
          />
        </g>
      </g>

      <path
        ref={refs.upperLid}
        d={EYE_LID_PATHS.upperClosed}
        fill="none"
        stroke="rgba(245, 222, 179, 0.78)"
        strokeWidth={1.3}
        strokeLinecap="round"
        filter="url(#eye-consent-soft-glow)"
      />
      <path
        ref={refs.lowerLid}
        d={EYE_LID_PATHS.lowerClosed}
        fill="none"
        stroke="rgba(143, 183, 165, 0.42)"
        strokeWidth={1}
        strokeLinecap="round"
      />
    </svg>
  );
}

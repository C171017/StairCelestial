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
const IRIS_R = 30;
const PUPIL_R = 9.5;

export const EYE_LID_PATHS = {
  apertureClosed: "M 20 101 C 58 99 143 99 180 99 C 144 102 58 102 20 101 Z",
  apertureOpen: "M 16 101 C 48 39 151 35 184 98 C 143 150 55 155 16 101 Z",
  upperClosed: "M 20 101 C 58 99 143 99 180 99",
  lowerClosed: "M 20 101 C 58 102 144 102 180 99",
  upperOpen: "M 16 101 C 48 39 151 35 184 98",
  lowerOpen: "M 16 101 C 55 155 143 150 184 98",
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
        <radialGradient id="eye-consent-iris" cx="43%" cy="37%" r="74%">
          <stop offset="0%" stopColor="#d7e3ce" stopOpacity="0.78" />
          <stop offset="38%" stopColor="#5f8780" stopOpacity="0.58" />
          <stop offset="76%" stopColor="#172322" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#030507" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="eye-consent-aperture-shadow" cx="50%" cy="50%" r="62%">
          <stop offset="0%" stopColor="#839b91" stopOpacity="0.1" />
          <stop offset="62%" stopColor="#23302f" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#030508" stopOpacity="0.86" />
        </radialGradient>
        <filter id="eye-consent-soft-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="0.95" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g ref={refs.scleraExtras} opacity={0}>
        <path
          d={EYE_LID_PATHS.apertureOpen}
          fill="url(#eye-consent-aperture-shadow)"
          opacity={0.9}
        />
        <path
          d="M 34 95 C 62 61 136 56 166 95"
          fill="none"
          stroke="rgba(174, 188, 170, 0.18)"
          strokeWidth={0.75}
          strokeLinecap="round"
        />
        <path
          d="M 36 106 C 68 132 134 130 164 102"
          fill="none"
          stroke="rgba(94, 128, 121, 0.16)"
          strokeWidth={0.65}
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
          stroke="rgba(201, 211, 190, 0.28)"
          strokeWidth={1}
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
          cx={CX - 6}
          cy={CY - 6}
          r={2.2}
          fill="rgba(218, 225, 204, 0.34)"
        />
      </g>

      <circle
        ref={refs.playRing}
        cx={CX}
        cy={CY}
        r={23}
        fill="transparent"
        stroke="rgba(205, 215, 193, 0.58)"
        strokeWidth={1}
        strokeDasharray="1 5"
        filter="url(#eye-consent-soft-glow)"
        opacity={0}
      />

      <g ref={refs.iconGroup}>
        <polygon
          ref={refs.playIcon}
          points={`${CX - 6},${CY - 8} ${CX - 6},${CY + 8} ${CX + 9},${CY}`}
          fill="rgba(220, 225, 205, 0.84)"
          opacity={0}
        />
        <g ref={refs.pauseIcon} opacity={0}>
          <rect
            x={CX - 8}
            y={CY - 9}
            width={4.5}
            height={18}
            rx={1}
            fill="rgba(220, 225, 205, 0.84)"
          />
          <rect
            x={CX + 3.5}
            y={CY - 9}
            width={4.5}
            height={18}
            rx={1}
            fill="rgba(220, 225, 205, 0.84)"
          />
        </g>
      </g>

      <path
        ref={refs.upperLid}
        d={EYE_LID_PATHS.upperClosed}
        fill="none"
        stroke="rgba(205, 215, 193, 0.5)"
        strokeWidth={1.05}
        strokeLinecap="round"
        filter="url(#eye-consent-soft-glow)"
      />
      <path
        ref={refs.lowerLid}
        d={EYE_LID_PATHS.lowerClosed}
        fill="none"
        stroke="rgba(93, 126, 119, 0.34)"
        strokeWidth={0.85}
        strokeLinecap="round"
      />
    </svg>
  );
}

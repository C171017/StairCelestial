"use client";

import type { RefObject } from "react";

export type EyeConsentRefs = {
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

export function EyeConsentSvg({ refs }: EyeConsentSvgProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="size-full"
      aria-hidden
    >
      <g ref={refs.scleraExtras}>
        <circle
          cx={CX}
          cy={CY}
          r={IRIS_R + 14}
          fill="#e8eef5"
          fillOpacity={0.12}
        />
        <circle
          cx={CX}
          cy={CY}
          r={IRIS_R + 8}
          fill="#e8eef5"
          fillOpacity={0.08}
          stroke="rgba(165, 243, 252, 0.25)"
          strokeWidth={1}
        />
      </g>

      <circle
        ref={refs.iris}
        cx={CX}
        cy={CY}
        r={IRIS_R}
        fill="rgba(103, 232, 249, 0.55)"
        stroke="rgba(165, 243, 252, 0.7)"
        strokeWidth={1.5}
      />

      <circle
        ref={refs.pupil}
        cx={CX}
        cy={CY}
        r={PUPIL_R}
        fill="#030508"
      />

      <circle
        ref={refs.pupilHighlight}
        cx={CX - 6}
        cy={CY - 6}
        r={4}
        fill="rgba(232, 238, 245, 0.35)"
      />

      <circle
        ref={refs.playRing}
        cx={CX}
        cy={CY}
        r={IRIS_R}
        fill="transparent"
        stroke="rgba(165, 243, 252, 0.85)"
        strokeWidth={2}
        opacity={0}
      />

      <g ref={refs.iconGroup}>
        <polygon
          ref={refs.playIcon}
          points={`${CX - 9},${CY - 12} ${CX - 9},${CY + 12} ${CX + 14},${CY}`}
          fill="rgba(165, 243, 252, 0.95)"
          opacity={0}
        />
        <g ref={refs.pauseIcon} opacity={0}>
          <rect
            x={CX - 11}
            y={CY - 12}
            width={7}
            height={24}
            rx={1}
            fill="rgba(165, 243, 252, 0.95)"
          />
          <rect
            x={CX + 4}
            y={CY - 12}
            width={7}
            height={24}
            rx={1}
            fill="rgba(165, 243, 252, 0.95)"
          />
        </g>
      </g>

      <path
        ref={refs.upperLid}
        d={`M 28 100 Q 100 58 172 100 L 172 48 L 28 48 Z`}
        fill="#030508"
      />
      <path
        ref={refs.lowerLid}
        d={`M 28 100 Q 100 142 172 100 L 172 152 L 28 152 Z`}
        fill="#030508"
      />
    </svg>
  );
}

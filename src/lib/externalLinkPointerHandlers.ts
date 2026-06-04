import type { ThreeEvent } from "@react-three/fiber";

const TAP_MOVE_THRESHOLD_PX = 12;

type TouchStart = { x: number; y: number; id: number };

export type ExternalLinkPointerHandlers = {
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
};

/**
 * Pointer handlers for 3D hit targets that open external URLs.
 * - Mouse: open on pointerdown (click deduped).
 * - Touch: open on pointerup when movement is a tap; click is fallback if needed.
 */
export function createExternalLinkPointerHandlers(
  onOpen: () => void,
): ExternalLinkPointerHandlers {
  const suppressClickRef = { current: false };
  const touchStartRef = { current: null as TouchStart | null };

  return {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (event.pointerType === "mouse" && event.button !== 0) return;

      if (event.pointerType === "touch") {
        touchStartRef.current = {
          x: event.clientX,
          y: event.clientY,
          id: event.pointerId,
        };
        suppressClickRef.current = false;
        return;
      }

      suppressClickRef.current = true;
      onOpen();
    },

    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (event.pointerType !== "touch") return;

      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || start.id !== event.pointerId) return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (dx * dx + dy * dy > TAP_MOVE_THRESHOLD_PX * TAP_MOVE_THRESHOLD_PX) {
        return;
      }

      suppressClickRef.current = true;
      onOpen();
    },

    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      onOpen();
    },
  };
}

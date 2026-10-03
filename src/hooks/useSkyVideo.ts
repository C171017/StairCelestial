"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type SkyVideoStatus = "disabled" | "loading" | "playing" | "paused" | "unavailable";
type SkyVideoState = {
  texture: THREE.VideoTexture | null;
  video: HTMLVideoElement | null;
  status: SkyVideoStatus;
};
type DataConnection = EventTarget & { saveData?: boolean };

/** A still image remains the fallback until a decoded video frame is ready. */
export function useSkyVideo({ src, active }: { src: string; active: boolean }): SkyVideoState {
  const [state, setState] = useState<SkyVideoState>({ texture: null, video: null, status: "paused" });
  const activeRef = useRef(active);
  const controller = useRef<{ sync: () => void } | null>(null);

  // Keep playback intent separate from resource ownership so opening a door or
  // backgrounding the page does not download the same video again.
  useEffect(() => {
    activeRef.current = active;
    controller.current?.sync();
  }, [active]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: DataConnection }).connection;
    let video: HTMLVideoElement | null = null;
    let texture: THREE.VideoTexture | null = null;
    let disposed = false;
    let failed = false;
    let autoplayBlocked = false;
    let pendingPlay = false;
    let playVersion = 0;
    let pendingFrame: number | null = null;
    let removeVideoListeners: (() => void) | null = null;
    let releaseFrameCallbacks: (() => void) | null = null;

    const disabled = () => reducedMotion.matches || connection?.saveData === true;
    const shouldPlay = () => activeRef.current && !document.hidden && !disabled();
    const publish = (status: SkyVideoStatus) => {
      if (disposed) return;
      // Preserve the last decoded frame across brief buffering at a loop join.
      const visibleTexture = status === "disabled" || status === "unavailable" ? null : texture;
      const currentVideo = video;
      setState((previous) => previous.status === status && previous.video === currentVideo && previous.texture === visibleTexture
        ? previous : { status, video: currentVideo, texture: visibleTexture });
    };

    const cancelFrame = () => {
      if (pendingFrame !== null && video?.cancelVideoFrameCallback) video.cancelVideoFrameCallback(pendingFrame);
      pendingFrame = null;
    };

    const release = () => {
      playVersion++;
      pendingPlay = false;
      cancelFrame();
      releaseFrameCallbacks?.();
      releaseFrameCallbacks = null;
      removeVideoListeners?.();
      removeVideoListeners = null;
      if (video) {
        video.pause();
        // Abandon the old network request and decoder, not merely its playback.
        video.removeAttribute("src");
        video.load();
      }
      texture?.dispose();
      texture = null;
      video = null;
    };

    const revealFrame = () => {
      if (disposed || !video || !shouldPlay() || video.paused || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (!texture) {
        texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
      }
      publish("playing");
    };

    const decodedFrame = () => {
      if (disposed || !video || !shouldPlay() || video.paused) return;
      // Wait once for actual presentation where available, avoiding a black
      // texture between play() resolving and the browser decoding its first frame.
      if (texture || !video.requestVideoFrameCallback) {
        revealFrame();
      } else if (pendingFrame === null) {
        const currentVideo = video;
        pendingFrame = currentVideo.requestVideoFrameCallback(() => {
          pendingFrame = null;
          if (video === currentVideo) revealFrame();
        });
      }
    };

    const unavailable = () => {
      if (disposed) return;
      failed = true;
      release();
      publish("unavailable");
    };

    const startPlayback = () => {
      if (!video || disposed || !shouldPlay() || failed || autoplayBlocked || pendingPlay) return;
      if (!video.paused) {
        decodedFrame();
        return;
      }
      const currentVideo = video;
      const version = ++playVersion;
      pendingPlay = true;
      publish("loading");
      const rejected = () => {
        if (disposed || video !== currentVideo || version !== playVersion) return;
        pendingPlay = false;
        if (!shouldPlay()) {
          publish(disabled() ? "disabled" : "paused");
          return;
        }
        // Muted playback can still be denied by browser or low-power policy.
        // Keep the still image and retry only during an explicit user gesture.
        autoplayBlocked = true;
        publish("unavailable");
      };
      try {
        currentVideo.play().then(() => {
          if (disposed || video !== currentVideo || version !== playVersion) return;
          pendingPlay = false;
          if (!shouldPlay()) {
            currentVideo.pause();
            publish(disabled() ? "disabled" : "paused");
          } else {
            decodedFrame();
          }
        }).catch(rejected);
      } catch {
        rejected();
      }
    };

    const sync = () => {
      if (disposed) return;
      if (disabled()) {
        release();
        failed = false;
        autoplayBlocked = false;
        publish("disabled");
        return;
      }
      if (!activeRef.current || document.hidden) {
        playVersion++;
        pendingPlay = false;
        cancelFrame();
        video?.pause();
        publish("paused");
        return;
      }
      if (failed) {
        publish("unavailable");
        return;
      }
      if (!video) {
        if (!src) {
          unavailable();
          return;
        }
        video = document.createElement("video");
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.playsInline = true;
        video.loop = true;
        // Visible cloud drift without accelerating the generated wind motion.
        video.defaultPlaybackRate = 0.8;
        video.playbackRate = 0.8;
        video.preload = "auto";
        video.disablePictureInPicture = true;
        video.setAttribute("playsinline", "");
        video.setAttribute("aria-hidden", "true");
        const currentVideo = video;
        if (currentVideo.requestVideoFrameCallback && currentVideo.cancelVideoFrameCallback) {
          // Three 0.175 schedules its own recursive callback but does not cancel
          // it in VideoTexture.dispose(). Track this element's callbacks so
          // replacing a source releases that callback along with the decoder.
          const requestFrame = currentVideo.requestVideoFrameCallback;
          const cancelVideoFrame = currentVideo.cancelVideoFrameCallback;
          const callbacks = new Set<number>();
          currentVideo.requestVideoFrameCallback = (callback) => {
            const id = requestFrame.call(currentVideo, (now, metadata) => {
              callbacks.delete(id);
              callback(now, metadata);
            });
            callbacks.add(id);
            return id;
          };
          currentVideo.cancelVideoFrameCallback = (id) => {
            callbacks.delete(id);
            cancelVideoFrame.call(currentVideo, id);
          };
          releaseFrameCallbacks = () => {
            for (const id of callbacks) cancelVideoFrame.call(currentVideo, id);
            callbacks.clear();
            currentVideo.requestVideoFrameCallback = requestFrame;
            currentVideo.cancelVideoFrameCallback = cancelVideoFrame;
          };
        }
        const ready = () => {
          if (video !== currentVideo) return;
          if (shouldPlay()) startPlayback();
          decodedFrame();
        };
        const playing = () => {
          if (video !== currentVideo) return;
          autoplayBlocked = false;
          decodedFrame();
        };
        const waiting = () => {
          if (video === currentVideo && shouldPlay() && !autoplayBlocked) publish("loading");
        };
        const paused = () => {
          if (video === currentVideo && !failed && !autoplayBlocked) publish(disabled() ? "disabled" : "paused");
        };
        currentVideo.addEventListener("loadeddata", ready);
        currentVideo.addEventListener("canplay", ready);
        currentVideo.addEventListener("playing", playing);
        currentVideo.addEventListener("waiting", waiting);
        currentVideo.addEventListener("pause", paused);
        currentVideo.addEventListener("error", unavailable);
        removeVideoListeners = () => {
          currentVideo.removeEventListener("loadeddata", ready);
          currentVideo.removeEventListener("canplay", ready);
          currentVideo.removeEventListener("playing", playing);
          currentVideo.removeEventListener("waiting", waiting);
          currentVideo.removeEventListener("pause", paused);
          currentVideo.removeEventListener("error", unavailable);
        };
        try {
          currentVideo.src = src;
          currentVideo.load();
        } catch {
          unavailable();
          return;
        }
      }
      if (autoplayBlocked) publish("unavailable");
      else startPlayback();
    };

    const retryFromGesture = () => {
      if (!autoplayBlocked || !shouldPlay() || failed) return;
      autoplayBlocked = false;
      sync();
    };
    const controls = { sync };
    controller.current = controls;
    reducedMotion.addEventListener("change", sync);
    connection?.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    document.addEventListener("pointerdown", retryFromGesture, { passive: true });
    document.addEventListener("keydown", retryFromGesture);
    sync();

    return () => {
      disposed = true;
      if (controller.current === controls) controller.current = null;
      reducedMotion.removeEventListener("change", sync);
      connection?.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      document.removeEventListener("pointerdown", retryFromGesture);
      document.removeEventListener("keydown", retryFromGesture);
      release();
    };
  }, [src]);

  return state;
}

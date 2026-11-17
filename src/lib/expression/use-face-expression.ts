"use client";

import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { estimateFromFrames, type Blendshapes, type ExpressionEstimate } from "./classify";

export type CameraState = "idle" | "requesting" | "live" | "denied" | "unavailable" | "error";

export class NoFaceError extends Error {
  constructor() {
    super("We couldn't see a face clearly. Try facing the camera in good light.");
    this.name = "NoFaceError";
  }
}

// One landmarker per page load; the model (~3.7 MB) and WASM are served from this app's origin.
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

async function loadLandmarker(): Promise<FaceLandmarker> {
  landmarkerPromise ??= (async () => {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    const options = (delegate: "GPU" | "CPU") => ({
      baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate },
      runningMode: "VIDEO" as const,
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
    });
    try {
      return await FaceLandmarker.createFromOptions(fileset, options("GPU"));
    } catch {
      return await FaceLandmarker.createFromOptions(fileset, options("CPU"));
    }
  })().catch((err) => {
    landmarkerPromise = null; // allow a retry
    throw err;
  });
  return landmarkerPromise;
}

/** Start downloading the model in the background (e.g. while the permission prompt is open). */
export function preloadFaceModel() {
  void loadLandmarker().catch(() => {});
}

export function useFaceExpression() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelRef = useRef(false);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    cancelRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState((s) => (s === "live" || s === "requesting" ? "idle" : s));
  }, []);

  // Always release the camera when the component unmounts or the tab is hidden.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && stop();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      stop();
    };
  }, [stop]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      setError("This browser can't access a camera. Camera access also requires a secure (https) connection.");
      return;
    }
    setState("requesting");
    preloadFaceModel();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      cancelRef.current = false;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      setState("live");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setState("denied");
        setError("Camera permission was declined. No problem: you can pick your mood yourself.");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setState("unavailable");
        setError("We couldn't find a camera on this device.");
      } else {
        setState("error");
        setError("The camera couldn't be started. It may be in use by another app.");
      }
    }
  }, []);

  /**
   * Samples blendshapes for `durationMs` and returns a mood estimate.
   * Frames are read straight from the <video> element in memory; nothing is
   * drawn to a canvas, saved, or sent over the network.
   */
  const analyze = useCallback(async (durationMs = 3000, onProgress?: (p: number) => void): Promise<ExpressionEstimate> => {
    const video = videoRef.current;
    if (!video || !streamRef.current) throw new Error("Camera is not running.");
    const landmarker = await loadLandmarker();
    cancelRef.current = false;

    const frames: Blendshapes[] = [];
    let seen = 0;
    const startedAt = performance.now();
    let lastVideoTime = -1;

    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        if (cancelRef.current) return reject(new Error("Analysis cancelled."));
        const now = performance.now();
        const elapsed = now - startedAt;
        onProgress?.(Math.min(1, elapsed / durationMs));
        if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          seen++;
          const result = landmarker.detectForVideo(video, now);
          const shapes = result.faceBlendshapes?.[0]?.categories;
          if (shapes?.length) {
            const frame: Blendshapes = {};
            for (const c of shapes) frame[c.categoryName] = c.score;
            frames.push(frame);
          }
        }
        if (elapsed >= durationMs) return resolve();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    // Require a face in a reasonable share of frames before guessing anything.
    if (frames.length < 6 || frames.length < seen * 0.4) throw new NoFaceError();
    return estimateFromFrames(frames);
  }, []);

  return { videoRef, state, error, start, stop, analyze };
}

import { describe, expect, it } from "vitest";
import { estimateFromFrames, medianBlendshapes, type Blendshapes } from "./classify";

const face = (b: Blendshapes): Blendshapes[] => Array.from({ length: 15 }, () => ({ ...b }));
const both = (name: string, v: number): Blendshapes => ({ [`${name}Left`]: v, [`${name}Right`]: v });

describe("expression classifier", () => {
  it("treats a relaxed, expressionless face as neutral", () => {
    expect(estimateFromFrames(face({})).mood).toBe("neutral");
  });

  it("detects a clear smile as happy", () => {
    expect(estimateFromFrames(face({ ...both("mouthSmile", 0.75), ...both("cheekSquint", 0.3) })).mood).toBe("happy");
  });

  it("detects a big smile with wide eyes and open mouth as excited", () => {
    const b = { ...both("mouthSmile", 0.8), ...both("eyeWide", 0.5), jawOpen: 0.45 };
    expect(estimateFromFrames(face(b)).mood).toBe("excited");
  });

  it("detects a frown with raised inner brows as sad", () => {
    const b = { ...both("mouthFrown", 0.4), browInnerUp: 0.5, mouthShrugLower: 0.3 };
    expect(estimateFromFrames(face(b)).mood).toBe("sad");
  });

  it("detects lowered brows and pressed lips as stressed", () => {
    const b = { ...both("browDown", 0.55), ...both("mouthPress", 0.4) };
    expect(estimateFromFrames(face(b)).mood).toBe("stressed");
  });

  it("detects a hard scowl with a wrinkled nose and raised upper lip as angry", () => {
    const b = { ...both("browDown", 0.6), ...both("noseSneer", 0.4), ...both("mouthUpperUp", 0.35) };
    expect(estimateFromFrames(face(b)).mood).toBe("angry");
  });

  it("keeps worried, tense brows with pressed lips as stressed rather than angry", () => {
    const b = { ...both("browDown", 0.4), browInnerUp: 0.35, ...both("mouthPress", 0.3) };
    expect(estimateFromFrames(face(b)).mood).toBe("stressed");
  });

  it("detects sustained half-closed eyes as tired", () => {
    const b = { ...both("eyeBlink", 0.6), ...both("eyeLookDown", 0.3) };
    expect(estimateFromFrames(face(b)).mood).toBe("tired");
  });

  it("detects a soft, relaxed smile as calm", () => {
    expect(estimateFromFrames(face(both("mouthSmile", 0.2))).mood).toBe("calm");
  });

  it("ignores normal blinking thanks to the per-frame median", () => {
    const frames = face({});
    frames[3] = both("eyeBlink", 1);
    frames[9] = both("eyeBlink", 1);
    expect(estimateFromFrames(frames).mood).toBe("neutral");
  });

  it("computes element-wise medians", () => {
    expect(medianBlendshapes([{ a: 0 }, { a: 1 }, { a: 0.2 }]).a).toBe(0.2);
    expect(medianBlendshapes([{ a: 0 }, { a: 1 }]).a).toBe(0.5);
  });
});

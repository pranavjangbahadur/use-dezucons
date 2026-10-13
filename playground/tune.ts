import {emotionProfiles, type Emotion, type EmotionProfile} from "../src/emotions.ts"

export type FeelingControls = {
  eyes: EmotionProfile["eyes"]
  brows: EmotionProfile["brows"]
  mouth: EmotionProfile["mouth"]
  blush: boolean
  mouthShift: number
  bobSeconds: number
  bobLift: number
  blinkSeconds: number
  flickerPixels: number
  flickerMs: number
  flickerRandom: number
}

export const eyeModes = ["rest", "wide", "glance", "askew", "shut"] as const
export const browModes = ["none", "inner", "down", "one"] as const
export const mouthModes = ["none", "smile", "frown", "gasp", "line", "dot", "smirk"] as const

function seconds(value: number): string {
  return `${Math.round(value * 100) / 100}s`
}

export function controlsFrom(emotion: Emotion): FeelingControls {
  const profile = emotionProfiles[emotion]
  return {
    eyes: profile.eyes,
    brows: profile.brows,
    mouth: profile.mouth,
    blush: profile.blush,
    mouthShift: profile.mouthShift,
    bobSeconds: Number.parseFloat(profile.bob.duration),
    bobLift: Math.abs(Number.parseFloat(profile.bob.lift)),
    blinkSeconds: profile.blink ? Number.parseFloat(profile.blink) : 0,
    flickerPixels: profile.flicker?.pixelCount ?? 0,
    flickerMs: profile.flicker?.intervalMs ?? 800,
    flickerRandom: profile.flicker?.randomness ?? 1,
  }
}

export function profileFrom(controls: FeelingControls): EmotionProfile {
  return {
    eyes: controls.eyes,
    brows: controls.brows,
    mouth: controls.mouth,
    blush: controls.blush,
    mouthShift: controls.mouthShift,
    bob: {duration: seconds(controls.bobSeconds), lift: `-${controls.bobLift}%`},
    blink: controls.blinkSeconds <= 0 ? null : seconds(controls.blinkSeconds),
    flicker:
      controls.flickerPixels <= 0
        ? null
        : {
            pixelCount: controls.flickerPixels,
            intervalMs: controls.flickerMs,
            randomness: controls.flickerRandom,
          },
  }
}

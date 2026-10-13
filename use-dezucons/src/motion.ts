import {emotionProfiles, idleFlicker, thinkingFlicker, type Emotion, type EmotionProfile} from "./emotions.ts"

export type Motion = {
  pixelCount: number
  intervalMs: number
  randomness: number
}

export type FaceMotion = {
  bob: {duration: string; lift: string}
  blink: string | null
  flicker: Motion | null
}

export const idleMotion: Motion = idleFlicker
export const thinkingMotion: Motion = thinkingFlicker

/** Bob, blink, and flicker are one performance. Still and reduced motion stop all three. */
export function motionFor(
  emotion: Emotion,
  still: boolean,
  reduceMotion: boolean,
  profile?: EmotionProfile,
): FaceMotion | null {
  if (still || reduceMotion) return null
  const chosen = profile ?? emotionProfiles[emotion]
  return {bob: chosen.bob, blink: chosen.blink, flicker: chosen.flicker}
}

export function chooseHidden(prev: number[], pool: number[], motion: Motion, cursor: {current: number}): number[] {
  const len = pool.length
  if (len === 0) return []
  const count = motion.pixelCount < 1 ? 1 : motion.pixelCount > len ? len : motion.pixelCount
  const useRandom = motion.randomness >= 1 || Math.random() < motion.randomness
  if (useRandom) {
    const avoided = pool.filter(index => !prev.includes(index))
    const source = avoided.length >= count ? avoided : pool
    return takeRandom(source, count, [])
  }
  const picked: number[] = []
  for (let left = count; left > 0; left--) {
    const at = cursor.current % len
    cursor.current = cursor.current + 1
    picked.push(pool[at] ?? 0)
  }
  return picked
}

function takeRandom(left: number[], n: number, acc: number[]): number[] {
  if (n <= 0 || left.length === 0) return acc
  const index = Math.floor(Math.random() * left.length)
  const choice = left[index] ?? 0
  const next = left.filter((_, item) => item !== index)
  return takeRandom(next, n - 1, acc.concat(choice))
}

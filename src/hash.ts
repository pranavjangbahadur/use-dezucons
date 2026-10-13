/** Matches the ReScript 32-bit hash in AgentAvatar.res. Classic faces stay on this modulus. */
export const CLASSIC_COUNT = 12

const HASH_MOD = 16777213

export function hashName(name: string): number {
  let acc = 5381
  for (const ch of name.split("")) {
    const code = ch.charCodeAt(0) | 0
    acc = ((Math.imul(acc, 33) + code) | 0) % HASH_MOD
  }
  return acc
}

/** Same face index the dashboard picks today. A negative remainder falls back to the first face. */
export function classicIndex(name: string): number {
  const index = hashName(name) % CLASSIC_COUNT
  return index < 0 ? 0 : index
}

export function motionDelay(name: string): string {
  let step = 0
  for (const ch of name.split("")) {
    step = ((step + (ch.charCodeAt(0) | 0)) | 0) % 8
  }
  return `${Math.imul(step, 180)}ms`
}

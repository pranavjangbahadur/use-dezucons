import type {Emote} from "./emotes.ts"
import type {Emotion} from "./emotions.ts"

export const turnStatuses = ["idle", "thinking", "tool", "tool-result", "tool-error", "answering", "waiting"] as const

export type TurnStatus = (typeof turnStatuses)[number]

export type TurnFace = {
  emotion: Emotion
  emote?: Emote
}

const turnFaces: Record<TurnStatus, TurnFace> = {
  idle: {emotion: "idle"},
  thinking: {emotion: "thinking"},
  tool: {emotion: "confused", emote: "brow"},
  "tool-result": {emotion: "surprised"},
  "tool-error": {emotion: "sad", emote: "tears"},
  answering: {emotion: "happy", emote: "teeth"},
  waiting: {emotion: "sleepy"},
}

/** The face for a core agent action. Angry is never chosen here. */
export function faceForTurn(status: TurnStatus): TurnFace {
  return turnFaces[status]
}

import {isEmote, type Emote} from "./emotes.ts"
import {isEmotion, type Emotion} from "./emotions.ts"

export type Feeling = {
  text: string
  emotion: Emotion
  emote?: Emote
}

const mark = /\[\[feel:([a-z]+)(?::([a-z]+))?\]\]\s*$/

/**
 * Splits a finished reply into the words and the feeling.
 * A missing or unknown mark leaves the emotion idle. The mark is never left in the text.
 */
export function readFeeling(text: string): Feeling {
  const found = text.match(mark)
  if (!found || found.index == null) return {text, emotion: "idle"}
  const namedEmotion = found[1] ?? ""
  const known = isEmotion(namedEmotion)
  const emotion = known ? namedEmotion : "idle"
  const namedEmote = found[2]
  const emote = known && namedEmote && isEmote(namedEmote) ? namedEmote : undefined
  return {
    text: text.slice(0, found.index).trimEnd(),
    emotion,
    emote,
  }
}

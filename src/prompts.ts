import type {Emotion, EmotionProfile} from "./emotions.ts"

export const installCommand = "npm install use-dezucons"

/** Paste this into Cursor, Claude, or any coding agent writing in the repo. */
export const basicAgentPrompt = `Add use-dezucons as the face for our agent chat. Use basic mode.

Run: npm install use-dezucons

Render PixelAvatar with one stable name for the agent. When the agent changes status, call faceForTurn(status) and pass emotion and emote to the face.

Statuses:
- thinking while the model is writing
- tool during a tool call
- tool-result when a result comes back
- answering when the reply is shown
- tool-error when a tool fails
- waiting when the turn returns to the person
- idle when nothing is in flight

Leave the chat model's own prompt alone. The app already knows the status.

import {PixelAvatar, faceForTurn} from "use-dezucons"

const face = faceForTurn(status)

<PixelAvatar name="Nia" emotion={face.emotion} emote={face.emote} />`

/** Paste this into the system prompt the app already sends. */
export const advancedPrompt = `You are an agent whose replies sit next to a pixel face. End every finished reply with one feeling mark after the words, and nowhere else: [[feel:emotion]] or [[feel:emotion:emote]].

Emotions: idle, happy, sad, surprised, angry, thinking, sleepy, confused.
Emotes, optional, a single beat: blink, wink, tears, teeth, melt, acid, tetris, brow, singularity.

Use sad when you cannot do the thing. Use happy when you can. Use surprised when a result is unexpected. Use confused when the ask is ambiguous. Use sleepy when you hand the turn back. Use angry almost never. While you are still working the face is already thinking, so the finished line should say how it landed.

One mark. Short replies. Do not mention the mark in the words.
A corner assistant and a personal contact use the same mark. A contact keeps one stable name, so the face shape never changes and only the feeling does.`

/** Paste this into Cursor, Claude, or any coding agent writing in the repo. */
export const advancedAgentPrompt = `Add use-dezucons as the face for our agent chat. Use advanced mode.

Run: npm install use-dezucons

Paste this into the system prompt the app already sends:

${advancedPrompt}

In the chat screen, before the assistant's message is shown, pass the finished reply through readFeeling. message is that string, whatever the code already calls it. reply.text is the sentence to show. reply.emotion is the feeling for the face. The mark is removed, so the person reading never sees it.

import {PixelAvatar, readFeeling} from "use-dezucons"

const reply = readFeeling(message)

<PixelAvatar name="Nia" emotion={reply.emotion} emote={reply.emote} />
<p>{reply.text}</p>`

export const basicSnippet = `import {PixelAvatar, faceForTurn} from "use-dezucons"

const face = faceForTurn(status)

<PixelAvatar name="Nia" emotion={face.emotion} emote={face.emote} />`

export const readerSnippet = `import {PixelAvatar, readFeeling} from "use-dezucons"

const reply = readFeeling(message)

<PixelAvatar name="Nia" emotion={reply.emotion} emote={reply.emote} />
<p>{reply.text}</p>`

/** A prompt that locks the drawing of one feeling. The emotion name stays. */
export function feelingPrompt(
  emotion: Emotion,
  profile: EmotionProfile,
  emoteScale: number,
  emoteHoldMs: number,
): string {
  const payload = {
    emotion,
    profile,
    emoteScale,
    emoteHoldMs,
  }
  return [
    `Configure use-dezucons for the "${emotion}" feeling only.`,
    `Leave the emotion name "${emotion}" alone. This changes how that feeling is drawn.`,
    "Pass profile, emoteScale, and emoteHoldMs to PixelAvatar.",
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n")
}

import assert from "node:assert/strict"
import test from "node:test"
import {readFeeling} from "../src/feeling.ts"
import {feelingPrompt} from "../src/prompts.ts"
import {faceForTurn} from "../src/turn.ts"
import type {EmotionProfile} from "../src/emotions.ts"

test("basic actions map to a face", () => {
  assert.equal(faceForTurn("thinking").emotion, "thinking")
  assert.equal(faceForTurn("tool").emotion, "confused")
  assert.equal(faceForTurn("tool").emote, "brow")
  assert.equal(faceForTurn("answering").emotion, "happy")
  assert.equal(faceForTurn("answering").emote, "teeth")
  assert.equal(faceForTurn("tool-error").emotion, "sad")
})

test("readFeeling takes the mark off a finished reply", () => {
  const missed = readFeeling("I couldn't find a flight tonight. [[feel:sad]]")
  assert.equal(missed.text, "I couldn't find a flight tonight.")
  assert.equal(missed.emotion, "sad")

  const held = readFeeling("Found a morning one. Want me to hold it? [[feel:happy:teeth]]")
  assert.equal(held.emotion, "happy")
  assert.equal(held.emote, "teeth")
  assert.equal(held.text.includes("[[feel:"), false)

  const plain = readFeeling("The gate is open.")
  assert.equal(plain.text, "The gate is open.")
  assert.equal(plain.emotion, "idle")

  const unknown = readFeeling("Something odd. [[feel:furious]]")
  assert.equal(unknown.text, "Something odd.")
  assert.equal(unknown.emotion, "idle")
  assert.equal(unknown.emote, undefined)
})

test("a custom feeling prompt keeps the eye mode", () => {
  const profile: EmotionProfile = {
    eyes: "glance",
    brows: "one",
    mouth: "dot",
    blush: false,
    mouthShift: 1,
    bob: {duration: "2s", lift: "-8%"},
    blink: "4s",
    flicker: null,
  }
  const prompt = feelingPrompt("thinking", profile, 1.2, 2000)
  assert.match(prompt, /glance/)
  assert.match(prompt, /thinking/)
})

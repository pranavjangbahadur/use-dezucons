import assert from "node:assert/strict"
import test from "node:test"
import {emotes} from "../src/emotes.ts"
import {emotions} from "../src/emotions.ts"
import {simScript} from "../playground/sim.ts"

test("the agent script visits every emotion and emote", () => {
  for (const emotion of emotions) {
    assert.ok(
      simScript.some(beat => beat.emotion === emotion),
      emotion,
    )
  }
  for (const emote of emotes) {
    assert.ok(
      simScript.some(beat => beat.emote === emote.id),
      emote.id,
    )
  }
})

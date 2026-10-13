import assert from "node:assert/strict"
import test from "node:test"
import {emotionProfiles} from "../src/emotions.ts"
import {motionFor} from "../src/motion.ts"

test("still and reduced motion both stop flicker", () => {
  assert.equal(motionFor("idle", true, false), null)
  assert.equal(motionFor("happy", false, true), null)
  assert.equal(motionFor("thinking", true, true), null)
})

test("motion matches the feeling", () => {
  const thinking = motionFor("thinking", false, false)
  const idle = motionFor("idle", false, false)
  const happy = motionFor("happy", false, false)
  const sad = motionFor("sad", false, false)
  const surprised = motionFor("surprised", false, false)
  assert.ok(thinking?.flicker && idle?.flicker && happy && sad && surprised)
  assert.ok(thinking.flicker.intervalMs < idle.flicker.intervalMs)
  assert.ok(thinking.flicker.pixelCount > idle.flicker.pixelCount)
  assert.equal(happy.flicker, null)
  assert.equal(surprised.blink, null)
  assert.ok(parseFloat(happy.bob.duration) < parseFloat(sad.bob.duration))
  assert.ok(parseFloat(happy.bob.lift) < parseFloat(sad.bob.lift))
})

test("an explicit profile replaces the feeling's motion", () => {
  const motion = motionFor("happy", false, false, {
    ...emotionProfiles.happy,
    bob: {duration: "3s", lift: "-2%"},
    blink: "9s",
    flicker: {pixelCount: 4, intervalMs: 100, randomness: 0.25},
  })
  assert.equal(motion?.bob.duration, "3s")
  assert.equal(motion?.blink, "9s")
  assert.equal(motion?.flicker?.pixelCount, 4)
  assert.equal(motion?.flicker?.randomness, 0.25)
})

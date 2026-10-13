import assert from "node:assert/strict"
import {readFileSync} from "node:fs"
import test from "node:test"
import {bodies} from "../src/bodies.ts"
import {applyEmotion, emotionProfiles, emotions} from "../src/emotions.ts"
import {CLASSIC_COUNT} from "../src/hash.ts"

test("each emotion has one performance", () => {
  assert.deepEqual([...emotions].sort(), Object.keys(emotionProfiles).sort())
})

test("idle keeps the classic drawing and every other emotion changes a face that has eyes", () => {
  const pebble = bodies[0]?.rows
  assert.ok(pebble)
  assert.deepEqual(applyEmotion(pebble, "idle"), [...pebble])
  for (const emotion of emotions) {
    if (emotion === "idle") continue
    assert.notDeepEqual(applyEmotion(pebble, emotion), [...pebble], emotion)
  }
})

test("new bodies sit after the classic 12 and do not carry a baked palette", () => {
  assert.equal(bodies.length, CLASSIC_COUNT + 8)
  for (const body of bodies.slice(0, CLASSIC_COUNT)) {
    assert.ok(body.palette, body.id)
    for (const row of body.rows) assert.equal(row.length, 8)
  }
  for (const body of bodies.slice(CLASSIC_COUNT)) {
    assert.equal(body.palette, undefined)
    for (const row of body.rows) assert.equal(row.length, 8)
  }
})

test("an explicit profile is what gets painted", () => {
  const pebble = bodies[0]?.rows
  assert.ok(pebble)
  const smile = {...emotionProfiles.idle, mouth: "smile" as const, blush: true}
  assert.notDeepEqual(applyEmotion(pebble, "idle", smile), applyEmotion(pebble, "idle"))
  assert.deepEqual(applyEmotion(pebble, "happy", emotionProfiles.happy), applyEmotion(pebble, "happy"))
})

test("a feeling stays on the face and the mouth sits below the eyes", () => {
  const pebble = bodies[0]?.rows
  assert.ok(pebble)
  const happy = applyEmotion(pebble, "happy")
  const surprised = applyEmotion(pebble, "surprised")
  for (let y = 0; y < pebble.length; y++) {
    const before = pebble[y] ?? ""
    const after = happy[y] ?? ""
    for (let x = 0; x < before.length; x++) {
      if (before[x] === "." ) assert.equal(after[x], ".", `happy painted empty space at ${x},${y}`)
    }
  }
  const eyeRow = pebble.findIndex(row => row.includes("e"))
  const mouthRow = happy.findIndex(row => row.includes("k"))
  assert.ok(eyeRow >= 0)
  assert.ok(mouthRow > eyeRow)
  assert.ok(surprised.some(row => row.includes("w")))
})

test("reduced motion stops the bob and the blink", () => {
  const css = readFileSync(new URL("../src/pixel-avatar.css", import.meta.url), "utf8")
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /\.pixel-avatar-bob svg rect\.pixel-avatar-eye/)
})

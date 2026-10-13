import assert from "node:assert/strict"
import test from "node:test"
import {bodies} from "../src/bodies.ts"
import {applyEmotion} from "../src/emotions.ts"
import {applyEmote, emoteDuration, emotes} from "../src/emotes.ts"
import {paintRows, type Cell} from "../src/paint.ts"

function pebbleFace(): {cells: Cell[]; rows: string[]} {
  const pebble = bodies[0]
  assert.ok(pebble?.palette)
  const rows = applyEmotion(pebble.rows, "idle")
  return {cells: paintRows(rows, pebble.palette), rows}
}

function eyeCells(cells: readonly Cell[]): Cell[] {
  return cells.filter(cell => cell.eye)
}

test("emotes are the nine overlays", () => {
  assert.deepEqual(
    emotes.map(item => item.id),
    ["blink", "wink", "tears", "teeth", "melt", "acid", "tetris", "brow", "singularity"],
  )
})

test("blink hides and shows one symmetric pair twice", () => {
  const {cells, rows} = pebbleFace()
  const at = (list: readonly Cell[], x: number) => eyeCells(list).find(cell => cell.x === x)
  const fillAt = (list: readonly Cell[], x: number) => list.find(cell => cell.x === x && cell.y === at(cells, x)?.y)?.fill
  assert.equal(emoteDuration.blink, 1000)
  for (const phase of [0.1, 0.6]) {
    const frame = applyEmote(cells, rows, "blink", phase)
    assert.notEqual(fillAt(frame, 2), "#ffffff")
    assert.notEqual(fillAt(frame, 5), "#ffffff")
    assert.equal(at(frame, 3)?.fill, "#ffffff")
  }
  for (const phase of [0.3, 0.85]) {
    const frame = applyEmote(cells, rows, "blink", phase)
    assert.equal(at(frame, 2)?.fill, "#ffffff")
    assert.equal(at(frame, 3)?.fill, "#ffffff")
    assert.equal(at(frame, 5)?.fill, "#ffffff")
  }
  assert.deepEqual(cells, paintRows(rows, bodies[0]!.palette!))
})

test("acid swirls the face through more than one color", () => {
  const {cells, rows} = pebbleFace()
  const frame = applyEmote(cells, rows, "acid", 0.35)
  const colors = new Set(frame.map(cell => cell.fill))
  assert.ok(colors.size > 1)
  assert.equal(frame.length, cells.length)
  assert.ok(frame.some((cell, index) => cell.x !== cells[index]?.x || cell.y !== cells[index]?.y))
})

test("singularity ends as one pixel in the middle", () => {
  const {cells, rows} = pebbleFace()
  const end = applyEmote(cells, rows, "singularity", 0.9)
  assert.equal(end.length, 1)
  assert.equal(end[0]?.x, 3)
  assert.equal(end[0]?.y, 3)
  assert.ok(applyEmote(cells, rows, "singularity", 0).length > 1)
})

test("tears are always two pixels falling together", () => {
  const {cells, rows} = pebbleFace()
  const dark = "#4338ca"
  const frame = applyEmote(cells, rows, "tears", 0.1, dark)
  const drops = frame.filter(cell => cell.fill === dark && cell.y === 3)
  assert.equal(drops.length, 2)
  assert.deepEqual(drops.map(cell => cell.x).sort((a, b) => a - b), [2, 5])
})

test("a face with no eyes still gets a dark pixel where the emote needs one", () => {
  const swirl = bodies.find(body => body.id === "swirl")
  assert.ok(swirl?.palette)
  const rows = applyEmotion(swirl.rows, "idle")
  const cells = paintRows(rows, swirl.palette)
  assert.equal(cells.some(cell => cell.eye), false)
  const dark = swirl.palette.dark
  const blinked = applyEmote(cells, rows, "blink", 0.1, dark)
  assert.ok(blinked.filter(cell => cell.fill === dark).length >= 2)
  const raised = applyEmote(cells, rows, "brow", 0.4, dark)
  assert.ok(raised.some(cell => cell.fill === dark))
})

test("wink shuts only one eye of the pair", () => {
  const {cells, rows} = pebbleFace()
  const frame = applyEmote(cells, rows, "wink", 0.1)
  const at = (x: number) => frame.find(cell => cell.x === x && cell.y === 2)
  assert.equal(at(2)?.fill, "#ffffff")
  assert.notEqual(at(5)?.fill, "#ffffff")
  const open = applyEmote(cells, rows, "wink", 0.3)
  assert.equal(open.find(cell => cell.eye && cell.x === 5)?.fill, "#ffffff")
})

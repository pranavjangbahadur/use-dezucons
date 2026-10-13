import assert from "node:assert/strict"
import test from "node:test"
import {rattleChips, scatterChips, stepPile, type Chip} from "../playground/shapeFall.ts"

test("faces leave together, tumble, and rest in a pile", () => {
  const chips: Chip[] = Array.from({length: 20}, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    w: 76,
    h: 58,
    angle: 0,
    spin: 0,
  }))
  let cursor = 0
  const random = () => {
    cursor = (cursor * 17 + 3) % 100
    return cursor / 100
  }
  scatterChips(chips, 300, 420, random)
  const tops = chips.map(chip => chip.y)
  assert.ok(Math.max(...tops) - Math.min(...tops) < 8)
  assert.ok(chips.every(chip => chip.vy === 0))
  assert.ok(chips.some(chip => chip.angle > 20))

  let settled = false
  for (let frame = 0; frame < 700 && !settled; frame++) settled = stepPile(chips, 300, 420, 1 / 60)
  assert.equal(settled, true)
  for (const chip of chips) {
    assert.ok(chip.x > -chip.w && chip.x < 300, `x ${chip.x}`)
    assert.ok(chip.y + chip.h <= 422, `y ${chip.y}`)
  }
  const averageY = chips.reduce((sum, chip) => sum + chip.y, 0) / chips.length
  assert.ok(averageY > 160, `pile should sit low, average y was ${averageY}`)
  const tilted = chips.filter(chip => Math.abs(((chip.angle % 180) + 180) % 180) > 12).length
  assert.ok(tilted > 3, `faces should be free to rest at an angle, tilted ${tilted}`)
})

test("a shake tosses the pile, then it settles again", () => {
  const chips: Chip[] = Array.from({length: 20}, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    w: 76,
    h: 58,
    angle: 0,
    spin: 0,
  }))
  let cursor = 0
  const random = () => {
    cursor = (cursor * 17 + 3) % 100
    return cursor / 100
  }
  scatterChips(chips, 300, 420, random)
  let settled = false
  for (let frame = 0; frame < 700 && !settled; frame++) settled = stepPile(chips, 300, 420, 1 / 60)
  assert.equal(settled, true)

  const rested = chips.map(chip => ({x: chip.x, y: chip.y}))
  rattleChips(chips, 1, random)
  for (let frame = 0; frame < 40; frame++) stepPile(chips, 300, 420, 1 / 60, true)
  const travel = chips.reduce((sum, chip, index) => {
    const from = rested[index]
    return sum + (from ? Math.hypot(chip.x - from.x, chip.y - from.y) : 0)
  }, 0) / chips.length
  assert.ok(travel > 12, `shake should move the pile, average travel was ${travel}`)

  settled = false
  for (let frame = 0; frame < 900 && !settled; frame++) settled = stepPile(chips, 300, 420, 1 / 60)
  assert.equal(settled, true)
  for (const chip of chips) {
    assert.ok(chip.x > -chip.w && chip.x < 300, `x ${chip.x}`)
    assert.ok(chip.y + chip.h <= 422, `y ${chip.y}`)
  }
})

import assert from "node:assert/strict"
import test from "node:test"
import {bodies, resolveLook} from "../src/bodies.ts"
import {CLASSIC_COUNT, classicIndex} from "../src/hash.ts"

const locked: Record<string, number> = {
  "": 5,
  a: 10,
  Mettle: 2,
  "pixel-avatar": 6,
}

test("a name keeps the classic face it has today", () => {
  for (const [name, index] of Object.entries(locked)) {
    assert.equal(classicIndex(name), index, name)
    const look = resolveLook({name})
    assert.equal(look.shapeIndex, index)
    assert.equal(look.palette.id, bodies[index]?.palette?.id)
  }
})

test("an explicit new shape does not change which classic face the name hashes to", () => {
  const name = "Mettle"
  assert.equal(classicIndex(name), locked[name])
  const extra = resolveLook({name, shape: CLASSIC_COUNT})
  assert.equal(extra.shapeIndex, CLASSIC_COUNT)
  assert.equal(classicIndex(name), locked[name])
  assert.notEqual(extra.palette.id, bodies[0]?.palette?.id)
})

test("a classic shape keeps its baked palette until a shared palette is chosen", () => {
  const baked = resolveLook({name: "Mettle", shape: 3})
  assert.equal(baked.palette.id, "sprout")
  const recolored = resolveLook({name: "Mettle", shape: 3, palette: "mint"})
  assert.equal(recolored.palette.id, "mint")
  assert.equal(recolored.shapeIndex, 3)
})

import type {Cell} from "./paint.ts"

export const emotes = [
  {id: "blink", label: "Blink"},
  {id: "wink", label: "Wink"},
  {id: "tears", label: "Tears"},
  {id: "teeth", label: "Show teeth"},
  {id: "melt", label: "Melt"},
  {id: "acid", label: "Acid"},
  {id: "tetris", label: "Tetris"},
  {id: "brow", label: "Raise brow"},
  {id: "singularity", label: "Singularity"},
] as const

export type Emote = (typeof emotes)[number]["id"]

const SIZE = 8
const TOOTH = "#ffffff"
const TRIP = ["#ff2bd6", "#ffe600", "#39ff14", "#00f0ff", "#7b5cff", "#ff5a1f"]

/** Length of one cycle. The player repeats cycles until the press has lasted at least two seconds. */
export const emoteDuration: Record<Emote, number> = {
  blink: 1000,
  wink: 900,
  tears: 1400,
  teeth: 700,
  melt: 1600,
  acid: 3200,
  tetris: 1800,
  brow: 1000,
  singularity: 1600,
}

export const EMOTE_MIN_MS = 2000

export function isEmote(value: string | undefined): value is Emote {
  return emotes.some(item => item.id === value)
}

/**
 * One frame of an emote on top of an already painted emotion.
 * Phase runs from 0 to 1. The result is a new cell list. The emotion grid is not changed.
 */
export function applyEmote(
  cells: readonly Cell[],
  rows: readonly string[],
  emote: Emote,
  phase: number,
  dark = "#1c1917",
): Cell[] {
  const t = phase < 0 ? 0 : phase > 1 ? 1 : phase
  switch (emote) {
    case "blink":
      return blink(cells, t, dark)
    case "wink":
      return wink(cells, t, dark)
    case "tears":
      return tears(cells, t, dark)
    case "teeth":
      return teeth(cells, rows, t)
    case "melt":
      return melt(cells, t)
    case "acid":
      return acid(cells, t)
    case "tetris":
      return tetris(cells, t)
    case "brow":
      return brow(cells, t, dark)
    case "singularity":
      return singularity(cells, t, dark)
  }
}

function copy(cells: readonly Cell[]): Cell[] {
  return cells.map(cell => ({...cell}))
}

function eyesOf(cells: readonly Cell[]): Cell[] {
  return cells.filter(cell => cell.eye).sort((a, b) => a.y - b.y || a.x - b.x)
}

function clustersOf(eyes: readonly Cell[]): Cell[][] {
  const groups: Cell[][] = []
  for (const eye of eyes) {
    const group = groups[groups.length - 1]
    const prev = group?.[group.length - 1]
    if (group && prev && prev.y === eye.y && prev.x + 1 === eye.x) group.push(eye)
    else groups.push([eye])
  }
  return groups
}

function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y && a.eye === b.eye
}

/** Two eye pixels that mirror each other across the sprite. */
function symmetricEyes(cells: readonly Cell[]): Cell[] {
  const eyes = eyesOf(cells)
  const pairs: Cell[][] = []
  for (const eye of eyes) {
    if (eye.x >= SIZE / 2) continue
    const mirror = eyes.find(other => other !== eye && other.y === eye.y && other.x === SIZE - 1 - eye.x)
    if (mirror) pairs.push([eye, mirror])
  }
  const pair = pairs.sort((a, b) => (a[0]?.x ?? 0) - (b[0]?.x ?? 0))[0]
  if (pair) return pair
  if (eyes.length < 2) return eyes.slice(0, 1)
  return [eyes[0] ?? eyes[eyes.length - 1], eyes[eyes.length - 1]].filter((eye): eye is Cell => eye != null)
}

/** Hidden, shown, hidden, shown. Two flashes inside the one-second play. */
function blinkHidden(phase: number): boolean {
  return Math.floor(phase * 4) % 2 === 0
}

/** Two spots to act on when the drawing has no eye pixels, as on Swirl. */
function eyeAnchors(cells: readonly Cell[]): {x: number; y: number}[] {
  const pair = symmetricEyes(cells)
  if (pair.length >= 2) {
    const left = pair[0]
    const right = pair[pair.length - 1]
    if (left && right) return [{x: left.x, y: Math.round(left.y)}, {x: right.x, y: Math.round(right.y)}]
  }
  const ys = cells.map(cell => cell.y)
  const y = ys.length === 0 ? 2 : Math.round(Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * 0.35)
  return [{x: 2, y}, {x: 5, y}]
}

function paintDark(cells: readonly Cell[], spots: readonly {x: number; y: number}[], dark: string): Cell[] {
  const next = copy(cells)
  for (const spot of spots) {
    const found = next.find(cell => cell.x === spot.x && Math.round(cell.y) === spot.y)
    if (found) {
      found.fill = dark
      found.eye = false
    } else next.push({x: spot.x, y: spot.y, fill: dark, eye: false})
  }
  return next
}

function shutEyes(cells: readonly Cell[], targets: readonly Cell[], phase: number, dark: string): Cell[] {
  if (!blinkHidden(phase)) return copy(cells)
  if (targets.length === 0) return paintDark(cells, eyeAnchors(cells).slice(0, 2), dark)
  return cells.map(cell => (targets.some(target => sameCell(target, cell)) ? {...cell, fill: dark, eye: false} : {...cell}))
}

function blink(cells: readonly Cell[], phase: number, dark: string): Cell[] {
  return shutEyes(cells, symmetricEyes(cells), phase, dark)
}

function wink(cells: readonly Cell[], phase: number, dark: string): Cell[] {
  const pair = symmetricEyes(cells)
  const one = pair[pair.length - 1]
  if (one) return shutEyes(cells, [one], phase, dark)
  if (!blinkHidden(phase)) return copy(cells)
  const spot = eyeAnchors(cells)[1] ?? eyeAnchors(cells)[0]
  return spot ? paintDark(cells, [spot], dark) : copy(cells)
}

function tears(cells: readonly Cell[], phase: number, dark: string): Cell[] {
  const pair = symmetricEyes(cells)
  const anchors = pair.length >= 2 ? pair : eyeAnchors(cells)
  const left = anchors[0]
  const right = anchors[anchors.length - 1]
  if (!left || !right) return copy(cells)
  const drop = Math.floor(phase * SIZE)
  const y = Math.round(left.y) + 1 + drop
  if (y >= SIZE) return copy(cells)
  const secondX = left.x === right.x ? Math.min(SIZE - 1, left.x + 1) : right.x
  return paintDark(cells, [{x: left.x, y}, {x: secondX, y}], dark)
}

function mouthSpots(rows: readonly string[], cells: readonly Cell[]): {x: number; y: number}[] {
  const eyes = eyesOf(cells)
  const lowest = eyes.length === 0 ? 2 : Math.max(...eyes.map(eye => Math.round(eye.y)))
  const spots: {x: number; y: number}[] = []
  for (let y = lowest + 1; y < SIZE; y++) {
    const row = rows[y] ?? ""
    for (let x = 0; x < SIZE; x++) {
      const ch = row[x]
      if (ch === "k" || ch === "w") spots.push({x, y})
    }
  }
  return spots
}

function teeth(cells: readonly Cell[], rows: readonly string[], phase: number): Cell[] {
  if (phase >= 0.5) return copy(cells)
  const spots = mouthSpots(rows, cells)
  if (spots.length === 0) {
    const eyes = eyesOf(cells)
    if (eyes.length === 0) return copy(cells)
    const y = Math.min(SIZE - 1, Math.max(...eyes.map(eye => Math.round(eye.y))) + 2)
    const cx = Math.round(eyes.reduce((sum, eye) => sum + eye.x, 0) / eyes.length)
    return [
      ...copy(cells),
      {x: cx - 1, y, fill: TOOTH, eye: false},
      {x: cx, y, fill: TOOTH, eye: false},
      {x: cx + 1, y, fill: TOOTH, eye: false},
    ]
  }
  return cells.map(cell => (spots.some(spot => spot.x === cell.x && spot.y === cell.y) ? {...cell, fill: TOOTH} : {...cell}))
}

function melt(cells: readonly Cell[], phase: number): Cell[] {
  const drop = Math.floor(phase * SIZE)
  return cells.flatMap(cell => {
    const y = cell.y + drop
    return y >= SIZE ? [] : [{...cell, y}]
  })
}

function acid(cells: readonly Cell[], phase: number): Cell[] {
  const spin = phase * Math.PI * 2
  const cx = (SIZE - 1) / 2
  const cy = cx
  return cells.map(cell => {
    const dx = cell.x - cx
    const dy = cell.y - cy
    const angle = Math.atan2(dy, dx) + spin
    const radius = Math.hypot(dx, dy)
    const turn = (((angle / (Math.PI * 2)) % 1) + 1) % 1
    const fill = TRIP[Math.floor(turn * TRIP.length)] ?? TRIP[0]
    return {
      ...cell,
      x: Math.round(cx + Math.cos(angle) * radius),
      y: Math.round(cy + Math.sin(angle) * radius),
      fill,
      eye: false,
    }
  })
}

function tetris(cells: readonly Cell[], phase: number): Cell[] {
  const ys = [...new Set(cells.map(cell => cell.y))].sort((a, b) => a - b)
  if (ys.length === 0) return []
  const span = 1 / ys.length
  const index = Math.min(ys.length - 1, Math.floor(phase / span))
  const local = (phase - index * span) / span
  const fallingY = ys[index] ?? 0
  const done = new Set(ys.slice(0, index))
  const stacked = new Map<number, number>()
  const next: Cell[] = []
  for (const y of ys.slice(0, index)) {
    for (const cell of cells) {
      if (cell.y !== y) continue
      const n = stacked.get(cell.x) ?? 0
      next.push({...cell, y: SIZE - 1 - n})
      stacked.set(cell.x, n + 1)
    }
  }
  for (const cell of cells) {
    if (done.has(cell.y)) continue
    if (cell.y !== fallingY) {
      next.push({...cell})
      continue
    }
    const n = stacked.get(cell.x) ?? 0
    const target = SIZE - 1 - n
    const y = cell.y + Math.round((target - cell.y) * local)
    next.push({...cell, y})
  }
  return next
}

function brow(cells: readonly Cell[], phase: number, dark: string): Cell[] {
  const groups = clustersOf(eyesOf(cells))
  const raised = phase >= 0.2 && phase < 0.7
  const spots = groups.length
    ? groups.flatMap(group => {
        const eye = group[Math.floor(group.length / 2)] ?? group[0]
        if (!eye) return []
        return [{x: eye.x, y: Math.max(0, Math.round(eye.y) - (raised ? 2 : 1))}]
      })
    : eyeAnchors(cells).map(spot => ({x: spot.x, y: Math.max(0, spot.y - (raised ? 2 : 1))}))
  return paintDark(cells, spots, dark)
}

const MIDDLE = 3

function singularity(cells: readonly Cell[], phase: number, dark: string): Cell[] {
  if (cells.length === 0 || phase === 0) return copy(cells)
  if (phase >= 0.65) return [{x: MIDDLE, y: MIDDLE, fill: dark, eye: false}]
  const t = phase / 0.65
  return cells.map(cell => ({
    ...cell,
    x: Math.round(cell.x + (MIDDLE - cell.x) * t),
    y: Math.round(cell.y + (MIDDLE - cell.y) * t),
  }))
}

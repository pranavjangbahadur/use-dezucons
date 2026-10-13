export const emotions = [
  "idle",
  "happy",
  "sad",
  "surprised",
  "angry",
  "thinking",
  "sleepy",
  "confused",
] as const

export type Emotion = (typeof emotions)[number]

export function isEmotion(value: string): value is Emotion {
  return (emotions as readonly string[]).includes(value)
}

export type Flicker = {
  pixelCount: number
  intervalMs: number
  randomness: number
}

/** Quiet life in the idle face. Thinking reuses this channel, faster. */
export const idleFlicker: Flicker = {pixelCount: 1, intervalMs: 1200, randomness: 1}
export const thinkingFlicker: Flicker = {pixelCount: 3, intervalMs: 320, randomness: 1}

type EyeMode = "rest" | "wide" | "glance" | "askew" | "shut"
type BrowMode = "none" | "inner" | "down" | "one"
type MouthMode = "none" | "smile" | "frown" | "gasp" | "line" | "dot" | "smirk"

export type EmotionProfile = {
  eyes: EyeMode
  brows: BrowMode
  mouth: MouthMode
  /** Cheek color sits beside a smile. It is the part of happiness the eyes cannot show at one pixel. */
  blush: boolean
  /** Where a one-pixel mouth sits relative to center. Glance and smirk pull it to the side. */
  mouthShift: number
  bob: {duration: string; lift: string}
  /** Null holds the lids still: a gasp stays wide, sleep stays shut. */
  blink: string | null
  /** Null keeps the drawing still. Flicker is agitation, not a feeling by itself. */
  flicker: Flicker | null
}

/**
 * Each feeling is a face plus a way of moving.
 * The face only rewrites skin (l, m) already on the head: taller eyes, a brow, a mouth on the lower face.
 * Bob, blink, and flicker carry the rest. A smile bounces. Sadness is heavy. Surprise holds still. Thinking searches.
 */
export const emotionProfiles: Record<Emotion, EmotionProfile> = {
  idle: {
    eyes: "rest",
    brows: "none",
    mouth: "none",
    blush: false,
    mouthShift: 0,
    bob: {duration: "7s", lift: "-8%"},
    blink: "12s",
    flicker: idleFlicker,
  },
  happy: {
    eyes: "rest",
    brows: "none",
    mouth: "smile",
    blush: true,
    mouthShift: 0,
    bob: {duration: "1.35s", lift: "-18%"},
    blink: "2.4s",
    flicker: null,
  },
  sad: {
    eyes: "rest",
    brows: "inner",
    mouth: "frown",
    blush: false,
    mouthShift: 0,
    bob: {duration: "11s", lift: "-4%"},
    blink: "16s",
    flicker: null,
  },
  surprised: {
    eyes: "wide",
    brows: "none",
    mouth: "gasp",
    blush: false,
    mouthShift: 0,
    bob: {duration: "5s", lift: "-3%"},
    blink: null,
    flicker: null,
  },
  angry: {
    eyes: "rest",
    brows: "down",
    mouth: "line",
    blush: false,
    mouthShift: 0,
    bob: {duration: "4.5s", lift: "-3%"},
    blink: "5s",
    flicker: {pixelCount: 2, intervalMs: 800, randomness: 1},
  },
  thinking: {
    eyes: "glance",
    brows: "none",
    mouth: "dot",
    blush: false,
    mouthShift: 1,
    bob: {duration: "8s", lift: "-6%"},
    blink: "18s",
    flicker: thinkingFlicker,
  },
  sleepy: {
    eyes: "shut",
    brows: "none",
    mouth: "dot",
    blush: false,
    mouthShift: 0,
    bob: {duration: "12s", lift: "-5%"},
    blink: null,
    flicker: null,
  },
  confused: {
    eyes: "askew",
    brows: "one",
    mouth: "smirk",
    blush: false,
    mouthShift: 1,
    bob: {duration: "6s", lift: "-7%"},
    blink: "10s",
    flicker: {pixelCount: 2, intervalMs: 900, randomness: 1},
  },
}

const SIZE = 8

type Cell = {x: number; y: number}
type Run = {y: number; start: number; end: number}

function gridOf(rows: readonly string[]): string[][] {
  return Array.from({length: SIZE}, (_, y) => {
    const row = rows[y] ?? ""
    return Array.from({length: SIZE}, (_, x) => row[x] ?? ".")
  })
}

function eyesOf(grid: string[][]): Cell[] {
  const eyes: Cell[] = []
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (grid[y][x] === "e") eyes.push({x, y})
    }
  }
  return eyes
}

/** Neighboring eye pixels on one row are one eye. */
function clustersOf(eyes: Cell[]): Cell[][] {
  const sorted = [...eyes].sort((a, b) => a.y - b.y || a.x - b.x)
  const groups: Cell[][] = []
  for (const eye of sorted) {
    const group = groups[groups.length - 1]
    const prev = group?.[group.length - 1]
    if (group && prev && prev.y === eye.y && prev.x + 1 === eye.x) group.push(eye)
    else groups.push([eye])
  }
  return groups
}

function isSkin(ch: string | undefined): boolean {
  return ch === "l" || ch === "m"
}

/** One solid band of cheek. Split rows are feet, pots, and tails, not a mouth. */
function faceRun(grid: string[][], y: number): Run | null {
  if (y < 0 || y >= SIZE) return null
  const xs: number[] = []
  for (let x = 0; x < SIZE; x++) {
    if (isSkin(grid[y][x])) xs.push(x)
  }
  if (xs.length < 3) return null
  const start = xs[0] ?? 0
  const end = xs[xs.length - 1] ?? start
  if (end - start + 1 !== xs.length) return null
  return {y, start, end}
}

function canPaint(grid: string[][], y: number, x: number, run: Run | null): boolean {
  return !!run && y === run.y && x >= run.start && x <= run.end && isSkin(grid[y]?.[x])
}

function paintSkin(grid: string[][], y: number, x: number, ch: string, run: Run | null): boolean {
  if (!canPaint(grid, y, x, run)) return false
  grid[y][x] = ch
  return true
}

function paintReady(grid: string[][], spots: {y: number; x: number; ch: string; run: Run}[]): boolean {
  if (spots.length === 0 || spots.some(spot => !canPaint(grid, spot.y, spot.x, spot.run))) return false
  for (const spot of spots) grid[spot.y][spot.x] = spot.ch
  return true
}

function setSkin(grid: string[][], y: number, x: number, ch: string): boolean {
  if (y < 0 || y >= SIZE || x < 0 || x >= SIZE) return false
  if (!isSkin(grid[y][x])) return false
  grid[y][x] = ch
  return true
}

function applyEyes(grid: string[][], eyes: Cell[], groups: Cell[][], mode: EyeMode) {
  if (mode === "shut") {
    for (const eye of eyes) grid[eye.y][eye.x] = "k"
    return
  }
  if (mode === "wide") {
    for (const eye of eyes) setSkin(grid, eye.y - 1, eye.x, "e")
    return
  }
  if (mode === "glance") {
    for (const group of [...groups].reverse()) {
      const right = group[group.length - 1]
      const left = group[0]
      if (!right || !left) continue
      const dest = grid[right.y]?.[right.x + 1]
      if (dest !== "l" && dest !== "m" && dest !== "w") continue
      grid[right.y][right.x + 1] = "e"
      grid[left.y][left.x] = "l"
    }
    return
  }
  if (mode === "askew") {
    const raised = [...groups].sort((a, b) => (b[0]?.x ?? 0) - (a[0]?.x ?? 0))[0]
    if (!raised) return
    const lifting = groups.length < 2 ? raised.slice(-1) : raised
    const canLift = lifting.every(eye => isSkin(grid[eye.y - 1]?.[eye.x]))
    if (!canLift) return
    for (const eye of lifting) grid[eye.y - 1][eye.x] = "e"
    for (const eye of lifting) grid[eye.y][eye.x] = "l"
  }
}

function applyBrows(grid: string[][], groups: Cell[][], mode: BrowMode, cx: number) {
  if (mode === "none" || groups.length === 0) return
  if (mode === "down") {
    for (const group of groups) {
      for (const eye of group) setSkin(grid, eye.y - 1, eye.x, "k")
    }
    return
  }
  if (mode === "one") {
    const group = [...groups].sort((a, b) => (a[0]?.x ?? 0) - (b[0]?.x ?? 0))[0]
    const eye = group?.[Math.floor((group.length - 1) / 2)]
    if (eye) setSkin(grid, eye.y - 1, eye.x, "k")
    return
  }
  for (const group of groups) {
    const inner = group.reduce((best, eye) => (Math.abs(eye.x - cx) < Math.abs(best.x - cx) ? eye : best))
    const toward = inner.x < cx ? 1 : inner.x > cx ? -1 : 0
    if (!setSkin(grid, inner.y - 1, inner.x + toward, "k")) setSkin(grid, inner.y - 1, inner.x, "k")
  }
}

function mouthRows(grid: string[][], lowestEye: number): Run[] {
  const rows: Run[] = []
  for (let y = lowestEye + 1; y < SIZE; y++) {
    const run = faceRun(grid, y)
    if (run) rows.push(run)
  }
  return rows
}

function applyMouth(grid: string[][], lowestEye: number, cx: number, profile: EmotionProfile) {
  if (profile.mouth === "none") return
  const rows = mouthRows(grid, lowestEye)
  const lower = rows.length >= 2 ? rows[1] : rows[0]
  if (!lower) return
  const upper = faceRun(grid, lower.y - 1)
  const upperOk = upper != null && upper.y > lowestEye
  const center = Math.min(lower.end, Math.max(lower.start, Math.round(cx) + profile.mouthShift))
  const at = (run: Run, x: number, ch: string) => ({y: run.y, x, ch, run})

  if (profile.mouth === "smile") {
    const curve = [center - 1, center, center + 1].map(x => at(lower, x, "k"))
    if (upperOk && upper) paintReady(grid, [at(upper, center - 2, "k"), at(upper, center + 2, "k")])
    if (!paintReady(grid, curve)) paintSkin(grid, lower.y, center, "k", lower)
    if (profile.blush) {
      const y = upperOk && upper ? upper.y : lower.y
      if (isSkin(grid[y]?.[center - 3]) && isSkin(grid[y]?.[center + 3])) {
        grid[y][center - 3] = "a"
        grid[y][center + 3] = "a"
      }
    }
    return
  }

  if (profile.mouth === "frown") {
    const full =
      upperOk &&
      upper &&
      paintReady(grid, [
        at(upper, center - 1, "k"),
        at(upper, center, "k"),
        at(upper, center + 1, "k"),
        at(lower, center - 2, "k"),
        at(lower, center + 2, "k"),
      ])
    if (!full && !paintReady(grid, [at(lower, center - 1, "k"), at(lower, center + 1, "k")])) {
      paintSkin(grid, lower.y, center, "k", lower)
    }
    return
  }

  if (profile.mouth === "gasp") {
    if (upper && upper.y > lowestEye) {
      paintReady(grid, [at(upper, center - 1, "k"), at(upper, center, "k"), at(upper, center + 1, "k")])
    }
    if (!paintReady(grid, [at(lower, center - 1, "k"), at(lower, center, "w"), at(lower, center + 1, "k")])) {
      paintSkin(grid, lower.y, center, "w", lower)
    }
    return
  }

  if (profile.mouth === "line") {
    for (const dx of [-2, -1, 0, 1, 2]) paintSkin(grid, lower.y, center + dx, "k", lower)
    return
  }

  if (profile.mouth === "smirk") {
    const edge = paintSkin(grid, lower.y, lower.end, "k", lower)
    const beside = paintSkin(grid, lower.y, lower.end - 1, "k", lower)
    if (!edge && !beside) paintSkin(grid, lower.y, center, "k", lower)
    return
  }

  if (!paintSkin(grid, lower.y, center, "k", lower)) paintSkin(grid, lower.y, lower.end, "k", lower)
}

export function applyEmotion(rows: readonly string[], emotion: Emotion, profile?: EmotionProfile): string[] {
  const chosen = profile ?? emotionProfiles[emotion]
  const grid = gridOf(rows)
  const bare = chosen.eyes === "rest" && chosen.brows === "none" && chosen.mouth === "none" && !chosen.blush
  if (bare) return grid.map(row => row.join(""))

  const eyes = eyesOf(grid)
  if (eyes.length === 0) return grid.map(row => row.join(""))

  const groups = clustersOf(eyes)
  const cx = eyes.reduce((sum, eye) => sum + eye.x, 0) / eyes.length
  const lowestEye = Math.max(...eyes.map(eye => eye.y))
  applyEyes(grid, eyes, groups, chosen.eyes)
  applyBrows(grid, groups, chosen.brows, cx)
  applyMouth(grid, lowestEye, cx, chosen)
  return grid.map(row => row.join(""))
}

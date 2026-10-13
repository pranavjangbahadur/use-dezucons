import {CLASSIC_COUNT, classicIndex, hashName} from "./hash.ts"
import type {Emotion} from "./emotions.ts"
import {applyEmotion} from "./emotions.ts"
import {palette, paletteById, palettes, type Palette} from "./palettes.ts"

export type Body = {
  id: string
  label: string
  rows: readonly string[]
  /** Set on the original 12 only. New bodies take a shared palette. */
  palette?: Palette
}

const baked = palette

/** The original 12 drawings, in the same order, with the colors baked into each one. */
const classic: Body[] = [
  {
    id: "pebble",
    label: "Pebble",
    rows: ["........", "..llll..", ".leelel.", ".llllll.", "..llll..", "...ll...", "........", "........"],
    palette: baked("pebble", "Pebble", "#4338ca", "#6366f1", "#a5b4fc", "#6366f1", "#312e81"),
  },
  {
    id: "visor",
    label: "Visor",
    rows: ["...aa...", "..llll..", ".lwwwwl.", ".lkeekl.", ".llllll.", "..lddl..", "...ll...", "........"],
    palette: baked("visor", "Visor", "#334155", "#64748b", "#cbd5e1", "#f59e0b", "#0f172a"),
  },
  {
    id: "round",
    label: "Round",
    rows: ["..llll..", ".llllll.", ".lellel.", ".llllll.", ".llllll.", "ll.ll.ll", "l..ll..l", "........"],
    palette: baked("round", "Round", "#6d28d9", "#8b5cf6", "#ddd6fe", "#8b5cf6", "#4c1d95"),
  },
  {
    id: "sprout",
    label: "Sprout",
    rows: ["...aa...", "..a..a..", "...ll...", "..leel..", "..llll..", "...ll...", "..dddd..", "..dddd.."],
    palette: baked("sprout", "Sprout", "#a16207", "#15803d", "#4ade80", "#f472b6", "#14532d"),
  },
  {
    id: "bloom",
    label: "Bloom",
    rows: [".llllll.", "leelleel", ".llllll.", "...dd...", "...dd...", "..dddd..", "..dddd..", "........"],
    palette: baked("bloom", "Bloom", "#9f1239", "#e11d48", "#fda4af", "#e11d48", "#881337"),
  },
  {
    id: "ears",
    label: "Ears",
    rows: ["l......l", ".l....l.", ".lwwwwl.", ".lkeekl.", ".llllll.", "..llll..", "..l..l..", "........"],
    palette: baked("ears", "Ears", "#9a3412", "#ea580c", "#fdba74", "#ea580c", "#7c2d12"),
  },
  {
    id: "comet",
    label: "Comet",
    rows: ["........", "...ll..d", "..lelldd", ".lllllld", "..llllld", "...ll..d", "........", "........"],
    palette: baked("comet", "Comet", "#075985", "#0284c7", "#7dd3fc", "#0284c7", "#0c4a6e"),
  },
  {
    id: "horns",
    label: "Horns",
    rows: ["dd....dd", ".llllll.", "le.ll.el", ".llllll.", "..llll..", "...ll...", "..l..l..", "........"],
    palette: baked("horns", "Horns", "#92400e", "#d97706", "#fcd34d", "#d97706", "#78350f"),
  },
  {
    id: "flame",
    label: "Flame",
    rows: ["...a....", "..laal..", ".llaaal.", "..leel..", ".llllll.", "..llll..", "...dd...", "..dddd.."],
    palette: baked("flame", "Flame", "#9a3412", "#ea580c", "#fdba74", "#fde047", "#7c2d12"),
  },
  {
    id: "swirl",
    label: "Swirl",
    rows: ["..llll..", ".llwwll.", "llwwlll.", "llwllll.", "llwwlll.", ".llwwll.", "..llll..", "........"],
    palette: baked("swirl", "Swirl", "#1e3a8a", "#2563eb", "#93c5fd", "#2563eb", "#1e3a8a"),
  },
  {
    id: "badge",
    label: "Badge",
    rows: [".llllll.", "lkellekl", "llllllll", ".lddddl.", ".llllll.", "..l..l..", "........", "........"],
    palette: baked("badge", "Badge", "#115e59", "#0f766e", "#5eead4", "#0f766e", "#134e4a"),
  },
  {
    id: "moth",
    label: "Moth",
    rows: [".a....a.", "..llll..", ".lwwwwl.", ".lkeekl.", "llllllll", ".l.ll.l.", "..l..l..", "........"],
    palette: baked("moth", "Moth", "#86198f", "#c026d3", "#f0abfc", "#facc15", "#701a75"),
  },
]

/** Extra bodies. They are not part of the name hash, so existing names keep their face. */
const extra: Body[] = [
  {
    id: "antenna",
    label: "Antenna",
    rows: ["...aa...", "..llll..", ".leeeel.", ".llllll.", "..llll..", ".ll..ll.", ".l....l.", "........"],
  },
  {
    id: "box",
    label: "Box",
    rows: [".dddddd.", ".dleeld.", ".llllll.", ".l.ll.l.", ".llllll.", "..l..l..", ".ll..ll.", "........"],
  },
  {
    id: "cat",
    label: "Cat",
    rows: ["l......l", ".llllll.", ".lk..kl.", ".leeeel.", ".llllll.", "..llll..", "...aa...", "........"],
  },
  {
    id: "ghost",
    label: "Ghost",
    rows: ["..llll..", ".llllll.", "le.ee.el", "llllllll", "llllllll", "l.llll.l", ".l.ll.l.", "........"],
  },
  {
    id: "blob",
    label: "Blob",
    rows: ["........", "..llll..", ".laeeal.", ".llllll.", ".llllll.", "..llll..", "...ll...", "........"],
  },
  {
    id: "stem",
    label: "Stem",
    rows: ["...ll...", "..leel..", ".llllll.", "..llll..", "...ll...", "...dd...", "..dddd..", ".dd..dd."],
  },
  {
    id: "wide",
    label: "Wide",
    rows: ["........", "llllllll", "le.ll.el", "llllllll", ".llllll.", "..llll..", ".l....l.", "........"],
  },
  {
    id: "hood",
    label: "Hood",
    rows: [".dddddd.", "ddlllldd", ".leeeel.", ".llllll.", "..llll..", "...ll...", "..l..l..", "........"],
  },
]

export const bodies: Body[] = [...classic, ...extra]

export type Look = {
  shapeIndex: number
  body: Body
  palette: Palette
  rows: string[]
}

function paletteForNewLook(name: string): Palette {
  const index = hashName(name) % palettes.length
  return palettes[index < 0 ? 0 : index] ?? palettes[0]
}

function chosenPalette(value: string | Palette | undefined): Palette | undefined {
  if (!value) return undefined
  return typeof value === "string" ? paletteById(value) : value
}

export function resolveLook(input: {
  name: string
  shape?: number
  palette?: string | Palette
  emotion?: Emotion
}): Look {
  const shapeIndex =
    input.shape != null && input.shape >= 0 && input.shape < bodies.length ? input.shape : classicIndex(input.name)
  const body = bodies[shapeIndex] ?? bodies[0]
  const chosen = chosenPalette(input.palette)
  const colors =
    chosen ??
    (shapeIndex < CLASSIC_COUNT && body.palette ? body.palette : paletteForNewLook(input.name))
  return {
    shapeIndex,
    body,
    palette: colors,
    rows: applyEmotion(body.rows, input.emotion ?? "idle"),
  }
}

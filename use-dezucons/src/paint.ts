import type {Palette} from "./palettes.ts"

export type Cell = {
  x: number
  y: number
  fill: string
  eye: boolean
  /** Height in cells. A half pixel is 0.5, drawn with a hard edge. */
  h?: number
}

const WHITE = "#ffffff"

export function fillOf(ch: string, colors: Palette): string | null {
  switch (ch) {
    case "d":
      return colors.dark
    case "m":
      return colors.mid
    case "l":
      return colors.lite
    case "a":
      return colors.accent
    case "k":
      return colors.ink
    case "w":
    case "e":
      return WHITE
    default:
      return null
  }
}

export function paintRows(rows: readonly string[], colors: Palette): Cell[] {
  const cells: Cell[] = []
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      const fill = fillOf(ch, colors)
      if (fill) cells.push({x, y, fill, eye: ch === "e"})
    })
  })
  return cells
}

export type Palette = {
  id: string
  label: string
  dark: string
  mid: string
  lite: string
  accent: string
  ink: string
}

export function palette(
  id: string,
  label: string,
  dark: string,
  mid: string,
  lite: string,
  accent: string,
  ink: string,
): Palette {
  return {id, label, dark, mid, lite, accent, ink}
}

/** Shared recolors. Classic faces keep their own baked palette unless one of these is chosen. */
export const palettes: Palette[] = [
  palette("coral", "Coral", "#9f1239", "#fb7185", "#fecdd3", "#fb7185", "#4c0519"),
  palette("forest", "Forest", "#14532d", "#16a34a", "#86efac", "#facc15", "#052e16"),
  palette("midnight", "Midnight", "#1e1b4b", "#4338ca", "#a5b4fc", "#22d3ee", "#0f172a"),
  palette("sand", "Sand", "#92400e", "#d97706", "#fde68a", "#f97316", "#451a03"),
  palette("grape", "Grape", "#581c87", "#9333ea", "#e9d5ff", "#f472b6", "#3b0764"),
  palette("mint", "Mint", "#115e59", "#14b8a6", "#99f6e4", "#2dd4bf", "#042f2e"),
  palette("ink", "Ink", "#18181b", "#3f3f46", "#d4d4d8", "#ef4444", "#09090b"),
  palette("peach", "Peach", "#9a3412", "#fb923c", "#ffedd5", "#fb7185", "#7c2d12"),
]

export function paletteById(id: string): Palette | undefined {
  return palettes.find(item => item.id === id)
}

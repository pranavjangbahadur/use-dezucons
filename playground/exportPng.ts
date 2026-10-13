export type PngBackground = "white" | "transparent"

export async function downloadAvatarPng(svg: SVGSVGElement, background: PngBackground): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const size = 512
  clone.setAttribute("width", String(size))
  clone.setAttribute("height", String(size))
  clone.querySelectorAll("rect").forEach(rect => rect.setAttribute("opacity", "1"))
  const xml = new XMLSerializer().serializeToString(clone)
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  if (background === "white") {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, size, size)
  }
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(image, 0, 0, size, size)
  const link = document.createElement("a")
  link.href = canvas.toDataURL("image/png")
  link.download = "dezucons.png"
  link.click()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not draw the avatar"))
    image.src = src
  })
}

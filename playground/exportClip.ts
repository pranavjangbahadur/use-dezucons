import {GIFEncoder, applyPalette, quantize} from "gifenc"
import {ArrayBufferTarget, Muxer} from "mp4-muxer"

const CLIP_MS = 4000
const FPS = 10
const SIZE = 512

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

/** One frame of the live face, including bob, blink, and flicker. */
function paintFrame(svg: SVGSVGElement, size: number): HTMLCanvasElement {
  const avatar = svg.closest(".pixel-avatar")
  if (!(avatar instanceof HTMLElement)) throw new Error("Could not find the avatar")
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not draw the avatar")
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, size, size)

  const avatarBox = avatar.getBoundingClientRect()
  const svgBox = svg.getBoundingClientRect()
  if (avatarBox.width <= 0 || svgBox.width <= 0) throw new Error("Could not draw the avatar")

  const content = Math.round((size * 0.7) / 8) * 8
  const cell = content / 8
  const pad = (size - content) / 2
  const bobX = pad + (svgBox.left - avatarBox.left) * (content / avatarBox.width)
  const bobY = pad + (svgBox.top - avatarBox.top) * (content / avatarBox.height)
  const group = svg.querySelector("g")
  const shift = /translate\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/.exec(group?.getAttribute("transform") ?? "")
  const gx = shift ? Number(shift[1]) : 0
  const gy = shift ? Number(shift[2]) : 0
  const unit = svgBox.width / 8

  for (const rect of svg.querySelectorAll("rect")) {
    const opacity = Number(getComputedStyle(rect).opacity)
    if (opacity < 0.04) continue
    const xAttr = Number(rect.getAttribute("x") ?? "0") + gx
    const yAttr = Number(rect.getAttribute("y") ?? "0") + gy
    const hAttr = Number(rect.getAttribute("height") ?? "1")
    const box = rect.getBoundingClientRect()
    const expected = hAttr * unit
    const scaleY = expected > 0 ? box.height / expected : 1
    const full = hAttr * cell
    const drawH = Math.max(1, full * (scaleY > 1 ? 1 : scaleY))
    const drawX = bobX + xAttr * cell
    const drawY = bobY + yAttr * cell + (full - drawH) / 2
    ctx.globalAlpha = opacity
    ctx.fillStyle = rect.getAttribute("fill") || "#000000"
    ctx.fillRect(Math.round(drawX), Math.round(drawY), cell, Math.round(drawH))
  }
  ctx.globalAlpha = 1
  return canvas
}

export async function captureAvatarFrames(svg: SVGSVGElement): Promise<HTMLCanvasElement[]> {
  const frames: HTMLCanvasElement[] = []
  const count = Math.round((CLIP_MS / 1000) * FPS)
  for (let i = 0; i < count; i++) {
    const started = performance.now()
    frames.push(paintFrame(svg, SIZE))
    const wait = 1000 / FPS - (performance.now() - started)
    if (i < count - 1 && wait > 0) await delay(wait)
  }
  return frames
}

export async function downloadAvatarGif(svg: SVGSVGElement): Promise<void> {
  const frames = await captureAvatarFrames(svg)
  const gif = GIFEncoder()
  for (const frame of frames) {
    const ctx = frame.getContext("2d")
    if (!ctx) throw new Error("Could not draw the avatar")
    const rgba = new Uint8Array(ctx.getImageData(0, 0, frame.width, frame.height).data)
    const palette = quantize(rgba, 64)
    const index = applyPalette(rgba, palette)
    gif.writeFrame(index, frame.width, frame.height, {palette, delay: 1000 / FPS, repeat: 0})
  }
  gif.finish()
  const bytes = gif.bytes()
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  saveBlob(new Blob([copy], {type: "image/gif"}), "dezucons.gif")
}

export async function downloadAvatarMp4(svg: SVGSVGElement): Promise<void> {
  if (typeof VideoEncoder === "undefined") throw new Error("This browser cannot write an MP4")
  const frames = await captureAvatarFrames(svg)
  const width = frames[0]?.width ?? SIZE
  const height = frames[0]?.height ?? SIZE
  const config: VideoEncoderConfig = {
    codec: "avc1.42001f",
    width,
    height,
    bitrate: 1_200_000,
    framerate: FPS,
    latencyMode: "quality",
    avc: {format: "avc"},
  }
  const support = await VideoEncoder.isConfigSupported(config)
  if (!support.supported) throw new Error("This browser cannot write an MP4")

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: {codec: "avc", width, height, frameRate: FPS},
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  })
  let failed: Error | null = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: error => {
      failed = error instanceof Error ? error : new Error("Could not write the MP4")
    },
  })
  encoder.configure(support.config ?? config)
  const step = 1_000_000 / FPS
  for (let i = 0; i < frames.length; i++) {
    const source = frames[i]
    if (!source) continue
    const frame = new VideoFrame(source, {timestamp: i * step, duration: step})
    encoder.encode(frame, {keyFrame: i % FPS === 0})
    frame.close()
    if (failed) throw failed
  }
  await encoder.flush()
  if (failed) throw failed
  muxer.finalize()
  encoder.close()
  saveBlob(new Blob([target.buffer], {type: "video/mp4"}), "dezucons.mp4")
}

import {useEffect, useRef, useState, type CSSProperties, type Ref} from "react"
import {resolveLook} from "./bodies.ts"
import {applyEmotion, isEmotion, type Emotion, type EmotionProfile} from "./emotions.ts"
import {applyEmote, EMOTE_MIN_MS, emoteDuration, isEmote, type Emote} from "./emotes.ts"
import {motionDelay} from "./hash.ts"
import {chooseHidden, motionFor} from "./motion.ts"
import {paintRows} from "./paint.ts"
import type {Palette} from "./palettes.ts"
import "./pixel-avatar.css"

export type PixelAvatarProps = {
  /** Picks a stable classic face. Shape and palette override it when set. */
  name?: string
  size?: number
  /** Index into the body list. Omit it to use the name hash. */
  shape?: number
  /** Shared palette id, or a palette object. Omit it to keep a classic face's baked colors. */
  palette?: string | Palette
  emotion?: Emotion
  /** Plays once over the painted emotion, then the face returns. */
  emote?: Emote
  /** Bump this to play the same emote again. */
  emoteToken?: number
  /** Called when the one play finishes and the face is the emotion again. */
  onEmoteEnd?: () => void
  /** Replaces the feeling's face and motion. Omit it to use the emotion as written. */
  profile?: EmotionProfile
  /** Speeds emotes up above 1 and slows them below 1. */
  emoteScale?: number
  /** How long one press of an emote keeps looping, in milliseconds. */
  emoteHoldMs?: number
  /** Turns bob, blink, and pixel flicker off. */
  still?: boolean
  svgRef?: Ref<SVGSVGElement>
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function PixelAvatar({
  name = "",
  size = 64,
  shape,
  palette,
  emotion = "idle",
  emote,
  emoteToken = 0,
  onEmoteEnd,
  profile,
  emoteScale = 1,
  emoteHoldMs = EMOTE_MIN_MS,
  still = false,
  svgRef,
}: PixelAvatarProps) {
  const face = isEmotion(emotion) ? emotion : "idle"
  const overlay = isEmote(emote) ? emote : undefined
  const idleLook = resolveLook({name, shape, palette, emotion: "idle"})
  const look = resolveLook({name, shape, palette, emotion: face})
  const rows = profile ? applyEmotion(look.body.rows, face, profile) : look.rows
  const cells = paintRows(rows, look.palette)
  const pool = cells.flatMap((cell, index) => {
    if (cell.eye) return []
    const before = idleLook.rows[cell.y]?.[cell.x]
    const after = rows[cell.y]?.[cell.x]
    return before === after ? [index] : []
  })
  const [hidden, setHidden] = useState<number[]>([])
  const [phase, setPhase] = useState(0)
  const [spent, setSpent] = useState(true)
  const onEmoteEndRef = useRef(onEmoteEnd)
  onEmoteEndRef.current = onEmoteEnd
  const reduce = prefersReducedMotion()
  const playing = overlay != null && !still && !spent
  const faceMotion = motionFor(face, still, reduce, profile)
  const flicker = playing ? null : (faceMotion?.flicker ?? null)
  const motionKey = [
    flicker ? `${flicker.pixelCount}-${flicker.intervalMs}-${flicker.randomness}` : "steady",
    rows.join(""),
    face,
    look.shapeIndex,
    name,
  ].join("-")

  useEffect(() => {
    if (!flicker || pool.length === 0) {
      setHidden([])
      return
    }
    const cursor = {current: 0}
    const step = () => setHidden(prev => chooseHidden(prev, pool, flicker, cursor))
    step()
    const id = window.setInterval(step, flicker.intervalMs)
    return () => window.clearInterval(id)
  }, [motionKey])

  useEffect(() => {
    if (!overlay || still) {
      setPhase(0)
      setSpent(true)
      return
    }
    const speed = emoteScale < 0.25 ? 0.25 : emoteScale
    const duration = emoteDuration[overlay] / speed
    const hold = emoteHoldMs < 1 ? 1 : emoteHoldMs
    const repeats = Math.max(1, Math.ceil(hold / duration))
    const total = repeats * duration
    const started = globalThis.performance.now()
    let frame = 0
    setSpent(false)
    setPhase(0)
    const tick = (now: number) => {
      const elapsed = now - started
      if (elapsed >= total) {
        setPhase(0)
        setSpent(true)
        onEmoteEndRef.current?.()
        return
      }
      setPhase((elapsed % duration) / duration)
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [overlay, emoteToken, still, emoteScale, emoteHoldMs])

  let minX = 8
  let minY = 8
  let maxX = -1
  let maxY = -1
  for (const cell of cells) {
    if (cell.x < minX) minX = cell.x
    if (cell.y < minY) minY = cell.y
    if (cell.x > maxX) maxX = cell.x
    if (cell.y > maxY) maxY = cell.y
  }
  const dx = still && maxX >= minX ? 4 - (minX + maxX + 1) / 2 : 0
  const dy = still && maxY >= minY ? 4 - (minY + maxY + 1) / 2 : 0
  const px = `${size}px`
  const bob = faceMotion?.bob
  const blink = playing ? null : (faceMotion?.blink ?? null)
  const drawn = playing && overlay ? applyEmote(cells, look.rows, overlay, phase, look.palette.dark) : cells
  const motionStyle: CSSProperties & {"--pixel-bob"?: string; "--pixel-bob-lift"?: string; "--pixel-blink"?: string} = {
    display: "block",
    width: "100%",
    height: "100%",
  }
  if (bob) {
    motionStyle.animationDelay = motionDelay(name)
    motionStyle["--pixel-bob"] = bob.duration
    motionStyle["--pixel-bob-lift"] = bob.lift
  }
  if (blink) motionStyle["--pixel-blink"] = blink

  return (
    <span
      role="img"
      aria-label={overlay ? `${look.body.label}, ${face}, ${overlay}` : `${look.body.label}, ${face}`}
      className="pixel-avatar"
      style={{width: px, height: px}}>
      <span key={`${face}-${bob?.duration ?? "still"}-${blink ?? "open"}`} className={bob ? "pixel-avatar-bob" : undefined} style={motionStyle}>
        <svg
          ref={svgRef}
          width={px}
          height={px}
          viewBox="0 0 8 8"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="crispEdges"
          aria-hidden="true">
          <g transform={`translate(${dx} ${dy})`}>
            {drawn.map((cell, index) => (
              <rect
                key={`${index}-${cell.x}-${cell.y}-${cell.h ?? 1}`}
                x={cell.x}
                y={cell.y}
                width={1}
                height={cell.h ?? 1}
                fill={cell.fill}
                className={cell.eye && blink ? "pixel-avatar-eye" : undefined}
                style={cell.eye && blink ? ({["--pixel-blink"]: blink} as CSSProperties) : undefined}
                opacity={hidden.includes(index) ? 0 : 1}
              />
            ))}
          </g>
        </svg>
      </span>
    </span>
  )
}

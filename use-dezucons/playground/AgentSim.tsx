import {useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from "react"
import {PixelAvatar, bodies, palettes, type Emotion, type Emote, type Palette} from "../src/index.ts"
import {simScript, type SimBeat, type SimRole} from "./sim.ts"

type SimLine = {
  id: number
  beat: SimBeat
  text: string
  live: boolean
  emoting: boolean
}

export type SimFeel = {
  role: SimRole
  emotion: Emotion
  emote?: Emote
  token: number
  emoting: boolean
}

const banner = ` ____
|  _ \\ ___ _____   _
| | | / _ \\_  / | | |
| |_| |  __// /| |_| |
|____/ \\___/___|\\__,_|
  ___ ___  _ __  ___
 / __/ _ \\| '_ \\/ __|
| (_| (_) | | | \\__ \\
 \\___\\___/|_| |_|___/`

function pickCast(): {lead: Palette; sub: Palette} {
  const lead = palettes[Math.floor(Math.random() * palettes.length)] ?? palettes[0]
  const rest = palettes.filter(item => item.id !== lead.id)
  const sub = rest[Math.floor(Math.random() * rest.length)] ?? lead
  return {lead, sub}
}

const pace = 0.64

function pause(ms: number) {
  return new Promise<void>(resolve => {
    window.setTimeout(resolve, ms * pace)
  })
}

export function AgentSim({shape, onFeel}: {shape: number; onFeel?: (feel: SimFeel) => void}) {
  const boxRef = useRef<HTMLElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const onFeelRef = useRef(onFeel)
  onFeelRef.current = onFeel
  const [lines, setLines] = useState<SimLine[]>([])
  const [cast, setCast] = useState(pickCast)
  const [frame, setFrame] = useState<{x: number; y: number; w: number} | null>(null)
  const subShape = (shape + 1) % bodies.length
  const leadName = bodies[shape]?.label ?? "Lead"
  const subName = bodies[subShape]?.label ?? "Sub"

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const rect = box.getBoundingClientRect()
    setFrame({x: rect.left, y: rect.top, w: rect.width})
  }, [])

  function onDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    const box = boxRef.current
    if (!box) return
    const rect = box.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const originX = rect.left
    const originY = rect.top
    const width = rect.width
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    const move = (e: PointerEvent) => {
      setFrame({x: originX + e.clientX - startX, y: originY + e.clientY - startY, w: width})
    }
    const up = () => {
      handle.removeEventListener("pointermove", move)
      handle.removeEventListener("pointerup", up)
    }
    handle.addEventListener("pointermove", move)
    handle.addEventListener("pointerup", up)
  }

  useEffect(() => {
    const box = boxRef.current
    const stage = box?.closest(".page")?.querySelector(".stage")
    if (!box || !(stage instanceof HTMLElement)) return
    const match = () => {
      const height = stage.getBoundingClientRect().height
      if (height > 0) box.style.height = `${Math.round(height * 1.2)}px`
    }
    match()
    const observer = new ResizeObserver(match)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [lines])

  useEffect(() => {
    const run = {stop: false}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setLines([])

    async function play() {
      let id = 0
      while (!run.stop) {
        for (const beat of simScript) {
          if (run.stop) return
          id += 1
          const lineId = id
          const speaking = beat.role === "lead" || beat.role === "sub"
          const feel = (emoting: boolean) => {
            onFeelRef.current?.({
              role: beat.role,
              emotion: speaking ? beat.emotion : "idle",
              emote: beat.emote,
              token: lineId,
              emoting: emoting && speaking,
            })
          }
          feel(false)
          if (reduced) {
            setLines(current => [...current, {id: lineId, beat, text: beat.text, live: false, emoting: false}])
            await pause(beat.holdMs)
            continue
          }
          setLines(current => [...current, {id: lineId, beat, text: "", live: true, emoting: false}])
          let text = ""
          const step = beat.kind === "code" ? 36 : 52
          for (const char of beat.text) {
            if (run.stop) return
            text += char
            const next = text
            setLines(current => current.map(line => (line.id === lineId ? {...line, text: next} : line)))
            await pause(step)
          }
          if (run.stop) return
          if (beat.emote && speaking) {
            feel(true)
            setLines(current => current.map(line => (line.id === lineId ? {...line, emoting: true} : line)))
            await pause(2100)
            if (run.stop) return
            feel(false)
            setLines(current => current.map(line => (line.id === lineId ? {...line, emoting: false} : line)))
          }
          await pause(beat.holdMs)
          if (run.stop) return
          setLines(current => current.map(line => (line.id === lineId ? {...line, live: false, emoting: false} : line)))
          await pause(800)
        }
        await pause(2200)
        if (!run.stop) {
          setLines([])
          setCast(pickCast())
          onFeelRef.current?.({role: "user", emotion: "idle", token: 0, emoting: false})
        }
      }
    }

    void play()
    return () => {
      run.stop = true
    }
  }, [])

  return (
    <section
      className="sim"
      aria-label="Agent transcript"
      ref={boxRef}
      style={frame ? {position: "fixed", left: frame.x, top: frame.y, width: frame.w, zIndex: 2000} : undefined}>
      <div className="sim-title" onPointerDown={onDragStart}>
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m7 9 3 3-3 3M12 15h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <strong>CONSOLE</strong>
        <span />
      </div>
      <div className="sim-log" ref={logRef}>
        <pre className="sim-banner">{banner}</pre>
        <hr className="sim-rule" />
        <p className="sim-help">Type 'help' to see available commands.</p>
        <hr className="sim-rule" />
        {lines.length === 0 ? (
          <p className="sim-copy">
            <span className="sim-prompt">$</span> <span className="sim-caret" />
          </p>
        ) : null}
        {lines.map(line => {
          const speaking = line.beat.role === "lead" || line.beat.role === "sub"
          const name = line.beat.role === "sub" ? subName : line.beat.role === "lead" ? leadName : "you"
          const rowClass = line.beat.role === "tool" ? "sim-row sim-call-row" : line.beat.role === "user" ? "sim-row sim-user" : "sim-row"
          return (
            <article key={line.id} className={rowClass}>
              {speaking ? (
                <PixelAvatar
                  shape={line.beat.role === "sub" ? subShape : shape}
                  palette={line.beat.role === "sub" ? cast.sub : cast.lead}
                  size={36}
                  emotion={line.beat.emotion}
                  emote={line.emoting ? line.beat.emote : undefined}
                  emoteToken={line.id}
                  still={!line.emoting}
                />
              ) : null}
              <div className="sim-body">
                {speaking ? <span className="sim-name">{name}</span> : null}
                <SimCopy line={line} />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SimCopy({line}: {line: SimLine}) {
  const caret = line.live ? <span className="sim-caret" /> : null
  if (line.beat.role === "user") {
    return (
      <p className="sim-copy">
        <span className="sim-prompt">$ </span>
        {line.text}
        {caret}
      </p>
    )
  }
  if (line.beat.kind === "text") {
    return (
      <p className="sim-copy">
        {line.text}
        {caret}
      </p>
    )
  }
  return (
    <pre className={line.beat.kind === "tool" ? "sim-call" : "sim-snippet"}>
      {line.text}
      {caret}
    </pre>
  )
}

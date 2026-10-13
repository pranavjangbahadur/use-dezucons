import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject} from "react"
import {createPortal} from "react-dom"
import {
  PixelAvatar,
  bodies,
  emotions,
  emotes,
  EMOTE_MIN_MS,
  palettes,
  resolveLook,
  type Emotion,
  type Emote,
} from "../src/index.ts"
import {downloadAvatarGif, downloadAvatarMp4} from "./exportClip.ts"
import {downloadAvatarPng} from "./exportPng.ts"
import {SettingsDrawer} from "./SettingsDrawer.tsx"
import {AgentSim, type SimFeel} from "./AgentSim.tsx"
import {attachShapeFall} from "./shapeFall.ts"
import {controlsFrom, profileFrom, type FeelingControls} from "./tune.ts"
import {TunePage, Visit} from "./Visit.tsx"

let clickAudio: AudioContext | null = null

function playClick() {
  const ctx = clickAudio ?? new AudioContext()
  clickAudio = ctx
  void ctx.resume()
  const now = ctx.currentTime
  const length = Math.floor(ctx.sampleRate * 0.035)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = "highpass"
  filter.frequency.value = 1400
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.4, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  noise.start(now)
}

const quips = [
  "come on man",
  "Hey don't do that",
  "That was 7.8 magnitude one",
  "Shake it shake it",
  "So, what was I saying",
  "Looks like AGI is here",
  "Okay, that's it",
  "Who gave you this button?",
  "I was comfortable",
  "My corners hurt",
  "Do that again. Don't.",
]

function XMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function Heart({size = 18}: {size?: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  )
}

function SpeechChip({
  boxRef,
  chip,
  text,
}: {
  boxRef: RefObject<HTMLElement | null>
  chip: HTMLElement | null
  text: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const bubble = ref.current
    const box = boxRef.current
    if (!bubble || !box || !chip) return
    const boxRect = box.getBoundingClientRect()
    const chipRect = chip.getBoundingClientRect()
    const bubbleRect = bubble.getBoundingClientRect()
    let left = chipRect.left - boxRect.left + chipRect.width / 2 - bubbleRect.width / 2
    let top = chipRect.top - boxRect.top - bubbleRect.height - 8
    left = Math.max(8, Math.min(left, boxRect.width - bubbleRect.width - 8))
    top = Math.max(8, top)
    const tail = chipRect.left - boxRect.left + chipRect.width / 2 - left
    bubble.style.left = `${left}px`
    bubble.style.top = `${top}px`
    bubble.style.setProperty("--tail", `${Math.max(14, Math.min(tail, bubbleRect.width - 14))}px`)
  }, [boxRef, chip, text])
  return (
    <p ref={ref} className="speech-chip">
      {text}
    </p>
  )
}

const shapeGrey = {
  id: "shape-grey",
  label: "Grey",
  dark: "#737373",
  mid: "#a3a3a3",
  lite: "#d6d3d1",
  accent: "#a8a29e",
  ink: "#44403c",
}

export function Playground() {
  const svgRef = useRef<SVGSVGElement>(null)
  const name = "Mettle"
  const [shape, setShape] = useState<number | undefined>(undefined)
  const [paletteId, setPaletteId] = useState<string | undefined>(undefined)
  const [emotion, setEmotion] = useState<Emotion>("idle")
  const [emote, setEmote] = useState<Emote | undefined>(undefined)
  const [emoteToken, setEmoteToken] = useState(0)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [guidePage, setGuidePage] = useState<"guide" | "tune">("guide")
  const [guideShape, setGuideShape] = useState<number | undefined>(undefined)
  const [drawnPrompt, setDrawnPrompt] = useState<string | null>(null)
  const [drawnToken, setDrawnToken] = useState(0)
  const [saving, setSaving] = useState<"gif" | "mp4" | null>(null)
  const [saveNote, setSaveNote] = useState<string | null>(null)
  const [draft, setDraft] = useState<{emotion: Emotion; controls: FeelingControls}>({
    emotion: "idle",
    controls: controlsFrom("idle"),
  })
  const [emoteScale, setEmoteScale] = useState(1)
  const [emoteHoldMs, setEmoteHoldMs] = useState(EMOTE_MIN_MS)
  const paletteRef = useRef<HTMLDivElement>(null)
  const downloadRef = useRef<HTMLDivElement>(null)
  const shapesRef = useRef<HTMLElement>(null)
  const guideRef = useRef<HTMLDivElement>(null)
  const shapeRefs = useRef<(HTMLButtonElement | null)[]>([])
  const shakeShapes = useRef<() => void>(() => {})
  const quipCursor = useRef(0)
  const loveId = useRef(0)
  const [remark, setRemark] = useState<{id: number; index: number; text: string} | null>(null)
  const [loves, setLoves] = useState(0)
  const [simFeel, setSimFeel] = useState<SimFeel>({role: "user", emotion: "idle", token: 0, emoting: false})
  const [hearts, setHearts] = useState<{id: number; dx: number; size: number}[]>([])
  const look = resolveLook({name, shape, palette: paletteId, emotion})
  const speaker =
    simFeel.role === "lead" ? look.shapeIndex : simFeel.role === "sub" ? (look.shapeIndex + 1) % bodies.length : null
  const natural = resolveLook({name, shape, emotion})
  const controls = draft.emotion === emotion ? draft.controls : controlsFrom(emotion)
  const profile = profileFrom(controls)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return
      }
      const key = event.key.toLowerCase()
      if (key === "escape") {
        if (guideOpen) closeGuide()
        else if (aboutOpen) setAboutOpen(false)
        return
      }
      if (key !== "a" && key !== "h") return
      event.preventDefault()
      if (key === "a") {
        if (aboutOpen) setAboutOpen(false)
        else openAbout()
      } else if (guideOpen) closeGuide()
      else openHowTo()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [aboutOpen, guideOpen])

  useEffect(() => {
    const root = guideRef.current
    if (!guideOpen || !root) return
    const overlay = root
    function onWheel(event: WheelEvent) {
      const sections = overlay.querySelector(guidePage === "tune" ? ".tune-controls" : ".use-block:not([hidden]) .use-sections")
      if (!(sections instanceof HTMLElement)) return
      if (event.target instanceof Node && (sections.contains(event.target) || overlay.querySelector(".face-menu")?.contains(event.target))) return
      sections.scrollTop += event.deltaY
      event.preventDefault()
    }
    root.addEventListener("wheel", onWheel, {passive: false})
    return () => root.removeEventListener("wheel", onWheel)
  }, [guideOpen, guidePage])

  useEffect(() => {
    if (!paletteOpen && !downloadOpen) return
    function close(event: MouseEvent) {
      const target = event.target as Node
      if (paletteOpen && paletteRef.current && !paletteRef.current.contains(target)) setPaletteOpen(false)
      if (downloadOpen && downloadRef.current && !downloadRef.current.contains(target)) setDownloadOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [paletteOpen, downloadOpen])

  useEffect(() => {
    const box = shapesRef.current
    if (!box) return
    const chips = shapeRefs.current.filter((chip): chip is HTMLButtonElement => chip != null)
    const fall = attachShapeFall(box, chips, index => {
      const text = quips[quipCursor.current % quips.length] ?? quips[0]
      quipCursor.current += 1
      setRemark({id: quipCursor.current, index, text})
    })
    shakeShapes.current = fall.shake
    return () => {
      shakeShapes.current = () => {}
      fall.stop()
    }
  }, [])

  useEffect(() => {
    if (!remark) return
    const id = remark.id
    const timer = window.setTimeout(() => {
      setRemark(current => (current?.id === id ? null : current))
    }, 1900)
    return () => window.clearTimeout(timer)
  }, [remark])

  useEffect(() => {
    if (!settingsOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSettingsOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [settingsOpen])

  function closeGuide() {
    setGuideOpen(false)
    setGuidePage("guide")
    setDrawnPrompt(null)
    setDrawnToken(0)
  }

  function openHowTo() {
    setGuideOpen(true)
  }

  function openAbout() {
    closeGuide()
    setAboutOpen(true)
  }

  function choosePalette(id: string | undefined) {
    setPaletteId(id)
    setPaletteOpen(false)
  }

  function edit(patch: Partial<FeelingControls>) {
    setDraft({emotion, controls: {...controls, ...patch}})
  }

  function resetFeeling() {
    setDraft({emotion, controls: controlsFrom(emotion)})
    setEmoteScale(1)
    setEmoteHoldMs(EMOTE_MIN_MS)
  }

  async function save(kind: "png" | "gif" | "mp4") {
    setDownloadOpen(false)
    const svg = svgRef.current
    if (!svg || saving) return
    setSaveNote(null)
    if (kind === "png") {
      await downloadAvatarPng(svg, "white")
      return
    }
    setSaving(kind)
    setSaveNote(kind === "gif" ? "Saving GIF…" : "Saving MP4…")
    try {
      if (kind === "gif") await downloadAvatarGif(svg)
      else await downloadAvatarMp4(svg)
      setSaveNote(null)
    } catch (error) {
      setSaveNote(error instanceof Error ? error.message : "Could not save the clip")
    } finally {
      setSaving(null)
    }
  }

  function showLove() {
    setLoves(count => count + 1)
    const burst = Array.from({length: 7}, () => {
      loveId.current += 1
      return {
        id: loveId.current,
        dx: Math.round((Math.random() - 0.5) * 72),
        size: 14 + Math.round(Math.random() * 10),
      }
    })
    setHearts(current => [...current, ...burst])
  }

  function shakeBox() {
    setRemark(null)
    shakeShapes.current()
  }

  function shuffle() {
    const nextShape = Math.floor(Math.random() * bodies.length)
    const nextPalette = palettes[Math.floor(Math.random() * palettes.length)]
    const nextEmotion = emotions[Math.floor(Math.random() * emotions.length)] ?? "idle"
    setShape(nextShape)
    setPaletteId(nextPalette?.id)
    setEmotion(nextEmotion)
  }

  return (
    <main className="page">
      <header className="mast">
        <div className="mast-row">
          <h1>dezucons</h1>
          <div className="mast-actions">
            <button type="button" className="about-dezucons" aria-keyshortcuts="A" onClick={openAbout}>
              [A] About Dezucons
            </button>
            <button type="button" className="how-to-use" aria-keyshortcuts="H" onClick={openHowTo}>
              [H] How to use
            </button>
          </div>
        </div>
        <p className="lede">Every shape, color, and emotion. A name keeps the same classic face.</p>
      </header>
      <div className="rail">
        <section className="shapes" aria-label="Shapes" ref={shapesRef}>
          {bodies.map((body, index) => (
            <button
              key={body.id}
              className="shape-chip"
              ref={node => {
                shapeRefs.current[index] = node
              }}
              type="button"
              aria-pressed={look.shapeIndex === index}
              onClick={() => setShape(index)}>
              <PixelAvatar
                name={name}
                size={36}
                shape={index}
                palette={look.shapeIndex === index ? look.palette : shapeGrey}
                emotion={remark?.index === index ? "angry" : speaker === index ? simFeel.emotion : "idle"}
                emote={remark?.index === index ? undefined : speaker === index && simFeel.emoting ? simFeel.emote : undefined}
                emoteToken={simFeel.token}
                still={remark?.index === index || speaker !== index || !simFeel.emoting}
              />
              <small>{body.label}</small>
            </button>
          ))}
          {remark ? (
            <SpeechChip key={remark.id} boxRef={shapesRef} chip={shapeRefs.current[remark.index] ?? null} text={remark.text} />
          ) : null}
          <button type="button" className="icon-button shapes-shake" aria-label="Shake" title="Shake" onClick={shakeBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 9.5v5M5.5 6.5v11M18.5 6.5v11M22 9.5v5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="9" y="4.5" width="6" height="15" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </section>
      </div>
      <div className="main">
        <div className="stage">
          <div className="stage-side">
            <button type="button" className="icon-button" aria-label="Shuffle" title="Shuffle" onClick={shuffle}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m18 14 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m18 2 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.7l-.359-.45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Settings"
              aria-pressed={settingsOpen}
              title="Settings"
              onClick={() => setSettingsOpen(open => !open)}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="stage-tools">
            <div className="palette-menu" ref={paletteRef}>
              <button
                type="button"
                className="palette-trigger"
                aria-expanded={paletteOpen}
                aria-label="Palette"
                title="Palette"
                style={{background: look.palette.mid}}
                onClick={() => {
                  setDownloadOpen(false)
                  setPaletteOpen(open => !open)
                }}
              />
              {paletteOpen ? (
                <div className="palette-list" role="listbox" aria-label="Palette">
                  <button
                    type="button"
                    role="option"
                    aria-label="From the look"
                    aria-selected={paletteId == null}
                    onClick={() => choosePalette(undefined)}>
                    <i style={{background: natural.palette.mid}} />
                  </button>
                  {palettes.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-label={item.label}
                      aria-selected={paletteId === item.id}
                      onClick={() => choosePalette(item.id)}>
                      <i style={{background: item.mid}} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="download-menu" ref={downloadRef}>
              <button
                type="button"
                className="icon-button"
                aria-label="Download"
                aria-expanded={downloadOpen}
                title="Download"
                disabled={saving != null}
                onClick={() => {
                  setPaletteOpen(false)
                  setDownloadOpen(open => !open)
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {downloadOpen ? (
                <div className="download-list" role="menu">
                  <button type="button" role="menuitem" onClick={() => void save("png")}>
                    PNG
                  </button>
                  <button type="button" role="menuitem" onClick={() => void save("gif")}>
                    GIF<small>4s loop</small>
                  </button>
                  <button type="button" role="menuitem" onClick={() => void save("mp4")}>
                    MP4<small>4s loop</small>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          {saveNote ? <p className="save-note">{saveNote}</p> : null}
          <PixelAvatar
            name={name}
            size={280}
            shape={shape}
            palette={paletteId}
            emotion={emotion}
            profile={profile}
            emote={emote}
            emoteToken={emoteToken}
            emoteScale={emoteScale}
            emoteHoldMs={emoteHoldMs}
            onEmoteEnd={() => setEmote(undefined)}
            svgRef={svgRef}
          />
        </div>
        <section className="section emotions">
          <div className="wall">
            {emotions.map(item => (
              <button key={item} type="button" aria-pressed={emotion === item} onClick={() => setEmotion(item)}>
                <PixelAvatar
                  name={name}
                  size={40}
                  shape={look.shapeIndex}
                  palette={look.palette}
                  emotion={item}
                  still
                />
                <small>{item}</small>
              </button>
            ))}
          </div>
        </section>
        <div className="controls">
          <div className="field">
            <span>Emote</span>
            <div className="choices" role="listbox" aria-label="Emote">
              {emotes.map(item => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={emote === item.id}
                  onClick={() => {
                    playClick()
                    setEmote(item.id)
                    setEmoteToken(token => token + 1)
                  }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <aside className="advanced" aria-label="Agents">
        <AgentSim shape={look.shapeIndex} onFeel={setSimFeel} />
      </aside>
      {guideOpen
        ? createPortal(
            <div
              className="how-to how-to-guide"
              ref={guideRef}
              onMouseDown={event => {
                if (event.target === event.currentTarget) closeGuide()
              }}>
              <div className="how-to-panel" role="dialog" aria-modal="true" aria-label={guidePage === "tune" ? "Feeling controls" : undefined} aria-labelledby={guidePage === "tune" ? undefined : "how-to-title"}>
                <header className="how-to-head">
                  <div className="how-to-title">
                    {guidePage === "tune" ? (
                      <button type="button" className="how-to-back" onClick={() => setGuidePage("guide")}>
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M15 6 9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back
                      </button>
                    ) : (
                      <h2 id="how-to-title">How to use</h2>
                    )}
                  </div>
                  <div className="how-to-actions">
                    <a className="github-link" href="https://github.com/pranavjangbahadur/use-dezucons" target="_blank" rel="noreferrer">
                      View on GitHub
                    </a>
                    <button type="button" className="icon-button" aria-label="Close" onClick={closeGuide}>
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </header>
                <Visit
                  hidden={guidePage !== "guide"}
                  drawnPrompt={drawnPrompt}
                  drawnToken={drawnToken}
                  onOpenSettings={() => setGuidePage("tune")}
                />
                {guidePage === "tune" ? (
                  <TunePage
                    emotion={emotion}
                    profile={profile}
                    controls={controls}
                    emoteScale={emoteScale}
                    emoteHoldMs={emoteHoldMs}
                    shape={guideShape}
                    onChange={edit}
                    onEmoteScale={setEmoteScale}
                    onEmoteHoldMs={setEmoteHoldMs}
                    onReset={resetFeeling}
                    onEmotion={setEmotion}
                    onShape={setGuideShape}
                    onGenerate={prompt => {
                      setDrawnPrompt(prompt)
                      setDrawnToken(token => token + 1)
                      setGuidePage("guide")
                    }}
                  />
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
      {aboutOpen
        ? createPortal(
            <div
              className="how-to"
              onMouseDown={event => {
                if (event.target === event.currentTarget) setAboutOpen(false)
              }}>
              <div className="how-to-panel about-panel" role="dialog" aria-modal="true" aria-labelledby="about-title">
                <header className="how-to-head">
                  <h2 id="about-title">About Dezucons</h2>
                  <button type="button" className="icon-button" aria-label="Close" onClick={() => setAboutOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </header>
                <div className="about-copy">
                  <p>
                    I find myself working more in terminals now. I am talking to agents, as much, if not more, than I am talking to humans. I feel, we need to make agents have their own identity. Agents need a face. So, I built Dezucons.
                  </p>
                  <p>
                    Dezucons are identicons made for agents. The name you give an agent is hashed into one of twelve classic faces, and that same name always comes back as that same face. As humans and agent work together, a familiar face makes it all more human.
                  </p>
                  <p>
                    We have coded into dezucons human emotions and how they emote them through modes like thinking, frown face, happy, smile, raise eyebrow etc. All these are tied to something agent does or says. We hope this would make agent interaction for your internal tools or customer facing tools more interesting and alive.
                  </p>
                  <p>
                    Dezucons can be used in so many ways. Chat bots, AI assistant apps, For emailers, for your own display picture, for newsletters. Just check out{" "}
                    <button type="button" className="about-inline" onClick={openHowTo}>
                      how to use
                    </button>
                    , and get started. The installation is just on command. And, set up, another. Then you're done.
                  </p>
                  <p className="about-sign">
                    Collect <s>Tazos</s> Dezus.
                  </p>
                  <a className="about-credit" href="https://x.com/jangpranav" target="_blank" rel="noreferrer">
                    Pranav Jang Bahadur
                    <XMark />
                  </a>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      {settingsOpen
        ? createPortal(
            <SettingsDrawer
              controls={controls}
              emoteScale={emoteScale}
              emoteHoldMs={emoteHoldMs}
              onClose={() => setSettingsOpen(false)}
              onChange={edit}
              onEmoteScale={setEmoteScale}
              onEmoteHoldMs={setEmoteHoldMs}
            />,
            document.body,
          )
        : null}
      {createPortal(
        <a className="built-by" href="https://x.com/jangpranav" target="_blank" rel="noreferrer">
          Built by Pranav
          <XMark />
        </a>,
        document.body,
      )}
      {createPortal(
        <div className="show-love-anchor">
          {hearts.map(heart => (
            <span
              key={heart.id}
              className="love-float"
              style={{"--dx": `${heart.dx}px`} as CSSProperties}
              onAnimationEnd={() => setHearts(current => current.filter(item => item.id !== heart.id))}>
              <Heart size={heart.size} />
            </span>
          ))}
          <button type="button" className="show-love" aria-label={`Show love, ${loves}`} onClick={showLove}>
            <Heart />
            <span>Show Love</span>
            <span className="love-count">{loves}</span>
          </button>
        </div>,
        document.body,
      )}
    </main>
  )
}

import {useEffect, useRef, useState, type ReactNode} from "react"
import {
  AgentContact,
  AgentDock,
  PixelAvatar,
  bodies,
  emotions,
  resolveLook,
  advancedAgentPrompt,
  advancedPrompt,
  basicAgentPrompt,
  basicSnippet,
  faceForTurn,
  feelingPrompt,
  installCommand,
  readFeeling,
  readerSnippet,
  type Emotion,
  type EmotionProfile,
  type TurnStatus,
} from "../src/index.ts"
import {FeelingForm} from "./SettingsDrawer.tsx"
import {profileFrom, type FeelingControls} from "./tune.ts"

const basicBeats: {status: TurnStatus; line: string}[] = [
  {status: "thinking", line: "Writing a reply."},
  {status: "tool", line: "Searching tonight's flights."},
  {status: "tool-result", line: "Three morning seats came back."},
  {status: "answering", line: "The morning flight is open."},
  {status: "tool-error", line: "The night search failed."},
  {status: "waiting", line: "Handed back to you."},
]

const cornerLines = [
  "Looking up a flight for tonight. [[feel:thinking]]",
  "I couldn't find a flight tonight. [[feel:sad:tears]]",
  "Found a morning one. Want me to hold it? [[feel:happy:teeth]]",
]

const contacts = [
  {name: "Mina", raw: "Your afternoon is clear after three. [[feel:happy:teeth]]"},
  {name: "Reed", raw: "Which of the two meetings did you mean? [[feel:confused:brow]]"},
  {name: "Sol", raw: "I'll watch this overnight. [[feel:sleepy:wink]]"},
]

function copyText(text: string) {
  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.left = "-9999px"
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand("copy")
  area.remove()
  if (ok) return Promise.resolve()
  return navigator.clipboard.writeText(text)
}

function paint(source: string, kind: "shell" | "tsx" | "text"): ReactNode[] {
  if (kind === "shell") {
    return source.split(" ").flatMap((part, index) => {
      const tone = index === 0 ? "tok-key" : index === 1 ? "tok-fn" : "tok-str"
      const node = (
        <span key={index} className={tone}>
          {part}
        </span>
      )
      return index === 0 ? [node] : [" ", node]
    })
  }
  const pattern =
    kind === "text"
      ? /(\[\[[^\]]+\]\])/g
      : /("(?:\\.|[^"\\])*")|(\b(?:import|from|const)\b)|(\b[A-Z][A-Za-z0-9]*\b)|(\b[a-z_][A-Za-z0-9_]*(?=\())|([<>{}()=.,;/])|([^"<>{}()=.,;/\s]+)|(\s+)/g
  const nodes: ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = pattern.exec(source))) {
    if (match.index > cursor) nodes.push(source.slice(cursor, match.index))
    const [whole, string, keyword, component, fn, punct, word] = match
    const tone = string
      ? "tok-str"
      : keyword
        ? "tok-key"
        : component
          ? "tok-comp"
          : fn
            ? "tok-fn"
            : punct
              ? "tok-punct"
              : word
                ? "tok-attr"
                : kind === "text"
                  ? "tok-str"
                  : ""
    nodes.push(
      tone ? (
        <span key={key} className={tone}>
          {whole}
        </span>
      ) : (
        whole
      ),
    )
    key += 1
    cursor = match.index + whole.length
  }
  if (cursor < source.length) nodes.push(source.slice(cursor))
  return nodes
}

function CodeBox({text, kind}: {text: string; kind: "shell" | "tsx" | "text"}) {
  const [done, setDone] = useState(false)
  return (
    <div className="use-code">
      <pre>{paint(text, kind)}</pre>
      <button
        type="button"
        className="use-code-copy"
        aria-label={done ? "Copied" : "Copy"}
        onClick={() => {
          void copyText(text).then(() => {
            setDone(true)
            window.setTimeout(() => setDone(false), 1400)
          })
        }}>
        {done ? (
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5 9.5 17 19 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M4 16V6a2 2 0 0 1 2-2h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}

const menuGrey = {
  id: "menu-grey",
  label: "Grey",
  dark: "#737373",
  mid: "#a3a3a3",
  lite: "#d6d3d1",
  accent: "#a8a29e",
  ink: "#44403c",
}

function StudioPreview({
  emotion,
  profile,
  emoteScale,
  emoteHoldMs,
  shape,
  onShape,
  onEmotion,
}: {
  emotion: Emotion
  profile: EmotionProfile
  emoteScale: number
  emoteHoldMs: number
  shape?: number
  onShape: (index: number) => void
  onEmotion: (emotion: Emotion) => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedIndex = shape ?? resolveLook({name: "Nia"}).shapeIndex
  const selected = bodies[selectedIndex] ?? bodies[0]
  useEffect(() => {
    if (!open) return
    function close(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])
  return (
    <div className="studio-preview">
      <div className="face-visual" ref={menuRef}>
        <button type="button" aria-expanded={open} aria-label={selected.label} onClick={() => setOpen(value => !value)}>
          <span>
            <PixelAvatar shape={selectedIndex} size={28} emotion={emotion} profile={profile} palette={menuGrey} still />
            {selected.label}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open ? (
          <div className="face-menu" role="listbox" aria-label="Faces">
            {bodies.map((body, index) => (
              <button
                key={body.id}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => {
                  onShape(index)
                  setOpen(false)
                }}>
                <PixelAvatar shape={index} size={28} emotion={emotion} profile={profile} palette={menuGrey} still />
                <span>{body.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="studio-stage">
        <PixelAvatar name="Nia" size={148} shape={selectedIndex} emotion={emotion} profile={profile} emoteScale={emoteScale} emoteHoldMs={emoteHoldMs} />
      </div>
      <div className="wall" role="listbox" aria-label="Emotion">
        {emotions.map(item => (
          <button key={item} type="button" aria-pressed={emotion === item} onClick={() => onEmotion(item)}>
            <PixelAvatar name="Nia" size={32} shape={selectedIndex} emotion={item} still />
            <small>{item}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

function OptionalStep({id, prompt, onOpen}: {id: string; prompt: string | null; onOpen: () => void}) {
  return (
    <section className="use-section" id={id}>
      <h3>Custom controls (optional)</h3>
      <p>
        This changes how a feeling looks, such as the eyes, mouth, and bounce. Basic or Advanced still decide when that feeling appears, and tears, teeth, and the other short beats still play. The prompt you get is an extra one, pasted alongside the prompt already on this page.
      </p>
      <button type="button" className="open-controls" onClick={onOpen}>
        Open feeling controls
      </button>
      {prompt ? <CodeBox text={prompt} kind="text" /> : null}
    </section>
  )
}

function Setup() {
  const [mode, setMode] = useState<"agent" | "manual">("agent")
  return (
    <section className="use-section" id="basic-setup">
      <h3>Set up</h3>
      <div className="setup-tabs" role="tablist" aria-label="Set up">
        {(
          [
            ["agent", "Coding agent"],
            ["manual", "Wire it manually"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>
      {mode === "agent" ? (
        <>
          <p>Paste this into Cursor, Claude, or any coding agent writing in your repo.</p>
          <CodeBox text={basicAgentPrompt} kind="text" />
        </>
      ) : (
        <>
          <ol>
            <li>
              Install the package.
              <CodeBox text={installCommand} kind="shell" />
            </li>
            <li>Render a face with a stable name.</li>
            <li>
              Call <code>faceForTurn</code> with the status, and pass the emotion it returns.
            </li>
          </ol>
          <CodeBox text={basicSnippet} kind="tsx" />
        </>
      )}
    </section>
  )
}

function AdvancedSetup() {
  const [mode, setMode] = useState<"agent" | "manual">("agent")
  return (
    <section className="use-section" id="advanced-setup">
      <h3>Set up</h3>
      <div className="setup-tabs" role="tablist" aria-label="Set up">
        {(
          [
            ["agent", "Coding agent"],
            ["manual", "Wire it manually"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>
      {mode === "agent" ? (
        <>
          <p>Paste this into Cursor, Claude, or any coding agent writing in your repo.</p>
          <CodeBox text={advancedAgentPrompt} kind="text" />
        </>
      ) : (
        <>
          <ol>
            <li>
              Install the package.
              <CodeBox text={installCommand} kind="shell" />
            </li>
            <li>
              Paste this into the system prompt you already send.
              <CodeBox text={advancedPrompt} kind="text" />
            </li>
            <li>
              In the chat screen, pass the finished reply through <code>readFeeling</code> before it is shown. <code>reply.text</code> is the sentence. <code>reply.emotion</code> is the face.
              <CodeBox text={readerSnippet} kind="tsx" />
            </li>
          </ol>
        </>
      )}
    </section>
  )
}

function Jumps({items}: {items: {id: string; label: string}[]}) {
  return (
    <nav className="use-jump" aria-label="On this page">
      {items.map(item => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={event => {
            event.preventDefault()
            document.getElementById(item.id)?.scrollIntoView({behavior: "smooth", block: "start"})
          }}>
          {item.label}
        </a>
      ))}
    </nav>
  )
}

export function Visit({
  hidden,
  drawnPrompt,
  drawnToken,
  onOpenSettings,
}: {
  hidden?: boolean
  drawnPrompt: string | null
  drawnToken: number
  onOpenSettings: () => void
}) {
  const [tab, setTab] = useState<"basic" | "advanced">("basic")
  const [basicStep, setBasicStep] = useState(0)
  const [cornerStep, setCornerStep] = useState(0)
  const [dockOpen, setDockOpen] = useState(true)
  const beat = basicBeats[basicStep] ?? basicBeats[0]
  const basicFace = faceForTurn(beat.status)
  const corner = readFeeling(cornerLines[cornerStep] ?? cornerLines[0])

  useEffect(() => {
    const id = window.setInterval(() => setBasicStep(step => (step + 1) % basicBeats.length), 2800)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setCornerStep(step => (step + 1) % cornerLines.length), 3200)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (hidden || drawnToken === 0) return
    document.getElementById(tab === "basic" ? "basic-optional" : "advanced-optional")?.scrollIntoView({behavior: "smooth", block: "start"})
  }, [drawnToken, hidden])

  return (
    <section className="visit" aria-label="How to use" hidden={hidden}>
      <div className="use-tabs" role="tablist" aria-label="How to use">
        {(
          [
            ["basic", "Basic"],
            ["advanced", "Advanced"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} aria-controls={id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <article className="use-block" id="basic" role="tabpanel" hidden={tab !== "basic"}>
        <Jumps
          items={[
            {id: "basic-about", label: "About"},
            {id: "basic-setup", label: "Set up"},
            {id: "basic-optional", label: "Custom controls (optional)"},
          ]}
        />
        <div className="use-sections">
          <section className="use-section" id="basic-about">
            <h3>About</h3>
            <p>
              In its basic mode, the package already knows the usual agent moments and matches a face to each one. While the model is writing, the face is thinking. A tool call looks confused. When a result comes back it looks surprised, and when the answer is shown it looks happy. If the tool fails, the face is sad.
            </p>
          </section>
          <Setup />
          <OptionalStep id="basic-optional" prompt={drawnPrompt} onOpen={onOpenSettings} />
        </div>
        <aside className="use-preview" aria-label="See it">
          <div className="use-live">
            <PixelAvatar name="Nia" size={96} emotion={basicFace.emotion} emote={basicFace.emote} emoteToken={basicStep} />
            <p className="use-status">{beat.status}</p>
            <p>{beat.line}</p>
          </div>
        </aside>
      </article>

      <article className="use-block" id="advanced" role="tabpanel" hidden={tab !== "advanced"}>
        <Jumps
          items={[
            {id: "advanced-about", label: "About"},
            {id: "advanced-setup", label: "Set up"},
            {id: "advanced-optional", label: "Custom controls (optional)"},
          ]}
        />
        <div className="use-sections">
          <section className="use-section" id="advanced-about">
            <h3>About</h3>
            <p>
              Advanced is for a reply whose words carry the mood. A corner assistant that could not find a flight, or a personal contact checking in, can say how it feels. The model ends the reply with a feeling. The package shows that face and hides the mark.
            </p>
          </section>
          <AdvancedSetup />
          <OptionalStep id="advanced-optional" prompt={drawnPrompt} onOpen={onOpenSettings} />
        </div>
        <aside className="use-preview" aria-label="See it">
          <div className="use-contacts">
            {contacts.map(contact => {
              const reply = readFeeling(contact.raw)
              return (
                <AgentContact
                  key={contact.name}
                  name={contact.name}
                  text={reply.text}
                  emotion={reply.emotion}
                  emote={reply.emote}
                  emoteToken={1}
                />
              )
            })}
          </div>
          <div className="use-stage">
            <AgentDock
              contained
              sample
              name="Nia"
              emotion={corner.emotion}
              emote={corner.emote}
              emoteToken={cornerStep}
              open={dockOpen}
              onOpenChange={setDockOpen}>
              {corner.text}
            </AgentDock>
          </div>
        </aside>
      </article>

    </section>
  )
}

export function TunePage({
  emotion,
  profile,
  controls,
  emoteScale,
  emoteHoldMs,
  shape,
  onChange,
  onEmoteScale,
  onEmoteHoldMs,
  onReset,
  onEmotion,
  onShape,
  onGenerate,
}: {
  emotion: Emotion
  profile: EmotionProfile
  controls: FeelingControls
  emoteScale: number
  emoteHoldMs: number
  shape?: number
  onChange: (patch: Partial<FeelingControls>) => void
  onEmoteScale: (value: number) => void
  onEmoteHoldMs: (value: number) => void
  onReset: () => void
  onEmotion: (emotion: Emotion) => void
  onShape: (index: number) => void
  onGenerate: (prompt: string) => void
}) {
  return (
    <div className="tune-page">
      <div className="tune-body">
        <div className="tune-controls">
          <FeelingForm
            controls={controls}
            emoteScale={emoteScale}
            emoteHoldMs={emoteHoldMs}
            onChange={onChange}
            onEmoteScale={onEmoteScale}
            onEmoteHoldMs={onEmoteHoldMs}
          />
        </div>
        <aside className="tune-preview" aria-label="Preview">
          <StudioPreview
            emotion={emotion}
            profile={profile}
            emoteScale={emoteScale}
            emoteHoldMs={emoteHoldMs}
            shape={shape}
            onEmotion={onEmotion}
            onShape={onShape}
          />
        </aside>
      </div>
      <div className="tune-bar">
        <button type="button" className="tune-reset" onClick={onReset}>
          Reset
        </button>
        <button
          type="button"
          className="tune-generate"
          onClick={() => onGenerate(feelingPrompt(emotion, profileFrom(controls), emoteScale, emoteHoldMs))}>
          Generate prompt
        </button>
      </div>
    </div>
  )
}

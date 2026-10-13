import {useState} from "react"
import type {Emotion} from "../src/emotions.ts"
import {feelingPrompt} from "../src/prompts.ts"
import {browModes, eyeModes, mouthModes, profileFrom, type FeelingControls} from "./tune.ts"

export function SettingsDrawer({
  emotion,
  controls,
  emoteScale,
  emoteHoldMs,
  onClose,
  onChange,
  onEmoteScale,
  onEmoteHoldMs,
  onReset,
}: {
  emotion: Emotion
  controls: FeelingControls
  emoteScale: number
  emoteHoldMs: number
  onClose: () => void
  onChange: (patch: Partial<FeelingControls>) => void
  onEmoteScale: (value: number) => void
  onEmoteHoldMs: (value: number) => void
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)
  function copyPrompt() {
    const text = feelingPrompt(emotion, profileFrom(controls), emoteScale, emoteHoldMs)
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.left = "-9999px"
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    const done = ok ? Promise.resolve() : navigator.clipboard.writeText(text)
    void done.then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    })
  }
  return (
    <aside className="drawer" aria-label="Feeling controls">
      <header className="drawer-head">
        <h2>Feeling</h2>
        <button type="button" className="icon-button" aria-label="Close settings" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <FeelingForm
        controls={controls}
        emoteScale={emoteScale}
        emoteHoldMs={emoteHoldMs}
        onChange={onChange}
        onEmoteScale={onEmoteScale}
        onEmoteHoldMs={onEmoteHoldMs}
      />

      <div className="drawer-actions">
        <button type="button" className="drawer-reset" onClick={copyPrompt}>
          {copied ? "Copied" : "Copy prompt"}
        </button>
        <button type="button" className="drawer-reset" onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  )
}

export function FeelingForm({
  controls,
  emoteScale,
  emoteHoldMs,
  onChange,
  onEmoteScale,
  onEmoteHoldMs,
}: {
  controls: FeelingControls
  emoteScale: number
  emoteHoldMs: number
  onChange: (patch: Partial<FeelingControls>) => void
  onEmoteScale: (value: number) => void
  onEmoteHoldMs: (value: number) => void
}) {
  return (
    <>
      <section className="drawer-section">
        <h3>Face</h3>
        <Modes label="Eyes" value={controls.eyes} options={eyeModes} onChange={eyes => onChange({eyes})} />
        <Modes label="Brows" value={controls.brows} options={browModes} onChange={brows => onChange({brows})} />
        <Modes label="Mouth" value={controls.mouth} options={mouthModes} onChange={mouth => onChange({mouth})} />
        <Modes
          label="Blush"
          value={controls.blush ? "on" : "off"}
          options={["off", "on"] as const}
          onChange={value => onChange({blush: value === "on"})}
        />
        <Slider
          label="Mouth shift"
          value={controls.mouthShift}
          min={-2}
          max={2}
          step={1}
          text={String(controls.mouthShift)}
          onChange={mouthShift => onChange({mouthShift})}
        />
      </section>

      <section className="drawer-section">
        <h3>Motion</h3>
        <Slider
          label="Bounce time"
          value={controls.bobSeconds}
          min={0.4}
          max={16}
          step={0.05}
          text={`${trim(controls.bobSeconds)}s`}
          onChange={bobSeconds => onChange({bobSeconds})}
        />
        <Slider
          label="Bounce height"
          value={controls.bobLift}
          min={0}
          max={30}
          step={1}
          text={`${controls.bobLift}%`}
          onChange={bobLift => onChange({bobLift})}
        />
        <Slider
          label="Blink every"
          value={controls.blinkSeconds}
          min={0}
          max={20}
          step={0.1}
          text={controls.blinkSeconds <= 0 ? "off" : `${trim(controls.blinkSeconds)}s`}
          onChange={blinkSeconds => onChange({blinkSeconds})}
        />
        <Slider
          label="Flicker pixels"
          value={controls.flickerPixels}
          min={0}
          max={8}
          step={1}
          text={controls.flickerPixels <= 0 ? "off" : String(controls.flickerPixels)}
          onChange={flickerPixels => onChange({flickerPixels})}
        />
        <Slider
          label="Flicker every"
          value={controls.flickerMs}
          min={80}
          max={2000}
          step={20}
          text={`${controls.flickerMs} ms`}
          onChange={flickerMs => onChange({flickerMs})}
        />
        <Slider
          label="Flicker randomness"
          value={controls.flickerRandom}
          min={0}
          max={1}
          step={0.05}
          text={`${Math.round(controls.flickerRandom * 100)}%`}
          onChange={flickerRandom => onChange({flickerRandom})}
        />
      </section>

      <section className="drawer-section">
        <h3>Playback</h3>
        <Slider
          label="Emote speed"
          value={emoteScale}
          min={0.25}
          max={2}
          step={0.05}
          text={`${trim(emoteScale)}×`}
          onChange={onEmoteScale}
        />
        <Slider
          label="Emote hold"
          value={emoteHoldMs}
          min={500}
          max={6000}
          step={100}
          text={`${(emoteHoldMs / 1000).toFixed(1)}s`}
          onChange={onEmoteHoldMs}
        />
      </section>
    </>
  )
}

function trim(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function Modes<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <div className="modes">
      <span>{label}</span>
      <div role="listbox" aria-label={label}>
        {options.map(option => (
          <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  text,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  text: string
  onChange: (value: number) => void
}) {
  return (
    <label className="slider">
      <span>
        {label}
        <b>{text}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={event => onChange(Number(event.target.value))}
      />
    </label>
  )
}

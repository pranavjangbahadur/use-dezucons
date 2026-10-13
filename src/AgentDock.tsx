import {useState, type ReactNode} from "react"
import {PixelAvatar, type PixelAvatarProps} from "./PixelAvatar.tsx"
import type {Emote} from "./emotes.ts"
import type {Emotion} from "./emotions.ts"

export function AgentDock({
  name,
  emotion = "idle",
  emote,
  emoteToken,
  emoteScale,
  emoteHoldMs,
  profile,
  contained = false,
  /** The close mark is drawn, and does not close the panel. */
  sample = false,
  open,
  onOpenChange,
  children,
}: {
  name: string
  emotion?: Emotion
  emote?: Emote
  emoteToken?: number
  emoteScale?: number
  emoteHoldMs?: number
  profile?: PixelAvatarProps["profile"]
  /** Sits in the parent instead of the screen corner. */
  contained?: boolean
  sample?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}) {
  const [localOpen, setLocalOpen] = useState(false)
  const shown = open ?? localOpen
  function setOpen(next: boolean) {
    onOpenChange?.(next)
    if (open == null) setLocalOpen(next)
  }
  const face = {name, emotion, emote, emoteToken, emoteScale, emoteHoldMs, profile}
  return (
    <div className={contained ? "agent-dock agent-dock-contained" : "agent-dock"}>
      {shown ? (
        <section className="agent-dock-panel" aria-label={`${name} chat`}>
          <header className="agent-dock-head">
            <PixelAvatar {...face} size={36} />
            <strong>{name}</strong>
            {sample ? (
              <span className="agent-dock-close" aria-hidden="true">
                ×
              </span>
            ) : (
              <button type="button" className="agent-dock-close" aria-label="Close chat" onClick={() => setOpen(false)}>
                ×
              </button>
            )}
          </header>
          <div className="agent-dock-body">{children}</div>
        </section>
      ) : null}
      <button type="button" className="agent-dock-launcher" aria-label={shown ? `Hide ${name}` : `Open ${name}`} aria-expanded={shown} onClick={() => setOpen(!shown)}>
        <PixelAvatar {...face} size={44} />
      </button>
    </div>
  )
}

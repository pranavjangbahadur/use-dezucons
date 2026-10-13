import {PixelAvatar, type PixelAvatarProps} from "./PixelAvatar.tsx"
import type {Emote} from "./emotes.ts"
import type {Emotion} from "./emotions.ts"

export function AgentContact({
  name,
  text,
  emotion = "idle",
  emote,
  emoteToken,
  emoteScale,
  emoteHoldMs,
  profile,
  pressed = false,
  onSelect,
}: {
  name: string
  text: string
  emotion?: Emotion
  emote?: Emote
  emoteToken?: number
  emoteScale?: number
  emoteHoldMs?: number
  profile?: PixelAvatarProps["profile"]
  pressed?: boolean
  onSelect?: () => void
}) {
  return (
    <button type="button" className="agent-contact" aria-pressed={pressed} onClick={onSelect}>
      <PixelAvatar
        name={name}
        size={40}
        emotion={emotion}
        emote={emote}
        emoteToken={emoteToken}
        emoteScale={emoteScale}
        emoteHoldMs={emoteHoldMs}
        profile={profile}
      />
      <span>
        <strong>{name}</strong>
        <small>{text}</small>
      </span>
    </button>
  )
}

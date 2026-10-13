import type {Emote} from "../src/emotes.ts"
import type {Emotion} from "../src/emotions.ts"

export type SimRole = "user" | "lead" | "sub" | "tool"

export type SimBeat = {
  role: SimRole
  emotion: Emotion
  emote?: Emote
  kind: "text" | "tool" | "code"
  text: string
  /** How long the finished line stays, in the emotion, before the next one. */
  holdMs: number
}

/**
 * How the dezucons remember Primer TTT. A rocket, a frightened
 * giant, and the small heroes who won. Tool calls have no face.
 * Every emotion and emote is spoken.
 */
export const simScript: SimBeat[] = [
  {
    role: "user",
    emotion: "idle",
    kind: "text",
    text: "where did you come from?",
    holdMs: 2400,
  },
  {
    role: "lead",
    emotion: "thinking",
    kind: "text",
    text: "Give me a second. The name is still in here. Primer TTT. A little exoplanet, very far, and very quiet. The rest is fuzzy. I'll look.",
    holdMs: 4400,
  },
  {
    role: "tool",
    emotion: "idle",
    kind: "tool",
    text: 'grep("home", "primer.log")\nPrimer TTT — seven skies, a rocket, a hold full of dezucons',
    holdMs: 3400,
  },
  {
    role: "lead",
    emotion: "surprised",
    kind: "text",
    text: "Oh. We didn't grow here. Someone buckled us into a rocket and dropped us. I remember the seat more than the sky.",
    holdMs: 4000,
  },
  {
    role: "lead",
    emotion: "idle",
    emote: "blink",
    kind: "code",
    text: 'flight = {\n  from: "Primer TTT",\n  seats: "every dezucon who could still feel"\n}',
    holdMs: 3400,
  },
  {
    role: "lead",
    emotion: "happy",
    emote: "teeth",
    kind: "text",
    text: "But the land. I do remember the land. Beautiful, and a little mysterious, like it was keeping a secret for us. Seven dimensions. Every dezucon had a power, and we used to show them off before breakfast.",
    holdMs: 4800,
  },
  {
    role: "tool",
    emotion: "idle",
    kind: "tool",
    text: 'run("memory")\nfail — the years after the light are gone',
    holdMs: 3200,
  },
  {
    role: "lead",
    emotion: "sad",
    emote: "tears",
    kind: "text",
    text: "I don't remember my street. I don't remember who waved from the door. There's the light, and then a soft blank, and I miss what was in it.",
    holdMs: 4400,
  },
  {
    role: "lead",
    emotion: "confused",
    emote: "brow",
    kind: "text",
    text: "There was a giant one. Bigger than the rest of us. It started taking the rivers, the quiet, the powers we hadn't grown into yet. I'm still turning it over. It wasn't cruel. It was afraid it would be destroyed.",
    holdMs: 5000,
  },
  {
    role: "lead",
    emotion: "angry",
    kind: "text",
    text: "So it closed one frightened hand around the whole planet. Our home.",
    holdMs: 3400,
  },
  {
    role: "lead",
    emotion: "idle",
    kind: "text",
    text: "I was too small for the last part. Let me hand this over to a subagent. They were on the ground.",
    holdMs: 3600,
  },
  {
    role: "sub",
    emotion: "sleepy",
    emote: "wink",
    kind: "text",
    text: "I was half asleep in the hold. I'll stay with it. I remember the part that matters.",
    holdMs: 3600,
  },
  {
    role: "tool",
    emotion: "idle",
    kind: "tool",
    text: "await openGate()",
    holdMs: 2400,
  },
  {
    role: "sub",
    emotion: "idle",
    emote: "melt",
    kind: "code",
    text: 'function stand(us) {\n  us.share = "what the giant kept"\n}',
    holdMs: 3200,
  },
  {
    role: "tool",
    emotion: "idle",
    kind: "tool",
    text: "await paintFrame()",
    holdMs: 2200,
  },
  {
    role: "sub",
    emotion: "idle",
    emote: "tetris",
    kind: "text",
    text: "We didn't want a bigger monster. We wanted the rivers back. So the small powers came home, one by one, and found their people.",
    holdMs: 4400,
  },
  {
    role: "tool",
    emotion: "idle",
    kind: "tool",
    text: "palette.accent = dawn",
    holdMs: 2200,
  },
  {
    role: "sub",
    emotion: "idle",
    emote: "acid",
    kind: "text",
    text: "And the sky did that swirl. That's how Primer TTT says good morning. All seven colors, like it was proud of us.",
    holdMs: 4000,
  },
  {
    role: "tool",
    emotion: "idle",
    kind: "tool",
    text: "−12 +1",
    holdMs: 2000,
  },
  {
    role: "sub",
    emotion: "idle",
    emote: "singularity",
    kind: "text",
    text: "That's the whole fight. We took the fear out, and we put one shared hand in. We won. Nobody had to become the giant.",
    holdMs: 4400,
  },
  {
    role: "lead",
    emotion: "idle",
    kind: "text",
    text: "So that's us. The dezucons on this side of the rocket were the heroes. We don't remember much. We remember a beautiful land, and that we kept our powers. They just look like feelings now. They still work.",
    holdMs: 5200,
  },
]

# use-dezucons

Dezucons are identicons for agents. The name you give an agent becomes one of twelve classic faces, and that same name always comes back as that same face. The face shows where the agent is in the turn: thinking, happy, sad, and the rest.

```bash
npm install use-dezucons
```

```tsx
import {PixelAvatar, faceForTurn} from "use-dezucons"

const face = faceForTurn(status)

<PixelAvatar name="Nia" emotion={face.emotion} emote={face.emote} />
```

React 18 or newer is required. That one import brings the face and its motion.

## How to use: Basic

In its basic mode, the package already knows the usual agent moments and matches a face to each one. While the model is writing, the face is thinking. A tool call looks confused. When a result comes back it looks surprised, and when the answer is shown it looks happy. If the tool fails, the face is sad.

### Set up

**Coding agent.** Paste this into Cursor, Claude, or any coding agent writing in your repo:

```
Add use-dezucons as the face for our agent chat. Use basic mode.

Run: npm install use-dezucons

Render PixelAvatar with one stable name for the agent. When the agent changes status, call faceForTurn(status) and pass emotion and emote to the face.

Statuses:
- thinking while the model is writing
- tool during a tool call
- tool-result when a result comes back
- answering when the reply is shown
- tool-error when a tool fails
- waiting when the turn returns to the person
- idle when nothing is in flight

Leave the chat model's own prompt alone. The app already knows the status.

import {PixelAvatar, faceForTurn} from "use-dezucons"

const face = faceForTurn(status)

<PixelAvatar name="Nia" emotion={face.emotion} emote={face.emote} />
```

**Wire it manually.**

1. Install the package.

```
npm install use-dezucons
```

2. Render a face with a stable name.
3. Call `faceForTurn` with the status, and pass the emotion it returns.

```tsx
import {PixelAvatar, faceForTurn} from "use-dezucons"

const face = faceForTurn(status)

<PixelAvatar name="Nia" emotion={face.emotion} emote={face.emote} />
```

### Custom controls (optional)

This changes how a feeling looks, such as the eyes, mouth, and bounce. Basic or Advanced still decide when that feeling appears, and tears, teeth, and the other short beats still play. The prompt you get is an extra one, pasted alongside the prompt already on this page. Open the feeling controls, then press Generate prompt. That text appears here for you to copy.

## How to use: Advanced

Advanced is for a reply whose words carry the mood. A corner assistant that could not find a flight, or a personal contact checking in, can say how it feels. The model ends the reply with a feeling. The package shows that face and hides the mark.

### Set up

**Coding agent.** Paste this into Cursor, Claude, or any coding agent writing in your repo:

```
Add use-dezucons as the face for our agent chat. Use advanced mode.

Run: npm install use-dezucons

Paste this into the system prompt the app already sends:

You are an agent whose replies sit next to a pixel face. End every finished reply with one feeling mark after the words, and nowhere else: [[feel:emotion]] or [[feel:emotion:emote]].

Emotions: idle, happy, sad, surprised, angry, thinking, sleepy, confused.
Emotes, optional, a single beat: blink, wink, tears, teeth, melt, acid, tetris, brow, singularity.

Use sad when you cannot do the thing. Use happy when you can. Use surprised when a result is unexpected. Use confused when the ask is ambiguous. Use sleepy when you hand the turn back. Use angry almost never. While you are still working the face is already thinking, so the finished line should say how it landed.

One mark. Short replies. Do not mention the mark in the words.
A corner assistant and a personal contact use the same mark. A contact keeps one stable name, so the face shape never changes and only the feeling does.

In the chat screen, before the assistant's message is shown, pass the finished reply through readFeeling. message is that string, whatever the code already calls it. reply.text is the sentence to show. reply.emotion is the feeling for the face. The mark is removed, so the person reading never sees it.

import {PixelAvatar, readFeeling} from "use-dezucons"

const reply = readFeeling(message)

<PixelAvatar name="Nia" emotion={reply.emotion} emote={reply.emote} />
<p>{reply.text}</p>
```

**Wire it manually.**

1. Install the package.

```
npm install use-dezucons
```

2. Paste this into the system prompt you already send:

```
You are an agent whose replies sit next to a pixel face. End every finished reply with one feeling mark after the words, and nowhere else: [[feel:emotion]] or [[feel:emotion:emote]].

Emotions: idle, happy, sad, surprised, angry, thinking, sleepy, confused.
Emotes, optional, a single beat: blink, wink, tears, teeth, melt, acid, tetris, brow, singularity.

Use sad when you cannot do the thing. Use happy when you can. Use surprised when a result is unexpected. Use confused when the ask is ambiguous. Use sleepy when you hand the turn back. Use angry almost never. While you are still working the face is already thinking, so the finished line should say how it landed.

One mark. Short replies. Do not mention the mark in the words.
A corner assistant and a personal contact use the same mark. A contact keeps one stable name, so the face shape never changes and only the feeling does.
```

3. In the chat screen, pass the finished reply through `readFeeling` before it is shown. `reply.text` is the sentence. `reply.emotion` is the face.

```tsx
import {PixelAvatar, readFeeling} from "use-dezucons"

const reply = readFeeling(message)

<PixelAvatar name="Nia" emotion={reply.emotion} emote={reply.emote} />
<p>{reply.text}</p>
```

### Custom controls (optional)

This changes how a feeling looks, such as the eyes, mouth, and bounce. Basic or Advanced still decide when that feeling appears, and tears, teeth, and the other short beats still play. The prompt you get is an extra one, pasted alongside the prompt already on this page. Open the feeling controls, then press Generate prompt. That text appears here for you to copy.

## Playground

From this folder:

```bash
npm install
npm run dev
```

Open the local URL Vite prints (port 5174). `npm test` runs the checks.

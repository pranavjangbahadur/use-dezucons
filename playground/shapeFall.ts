export type Chip = {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  /** Degrees. Chips are free to rest at any angle. */
  angle: number
  /** Degrees per second. */
  spin: number
}

const GRAVITY = 2400

/** Everyone leaves the top of the box in the same moment. */
export function scatterChips(chips: Chip[], width: number, _height: number, random: () => number = Math.random) {
  for (const chip of chips) {
    const room = Math.max(0, width - chip.w)
    chip.x = random() * room
    chip.y = random() * 4
    chip.vx = (random() - 0.5) * 24
    chip.vy = 0
    chip.angle = random() * 360
    chip.spin = (random() - 0.5) * 260
  }
}

/**
 * One jerk of the box. Direction flips between calls so a run of these
 * rattles the pile instead of throwing it once.
 */
export function rattleChips(chips: Chip[], direction: 1 | -1, random: () => number = Math.random) {
  for (const chip of chips) {
    const loosen = 0.7 + random() * 0.6
    chip.vx += direction * (640 + random() * 220) * loosen
    chip.vy -= (260 + random() * 280) * loosen
    chip.spin = Math.max(-320, Math.min(320, chip.spin + (random() - 0.5) * 480))
  }
}

/** One moment of the pile. Returns true once every chip has come to rest. */
export function stepPile(chips: Chip[], width: number, height: number, dt: number, loose = false): boolean {
  const step = dt > 0.032 ? 0.032 : dt
  for (const chip of chips) {
    chip.vy += GRAVITY * step
    chip.vx *= 0.992
    chip.spin *= 0.992
    const speed = Math.hypot(chip.vx, chip.vy)
    if (speed > 900) {
      chip.vx *= 900 / speed
      chip.vy *= 900 / speed
    }
    chip.x += chip.vx * step
    chip.y += chip.vy * step
    chip.angle += chip.spin * step
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < chips.length; i++) {
      for (let j = i + 1; j < chips.length; j++) separate(chips[i]!, chips[j]!)
    }
    for (const chip of chips) clamp(chip, width, height, loose)
  }
  for (let i = 0; i < chips.length; i++) {
    for (let j = i + 1; j < chips.length; j++) nudge(chips[i]!, chips[j]!)
  }
  const grounded = new Set<Chip>()
  for (const chip of chips) {
    if (bottomOf(chip) >= height - 2) grounded.add(chip)
  }
  let grew = true
  while (grew) {
    grew = false
    for (const chip of chips) {
      if (grounded.has(chip)) continue
      if (chips.some(other => grounded.has(other) && overlap(chip, other))) {
        grounded.add(chip)
        grew = true
      }
    }
  }
  if (!loose) {
    for (const chip of chips) {
      const speed = Math.hypot(chip.vx, chip.vy)
      const inPile = chip.y > height * 0.35 && chips.some(other => other !== chip && overlap(chip, other) != null)
      if ((grounded.has(chip) && speed < 220 && Math.abs(chip.spin) < 80) || (inPile && speed < 150)) {
        chip.vx = 0
        chip.vy = 0
        chip.spin = 0
      }
    }
  }
  return !loose && chips.every(chip => chip.vx === 0 && chip.vy === 0 && chip.spin === 0)
}

function bottomOf(chip: Chip): number {
  return Math.max(...corners(chip, 1).map(point => point.y))
}

function corners(chip: Chip, scale = 1): {x: number; y: number}[] {
  const rad = (chip.angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = chip.x + chip.w / 2
  const cy = chip.y + chip.h / 2
  const hx = (chip.w / 2) * scale
  const hy = (chip.h / 2) * scale
  return [
    [-hx, -hy],
    [hx, -hy],
    [hx, hy],
    [-hx, hy],
  ].map(([lx, ly]) => ({
    x: cx + cos * (lx ?? 0) - sin * (ly ?? 0),
    y: cy + sin * (lx ?? 0) + cos * (ly ?? 0),
  }))
}

function clamp(chip: Chip, width: number, height: number, loose: boolean) {
  const points = corners(chip, 1)
  let left = points[0]?.x ?? 0
  let right = left
  let top = points[0]?.y ?? 0
  let bottom = top
  for (const point of points) {
    if (point.x < left) left = point.x
    if (point.x > right) right = point.x
    if (point.y < top) top = point.y
    if (point.y > bottom) bottom = point.y
  }
  if (left < 0) {
    chip.x -= left
    if (chip.vx < 0) chip.vx *= loose ? -0.55 : -0.15
    chip.spin *= loose ? 0.95 : 0.8
  }
  if (right > width) {
    chip.x -= right - width
    if (chip.vx > 0) chip.vx *= loose ? -0.55 : -0.15
    chip.spin *= loose ? 0.95 : 0.8
  }
  if (top < 0) {
    chip.y -= top
    if (chip.vy < 0) chip.vy = loose ? -chip.vy * 0.35 : 0
  }
  if (bottom > height) {
    chip.y -= bottom - height
    if (loose) {
      if (chip.vy > 0) chip.vy *= -0.45
      chip.vx *= 0.92
      chip.spin *= 0.92
    } else {
      chip.vy = chip.vy > 420 ? -chip.vy * 0.12 : 0
      chip.vx *= 0.35
      chip.spin *= 0.3
      if (Math.abs(chip.spin) < 20) chip.spin = 0
    }
  }
}

function separate(a: Chip, b: Chip) {
  const hit = overlap(a, b)
  if (!hit) return
  const {depth, nx, ny} = hit
  const push = Math.min(depth / 2, 3)
  a.x -= nx * push
  a.y -= ny * push
  b.x += nx * push
  b.y += ny * push
}

function nudge(a: Chip, b: Chip) {
  const hit = overlap(a, b)
  if (!hit) return
  const {nx, ny} = hit
  const aN = a.vx * nx + a.vy * ny
  const bN = b.vx * nx + b.vy * ny
  if (aN <= bN) return
  const avg = (aN + bN) / 2
  a.vx += (avg - aN) * nx
  a.vy += (avg - aN) * ny
  b.vx += (avg - bN) * nx
  b.vy += (avg - bN) * ny
  const kick = Math.max(-28, Math.min(28, (aN - bN) * 0.03))
  a.spin = Math.max(-320, Math.min(320, a.spin + kick))
  b.spin = Math.max(-320, Math.min(320, b.spin - kick))
}

function overlap(a: Chip, b: Chip): {depth: number; nx: number; ny: number} | null {
  const pa = corners(a, 0.9)
  const pb = corners(b, 0.9)
  const axes = [...axesOf(pa), ...axesOf(pb)]
  let depth = Infinity
  let nx = 0
  let ny = 0
  for (const axis of axes) {
    const aProj = project(pa, axis.x, axis.y)
    const bProj = project(pb, axis.x, axis.y)
    const pen = Math.min(aProj.max, bProj.max) - Math.max(aProj.min, bProj.min)
    if (pen <= 0) return null
    if (pen < depth) {
      depth = pen
      nx = axis.x
      ny = axis.y
    }
  }
  const acx = a.x + a.w / 2
  const acy = a.y + a.h / 2
  const bcx = b.x + b.w / 2
  const bcy = b.y + b.h / 2
  if ((bcx - acx) * nx + (bcy - acy) * ny < 0) {
    nx = -nx
    ny = -ny
  }
  return {depth, nx, ny}
}

function axesOf(points: {x: number; y: number}[]): {x: number; y: number}[] {
  const axes: {x: number; y: number}[] = []
  for (let i = 0; i < points.length; i++) {
    const current = points[i]
    const next = points[(i + 1) % points.length]
    if (!current || !next) continue
    const dx = next.x - current.x
    const dy = next.y - current.y
    const len = Math.hypot(dx, dy) || 1
    axes.push({x: -dy / len, y: dx / len})
  }
  return axes
}

function project(points: {x: number; y: number}[], ax: number, ay: number) {
  let min = Infinity
  let max = -Infinity
  for (const point of points) {
    const dot = point.x * ax + point.y * ay
    if (dot < min) min = dot
    if (dot > max) max = dot
  }
  return {min, max}
}

export function attachShapeFall(
  box: HTMLElement,
  chips: HTMLElement[],
  onRested: (index: number) => void = () => {},
): {shake: () => void; stop: () => void} {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const parts: Chip[] = chips.map(() => ({x: 0, y: 0, vx: 0, vy: 0, w: 76, h: 64, angle: 0, spin: 0}))
  let frame = 0
  let last = 0
  let calm = 0
  let started = false
  let alive = true
  let shakeUntil = 0
  let shakeStarted = 0
  let nextKick = 0
  let kickDir: 1 | -1 = 1
  let pendingRemark = false
  const shakeMs = 720
  const shakeCap = 3000
  const stage = box.closest(".page")?.querySelector(".stage")

  function matchPreview() {
    if (!(stage instanceof HTMLElement)) return
    const height = stage.getBoundingClientRect().height
    if (height > 0) box.style.height = `${height}px`
  }

  function bounds() {
    const style = getComputedStyle(box)
    const padLeft = Number.parseFloat(style.paddingLeft) || 0
    const padTop = Number.parseFloat(style.paddingTop) || 0
    const padRight = Number.parseFloat(style.paddingRight) || 0
    const padBottom = Number.parseFloat(style.paddingBottom) || 0
    return {
      padLeft,
      padTop,
      w: box.clientWidth - padLeft - padRight,
      h: box.clientHeight - padTop - padBottom,
    }
  }

  function paint(padLeft: number, padTop: number) {
    parts.forEach((part, index) => {
      const chip = chips[index]
      if (!chip) return
      chip.style.transform = `translate(${padLeft + part.x}px, ${padTop + part.y}px) rotate(${part.angle}deg)`
      chip.style.zIndex = String(100 + Math.round(part.y))
      chip.dataset.placed = "true"
    })
  }

  function measure() {
    parts.forEach((part, index) => {
      const chip = chips[index]
      if (!chip) return
      part.w = chip.offsetWidth || 76
      part.h = chip.offsetHeight || 64
    })
  }

  function layoutStill(width: number, height: number) {
    const cols = Math.max(2, Math.floor(width / 84))
    const rows = Math.ceil(parts.length / cols)
    const colW = width / cols
    parts.forEach((part, index) => {
      const col = index % cols
      const rowFromBottom = rows - 1 - Math.floor(index / cols)
      part.x = col * colW + (colW - part.w) / 2
      part.y = height - part.h - rowFromBottom * (part.h + 8)
      part.vx = 0
      part.vy = 0
      part.angle = 0
      part.spin = 0
    })
  }

  function tick(now: number) {
    if (!alive) return
    matchPreview()
    const boxBounds = bounds()
    if (boxBounds.w < 40 || boxBounds.h < 40) {
      frame = window.requestAnimationFrame(tick)
      return
    }
    if (!started) {
      measure()
      if (reduce) layoutStill(boxBounds.w, boxBounds.h)
      else scatterChips(parts, boxBounds.w, boxBounds.h)
      started = true
    }
    const dt = last ? (now - last) / 1000 : 0.016
    last = now
    const loose = now < shakeUntil
    let settled = reduce
    if (!reduce) {
      if (loose && now >= nextKick) {
        rattleChips(parts, kickDir)
        kickDir = kickDir === 1 ? -1 : 1
        nextKick += 85
      }
      settled = stepPile(parts, boxBounds.w, boxBounds.h, dt, loose)
    }
    if (shakeStarted) fadeShake(now, settled)
    paint(boxBounds.padLeft, boxBounds.padTop)
    if (!loose) box.classList.remove("is-shaking")
    const quiet = parts.every(part => Math.hypot(part.vx, part.vy) < 80 && Math.abs(part.spin) < 40)
    calm = settled || (!loose && quiet) ? calm + 1 : 0
    const capped = shakeStarted > 0 && now >= shakeStarted + shakeCap
    if (pendingRemark && !loose && (calm >= 12 || capped)) {
      pendingRemark = false
      onRested(topIndex())
    }
    if (calm < 12 || pendingRemark) frame = window.requestAnimationFrame(tick)
  }

  function fadeShake(now: number, settled: boolean) {
    const age = now - shakeStarted
    if (age >= shakeCap) {
      for (const part of parts) {
        part.vx = 0
        part.spin = 0
      }
      if (settled) shakeStarted = 0
      return
    }
    if (age <= shakeMs) return
    const remain = 1 - age / shakeCap
    const damp = 0.82 + 0.16 * remain
    for (const part of parts) {
      part.vx *= damp
      part.spin *= damp
    }
  }

  function topIndex() {
    let best = 0
    let y = Infinity
    parts.forEach((part, index) => {
      if (part.y < y) {
        y = part.y
        best = index
      }
    })
    return best
  }

  function shake() {
    if (!alive || !started) return
    if (reduce) {
      onRested(topIndex())
      return
    }
    pendingRemark = true
    const now = performance.now()
    shakeStarted = now
    shakeUntil = now + shakeMs
    nextKick = now
    kickDir = Math.random() < 0.5 ? 1 : -1
    calm = 0
    box.classList.remove("is-shaking")
    void box.offsetWidth
    box.classList.add("is-shaking")
    window.cancelAnimationFrame(frame)
    frame = window.requestAnimationFrame(tick)
  }

  matchPreview()
  frame = window.requestAnimationFrame(tick)
  const observer = new ResizeObserver(() => {
    calm = 0
    if (alive && started) frame = window.requestAnimationFrame(tick)
  })
  observer.observe(box)
  if (stage instanceof HTMLElement) observer.observe(stage)

  return {
    shake,
    stop() {
      alive = false
      box.classList.remove("is-shaking")
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    },
  }
}

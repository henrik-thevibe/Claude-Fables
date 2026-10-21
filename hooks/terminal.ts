/**
 * The terminal's cartoon. The terminal has no Svg, so a scene is painted here
 * straight into a Raster: every cell a '▀' whose foreground is the pixel above
 * and background the pixel below, so a cell holds two square-ish pixels. The
 * caption's bubble is laid over the same grid as text cells, and typed out.
 *
 * It is drawn again for each frame (a few thousand pixels) and blitted in place.
 */
import type { FablesHeroAction, FablesScene } from '../types'

import { ENTRANCE_SECONDS, TYPE_SECONDS_PER_CHAR } from './scene'
import { HERO_FRAMES } from './sprites'
import { type Kind, rng, type Word, words, wrapWords } from './svg'

/** The most rows the stage takes; fewer when the band has less room. */
export const TERM_ROWS = 10
const MIN_ROWS = 5
const HALF = 0x2580 // ▀
const DEFAULT = 0x01000000

type Rgb = number
const hex = (c: string): Rgb => {
  const s = c.replace('#', '')
  const full = s.length === 3 ? s.replace(/./g, ch => ch + ch) : s
  const v = parseInt(full, 16)
  return Number.isFinite(v) ? v & 0xffffff : 0
}
const lerp = (a: Rgb, b: Rgb, t: number): Rgb => {
  const k = Math.max(0, Math.min(1, t))
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k)
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}

/** The stage's size in cells, from the room the band has. */
export function termBox(bodyColumns: number, maxRows: number): { columns: number; rows: number } {
  const columns = Math.max(20, Math.min(512, Math.floor(Number.isFinite(bodyColumns) ? bodyColumns : 80)))
  const rows = Math.max(MIN_ROWS, Math.min(TERM_ROWS, Math.floor((Number.isFinite(maxRows) ? maxRows : TERM_ROWS) - 1)))
  return { columns, rows }
}

// ---------------------------------------------------------------- pixels

class Canvas {
  readonly px: Uint32Array
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.px = new Uint32Array(w * h)
  }
  set(x: number, y: number, c: Rgb) {
    const xi = Math.round(x)
    const yi = Math.round(y)
    if (xi >= 0 && yi >= 0 && xi < this.w && yi < this.h) this.px[yi * this.w + xi] = c
  }
  get(x: number, y: number): Rgb {
    return this.px[Math.max(0, Math.min(this.h - 1, y)) * this.w + Math.max(0, Math.min(this.w - 1, x))] ?? 0
  }
  rect(x: number, y: number, w: number, h: number, c: Rgb) {
    for (let j = Math.max(0, Math.round(y)); j < Math.min(this.h, Math.round(y + h)); j++)
      for (let i = Math.max(0, Math.round(x)); i < Math.min(this.w, Math.round(x + w)); i++) this.px[j * this.w + i] = c
  }
  /** Fills each column from `top(x)` down to `bottom`. */
  ridge(top: (x: number) => number, color: (x: number, y: number) => Rgb, bottom = this.h) {
    for (let x = 0; x < this.w; x++) for (let y = Math.max(0, Math.round(top(x))); y < bottom; y++) this.set(x, y, color(x, y))
  }
  disc(cx: number, cy: number, r: number, c: Rgb) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, c)
  }
}

/** A smooth seeded line: a few sines, so a silhouette has no seam at any width. */
function wave(rand: () => number, amp: number, scale: number) {
  const parts = [0, 1, 2].map(i => ({ f: (0.6 + rand()) / scale / (i + 1) ** -0.6, p: rand() * 6.3, a: amp / (i + 1) }))
  return (x: number) => parts.reduce((t, s) => t + s.a * Math.sin(x * s.f + s.p), 0)
}

type Ctx = { c: Canvas; t: number; rand: () => number; ground: number; sky: Rgb | undefined; soil: Rgb | undefined; accent: Rgb | undefined }

const skyFill = (c: Canvas, top: Rgb, bottom: Rgb, until: number) => {
  for (let y = 0; y < until; y++) c.rect(0, y, c.w, 1, lerp(top, bottom, y / Math.max(1, until - 1)))
}
const stars = (x: Ctx, n: number, below: number, color = 0xf2efe6) => {
  for (let i = 0; i < n; i++) {
    const sx = Math.floor(x.rand() * x.c.w)
    const sy = Math.floor(x.rand() * below)
    const phase = x.rand() * 6.3
    if (Math.sin(x.t * 2 + phase) > -0.4) x.c.set(sx, sy, lerp(x.c.get(sx, sy), color, 0.55 + 0.45 * Math.sin(x.t * 3 + phase)))
  }
}

const BACKDROPS: Record<FablesScene['backdrop'], (x: Ctx) => void> = {
  forest({ c, t, rand, ground, sky, soil }) {
    skyFill(c, sky ?? 0xf1c58f, 0xfbe6c4, ground)
    c.disc(c.w * 0.72, ground - 6, 3, 0xfff1cf)
    const far = wave(rand, 1.5, 9)
    c.ridge(x => ground - 6 + far(x), () => 0x7f9a86, ground)
    // Two rows of firs: a far one in mist, a near one dark.
    for (const [row, tone, size] of [
      [0, 0x5f7f68, 4],
      [1, 0x2f5236, 6],
    ] as const) {
      for (let x = Math.floor(rand() * 5); x < c.w; x += 4 + Math.floor(rand() * 7)) {
        const h = size + Math.floor(rand() * 4)
        const base = ground - row
        for (let j = 0; j < h; j++) {
          const half = Math.floor((j / h) * (size / 2 + 1))
          c.rect(x - half, base - h + j, half * 2 + 1, 1, tone)
        }
      }
    }
    // A light shaft drifting through.
    const sx = ((t * 1.5) % (c.w + 20)) - 10
    for (let y = 0; y < ground; y++) for (let k = 0; k < 3; k++) c.set(sx + k + y * 0.4, y, lerp(c.get(Math.round(sx + k + y * 0.4), y), 0xfff4d6, 0.3))
    c.ridge(() => ground, (_x, y) => lerp(soil ?? 0x5e8c3a, 0x3d5e28, (y - ground) / 4))
  },
  space({ c, t, rand, ground, sky, soil }) {
    skyFill(c, sky ?? 0x05060d, 0x11142a, ground)
    stars({ c, t, rand, ground, sky, soil, accent: undefined }, Math.floor(c.w / 3), ground - 1)
    // Earth rising, half lit.
    const ex = c.w * 0.8
    for (let y = -4; y <= 4; y++)
      for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) c.set(ex + x, 4 + y, x < 1 ? (Math.sin(x + y * 2) > 0.3 ? 0xf2f2f2 : 0x3b7dd8) : 0x1a2340)
    const crest = wave(rand, 1.2, 7)
    c.ridge(x => ground + crest(x) * 0.6, (x, y) => lerp(soil ?? 0xb9b6ad, 0x55534f, (y - ground) / 4 + (Math.sin(x * 0.9) > 0.8 ? 0.3 : 0)))
    for (let i = 0; i < c.w / 14; i++) {
      const cx = rand() * c.w
      c.rect(cx, ground + 1 + Math.floor(rand() * 2), 2, 1, 0x2a2926)
    }
  },
  city({ c, t, rand, ground, sky, soil }) {
    skyFill(c, sky ?? 0x1b2547, 0x6a5f8c, ground)
    for (let x = 0; x < c.w; ) {
      const w = 3 + Math.floor(rand() * 6)
      const h = 4 + Math.floor(rand() * (ground - 5))
      const body = lerp(0x1d2236, 0x2d3350, rand())
      c.rect(x, ground - h, w, h, body)
      c.rect(x, ground - h, 1, h, lerp(body, 0x8e86b8, 0.4))
      for (let y = ground - h + 1; y < ground - 1; y += 2)
        for (let i = x + 1; i < x + w - 1; i += 2) if (rand() > 0.55) c.set(i, y, rand() > 0.2 ? 0xffd27a : 0x9fd6ff)
      x += w + Math.floor(rand() * 2)
    }
    // The elevated train, scrolling across.
    const ty = Math.max(2, ground - 3)
    c.rect(0, ty + 1, c.w, 1, 0x3b3e47)
    const tx = ((t * 14) % (c.w + 40)) - 30
    for (let k = 0; k < 24; k++) c.set(tx + k, ty, k % 6 === 5 ? 0x3b3e47 : k % 2 ? 0xffe9a8 : 0xc8ccd6)
    // Wet street: the skyline again, dimmed and broken.
    for (let y = ground; y < c.h; y++)
      for (let x = 0; x < c.w; x++) {
        const m = c.get(x + Math.round(Math.sin(y * 2 + t * 3 + x * 0.3)), 2 * ground - y - 1)
        c.set(x, y, lerp(soil ?? 0x14161f, m, 0.35))
      }
  },
  desert({ c, rand, ground, sky, soil }) {
    skyFill(c, sky ?? 0x40306b, 0xf29a5c, ground)
    c.disc(c.w * 0.5, ground - 2, 3, 0xffd36e)
    const mesa = wave(rand, 3, 12)
    c.ridge(x => ground - 5 + Math.max(-2, Math.round(mesa(x))), x => (Math.sin(x * 0.07) > 0 ? 0x6a4a7a : 0x87507a), ground)
    c.ridge(() => ground, (x, y) => lerp(soil ?? 0xe0a160, 0xb06a3c, (y - ground) / 4 + (Math.sin(x * 0.3 + y) > 0.85 ? 0.25 : 0)))
  },
  volcano({ c, t, rand, ground, sky, soil }) {
    skyFill(c, sky ?? 0x120a0e, 0x4a1a14, ground)
    const cx = c.w * 0.3
    for (let y = 1; y < ground; y++) {
      const half = (y / ground) * c.w * 0.18 + 1
      c.rect(cx - half, y + 2, half * 2, 1, lerp(0x2a1d1f, 0x3c2622, y / ground))
    }
    // Lava down the cone, flickering.
    for (let y = 3; y < ground + 2; y++) c.set(cx + Math.sin(y * 0.8) * 1.5, y, Math.sin(t * 8 + y) > 0 ? 0xff7a2b : 0xffb347)
    for (let i = 0; i < 5; i++) {
      const life = (t * 1.2 + i * 0.37) % 1
      c.set(cx + (rand() - 0.5) * 6 * life, 2 - life * 4 + 3, lerp(0xffd27a, 0x4a1a14, life))
    }
    c.ridge(() => ground, (x, y) => (Math.sin(x * 0.37 + y * 1.9) * Math.sin(x * 0.11 + y) > 0.85 ? lerp(0xff5a1f, 0xffb347, Math.sin(t * 4 + x) * 0.5 + 0.5) : (soil ?? 0x1c1716)))
  },
  lab({ c, t, rand, ground, sky, soil }) {
    skyFill(c, sky ?? 0x2b2a2e, 0x3b3833, ground)
    // A rainy window over bokeh.
    const wx = Math.floor(c.w * 0.6)
    const ww = Math.min(24, Math.floor(c.w * 0.25))
    c.rect(wx - 1, 1, ww + 2, ground - 3, 0x1a1a1c)
    c.rect(wx, 2, ww, ground - 5, 0x1f2b44)
    for (let i = 0; i < ww / 2; i++) c.set(wx + rand() * ww, 2 + rand() * (ground - 5), [0xffd27a, 0x9fd6ff, 0xff8a7a][i % 3] ?? 0)
    for (let i = 0; i < 4; i++) c.set(wx + ((i * 7 + 3) % ww), 2 + ((t * 6 + i * 3) % (ground - 5)), 0xb8c8e8)
    // The lamp and its warm cone.
    const lx = Math.floor(c.w * 0.25)
    c.rect(lx, 1, 3, 1, 0xd8b26a)
    for (let y = 2; y < ground; y++) for (let x = lx + 1 - y; x <= lx + 1 + y; x++) c.set(x, y, lerp(c.get(x, y), 0xffd99a, 0.25))
    c.rect(0, ground - 1, c.w, 1, 0x5a4634)
    c.ridge(() => ground, (x, y) => lerp(soil ?? 0x4a4038, c.get(x, 2 * ground - y - 1), 0.25))
  },
  night({ c, t, rand, ground, sky, soil }) {
    skyFill(c, sky ?? 0x0d1430, 0x26315c, ground)
    stars({ c, t, rand, ground, sky, soil, accent: undefined }, Math.floor(c.w / 4), ground - 4)
    c.disc(c.w * 0.15, 3, 2, 0xf4f0d8)
    const hill = wave(rand, 2, 14)
    c.ridge(x => ground - 3 + hill(x), () => 0x1a2a2a, ground)
    for (let x = 6 + Math.floor(rand() * 10); x < c.w - 4; x += 18 + Math.floor(rand() * 20)) {
      c.rect(x, ground - 3, 4, 3, 0x2b2b33)
      c.rect(x - 1, ground - 4, 6, 1, 0x3a2420)
      c.set(x + 1, ground - 2, 0xffd27a)
    }
    c.ridge(() => ground, () => soil ?? 0x13201b)
    for (let i = 0; i < c.w / 12; i++) {
      const fx = (rand() * c.w + Math.sin(t + i) * 3) % c.w
      const fy = ground - 1 - rand() * 6 + Math.sin(t * 1.3 + i) * 1.5
      if (Math.sin(t * 2.5 + i * 1.7) > 0) c.set(fx, fy, 0xd8ff6a)
    }
  },
}

function particles(x: Ctx, scene: FablesScene) {
  const p = scene.particles
  if (!p) return
  const { c, t } = x
  const r = rng(`${scene.caption}|particles`)
  const n = Math.round((c.w * c.h * Math.max(0, Math.min(1, p.density))) / 60)
  const accent = x.accent
  for (let i = 0; i < n; i++) {
    const px = r() * c.w
    const py = r() * c.h
    const s = 0.5 + r()
    switch (p.kind) {
      case 'rain':
        c.set(px - t * 6 * s, (py + t * 30 * s) % c.h, 0x9fbfe8)
        break
      case 'snow':
        c.set(px + Math.sin(t + i) * 2, (py + t * 4 * s) % c.h, 0xf4f6fb)
        break
      case 'bubbles':
        c.set(px + Math.sin(t * 2 + i), c.h - ((py + t * 5 * s) % c.h), accent ?? 0x9fe0f0)
        break
      case 'sparks': {
        const life = (t * s + r()) % 1
        if (life < 0.6) c.set(px, py - life * 4, lerp(accent ?? 0xffd27a, 0xff6a2b, life))
        break
      }
      case 'leaves':
        c.set((px + t * 8 * s) % c.w, (py + t * 3 * s + Math.sin(t * 2 + i) * 2) % c.h, i % 2 ? 0xd98a2b : 0xb8562b)
        break
      case 'stars':
        if (Math.sin(t * 3 + i) > 0) c.set(px, py * 0.6, accent ?? 0xfff4c2)
        break
    }
  }
}

// ---------------------------------------------------------------- hero

const CROSSING: Partial<Record<FablesHeroAction, number>> = { walk: 4, run: 2.4, fly: 3.5, carry: 5, sneak: 6, jump: 3.5, tumble: 3.5 }
const HERO_COLORS: Record<string, Rgb> = { o: 0xd97757, k: 0x1f1e1d }
const HERO_W = HERO_FRAMES[0]?.[0]?.length ?? 13
const HERO_H = HERO_FRAMES[0]?.length ?? 9

type Pose = { x: number; y: number; frame: number; blink: boolean; mark?: string; flip?: boolean }

/** Where Claude is and what it does `t` seconds into the scene. */
function pose(scene: FablesScene, w: number, ground: number, t: number): Pose {
  const { action, from, to, then } = scene.hero
  const span = CROSSING[action]
  const at = (pct: number) => (Math.max(0, Math.min(100, pct)) / 100) * (w - HERO_W)
  const baseY = ground - HERO_H + 1
  const blink = t % 3.2 > 3.05
  if (span !== undefined && t < span) {
    const k = t / span
    const x = at(from) + (at(to) - at(from)) * k
    const step = Math.floor(t * (action === 'run' ? 8 : action === 'sneak' ? 3 : 5)) % 2
    let y = baseY
    if (action === 'fly') y = baseY - 5 - Math.round(Math.sin(t * 4))
    if (action === 'jump') y = baseY - Math.round(Math.abs(Math.sin(k * Math.PI * 3)) * 4)
    if (action === 'tumble') y = baseY - (Math.floor(t * 4) % 2)
    if (action === 'sneak') y = baseY + 1
    return { x, y, frame: step, blink, mark: action === 'carry' ? '▣' : undefined, flip: to < from }
  }
  const x = span !== undefined ? at(to) : at(from)
  const still = span !== undefined ? t - span : t
  const act = span !== undefined ? (then ?? 'idle') : action
  const beat = Math.floor(still * 4)
  switch (act) {
    case 'celebrate':
    case 'dance':
      return { x: x + (act === 'dance' ? (beat % 2) - 0.5 : 0), y: baseY - (beat % 2) * 2, frame: beat % 2, blink, mark: act === 'celebrate' ? '★' : '♪' }
    case 'panic':
      return { x: x + (beat % 2 ? 1 : -1), y: baseY, frame: beat % 2, blink: false, mark: '!' }
    case 'sleep':
      return { x, y: baseY, frame: 0, blink: true, mark: Math.floor(still * 1.5) % 2 ? 'z' : 'Z' }
    case 'think':
      return { x, y: baseY, frame: 0, blink, mark: '?' }
    case 'point':
      return { x, y: baseY, frame: 0, blink, mark: '!' }
    case 'dig':
    case 'inspect':
      return { x, y: baseY + (beat % 2), frame: 0, blink, mark: act === 'inspect' ? '⌕' : undefined }
    case 'spin':
      return { x, y: baseY, frame: beat % 2, blink, flip: beat % 2 === 1 }
    case 'wave':
      return { x, y: baseY - (beat % 2), frame: 0, blink, mark: beat % 2 ? '/' : '\\' }
    case 'peek':
      return { x, y: baseY + 2, frame: 0, blink }
    case 'trip':
      return { x, y: baseY + (still < 0.6 ? 2 : 0), frame: 1, blink: still < 1, mark: still < 1.5 ? '!' : undefined }
    case 'shrug':
      return { x, y: baseY - (Math.floor(still * 2) % 2), frame: 0, blink, mark: '?' }
    default:
      return { x, y: baseY - (Math.floor(still * 0.8) % 2 ? 0 : 0), frame: Math.floor(still / 2.5) % 2, blink }
  }
}

function paintHero(c: Canvas, p: Pose, colors: Record<string, Rgb> = HERO_COLORS) {
  // Snapped once, so neighbouring pixels never round onto one another and lose the eyes.
  const x0 = Math.round(p.x)
  const y0 = Math.round(p.y)
  const rows = HERO_FRAMES[p.frame] ?? HERO_FRAMES[0] ?? []
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const key = row[p.flip ? row.length - 1 - i : i]
      if (!key || key === '.') continue
      const color = key === 'k' && p.blink ? colors.o : colors[key]
      if (color !== undefined) c.set(x0 + i, y0 + j, color)
    }
  })
}

// ---------------------------------------------------------------- styles

/**
 * Each style at terminal resolution: `scenery` repaints the lit stage before
 * Claude goes on it, `whole` works over stage and Claude together, and `hero`
 * is Claude's body and eyes in the style's inks.
 */
type TermStyle = {
  scenery?: (c: Canvas, ground: number, t: number) => void
  whole?: (c: Canvas, ground: number, t: number) => void
  hero?: Record<string, Rgb>
}

const lum = (v: Rgb) => (0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255
/** A fixed noise per pixel, so a texture holds still from frame to frame. */
const grain = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
const nearest = (v: Rgb, inks: readonly Rgb[]) => {
  let best = inks[0] ?? v
  let d = Infinity
  for (const ink of inks) {
    const dr = ((v >> 16) & 255) - ((ink >> 16) & 255)
    const dg = ((v >> 8) & 255) - ((ink >> 8) & 255)
    const db = (v & 255) - (ink & 255)
    const e = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11
    if (e < d) {
      d = e
      best = ink
    }
  }
  return best
}
/** Each pixel by `fn` of itself, its tone, and whether it stands on an edge. */
function repaint(c: Canvas, fn: (v: Rgb, x: number, y: number, l: number, edge: boolean) => Rgb) {
  const tones = Float32Array.from(c.px, lum)
  const tone = (x: number, y: number) => tones[Math.max(0, Math.min(c.h - 1, y)) * c.w + Math.max(0, Math.min(c.w - 1, x))] ?? 0
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      const l = tone(x, y)
      const edge = Math.abs(l - tone(x + 1, y)) > 0.12 || Math.abs(l - tone(x, y + 1)) > 0.12
      c.px[y * c.w + x] = fn(c.px[y * c.w + x] ?? 0, x, y, l, edge)
    }
}
const saturate = (v: Rgb, k: number, lift: number) => {
  const l = lum(v) * 255
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(l + (((v >> s) & 255) - l) * k + lift)))
  return (ch(16) << 16) | (ch(8) << 8) | ch(0)
}

const TERM_STYLES: Record<string, TermStyle> = {
  pixel: {},
  // The smooth original: the scenery softened a little, so Claude reads first.
  original: {
    scenery: c => {
      const src = Uint32Array.from(c.px)
      for (let y = 0; y < c.h; y++)
        for (let x = 1; x < c.w - 1; x++) c.px[y * c.w + x] = lerp(lerp(src[y * c.w + x - 1] ?? 0, src[y * c.w + x + 1] ?? 0, 0.5), src[y * c.w + x] ?? 0, 0.5)
    },
  },
  cave: {
    scenery: c =>
      repaint(c, (_v, x, y, l, edge) => {
        const rock = lerp(0xe2d3b2, 0xd2bf98, grain(x >> 3, y >> 2) * 0.6)
        if (edge && l < 0.5 && grain(x, y) > 0.45) return 0x2b2420
        const pigment = l < 0.18 ? 0x4a3a2e : l < 0.4 ? 0x9c4a2a : l < 0.62 ? 0xc89a52 : rock
        return lerp(pigment, rock, 0.25 + grain(x >> 1, y) * 0.15)
      }),
    hero: { o: 0xa8432a, k: 0x2b2420 },
  },
  blueprint: {
    scenery: (c, ground) =>
      repaint(c, (_v, x, y, l, edge) =>
        edge && l > 0.2
          ? 0xe8f1fb
          : y >= ground && (x + y) % 3 === 0
            ? 0x6f9ad0
            : y % 4 === 0 && x % 8 === 0
              ? 0x3a72b4
              : lerp(0x174581, 0x2459a0, l)),
    hero: { o: 0xe8f1fb, k: 0x174581 },
  },
  mosaic: {
    whole: c => {
      const stones = [0xe9dfc8, 0xc9b28a, 0x9a7b52, 0x6b4a32, 0x3a2e2a, 0xb84a32, 0xd98a52, 0x5a7a4a, 0x2f4f6a, 0x7aa0b8, 0xe0c060]
      repaint(c, (v, x, y) => (x % 3 === 2 || y % 3 === 2 ? 0x4a4038 : lerp(nearest(v, stones), 0xffffff, grain(x, y) * 0.12)))
    },
  },
  aero: {
    scenery: c => repaint(c, (v, _x, y, _l, edge) => (edge ? lerp(saturate(v, 1.5, 30), 0xffffff, 0.35) : lerp(saturate(v, 1.45, 18), 0x9fe4ff, y < 3 ? 0.4 - y * 0.1 : 0))),
    hero: { o: 0xff8a2c, k: 0x40250f },
    // The glossy rim: a white highlight on each top edge, Claude's too.
    whole: c => {
      for (let y = c.h - 1; y > 0; y--)
        for (let x = 0; x < c.w; x++) {
          const v = c.px[y * c.w + x] ?? 0
          if (lum(c.px[(y - 1) * c.w + x] ?? 0) + 0.25 < lum(v) || (v === 0xff8a2c && c.px[(y - 1) * c.w + x] !== 0xff8a2c)) c.px[y * c.w + x] = lerp(v, 0xffffff, 0.55)
        }
    },
  },
  engraving: {
    whole: c =>
      repaint(c, (_v, x, y, l, edge) => {
        const ink = 0x3b2a1e
        const paper = lerp(0xefe4cc, 0xe4d6b8, grain(x >> 3, y))
        if (edge && l > 0.1) return ink
        if (l > 0.5) return paper
        if (l > 0.3) return (x + 2 * y) % 5 === 0 ? ink : paper
        if (l > 0.16) return (x + y) % 3 === 0 ? ink : paper
        if (l > 0.07) return (x + y) % 2 === 0 ? ink : paper
        return x % 2 === 0 || y % 2 === 0 ? ink : paper
      }),
    hero: { o: 0x9a8a72, k: 0x3b2a1e },
  },
  tapestry: {
    whole: (c, ground) => {
      const wools = [0xa8322d, 0x2e4a7a, 0xd8b450, 0x5a3d2b, 0x4f6b3a, 0x2f4a2a, 0xe8dcc0, 0xc8642d, 0x7a8ab0]
      repaint(c, (v, x, y) => {
        const flower = y > ground && grain(x, y) > 0.9
        const wool = flower ? ([0xe8dcc0, 0xa8322d, 0xd8b450][Math.floor(grain(y, x) * 3)] ?? 0xe8dcc0) : nearest(v, wools)
        return lerp(wool, 0x000000, (y % 2 === 0 ? x % 2 : (x + 1) % 2) * 0.16)
      })
    },
    hero: { o: 0xc8642d, k: 0x2b1d14 },
  },
  golden: {
    scenery: c => {
      const inks = [0xf2e6c8, 0xe8c230, 0xd23a2a, 0x2a5aa8, 0x3a8a4a, 0x1a1a1a, 0x8a5a3a, 0xf28a3a, 0x7ab8e0, 0x4a2a6a]
      // Flat inks, heavy keylines, and Ben-Day dots in the shade (every fourth pixel, so they read as dots).
      repaint(c, (v, x, y, l, edge) => (edge ? 0x1a1a1a : l < 0.4 && x % 2 === 0 && y % 2 === 0 ? lerp(nearest(v, inks), 0xf2e6c8, 0.5) : nearest(v, inks)))
    },
    hero: { o: 0xf28a3a, k: 0x1a1a1a },
  },
  ukiyoe: {
    scenery: (c, ground) => {
      const inks = [0x2b3a67, 0x3d6a9a, 0xa8c4d8, 0xf0e6d0, 0xd2452f, 0x3d5a3a, 0x262220, 0xd8c49a, 0xe8a090, 0x6a8a5a]
      // Bokashi: the sky graded down from indigo, then each surface in a flat ink keyed in black.
      repaint(c, (v, _x, y, _l, edge) => (edge && y > 2 ? 0x262220 : y < ground ? lerp(nearest(v, inks), 0x2b3a67, Math.max(0, 0.7 - y * 0.18)) : nearest(v, inks)))
    },
    hero: { o: 0xd96a3a, k: 0x262220 },
  },
  kamon: {
    scenery: c => repaint(c, (_v, _x, _y, l, edge) => (edge ? 0x111111 : l > 0.42 ? 0xeee3c8 : 0x111111)),
    hero: { o: 0xeee3c8, k: 0x111111 },
    // The vermilion hanko in the corner.
    whole: c => c.rect(c.w - 4, c.h - 4, 3, 3, 0xd2452f),
  },
}
export const TERM_STYLE_NAMES = Object.keys(TERM_STYLES)

// ---------------------------------------------------------------- cells

const PAPER = 0xf4efe2
const PAPER_TROUBLE = 0xf7e1dc
const PAPER_GOOD = 0xe3f1dd
const INK = 0x1f1e1d
const KIND: Record<Kind, Rgb> = {
  plain: INK,
  code: 0x1f7f86,
  path: 0x2f62a8,
  fn: 0x7048a8,
  num: 0xc0581b,
  bad: 0xc0392b,
  good: 0x2a7f45,
  face: 0xb85c3e,
}

type Cell = { ch: number; fg: Rgb | typeof DEFAULT; bg: Rgb | typeof DEFAULT }

/** The caption as lines of colored characters, wrapped to `width`. */
function captionLines(scene: FablesScene, width: number, maxLines: number): { ch: string; fg: Rgb }[][] {
  const lines = wrapWords(words(scene.caption, scene.tone), width).slice(0, maxLines)
  return lines.map(line => {
    const out: { ch: string; fg: Rgb }[] = []
    line.forEach((w: Word, i) => {
      if (i) out.push({ ch: ' ', fg: INK })
      for (const ch of w.lead) out.push({ ch, fg: INK })
      for (const ch of w.core) out.push({ ch, fg: KIND[w.kind] })
      for (const ch of w.tail) out.push({ ch, fg: INK })
    })
    return out
  })
}

/** Only characters a terminal draws one cell wide; anything else shows as a dot. */
const narrow = (ch: string): number => {
  const cp = ch.codePointAt(0) ?? 0x2e
  return cp >= 0x20 && cp <= 0xffff && !/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) && !(cp >= 0xd800 && cp <= 0xdfff) ? cp : 0x2e
}

/**
 * One frame of `scene`, `t` seconds after it went up, as a Raster's `cells`
 * for a stage `columns` by `rows`.
 */
export function terminalFrame(scene: FablesScene, columns: number, rows: number, t: number, look = 'pixel'): string {
  const style = TERM_STYLES[look] ?? {}
  const c = new Canvas(columns, rows * 2)
  const ground = c.h - 5
  const ctx: Ctx = {
    c,
    t,
    rand: rng(`${scene.backdrop}|${scene.caption}`),
    ground,
    sky: scene.palette.sky ? hex(scene.palette.sky) : undefined,
    soil: scene.palette.ground ? hex(scene.palette.ground) : undefined,
    accent: scene.palette.accent ? hex(scene.palette.accent) : undefined,
  }
  BACKDROPS[scene.backdrop](ctx)
  particles(ctx, scene)
  style.scenery?.(c, ground, t)
  const p = pose(scene, columns, ground, t)
  paintHero(c, p, style.hero)
  style.whole?.(c, ground, t)
  // A fade in from black on a new setting.
  if (scene.enter === 'fade' && t < ENTRANCE_SECONDS) for (let i = 0; i < c.px.length; i++) c.px[i] = lerp(0, c.px[i] ?? 0, t / ENTRANCE_SECONDS)

  const grid: Cell[] = []
  for (let r = 0; r < rows; r++)
    for (let x = 0; x < columns; x++) grid.push({ ch: HALF, fg: c.get(x, r * 2), bg: c.get(x, r * 2 + 1) })
  const put = (x: number, y: number, ch: string, fg: Rgb, bg?: Rgb) => {
    const xi = Math.round(x)
    if (xi < 0 || y < 0 || xi >= columns || y >= rows) return
    const cell = grid[y * columns + xi]
    if (cell) grid[y * columns + xi] = { ch: narrow(ch), fg, bg: bg ?? lerp(cell.fg as Rgb, cell.bg as Rgb, 0.5) }
  }

  // The hero's mark (a thought, a note, a z), just above its head.
  if (p.mark) put(p.x + HERO_W - 2, Math.floor(p.y / 2) - 1, p.mark, p.mark === '!' ? 0xff5a4a : 0xfff4d6)

  // The bubble: beside Claude, typed out, walking along with it.
  const room = Math.max(12, Math.min(30, Math.floor(columns / 2) - 6))
  const lines = captionLines(scene, room - 2, Math.max(1, rows - 3))
  const width = Math.max(...lines.map(l => l.length), 1) + 2
  const height = lines.length + 2
  const heroCol = Math.round(p.x)
  const right = heroCol + HERO_W + 2
  const left = heroCol - width - 2
  const bx = right + width <= columns ? right : left >= 0 ? left : Math.max(0, Math.min(columns - width, right))
  const by = Math.max(0, Math.min(rows - height, Math.floor(p.y / 2) - 2))
  const paper = scene.tone === 'trouble' ? PAPER_TROUBLE : scene.tone === 'milestone' ? PAPER_GOOD : PAPER
  let typed = Math.max(0, Math.floor((t - ENTRANCE_SECONDS) / TYPE_SECONDS_PER_CHAR))
  for (let j = 0; j < height; j++)
    for (let i = 0; i < width; i++) {
      const edge = j === 0 ? (i === 0 ? '╭' : i === width - 1 ? '╮' : '─') : j === height - 1 ? (i === 0 ? '╰' : i === width - 1 ? '╯' : '─') : i === 0 || i === width - 1 ? '│' : ' '
      put(bx + i, by + j, edge, INK, paper)
    }
  lines.forEach((line, j) =>
    line.forEach((cell, i) => {
      if (typed-- > 0) put(bx + 1 + i, by + 1 + j, cell.ch, cell.fg, paper)
    }),
  )
  // The tail, pointing at Claude.
  const tailRow = Math.min(by + height - 1, Math.max(by, Math.floor((p.y + 2) / 2)))
  if (bx === right) put(bx - 1, tailRow, '◀', paper)
  else if (bx + width <= heroCol) put(bx + width, tailRow, '▶', paper)

  const out = new Uint32Array(grid.length * 3)
  grid.forEach((cell, i) => {
    out[i * 3] = cell.ch
    out[i * 3 + 1] = cell.fg
    out[i * 3 + 2] = cell.bg
  })
  // The engine's runtime has Uint8Array's base64 methods; es2023's lib does not name them yet.
  return (new Uint8Array(out.buffer) as Uint8Array & { toBase64(): string }).toBase64()
}

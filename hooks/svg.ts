import type { FablesHeroAction, FablesProp, FablesScene } from '../types'

import { type Motion, MOTION_TIMING } from './clawd3d'
import { type HeroPainter, motionSvg } from './hero3d'
import { gradeFilter } from './grade'
import { MONOCRAFT, MONOCRAFT_BOLD } from './monocraft'
import { ENTRANCE_SECONDS, TYPE_SECONDS_PER_CHAR } from './scene'
import { richBackdrop } from './scenery'
import { type Cell, type Look, lookFor, PAPER as CARD_PAPER, type Paper, type Tag, type WordKind } from './looks'
import { HERO_FRAMES, PALETTE, SPRITES, type SpriteName } from './sprites'

/**
 * The logical stage: always H tall, and as wide as the band's shape asks, from
 * MIN_W to MAX_W (W when nothing asks), so a wide window shows more of the
 * scene rather than a bigger one.
 */
export const W = 640
export const H = 128
export const MIN_W = 320
export const MAX_W = 1600
/** One art pixel, in stage units. */
export const U = 4
const GROUND_Y = 104
/** The desktop's Svg element takes at most this many characters. */
export const MAX_SVG = 131072
const BUDGET = 126000

const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
const INK = '#1f1e1d'
const PAPER = '#ece9df'

// ---------------------------------------------------------------- helpers

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** A small deterministic PRNG (mulberry32), so a scene always draws the same. */
export function rng(seedText: string): () => number {
  let seed = 2166136261
  for (let i = 0; i < seedText.length; i++) seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619)
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rect = { x: number; y: number; w: number; h: number }

const n = (v: number) => (Math.round(v * 100) / 100).toString()

/**
 * Pixel rows to compact SVG, in art-pixel units: one <path> per color, each
 * horizontal run of a color one `M x y h w v 1 h -w z` segment.
 */
export function pixelPaths(rows: readonly string[], colorOf: (key: string) => string | undefined, _cell: Cell = 'solid'): string {
  const byColor = new Map<string, string[]>()
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const key = row[x] ?? '.'
      const color = key === '.' ? undefined : colorOf(key)
      let end = x + 1
      while (end < row.length && row[end] === key) end++
      if (color) {
        const list = byColor.get(color) ?? []
        list.push(`M${x} ${y}h${end - x}v1h-${end - x}z`)
        byColor.set(color, list)
      }
      x = end
    }
  })
  return [...byColor].map(([color, d]) => `<path fill="${color}" d="${d.join('')}"/>`).join('')
}

const widthOf = (rows: readonly string[]) => Math.max(0, ...rows.map(r => r.length))

type Art = { rows: readonly string[]; colorOf: (key: string) => string | undefined }

function artFor(prop: FablesProp): Art {
  if (typeof prop.sprite === 'string') {
    const sprite = SPRITES[prop.sprite as SpriteName] ?? SPRITES.star
    const accent = prop.color ?? sprite.accent
    return { rows: sprite.rows, colorOf: k => (k === 'a' ? accent : PALETTE[k]) }
  }
  const { pixels, colors } = prop.sprite
  return { rows: pixels, colorOf: k => colors[k] }
}

// ---------------------------------------------------------------- backdrops

type Stage = {
  sky: string
  ground: string
  /** Where the hero's and props' feet rest. */
  floor: number
  back: string
  front: string
}

function backdrop(scene: FablesScene, rand: () => number, sw: number): Stage {
  const accent = scene.palette.accent
  const parts: string[] = []
  const front: string[] = []
  const at = (v: number) => Math.round(v / U) * U
  let sky = '#262624'
  let ground = '#3a3833'
  let floor = GROUND_Y

  switch (scene.backdrop) {
    case 'forest': {
      sky = '#20261f'
      ground = '#3c6e34'
      for (let i = 0; i < Math.round((9 * sw) / W); i++) {
        const x = at(rand() * sw)
        const h = at(24 + rand() * 30)
        parts.push(
          `<rect x="${x}" y="${GROUND_Y - h}" width="${U * 3}" height="${h}" fill="#2a3a26"/>`,
          `<rect x="${x - U * 2}" y="${GROUND_Y - h - U * 3}" width="${U * 7}" height="${U * 5}" fill="#2f4a2a"/>`,
        )
      }
      for (let x = 0; x < sw; x += U * 5) {
        const h = U * (1 + Math.floor(rand() * 3))
        front.push(`<rect x="${x + at(rand() * 8)}" y="${GROUND_Y - h}" width="${U}" height="${h}" fill="#5e9c4a"/>`)
      }
      break
    }
    case 'space': {
      sky = '#14121c'
      ground = '#14121c'
      floor = 92
      for (let i = 0; i < 3; i++) {
        const r = 4 + rand() * 12
        parts.push(`<circle cx="${n(rand() * sw)}" cy="${n(10 + rand() * 60)}" r="${n(r)}" fill="${['#54408a', '#7b5fb5', '#8a8780'][i]}" opacity=".7"/>`)
      }
      break
    }
    case 'city': {
      sky = '#1e2230'
      ground = '#33353d'
      let x = 0
      while (x < sw) {
        const w = at(24 + rand() * 40)
        const h = at(30 + rand() * 50)
        parts.push(`<rect x="${x}" y="${GROUND_Y - h}" width="${w - U}" height="${h}" fill="#2b2f3d"/>`)
        for (let wy = GROUND_Y - h + U * 2; wy < GROUND_Y - U * 2; wy += U * 3) {
          for (let wx = x + U; wx < x + w - U * 2; wx += U * 3) {
            if (rand() < 0.35) {
              const blink = rand() < 0.2 ? `<animate attributeName="opacity" values="1;.2;1" dur="${n(2 + rand() * 4)}s" repeatCount="indefinite"/>` : ''
              parts.push(`<rect x="${wx}" y="${wy}" width="${U}" height="${U}" fill="#e3b341" opacity=".8">${blink}</rect>`)
            }
          }
        }
        x += w
      }
      break
    }
    case 'desert': {
      sky = '#2e2620'
      ground = '#c9a46a'
      parts.push(`<circle cx="${n(80 + rand() * (sw - 160))}" cy="26" r="14" fill="#f0c060"/>`)
      for (let i = 0; i < Math.round((4 * sw) / W); i++) {
        const cx = rand() * sw
        parts.push(`<ellipse cx="${n(cx)}" cy="${GROUND_Y}" rx="${n(60 + rand() * 60)}" ry="${n(8 + rand() * 10)}" fill="#a8844f"/>`)
      }
      break
    }
    case 'volcano': {
      sky = '#2a1a17'
      ground = '#4a2c20'
      const vx = at(sw * 0.6 + rand() * (sw * 0.4 - 120))
      parts.push(
        `<polygon points="${vx},${GROUND_Y} ${vx + 50},${GROUND_Y - 70} ${vx + 66},${GROUND_Y - 70} ${vx + 116},${GROUND_Y}" fill="#5a3520"/>`,
        `<rect x="${vx + 50}" y="${GROUND_Y - 74}" width="16" height="6" fill="#f06a2b"><animate attributeName="fill" values="#f06a2b;#e3b341;#f06a2b" dur="1.4s" repeatCount="indefinite"/></rect>`,
      )
      for (let i = 0; i < 6; i++) {
        const dx = (rand() - 0.5) * 60
        parts.push(
          `<rect x="${vx + 56}" y="${GROUND_Y - 76}" width="${U}" height="${U}" fill="#f06a2b">` +
            `<animateTransform attributeName="transform" type="translate" values="0 0;${n(dx)} -30;${n(dx * 1.6)} 10" dur="${n(1.6 + rand())}s" begin="${n(rand() * 2)}s" repeatCount="indefinite"/>` +
            `<animate attributeName="opacity" values="1;1;0" dur="${n(1.6 + rand())}s" repeatCount="indefinite"/></rect>`,
        )
      }
      break
    }
    case 'lab': {
      sky = '#202628'
      ground = '#3b3e47'
      for (let x = 0; x < sw; x += 32) parts.push(`<rect x="${x}" y="0" width="1" height="${GROUND_Y}" fill="#2a3134"/>`)
      for (let y = 0; y < GROUND_Y; y += 32) parts.push(`<rect x="0" y="${y}" width="${sw}" height="1" fill="#2a3134"/>`)
      for (let x = 0; x < sw; x += U * 4) front.push(`<rect x="${x}" y="${GROUND_Y}" width="${U * 2}" height="${U}" fill="#5b5f6b"/>`)
      break
    }
    case 'night':
    default: {
      sky = '#1b1d26'
      ground = '#2c2e36'
      parts.push(`<circle cx="${n(60 + rand() * (sw - 120))}" cy="24" r="10" fill="#e8e3c8"/>`)
      break
    }
  }
  if (accent) front.push(`<rect x="0" y="${GROUND_Y}" width="${sw}" height="2" fill="${accent}" opacity=".7"/>`)
  return {
    sky: scene.palette.sky ?? sky,
    ground: scene.palette.ground ?? ground,
    floor,
    back: parts.join(''),
    front: front.join(''),
  }
}

/** The flat stage in the shape the scene draws: its front details sit on the ground, behind the props. */
const flatStage = (s: Stage) => ({ sky: s.sky, ground: s.ground, floor: s.floor, groundTop: GROUND_Y, back: s.back, near: s.front, keep: [] as Rect[], lens: '' })

// ---------------------------------------------------------------- particles

function particles(scene: FablesScene, rand: () => number, sw: number): string {
  if (!scene.particles) return ''
  const { kind, density } = scene.particles
  const count = Math.round((density * 36 * sw) / W)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const x = n(rand() * sw)
    const y = n(rand() * GROUND_Y)
    const dur = n(1.5 + rand() * 3)
    const begin = n(-rand() * 4)
    switch (kind) {
      case 'stars':
        out.push(
          `<rect x="${x}" y="${n(rand() * 80)}" width="2" height="2" fill="#e3d9a0"><animate attributeName="opacity" values="1;.15;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></rect>`,
        )
        break
      case 'rain':
        out.push(
          `<rect x="${x}" y="-8" width="1" height="6" fill="#6fa8d0"><animateTransform attributeName="transform" type="translate" values="0 0;-8 ${GROUND_Y + 8}" dur="${n(0.6 + rand() * 0.5)}s" begin="${begin}s" repeatCount="indefinite"/></rect>`,
        )
        break
      case 'snow':
        out.push(
          `<rect x="${x}" y="-4" width="2" height="2" fill="${PAPER}"><animateTransform attributeName="transform" type="translate" values="0 0;6 ${GROUND_Y / 2};-4 ${GROUND_Y + 4}" dur="${n(4 + rand() * 4)}s" begin="${begin}s" repeatCount="indefinite"/></rect>`,
        )
        break
      case 'bubbles':
        out.push(
          `<circle cx="${x}" cy="${GROUND_Y}" r="${n(1 + rand() * 2)}" fill="none" stroke="#9fd3e0"><animateTransform attributeName="transform" type="translate" values="0 0;4 -${GROUND_Y / 2};-2 -${GROUND_Y}" dur="${n(3 + rand() * 3)}s" begin="${begin}s" repeatCount="indefinite"/></circle>`,
        )
        break
      case 'sparks':
        out.push(
          `<rect x="${x}" y="${y}" width="2" height="2" fill="#e3b341"><animateTransform attributeName="transform" type="translate" values="0 0;${n((rand() - 0.5) * 20)} -20" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></rect>`,
        )
        break
      case 'leaves':
        out.push(
          `<rect x="${x}" y="-4" width="3" height="2" fill="${rand() < 0.5 ? '#c98a3a' : '#5e9c4a'}"><animateTransform attributeName="transform" type="translate" values="0 0;30 ${GROUND_Y / 2};10 ${GROUND_Y + 4}" dur="${n(4 + rand() * 3)}s" begin="${begin}s" repeatCount="indefinite"/></rect>`,
        )
        break
    }
  }
  return out.join('')
}

// ---------------------------------------------------------------- props

/** A hex color as rgb(), as prop labels have always been written. */
function fixed(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m?.[1]) return hex
  const v = parseInt(m[1], 16)
  return `rgb(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255})`
}

/** Label colors: the prop's own tint. */
export type TagStyle = { fill: string; ink: string; stroke: string }

function label(text: string, cx: number, y: number, tag: TagStyle, sw: number): string {
  const w = text.length * 5 + 8
  const x = Math.min(sw - w - 2, Math.max(2, cx - w / 2))
  const top = Math.max(2, y - 13)
  return (
    `<rect x="${n(x)}" y="${n(top)}" width="${w}" height="11" fill="${fixed(tag.fill)}" stroke="${fixed(tag.stroke)}" stroke-width="1"/>` +
    `<text x="${n(x + 4)}" y="${n(top + 8)}" font-family="${FONT}" font-size="8" fill="${fixed(tag.ink)}">${escapeXml(text)}</text>`
  )
}

/** One prop, drawn flat on the pixel stage, with its label tag above it. */
function propSvg(prop: FablesProp, floor: number, index: number, sw: number, cell: Cell): string {
  const art = artFor(prop)
  const w = widthOf(art.rows) * U
  const h = art.rows.length * U
  const x = Math.round(((sw - w) * prop.x) / 100)
  const y = prop.y === 'ground' ? floor - h : prop.y === 'air' ? 58 - h / 2 : 8
  const cx = x + w / 2
  const cy = y + h / 2
  const body = `<g transform="translate(${x} ${n(y)}) scale(${U})">${pixelPaths(art.rows, art.colorOf, cell)}</g>`
  const slow = n(2 + (index % 3) * 0.7)
  let motion = ''
  switch (prop.motion) {
    case 'bob':
      motion = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -${U};0 0" dur="${slow}s" repeatCount="indefinite"/>`
      break
    case 'drift':
      motion = `<animateTransform attributeName="transform" type="translate" values="0 0;24 -2;0 0" dur="${n(6 + index)}s" repeatCount="indefinite"/>`
      break
    case 'shake':
      motion = `<animateTransform attributeName="transform" type="translate" values="0 0;-2 0;2 0;0 0" dur=".25s" repeatCount="indefinite"/>`
      break
    case 'fall':
      motion = `<animateTransform attributeName="transform" type="translate" values="0 -${n(y + h)};0 0;0 0" keyTimes="0;.4;1" dur="3s" repeatCount="indefinite"/>`
      break
    case 'spin':
      motion = `<animateTransform attributeName="transform" type="rotate" values="0 ${n(cx)} ${n(cy)};360 ${n(cx)} ${n(cy)}" dur="${slow}s" repeatCount="indefinite"/>`
      break
    case 'blink':
      motion = `<animate attributeName="opacity" values="1;.25;1" dur="1s" repeatCount="indefinite"/>`
      break
    case 'scroll':
      motion = `<animateTransform attributeName="transform" type="translate" values="${sw - x} 0;${-x - w} 0" dur="${n(7 + index)}s" repeatCount="indefinite"/>`
      break
  }
  const tint = prop.color ?? '#d9d4c7'
  const style: TagStyle = { fill: INK, ink: tint, stroke: tint }
  const tag = prop.label ? label(prop.label, cx, y, style, sw) : ''
  return `<g>${body}${tag}${motion}</g>`
}

// ---------------------------------------------------------------- hero

const HERO_W = 13 * U
const HERO_H = 9 * U
const heroColor = (k: string) => PALETTE[k]

/** The hero's drawing, where it ends up, and when it gets there (seconds). */
type HeroPlan = { svg: string; startX: number; endX: number; endY: number; arrive: number }

/** How the hero is drawn: the pixel sprite in a cell style, or the 3D model painted one way. */
export type Figure = { kind: 'pixel'; cell: Cell } | { kind: '3d'; hero?: HeroPainter; lean?: boolean; second?: number }

/** The 3D model stands a little taller than the sprite, arms reaching past its box. */
const MODEL_STAGE_H = 40

/** The pixel sprite knows fewer moves: each newer action stands in as the nearest one it has. */
const SPRITE_ACTION: Record<FablesHeroAction, FablesHeroAction> = {
  walk: 'walk', run: 'run', fly: 'fly', dig: 'dig', inspect: 'inspect', celebrate: 'celebrate', think: 'think',
  carry: 'walk', sneak: 'walk', jump: 'run', tumble: 'run',
  panic: 'inspect', sleep: 'think', dance: 'celebrate', spin: 'celebrate', wave: 'celebrate', point: 'inspect', peek: 'inspect',
  trip: 'think', shrug: 'think',
}

/** How fast Claude crosses the stage, per travelling action (units a second). */
const SPEED: Partial<Record<FablesHeroAction, number>> = { run: 110, fly: 80, tumble: 90, jump: 60, carry: 30, sneak: 25 }

/** How high Claude's moves take it above its box, for the caption to keep clear of. */
export const heroReach = (action: FablesHeroAction): number =>
  action === 'celebrate' ? 16 : action === 'jump' ? 18 : action === 'dance' ? 6 : action === 'fly' || action === 'panic' ? 2 : 0

/** A loop that hands over to another plays this long first (seconds). */
const LOOP_FIRST = (motion: Motion) => Math.max(2.4, 2 * MOTION_TIMING[motion].dur)

function hero(scene: FablesScene, floor: number, sw: number, figure: Figure, tint: (svg: string) => string = svg => svg): HeroPlan {
  const cell = figure.kind === 'pixel' ? figure.cell : 'solid'
  // The sprite plays the nearest move it has, and no second one.
  const action = figure.kind === 'pixel' ? SPRITE_ACTION[scene.hero.action] : scene.hero.action
  const then = figure.kind === 'pixel' ? undefined : scene.hero.then
  const kind = MOTION_TIMING[action].kind
  const isMoving = kind === 'travel'
  const span = sw - HERO_W
  const fromX = Math.round((span * scene.hero.from) / 100)
  const toX = Math.round((span * scene.hero.to) / 100)
  const baseY = action === 'fly' ? 34 : floor - HERO_H
  const speed = SPEED[action] ?? 45
  const moveDur = isMoving ? Math.max(0.6, Math.abs(toX - fromX) / speed) : 0
  const step = action === 'run' ? 0.18 : 0.32
  const steps = isMoving ? Math.max(2, Math.round(moveDur / step)) : 0
  const flip = toX < fromX ? ` translate(${HERO_W} 0) scale(-1 1)` : ''
  // When the first move gives way to the next: on arrival, after a single play, or after a loop has had its turn.
  // Flying keeps going unless told otherwise; walking, running and the rest stand idle on arrival.
  const second: Motion | undefined =
    figure.kind === 'pixel' ? undefined : (then ?? (kind === 'once' || (isMoving && action !== 'fly') ? 'idle' : undefined))
  const handover = second === undefined ? undefined : isMoving ? moveDur : kind === 'once' ? MOTION_TIMING[action].dur : LOOP_FIRST(action)

  const legs = (frame: number, values: string) =>
    `<g opacity="${frame === 0 ? 1 : 0}" transform="scale(${U})">${pixelPaths(HERO_FRAMES[frame] ?? [], heroColor, cell)}` +
    (steps
      ? `<animate attributeName="opacity" values="${values}" dur="${step * 2}s" calcMode="discrete" repeatCount="${steps / 2}"/>`
      : '') +
    `</g>`
  const model = (motion: Parameters<typeof motionSvg>[0], when: { until?: number; from?: number; maxFrames?: number } = {}) =>
    figure.kind === '3d'
      ? motionSvg(motion, { height: MODEL_STAGE_H, cx: HERO_W / 2, floor: HERO_H, yaw: 0.55, hero: figure.hero, ...when }).svg
      : ''
  const frames =
    figure.kind === 'pixel'
      ? legs(0, '1;0') + legs(1, '0;1')
      : second === undefined || handover === undefined
        ? model(action)
        : model(action, { until: handover }) + model(second, { from: handover, maxFrames: figure.kind === '3d' ? (figure.lean ? 2 : figure.second) : undefined })

  // A move's own sway, for the moves the 3D model does not bake into its frames; it stops when the next move begins.
  const until = handover === undefined ? 'repeatCount="indefinite"' : `repeatDur="${n(handover)}s"`
  let inner = ''
  const baked = figure.kind === '3d'
  switch (baked && action !== 'fly' && action !== 'inspect' ? 'baked' : action) {
    case 'fly':
      inner = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -${U};0 0" dur="1.2s" ${until} additive="sum"/>`
      break
    case 'dig':
      inner = `<animateTransform attributeName="transform" type="rotate" values="-6 ${HERO_W / 2} ${HERO_H};6 ${HERO_W / 2} ${HERO_H};-6 ${HERO_W / 2} ${HERO_H}" dur=".4s" repeatCount="indefinite" additive="sum"/>`
      break
    case 'inspect':
      inner = `<animateTransform attributeName="transform" type="translate" values="0 0;-${U * 2} 0;0 0;${U * 2} 0;0 0" dur="3s" ${until} additive="sum"/>`
      break
    case 'celebrate':
      inner = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -16;0 0" keyTimes="0;.4;1" dur=".7s" repeatCount="indefinite" additive="sum"/>`
      break
    case 'walk':
    case 'run':
      inner = steps
        ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -${U / 2}" dur="${step}s" calcMode="discrete" repeatCount="${steps}" additive="sum"/>`
        : ''
      break
  }

  // A move's flourishes; with a second move each set shows only while its own move plays.
  const shown = (svg: string, begin?: number, end?: number) =>
    !svg || (begin === undefined && end === undefined)
      ? svg
      : `<g visibility="hidden">${svg}<set attributeName="visibility" to="visible"${begin ? ` begin="${n(begin)}s"` : ''}${end !== undefined ? ` end="${n(end)}s"` : ''}/></g>`
  const extras = shown(flourish(action, figure), handover === undefined ? undefined : 0, handover) + (second && handover !== undefined ? shown(flourish(second, figure), handover) : '')

  const travel = isMoving
    ? `<animateTransform attributeName="transform" type="translate" values="${fromX} ${baseY};${toX} ${baseY}" dur="${n(moveDur)}s" fill="freeze"/>`
    : ''
  const at = isMoving ? fromX : toX
  const svg =
    `<g transform="translate(${at} ${baseY})">${travel}` +
    `<g>${inner}<g transform="${flip.trim() || 'translate(0 0)'}">${frames}</g>${tint(extras)}</g></g>`
  return { svg, startX: isMoving ? fromX : toX, endX: toX, endY: baseY, arrive: isMoving ? moveDur : 0 }
}

/** The bits a move throws off: dirt from digging, confetti, the sprite's thinking dots, a sleeper's z's. */
function flourish(action: Motion, figure: Figure): string {
  // The pixel sprite thinks in dots; the 3D Claude's caption already sits where they would.
  if (action === 'think' && figure.kind === 'pixel') {
    return [0, 1, 2]
      .map(
        i =>
          `<rect x="${HERO_W + 2 + i * 6}" y="-6" width="${U}" height="${U}" fill="${PAPER}"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.3;.8;1" dur="1.5s" begin="${i * 0.3}s" repeatCount="indefinite"/></rect>`,
      )
      .join('')
  }
  if (action === 'dig') {
    return [0, 1, 2, 3]
      .map(
        i =>
          `<rect x="${HERO_W / 2}" y="${HERO_H - 2}" width="${U}" height="${U}" fill="#7a4a2b"><animateTransform attributeName="transform" type="translate" values="0 0;${(i - 1.5) * 14} -18;${(i - 1.5) * 22} 4" dur=".9s" begin="${i * 0.2}s" repeatCount="indefinite"/></rect>`,
      )
      .join('')
  }
  if (action === 'celebrate') {
    return [0, 1, 2, 3, 4]
      .map(
        i =>
          `<rect x="${i * 12}" y="-4" width="3" height="3" fill="${['#e3b341', '#e05252', '#6fc2c9', '#5e9c4a', '#7b5fb5'][i]}"><animateTransform attributeName="transform" type="translate" values="0 0;${(i - 2) * 6} -20" dur="1s" begin="${i * 0.15}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1s" begin="${i * 0.15}s" repeatCount="indefinite"/></rect>`,
      )
      .join('')
  }
  // A sleeper's Z's: big outlined letters puffing up from over its head, growing as they drift away.
  if (action === 'sleep') {
    return [0, 1, 2, 3]
      .map(
        i =>
          `<g transform="translate(${HERO_W * 0.62} ${HERO_H - MODEL_STAGE_H + 2})" opacity="0"><animateTransform attributeName="transform" type="translate" values="${HERO_W * 0.62} ${HERO_H - MODEL_STAGE_H + 2};${HERO_W * 0.62 + 10 + (i % 2) * 6} ${HERO_H - MODEL_STAGE_H - 30}" dur="2.8s" begin="${n(i * 0.7)}s" repeatCount="indefinite"/>` +
          `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.7;1" dur="2.8s" begin="${n(i * 0.7)}s" repeatCount="indefinite"/>` +
          `<g><animateTransform attributeName="transform" type="scale" values=".5;1.8" dur="2.8s" begin="${n(i * 0.7)}s" repeatCount="indefinite"/>` +
          `<text x="0" y="0" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-weight="900" fill="#f6f1e2" stroke="#1d1a2e" stroke-width="1.4" stroke-linejoin="round" paint-order="stroke">Z</text></g></g>`,
      )
      .join('')
  }
  // Tripped: stars circling over the fallen Claude while it lies dazed.
  if (action === 'trip') {
    const { dur } = MOTION_TIMING.trip
    const star = (x: number, y: number) => `<path d="M${x} ${y - 5}l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`
    return (
      `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.32;.36;.68;.72;1" dur="${dur}s" fill="freeze"/>` +
      `<g transform="translate(${HERO_W / 2 + 8} ${HERO_H - MODEL_STAGE_H - 10}) scale(1 .45)"><g fill="#ffd84a" stroke="#3a2a10" stroke-width=".8" stroke-linejoin="round">` +
      `<animateTransform attributeName="transform" type="rotate" values="0;360" dur=".9s" repeatCount="indefinite"/>` +
      `${star(15, 0)}${star(-7.5, 13)}${star(-7.5, -13)}</g></g></g>`
    )
  }
  return ''
}

// ---------------------------------------------------------------- caption

type P = [number, number]

/** The cartoon paper the caption is cut from: a soft drop shadow, an ink outline, then the paper. */
export type Tone = 'work' | 'trouble' | 'milestone'
const MONO_FONT = "Monocraft, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
const MONO_FACE =
  `<defs><style>@font-face{font-family:Monocraft;font-weight:400;src:url(data:font/woff2;base64,${MONOCRAFT}) format("woff2")}` +
  `@font-face{font-family:Monocraft;font-weight:700;src:url(data:font/woff2;base64,${MONOCRAFT_BOLD}) format("woff2")}</style></defs>`
const paper = (shape: string, skin: Paper) =>
  `<g transform="translate(1.2 1.8)" fill="black" opacity=".22">${shape}</g>` +
  `<g fill="${skin.ink}" stroke="${skin.ink}" stroke-width="2.2" stroke-linejoin="round">${shape}</g><g fill="${skin.card}">${shape}</g>`

/** What a word of the caption is, so it can be set apart: the bubble stays the same, the words change. */
export type Kind = 'plain' | 'code' | 'path' | 'fn' | 'num' | 'bad' | 'good' | 'face'
/** How a kind of word is set: in its color from the paper, and numbers, failures and successes in bold. */
const kindAttrs = (kind: WordKind, skin: Paper) => `fill="${skin.kinds[kind]}"${kind === 'num' || kind === 'bad' || kind === 'good' ? ' font-weight="700"' : ''}`
const FACE = /^(\^_\^|\^\^;?|>_<|>\.<|o_O|O_o|o\.O|:-?[)(DPpO3|/]|;-?\)|[xX]D|T_T|-_-|\._\.|\\o\/|<3|¯\\_\(ツ\)_\/¯|\(•_•\)|\(⌐■_■\)|->|=>|<-|~>|>>>|\.\.\.|\[(OK|ok|WIP|TODO|DONE)\]|\/\/|#!|\$|&&|\|\|)$/
const BAD = /^(✗|FAIL(ED)?|failed|failing|fails|broke|broken|crash(ed|es)?|red|\w*Error|\w*Exception|N\+1|panic|segfault|404|500)$/
const GOOD = /^(✓|PASS(ED)?|passed|passes|passing|green|clean|fixed|ships?|shipped|done|OK|merged|liftoff|LGTM)$/i
const NUM = /^[~+\-]?\d[\d.,]*(%|x|×|s|ms|kb|mb|gb|k)?$|^\d+\/\d+$/i
const FN = /^[\w.$#]+\(\)$/
const PATH = /^[\w@~./-]*\w\.(tsx?|jsx?|mjs|cjs|py|rb|go|rs|java|kt|swift|json|ya?ml|toml|css|scss|html|md|sql|sh|lock|env|test\.ts)$|^~?\.?\/?[\w@.-]+\/[\w@./-]*$/i
const CMD = /^(npm|npx|pnpm|yarn|bun|git|pytest|tsc|eslint|cargo|go|make|pip|docker|curl|gh)$|^--?\w/

export type Word = { lead: string; core: string; tail: string; kind: Kind }

/** The caption as words with their kinds. `backticks` mark code, and are not shown. */
export function words(text: string, tone: Tone | undefined): Word[] {
  const out: Word[] = []
  // The tone leads the caption as a mark, unless the narrator already wrote one.
  const mark = tone === 'trouble' ? '✗' : tone === 'milestone' ? '✓' : ''
  if (mark && !text.trimStart().startsWith(mark)) out.push({ lead: '', core: mark, tail: '', kind: tone === 'trouble' ? 'bad' : 'good' })
  let inCode = false
  for (const raw of text.split(' ').filter(Boolean)) {
    const opens = raw.startsWith('`')
    const ticks = (raw.match(/`/g) ?? []).length
    const code = inCode || opens
    if (ticks % 2 === 1) inCode = !inCode
    const bare = raw.replace(/`/g, '')
    if (!bare) continue
    if (FACE.test(bare)) {
      out.push({ lead: '', core: bare, tail: '', kind: code ? 'code' : 'face' })
      continue
    }
    // A call keeps its own brackets; only what follows them is punctuation.
    const call = /^(.*\(\))([.,;:!?]*)$/.exec(bare)
    const m = call && FN.test(call[1] ?? '') ? ['', '', call[1], call[2]] : /^([("'[]*)(.*?)([.,;:!?)"'\]]*)$/.exec(bare)
    const [lead, core, tail] = m ? [m[1] ?? '', m[2] ?? '', m[3] ?? ''] : ['', bare, '']
    const kind: Kind = !core
      ? 'plain'
      : code || CMD.test(core)
        ? 'code'
        : BAD.test(core)
          ? 'bad'
          : GOOD.test(core)
            ? 'good'
            : FN.test(core)
              ? 'fn'
              : PATH.test(core)
                ? 'path'
                : NUM.test(core)
                  ? 'num'
                  : 'plain'
    out.push({ lead, core, tail, kind })
  }
  return out
}
/** Columns a string takes in a monospace font: East Asian wide characters take two. */
const WIDE = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/g
const cols = (t: string) => t.length + (t.match(WIDE)?.length ?? 0)
const wordLen = (w: Word) => cols(w.lead) + cols(w.core) + cols(w.tail)

/** The most lines a bubble takes, so it stays clear of the ground. */
const MAX_LINES = 4

/** Greedy wrap of words into lines of at most `width` characters; a word longer than the line is cut. */
export function wrapWords(list: readonly Word[], width: number): Word[][] {
  const lines: Word[][] = []
  let line: Word[] = []
  let len = 0
  for (const w0 of list) {
    const w = wordLen(w0) > width ? { ...w0, core: w0.core.slice(0, Math.max(1, width - w0.lead.length - w0.tail.length)) } : w0
    if (line.length && len + 1 + wordLen(w) > width) {
      lines.push(line)
      line = []
      len = 0
    }
    len += (line.length ? 1 : 0) + wordLen(w)
    line.push(w)
  }
  if (line.length) lines.push(line)
  return lines
}
const lineLen = (line: readonly Word[]) => line.reduce((t, w) => t + wordLen(w), 0) + line.length - 1
const lineSvg = (line: readonly Word[], skin: Paper) =>
  line.map(w => escapeXml(w.lead) + (w.kind === 'plain' ? escapeXml(w.core) : `<tspan ${kindAttrs(w.kind, skin)}>${escapeXml(w.core)}</tspan>`) + escapeXml(w.tail)).join(' ')

const overlap = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))

/** Where a prop and its label sit while it stays put; a scrolling prop crosses the whole stage and blocks nothing. */
function propRects(prop: FablesProp, floor: number, sw: number, unit: number): Rect[] {
  if (prop.motion === 'scroll') return []
  const art = artFor(prop)
  const w = widthOf(art.rows) * unit
  const h = art.rows.length * unit
  const x = Math.round(((sw - w) * prop.x) / 100)
  const y = prop.y === 'ground' ? floor - h : prop.y === 'air' ? 58 - h / 2 : 8
  const reach = prop.motion === 'drift' ? 24 : prop.motion === 'bob' ? 0 : 2
  const rects: Rect[] = [{ x: x - 2, y: y - 4, w: w + reach + 4, h: h + 6 }]
  if (prop.label) {
    const lw = prop.label.length * 5 + 8
    rects.push({ x: Math.min(sw - lw - 2, Math.max(2, x + w / 2 - lw / 2)), y: Math.max(2, y - 13), w: lw, h: 11 })
  }
  return rects
}

/**
 * The speech bubble. It stays with Claude: of the places just beside and just
 * above Claude it takes the one that covers the least of Claude, the props,
 * the chapter tag and the scene's focal points, and while Claude walks it
 * travels along. On the rich stage it is cut from cartoon paper with a tail
 * pointing back at Claude, and kinds of words (files, functions, commands,
 * numbers, failures, successes, ASCII faces) are set apart in the text.
 */
function caption(
  text: string,
  hero: { startX: number; x: number; y: number; arrive: number; jump: number; sway: number },
  idPrefix: string,
  sw: number,
  look: Look,
  avoid: readonly Rect[],
  tone?: Tone,
  /** When the caption starts typing, in seconds: later when the scene fades in. */
  start = 0.2,
): string {
  const { fill, stroke, radius } = look.caption
  const onPaper = tone !== undefined
  const skin = look.paper ?? CARD_PAPER
  const ink = onPaper ? skin.ink : look.caption.ink
  const heroX = hero.x
  const heroY = hero.y
  // Claude's box, reaching as high as Claude jumps.
  const heroBox: Rect = { x: heroX - 4 - hero.sway, y: heroY - 8 - hero.jump, w: HERO_W + 8 + hero.sway * 2, h: HERO_H + 12 + hero.jump }
  const top = heroY + HERO_H - MODEL_STAGE_H - hero.jump
  const list = onPaper ? words(look.bubble?.upper ? text.toUpperCase() : text, tone) : text.split(' ').filter(Boolean).map((core): Word => ({ lead: '', core, tail: '', kind: 'plain' }))
  // On paper the caption is set in Monocraft, whose pixel is a ninth of its size: at 9 units
  // its pixels land on whole device pixels in the band. Elsewhere the look's own type.
  const type = onPaper ? (look.bubble ?? { font: MONO_FONT, size: 9, charW: 6, line: 12, base: 13 }) : { font: look.font, size: 9.5, charW: look.charW, line: 11, base: 12 }
  // Claude's path while it walks: the bubble must stay clear of Claude at every point of it.
  const KEYS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  const heroAt = (k: number) => hero.startX + (heroX - hero.startX) * k
  const boxAt = (k: number): Rect => ({ ...heroBox, x: heroAt(k) - 4 - hero.sway })
  const clampX = (v: number, w: number) => Math.min(sw - w - 2, Math.max(2, v))
  // How far the stage's edge holds the bubble back from Claude at a point of the path: while it
  // does, the bubble stands still as Claude walks on, and its tail no longer points at Claude.
  const slipAt = (k: number, ox: number, w: number) => Math.abs(clampX(heroAt(k) + ox, w) - (heroAt(k) + ox))
  // The point of the walk from which the bubble travels with Claude to the end; before it the
  // bubble waits, unseen, so it never stands about with its tail pointing away from Claude.
  const FINE = Array.from({ length: 101 }, (_, i) => i / 100)
  const joinsAt = (ox: number, w: number) => {
    if (!hero.arrive) return 0
    let k = 1
    while (k > 0 && slipAt(Math.round((k - 0.01) * 100) / 100, ox, w) < 1) k = Math.round((k - 0.01) * 100) / 100
    return FINE.includes(k) && slipAt(k, ox, w) < 1 ? k : 1
  }
  // The bubble's offsets that keep it on stage the whole way, so it travels with Claude as one.
  const lo = 2 - Math.min(hero.startX, heroX)
  const hi = (w: number) => sw - w - 2 - Math.max(hero.startX, heroX)
  const isRightward = heroX > hero.startX
  // A narrower wrap, taller, is tried when the wide one finds no clear place; one that
  // would need more than four lines is not, as every word of the caption is shown.
  let best = { x: 2, y: 4, ox: 0, score: Infinity, lines: [] as Word[][], w: 0, h: 0 }
  const wraps = [32, 25, 19, 15].map(width => wrapWords(list, width))
  const fits = wraps.filter(lines => lines.length <= MAX_LINES)
  for (const [wi, lines] of (fits.length ? fits : wraps.slice(0, 1)).entries()) {
    const w = Math.ceil(Math.max(...lines.map(lineLen)) * type.charW + 14)
    const h = lines.length * type.line + 7
    const beside = Math.min(GROUND_Y - h - 4, Math.max(4, top - 4))
    const above = top - h - 8
    const below = heroY + HERO_H + 9
    // Where the bubble sits relative to Claude: beside it at head height, or above it.
    const spots: P[] = [
      [HERO_W + 8, beside],
      [-w - 8, beside],
      [HERO_W / 2 - w / 2, above],
      [HERO_W - 10, above],
      [-w + 10, above],
      // Under Claude, for when it flies and there is no room above it.
      [HERO_W / 2 - w / 2, below],
    ]
    for (const [si, [ox0, y0]] of spots.entries()) {
      const y = y0 === below ? Math.min(H - h - 3, y0) : Math.min(GROUND_Y - h - 4, Math.max(4, y0))
      // Over or under Claude the bubble may sit anywhere along it, its tail still on Claude:
      // slid along, it can often travel the whole walk without meeting an edge.
      // When no offset keeps it on stage the whole way, it keeps clear of the edge Claude walks
      // towards, so the edge can only hold it back at the start, and it joins Claude early.
      const isOver = si >= 2
      const [a, b] = [Math.max(lo, -w + 14), Math.min(hi(w), HERO_W - 14)]
      const along = Math.min(HERO_W - 14, Math.max(-w + 14, ox0))
      const ox = !isOver ? ox0 : a <= b ? Math.min(b, Math.max(a, ox0)) : isRightward ? Math.max(-w + 14, Math.min(along, hi(w))) : Math.min(HERO_W - 14, Math.max(along, lo))
      const x = clampX(heroX + ox, w)
      // Covering Claude at any moment is ruled out in all but name; being held back by an edge
      // while Claude walks on nearly so; the rest is preference.
      const covers = KEYS.reduce((t, k) => t + overlap({ x: clampX(heroAt(k) + ox, w), y, w, h }, boxAt(k)), 0)
      // Every second the bubble would wait for Claude counts against it.
      const waits = joinsAt(ox, w) * hero.arrive
      const score = covers * 50 + waits * 3000 + avoid.reduce((t, a) => t + overlap({ x, y, w, h }, a) * 3, 0) + si * 6 + wi * 40
      if (score < best.score) best = { x, y, ox, score, lines, w, h }
    }
  }
  const { lines, w, h, x, y, ox } = best
  // A walk too long for any bubble to travel with Claude the whole way: the bubble waits until
  // Claude is far enough in, then appears beside it and travels on with it, tail on Claude.
  const joins = joinsAt(ox, w)
  const appear = joins * hero.arrive
  let delay = start + appear
  const rows = lines
    .map((line, i) => {
      const dur = Math.max(0.2, lineLen(line) * TYPE_SECONDS_PER_CHAR)
      const id = `${idPrefix}${i}`
      const reveal =
        `<clipPath id="${id}"><rect x="${n(x)}" y="${n(y + 2 + i * type.line)}" width="0" height="${type.line + 2}">` +
        `<animate attributeName="width" from="0" to="${w}" dur="${n(dur)}s" begin="${n(delay)}s" fill="freeze"/></rect></clipPath>`
      delay += dur
      return reveal + `<text clip-path="url(#${id})" x="${n(x + 7)}" y="${n(y + type.base + i * type.line)}" font-family="${type.font}" font-size="${type.size}" fill="${ink}">${lineSvg(line, skin)}</text>`
    })
    .join('')
  // While Claude walks, the bubble walks with it along the same path, held inside the stage;
  // from the moment it joins Claude it moves as one with it, so that moment is a key of its own.
  const follows = [...new Set([0, joins, ...KEYS.filter(k => k > joins)])].sort((p, q) => p - q)
  const follow =
    hero.arrive && hero.startX !== heroX
      ? ` transform="translate(${n(clampX(heroAt(0) + ox, w) - x)} 0)"><animateTransform attributeName="transform" type="translate" values="${follows.map(k => `${n(clampX(heroAt(k) + ox, w) - x)} 0`).join(';')}" keyTimes="${follows.join(';')}" dur="${n(hero.arrive)}s" fill="freeze"/`
      : ''
  const fade = `<animate attributeName="opacity" values="0;1" dur=".2s"${appear ? ` begin="${n(appear)}s"` : ''} fill="freeze"/>`
  // The wait is written on the bubble, so the narrator's loop can give the caption its full reading time after it.
  const hidden = appear ? ` opacity="0" data-speaks="${n(appear)}"` : ''
  if (onPaper) {
    const hx = heroX + HERO_W / 2
    const hy = top + 10
    let base: [P, P]
    if (x >= hx) base = [[x + 2, y + h - 13], [x + 2, y + h - 5]]
    else if (x + w <= hx) base = [[x + w - 2, y + h - 13], [x + w - 2, y + h - 5]]
    else {
      const cx = Math.min(x + w - 12, Math.max(x + 12, hx))
      base = y + h < hy ? [[cx - 4, y + h - 2], [cx + 4, y + h - 2]] : [[cx - 4, y + 2], [cx + 4, y + 2]]
    }
    const mx = (base[0][0] + base[1][0]) / 2
    const my = (base[0][1] + base[1][1]) / 2
    const len = Math.hypot(hx - mx, hy - my) || 1
    const reach = Math.min(10, len * 0.6)
    const tip: P = [mx + ((hx - mx) / len) * reach, my + ((hy - my) / len) * reach]
    if (look.bubble) return `<g data-part="speech" data-tone="${tone}"${hidden}${follow || ''}>${look.bubble.font.includes('Monocraft') ? MONO_FACE : ''}${look.bubble.draw({ x, y, w, h }, { base, tip })}${rows}${fade}</g>`
    const shape =
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="6"/>` +
      `<path d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>`
    return `<g data-part="speech" data-tone="${tone}"${hidden}${follow || ''}>${MONO_FACE}${paper(shape, skin)}${rows}${fade}</g>`
  }
  return `<g data-part="speech"${hidden}${follow || ''}><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>${rows}${fade}</g>`
}

function title(text: string, color: string, look: Look): string {
  const w = text.length * (look.charW - 0.3) + 16
  const inset = look.inset ?? 0
  return (
    `<g font-family="${look.font}" font-size="9" fill="${color}" transform="translate(${inset} ${inset})">` +
    `<path d="M6 12V6h6M${n(6 + w)} 12V6h-6" fill="none" stroke="${color}" stroke-width="1"/>` +
    `<text x="14" y="10">${escapeXml(text)}</text></g>`
  )
}

/** The chapter tag as the look draws it, or the plain tag with the room it takes. */
function chapterTag(text: string, color: string, look: Look, rich: boolean): Tag {
  const inset = look.inset ?? 0
  if (look.tag) return look.tag(text, inset)
  const shown = rich ? { ...look, font: MONO_FONT, charW: 6.3 } : look
  return { svg: title(text, color, shown), w: text.length * look.charW + 34 + inset, h: 16 + inset }
}

// ---------------------------------------------------------------- the scene

/** The stage width for a box of the given shape, so the scene fills it exactly. */
export function stageWidth(width: number, height: number): number {
  const fit = Number.isFinite(width / height) && width > 0 && height > 0 ? (width * H) / height : W
  return Math.round(Math.min(MAX_W, Math.max(MIN_W, fit)))
}

/** The pixel-art Claude's eye and outline colors. */
const SPRITE_EYE = '#1f1412'
const SPRITE_OUTLINE = '#3a1e14'
/** How many stage units one pixel of the pixelized stage takes. */
const PIXEL = 2
/**
 * Turns everything drawn into pixel art, the scenery and Claude alike, without
 * redrawing any of it: one sample is taken at the middle of every PIXEL square
 * (a tiny dot of a tiled grid, cut out of the drawing) and spread over its whole
 * square. The grid starts at the stage's corner, so pixels line up with it.
 */
const PIXELIZE = (sw: number, claude: Rect, grade = '', sprite = { eye: SPRITE_EYE, outline: SPRITE_OUTLINE }) => {
  const dot = 0.4
  const r = n((PIXEL - dot) / 2)
  // The grid: one dot tiled every PIXEL, seeded inside the filter's region on a whole pixel
  // from the stage's corner, so every filter here samples the same squares.
  const grid = (at: Rect) => {
    const gx = Math.ceil(at.x / PIXEL) * PIXEL
    const gy = Math.ceil(at.y / PIXEL) * PIXEL
    return (
      `<feFlood x="${n(gx + (PIXEL - dot) / 2)}" y="${n(gy + (PIXEL - dot) / 2)}" width="${dot}" height="${dot}" flood-color="black"/>` +
      `<feComposite x="${n(gx)}" y="${n(gy)}" width="${PIXEL}" height="${PIXEL}"/><feTile result="grid"/>`
    )
  }
  // A sample at the middle of each square, spread over the square.
  const sample = (from: string, result: string) =>
    `<feComposite in="${from}" in2="grid" operator="in"/><feMorphology operator="dilate" radius="${r}" result="${result}"/>`
  const region = (at: Rect) => `filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="${n(at.x)}" y="${n(at.y)}" width="${n(at.w)}" height="${n(at.h)}"`
  const stage = { x: 0, y: 0, w: sw, h: H }
  return (
    // Claude, on the same grid, as a sprite: its solid body sampled crisp; its dark features
    // (eyes, finer than a pixel) found by their darkness, thickened just enough to land on
    // whole pixels and set solid; a one-pixel dark outline round the body. The translucent
    // ground shadow is sampled too, under it all, but kept out of the outline and the eyes.
    `<filter id="sc-pixelize-claude" ${region(claude)} color-interpolation-filters="sRGB">` +
    grid(claude) +
    `<feComponentTransfer in="SourceGraphic" result="solid"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>` +
    sample('SourceGraphic', 'all') +
    sample('solid', 'sampled') +
    `<feComponentTransfer in="sampled" result="body"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>` +
    `<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -9 -17.7 -3.3 0 3.6"/>` +
    `<feComposite in2="solid" operator="in"/><feMorphology operator="dilate" radius=".7" result="dark"/>` +
    sample('dark', 'darkpx') +
    `<feComponentTransfer in="darkpx"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>` +
    `<feComposite in2="body" operator="in" result="eyemask"/>` +
    `<feFlood flood-color="${sprite.eye}"/><feComposite in2="eyemask" operator="in" result="eyes"/>` +
    `<feMorphology in="body" operator="dilate" radius="${PIXEL}"/><feComposite in2="body" operator="out" result="ring"/>` +
    `<feFlood flood-color="${sprite.outline}"/><feComposite in2="ring" operator="in" result="outline"/>` +
    `<feMerge><feMergeNode in="all"/><feMergeNode in="outline"/><feMergeNode in="body"/><feMergeNode in="eyes"/></feMerge></filter>` +
    // The rest sampled crisp, at the middle of each square, so colors stay as rich as drawn. A look's
    // grade runs first in the same filter: one pass over the stage costs far less than two nested.
    `<filter id="sc-pixelize" ${region(stage)} color-interpolation-filters="sRGB">` +
    (grade ? `${grade}<feMerge result="graded"><feMergeNode/></feMerge>` : '') +
    `${grid(stage)}${sample(grade ? 'graded' : 'SourceGraphic', 'px')}</filter>`
  )
}

/**
 * Compiles a validated scene into one self-animating SVG document (SMIL), so
 * the desktop plays it with no redraws. The stage takes the box's shape
 * (`width` by `height` CSS pixels; absent, the default stage at its own size).
 * `look` names the graphic style (looks.ts); absent, plain pixel art.
 * Stays under the Svg element's limit by shedding particles, then props, if a
 * scene is too rich.
 */
export function sceneToSvg(
  scene: FablesScene,
  options: {
    width?: number
    height?: number
    look?: string
    figure?: 'auto' | 'pixel' | '3d'
  } = {},
): string {
  const sw = options.width && options.height ? stageWidth(options.width, options.height) : W
  const width = options.width ?? sw
  const height = options.height ?? Math.round((width * H) / sw)
  const look = lookFor(options.look)
  const rand = rng(`${scene.backdrop}|${scene.caption}`)
  const wants = options.figure && options.figure !== 'auto' ? options.figure : look.figure
  // The 3D Claude gets scenery and props with depth to match; the pixel sprite keeps the flat pixel stage.
  const rich = wants === '3d'
  // The pixel-art look (the default) pixelizes the whole stage crisply; drawn smooth, the scenery takes a soft blur instead.
  const pixelArt = rich && look.pixel === true
  // A style drawn as an artwork repaints every element of the scenery, and Claude, in its own medium.
  const art = rich ? look.art : undefined
  const painter = art?.painter(sw)
  const figure: Figure = rich ? { kind: '3d', hero: art?.hero() } : { kind: 'pixel', cell: look.cell }
  // Smooth, the scenery is softened so Claude reads first; a style brings its own treatment instead,
  // and softening under a grade would be redone on every frame.
  const stageAt = (lean: boolean) =>
    rich ? richBackdrop(scene, rng(`${scene.backdrop}|${scene.caption}|stage`), sw, GROUND_Y, W, lean, !pixelArt && !look.grade && !art, painter) : flatStage(backdrop(scene, rand, sw))
  let stage = stageAt(false)
  const dust = painter ? painter.el('particles', particles(scene, rand, sw)) : particles(scene, rand, sw)
  // The rich stage tells the story in words alone: no props stand about the scene.
  const props = rich ? [] : scene.props.map((p, i) => propSvg(p, stage.floor, i, sw, look.cell))
  // A style paints Claude's confetti and dug-up earth in its own inks too.
  const tint = painter ? (svg: string) => painter.el('particles', svg) : undefined
  let plan = hero(scene, stage.floor, sw, figure, tint)
  const accent = scene.palette.accent ?? '#d9d4c7'
  const idPrefix = `fable${Math.floor(rand() * 2 ** 31).toString(36)}-`
  const entrance = scene.enter === 'fade' ? ENTRANCE_SECONDS : 0
  const sky = art?.sky ?? stage.sky
  const ground = art?.ground ?? stage.ground
  // A look's grade takes the stage, Claude and all, before any pixelizing; past the stage's edges its own color shows.
  const gradeBody = look.grade?.(sw, H, pixelArt) ?? ''
  // Smooth, the grade is a filter of its own; on a pixel-art stage it runs inside the pixelizer.
  const grade = gradeBody && !pixelArt ? `<defs>${gradeFilter('lk-grade', sw, H, gradeBody)}</defs>` : ''
  const edge = look.edge ?? sky
  const tag = scene.title ? chapterTag(scene.title, look.titleColor ?? (rich ? '#efe6d2' : accent), look, rich) : undefined
  // What the speech bubble keeps clear of: the props still drawn, their labels, the chapter tag.
  const avoid = (propCount: number): Rect[] => [
    ...scene.props.slice(0, propCount).flatMap(p => propRects(p, stage.floor, sw, U)),
    ...(tag ? [{ x: 0, y: 0, w: tag.w, h: tag.h }] : []),
    ...stage.keep,
  ]
  // Everywhere Claude goes, jumps and digs included: the region its own pixelizing covers.
  const claudeBox: Rect = { x: Math.min(plan.startX, plan.endX) - 30, y: plan.endY - 40, w: Math.abs(plan.endX - plan.startX) + HERO_W + 60, h: HERO_H + 56 }
  const fore = (withDust: boolean, propCount: number) =>
    (withDust ? dust : '') + props.slice(0, propCount).join('') + (pixelArt ? `<g filter="url(#sc-pixelize-claude)">${plan.svg}</g>` : plan.svg)

  // Sky and ground run far past the stage, so a box the stage could not match
  // (past MIN_W or MAX_W) shows more sky and ground instead of the frame's page.
  const build = (withDust: boolean, propCount: number) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sw} ${H}" width="${width}" height="${height}" ` +
    `shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" style="display:block;background:${look.grade ? edge : ground}"${look.grade || art ? ` data-look="${look.name}"` : ''}>` +
    grade +
    `<rect x="${-sw * 4}" y="${-H * 4}" width="${sw * 9}" height="${H * 4 + GROUND_Y}" fill="${look.grade ? edge : sky}"/>` +
    (art?.defs ? `<defs>${art.defs(sw, H)}</defs>` : '') +
    (pixelArt ? `<defs>${PIXELIZE(sw, claudeBox, gradeBody)}</defs><g filter="url(#sc-pixelize)">` : '') +
    (grade ? `<g filter="url(#lk-grade)">` : '') +
    // The graded stage carries its own sky, so the grade sees the whole picture.
    (look.grade ? `<rect width="${sw}" height="${H}" fill="${sky}"/>` : '') +
    (art?.under?.(sw, H) ?? '') +
    stage.back +
    `<rect x="${-sw * 4}" y="${stage.groundTop}" width="${sw * 9}" height="${H * 4}" fill="${ground}"/>` +
    // Ground-level scenery goes down before anything that stands on it.
    stage.near +
    fore(withDust, propCount) +
    stage.lens +
    (grade ? '</g>' : '') +
    (pixelArt ? '</g>' : '') +
    (look.texture?.(sw, H, GROUND_Y, pixelArt) ?? '') +
    (look.frame?.(sw, H, GROUND_Y) ?? '') +
    (tag?.svg ?? '') +
    caption(scene.caption, { startX: plan.startX, x: plan.endX, y: plan.endY, arrive: plan.arrive, jump: Math.max(heroReach(scene.hero.action), scene.hero.then ? heroReach(scene.hero.then) : 0), sway: scene.hero.action === 'inspect' ? 2 * U : 0 }, idPrefix, sw, look, avoid(propCount), rich ? (scene.tone ?? (scene.hero.action === 'celebrate' ? 'milestone' : 'work')) : undefined, entrance + 0.2) +
    // A new setting fades in from the dark, so the band never jumps from one place to the next.
    (entrance ? `<rect x="${-sw * 4}" y="${-H * 4}" width="${sw * 9}" height="${H * 9}" fill="#0b0b10" pointer-events="none"><animate attributeName="opacity" values="1;0" dur="${n(entrance)}s" fill="freeze"/></rect>` : '') +
    `</svg>`

  const propsShown = props.length
  let svg = build(true, propsShown)
  // Over the limit, Claude's second move is baked in fewer poses first; then the scenery
  // thins out, then the particles go, and only then the props.
  if (svg.length > BUDGET && figure.kind === '3d') {
    plan = hero(scene, stage.floor, sw, { ...figure, second: 6 }, tint)
    svg = build(true, propsShown)
  }
  if (svg.length > BUDGET && rich) {
    stage = stageAt(true)
    svg = build(true, propsShown)
  }
  if (svg.length > BUDGET) svg = build(false, propsShown)
  // Then Claude, once he has arrived, stands breathing in two poses instead of a full idle loop.
  if (svg.length > BUDGET && figure.kind === '3d') {
    plan = hero(scene, stage.floor, sw, { ...figure, lean: true }, tint)
    svg = build(false, propsShown)
  }
  // Still over (a look whose colors spell long), the rich stage gives way to the flat one
  // before any prop goes; the flat stage always fits.
  if (svg.length > BUDGET && rich) {
    stage = flatStage(backdrop(scene, rand, sw))
    svg = build(false, propsShown)
  }
  for (let count = propsShown - 1; svg.length > BUDGET && count >= 0; count--) svg = build(false, count)
  return svg
}

/**
 * The same drawing, its clock already `seconds` along: every animation begins
 * that much earlier, so a scene drawn again while it is up (the band redrawn
 * when the turn ends, a new width, a new style) carries on from where it was:
 * the caption as far typed as it was, Claude as far along. Every begin in a
 * scene is a plain offset in seconds, and an animation without one begins at 0.
 *
 * An animation whose whole run would fall before the drawing starts is never
 * played at all, its frozen last frame included (SMIL drops an interval that
 * ends before its parent begins), so the caption would vanish: one that holds
 * its last frame is moved back only so far that it ends just after the start.
 */
export function resumeAt(svg: string, seconds: number): string {
  if (!(seconds > 0)) return svg
  const secs = (attrs: string, name: 'dur' | 'repeatDur') => {
    const m = (name === 'dur' ? /\sdur="([\d.]+)s"/ : /\srepeatDur="([\d.]+)s"/).exec(attrs)
    return m ? Number(m[1]) : undefined
  }
  return svg.replace(/<(animate|animateTransform|animateMotion|set)\b([^>]*?)(\/?)>/g, (_, tag: string, attrs: string, close: string) => {
    const at = /\sbegin="(-?[\d.]+)s"/.exec(attrs)
    let begin = (at ? Number(at[1]) : 0) - seconds
    if (/\sfill="freeze"/.test(attrs)) {
      const count = /\srepeatCount="([\d.]+)"/.exec(attrs)
      const run = secs(attrs, 'repeatDur') ?? (secs(attrs, 'dur') ?? 0) * (count ? Number(count[1]) : 1)
      begin = Math.max(begin, 0.01 - run)
    }
    const moved = at ? attrs.replace(at[0], ` begin="${n(begin)}s"`) : `${attrs} begin="${n(begin)}s"`
    return `<${tag}${moved}${close}>`
  })
}

/** How long a drawn scene's bubble waits for Claude before it appears, in seconds (0 when it appears at once). */
export const speaksAfter = (svg: string) => Number(/data-part="speech"[^>]*\sdata-speaks="([\d.]+)"/.exec(svg)?.[1] ?? 0)

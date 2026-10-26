/**
 * Phosphor Streams, after the gallery's "Phosphor Streams" (henrik-styles.js,
 * style 23, `ephosphor`): phosphor glyph streams that stop at once.
 *
 * The art bible, translated from the gallery's screen to the Fables' worlds:
 *
 * - The medium is a green phosphor terminal in a dark room. The picture is a
 *   grid of character cells, three units by four, and every cell holds one
 *   glyph of the gallery's alphabet (0 1 { } < > + * / & ! ? ( ) [ ] = _ - : ; # %).
 *   Nothing is drawn between the cells: a thing is there because the glyphs
 *   where it stands are lit, and how brightly they are lit is its tone. The
 *   scene is painted in flat phosphor greens, sampled once per cell, and the
 *   glyph screen is laid over it: each glyph takes its cell's light, and the
 *   phosphor blooms a little round every lit glyph.
 * - The sky is the black of the tube, and through it the streams fall: one in
 *   every column, a white-hot head with a tail that fades upward, each at
 *   its own speed. Every seventeen seconds the streams stop at once, hang,
 *   and fade out, and the clock in the corner turns over from 01:29 to
 *   01:30:00 in white; then they start again. By day the tube glows green low
 *   on the horizon; by night it is black to the floor and the streams run dimmer.
 * - The sun and the moon are discs of the brightest glyphs in a halo of dim
 *   ones; the Earth is a mid-green disc with brighter seas of light on its rim.
 *   Stars are single glyphs, snapped to their cells, some of them blinking.
 * - Clouds, mist and beams of light are fields of dim glyphs; the glow of a
 *   crater or a lamp is a falloff of glyphs round it.
 * - Land, rock, foliage, grass, ground and buildings are masses of glyphs,
 *   dimmer as they stand further off and brighter where the lit scene was
 *   lit, but never quite dark, so a forest or a street reads as dim glyphs
 *   among the streams, a ridge against the black and a near rock against the ridge.
 *   Glass and water are mid-green; fire, lava, lamps and windows are the
 *   brightest glyphs on the screen after Claude, and shadows are cells left dark.
 * - Night is the same screen with less light in it: every glyph a step dimmer,
 *   no glow on the horizon, the stars and windows the brightest cells.
 * - Claude is the one body that keeps glowing when the streams stop: his faces
 *   in the brightest greens, shaded by how each faces the light, the legs a
 *   step down, set into the same glyph grid as everything else, and his eyes
 *   cells left black.
 * - The tube's corners are rounded in a black bezel with a faint glass rim; a
 *   scanline weave lies over the screen. The chapter is a prompt with a
 *   blinking block cursor; the caption is printed in a black terminal window
 *   ruled in a double phosphor line.
 */
import type { HeroPainter } from '../hero3d'
import type { Model } from '../clawd3d'
import { lum, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
/** A character cell: three units wide, four tall. */
const CW = 3
const CH = 4
/** The gallery's glyphs. */
const GLYPHS = '01{}<>+*/&!?()[]=_-:;#%'
/** The gallery's phosphor white-green, and its dim green for the clock. */
const TERMINAL = '#d9ffe6'
const DIM = '#7fa38c'
/**
 * Phosphor greens, dark to light: the light a cell can hold. Short hex, as every fill on the stage spells one.
 * The brightest stops stay green-white, as the gallery's TERMINAL is: under the glyph screen a white cell prints grey.
 */
const RAMP = ['#021', '#132', '#143', '#253', '#374', '#496', '#5b7', '#8da', '#afc', '#cfd']
/** The streams' loop, and when in it they stop: the gallery's seventeen seconds, stopping at ten and a half. */
const LOOP = 17
const STOP = 10.5
const AT_STOP = n(STOP / LOOP)
const FADED = n((STOP + 3.5) / LOOP)

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false
/** How much light a wall behind everything holds, against what stands before it. */
let walls = 1

/** A small seeded sequence, so the same stage always streams the same way. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** How much light a cell of this lit color holds, 0 to 1, by what it is and how far off it stands. */
function level(color: string, family: Family, depth: number): number {
  const l = lum(color)
  const dim = night ? 0.8 : 1
  switch (family) {
    case 'fire':
    case 'lamp':
      return 0.74 + 0.26 * l
    case 'body':
      return 0.45 + 0.6 * l
    case 'stars':
      return 0.6 + 0.4 * l
    case 'life':
      return 0.5 + 0.45 * l
    case 'glass':
      // A pane or a screen glows, as the terminal itself does.
      return 0.48 + 0.5 * l
    case 'water':
      return (0.12 + 0.4 * l) * dim
    case 'sky':
      return 0.2 * l
    case 'cloud':
      return (0.1 + 0.3 * l) * dim
    case 'air':
    case 'beam':
    case 'glow':
      return 0.16 + 0.36 * l
    case 'shadow':
      return 0
    case 'ground':
    case 'grass':
      // The floor Claude stands on: low, so he reads against it.
      return Math.min(0.32, (0.02 + 0.5 * l) * dim)
    default:
      // Masses of glyphs: lit where the scene was lit, dimmer the further off they stand,
      // and never quite out, so a tree or a tower reads as a mass of dim glyphs among the streams.
      return Math.min(0.6, (0.17 + 0.7 * l) * (0.7 + 0.35 * depth) * dim * walls)
  }
}

const tone = (color: string, family: Family, depth: number) => (family === 'shadow' ? '#000' : step(RAMP, level(color, family, depth)))

/** The sky: the tube's black, a green glow low on it by day, and the streams falling through it. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  return `<rect width="${n(sw)}" height="128" fill="url(#${night ? 'ph-skyn' : 'ph-sky'})"/>` + streams(sw, night ? 0.8 : 1)
}

/**
 * The streams: six falling sheets, one stream to a column, each sheet at its
 * own speed. They fall for ten and a half seconds, stop at once, and fade.
 */
function streams(sw: number, opacity: number): string {
  let out = ''
  for (let k = 0; k < SHEETS; k++) out += `<rect width="${n(sw)}" height="128" fill="url(#ph-rain${k})"/>`
  return (
    `<g opacity="${n(opacity)}">${out}` +
    `<animate attributeName="opacity" values="${n(opacity)};${n(opacity)};0;0" keyTimes="0;${AT_STOP};${FADED};1" dur="${LOOP}s" repeatCount="indefinite"/></g>`
  )
}

/** The streams' sheets, as patterns that tile downward, so a stream that falls out of the bottom comes back at the top. */
const SHEETS = 6
/** The streams' lengths, in cells. */
const TAILS = [6, 10, 15, 21]
/** How tall a sheet is before it repeats: the stage and a gap. */
const PERIOD = 200
function rain(sw: number): string {
  const rand = seeded(23)
  const cols = Math.ceil(sw / CW)
  const sheets: string[] = Array.from({ length: SHEETS }, () => '')
  for (let i = 0; i < cols; i++) {
    if (rand() < 0.66) continue
    const k = Math.floor(rand() * SHEETS)
    const t = Math.floor(rand() * TAILS.length)
    const h = (TAILS[t] ?? 6) * CH
    const y = Math.floor(rand() * PERIOD)
    const at = (yy: number) => `<use href="#ph-t${t}" x="${i * CW}" y="${yy}"/>`
    sheets[k] += at(y) + (y + h > PERIOD ? at(y - PERIOD) : '')
  }
  // Rows a second, as the gallery's streams fall, from the slow sheets to the fast ones.
  const speeds = [4.5, 6, 7.5, 9, 11, 13.5]
  const bright = [0.45, 0.85, 0.6, 1, 0.7, 0.9]
  let out = ''
  TAILS.forEach((len, t) => {
    const h = len * CH
    out += `<g id="ph-t${t}"><rect width="${CW}" height="${h - CH}" fill="url(#ph-tail)"/><rect y="${h - CH}" width="${CW}" height="${CH}" fill="${RAMP[9]}"/></g>`
  })
  sheets.forEach((s, k) => {
    const d = n((speeds[k] ?? 6) * CH * STOP)
    out +=
      `<pattern id="ph-rain${k}" width="${cols * CW}" height="${PERIOD}" patternUnits="userSpaceOnUse"><g opacity="${bright[k] ?? 1}">${s}</g>` +
      `<animateTransform attributeName="patternTransform" type="translate" values="0 0;0 ${d};0 ${d}" keyTimes="0;${AT_STOP};1" dur="${LOOP}s" repeatCount="indefinite"/></pattern>`
  })
  return out
}

/** Stars as single glyphs: every star becomes a lit cell at its point, keeping its group's opacity and blink. */
function stars(svg: string, c: Ctx): string {
  const at = (pts: [number, number][]) => pts.map(([x, y]) => `<use href="#ph-dot" x="${Math.floor(x / CW) * CW}" y="${Math.floor(y / CH) * CH}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [number, number][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [Number(m[1]), Number(m[2])])
          : [[Number(/\sx="([^"]*)"/.exec(attrs)?.[1] ?? 0), Number(/\sy="([^"]*)"/.exec(attrs)?.[1] ?? 0)]]
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      return `<g${kept} fill="${RAMP[8]}">${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** Families whose masses take a contour of brighter glyphs. */
const EDGED: readonly Family[] = ['land', 'rock', 'built']

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth) => tone(color, family, depth),
      // The edge of a land mass, a rock or a building is a run of brighter glyphs, as a screen draws a contour.
      // A wall behind everything (walls < 1) takes none: it is the dark of the room.
      line: (family, depth) =>
        walls === 1 && EDGED.includes(family)
          ? `stroke="${RAMP[Math.min(6, Math.round(4 + depth * 2.5 - (night ? 0.5 : 0)))]}" stroke-width="1.2" stroke-linejoin="round"`
          : '',
      // A lamp's pool of light is a falloff of glyphs on the floor.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${RAMP[5]}" opacity=".45"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(Math.max(2, e.ry * 0.5))}" fill="${RAMP[7]}" opacity=".6"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        // The lab has no sky: the streams fall down its wall instead, dimmer.
        'lab.wall': (svg, c) => {
          // Deliberate: the lab is painted as night, so the whole room reads as a dark room lit by its screens and lamps.
          night = true
          // The wall is the dark of the room, with no contour (see `line`): it stands behind everything else in it.
          walls = 0.5
          const out = c.repaint(svg)
          walls = 1
          return out + streams(c.meta.sw ?? 640, 0.45)
        },
        glow: (svg, c) => `<g opacity=".7">${c.repaint(svg)}</g>`,
      },
    },
    'ph',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude's greens: his faces from the light's side round to the dark, the brightest cells on the screen. */
const BODY = ['#7c9', '#9eb', '#afc', '#bfd', '#cfd']
const LEGS = ['#4a6', '#5b7', '#7c9', '#9eb', '#afc']

/** The cells Claude's shadow darkens: an ellipse under his feet, drawn once a scene and reused by every pose that casts the same one. */
function shadow(m: Model, cx: number, floor: number, seen: Map<string, string>): string {
  const xs = m.shadow.map(p => p[0])
  const ys = m.shadow.map(p => p[1])
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = Math.min(...ys)
  const y1 = Math.max(...ys)
  const at = `cx="${t1(cx + (x0 + x1) / 2)}" cy="${t1(floor + (y0 + y1) / 2)}" rx="${t1((x1 - x0) / 2)}" ry="${t1((y1 - y0) / 2)}"`
  const id = seen.get(at)
  if (id) return `<use href="#${id}"/>`
  seen.set(at, `ph-sh${seen.size}`)
  return `<ellipse id="ph-sh${seen.size - 1}" ${at} opacity=".75"/>`
}

/** Claude in phosphor: flat greens by how each face takes the light, set into the glyph grid, his eyes left black. */
const hero = (): HeroPainter => {
  const seen = new Map<string, string>()
  return (m: Model, cx: number, floor: number) => {
    // Consecutive faces of one green share a path; draw order is kept, so overlaps stay right.
    const runs: { fill: string; d: string }[] = []
    for (const f of m.faces) {
      const k = Math.max(0, Math.min(4, Math.round(Math.pow(f.light, 0.8) * 4)))
      const fill = (f.part === 'leg' ? LEGS : BODY)[k] ?? TERMINAL
      const d = poly(f.pts, cx, floor)
      const last = runs[runs.length - 1]
      if (last && last.fill === fill) last.d += d
      else runs.push({ fill, d })
    }
    const eyes = m.eyes
      .map(e =>
        e.poly
          ? `<path d="${poly(e.poly, cx, floor)}"/>`
          : `<path fill="none" stroke-width="2" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
      )
      .join('')
    return (
      shadow(m, cx, floor, seen) +
      // A ring of dark cells round him (ph-ring), so he stands clear of whatever is behind him.
      `<g filter="url(#ph-ring)">${runs.map(r => `<path fill="${r.fill}" d="${r.d}"/>`).join('')}` +
      // The eyes: cells left dark, a little larger than drawn so the grid always catches them.
      `<g stroke="#000" stroke-width="2" stroke-linejoin="round">${eyes}</g></g>`
    )
  }
}

// ---------------------------------------------------------------- the screen

/** The glyph screen: a tile of the gallery's glyphs, one to a cell, white on a faint grey, laid over the stage. */
const TILE_COLS = 20
const TILE_ROWS = 10
/** Seconds between turns of the glyphs. */
const FLIP = 0.8
function glyphTile(): string {
  const rand = seeded(1301)
  const xs = Array.from({ length: TILE_COLS }, (_, i) => n(i * CW + CW / 2)).join(' ')
  let rows = ''
  for (let j = 0; j < TILE_ROWS; j++) {
    let s = ''
    for (let i = 0; i < TILE_COLS; i++) s += GLYPHS[Math.floor(rand() * GLYPHS.length)] ?? '0'
    rows += `<text x="${xs}" y="${n(j * CH + 3.3)}">${escape(s)}</text>`
  }
  const w = TILE_COLS * CW
  const h = TILE_ROWS * CH
  // While the streams fall the glyphs turn over, the whole screen at once, as the gallery's do; when they stop, so do the glyphs.
  // The tile moves by pairs of cells, so a glyph lands on whole pixels at the stage's usual scale.
  const flips = Math.floor(STOP / FLIP)
  const values = Array.from({ length: flips }, (_, k) => `${((k * 7) % (TILE_COLS / 2)) * 2 * CW} ${((k * 3) % TILE_ROWS) * CH}`).join(';')
  const times = Array.from({ length: flips }, (_, k) => n((k * FLIP) / LOOP)).join(';')
  return (
    `<pattern id="ph-type" width="${w}" height="${h}" patternUnits="userSpaceOnUse"><rect width="${w}" height="${h}" fill="#161616"/>` +
    `<animateTransform attributeName="patternTransform" type="translate" values="${values}" keyTimes="${times}" calcMode="discrete" dur="${LOOP}s" repeatCount="indefinite"/>` +
    `<g fill="#fff" font-family="${MONO}" font-size="4.5" font-weight="800" text-anchor="middle">${rows}</g></pattern>`
  )
}

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(sw: number): string {
  return (
    glyphTile() +
    rain(sw) +
    `<rect id="ph-dot" width="${CW}" height="${CH}"/>` +
    `<filter id="ph-ring" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.8"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    `<linearGradient id="ph-tail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${RAMP[4]}" stop-opacity="0"/><stop offset=".55" stop-color="${RAMP[6]}" stop-opacity=".45"/><stop offset="1" stop-color="${RAMP[8]}"/></linearGradient>` +
    `<linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="#000"/><stop offset=".7" stop-color="${RAMP[1]}"/><stop offset=".9" stop-color="${RAMP[4]}"/></linearGradient>` +
    `<linearGradient id="ph-skyn" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000"/><stop offset=".84" stop-color="#06160c"/></linearGradient>` +
    `<pattern id="ph-scan" width="4" height="1.5" patternUnits="userSpaceOnUse"><rect y="1" width="4" height=".5" fill="#000" opacity=".35"/></pattern>` +
    `<radialGradient id="ph-vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>`
  )
}

/**
 * The tube: the stage sampled once a cell, each cell holding the light at its
 * middle, for the glyph screen to print.
 */
function grade(): string {
  const dot = 0.4
  return (
    `<feFlood x="${n((CW - dot) / 2)}" y="${n((CH - dot) / 2)}" width="${dot}" height="${dot}" flood-color="black"/>` +
    `<feComposite x="0" y="0" width="${CW}" height="${CH}"/><feTile result="cell"/>` +
    `<feComposite in="SourceGraphic" in2="cell" operator="in"/><feMorphology operator="dilate" radius="${n((CW - dot) / 2)} ${n((CH - dot) / 2)}"/>`
  )
}

/** The clock's 6px monospace: a character's advance (6 × 0.6 em), and the strip's wider step, so a neighbour digit never peeks into the window. */
const ADV = 3.6
const STRIDE = 4
/** The chapter tag's 8px monospace: a character's advance (8 × 0.6 em). */
const TAG_ADV = 4.8

/** The clock in the corner: 01:29 and the seconds running while the streams fall, 01:30:00 in white when they stop. */
function clock(x: number, y: number): string {
  // One keyframe per tick of the clock: sixty ticks in the ten and a half seconds the streams fall,
  // so a tick is STOP / 60 = 0.175 s of real time, and the loop holds LOOP / 0.175 of them.
  const slots = Math.round(LOOP / (STOP / 60))
  // The seconds are two strips of digits, each scrolled behind a one-character window.
  const digit = (f: (secs: number) => number) =>
    Array.from({ length: slots }, (_, i) => {
      const t = (i * LOOP) / slots
      return t < STOP ? n(-f(Math.floor((t / STOP) * 60) % 60) * STRIDE) : 0
    }).join(';')
  const strip = (dx: number, f: (secs: number) => number) =>
    `<svg x="${n(x + dx)}" y="${n(y - 5)}" width="${ADV}" height="6" overflow="hidden"><text x="${Array.from({ length: 10 }, (_, d) => d * STRIDE).join(' ')}" y="5">0123456789` +
    `<animateTransform attributeName="transform" type="translate" values="${digit(f)}" calcMode="discrete" dur="${LOOP}s" repeatCount="indefinite"/></text></svg>`
  // The seconds' two digits stand after the six characters of "01:29:"; the backing fits all eight and a margin.
  return (
    `<g font-family="${MONO}" font-size="6"><rect x="${n(x - 1.5)}" y="${n(y - 6)}" width="${n(8 * ADV + 3)}" height="8" fill="#000" opacity=".8"/>` +
    `<g fill="${DIM}"><text x="${n(x)}" y="${n(y)}">01:29:</text>${strip(6 * ADV, s => Math.floor(s / 10))}${strip(7 * ADV, s => s % 10)}` +
    `<animate attributeName="visibility" values="visible;hidden" keyTimes="0;${AT_STOP}" calcMode="discrete" dur="${LOOP}s" repeatCount="indefinite"/></g>` +
    `<text x="${n(x)}" y="${n(y)}" fill="#fff" visibility="hidden">01:30:00` +
    `<animate attributeName="visibility" values="hidden;visible" keyTimes="0;${AT_STOP}" calcMode="discrete" dur="${LOOP}s" repeatCount="indefinite"/></text></g>`
  )
}

export const PHOSPHOR: Look = {
  name: 'phosphor',
  label: 'Phosphor Streams',
  voice: 'a green phosphor terminal in a dark room, glyph streams falling that stop at once',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: 5.7,
  caption: { fill: '#020a05', stroke: RAMP[5] ?? '#3c9c5d', ink: TERMINAL, radius: 0 },
  paper: {
    card: '#020a05',
    ink: TERMINAL,
    kinds: { code: '#5dff9a', path: '#9ff0ff', fn: '#e2ff8a', num: '#ffffff', bad: '#ff7a6a', good: '#7dff7a', face: '#ffd38a' },
  },
  inset: 4,
  titleColor: TERMINAL,
  edge: '#000',
  grade,
  art: {
    painter: scenery,
    hero,
    sky: '#000',
    ground: RAMP[1] ?? '#133f23',
    defs,
  },
  // The glyph screen over the sampled stage: each glyph takes its cell's light. Then the scanlines and the tube's darker edges.
  texture: (sw, h) =>
    `<rect width="${sw}" height="${h}" fill="url(#ph-type)" style="mix-blend-mode:multiply"/>` +
    `<rect width="${sw}" height="${h}" fill="url(#ph-scan)"/><rect width="${sw}" height="${h}" fill="url(#ph-vig)"/>`,
  // The tube's rounded corners in a black bezel, a faint rim of glass, and the clock.
  frame: (sw, h) =>
    `<rect x="-2" y="-2" width="${sw + 4}" height="${h + 4}" rx="11" fill="none" stroke="#000" stroke-width="7"/>` +
    `<rect x="1.8" y="1.8" width="${sw - 3.6}" height="${h - 3.6}" rx="7" fill="none" stroke="${RAMP[4]}" stroke-opacity=".6" stroke-width=".6"/>` +
    clock(8, h - 6),
  // The chapter as a prompt, with a blinking block cursor.
  tag: (text, inset) => {
    const x = inset + 5
    const y = inset + 4
    const t = `> ${text}`
    const w = t.length * TAG_ADV + 10
    return {
      svg:
        `<g font-family="${MONO}" font-size="8"><rect x="${x}" y="${y}" width="${n(w)}" height="12" fill="#000" opacity=".85"/>` +
        `<text x="${x + 3}" y="${y + 8.8}" fill="${TERMINAL}">${escape(t)}</text>` +
        `<rect x="${n(x + 3 + t.length * TAG_ADV + 1)}" y="${y + 2.4}" width="4.2" height="7.4" fill="${TERMINAL}">` +
        `<animate attributeName="opacity" values="1;0" dur="1.06s" calcMode="discrete" repeatCount="indefinite"/></rect></g>`,
      w: x + w + 4,
      h: y + 16,
    }
  },
  bubble: {
    font: MONO,
    size: 8.6,
    charW: 5.2,
    line: 11.5,
    base: 12.5,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A black terminal window ruled in a double phosphor line, its tail a ruled wedge to Claude.
      `<path fill="#020a05" stroke="${RAMP[7]}" stroke-width=".8" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#020a05" fill-opacity=".94" stroke="${RAMP[7]}" stroke-width=".8"/>` +
      `<rect x="${n(x + 1.8)}" y="${n(y + 1.8)}" width="${n(w - 3.6)}" height="${n(h - 3.6)}" fill="none" stroke="${RAMP[5]}" stroke-width=".5"/>`,
  },
}

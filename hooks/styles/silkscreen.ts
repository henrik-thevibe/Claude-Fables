/**
 * Silkscreen, after the gallery's "Silkscreen: after Warhol, 1960s"
 * (henrik-styles.js, style 43, `ssilk`), and the look's own sources: the
 * Factory's four-up portraits, pulled one flat screen at a time.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Every color is a flat screen of pop ink, chosen, not observed: tangerine,
 *   turquoise, hot pink, acid lime, lemon, ultramarine. No gradients; a tone is
 *   one ink or the next, picked by how light the lit color was.
 * - The black key screen is pulled last and lands true: a heavy black line
 *   round every near shape. The darker inks carry the key's halftone, black
 *   dots on the diagonal screen, as the gallery dots its shadows.
 * - The sky is one flat ink, turquoise by day, ultramarine by night, its lower
 *   band dotted in pink as the screen thins toward the horizon. The sun and the
 *   moon are flat lemon discs keyed in black; stars are lemon dots.
 * - Claude is the gallery's portrait: tangerine front, peach top, brick side,
 *   each a flat ink, the turned-away faces dotted with the key's halftone. The
 *   color screen drifts off the black one from print to print, so his color
 *   jumps a little round his black outline; his eyes are ultramarine under
 *   black.
 * - The screen is matted in cream print paper with a black rule, the chapter is
 *   a pink block knocked out of a misregistered black one, and the caption a
 *   lemon card with a hard black drop.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, num as n, poly, step } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const INK = '#151213'
const PAPER_CREAM = '#f3eedf'
const SANS = "'Helvetica Neue', 'Arial Black', Helvetica, Arial, sans-serif"

/** The pop inks, dark to light, by what a thing is; the darkest of each is dotted with the key's halftone. */
const INKS = {
  green: ['#1f6b4a', '#3d9f5f', '#9fd84a', '#e4f06a'],
  bark: ['#5a2a7a', '#9b3fa0', '#d86aa8'],
  warm: ['#a8302a', '#f06a3a', '#f39a3c', '#ffd36b'],
  pink: ['#7a2a8a', '#c2307a', '#f06aa8', '#ffc0dc'],
  cool: ['#1d2a8c', '#2b6f8f', '#3fc1b0', '#b8f0e8'],
  fire: ['#c8102e', '#f28c28', '#ffe14d'],
  far: ['#9b7ac8', '#e0a8d8', '#ffe0ec'],
} as const
type Group = keyof typeof INKS

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

function group(color: string, family: Family, depth: number): Group {
  switch (family) {
    case 'foliage':
    case 'grass':
      return 'green'
    case 'bark':
      return 'bark'
    case 'fire':
    case 'lamp':
    case 'stars':
    case 'life':
    case 'body':
      return 'fire'
    case 'glass':
    case 'water':
      return 'cool'
    default:
      if (depth < 0.25 && family !== 'mark') return 'far'
      if (isGreen(color)) return 'green'
      if (family === 'built') return isWarm(color) ? 'warm' : night ? 'pink' : 'cool'
      return isWarm(color) || !night ? 'warm' : 'pink'
  }
}

/** A lit color as a flat pop ink: the darkest ink of a group is its dotted screen. */
function flat(color: string, family: Family, depth: number): string {
  const g = group(color, family, depth)
  const inks = INKS[g]
  // Night scenes are lit dark; lift them so the inks stay pop and never go black.
  const t = Math.min(1, lum(color) * (night ? 1.6 : 1.1) + (family === 'fire' || family === 'lamp' ? 0.3 : 0))
  const i = Math.min(inks.length - 1, Math.floor(t * inks.length))
  return i === 0 ? `url(#sk-dot-${g})` : inks[i]!
}

/** A plain ink, for lines and stops, where a dotted screen cannot go. */
const plain = (color: string, family: Family) => (family === 'mark' || family === 'shadow' ? INK : step([...INKS[group(color, family, 0.5)]], lum(color)))

/** The sky: one flat ink, its lower band dotted pink as the screen thins. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = n(c.meta.sw ?? 640)
  night = lum(top) < 0.2 && lum(low) < 0.45
  return `<rect width="${sw}" height="128" fill="${night ? '#2c2a8c' : '#4cc6d6'}"/><rect y="62" width="${sw}" height="66" fill="url(#sk-sky-${night ? 'n' : 'd'})"/>`
}

/** A flat lemon disc keyed in black: the sun or the moon. */
function disc(c: Ctx): string {
  if (c.meta.part === 'halo') return ''
  const cx = n(c.meta.cx ?? 0)
  const cy = n(c.meta.cy ?? 0)
  const r = c.meta.r ?? 8
  if (c.role === 'space.earth')
    return `<circle cx="${cx}" cy="${cy}" r="${n(r)}" fill="url(#sk-dot-cool)" stroke="${INK}" stroke-width="1.2"/><path d="M${n((c.meta.cx ?? 0) - r * 0.5)} ${n((c.meta.cy ?? 0) - r * 0.2)}q${n(r * 0.4)} ${n(-r * 0.5)} ${n(r * 0.8)} 0t${n(r * 0.3)} ${n(r * 0.5)}" fill="#9fd84a" stroke="${INK}" stroke-width=".8"/>`
  return `<circle cx="${n((c.meta.cx ?? 0) + 1.2)}" cy="${n((c.meta.cy ?? 0) + 0.9)}" r="${n(r)}" fill="${night ? '#f06aa8' : '#ffe14d'}"/><circle cx="${cx}" cy="${cy}" r="${n(r)}" fill="none" stroke="${INK}" stroke-width="1.3"/>`
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => {
        if (attr !== 'fill') return plain(color, family)
        if (family === 'shadow') return 'url(#sk-shade)'
        if (family === 'mark') return INK
        if (family === 'cloud') return night ? '#e0a8d8' : '#fff6c0'
        return flat(color, family, depth)
      },
      // A gradient is pulled as one flat ink in its overall tone; a faint wash of light is not printed.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return plain(mean.color, family)
        if (mean.opacity < 0.5) return 'none'
        return flat(mean.color, family, 0.5)
      },
      // The black key: a heavy line round every near shape; air, light and the far distance go unkeyed.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'life' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'shadow' || depth < 0.25
          ? ''
          : `stroke="${INK}" stroke-width="${n(0.5 + depth * 0.6)}"`,
      lineless: 0.6,
      faint: 'hide',
      opacity: (_f, v) => (v >= 0.4 ? 1 : v),
      // A lamp's pool of light: a flat lemon ellipse, as the screen prints light.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="#ffe14d" opacity=".55"/>`,
      redraw: {
        sky,
        lens: () => '',
        glow: () => '',
        body: (_svg, c) => disc(c),
        air: (svg, c) => `<g opacity=".3">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? '#f06aa8' : '#fff6c0'}"`)}</g>`,
        beam: (svg, c) => `<g opacity=".35">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="#ffe14d"')}</g>`,
      },
    },
    'sk',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude's inks: each face flat, a turned-away face dotted with the key's halftone. */
const FACE_INK = { top: '#ffc27a', front: '#f2782a', side: '#c2412b' } as const
const faceInk = (name: string) => (name === 'top' ? 'top' : name === 'front' || name === 'back' ? 'front' : 'side')

/** Claude as the gallery's portrait: the color screen drifting off the black key, halftone in the shadows. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => `<path fill="url(#sk-h-${faceInk(f.name)}${f.light < 0.42 && f.name !== 'front' ? 'd' : ''})" d="${poly(f.pts, cx, floor)}"/>`)
    .join('')
  const blue = m.eyes
    .filter(e => e.poly)
    .map(e => poly(e.poly!, cx, floor))
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${INK}" d="${poly(e.poly, cx - 0.5, floor - 0.4)}"/>`
        : `<path fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="url(#sk-shade)" d="${poly(m.shadow, cx, floor)}"/>` +
    // The black key under the color, a little wider, so the drift shows black along one edge or another.
    `<path fill="${INK}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" d="${hulls}"/>` +
    // The color screen, landing a little differently every print.
    `<g>${faces}${blue ? `<path fill="#2a3cb0" d="${blue}"/>` : ''}` +
    `<animateTransform attributeName="transform" type="translate" values="1 -.6;-.8 .7;.5 .9;-.9 -.5;.2 .4" calcMode="discrete" dur="8s" repeatCount="indefinite"/></g>` +
    `<path fill="none" stroke="${INK}" stroke-width=".9" stroke-linejoin="round" d="${hulls}"/>` +
    eyes
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A halftone screen: the ink, with the key's black dots on the diagonal. */
const dots = (id: string, ink: string, r = 0.62, gap = 2.6, dot = INK) =>
  `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
  (ink === 'none' ? '' : `<rect width="${gap}" height="${gap}" fill="${ink}"/>`) +
  `<circle cx="${n(gap / 2)}" cy="${n(gap / 2)}" r="${r}" fill="${dot}"/></pattern>`

/** The definitions the whole style prints with, laid down once under the stage. */
function defs(): string {
  let out = ''
  for (const [g, inks] of Object.entries(INKS)) out += dots(`sk-dot-${g}`, inks[1]!, 0.7)
  for (const [k, c] of Object.entries(FACE_INK)) out += `<pattern id="sk-h-${k}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${c}"/></pattern>` + dots(`sk-h-${k}d`, c, 0.55, 2.4)
  return (
    out +
    dots('sk-shade', 'none', 0.75, 2.4) +
    dots('sk-sky-d', 'none', 0.6, 3.2, '#f06aa8') +
    dots('sk-sky-n', 'none', 0.6, 3.2, '#f06aa8') +
    `<pattern id="sk-streak" width="60" height="9" patternUnits="userSpaceOnUse"><rect y="3" width="60" height="1.4" fill="#fff" opacity=".07"/></pattern>`
  )
}

export const SILKSCREEN: Look = {
  name: 'silkscreen',
  label: 'Silkscreen',
  voice: 'a deadpan 1960s pop-art gallery label, flat and repeatable',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 5.4,
  caption: { fill: '#ffe14d', stroke: INK, ink: INK, radius: 0 },
  paper: { card: '#fff6d8', ink: INK, kinds: { code: '#1d2a8c', path: '#1f6b4a', fn: '#b0207a', num: '#c2412b', bad: '#c8102e', good: '#2a7a3a', face: '#7a2a8a' } },
  inset: 5,
  titleColor: '#ffffff',
  art: {
    painter: scenery,
    hero,
    sky: '#4cc6d6',
    ground: '#f39a3c',
    defs,
  },
  // The squeegee leaves faint streaks where the ink ran thin.
  texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#sk-streak)"/>`,
  // Matted in cream print paper, a black rule round the image.
  frame: (sw, h) =>
    `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${PAPER_CREAM}" stroke-width="3"/>` +
    `<rect x="3.2" y="3.2" width="${sw - 6.4}" height="${h - 6.4}" fill="none" stroke="${INK}" stroke-width="1"/>`,
  // The chapter: a pink block over a black one that landed off register, the title knocked out in white.
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 4
    const w = text.length * 6 + 10
    return {
      svg:
        `<rect x="${x + 1.6}" y="${y + 1.4}" width="${n(w)}" height="14" fill="${INK}"/>` +
        `<rect x="${x}" y="${y}" width="${n(w)}" height="14" fill="#f06aa8"/>` +
        `<text x="${x + 5}" y="${y + 10.2}" font-family="${SANS}" font-size="9" font-weight="900" letter-spacing=".6" fill="#ffffff">${escape(text.toUpperCase())}</text>`,
      w: x + w + 4,
      h: y + 17,
    }
  },
  bubble: {
    font: SANS,
    size: 9,
    charW: 5.4,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A lemon card with a hard black drop, its tail keyed in black.
      `<rect x="${n(x + 2.2)}" y="${n(y + 2.2)}" width="${w}" height="${h}" fill="${INK}"/>` +
      `<path fill="#ffe14d" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#fff6c0" stroke="${INK}" stroke-width="1.4"/>`,
  },
}

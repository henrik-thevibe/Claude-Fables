/**
 * Handheld, after the gallery's "Handheld: four shades of green, 1989"
 * (henrik-styles.js, style 45, `shandheld`), and the look's own source: the
 * pea-green reflective LCD of the first pocket game consoles.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - There are four shades and no others: pale pea green, a moss, an olive,
 *   and a near-black bottle green. Every element is set in the shade nearest
 *   its lightness, and the whole screen is snapped to them, so a blend or a
 *   wash falls into one shade or the next, never between.
 * - The screen is a grid of fat square pixels, a faint gridline of the dark
 *   shade between each, as on the glass of the LCD. Nothing is smaller than a pixel.
 * - The sky is the palest shade with a dithered band of moss at the horizon,
 *   checkerboard by checkerboard, as the gallery's; clouds are pale shapes
 *   ringed in the darkest shade. Night is the olive, the stars and the moon
 *   picked out in the palest green; light is pale, shadow the darkest.
 * - Nearer things are ringed in a pixel of the darkest shade; far things go
 *   without, as sprites in front of a background layer.
 * - Claude is the gallery's sprite: his top the palest shade, his front the
 *   moss, his sides and legs the olive, ringed and eyed in the darkest green.
 * - The chapter is the status bar's lettering, the caption the game's text
 *   box: a double rule, pale inside, dark type.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { lum, meanOf, num as n, poly } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import { cells } from '../grade'
import type { Look } from '../looks'

/** The four shades, light to dark, as the gallery orders them. */
const SH = ['#c5d36b', '#8fa83f', '#4f6b2a', '#1f3415'] as const
const MONO = "'Press Start 2P', 'Silkscreen', ui-monospace, 'Courier New', monospace"
/** One LCD pixel, in stage units. */
const PX = 2
/** The ground's top on the stage, where the dither band ends. */
const HORIZON = 104

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** The shade for a lightness: the lit scenes are dim, so lightness is lifted before it is binned. */
function shade(color: string, lift = 0): string {
  const t = Math.min(1, Math.pow(lum(color), 0.6) + lift)
  return SH[Math.max(0, Math.min(3, 3 - Math.floor(t * 4)))]!
}

function ink(color: string, family: Family, attr: string): string {
  if (attr === 'stroke') return SH[3]
  switch (family) {
    case 'fire':
    case 'lamp':
    case 'stars':
    case 'life':
      return SH[0]
    case 'shadow':
      return SH[3]
    case 'glass':
    case 'water':
      return night ? SH[1] : SH[1]
    case 'cloud':
      return night ? SH[1] : SH[0]
    default:
      // Under a night sky things are lifted a shade, so the olive sky is not a black screen.
      return shade(color, night ? 0.18 : 0.05)
  }
}

/** The sky: pale by day, olive by night, a dithered band of moss toward the horizon. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  return (
    `<rect width="${n(sw)}" height="128" fill="${night ? SH[2] : SH[0]}"/>` +
    `<rect y="${HORIZON - 34}" width="${n(sw)}" height="18" fill="url(#hh-dither-${night ? 'n' : 'd'}1)"/>` +
    `<rect y="${HORIZON - 16}" width="${n(sw)}" height="16" fill="url(#hh-dither-${night ? 'n' : 'd'}2)"/>`
  )
}

/** The sun, the moon or a planet: a pale disc ringed in the dark shade. */
function body(_svg: string, c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 8
  if (c.meta.part === 'halo') return ''
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${SH[0]}" stroke="${SH[3]}" stroke-width="${PX}"/>` +
    (c.role === 'space.earth' ? `<circle cx="${n(cx - r * 0.3)}" cy="${n(cy - r * 0.2)}" r="${n(r * 0.4)}" fill="${SH[1]}"/>` : '')
  )
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, _depth, attr) => ink(color, family, attr),
      // A gradient is one shade on an LCD: its mean, binned.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr !== 'stroke' && mean.opacity < 0.4) return 'none'
        return ink(mean.color, family, attr)
      },
      // Nearer things are ringed in a pixel of the darkest shade; the background layer goes without.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'life' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'fire' || family === 'lamp' || depth < 0.3
          ? ''
          : `stroke="${SH[3]}" stroke-width="${n(PX * 0.7)}" stroke-linejoin="miter"`,
      // A pixel is lit or it is not: no half washes.
      opacity: (_f, v) => (v >= 0.4 ? 1 : 0),
      lineless: 0.6,
      faint: 'hide',
      // A pool of lamplight is a dithered patch of pale on the ground.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="url(#hh-pool)"/>`,
      redraw: {
        sky,
        body,
        lens: () => '',
        glow: () => '',
        beam: () => '',
        cloud: (svg, c) => `<g stroke="${SH[3]}" stroke-width="${PX * 0.6}">${c.repaint(svg).replace(/\sopacity="[^"]*"/g, '')}</g>`,
        // Haze is a dither: every other pixel.
        air: (svg, c) => `<g>${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#hh-pool)"')}</g>`,
      },
    },
    'hh',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude as the gallery's sprite: top pale, front moss, sides olive, ringed and eyed in the dark shade. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => {
      const tone = f.name === 'top' ? SH[0] : f.name === 'front' && f.part === 'body' ? SH[1] : SH[2]
      return `<path fill="${tone}" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${SH[3]}" stroke="${SH[3]}" stroke-width="1.4" d="${poly(e.poly, cx, floor)}"/>`
        : `<path fill="none" stroke="${SH[3]}" stroke-width="2" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="url(#hh-shadow)" d="${poly(m.shadow, cx, floor)}"/>` +
    `<path fill="${SH[3]}" stroke="${SH[3]}" stroke-width="${PX * 1.2}" stroke-linejoin="miter" d="${hulls}"/>` +
    faces +
    eyes
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A checkerboard of one shade on another, one LCD pixel a square. */
const dither = (id: string, back: string, dot: string) =>
  `<pattern id="${id}" width="${PX * 2}" height="${PX * 2}" patternUnits="userSpaceOnUse"><rect width="${PX * 2}" height="${PX * 2}" fill="${back}"/>` +
  `<rect width="${PX}" height="${PX}" fill="${dot}"/><rect x="${PX}" y="${PX}" width="${PX}" height="${PX}" fill="${dot}"/></pattern>`

/** Every color on the screen binned by lightness into the four shades. */
const SNAP = (() => {
  const table = (k: number) => SH.slice().reverse().map(c => n(parseInt(c.slice(1 + k * 2, 3 + k * 2), 16) / 255)).join(' ')
  return (
    `<feColorMatrix values=".3 .59 .11 0 0  .3 .59 .11 0 0  .3 .59 .11 0 0  0 0 0 1 0"/>` +
    `<feComponentTransfer><feFuncR type="discrete" tableValues="${table(0)}"/><feFuncG type="discrete" tableValues="${table(1)}"/><feFuncB type="discrete" tableValues="${table(2)}"/></feComponentTransfer>`
  )
})()

export const HANDHELD: Look = {
  name: 'handheld',
  label: 'Handheld',
  voice: 'a 1989 handheld game\'s text box, terse and in capitals',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: 5.6,
  caption: { fill: SH[0], stroke: SH[3], ink: SH[3], radius: 0 },
  paper: { card: '#d6e29a', ink: SH[3], kinds: { code: '#1f4a5a', path: '#2a5a1a', fn: '#5a2a6a', num: '#7a4a08', bad: '#8a1a1a', good: '#0e5a2a', face: '#6a2a40' } },
  inset: 5,
  titleColor: SH[3],
  // The medium: the screen set into fat pixels, then every pixel snapped to the four shades.
  grade: () => cells('SourceGraphic', PX, 'hh-lcd') + SNAP,
  edge: SH[0],
  art: {
    painter: scenery,
    hero,
    sky: SH[0],
    ground: SH[2],
    defs: () =>
      dither('hh-dither-d1', SH[0], SH[1]) +
      dither('hh-dither-d2', SH[1], SH[2]) +
      dither('hh-dither-n1', SH[2], SH[1]) +
      dither('hh-dither-n2', SH[1], SH[0]) +
      `<pattern id="hh-pool" width="${PX * 2}" height="${PX * 2}" patternUnits="userSpaceOnUse"><rect width="${PX}" height="${PX}" fill="${SH[0]}"/><rect x="${PX}" y="${PX}" width="${PX}" height="${PX}" fill="${SH[0]}"/></pattern>` +
      `<pattern id="hh-shadow" width="${PX * 2}" height="${PX * 2}" patternUnits="userSpaceOnUse"><rect width="${PX}" height="${PX}" fill="${SH[3]}"/><rect x="${PX}" y="${PX}" width="${PX}" height="${PX}" fill="${SH[3]}"/></pattern>`,
  },
  // The glass of the LCD: a faint gridline between the pixels.
  texture: (sw, h) =>
    `<defs><pattern id="hh-grid" width="${PX}" height="${PX}" patternUnits="userSpaceOnUse"><path d="M0 0h${PX}v.18h-${PX}zM0 0h.18v${PX}h-.18z" fill="${SH[3]}" opacity=".14"/></pattern></defs>` +
    `<rect width="${sw}" height="${h}" fill="url(#hh-grid)"/>`,
  // The screen's dark rim.
  frame: (sw, h) => `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" fill="none" stroke="${SH[3]}" stroke-width="2"/>`,
  // The chapter as the status bar: dark capitals on a pale strip with a dark rule beneath.
  tag: (text, inset) => {
    const t = escape(text.toUpperCase())
    const x = inset + 3
    const y = inset + 2
    const w = text.length * 6 + 10
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="13" fill="${SH[0]}"/><rect x="${x}" y="${y + 12}" width="${n(w)}" height="1.4" fill="${SH[3]}"/>` +
        `<text x="${x + 5}" y="${y + 9.4}" font-family="${MONO}" font-size="8" font-weight="700" letter-spacing=".4" fill="${SH[3]}">${t}</text>`,
      w: x + w + 4,
      h: y + 17,
    }
  },
  bubble: {
    font: MONO,
    size: 9,
    charW: 5.6,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // The game's text box: a dark rule, a pale gap, a second dark rule, pale inside.
      `<path fill="${SH[3]}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${SH[0]}" stroke="${SH[3]}" stroke-width="2"/>` +
      `<rect x="${n(x + 2.6)}" y="${n(y + 2.6)}" width="${n(w - 5.2)}" height="${n(h - 5.2)}" fill="none" stroke="${SH[3]}" stroke-width="1"/>`,
  },
}

/**
 * Constructivism, after the gallery's "Constructivism: Moscow, 1920s"
 * (henrik-styles.js, style 39, `sconst`), and the look's own sources: the
 * Soviet photomontage posters of Rodchenko, Klutsis and the Stenberg brothers.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Three inks on a yellowed newsprint: poster red, press black, and a warm
 *   grey, with the paper itself the fourth. Nothing is blended; a tone between
 *   two inks is a halftone screen, black dots on the diagonal.
 * - Every shape is cut flat from one of them by its lightness: the darks are
 *   black, the middles screened grey, the lights the paper. Trees and grass
 *   are the poster's red; water and glass a screen. Nearer things are keyed
 *   in a black rule; the far distance has none.
 * - The sky is the paper, crossed high by a black diagonal band and a thin
 *   grey one, the dynamic slant of the posters. The sun is the red disc.
 *   Night is the same poster pulled in red: a red sky, its bands black, the
 *   moon a paper disc and the stars paper dots.
 * - Claude is the photomontage: a halftoned photograph cut out with a white
 *   margin and pasted on, each face screened in its own grey as it turns from
 *   the light, with black eyes.
 * - The chapter is set in heavy grotesque on a red wedge; the caption is a
 *   paper slip in a black rule with a red tail; a black rule frames the sheet.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isWarm, lum, meanOf, num as n, poly } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const GROT = "'Futura', 'Avenir Next Condensed', 'Franklin Gothic Medium', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif"
const PAPER = '#ece2cc'
const RED = '#d22b1f'
const BLACK = '#161413'
const GREY = '#8f8a82'
/** The poster's darker red, for what is red but must sit back. */
const OXBLOOD = '#8e1d15'

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** Lightness, lifted at night so the dark scenes still print in all the inks. */
const lit = (color: string) => {
  const t = lum(color)
  return night ? Math.min(1, t * 1.7 + 0.12) : t
}

/** The ink a lit color is cut from: black, the dense screen, grey, the light screen, or paper. */
function cut(t: number): string {
  if (t < 0.22) return BLACK
  if (t < 0.38) return 'url(#cn-ht2)'
  if (t < 0.55) return GREY
  if (t < 0.72) return 'url(#cn-ht0)'
  return PAPER
}

/** A plain ink, for lines, stops and currentColor, where a screen cannot go. */
function plain(color: string, family: Family): string {
  const t = lit(color)
  switch (family) {
    case 'fire':
    case 'lamp':
    case 'life':
      return t > 0.7 ? PAPER : RED
    case 'foliage':
    case 'grass':
      return t < 0.3 ? OXBLOOD : RED
    case 'stars':
      return night ? PAPER : BLACK
    default:
      return t < 0.3 ? BLACK : t < 0.65 ? GREY : PAPER
  }
}

/** The fill for a lit color, by family. */
function fill(color: string, family: Family): string {
  const t = lit(color)
  switch (family) {
    case 'foliage':
      return t < 0.3 ? OXBLOOD : RED
    case 'grass':
      return t < 0.35 ? OXBLOOD : t < 0.6 ? RED : 'url(#cn-htr)'
    case 'fire':
      return t > 0.75 ? PAPER : RED
    case 'lamp':
      return isWarm(color) || t > 0.6 ? RED : PAPER
    case 'life':
    case 'mark':
      return t > 0.7 ? PAPER : isWarm(color) ? RED : BLACK
    case 'stars':
      return night ? PAPER : BLACK
    case 'glass':
    case 'water':
      return t < 0.4 ? 'url(#cn-ht2)' : 'url(#cn-ht1)'
    case 'shadow':
      return BLACK
    case 'cloud':
      return night ? GREY : PAPER
    case 'air':
      return night ? GREY : PAPER
    default:
      return cut(t)
  }
}

/** The sky: newsprint crossed by the poster's slanting bands; at night the same, pulled in red. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? '#80a0c0'
  const low = stops[stops.length - 1]?.color ?? top
  night = lum(top) < 0.2 && lum(low) < 0.45
  const sw = c.meta.sw ?? 640
  const band = (y0: number, y1: number, w: number, ink: string) => `<path d="M-10 ${n(y0)}L${n(sw + 10)} ${n(y1)}" stroke="${ink}" stroke-width="${w}"/>`
  return (
    `<rect width="${n(sw)}" height="128" fill="${night ? 'url(#cn-skyn)' : 'url(#cn-sky)'}"/>` +
    band(46, 6, 7, night ? BLACK : BLACK) +
    band(56, 16, 1.4, night ? PAPER : GREY)
  )
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, _depth, attr) => (attr === 'fill' ? fill(color, family) : plain(color, family)),
      // A gradient is cut as one ink, from its overall tone; a faint wash of light is not printed.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return plain(mean.color, family)
        if (mean.opacity < 0.5) return 'none'
        return fill(mean.color, family)
      },
      // Nearer things keyed in a black rule; air, light and the far distance unruled.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'fire' || family === 'lamp' || family === 'shadow' || depth < 0.25
          ? ''
          : `stroke="${BLACK}" stroke-width="${n(0.35 + depth * 0.4)}" stroke-linejoin="miter"`,
      lineless: 0.6,
      faint: 'hide',
      opacity: (family, v) => (family === 'shadow' ? Math.min(v, 0.45) : v >= 0.4 ? 1 : v),
      // A lamp's pool of light is a red ellipse with a paper heart.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${RED}" opacity=".55"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="${PAPER}" opacity=".7"/>`,
      redraw: {
        sky,
        lens: () => '',
        glow: () => '',
        beam: (svg, c) => `<g opacity=".3">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? PAPER : RED}"`)}</g>`,
        air: (svg, c) => `<g opacity=".35">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? GREY : PAPER}"`)}</g>`,
        // The sun is the poster's red disc; the moon a paper one; the Earth a screened disc ringed in black.
        body: (_svg, c) => {
          if (c.meta.part === 'halo') return ''
          const cx = n(c.meta.cx ?? 0)
          const cy = n(c.meta.cy ?? 0)
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return `<circle cx="${cx}" cy="${cy}" r="${n(r)}" fill="url(#cn-ht1)" stroke="${BLACK}" stroke-width="1"/><path d="M${n((c.meta.cx ?? 0) - r)} ${cy}h${n(r * 2)}" stroke="${RED}" stroke-width="2"/>`
          return `<circle cx="${cx}" cy="${cy}" r="${n(r * 1.25)}" fill="${night ? PAPER : RED}"/>`
        },
      },
    },
    'cn',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude as the photomontage: a halftoned photograph cut out with a white margin, each face screened in its own grey. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => {
      const k = f.light > 0.55 ? 0 : f.light > 0.3 ? 1 : 2
      return `<path fill="url(#cn-f${k})" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${BLACK}" d="${poly(e.poly, cx, floor)}"/>`
        : `<path fill="none" stroke="${BLACK}" stroke-width="1.1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="${BLACK}" opacity=".35" d="${poly(m.shadow, cx, floor)}"/>` +
    // The cutout: a grey edge, then the white margin the scissors left, under the photograph.
    `<path fill="#fbf8f0" stroke="#9a948a" stroke-width="4.2" stroke-linejoin="round" d="${hulls}"/>` +
    `<path fill="#fbf8f0" stroke="#fbf8f0" stroke-width="3.2" stroke-linejoin="round" d="${hulls}"/>` +
    faces +
    eyes
  )
}

// ---------------------------------------------------------------- the sheet

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A halftone screen: a ground ink with black dots of radius `r` on the diagonal. */
const screen = (id: string, ground: string, r: number, ink = BLACK, size = 2.4) =>
  `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${size}" height="${size}" fill="${ground}"/><circle cx="${n(size / 2)}" cy="${n(size / 2)}" r="${r}" fill="${ink}"/></pattern>`

function defs(): string {
  return (
    // Screens for the scenery: light, mid and dense, and a red one for sunlit grass.
    screen('cn-ht0', PAPER, 0.45) +
    screen('cn-ht1', '#b8b0a2', 0.6) +
    screen('cn-ht2', GREY, 0.85) +
    screen('cn-htr', RED, 0.5, PAPER) +
    // Claude's photograph: a finer screen, denser as a face turns from the light.
    screen('cn-f0', '#d8d2c6', 0.42, BLACK, 1.9) +
    screen('cn-f1', '#a8a296', 0.58, BLACK, 1.9) +
    screen('cn-f2', '#7e7a72', 0.75, BLACK, 1.9) +
    `<linearGradient id="cn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2e9d4"/><stop offset="1" stop-color="${PAPER}"/></linearGradient>` +
    `<linearGradient id="cn-skyn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${OXBLOOD}"/><stop offset=".7" stop-color="${RED}"/><stop offset="1" stop-color="#e2553f"/></linearGradient>` +
    `<radialGradient id="cn-blot" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#7a5a2a" stop-opacity="0"/><stop offset="1" stop-color="#7a5a2a" stop-opacity=".22"/></radialGradient>`
  )
}

export const CONSTRUCTIVISM: Look = {
  name: 'constructivism',
  label: 'Constructivism',
  voice: 'a 1920s Soviet agitprop poster slogan, terse and rousing',
  cell: 'solid',
  figure: '3d',
  font: GROT,
  charW: 5.2,
  caption: { fill: BLACK, stroke: RED, ink: PAPER, radius: 0 },
  paper: { card: PAPER, ink: BLACK, kinds: { code: '#1f4f7a', path: '#3a3a8a', fn: '#7a2a7a', num: '#b0400a', bad: RED, good: '#2a6a2a', face: RED } },
  inset: 6,
  titleColor: BLACK,
  art: {
    painter: scenery,
    hero,
    sky: PAPER,
    ground: GREY,
    defs,
  },
  // The newsprint yellowing toward its edges.
  texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#cn-blot)"/>`,
  // A heavy black rule round the sheet, and a thin red one inside it.
  frame: (sw, h) =>
    `<rect x="2" y="2" width="${sw - 4}" height="${h - 4}" fill="none" stroke="${BLACK}" stroke-width="2.6"/>` +
    `<rect x="5.6" y="5.6" width="${sw - 11.2}" height="${h - 11.2}" fill="none" stroke="${RED}" stroke-width=".8"/>`,
  // The chapter in heavy grotesque capitals on a red wedge, a black bar under it.
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 3
    const w = n(text.length * 6.4 + 14)
    return {
      svg:
        `<path d="M${x} ${y}H${n(x + Number(w) + 6)}L${n(x + Number(w))} ${y + 13}H${x}z" fill="${RED}"/>` +
        `<rect x="${x}" y="${y + 14}" width="${w}" height="1.6" fill="${BLACK}"/>` +
        `<text x="${x + 5}" y="${y + 9.8}" font-family="${GROT}" font-size="8.6" font-weight="900" letter-spacing="1.2" fill="${PAPER}">${escape(text.toUpperCase())}</text>`,
      w: x + Number(w) + 10,
      h: y + 17,
    }
  },
  bubble: {
    font: GROT,
    size: 9,
    charW: 5.2,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A paper slip in a black rule, a red wedge for its tail, a red bar along its top.
      `<path fill="${RED}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${PAPER}" stroke="${BLACK}" stroke-width="1.6"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="2.2" fill="${RED}"/>`,
  },
}

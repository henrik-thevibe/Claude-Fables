/**
 * Strongman Bill, after the gallery's "Strongman Bill: Letterpress, 1890s"
 * (henrik-styles.js, style 38, `sbill`): a letterpress circus bill printed in
 * red and black.
 *
 * The art bible, translated from the gallery's bill to the Fables' worlds:
 *
 * - Two inks on a buff sheet: a hot vermilion and a warm black, nothing
 *   else. The paper is foxed and blotted, and the type is worn, specks of
 *   bare sheet showing through the ink.
 * - It is a two-colour woodcut. The black key cuts every tone as lines, close
 *   and heavy where it is dark, open where it is light, crossed in the deep
 *   shadows; each kind of thing along its own grain: skies and water level,
 *   bark, walls and grass upright, hills and leaves on the slant.
 * - The red block carries everything warm and everything that gives light:
 *   fire and lava are solid red, roofs and bricks a red tint of lines, the
 *   sun a red disc with a ring of black rays, lamps a red heart. The red is
 *   pulled first and lies a touch off register.
 * - Night is the same sheet under a heavy black-ruled sky, the stars and the
 *   moon left as bare paper.
 * - Claude is cut as the gallery cuts him: a heavy black contour, his front
 *   and arms pulled in red a little off register, the sides hatched upright,
 *   the top left bare, solid eyes with a reserved glint.
 * - The bill: a double rule round the sheet, the chapter on a red banner
 *   between stars, the caption a ruled notice with a pointing hand of a tail.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isWarm, lum, meanOf, num as n, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const PAPER = '#efe2c2'
const HI = '#f5ead0'
const RED = '#bf3527'
const INK = '#1d1a17'
const SERIF = "'Big Caslon', 'Caslon', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
const DIDONE = "Didot, 'Bodoni 72', 'Bodoni MT', 'Iowan Old Style', Georgia, serif"

/** The grain each family is cut along. */
type Grain = 'h' | 'v' | 'd'
const GRAIN: Partial<Record<Family, Grain>> = {
  bark: 'v', built: 'v', grass: 'v', foliage: 'd', land: 'd', rock: 'd',
}
const ANGLE: Record<Grain, number> = { h: 0, v: 90, d: -40 }
/** The black cut by tone: line weight, and whether a second set crosses it. */
const CUT = [0, 0.3, 0.5, 0.7, 0.95]
const GAP = 2

/** The patterns the two blocks are cut in, defined once for the sheet. */
function blocks(): string {
  let out = ''
  for (const g of ['h', 'v', 'd'] as Grain[]) {
    for (let k = 1; k < CUT.length; k++) {
      out +=
        `<pattern id="sb-${g}${k}" width="8" height="${GAP}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ANGLE[g]})">` +
        `<rect width="8" height="${GAP}" fill="${PAPER}"/><path d="M0 ${n(GAP / 2)}H8" stroke="${INK}" stroke-width="${CUT[k]}"/></pattern>`
      // The deepest tones crossed once more on the slant.
      if (k >= 3)
        out +=
          `<pattern id="sb-${g}${k}x" width="8" height="${n(GAP * 1.2)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ANGLE[g] + 60})">` +
          `<rect width="8" height="${n(GAP * 1.2)}" fill="url(#sb-${g}${k})"/><path d="M0 ${n(GAP * 0.6)}H8" stroke="${INK}" stroke-width="${n(CUT[k]! * 0.7)}"/></pattern>`
    }
    // The red block's tint: red lines along the grain on the sheet.
    out +=
      `<pattern id="sb-r${g}" width="8" height="${GAP}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ANGLE[g]})">` +
      `<rect width="8" height="${GAP}" fill="${PAPER}"/><path d="M0 ${n(GAP / 2)}H8" stroke="${RED}" stroke-width=".9"/></pattern>`
  }
  return out
}

/** The black cut for a darkness `t` (0 paper, 1 black). */
function cut(t: number, g: Grain): string {
  const k = Math.max(0, Math.min(CUT.length - 1, Math.floor(t * CUT.length)))
  if (k === 0) return PAPER
  return `url(#sb-${g}${k}${k >= 3 ? 'x' : ''})`
}

/** A warm color goes to the red block: a tint where it is light, solid where it is deep. */
const reddish = (color: string) => isWarm(color) && lum(color) < 0.85 && /^#/.test(color) && sat(color) > 0.25
function sat(color: string): number {
  const v = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255)
  const hi = Math.max(...v)
  const lo = Math.min(...v)
  return hi === 0 ? 0 : (hi - lo) / hi
}

function ink(color: string, family: Family, attr: string): string {
  if (attr === 'stroke') return family === 'fire' || family === 'lamp' ? RED : INK
  if (attr === 'color') return INK
  if (attr === 'stop-color') return family === 'fire' || reddish(color) ? RED : lum(color) > 0.5 ? PAPER : INK
  const g = GRAIN[family] ?? 'h'
  switch (family) {
    case 'fire':
    case 'life':
      return RED
    case 'lamp':
      return lum(color) > 0.6 ? PAPER : RED
    case 'stars':
    case 'body':
    case 'air':
    case 'beam':
    case 'glow':
    case 'lens':
      return PAPER
    case 'shadow':
      return 'url(#sb-h3x)'
    case 'sky':
    case 'cloud':
      return cut((1 - lum(color)) * 0.6, 'h')
    default:
      break
  }
  if (lum(color) > 0.84) return PAPER
  if (reddish(color)) return lum(color) > 0.45 ? `url(#sb-r${g})` : RED
  return cut(1 - Math.min(1, Math.pow(lum(color), 0.8) * 1.15), g)
}

const UNLINED: readonly Family[] = ['sky', 'air', 'beam', 'glow', 'stars', 'life', 'lens', 'water', 'fire']

/** A sky ruled level in black, heavier toward the horizon by day, heavy all through at night. */
function ruledSky(c: Ctx, dark: number): string {
  const sw = c.meta.sw ?? 640
  let out = ''
  for (let b = 0; b < 7; b++) {
    const y0 = 2 + b * 16
    const k = b / 6
    const w = n(Math.min(1.15, 0.1 + dark * 1.05 + (0.25 + dark * 0.2) * k))
    let d = ''
    for (let y = y0; y < y0 + 16 && y < 114; y += GAP) d += `M0 ${n(y)}H${sw}`
    out += `<path d="${d}" stroke="${INK}" stroke-width="${w}" stroke-dasharray="${90 + b * 21} ${2 + (b % 3) * 1.5}" stroke-dashoffset="${b * 41}"/>`
  }
  return `<rect width="${sw}" height="128" fill="${PAPER}"/>${out}`
}

/** The sun as a red disc ringed in black rays; the moon a paper disc ringed in black. */
function orb(c: Ctx, sun: boolean): string {
  if (c.meta.part === 'halo') return ''
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = (c.meta.r ?? 8) * 1.15
  let d = ''
  if (sun)
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      const r1 = r + 2.5
      const r2 = r + (i % 2 ? 5.5 : 9)
      d += `M${n(cx + Math.cos(a) * r1)} ${n(cy + Math.sin(a) * r1)}L${n(cx + Math.cos(a) * r2)} ${n(cy + Math.sin(a) * r2)}`
    }
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r + (sun ? 10 : 3))}" fill="${PAPER}"/>` +
    (sun ? `<circle cx="${n(cx + 1)}" cy="${n(cy + 0.7)}" r="${n(r)}" fill="${RED}"/>` : '') +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${sun ? 'none' : PAPER}" stroke="${INK}" stroke-width=".7"/>` +
    (d ? `<path d="${d}" stroke="${INK}" stroke-width=".6" stroke-linecap="round"/>` : '')
  )
}

/** Stars as five-point printer's stars, the stock cut. */
function starPath(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const q = i % 2 ? r * 0.42 : r
    pts.push(`${n(Math.cos(a) * q)} ${n(Math.sin(a) * q)}`)
  }
  return `M${pts.join('L')}z`
}

const scenery = () =>
  painter(
    {
      ink: (color, family, _depth, attr) => ink(color, family, attr),
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient' && (family === 'glow' || family === 'lamp' || family === 'fire')) return undefined
        if (attr === 'stroke') return family === 'fire' ? RED : INK
        if (g && meanOf(g).opacity < 0.5) return 'none'
        return ink(g ? meanOf(g).color : '#808080', family, 'fill')
      },
      line: (family, depth) => (UNLINED.includes(family) ? '' : `stroke="${INK}" stroke-width="${n(0.25 + depth * 0.5)}" stroke-linejoin="round"`),
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool: a red tint on the floor, ringed in a dashed black rule.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="url(#sb-rh)" opacity=".7" stroke="${INK}" stroke-width=".4" stroke-dasharray="2 1.6"/>`,
      redraw: {
        sky: (svg, c) => {
          const g = c.gradient(svg)
          return ruledSky(c, g ? 1 - lum(meanOf(g).color) : 0.4)
        },
        // Stars are the stock cut, left as paper with a red heart.
        stars: (svg, c) =>
          c
            .repaint(svg)
            .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
              const pts: [string, string][] =
                tag === 'path'
                  ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
                  : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
              const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
              return `<g${kept}>${pts.map(([x, y]) => `<use href="#sb-star" x="${x}" y="${y}"/>`).join('')}${close ? '</g>' : ''}`
            })
            .replace(/<\/(path|rect)>/g, '</g>'),
        'space.milkyway': (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, '')),
        lens: () => '',
        water: () => '',
        glow: () => '',
        'forest.sun': (_s, c) => orb(c, true),
        'desert.sun': (_s, c) => orb(c, true),
        'night.moon': (_s, c) => orb(c, false),
        air: (svg, c) => `<g opacity=".5">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${PAPER}"`)}</g>`,
        beam: (svg, c) => `<g opacity=".4">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${PAPER}"`)}</g>`,
      },
    },
    'sb',
  )

// ---------------------------------------------------------------- Claude

/** Claude as the gallery cuts him: front and arms in red off register, the sides hatched, a heavy black contour. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  let red = ''
  let faces = ''
  let fill = ''
  let d = ''
  for (const f of outlinedFaces(m)) {
    const pts = poly(f.pts, cx, floor)
    if (f.name === 'front' || (f.part.startsWith('a') && f.name !== 'top')) red += pts
    const c = f.name === 'top' || f.name === 'front' ? PAPER : cut(Math.min(0.95, (1 - f.light) * 0.8 + 0.3), f.name === 'bottom' ? 'h' : 'v')
    if (f.name === 'front' || (f.part.startsWith('a') && f.name !== 'top')) {
      if (d) faces += `<path fill="${fill}" d="${d}"/>`
      d = ''
      fill = ''
      continue
    }
    if (c !== fill && d) {
      faces += `<path fill="${fill}" d="${d}"/>`
      d = ''
    }
    fill = c
    d += pts
  }
  if (d) faces += `<path fill="${fill}" d="${d}"/>`
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${INK}" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor)}" r=".45" fill="${HI}"/>`
        : `<path fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="url(#sb-h3x)" opacity=".75" d="${poly(m.shadow, cx, floor)}"/>` +
    `<path fill="${PAPER}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" d="${hulls}"/>` +
    `<g stroke="${INK}" stroke-width=".45" stroke-linejoin="round">${faces}</g>` +
    // The red block, pulled a touch off register, its faces' edges keyed in fine black after.
    (red ? `<path fill="${RED}" transform="translate(.7 .45)" d="${red}"/><path fill="none" stroke="${INK}" stroke-width=".45" stroke-linejoin="round" d="${red}"/>` : '') +
    eyes
  )
}

// ---------------------------------------------------------------- the bill

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const BILL: Look = {
  name: 'bill',
  label: 'Strongman Bill',
  voice: 'an 1890s circus barker on a letterpress bill, all capitals and exclamation',
  cell: 'solid',
  figure: '3d',
  font: SERIF,
  charW: 5.1,
  caption: { fill: HI, stroke: INK, ink: INK, radius: 0 },
  paper: { card: HI, ink: INK, kinds: { code: '#3a2c20', path: '#4a3a28', fn: '#8a2418', num: RED, bad: '#a32a1c', good: '#2c4a28', face: RED } },
  inset: 6,
  titleColor: RED,
  art: {
    painter: scenery,
    hero,
    sky: PAPER,
    ground: PAPER,
    defs: () =>
      blocks() +
      `<path id="sb-star" d="${starPath(2.2)}" fill="${HI}" stroke="${RED}" stroke-width=".5"/>` +
      // The sheet: brown blots and foxing, and specks of bare paper through the worn ink.
      `<filter id="sb-paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .016" numOctaves="3" seed="38"/>` +
      `<feColorMatrix values="0 0 0 0 .55  0 0 0 0 .42  0 0 0 0 .22  2.2 0 0 0 -.95"/></filter>` +
      `<filter id="sb-worn" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="83"/>` +
      `<feColorMatrix values="0 0 0 0 .94  0 0 0 0 .89  0 0 0 0 .76  14 0 0 0 -10.6"/></filter>`,
  },
  texture: (sw, h) =>
    `<rect width="${sw}" height="${h}" filter="url(#sb-paper)" opacity=".35"/>` +
    `<rect width="${sw}" height="${h}" filter="url(#sb-worn)" opacity=".75"/>`,
  // The bill's double rule: a heavy black line, a fine red one inside it.
  frame: (sw, h) =>
    `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" fill="none" stroke="${PAPER}" stroke-width="3"/>` +
    `<rect x="3" y="3" width="${sw - 6}" height="${h - 6}" fill="none" stroke="${INK}" stroke-width="1.6"/>` +
    `<rect x="5.6" y="5.6" width="${sw - 11.2}" height="${h - 11.2}" fill="none" stroke="${RED}" stroke-width=".6"/>`,
  // The chapter on a red banner, in spaced paper capitals between two stars.
  tag: (text, inset) => {
    const t = escape(text.toUpperCase())
    const x = inset + 4
    const y = inset + 4
    const w = text.length * 6.4 + 30
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="13" fill="${RED}"/>` +
        `<text x="${n(x + w / 2)}" y="${y + 9.5}" text-anchor="middle" font-family="${DIDONE}" font-size="7.5" font-weight="700" letter-spacing="1.5" fill="${HI}">★ ${t} ★</text>`,
      w: x + w + 4,
      h: y + 16,
    }
  },
  bubble: {
    font: SERIF,
    size: 9,
    charW: 5.1,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A ruled notice: paper in a heavy black rule and a fine red one, its pointer a black wedge.
      `<path fill="${INK}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${HI}" stroke="${INK}" stroke-width="1.4"/>` +
      `<rect x="${n(x + 2.2)}" y="${n(y + 2.2)}" width="${w - 4.4}" height="${h - 4.4}" fill="none" stroke="${RED}" stroke-width=".5"/>`,
  },
}

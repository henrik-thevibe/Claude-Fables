/**
 * Proportion Study, after the gallery's "Proportion Study: after Leonardo,
 * c. 1490" (henrik-styles.js, style 34, `sprop`), and the look's own source:
 * Leonardo's notebook sheets, the Vitruvian figure above all.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - A notebook sheet: warm, foxed paper and one iron-gall ink, brown-black.
 *   Every tone is a pale warm wash under left-handed hatching, the strokes
 *   running down from the top left as Leonardo's hand ran, crossed only in
 *   the deepest shadow. Light is the bare paper.
 * - Distance is sfumato: far things are a tone paler and their pen line
 *   thins away to nothing; near things are bounded by a firm contour.
 * - Fire and lamplight are drawn in red chalk, the sheet's one other color.
 * - The sky is the empty top of the page: a few level strokes toward the
 *   horizon, lines of mirror writing, and the construction of the study,
 *   a compass circle and its square, ruled faintly across it.
 * - Night is the same study on blue prepared paper: the ink darker, the
 *   lights heightened in white chalk, the stars white chalk dots.
 * - Claude is the figure under study: a red-chalk wash, his shaded faces
 *   hatched, a firm pen contour, and round him his own circle and square
 *   with their measuring ticks, the ghost of a second pose in his arms
 *   flung up, and a compass prick at his centre.
 * - The sheet: a ruled border ticked off in units, "Fig." and the chapter in
 *   an italic hand; the caption is a note on a slip of the same paper.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { lum, meanOf, mix, num as n, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif"
const INK = '#3e2616'
const PAPER = '#efe3c6'
const CARD = '#f5ecd6'
const RED = '#a8432a'
/** The blue prepared paper of a night sheet, its darker ink and its white chalk. */
const NPAPER = '#9fb0bd'
const NINK = '#1e2236'
const CHALK = '#f6f1e2'
/** The warm wash each step of tone lays under its hatching, by day and on the blue sheet. */
const WASH = '#b48a5c'
const NWASH = '#4a5a74'
const LEVELS = 5
const GAP = 2.2
/** Left-handed hatching: down from the top left. */
const SLANT = 45

/** Whether the scene being painted is a night one: its sky is painted first, and says so. */
let night = false

/** One step of tone: a wash, its hatching, and in the deepest steps a crossing set. */
function hatchSet(id: string, bg: string, ink: string, k: number): string {
  const w = n(0.22 + k * 0.13)
  let out =
    `<pattern id="${id}" width="8" height="${GAP}" patternUnits="userSpaceOnUse" patternTransform="rotate(${SLANT})">` +
    `<rect width="8" height="${GAP}" fill="${bg}"/><path d="M0 ${n(GAP / 2)}H8" stroke="${ink}" stroke-width="${w}"/></pattern>`
  if (k >= 3)
    out +=
      `<pattern id="${id}x" width="8" height="${n(GAP * 1.3)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${-SLANT + 10})">` +
      `<rect width="8" height="${n(GAP * 1.3)}" fill="url(#${id})"/><path d="M0 ${n(GAP * 0.6)}H8" stroke="${ink}" stroke-width="${n(0.2 + (k - 3) * 0.15)}"/></pattern>`
  return out
}

function hatches(): string {
  let out = ''
  for (let k = 1; k < LEVELS; k++) {
    out += hatchSet(`pr-d${k}`, mix(PAPER, WASH, k * 0.14), INK, k)
    out += hatchSet(`pr-n${k}`, mix(NPAPER, NWASH, k * 0.16), NINK, k)
  }
  // Claude's red-chalk wash, hatched on his shaded sides.
  out += hatchSet('pr-c1', '#e0b08c', INK, 1) + hatchSet('pr-c3', '#d39f7b', INK, 3)
  return out
}

/** The fill for a darkness `t` (0 paper, 1 the deepest): a step of wash and hatching. */
function tone(t: number): string {
  const k = Math.max(0, Math.min(LEVELS - 1, Math.floor(t * LEVELS)))
  if (k === 0) return night ? NPAPER : PAPER
  return `url(#pr-${night ? 'n' : 'd'}${k}${k >= 3 ? 'x' : ''})`
}

function darkness(color: string, family: Family, depth: number): number {
  let d = 1 - Math.min(1, Math.pow(lum(color), 0.8) * 1.1)
  // At night the scene's colors are all dark; the blue sheet carries the night, so they are read lighter.
  if (night) d = Math.max(0, d - 0.3)
  if (family === 'sky' || family === 'cloud' || family === 'air') d *= 0.5
  // Sfumato: the far distance a step paler.
  if (depth < 0.25) d -= 0.2
  return Math.max(0, d)
}

function ink(color: string, family: Family, depth: number, attr: string): string {
  const pen = night ? NINK : INK
  if (family === 'fire' || family === 'lamp') {
    if (attr === 'fill') return lum(color) > 0.55 ? '#f0c08a' : lum(color) > 0.3 ? 'url(#pr-red)' : RED
    return RED
  }
  if (family === 'stars' || family === 'life') return night ? CHALK : pen
  if (attr === 'stroke' || attr === 'color') return pen
  if (attr === 'stop-color') return lum(color) > 0.5 ? (night ? NPAPER : PAPER) : pen
  if (family === 'shadow') return `url(#pr-${night ? 'n' : 'd'}2)`
  // Lit slivers: bare paper by day, heightened in white chalk on the blue sheet.
  if (lum(color) > 0.8) return night ? CHALK : PAPER
  return tone(darkness(color, family, depth))
}

const UNLINED: readonly Family[] = ['sky', 'air', 'beam', 'glow', 'stars', 'life', 'lens', 'water', 'fire', 'lamp']

/** The empty top of the sheet: level strokes toward the horizon, mirror writing, the study's circle and square. */
function sheet(svg: string, c: Ctx): string {
  const g = c.gradient(svg)
  const stops = g?.stops ?? []
  night = lum(stops[0]?.color ?? '#80a0c0') < 0.2 && lum(stops[stops.length - 1]?.color ?? '#a0b0c0') < 0.45
  const sw = c.meta.sw ?? 640
  const pen = night ? NINK : INK
  let strokes = ''
  for (let y = 70; y < 112; y += 4.5) strokes += `M${n(((y * 37) % 60) + 4)} ${y}H${n(sw - ((y * 53) % 70) - 4)}`
  const notes = [
    'il granchio del terminale e delle sue misure',
    'tanto apre le braccia quanto è la sua altezza',
    'e vola senza ali · più veloce d’una saetta',
  ]
  let writing = ''
  for (let x = 30, i = 0; x < sw - 120; x += 330, i++)
    writing += notes
      .slice(0, 2)
      .map((t, j) => `<text transform="translate(${n(x + 200)} ${16 + j * 10}) scale(-1 1)" font-size="${8 - j}">${notes[(i + j) % 3] ?? t}</text>`)
      .join('')
  const cx = sw / 2
  return (
    `<rect width="${n(sw)}" height="128" fill="${night ? NPAPER : PAPER}"/>` +
    `<path d="${strokes}" stroke="${pen}" stroke-width=".3" stroke-opacity=".45"/>` +
    `<g font-family="${SERIF}" font-style="italic" fill="${pen}" fill-opacity=".55">${writing}</g>` +
    `<g fill="none" stroke="${pen}" stroke-opacity=".3" stroke-width=".5"><circle cx="${n(cx)}" cy="70" r="62"/><rect x="${n(cx - 52)}" y="24" width="104" height="104"/></g>`
  )
}

/** The sun as a compass study: a circle, its centre pricked, rays ruled out to a second ring. Or the moon, hatched to a crescent. */
function orb(c: Ctx, sun: boolean): string {
  if (c.meta.part === 'halo') return ''
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = (c.meta.r ?? 8) * 1.15
  const pen = night ? NINK : INK
  if (!sun)
    return (
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${CHALK}" stroke="${pen}" stroke-width=".6"/>` +
      `<path d="M${n(cx)} ${n(cy - r)}A${n(r)} ${n(r)} 0 0 0 ${n(cx)} ${n(cy + r)}A${n(r * 0.6)} ${n(r)} 0 0 1 ${n(cx)} ${n(cy - r)}z" fill="url(#pr-n2)"/>`
    )
  let d = ''
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    d += `M${n(cx + Math.cos(a) * (r + 2))} ${n(cy + Math.sin(a) * (r + 2))}L${n(cx + Math.cos(a) * (r + (i % 2 ? 4 : 7)))} ${n(cy + Math.sin(a) * (r + (i % 2 ? 4 : 7)))}`
  }
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="#f6dcae" stroke="${RED}" stroke-width=".7"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r + 9)}" fill="none" stroke="${pen}" stroke-width=".3" stroke-dasharray="1.5 1.5"/>` +
    `<path d="${d}" stroke="${RED}" stroke-width=".5"/><circle cx="${n(cx)}" cy="${n(cy)}" r=".7" fill="${pen}"/>`
  )
}

/** The Earth as a cosmographer's globe: a washed sphere ruled with its circles. */
function globe(c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 8
  const pen = night ? NINK : INK
  let d = ''
  for (const k of [-0.5, 0, 0.5]) d += `M${n(cx - r * Math.cos(k))} ${n(cy + r * Math.sin(k))}A${n(r * Math.cos(k))} ${n(r * 0.25)} 0 0 0 ${n(cx + r * Math.cos(k))} ${n(cy + r * Math.sin(k))}`
  for (const k of [0.35, 0.75]) d += `M${n(cx)} ${n(cy - r)}A${n(r * k)} ${n(r)} 0 0 0 ${n(cx)} ${n(cy + r)}A${n(r * k)} ${n(r)} 0 0 0 ${n(cx)} ${n(cy - r)}`
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#pr-${night ? 'n' : 'd'}1)" stroke="${pen}" stroke-width=".6"/><path d="${d}" fill="none" stroke="${pen}" stroke-width=".35"/>`
}

const scenery = () => {
  night = false
  return painter(
    {
      ink,
      url: (_id, family, attr, g) => {
        if (attr === 'stroke') return family === 'fire' || family === 'lamp' ? RED : night ? NINK : INK
        if (g && meanOf(g).opacity < 0.5) return 'none'
        return ink(g ? meanOf(g).color : '#808080', family, 0.5, 'fill')
      },
      // The pen contour, firm near and thinning away into the distance.
      line: (family, depth) =>
        UNLINED.includes(family) || depth < 0.2 ? '' : `stroke="${night ? NINK : INK}" stroke-width="${n(0.2 + depth * 0.55)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: 'hide',
      // A pool of lamplight: a red-chalk ring rubbed onto the floor.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="#e8a070" opacity=".25"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.7)}" ry="${n(e.ry * 0.7)}" fill="none" stroke="${RED}" stroke-width=".4" stroke-dasharray="2 2"/>`,
      redraw: {
        sky: sheet,
        lens: () => '',
        glow: () => '',
        water: (svg, c) => `<g opacity=".5">${c.repaint(svg)}</g>`,
        body: (_svg, c) => (c.role === 'space.earth' ? globe(c) : orb(c, c.role !== 'night.moon')),
        air: (svg, c) => `<g opacity=".35">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? CHALK : PAPER}"`)}</g>`,
        beam: (svg, c) => `<g opacity=".3">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? CHALK : '#f6dcae'}"`)}</g>`,
      },
    },
    'pr',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude as the figure under study: red-chalk wash, hatched shadows, pen contour, his circle and square round him. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  let faces = ''
  let fill = ''
  let d = ''
  for (const f of outlinedFaces(m)) {
    const c = f.light > 0.62 ? '#e7bc98' : f.light > 0.25 ? 'url(#pr-c1)' : 'url(#pr-c3x)'
    if (c !== fill && d) {
      faces += `<path fill="${fill}" d="${d}"/>`
      d = ''
    }
    fill = c
    d += poly(f.pts, cx, floor)
  }
  if (d) faces += `<path fill="${fill}" d="${d}"/>`
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${INK}" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor)}" r=".45" fill="${CARD}"/>`
        : `<path fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  // The study's construction round the figure: its bounds, a circle and a square, ticked in units.
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const p of m.parts) for (const [x, y] of p.hull) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
  }
  const body = m.parts.find(p => p.name === 'body')
  const mx = cx + (x0 + x1) / 2
  const my = floor + (y0 + y1) / 2
  const side = (y1 - y0) * 1.1
  const r = Math.max(x1 - x0, y1 - y0) * 0.68
  let ticks = ''
  for (let k = 1; k < 6; k++) {
    const t = (side * k) / 6
    ticks += `M${n(mx - side / 2 + t)} ${n(floor + y1)}v-1.6M${n(mx - side / 2)} ${n(floor + y1 - t)}h1.6`
  }
  // The ghost of a second pose: the arms flung up, in a faint line.
  let ghost = ''
  if (body) {
    const bx = body.hull.reduce((s, p) => s + p[0], 0) / body.hull.length
    for (const a of m.parts.filter(p => p.name === 'arm')) {
      const right = a.hull.reduce((s, p) => s + p[0], 0) / a.hull.length > bx
      const pivot = a.hull.reduce((q, p) => (Math.abs(p[0] - bx) < Math.abs(q[0] - bx) ? p : q))
      ghost += `<path transform="rotate(${right ? -30 : 30} ${t1(pivot[0] + cx)} ${t1(pivot[1] + floor)})" d="${poly(a.hull, cx, floor)}"/>`
    }
  }
  const pen = night ? NINK : INK
  return (
    `<g fill="none" stroke="${pen}" stroke-opacity=".55" stroke-width=".45">` +
    `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(r)}"/><rect x="${n(mx - side / 2)}" y="${n(floor + y1 - side)}" width="${n(side)}" height="${n(side)}"/>` +
    `<path d="${ticks}"/></g>` +
    `<g fill="none" stroke="${pen}" stroke-opacity=".4" stroke-width=".4" stroke-dasharray="2 1">${ghost}</g>` +
    `<path fill="url(#pr-d2)" opacity=".7" d="${poly(m.shadow, cx, floor)}"/>` +
    `<path fill="#e7bc98" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round" d="${hulls}"/>` +
    `<g stroke="${INK}" stroke-width=".45" stroke-linejoin="round">${faces}</g>` +
    eyes +
    `<circle cx="${n(mx)}" cy="${n(my)}" r=".7" fill="${pen}"/>`
  )
}

// ---------------------------------------------------------------- the sheet

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const PROPORTION: Look = {
  name: 'proportion',
  label: 'Proportion Study',
  voice: "a page of Leonardo's notebooks, measuring and wondering in the margins",
  cell: 'solid',
  figure: '3d',
  font: SERIF,
  charW: 5.1,
  caption: { fill: CARD, stroke: INK, ink: INK, radius: 1 },
  paper: { card: CARD, ink: INK, kinds: { code: '#5a3a1c', path: '#3a4a6a', fn: '#7a3a5a', num: RED, bad: '#9a2a1a', good: '#3a5a2a', face: RED } },
  inset: 6,
  titleColor: INK,
  art: {
    painter: scenery,
    hero,
    sky: PAPER,
    ground: '#d8c39c',
    defs: () =>
      hatches() +
      `<linearGradient id="pr-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8a070"/><stop offset="1" stop-color="${RED}"/></linearGradient>` +
      // Foxed paper: a fine grain and a few soft blots of age.
      `<filter id="pr-paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02 .03" numOctaves="3" seed="34"/>` +
      `<feColorMatrix values="0 0 0 0 .45  0 0 0 0 .3  0 0 0 0 .15  0 0 0 -2.2 1.25"/></filter>`,
  },
  texture: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#pr-paper)" opacity=".22"/>`,
  // A ruled border, ticked off in units along its foot and its left side.
  frame: (sw, h) => {
    let d = ''
    for (let x = 20; x < sw - 8; x += 20) d += `M${x} ${h - 5}v${x % 100 ? -2 : -4}`
    for (let y = 20; y < h - 8; y += 20) d += `M5 ${y}h${y % 100 ? 2 : 4}`
    return (
      `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" fill="none" stroke="${PAPER}" stroke-width="2.5"/>` +
      `<rect x="5" y="5" width="${sw - 10}" height="${h - 10}" fill="none" stroke="${INK}" stroke-width=".55"/>` +
      `<path d="${d}" stroke="${INK}" stroke-width=".45"/>`
    )
  },
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 4
    const w = text.length * 5.4 + 30
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="13" fill="${CARD}" fill-opacity=".9"/>` +
        `<text x="${x + 3}" y="${y + 9.5}" font-family="${SERIF}" font-style="italic" font-size="9" fill="${INK}"><tspan fill="${RED}">Fig.</tspan> ${escape(text)}</text>`,
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
      // A slip of notebook paper, its pen pointer drawn to the figure.
      `<path fill="${CARD}" stroke="${INK}" stroke-width=".6" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="1" fill="${CARD}" stroke="${INK}" stroke-width=".7"/>` +
      `<path d="M${n(x + 3)} ${n(y + h + 1.6)}H${n(x + w - 6)}" stroke="${INK}" stroke-width=".3" stroke-opacity=".6"/>`,
  },
}

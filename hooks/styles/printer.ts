/**
 * Line Printer, after the gallery's "Line Printer: ASCII art, 1970s"
 * (henrik-styles.js, style 44, `sprinter`), and the look's own sources: the
 * ASCII pin-ups and calendars a mainframe's chain printer hammered out on
 * greenbar listing paper at the end of the night shift.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Everything is typed. There is no line and no wash, only characters on a
 *   fixed grid, every column and row in register: a tone is a character,
 *   from a lone period for the lightest through : - = + * % # to a # struck
 *   over with an X for the darkest. Every shape is filled with its tone's
 *   character, the grid running on unbroken from shape to shape.
 * - One black ribbon, with the red half of a two-color ribbon kept for what
 *   burns or shines: fire, lava, lamps, and Claude himself.
 * - Water is typed in tildes, single where it is light and doubled where it
 *   is deep. Edges nearer than the far distance carry a dotted rule, as a
 *   printer's underline would; the far distance has none.
 * - The sky is typed denser toward its top and lighter to the horizon; night
 *   is the same sheet run with heavier characters, the stars left as blank
 *   paper among them. The sun and moon are a dotted ring round a field of periods.
 * - Claude is typed in red: each face in its own character by the way it
 *   turns to the light, the top lightest, a solid black rim round him and
 *   solid black eyes.
 * - The sheet: off-white listing paper with pale green bars every three
 *   lines, tractor-feed margins with their sprocket holes and perforations,
 *   a job header for the chapter, and the caption a torn-off slip in capitals.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { lum, meanOf, num as n, poly, step } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const MONO = "'Courier New', Courier, 'IBM Plex Mono', ui-monospace, Menlo, monospace"
const INK = '#26262a'
const RED = '#b8321e'
const PAPER = '#f6f7f0'
const BAR = '#3f9a4c'
/** One character cell of the printer's grid, in stage units. */
const CW = 3.2
const CH = 5

/**
 * The characters, lightest to darkest, as strokes in a cell CW by CH. The last
 * is a # struck over with an X, as an operator overprints for a solid black.
 */
const GLYPHS = [
  'M1.6 3.7h.05',
  'M1.6 2.1h.05M1.6 3.7h.05',
  'M.8 2.6H2.4',
  'M.8 2.1H2.4M.8 3.1H2.4',
  'M.8 2.6H2.4M1.6 1.7V3.5',
  'M1.6 1.5V3.7M.8 2L2.4 3.2M.8 3.2L2.4 2',
  'M.8 3.9L2.4 1.3M1 1.6h.05M2.2 3.6h.05',
  'M1.2 1.2L1 4M2.2 1.2L2 4M.6 2.1H2.6M.6 3.1H2.6',
  'M1.2 1.2L1 4M2.2 1.2L2 4M.6 2.1H2.6M.6 3.1H2.6M.6 1.2L2.6 4M2.6 1.2L.6 4',
]
const TILDE = 'M.7 2.9q.45-.8.9 0t.9 0'
const TILDES = 'M.7 2.2q.45-.8.9 0t.9 0M.7 3.6q.45-.8.9 0t.9 0'
const LEVELS = GLYPHS.length

/** A tone's character, by lightness: white is a period, black the overstrike. */
const level = (t: number, max = LEVELS - 1) => Math.max(0, Math.min(max, Math.round((1 - t * 0.85) * (LEVELS - 1))))

/** Plain tones for what cannot be a pattern: lines, gradient stops, currentColor. */
const GRAYS = [INK, '#4a4a4e', '#7a7a7c', '#a8a9a4', '#d4d5cc', PAPER]

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** The character a lit color is typed in, by its family: red for what burns, tildes for water. */
function typed(color: string, family: Family): string {
  // Night is run with a heavier hand: every character a step or two darker.
  const t = lum(color) * (night ? 0.7 : 1)
  switch (family) {
    case 'fire':
    case 'lamp':
      return `url(#lp-r${level(t, 6)})`
    case 'water':
      return t > 0.45 ? 'url(#lp-w1)' : 'url(#lp-w2)'
    case 'glass':
      return `url(#lp-k${level(Math.max(t, 0.55))})`
    case 'sky':
      return `url(#lp-k${level(t, 5)})`
    default:
      return `url(#lp-k${level(t)})`
  }
}

/** The sky in three bands, typed denser toward the top; night gets heavier characters, never solid black. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const mid = stops[Math.floor(stops.length / 2)]?.color ?? top
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  // Brighten by day so the sky reads as air, keep night under the overstrike so the stars show.
  const tone = (col: string) => `url(#lp-k${night ? Math.min(7, Math.max(5, level(lum(col)))) : Math.min(4, Math.max(1, level(lum(col))))})`
  return (
    `<rect width="${n(sw)}" height="40" fill="${tone(top)}"/>` +
    `<rect y="40" width="${n(sw)}" height="40" fill="${tone(mid)}"/>` +
    `<rect y="80" width="${n(sw)}" height="48" fill="${tone(low)}"/>`
  )
}

/** The sun or moon: a dotted ring round a field of periods. */
function orb(cx: number, cy: number, r: number): string {
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 1.05)}" fill="url(#lp-k0)" stroke="${night ? INK : RED}" stroke-width="${n(Math.max(0.8, r * 0.18))}" stroke-dasharray=".2 1.2" stroke-linecap="round"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 1.6)}" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width=".5" stroke-dasharray=".2 1.6" stroke-linecap="round"/>`
  )
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, _depth, attr) => {
        if (attr !== 'fill') return family === 'fire' || family === 'lamp' ? RED : step(GRAYS, lum(color))
        switch (family) {
          case 'stars':
            return PAPER
          case 'life':
            return RED
          case 'shadow':
            return 'url(#lp-k6)'
          default:
            return typed(color, family)
        }
      },
      // A gradient becomes one character in its overall tone; a faint wash is not typed. A radial falloff stays soft, in grays.
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient') return undefined
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return step(GRAYS, lum(mean.color))
        if (mean.opacity < 0.5) return 'none'
        return typed(mean.color, family)
      },
      // A dotted rule along nearer edges, as an underline is typed; air, light and the far distance have none.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'life' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'water' || depth < 0.25
          ? ''
          : `class="lp-l${family === 'fire' || family === 'lamp' ? 'r' : ''}${depth < 0.5 ? 1 : depth < 0.75 ? 2 : 3}"`,
      lineless: 0.6,
      faint: 'hide',
      // A faint rim or glaze is not typed at all: a printer strikes a character or it does not.
      post: svg => svg.replace(/<(path|rect|circle|ellipse|use)\b[^>]*?\sopacity="(0?\.[0-5]\d*)"[^>]*\/>/g, ''),
      // A lamp's pool of light: red periods on the floor.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="url(#lp-r1)" opacity=".75"/>`,
      redraw: {
        sky,
        lens: () => '',
        glow: () => '',
        body: (svg, c) => {
          if (c.role === 'space.earth') return c.repaint(svg)
          if (c.meta.part === 'halo') return ''
          return orb(c.meta.cx ?? 0, c.meta.cy ?? 0, c.meta.r ?? 8)
        },
        air: (svg, c) => `<g opacity=".45">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#lp-k1)"')}</g>`,
        beam: (svg, c) => `<g opacity=".5">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#lp-r0)"')}</g>`,
      },
    },
    'lp',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude typed in red: each face in its character by its light, a struck-over rim, solid eyes. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => {
      const base = f.name === 'top' ? 4 : 5
      const k = Math.min(LEVELS - 2, base + Math.round((1 - f.light) * 3))
      return `<path class="lp-f${k}" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path class="lp-e" d="${poly(e.poly, cx, floor)}"/>`
        : `<path fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path class="lp-s" d="${poly(m.shadow, cx, floor)}"/>` +
    // The rim: the hulls struck in black, a little wider than the faces over them.
    `<path class="lp-h" d="${hulls}"/>` +
    faces +
    eyes
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** One character as a tile of the grid, on the bare paper. */
const glyph = (id: string, d: string, ink: string, w = 0.42) =>
  `<pattern id="${id}" width="${CW}" height="${CH}" patternUnits="userSpaceOnUse"><rect width="${CW}" height="${CH}" fill="${PAPER}"/>` +
  `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"/></pattern>`

/** The definitions the whole sheet is typed with, laid down once under the stage. */
function defs(): string {
  let out = ''
  GLYPHS.forEach((d, i) => {
    out += glyph(`lp-k${i}`, d, INK, 0.34 + i * 0.05)
    out += glyph(`lp-r${i}`, d, RED, 0.55)
  })
  out += glyph('lp-w1', TILDE, INK, 0.5) + glyph('lp-w2', TILDES, INK, 0.5)
  // Greenbar: a pale green band three lines deep, then three lines bare.
  out += `<pattern id="lp-bar" width="8" height="${CH * 6}" patternUnits="userSpaceOnUse"><rect width="8" height="${CH * 3}" fill="${BAR}" fill-opacity=".16"/></pattern>`
  out += `<pattern id="lp-holes" width="7" height="10" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="5" r="1.6" fill="#2b2b2e"/></pattern>`
  // What every pose of Claude and every ruled edge repeats, said once as classes: the faces' characters,
  // the rim, the eyes, the shadow, and the dotted rules at three depths in black and in red.
  let css = ''
  for (let i = 0; i < LEVELS; i++) css += `.lp-f${i}{fill:url(#lp-r${i})}`
  css += `.lp-h{fill:${PAPER};stroke:${INK};stroke-width:1.8px;stroke-linejoin:round}.lp-e{fill:${INK};stroke:${INK};stroke-width:.4px}.lp-s{fill:url(#lp-k7)}`
  ;[1, 2, 3].forEach(d => {
    const rule = `stroke-opacity:${n(0.7 + d * 0.1)};stroke-width:${n(0.6 + d * 0.15)}px;stroke-dasharray:.1 1.1;stroke-linecap:round`
    css += `.lp-l${d}{stroke:${INK};${rule}}.lp-lr${d}{stroke:${RED};${rule}}`
  })
  return `${out}<style>${css}</style>`
}

/** A tractor-feed margin at x, 7 wide: listing paper, its sprocket holes, a perforated edge at `perf`. */
const margin = (x: number, perf: number, h: number) =>
  `<rect x="${n(x)}" y="0" width="7" height="${h}" fill="#ecede4"/>` +
  `<rect x="${n(x)}" y="0" width="7" height="${h}" fill="url(#lp-holes)"/>` +
  `<path d="M${n(perf)} 0V${h}" stroke="#000" stroke-opacity=".3" stroke-width=".4" stroke-dasharray=".8 1.2"/>`

export const PRINTER: Look = {
  name: 'printer',
  label: 'Line Printer',
  voice: 'a 1970s mainframe listing, terse capitals hammered out by a chain printer at the end of the night shift',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: 5.4,
  caption: { fill: PAPER, stroke: INK, ink: INK, radius: 0 },
  paper: { card: PAPER, ink: INK, kinds: { code: '#1d6b34', path: '#1d4f8a', fn: '#6a2a8a', num: '#a8440f', bad: '#b3191e', good: '#1f7a3a', face: RED } },
  inset: 8,
  titleColor: INK,
  art: {
    painter: scenery,
    hero,
    sky: PAPER,
    ground: '#d3e8d0',
    defs,
  },
  // The greenbar over the whole sheet.
  texture: (sw, h) => `<rect width="${n(sw)}" height="${h}" fill="url(#lp-bar)"/>`,
  // The tractor-feed margins either side.
  frame: (sw, h) => margin(0, 7, h) + margin(sw - 7, sw - 7, h),
  // The chapter as the job header, in capitals across the top of the sheet.
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 8
    const t = escape(`*** ${text.toUpperCase()} ***`)
    const w = t.length * 4.2
    return {
      svg:
        `<rect x="${n(x - 2)}" y="${n(y - 6.5)}" width="${n(w + 4)}" height="9" fill="${PAPER}" fill-opacity=".9"/>` +
        `<text x="${n(x)}" y="${n(y)}" font-family="${MONO}" font-size="7" font-weight="700" fill="${INK}">${t}</text>`,
      w: x + w + 4,
      h: y + 4,
    }
  },
  bubble: {
    font: MONO,
    size: 8.5,
    charW: 5.15,
    line: 11,
    base: 12,
    upper: true,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A torn-off slip of listing: a green bar along its top, perforations top and bottom, a dotted tail.
      `<path fill="${PAPER}" stroke="${INK}" stroke-width=".7" stroke-dasharray="1.2 .8" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${PAPER}" stroke="${INK}" stroke-width="1"/>` +
      `<rect x="${n(x + 0.5)}" y="${n(y + 0.5)}" width="${w - 1}" height="3" fill="${BAR}" fill-opacity=".22"/>` +
      `<path d="M${n(x + 2)} ${n(y + 2)}H${n(x + w - 2)}M${n(x + 2)} ${n(y + h - 2)}H${n(x + w - 2)}" stroke="${INK}" stroke-opacity=".35" stroke-width=".4" stroke-dasharray=".6 1"/>`,
  },
}

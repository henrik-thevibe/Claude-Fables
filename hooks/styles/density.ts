/**
 * Density Portrait, after the gallery's "Density Portrait: an ASCII density
 * portrait made of synthetic handles" (henrik-styles.js, style 24, `edensity`).
 *
 * The art bible, translated from the gallery's terminal to the Fables' worlds:
 *
 * - The medium is a terminal screen of type: a near-black field set with a
 *   fixed grid of monospace cells, every cell holding one character of a
 *   stream of synthetic handles (`7F3A-21 B90C-64 …`), the stream scrolling
 *   one cell at a time. Nothing is drawn but type: a picture is only how
 *   brightly each character of the stream glows, its density.
 * - Every element is painted in that one phosphor, white-green on black, at the
 *   density its lit tone and its nearness give it, and the whole stage is then
 *   averaged into the cells, so each character glows evenly and every edge
 *   steps on the grid. Between the characters the screen is all but black,
 *   only a faint afterglow of the picture.
 * - The sky is the faintest field, the gallery's barely-there handles,
 *   thickening a little toward a dawn or a sunset horizon. The sun and the
 *   moon are discs of the brightest type with a halo of thinning type round
 *   them; the Earth is a disc of type, its lit side the denser. Stars
 *   are lone characters lit full on the dark field, a twinkle as a character
 *   flickers.
 * - Clouds, mist, beams and glows are thin type, a few rows of handles lit
 *   at low density. Land, rock, foliage, grass and ground are set denser the
 *   nearer they stand, so the far ranks sink back into the field and the front
 *   stands out of it, every crest picked out a little denser still, as a
 *   draughtsman in characters marks an edge. Buildings are blocks of type;
 *   screens and glass glow denser than the walls they are set in, water a
 *   little denser than what it mirrors.
 * - Fire, lava, embers, lamps and lit windows are the screen's one other
 *   phosphor, amber, the hot cells of the readout, as on an amber terminal;
 *   a lamp's pool is a patch of amber type on the ground.
 * - Night is the same screen sparser: the field near empty, the land in dim
 *   type lifted just enough to read, the stars and the moon the brightest
 *   cells. The lab, lit by its own screens, keeps its walls low, so its
 *   screens and lamp glow.
 * - Claude is the gallery's portrait: his faces in the brightest type, each
 *   face as dense as it is lit, his eyes two holes of dark cells where the
 *   stream shows nothing, and a margin of empty cells round him, so he stands
 *   clear of any field, as the gallery's portrait does.
 * - The screen is framed as a terminal pane with a status line, "drawn in
 *   synthetic handles"; the chapter is a prompt with a blinking cursor; the
 *   caption a dark readout boxed in phosphor rule, its words set in
 *   phosphor colors.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { lum, mix, num as n, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const MONO = "'SF Mono', Menlo, ui-monospace, Consolas, 'DejaVu Sans Mono', monospace"
/** The screen's black, and its phosphors: the gallery's white-green, and amber for what burns. */
const BG = '#05070a'
const PH = '#d9ffe6'
const AMBER = '#ffbe5c'
/** One character cell, in stage units: the gallery's cell, 1.25 times as tall as wide. */
const CW = 2.8
const CH = 3.5
/** The stream's tile: so many cells wide and rows high, repeating over the stage. */
const COLS = 75
const ROWS = 16
/** Cells the stream scrolls in a second. */
const RATE = 6

/** A density, 0 to 1, as the phosphor glowing that brightly on the black screen; quantized so tones are shared. */
const ph = (a: number, hot = false) => mix(BG, hot ? AMBER : PH, Math.round(Math.max(0, Math.min(1, a)) * 32) / 32)

/**
 * How far the scene's tones are lifted or lowered: a night sky lifts them, the
 * lab (a room lit by its own screens) lowers its walls so its screens and lamps
 * stand out. The sky and lab.wall are always the first roles painted, so this
 * is set before any role that reads it.
 */
let lift = 1

/** How densely an element of a family is set, from its lit tone and how near it stands. */
function density(color: string, family: Family, depth: number): number {
  // The lit scenes are dim, and night dimmer still: a readout stretches its tones over the whole ramp.
  // What gives its own light keeps its tone.
  const own = family === 'fire' || family === 'lamp' || family === 'glass' || family === 'body' || family === 'stars'
  const t = Math.max(0, Math.min(1, (lum(color) * (own ? 1 : lift) - 0.05) / 0.5))
  switch (family) {
    case 'sky':
      return 0.03 + 0.14 * t
    case 'stars':
    case 'life':
      return 0.85 + 0.15 * t
    case 'body':
      return 0.9
    case 'cloud':
      return 0.07 + 0.22 * t
    case 'air':
    case 'beam':
    case 'glow':
      return 0.25 + 0.4 * t
    case 'fire':
      return 0.5 + 0.5 * t
    case 'lamp':
      return 0.75 + 0.25 * t
    case 'glass':
      return 0.2 + 0.6 * t
    case 'water':
      return 0.14 + 0.45 * t
    case 'shadow':
      return 0.02
    default:
      // Nearer is denser: the far ranks sink into the field, the front stands out of it.
      return Math.min(0.32, 0.05 + 0.14 * depth + 0.32 * t)
  }
}
const hotFamily = (family: Family) => family === 'fire' || family === 'lamp'

/** Snaps a point to its cell, and sets the whole cell: a star is one character lit full. */
function cellAt(x: number, y: number): string {
  const i = Math.floor(x / CW)
  const j = Math.floor(y / CH)
  return `M${t1(i * CW)} ${t1(j * CH)}h${CW}v${CH}h-${CW}z`
}

/** Stars as lone characters: every one-unit star square becomes its whole cell, its twinkle kept. */
function stars(svg: string, c: Ctx): string {
  return c.repaint(svg).replace(/\sd="([^"]*)"/g, (_all, d: string) => {
    const cells = new Set<string>()
    for (const m of d.matchAll(/M([\d.-]+) ([\d.-]+)/g)) cells.add(cellAt(Number(m[1]), Number(m[2])))
    return ` d="${[...cells].join('')}"`
  })
}

/** The sun or the moon: a disc of the densest type, its halo of type thinning outward. */
function orb(cx: number, cy: number, r: number, hot: boolean): string {
  const rr = Math.max(r, 5)
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rr * 3)}" fill="url(#dp-halo)"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rr * 1.15)}" fill="${hot ? ph(0.95, true) : ph(1)}"/>`
  )
}

const scenery = () => {
  lift = 1
  return painter(
    {
      ink: (color, family, depth) => ph(density(color, family, depth), hotFamily(family)),
      // Type has no line, but a near crest is set a little denser, as a draughtsman in characters picks out an edge;
      // the far ranks, sunk into the field, are left unmarked.
      line: (family, depth) =>
        depth >= 0.3 && (family === 'land' || family === 'rock' || family === 'foliage' || family === 'built' || family === 'bark')
          ? `stroke="${ph(0.3 + 0.4 * depth)}" stroke-width=".7" stroke-linejoin="round"`
          : '',
      // A wash too faint to set a character in is left out.
      opacity: (_f, v) => (v < 0.06 ? 0 : v),
      lineless: 0.6,
      faint: 'unlined',
      // A lamp's pool is a patch of amber type on the ground, densest at its heart.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${ph(0.35, true)}" opacity=".7"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="${ph(0.7, true)}"/>`,
      redraw: {
        lens: () => '',
        // The sky decides the night: a dark zenith over a dark horizon.
        sky: (svg, c) => {
          const stops = c.gradient(svg)?.stops ?? []
          const top = stops[0]?.color ?? '#3060a0'
          const low = stops[stops.length - 1]?.color ?? '#80a0c0'
          lift = lum(top) < 0.2 && lum(low) < 0.45 ? 1.9 : 1
          return c.repaint(svg)
        },
        stars,
        'lab.wall': (svg, c) => {
          lift = 0.6
          return c.repaint(svg)
        },
        body: (svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return c.repaint(svg)
          if (c.meta.part === 'halo') return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 6)}" fill="url(#dp-halo)" opacity=".7"/>`
          return orb(cx, cy, r, c.role !== 'night.moon')
        },
      },
    },
    'dp',
  )
}

// ---------------------------------------------------------------- Claude

/**
 * Claude in type: each face as dense as it is lit, his eyes holes of dark
 * cells. A margin of empty cells keeps him clear of whatever stands behind,
 * as the gallery's portrait stands clear of its field: the pose's faces are
 * used once more under themselves, stroked wide in the screen's black.
 */
/** Counts outlines across every stage, so no two poses in one document share an id. */
let outlines = 0
const hero = (): HeroPainter => {
  return (m: Model, cx: number, floor: number) => {
    const id = `dp-c${++outlines}`
    // Faces of one density share a path, in draw order.
    const runs: { fill: string; d: string }[] = []
    for (const f of outlinedFaces(m)) {
      const fill = ph(0.84 + 0.16 * f.light * (f.part === 'leg' ? 0.8 : 1))
      const last = runs[runs.length - 1]
      if (last && last.fill === fill) last.d += poly(f.pts, cx, floor)
      else runs.push({ fill, d: poly(f.pts, cx, floor) })
    }
    const eyes = m.eyes
      .map(e => (e.poly ? `<path stroke-width="2.8" d="${poly(e.poly, cx, floor)}"/>` : `<path fill="none" stroke-width="2.4" d="${poly(e.line ?? [], cx, floor, false)}"/>`))
      .join('')
    return (
      `<path fill="${BG}" opacity=".8" d="${poly(m.shadow, cx, floor)}"/>` +
      `<use href="#${id}" stroke="${BG}" stroke-width="9" stroke-linejoin="round"/>` +
      `<g id="${id}">${runs.map(r => `<path fill="${r.fill}" d="${r.d}"/>`).join('')}</g>` +
      `<g fill="${BG}" stroke="${BG}" stroke-linejoin="round" stroke-linecap="round">${eyes}</g>`
    )
  }
}

// ---------------------------------------------------------------- the screen

/** A small seeded sequence, so the same stage always streams the same handles. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** The gallery's synthetic handles: four hex digits, a dash, two decimals. */
function handles(count: number, rand: () => number): string {
  const hex = '0123456789ABCDEF'
  let out = ''
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 4; k++) out += hex[Math.floor(rand() * 16)]
    out += `-${Math.floor(rand() * 90 + 10)} `
  }
  return out
}

/**
 * The stream: a tile of handles, a row of text to each row of cells, each row
 * spaced to exactly its cells. As a mask it cuts the screen's black away
 * wherever a character stands, so the stage glows through the type alone. It
 * scrolls one cell at a time.
 */
function stream(): string {
  // The size is chosen for the cap height, not the em: the stream is all capitals
  // and digits, and a 4.2 monospace has caps about 3.05 high, so they fill most of
  // the 3.5 cell. The baseline at .84 of the cell sets them flush to its top with a
  // strip of black below, the row's gap. Each glyph's advance (.6 em, 2.52) is short
  // of the cell, so textLength spreads the row to the cell pitch, and the .17 inset
  // (about half the spare width plus the glyph's side bearing) centres each
  // character in its cell.
  const rand = seeded(24)
  const text = handles(Math.ceil((COLS * ROWS) / 8) + 1, rand)
  const tw = n(COLS * CW)
  let rows = ''
  for (let j = 0; j < ROWS; j++) {
    const row = text.slice(j * COLS, (j + 1) * COLS)
    rows += `<text x="${n(CW * 0.17)}" y="${n(j * CH + CH * 0.84)}" textLength="${tw}" lengthAdjust="spacing">${row}</text>`
  }
  const steps = Array.from({ length: COLS }, (_, k) => `${n(-k * CW)} 0`).join(';')
  return (
    `<pattern id="dp-type" width="${tw}" height="${n(ROWS * CH)}" patternUnits="userSpaceOnUse">` +
    `<g font-family="${MONO}" font-size="4.2" font-weight="700" fill="#000" xml:space="preserve">${rows}</g>` +
    `<animateTransform attributeName="patternTransform" type="translate" values="${steps}" calcMode="discrete" dur="${n(COLS / RATE)}s" repeatCount="indefinite"/></pattern>`
  )
}

/**
 * The cells: the stage averaged over each character's cell (a density) and
 * that average spread evenly over the cell, so every character glows as one.
 */
function cells(): string {
  const dot = 0.4
  return (
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${n(CW * 0.32)} ${n(CH * 0.32)}" result="dp-avg"/>` +
    `<feFlood x="${n((CW - dot) / 2)}" y="${n((CH - dot) / 2)}" width="${dot}" height="${dot}" flood-color="black"/>` +
    `<feComposite x="0" y="0" width="${CW}" height="${CH}"/><feTile result="dp-grid"/>` +
    `<feComposite in="dp-avg" in2="dp-grid" operator="in"/><feMorphology operator="dilate" radius="${n((CW - dot) / 2)} ${n((CH - dot) / 2)}"/>`
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const DENSITY: Look = {
  name: 'density',
  label: 'Density Portrait',
  voice: 'a terminal readout set in streaming hex handles, terse as a log line',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: 5.7,
  caption: { fill: BG, stroke: PH, ink: PH, radius: 0 },
  paper: { card: '#0a0f0e', ink: PH, kinds: { code: '#7dffb4', path: '#8fd8ff', fn: '#d4b0ff', num: '#ffc96b', bad: '#ff7f6e', good: '#9dff7a', face: '#ffb08a' } },
  inset: 3,
  titleColor: PH,
  edge: BG,
  // The medium: the whole stage, Claude and all, averaged into character cells.
  grade: () => cells(),
  art: {
    painter: scenery,
    hero,
    sky: ph(0.08),
    ground: ph(0.2),
    defs: () =>
      `<radialGradient id="dp-halo"><stop offset="0" stop-color="${PH}" stop-opacity=".55"/><stop offset=".45" stop-color="${PH}" stop-opacity=".18"/><stop offset="1" stop-color="${PH}" stop-opacity="0"/></radialGradient>`,
  },
  // The screen's black over everything but the characters of the stream, so the picture is seen through its type.
  texture: (sw, h) =>
    `<defs>${stream()}<mask id="dp-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="${sw}" height="${h}"><rect width="${sw}" height="${h}" fill="#fff"/><rect width="${sw}" height="${h}" fill="url(#dp-type)"/></mask></defs>` +
    `<rect width="${sw}" height="${h}" fill="${BG}" opacity=".92" mask="url(#dp-cut)"/>`,
  // A terminal pane: a rule of phosphor, and a status line naming what it is drawn in.
  frame: (sw, h) =>
    `<rect x="1.2" y="1.2" width="${n(sw - 2.4)}" height="${n(h - 2.4)}" fill="none" stroke="${PH}" stroke-opacity=".4" stroke-width=".7"/>` +
    `<text x="${n(sw - 6)}" y="${h - 4}" text-anchor="end" font-family="${MONO}" font-size="5" fill="${PH}" fill-opacity=".7">drawn in synthetic handles</text>`,
  // The chapter as a prompt on the screen, its cursor blinking after it.
  tag: (text, inset) => {
    const t = `> ${text}`
    const x = inset + 4
    const y = inset + 4
    const w = t.length * 4.8 + 12
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="12" fill="${BG}" fill-opacity=".9" stroke="${PH}" stroke-opacity=".6" stroke-width=".7"/>` +
        `<text x="${x + 4}" y="${y + 8.6}" font-family="${MONO}" font-size="8" font-weight="700" fill="${PH}">${escape(t)}</text>` +
        `<rect x="${n(x + 4.6 + t.length * 4.82)}" y="${y + 2.6}" width="4" height="7" fill="${PH}"><animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1.1s" repeatCount="indefinite"/></rect>`,
      w: x + w + 4,
      h: y + 16,
    }
  },
  bubble: {
    font: MONO,
    size: 8.4,
    charW: 5.1,
    line: 11,
    base: 12,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A dark readout boxed in phosphor rule, its tail a pointer of rule to Claude.
      `<path fill="${BG}" stroke="${PH}" stroke-width=".8" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#0a0f0e" fill-opacity=".96" stroke="${PH}" stroke-width=".8"/>` +
      `<rect x="${n(x + 1.8)}" y="${n(y + 1.8)}" width="${w - 3.6}" height="${h - 3.6}" fill="none" stroke="${PH}" stroke-opacity=".3" stroke-width=".4"/>`,
  },
}

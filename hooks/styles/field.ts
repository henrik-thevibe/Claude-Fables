/**
 * Density Field, after the gallery's "Density Field: after ertdfgcvb's
 * play.core" (henrik-styles.js, style 25, `efield`), and the look's own
 * source: Andreas Gysin's play.core, where a picture is a grid of monospace
 * characters and every cell's brightness picks its glyph from a ramp.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - The medium is a terminal: a near-black screen ruled into one grid of
 *   character cells, each cell twice as tall as it is wide. Every cell holds
 *   one glyph of the ramp ` .:-=+*#`, picked by how bright the cell is, in
 *   the cell's own color: the dim cells barely there, the bright ones dense
 *   and pale. Nothing is drawn between the cells, and nothing is smaller
 *   than a cell; a thin thing shows only where it crosses a cell's heart.
 * - The palette is the plate's: steel blue-greys for the field, a phosphor
 *   white-green for Claude and for anything that shines, the plate's teal
 *   for lamps. Each world keeps a tint of its own in the same dim inks: sea
 *   green for leaves and grass, sand for the desert and the earth, amber
 *   for fire, teal for glass and water.
 * - The sky is the sparse field: rows of `.` and `:`, thickening a step
 *   toward the horizon as its light grows. Clouds, mist and beams of light
 *   are swells of density in it, `:` and `-` where they are thickest. A slow
 *   swell moves through the whole field, as in the plate, two soft bands
 *   sliding apart, so the glyphs breathe a step up and down the ramp.
 * - The sun, the moon and the Earth are the plate's bright blob, where the
 *   field is pushed into brightness: a core of `#` ringed by `*`, `+`, `=`
 *   and `-`, fading into the sky. Stars are single cells of `+` and `*`
 *   that twinkle down the ramp.
 * - Land and rock, foliage and grass, buildings and ground are blocks of
 *   denser glyphs, a step denser for every step nearer: far ridges in `:`
 *   and `-`, the middle distance in `-`, the front in `=`, a step up or down
 *   for their own light, and never past `=`. The ground underfoot is a step
 *   sparser than what stands on it, and leaves a step sparser than rock, so
 *   each thing parts from the next. A room's wall is its sky, as sparse, and
 *   its floor and bench a step sparser than the land outdoors. `+` and denser
 *   are kept for what shines and for Claude: glass and water are teal, fire
 *   and lava amber, up to `+`; lamps and lit windows single bright cells, a
 *   lamp's pool a swell of teal on the ground with a `+` heart.
 * - Night is the same field with less light in it: the sky falls to `.`,
 *   the land to `-` and `=`, and what shines stands out the more.
 * - Claude is the plate's: drawn in the ramp in phosphor, the two densest
 *   steps of it, `#` on his lit front and top, `*` on the faces turned from
 *   the light and on his legs, in a green-white no other thing is drawn in.
 *   Nothing on the land about him is as dense or as bright, so he is the
 *   brightest block on the screen. His eyes are darkness, empty cells, and a
 *   ring of empty cells keeps him clear of the field.
 * - The medium is laid by the grade: the stage is sampled at the heart of
 *   every cell, the sample's lightness picks a step of the ramp, and that
 *   step's glyph is set in the cell's own color, the dim steps dimmer still,
 *   as a phosphor screen shows them. Every element is painted only in the
 *   color whose lightness is its step; the grade does the drawing.
 * - "Hi" packets, the plate's signature, drift in from the left a cell at a
 *   time and fade as they go, set on the glyphs' own dot grid at full
 *   phosphor, two cells wide. The screen has a thin rule for a frame; the
 *   chapter is a shell prompt with a blinking block cursor; the caption is a
 *   box drawn in characters, `+`, `-` and `|`, its tail a run of slashes.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedOrder } from '../clawd3d'
import { isGreen, isWarm, lum, mix, num as n, poly } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const MONO = "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace"
/** The screen behind the glyphs. */
const BG = '#07090d'
/** The plate's phosphor white-green, and its teal for lamps. */
const PHOSPHOR = '#d9ffe6'
const LAMP = '#2fd4c8'
/**
 * Claude's tint: the phosphor pushed greener before it is scaled down to his
 * steps, so the three short hex digits keep green above red and blue and the
 * grade brightens him to the plate's pale phosphor, not to grey.
 */
const SKIN_HUE = '#9fffc0'
/** The monospace advance, in ems: every width of text here is its size times this. */
const ADV = 0.6
/** One character cell, in stage units: twice as tall as wide, 4 by 8 pixels on the default band. */
const CW = 8 / 3
const CH = 16 / 3
/** How a cell's lightness becomes its density: the ramp is climbed by lightness times this. */
const GAIN = 2.5

/** The tints each kind of thing is drawn in, at full strength; the ramp dims them for its sparser glyphs. */
const HUE = {
  steel: '#7fa6cc',
  dusk: '#a49ad8',
  green: '#62d69a',
  sand: '#e6b06e',
  fire: '#ffaa55',
  warm: '#ffd88a',
  teal: '#6fd8d8',
  lamp: LAMP,
  phosphor: PHOSPHOR,
} as const

/**
 * The color a cell must be painted to sit at `level` of the ramp (0 blank,
 * 7 `#`) in a tint: the tint scaled to the lightness the grade reads as that
 * level, written short, in three hex digits, on the same step of the ramp.
 * Fractional levels round to the nearest step.
 */
function ink(hue: string, level: number): string {
  const k = Math.max(0, Math.min(7, level))
  const step = Math.round(k)
  const target = (k + 0.5) / 8 / GAIN
  const full = mix('#000000', hue, Math.min(1, target / Math.max(0.05, lum(hue))))
  const c = [1, 3, 5].map(i => parseInt(full.slice(i, i + 2), 16) / 17)
  let best = ''
  let miss = Infinity
  for (let m = 0; m < 8; m++) {
    const q = c.map((v, i) => Math.max(0, Math.min(15, (m >> i) & 1 ? Math.ceil(v) : Math.floor(v))))
    const x = ((0.299 * (q[0] ?? 0) + 0.587 * (q[1] ?? 0) + 0.114 * (q[2] ?? 0)) / 15) * GAIN * 8
    const at = Math.min(7, Math.floor(x))
    // On the step, and near its middle: the grade reads a cell's heart as the brightest of the
    // pixels it straddles, so an ink at the top of its step tips into the next one on an edge.
    const d = q.reduce((sum, v, i) => sum + (v - (c[i] ?? 0)) ** 2, 0) + (at === step ? 0 : 100) + (step < 7 ? 6 * (x - step - 0.5) ** 2 : 0)
    if (d < miss) {
      miss = d
      best = `#${q.map(v => v.toString(16)).join('')}`
    }
  }
  return best
}

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false
/** Whether it is a room, with a wall for its sky. */
let room = false

/** The tint a lit color takes in a family. */
function tint(color: string, family: Family): string {
  switch (family) {
    case 'fire':
      return HUE.fire
    case 'lamp':
      return isWarm(color) ? HUE.warm : HUE.lamp
    case 'stars':
    case 'life':
      return isWarm(color) ? HUE.warm : HUE.phosphor
    case 'body':
      return isWarm(color) && !night ? HUE.warm : HUE.phosphor
    case 'glass':
    case 'water':
      return HUE.teal
    case 'foliage':
    case 'grass':
      return HUE.green
    case 'sky':
    case 'cloud':
      return isWarm(color) ? HUE.dusk : HUE.steel
    default:
      return isGreen(color) ? HUE.green : isWarm(color) ? HUE.sand : HUE.steel
  }
}

/**
 * The densest the scenery gets: `=`. Everything from `+` up is kept for Claude
 * and for what truly shines (the sun and moon, stars, lamps, fire).
 */
const CEIL = 4.4

/**
 * The level of the ramp a lit color reaches in a family at a depth: the sky
 * sparse, `.` and `:`; the land a step denser for every step nearer, from
 * `-` on the far ridges to `*` in front, a step up or down for its own light;
 * what shines densest.
 */
function level(color: string, family: Family, depth: number): number {
  const t = lum(color)
  switch (family) {
    case 'sky':
      return night ? 0.5 + t * 1.6 : 1 + t * 1.4
    case 'stars':
      return 5 + t * 2
    case 'body':
      return 7
    case 'lamp':
      return 5.5 + t * 2
    // Fire and lava shine, but as fields of it: `+` at most, a step under Claude.
    case 'fire':
      return Math.min(5.4, 3.6 + t * 3)
    // Fireflies and sparks are single cells; only the lit ones reach `+`.
    case 'life':
      return Math.min(t > 0.6 ? 5.4 : CEIL, 3 + t * 2.5)
    case 'glow':
      return Math.min(CEIL, 2.5 + t * 3.5)
    case 'cloud':
      return 2 + t * 1.8
    case 'air':
    case 'beam':
      return 2 + t * 2
    case 'shadow':
      return 0.5
    case 'glass':
    case 'water':
      // A room's floor shines back a step sparser, so Claude stands clear of it.
      return Math.min(CEIL, 3 + t * 3) - (room && depth > 0.6 ? 1 : 0)
    default: {
      // A wall a room stands in is its sky: as sparse.
      if (family === 'built' && depth <= 0.2 && room) return 1.2 + t * 2
      // The ground underfoot a step sparser than what stands on it, so they part;
      // in a room the floor and the bench a step sparser again, so his outline parts from them.
      const indoors = room ? (family === 'ground' ? 1.2 : family === 'built' && depth >= 0.4 ? 0.6 : 0) : 0
      const d = 2.7 + depth * 2.8 + (t - 0.3) * 2.5 - (night ? 0.4 : 0) - (family === 'ground' ? 0.6 : family === 'foliage' ? 0.3 : 0) - indoors
      return Math.max(room ? 2 : 2.4, Math.min(CEIL, d))
    }
  }
}

const paint = (color: string, family: Family, depth: number) => ink(tint(color, family), level(color, family, depth))

/** The cell a point falls in, as the corner of that cell. */
const snapX = (x: number) => Math.floor(x / CW) * CW
const snapY = (y: number) => Math.floor(y / CH) * CH

/** The sky: the lit sky repainted in the field's inks, read first to tell night from day. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  night = lum(top) < 0.2 && lum(low) < 0.45
  room = false
  return c.repaint(svg) + swell(c.meta.sw ?? 640)
}

/** Stars as cells: every star a whole cell, so the grid always catches it, twinkling as it did. */
function stars(svg: string, c: Ctx): string {
  return c
    .repaint(svg)
    .replace(/<(path|rect|circle)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [number, number][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+)[ ,]([\d.-]+)/g)].map(m => [Number(m[1]), Number(m[2])])
          : tag === 'circle'
            ? [[Number(/\scx="([^"]*)"/.exec(attrs)?.[1] ?? 0), Number(/\scy="([^"]*)"/.exec(attrs)?.[1] ?? 0)]]
            : [[Number(/\sx="([^"]*)"/.exec(attrs)?.[1] ?? 0), Number(/\sy="([^"]*)"/.exec(attrs)?.[1] ?? 0)]]
      const kept = attrs.replace(/\s(d|x|y|cx|cy|r|width|height|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      // A starfield holds many stars in the same cell: each cell is laid once.
      const seen = new Set<string>()
      const cells = pts
        .map(([x, y]) => [snapX(x), snapY(y)] as const)
        .filter(([x, y]) => {
          const key = `${x}|${y}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .map(([x, y]) => `<use href="#dn-c" x="${n(x)}" y="${n(y)}"/>`)
        .join('')
      return `<g${kept}>${cells}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect|circle)>/g, '</g>')
}

/** The sun, the moon, the Earth: the plate's bright blob, a dense core fading out through the ramp into the sky. */
function body(_svg: string, c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 8
  const at = `cx="${n(cx)}" cy="${n(cy)}"`
  if (c.meta.part === 'halo') return `<circle ${at} r="${n(r * 4)}" fill="url(#dn-blob)" opacity=".5"/>`
  const earth = c.role === 'space.earth'
  const warm = c.role === 'desert.sun' || (c.role === 'forest.sun' && !night)
  const core = earth ? ink(HUE.teal, 6) : warm ? ink(HUE.warm, 7.2) : ink(HUE.phosphor, 7.2)
  return (
    `<circle ${at} r="${n(r * 2.6)}" fill="url(#${earth ? 'dn-blobt' : warm ? 'dn-blobw' : 'dn-blob'})"/>` +
    `<circle ${at} r="${n(Math.max(r, CH * 0.8))}" fill="${core}"/>` +
    // The Earth shows its land as a darker swell across its face.
    (earth ? `<ellipse cx="${n(cx - r * 0.25)}" cy="${n(cy + r * 0.1)}" rx="${n(r * 0.5)}" ry="${n(r * 0.35)}" fill="${ink(HUE.green, 4)}"/>` : '')
  )
}

/** Things too small for a cell (motes, fireflies, sparks, leaves) are drawn a cell wide, so the grid catches them. */
const fatten = (svg: string) => `<g stroke-width="${n(CW * 0.9)}">${svg.replace(/\sfill="(#[0-9a-fA-F]{3,6})"/g, (_all, c: string) => ` fill="${c}" stroke="${c}"`)}</g>`

/**
 * The slow swell of the plate: two soft bands of brighter field crossing the
 * sky and sliding apart, so its glyphs climb a step of the ramp and fall back.
 * It lies in the sky, behind everything, so it never dims Claude.
 */
function swell(sw: number): string {
  const band = (id: string, dx: number, dur: number) =>
    `<rect x="-160" width="${n(sw + 320)}" height="128" fill="url(#${id})"><animateTransform attributeName="transform" type="translate" values="0 0;${dx} 0" dur="${dur}s" repeatCount="indefinite"/></rect>`
  return band(night ? 'dn-swn' : 'dn-swa', 120, 9) + band('dn-swb', -140, 13)
}

const scenery = () => {
  night = false
  room = true
  return painter(
    {
      ink: (color, family, depth) => paint(color, family, depth),
      // A wash keeps its own shape and opacity: in the field it is a swell of density.
      opacity: (_family, v) => v,
      // No lines: in a character field an edge is only where the density changes.
      line: () => '',
      // A pool of lamplight is a swell of the lamp's teal on the ground.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${ink(HUE.lamp, 3)}" opacity=".7"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="${ink(HUE.lamp, 5)}"/>`,
      post: (svg, family) => (family === 'life' ? fatten(svg) : svg),
      redraw: {
        sky,
        stars,
        body,
        lens: () => '',
      },
    },
    'dn',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude's steps of the ramp in phosphor, `*` and `#`: nothing in the field is as dense, nor as bright. */
const [TURNED, LIT] = [6, 7].map(k => ink(SKIN_HUE, k)) as [string, string]
/** How much light a face must catch to be `#`: his front and top do, his sides and legs do not. */
const LIT_FROM = 0.5

/** Claude in the ramp: phosphor faces, a step of the ramp each by its light, eyes and a ring of empty cells. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.filter(pt => pt.name !== 'leg').map(pt => poly(pt.hull, cx, floor)).join('')
  // The faces of one box never overlap, so a part's faces at one step of the ramp share a path,
  // and a step running on from one part into the next keeps the same path.
  const runs: [string, string][] = []
  for (const part of outlinedOrder(m)) {
    const steps = new Map<string, string>()
    for (const f of part.faces) {
      // As the plate has it: his lit front and top `#`, the faces turned from the light and his legs `*`.
      const fill = f.part !== 'leg' && f.light >= LIT_FROM ? LIT : TURNED
      steps.set(fill, (steps.get(fill) ?? '') + poly(f.pts, cx, floor))
    }
    for (const [fill, d] of steps) {
      const last = runs[runs.length - 1]
      if (last && last[0] === fill) last[1] += d
      else runs.push([fill, d])
    }
  }
  const pills = m.eyes.map(e => (e.poly ? poly(e.poly, cx, floor) : '')).join('')
  const arcs = m.eyes.map(e => (e.poly ? '' : poly(e.line ?? [], cx, floor, false))).join('')
  return (
    // The ring of empty cells that keeps him clear of the field.
    `<path stroke="#000" stroke-width="4.4" stroke-linejoin="round" d="${hulls}"/>` +
    runs.map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`).join('') +
    // His eyes are darkness: empty cells.
    (pills ? `<path stroke="#000" stroke-width="1.8" d="${pills}"/>` : '') +
    (arcs ? `<path fill="none" stroke="#000" stroke-width="2.6" d="${arcs}"/>` : '')
  )
}

// ---------------------------------------------------------------- the medium

/**
 * The glyphs of the ramp, each on a 3 by 5 dot grid in its cell (column,
 * row), as a small monospace face sets them at this size.
 */
const GLYPHS: Record<number, readonly (readonly [number, number])[]> = {
  1: [[1, 6]], // .
  2: [[1, 4], [1, 6]], // :
  3: [[0, 4], [1, 4], [2, 4]], // -
  4: [[0, 3], [1, 3], [2, 3], [0, 5], [1, 5], [2, 5]], // =
  5: [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [0, 4], [2, 4]], // +
  6: [[0, 3], [2, 3], [0, 4], [1, 4], [2, 4], [0, 5], [2, 5], [1, 2], [1, 6]], // *
  7: [[0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [1, 3], [1, 5]], // #
}
/** How hard a threshold bites: a step of the ramp is 1/8, so 24 turns it into a full step. */
const K = 24
/**
 * The phosphor's glow on the glyphs: every ink is painted at the lightness of
 * its step (a `#` at 0.375 at most), so the glyphs are lifted by this much
 * and bent by this curve, a `#` to near white while a `.` stays a dim ember.
 */
const GLOW = 3.6
const GLOW_CURVE = 1.3

/** The grid's numbers in full: a cell a hair off its size drifts across the band and smears the glyphs. */
const p = (v: number) => (Math.round(v * 1e4) / 1e4).toString()

/**
 * The glyph tiles, built in the filter from floods. Every dot of the cell is
 * ink for some steps of the ramp; those steps fall in at most two runs, so
 * two tiles hold them: each dot of a tile carries a run as its lower
 * threshold (red) and its upper one (green). A dot that is never ink is pure
 * red, the tile's ground. A column's dots of one run share one flood.
 */
function tiles(): string {
  const runsOf = (c: number, r: number) => {
    const on = [1, 2, 3, 4, 5, 6, 7].filter(k => GLYPHS[k]?.some(([x, y]) => x === c && y === r))
    const runs: [number, number][] = []
    for (const k of on) {
      const last = runs[runs.length - 1]
      if (last && last[1] === k - 1) last[1] = k
      else runs.push([k, k])
    }
    return runs
  }
  const hex = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')
  const color = ([a, b]: [number, number]) => `#${hex((a - 0.5) / 8 + 1 / K)}${hex(1 - (b + 0.5) / 8 + 1 / K)}00`
  const dw = CW / 4
  const dh = CH / 8
  const cell = `x="0" y="0" width="${p(CW)}" height="${p(CH)}"`
  let out = ''
  for (let i = 0; i < 2; i++) {
    const floods: string[] = []
    for (let c = 0; c < 3; c++) {
      let open: { key: string; r0: number; r1: number } | undefined
      const shut = () => {
        if (open) floods.push(`<feFlood flood-color="${open.key}" x="${p(c * dw)}" y="${p(open.r0 * dh)}" width="${p(dw)}" height="${p((open.r1 - open.r0 + 1) * dh)}" result="d${floods.length}"/>`)
        open = undefined
      }
      for (let r = 2; r <= 6; r++) {
        const run = runsOf(c, r)[i]
        const key = run ? color(run) : ''
        if (open && open.key === key) open.r1 = r
        else {
          shut()
          if (key) open = { key, r0: r, r1: r }
        }
      }
      shut()
    }
    out +=
      `<feFlood flood-color="#f00" ${cell} result="b"/>${floods.join('')}` +
      `<feMerge ${cell}><feMergeNode in="b"/>${floods.map((_f, k) => `<feMergeNode in="d${k}"/>`).join('')}</feMerge><feTile result="t${i}"/>`
  }
  return out
}

/**
 * The medium: the stage sampled at the heart of every character cell, the
 * cell's lightness read as a step of the ramp, and the step's glyph set in
 * the cell's own color, brightened as a phosphor screen shows it: the dense
 * steps bright, the sparse ones dim, so the field stays behind Claude.
 */
function grade(): string {
  const dot = 0.4
  const table = Array.from({ length: 8 }, (_, i) => n(i / 8)).join(' ')
  const spread = (result = '') => `<feMorphology operator="dilate" radius="${p((CW - dot) / 2)} ${p((CH - dot) / 2)}"${result && ` result="${result}"`}/>`
  const mask = (i: number) =>
    `<feComposite in="v" in2="t${i}" operator="arithmetic" k2="${K}" k3="${-K}" k4="1"/>` +
    `<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 -1" result="m${i}"/>`
  return (
    // The cells: one sample at the heart of each, spread over the cell.
    `<feFlood x="${p((CW - dot) / 2)}" y="${p((CH - dot) / 2)}" width="${dot}" height="${dot}" flood-color="black"/>` +
    `<feComposite x="0" y="0" width="${p(CW)}" height="${p(CH)}"/><feTile result="g"/>` +
    `<feComposite in="SourceGraphic" in2="g" operator="in"/>${spread('cell')}` +
    // Each cell's step of the ramp (red), and its complement (green). The lightness is read before
    // the sample is spread: a heart on an edge then takes the lighter of the two colors it
    // straddles, never a brighter mix of their channels a step too dense.
    `<feColorMatrix in="SourceGraphic" values="${p(0.299 * GAIN)} ${p(0.587 * GAIN)} ${p(0.114 * GAIN)} 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>` +
    `<feComposite in2="g" operator="in"/>${spread()}` +
    `<feColorMatrix values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1"/>` +
    `<feComponentTransfer><feFuncR type="discrete" tableValues="${table}"/></feComponentTransfer>` +
    `<feColorMatrix values="1 0 0 0 0 -1 0 0 0 1 0 0 0 0 0 0 0 0 0 1" result="v"/>` +
    // The glyphs: each tile's dots inked where the cell's step falls in their run.
    tiles() + mask(0) + mask(1) +
    `<feMerge result="m"><feMergeNode in="m0"/><feMergeNode in="m1"/></feMerge>` +
    // The glyphs in the cell's color, brightened on a curve: the sparse steps stay dim.
    `<feComponentTransfer in="cell">${['R', 'G', 'B'].map(c => `<feFunc${c} type="gamma" amplitude="${GLOW}" exponent="${GLOW_CURVE}"/>`).join('')}</feComponentTransfer>` +
    `<feComposite in2="m" operator="in"/>`
  )
}

/** A small seeded sequence, so the same stage always drifts the same. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * A packet: "Hi" set in two cells on the grade's own dot grid, at full
 * phosphor, on a blank so the field does not show through.
 */
function hi(): string {
  const dw = CW / 4
  const dh = CH / 8
  // Each stroke as (column, first row, rows): H in the first cell, i in the second.
  const strokes: [number, number, number][] = [[0, 2, 5], [2, 2, 5], [1, 4, 1], [5, 2, 1], [5, 4, 3]]
  const d = strokes.map(([c, r, h]) => `M${p(c * dw)} ${p(r * dh)}h${p(dw)}v${p(h * dh)}h${p(-dw)}z`).join('')
  return `<g id="dn-hi"><rect width="${p(CW * 2)}" height="${p(CH)}" fill="${BG}"/><path fill="${PHOSPHOR}" d="${d}"/></g>`
}

/** "Hi" packets drifting in from the left a cell at a time, each fading as it goes. */
function packets(sw: number): string {
  const rand = seeded(Math.round(sw) + 25)
  let out = ''
  const count = Math.max(2, Math.min(5, Math.round(sw / 180)))
  for (let i = 0; i < count; i++) {
    const row = 3 + Math.floor(rand() * 12)
    const y = row * CH
    const cells = 14 + Math.floor(rand() * 18)
    const x0 = Math.floor((rand() * sw * 0.6) / CW)
    const dur = cells * (0.2 + rand() * 0.15)
    const steps = Array.from({ length: cells }, (_, k) => `${p((x0 + k) * CW)} ${p(y)}`).join(';')
    out +=
      `<g opacity="0"><use href="#dn-hi"/>` +
      `<animateTransform attributeName="transform" type="translate" calcMode="discrete" values="${steps}" dur="${n(dur)}s" begin="${n(-rand() * dur)}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.55;.95;1" dur="${n(dur)}s" begin="${n(-rand() * dur)}s" repeatCount="indefinite"/></g>`
  }
  return out
}

/** The chapter tag's type, its advance, and its prompt and cursor (with the gap before it) in characters. */
const TAG_SIZE = 8.5
const TAG_ADV = TAG_SIZE * ADV
const PROMPT = 2
const CURSOR = 1.4
/** The caption's type. */
const BUBBLE_SIZE = 9

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(): string {
  const blob = (id: string, hue: string) =>
    `<radialGradient id="${id}"><stop offset="0" stop-color="${ink(hue, 7)}"/><stop offset=".35" stop-color="${ink(hue, 5)}"/><stop offset=".7" stop-color="${ink(hue, 3)}" stop-opacity=".7"/><stop offset="1" stop-color="${ink(hue, 2)}" stop-opacity="0"/></radialGradient>`
  const band = (id: string, x2: number, y2: number, color: string, a: number) =>
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${x2}" y2="${y2}" spreadMethod="repeat"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="${color}" stop-opacity="${a}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>`
  return (
    `<rect id="dn-c" width="${n(CW)}" height="${n(CH)}"/>` +
    hi() +
    blob('dn-blob', HUE.phosphor) +
    blob('dn-blobw', HUE.warm) +
    blob('dn-blobt', HUE.teal) +
    band('dn-swa', 120, 48, ink(HUE.steel, 3), 0.8) +
    band('dn-swn', 120, 48, ink(HUE.steel, 2.2), 0.8) +
    band('dn-swb', 70, -140, ink(HUE.steel, 2.6), 0.5) +
    // The caption's box drawn in characters: a run of dashes along its top and bottom, bars down its sides.
    `<pattern id="dn-dash" width="${n(CW * 1.9)}" height="4" patternUnits="userSpaceOnUse"><rect y="1.4" width="${n(CW * 1.4)}" height="1.1" fill="${PHOSPHOR}"/></pattern>` +
    `<pattern id="dn-bar" width="4" height="${n(CH * 0.9)}" patternUnits="userSpaceOnUse"><rect x="1.45" y=".6" width="1.1" height="${n(CH * 0.65)}" fill="${PHOSPHOR}"/></pattern>`
  )
}

export const FIELD: Look = {
  name: 'field',
  label: 'Density Field',
  voice: 'a generative ASCII density field on a terminal, terse as a shell',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: BUBBLE_SIZE * ADV,
  caption: { fill: BG, stroke: '#3a4f5f', ink: PHOSPHOR, radius: 0 },
  paper: { card: '#0b0f14', ink: PHOSPHOR, kinds: { code: LAMP, path: '#8fc0ff', fn: '#c8a8ff', num: '#ffc66d', bad: '#ff7a6b', good: '#7dff9a', face: '#ffb08a' } },
  inset: 3,
  titleColor: PHOSPHOR,
  edge: BG,
  grade,
  art: {
    painter: scenery,
    hero,
    sky: ink(HUE.steel, 1.2),
    ground: ink(HUE.steel, 2.6),
    defs,
  },
  texture: sw => packets(sw),
  // A thin rule round the screen.
  frame: (sw, h) => `<rect x=".75" y=".75" width="${n(sw - 1.5)}" height="${n(h - 1.5)}" fill="none" stroke="#273846" stroke-width="1.5"/>`,
  // The chapter as a shell prompt, with a blinking block cursor.
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 3
    const t = text.toLowerCase()
    // The prompt's `$ `, then the text, a gap and the cursor, in character advances.
    const w = (t.length + PROMPT + CURSOR) * TAG_ADV + 6
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="13" fill="${BG}" stroke="#273846" stroke-width=".8"/>` +
        `<text x="${x + 4}" y="${y + 9.4}" font-family="${MONO}" font-size="${TAG_SIZE}" font-weight="700" fill="${PHOSPHOR}"><tspan fill="${LAMP}">$ </tspan>${escape(t)}</text>` +
        `<rect x="${n(x + 4 + (t.length + PROMPT + 0.2) * TAG_ADV)}" y="${y + 3}" width="4" height="7.5" fill="${PHOSPHOR}">` +
        `<animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1.1s" repeatCount="indefinite"/></rect>`,
      w: x + w + 4,
      h: y + 17,
    }
  },
  bubble: {
    font: MONO,
    size: BUBBLE_SIZE,
    charW: BUBBLE_SIZE * ADV,
    line: 12,
    base: 14,
    draw: ({ x, y, w, h }, { base, tip }) => {
      // The tail as a run of slashes from the box to Claude.
      const mx = (base[0][0] + base[1][0]) / 2
      const my = (base[0][1] + base[1][1]) / 2
      const slash = (tip[0] - mx) * (tip[1] - my) > 0 ? '\\' : '/'
      let tail = ''
      for (let i = 1; i <= 3; i++) {
        const k = i / 3
        tail += `<text x="${n(mx + (tip[0] - mx) * k)}" y="${n(my + (tip[1] - my) * k + 3)}">${slash}</text>`
      }
      const corner = (cx: number, cy: number) => `<text x="${n(cx)}" y="${n(cy + 3)}">+</text>`
      return (
        `<g font-family="${MONO}" font-size="${BUBBLE_SIZE}" font-weight="700" fill="${PHOSPHOR}" text-anchor="middle">${tail}</g>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#0b0f14"/>` +
        `<rect x="${n(x + 3)}" y="${n(y - 2)}" width="${n(w - 6)}" height="4" fill="url(#dn-dash)"/>` +
        `<rect x="${n(x + 3)}" y="${n(y + h - 2)}" width="${n(w - 6)}" height="4" fill="url(#dn-dash)"/>` +
        `<rect x="${n(x - 2)}" y="${n(y + 3)}" width="4" height="${n(h - 6)}" fill="url(#dn-bar)"/>` +
        `<rect x="${n(x + w - 2)}" y="${n(y + 3)}" width="4" height="${n(h - 6)}" fill="url(#dn-bar)"/>` +
        `<g font-family="${MONO}" font-size="${BUBBLE_SIZE}" font-weight="700" fill="${PHOSPHOR}" text-anchor="middle">${corner(x, y)}${corner(x + w, y)}${corner(x, y + h)}${corner(x + w, y + h)}</g>`
      )
    },
  },
}

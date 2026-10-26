/**
 * Blob Mosaic, after the gallery's "Blob Mosaic: tile mosaic, one ground per
 * chapter" (henrik-styles.js, style 22, `eblob`): tile-mosaic blobs with
 * glyph eyes on one flat chapter ground.
 *
 * The art bible, translated from the gallery's square to the Fables' worlds:
 *
 * - The medium is a mosaic of square tiles on one grid, each tile one flat
 *   color with a grout edge of its own color at two-thirds, laid on a single flat
 *   ground. Nothing is shaded, nothing blends: a tile is there or it is not,
 *   and everything steps by whole tiles, the way the gallery's crowd bobs.
 * - Every figure that stands up off the ground casts the plate's black
 *   stepped shadow, one tile down and one to the left, so each shape reads
 *   as a cut-out laid on the ground.
 * - The sky is the chapter's one ground: a single flat, saturated field, a
 *   different one per chapter (the plate's own mint green for the forest,
 *   cobalt for the city, sunflower for the desert; deep violet, plum, teal
 *   and indigo for space, the volcano, the lab and the village by night).
 *   No gradient, no haze, no light falls on it.
 * - The sun, the moon and the Earth are blobs of the crowd: discs of tiles
 *   with glyph eyes that keep an eye on Claude. The moon dozes ('-'), the
 *   sun and the Earth look on ('o').
 * - Stars are single white tiles, dim ones half-laid; they twinkle tile by tile.
 * - Clouds are pale grey tile blobs; at night lilac ones.
 * - Land, rock, foliage, grass, bark and buildings are laid in flat vivid
 *   tiles, each lit color taken to the nearest of the mosaic's paints: its
 *   hue kept, its saturation raised, its lightness stepped. Neutral tones
 *   are the plate's greys, from the black tile to the white one. Far things
 *   lie flat, without shadow; near things stand up with theirs.
 * - The ground under the figures is tiled too, flat and shadowless.
 * - Glass and screens are cyan tiles; water and reflections are not laid.
 * - Fire and lava are red, orange, yellow and pale-yellow tiles; lamps and
 *   lit windows yellow tiles; a lamp's pool a half-laid yellow patch.
 * - Air, mist and beams are not laid, but mist is a row of half-laid white
 *   tiles (by day only the far row, thinly). Glows and lens light are not laid at all.
 * - Life and particles are single tiles that hop from tile to tile; the
 *   plate's crowd stands in the front corners of every chapter: round tile
 *   blobs in random vivid colors, each with two glyph eyes ('o', '*', '+',
 *   '.', '0'), bobbing up a whole tile now and then, watching the middle.
 * - Night is the same mosaic on a dark chapter ground: the tiles stay vivid
 *   and the shadows stay black.
 * - Claude is the plate's: his coral in tiles, the top in its light coral,
 *   the sides in the dark one, the legs in theirs, the stepped black shadow
 *   behind him, and his eyes real mono glyphs set over the mosaic: 'o' open,
 *   '0' wide, '^' happy, '-' closed, '@' dizzy.
 * - The frame is a plain black key round the picture; the chapter tag is
 *   spelled one letter to a tile, each tile a different color of the crowd,
 *   with its stepped shadow; the caption sits on a panel of white tiles with
 *   a stepped shadow, its tail a staircase of tiles down to Claude.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { dropBlooms, hue, lum, meanOf, num as n, poly, rgb, stripLight, t1 } from '../art/ink'
import { type Ctx, painter } from '../art/painter'
import { type Family, type Meta, type Painter, type Role, ROLES } from '../art/roles'
import { cells } from '../grade'
import type { Look } from '../looks'

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
/** One tile, in stage units: Claude stands about fourteen tiles tall, as in the plate. */
const T = 2.8
/**
 * The grout at each edge of a tile, so the line between two tiles is 2G wide:
 * 0.7 units, just over one device pixel at the Fables' 960-wide scale (1.5 px
 * a unit). Laid hard at half cover, it comes out one pixel wide and never misses a tile.
 */
const G = 0.35
/** The stage's height (svg.ts H): the sky and the crowd's footing are measured from it. */
const STAGE_H = 128
const BLACK = '#000'
/** The plate's Claude. */
const PAL = { body: '#d97757', top: '#eba083', side: '#b65f42', leg: '#c76a4c', legDark: '#a4553b', eye: '#171614' }
/** The plate's neutral tiles, dark to light. */
const GREYS = ['#262626', '#4a4a4a', '#767676', '#a4a4a4', '#cfcfcf', '#dfdfdf']
const FIRE = ['#d81f2a', '#ff5a1a', '#ffa81a', '#ffe14a', '#fff6b0']
const GLASS = ['#163f8a', '#1f78d8', '#3ec0ff', '#a8ecff']

/** Each chapter's one flat ground, and whether it lies in the dark. */
const CHAPTERS: Record<string, { ground: string; dark: boolean }> = {
  forest: { ground: '#1dec80', dark: false },
  city: { ground: '#2f6bff', dark: false },
  desert: { ground: '#ffc928', dark: false },
  space: { ground: '#2c1f6e', dark: true },
  volcano: { ground: '#4e1446', dark: true },
  lab: { ground: '#0f5a5e', dark: true },
  night: { ground: '#1b2f86', dark: true },
}
/** The chapter being painted: the painter is handed its roles in order, each named after its scene. */
let chapter = CHAPTERS.forest!

// ---------------------------------------------------------------- color

function hsl(color: string): [number, number, number] {
  const [r, g, b] = (rgb(color) ?? [128, 128, 128]).map(v => v / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return [hue(color).h, s, l]
}
function hex(h: number, s: number, l: number): string {
  const k = (m: number) => (m + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (m: number) => l - a * Math.max(-1, Math.min(k(m) - 3, 9 - k(m), 1))
  return `#${[f(0), f(8), f(4)].map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('')}`
}
const pick = (ramp: readonly string[], t: number) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))] ?? ramp[0]!
const hueGap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180)

// How bright a lit color is laid, as a place on a ramp (0 the darkest paint, 1 the lightest).
/** By night plants stop at the second lightness step (of six), so the dark ground stays night. */
const NIGHT_PLANT = 0.3
/** By night land, rock, bark and the floor stop at the third step: a little lighter than the plants, so the path reads. */
const NIGHT_LAND = 0.4
/** By day the floor under the figures stops at the fourth step, so Claude and the crowd stand out on it. */
const DAY_GROUND = 0.62
/** The night scenes are lit very dimly; this gain and lift spread their few dark tones over the ramp. */
const NIGHT_GAIN = 1.35
const NIGHT_LIFT = 0.08
/** The day scenes are lit a little dim; a gentler gain and lift take them up to the mosaic's lightest paints. */
const DAY_GAIN = 1.15
const DAY_LIFT = 0.04

/** The lightness steps a tile is laid in. */
const STEPS = [0.2, 0.32, 0.44, 0.56, 0.68, 0.8]

/** A lit color as the mosaic's nearest paint, in an element of the given family. */
function paint(color: string, family: Family, depth: number): string {
  // The lit scenes are dim, and dimmer at night; a mosaic lays its whole range.
  const raw = lum(color)
  // By night the land stays below the middle tones, so the dark ground reads as night and the lit things stand out.
  const low = family === 'ground' || family === 'land' || family === 'foliage' || family === 'grass' || family === 'rock' || family === 'bark' || family === 'mark'
  const plant = family === 'land' || family === 'foliage' || family === 'grass'
  const ceiling = chapter.dark && low ? (plant ? NIGHT_PLANT : NIGHT_LAND) : family === 'ground' ? DAY_GROUND : 1
  const t = Math.min(ceiling, chapter.dark ? raw * NIGHT_GAIN + NIGHT_LIFT : raw * DAY_GAIN + DAY_LIFT)
  switch (family) {
    case 'fire':
      return pick(FIRE, t * 1.2)
    case 'lamp':
      return t > 0.55 ? FIRE[4]! : FIRE[3]!
    case 'glass':
    case 'water':
      return pick(GLASS, t)
    case 'stars':
      return '#f2f2f2'
    case 'cloud':
      return chapter.dark ? pick(['#4a3f8a', '#7a6ec0', '#a89ee0'], t) : pick(['#a4a4a4', '#cfcfcf', '#dfdfdf', '#f2f2f2'], t)
    case 'shadow':
      return GREYS[0]!
  }
  let [h, s] = hsl(color)
  // Plants are laid in greens, however blue the dawn or the night made them.
  if (family === 'foliage' || family === 'grass') {
    s = Math.max(s, 0.45)
    if (h < 70 || h > 165) h = h > 165 && h < 260 ? 150 : 95
  }
  // Bark is laid in browns, however blue the dusk or the night made it: trunks read as trees.
  if (family === 'bark') {
    s = Math.max(s, 0.3)
    if (h < 15 || h > 40) h = 28
  }
  if (s < 0.14) return pick(GREYS, t)
  let l = STEPS[Math.max(0, Math.min(STEPS.length - 1, Math.floor(t * STEPS.length)))]!
  // A tile near the ground's hue keeps its distance in lightness, so the figure stays off the ground.
  const [gh, , gl] = hsl(chapter.ground)
  if (hueGap(h, gh) < 35 && Math.abs(l - gl) < 0.2) l = l > gl ? Math.min(0.85, gl + 0.22) : Math.max(0.14, gl - 0.24)
  // Far things are a little paler, as tiles of a lighter batch.
  if (depth < 0.2 && !chapter.dark) l = Math.min(0.82, l + 0.06)
  return hex(Math.round(h / 12) * 12, Math.min(0.9, 0.62 + s * 0.3), l)
}

// ---------------------------------------------------------------- tiles

/** Elements laid as flat tiles; `s` adds the plate's black stepped shadow. */
const TILED = 'filter="url(#bm-t)"'
const STOOD = 'filter="url(#bm-s)"'

/**
 * Wraps the balanced stretches of an element in a group: an element may open
 * a group a later one closes (a room the floor mirrors, a skyline), and those
 * tags stay where they are, outside every wrapper.
 */
function wrapBalanced(svg: string, attrs: string): string {
  const cuts: [number, number][] = []
  const open: [number, number][] = []
  for (const m of svg.matchAll(/<(\/?)g\b[^>]*?(\/?)>/g)) {
    const at: [number, number] = [m.index ?? 0, (m.index ?? 0) + m[0].length]
    if (m[2]) continue
    if (!m[1]) open.push(at)
    else if (!open.pop()) cuts.push(at)
  }
  cuts.push(...open)
  cuts.sort((a, b) => a[0] - b[0])
  let out = ''
  let i = 0
  const wrap = (s: string) => (s.replace(/<defs>[\s\S]*?<\/defs>/g, '').trim() ? `<g ${attrs}>${s}</g>` : s)
  for (const [a, b] of cuts) {
    out += wrap(svg.slice(i, a)) + svg.slice(a, b)
    i = b
  }
  return out + wrap(svg.slice(i))
}

/** How an element of a family is set: tiles standing with their shadow, tiles lying flat, or not tiled. */
function setting(family: Family, depth: number): string {
  switch (family) {
    case 'sky':
    case 'lens':
    case 'beam':
    case 'glow':
    case 'water':
    case 'stars':
    case 'body':
      return ''
    case 'air':
    case 'ground':
    case 'mark':
    case 'shadow':
    case 'life':
    case 'lamp':
      return TILED
    default:
      return depth < 0.15 ? TILED : STOOD
  }
}

/** A small seeded sequence, so a stage always lays the same crowd. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// ---------------------------------------------------------------- glyphs

/** The eye glyphs, each centred on its own 0 0: the baseline sits below the glyph's middle by `dy` ems. */
const GLYPHS: Record<string, [string, number]> = { o: ['o', 0.28], O: ['0', 0.36], h: ['^', 0.62], c: ['-', 0.3], d: ['@', 0.33], s: ['*', 0.5], p: ['+', 0.33], t: ['.', 0.08] }
/** Claude's eye glyphs and the crowd's, in two sizes. */
const BIG = 10
const SMALL = 5.6
/** Claude's glyphs (and the sun's and the moon's) at the large size, the crowd's at the small. */
const USED: [string, number][] = [...['o', 'O', 'h', 'c', 'd'].map(k => [k, BIG] as [string, number]), ...['o', 'O', 's', 'p', 't'].map(k => [`${k}s`, SMALL] as [string, number])]
const GLYPH_FONT = 'ui-monospace, Menlo, Consolas, monospace'
const glyphDefs = () =>
  USED.map(([id, size]) => {
    const [ch, dy] = GLYPHS[id[0]!]!
    return `<text id="bm-g${id}" y="${n(size * dy)}" font-family="${GLYPH_FONT}" font-size="${size}" font-weight="800" text-anchor="middle" stroke-width="${n(size * 0.05)}">${escape(ch)}</text>`
  }).join('')
const eye = (k: string, x: number, y: number) => `<use href="#bm-g${k}" x="${t1(x)}" y="${t1(y)}"/>`

/** The ink of a glyph on a tile: black on a light one, white on a dark one, as the plate sets them. */
const glyphInk = (color: string) => (lum(color) > 0.47 ? BLACK : '#fff')

/** A blob: a disc of tiles with its shadow, two glyph eyes looking toward `look`. */
function blob(cx: number, cy: number, r: number, color: string, k: string, look: number, extra = '', lift = 0.08): string {
  const b = blobParts(cx, cy, r, color, k, look, '', lift)
  return `<g ${STOOD}>${b.body.replace('/>', `/>${extra}`)}</g>${b.eyes}`
}

/** A blob's disc and its eyes apart, each carrying `motion`, so a crowd can lay all its discs in one setting. */
function blobParts(cx: number, cy: number, r: number, color: string, k: string, look: number, motion: string, lift = 0.08) {
  const ink = glyphInk(color)
  const dx = Math.max(-1, Math.min(1, look)) * r * 0.12
  const disc = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${color}"`
  return {
    body: motion ? `${disc}>${motion}</circle>` : `${disc}/>`,
    eyes: `<g fill="${ink}" stroke="${ink}">${eye(k, cx - r * 0.42 + dx, cy - r * lift)}${eye(k, cx + r * 0.42 + dx, cy - r * lift)}${motion}</g>`,
  }
}

/** A vivid tile color for one of the crowd, steering clear of the chapter's ground and of Claude's coral. */
function crowdColor(r: () => number): string {
  const v = r()
  if (v < 0.12) return '#dfdfdf'
  if (v < 0.2) return '#262626'
  let h = r() * 360
  const gh = hsl(chapter.ground)[0]
  for (const a of [gh, 15]) if (hueGap(h, a) < 40) h = (h + 120) % 360
  return hex(h, 0.62 + r() * 0.3, 0.48 + r() * 0.16)
}

/** The plate's crowd, in the front corners: blobs that bob a whole tile now and then and watch the middle. */
function crowd(sw: number): string {
  const r = seeded(Math.round(sw) * 7 + Math.round(hsl(chapter.ground)[0]))
  // The plate's spots, in tiles from the near corner and from the bottom edge.
  const spots: [number, number, number, boolean][] = [
    [5, 4.5, 3.4, false],
    [12.5, 2.2, 2.4, false],
    [4, 12, 2, false],
    [5.5, 4, 3.6, true],
    [13.5, 1.8, 2.2, true],
    [3.5, 11.5, 2.2, true],
  ]
  const eyes = ['o', 's', 'p', 't', 'o', 'O']
  let bodies = ''
  let faces = ''
  spots.forEach(([x, y, rr, right], i) => {
    const color = crowdColor(r)
    const bob = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -${T};0 0" keyTimes="0;.1;.4" calcMode="discrete" dur="3s" begin="${n(-r() * 3)}s" repeatCount="indefinite"/>`
    const b = blobParts(right ? sw - x * T : x * T, STAGE_H - y * T, rr * T, color, `${eyes[i]}s`, right ? -1 : 1, bob)
    bodies += b.body
    faces += b.eyes
  })
  return `<g ${STOOD}>${bodies}</g>${faces}`
}

// ---------------------------------------------------------------- the scenery

/** The sky: the chapter's one flat ground. */
const sky = (c: Ctx) => {
  const sw = c.meta.sw ?? 640
  return `<rect x="-${T}" y="-${T}" width="${n(sw + 2 * T)}" height="${n(STAGE_H + 2 * T)}" fill="${chapter.ground}"/>`
}

/** The sun, the moon and the Earth as blobs of the crowd. */
function body(c: Ctx): string {
  if (c.meta.part === 'halo') return ''
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 8
  if (c.role === 'night.moon') return blob(cx, cy, Math.max(r * 1.4, 10), '#f2ecc8', 'c', 0)
  if (c.role === 'space.earth') {
    // The Earth: a blue blob with green tiles for its land, risen off the horizon the lit scene
    // sinks it into, and smaller, so it stands clear with both eyes open like the sun and the moon.
    const er = r * 0.65
    const ey = cy - r * 0.75
    const land = `<circle cx="${n(cx - er * 0.4)}" cy="${n(ey + er * 0.35)}" r="${n(er * 0.38)}" fill="#3fc85a"/><circle cx="${n(cx + er * 0.45)}" cy="${n(ey - er * 0.45)}" r="${n(er * 0.3)}" fill="#3fc85a"/>`
    return blob(cx, ey, er, '#2f7bff', 'o', 0, land, 0.1)
  }
  const sun = c.role === 'desert.sun' ? '#ffffff' : '#ffd23a'
  return blob(cx, cy, Math.max(r * 1.4, 9), sun, 'o', 0)
}

/** Stars as single tiles on the grid, dim ones half-laid, each shape's twinkle kept. */
function stars(svg: string, c: Ctx): string {
  const seen = new Set<string>()
  return stripLight(dropBlooms(svg)).replace(/<(path|rect|circle)\b([^>]*?)(\/>|>([\s\S]*?)<\/\1>)/g, (_all, tag: string, attrs: string, _close: string, inner?: string) => {
    const at = (a: string) => Number(new RegExp(`\\s${a}="([^"]*)"`).exec(attrs)?.[1] ?? 0)
    const pts: [number, number][] =
      tag === 'path'
        ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+)[ ,]([\d.-]+)/g)].map(m => [Number(m[1]), Number(m[2])])
        : tag === 'circle'
          ? [[at('cx'), at('cy')]]
          : [[at('x'), at('y')]]
    let uses = ''
    for (const [x, y] of pts) {
      const gx = Math.floor(x / T) * T
      const gy = Math.floor(y / T) * T
      const key = `${gx},${gy}`
      if (seen.has(key)) continue
      seen.add(key)
      uses += `<use href="#bm-st" x="${t1(gx)}" y="${t1(gy)}"/>`
    }
    if (!uses) return ''
    const op = Number(/\sopacity="([\d.]+)"/.exec(attrs)?.[1] ?? 1)
    const anim = c.motion(inner ?? '')
    return `<g${op < 1 ? ` opacity="${n(Math.min(1, op * 1.4 + 0.15))}"` : ''}>${uses}${anim}</g>`
  })
}

/** Small things (motes, sparks, dust) at least a tile across, so each lays one whole tile. */
const atLeastTile = (svg: string) =>
  svg
    .replace(/(<rect\b[^>]*?\swidth=")([\d.]+)("[^>]*?\sheight=")([\d.]+)"/g, (all, a: string, w: string, b: string, h: string) =>
      Number(w) < T || Number(h) < T ? `${a}${Math.max(T, Number(w))}${b}${Math.max(T, Number(h))}"` : all,
    )
    .replace(/(<circle\b[^>]*?\sr=")([\d.]+)"/g, (all, a: string, r: string) => (Number(r) < T * 0.6 ? `${a}${T * 0.6}"` : all))
    .replace(/(<ellipse\b[^>]*?\srx=")([\d.]+)("[^>]*?\sry=")([\d.]+)"/g, (all, a: string, rx: string, b: string, ry: string) =>
      Number(rx) < T * 0.6 || Number(ry) < T * 0.6 ? `${a}${Math.max(T * 0.6, Number(rx))}${b}${Math.max(T * 0.6, Number(ry))}"` : all,
    )

/**
 * Mist: a row of half-laid white tiles where the lit mist lay. By day only the
 * far row, and thin, so the vivid ground and the green tiles stay vivid.
 */
function air(svg: string, c: Ctx): string {
  if (!chapter.dark && ROLES[c.role].depth > 0.3) return ''
  const fill = chapter.dark ? '#a89ee0' : '#ffffff'
  return `<g opacity="${chapter.dark ? '.4' : '.2'}">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${fill}"`).replace(/\s(opacity|fill-opacity)="[^"]*"/g, '')}</g>`
}

const scenery = (sw: number): Painter => {
  chapter = CHAPTERS.forest!
  const base = painter(
    {
      ink: (color, family, depth) => paint(color, family, depth),
      // A gradient is laid as one paint, its overall tone; a faint wash of light is not laid.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr !== 'stroke' && mean.opacity < 0.4) return 'none'
        return paint(mean.color, family, 0.5)
      },
      // A tile is laid or it is not: no half-laid washes, but for mist.
      opacity: (family, v) => (family === 'air' ? v : v >= 0.3 ? 1 : 0),
      lineless: 0.3,
      faint: 'hide',
      // A pool of lamplight: a half-laid patch of yellow tiles.
      pool: e => `<g ${TILED}><ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(Math.max(e.ry, T))}" fill="${FIRE[3]}" opacity=".55"/></g>`,
      redraw: {
        sky: (_svg, c) => sky(c),
        // The lab's back wall is its chapter's ground.
        'lab.wall': (svg, c) => {
          const open = /^\s*<g\b[^>]*>/.exec(svg)?.[0] ?? ''
          return `<rect x="-${T}" y="-${T}" width="${n((c.meta.sw ?? sw) + 2 * T)}" height="${n((c.meta.y ?? 80) + T)}" fill="${chapter.ground}"/>` + open
        },
        body: (_svg, c) => body(c),
        stars,
        'space.milkyway': (svg, c) => stars(svg.replace(/<ellipse[^>]*\/>/, ''), c),
        lens: () => '',
        glow: () => '',
        beam: () => '',
        water: () => '',
        air,
        life: (svg, c) => atLeastTile(c.repaint(svg)),
      },
    },
    'bm',
  )
  return {
    el(role: Role, svg: string, meta?: Meta) {
      const scene = role.split('.')[0] ?? ''
      if (CHAPTERS[scene]) chapter = CHAPTERS[scene]!
      // The crowd stands in the front corners, over everything but Claude's caption.
      if (role === 'lens') return crowd(meta?.sw ?? sw)
      const out = base.el(role, svg, meta)
      if (role === 'lab.wall') return out
      const info = ROLES[role]
      const set = setting(info.family, info.depth)
      return set ? wrapBalanced(out, set) : out
    },
    defs: base.defs,
  }
}

// ---------------------------------------------------------------- Claude

/** The glyph for each of Claude's eyes, from the shape the model gives it. */
function eyeGlyphs(m: Model, cx: number, floor: number): string {
  let out = ''
  let last: 'poly' | 'dizzy' | 'skip' | '' = ''
  for (const e of m.eyes) {
    if (e.poly) {
      const xs = e.poly.map(p => p[0])
      const ys = e.poly.map(p => p[1])
      const w = Math.max(...xs) - Math.min(...xs)
      const h = Math.max(...ys) - Math.min(...ys)
      const x = (Math.max(...xs) + Math.min(...xs)) / 2 + cx
      const y = (Math.max(...ys) + Math.min(...ys)) / 2 + floor
      out += eye(h < w * 0.6 ? 'c' : h > w * 1.3 ? 'o' : 'O', x, y)
      last = 'poly'
      continue
    }
    const pts = e.line ?? []
    if (pts.length === 2) {
      // A brow over a worried eye is left to the glyph; a dizzy eye's two strokes become one '@'.
      if (last === 'poly' || last === 'dizzy') {
        last = 'skip'
        continue
      }
      const a = pts[0]!
      const b = pts[1]!
      out += eye('d', (a[0] + b[0]) / 2 + cx, (a[1] + b[1]) / 2 + floor)
      last = 'dizzy'
      continue
    }
    if (!pts.length) continue
    const mid = pts[Math.floor(pts.length / 2)]!
    const ends = ((pts[0]?.[1] ?? 0) + (pts[pts.length - 1]?.[1] ?? 0)) / 2
    const xs = pts.map(p => p[0])
    const x = (Math.max(...xs) + Math.min(...xs)) / 2 + cx
    out += eye(mid[1] < ends ? 'h' : 'c', x, (mid[1] + ends) / 2 + floor)
    last = ''
  }
  return out
}

/**
 * Claude in tiles: each face in the plate's flat coral by its name, laid with
 * the stepped shadow in one filter, the eyes real glyphs over the mosaic.
 * Faces of one paint in a row share a path, so no face is drawn twice.
 */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  // The hulls under the faces, so no seam between two faces lets the ground through.
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const runs: { fill: string; d: string }[] = []
  for (const f of outlinedFaces(m)) {
    const fill = f.part === 'leg' ? (f.name === 'front' ? PAL.leg : PAL.legDark) : f.name === 'top' ? PAL.top : f.name === 'front' ? PAL.body : PAL.side
    const last = runs[runs.length - 1]
    if (last && last.fill === fill) last.d += poly(f.pts, cx, floor)
    else runs.push({ fill, d: poly(f.pts, cx, floor) })
  }
  return (
    `<g ${STOOD}><path fill="${PAL.side}" d="${hulls}"/>${runs.map(r => `<path fill="${r.fill}" d="${r.d}"/>`).join('')}</g>` +
    `<g fill="${PAL.eye}" stroke="${PAL.eye}">${eyeGlyphs(m, cx, floor)}</g>`
  )
}

// ---------------------------------------------------------------- definitions

/**
 * The mosaic itself: sample the element at each tile's middle, lay the tile,
 * darken its grout edge. The grout is a pattern drawn once (`bm-grid`) and
 * brought in with feImage, not cut with sub-pixel filter subregions: Chrome
 * snaps those to whole pixels, and at 1.5 px a unit the grout vanished. A
 * renderer without feImage of an element lays the tiles without grout.
 */
function tiles(sw: number, h: number, shadow: boolean, id: string): string {
  return (
    `<filter id="${id}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="-80" y="-80" width="${n(sw + 160)}" height="${h + 160}" color-interpolation-filters="sRGB">` +
    cells('SourceGraphic', T, 'm') +
    // The grout's color: each tile's own at two-thirds, as on the plate.
    `<feColorMatrix in="m" values=".66 0 0 0 0 0 .66 0 0 0 0 0 .66 0 0 0 0 0 1 0" result="d"/>` +
    // The grout: the `bm-grid` lines, laid hard (no half-covered pixel), dark wherever a tile is.
    `<feImage href="#bm-grid" x="-80" y="-80" width="${n(sw + 160)}" height="${h + 160}"/>` +
    `<feComponentTransfer result="g"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>` +
    `<feComposite in="d" in2="g" operator="in" result="gd"/><feMerge result="t"><feMergeNode in="m"/><feMergeNode in="gd"/></feMerge>` +
    (shadow
      ? `<feOffset in="m" dx="-${T}" dy="${T}"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="t"/></feMerge>`
      : '') +
    `</filter>`
  )
}

function defs(sw: number, h: number): string {
  return (
    // The grout lines, centred on the edges of the mosaic's grid, over the whole filter region.
    `<pattern id="bm-grout" width="${T}" height="${T}" patternUnits="userSpaceOnUse"><path shape-rendering="geometricPrecision" d="M0 0h${T}v${G}H0zM0 ${n(T - G)}h${T}v${G}H0zM0 0h${G}v${T}H0zM${n(T - G)} 0h${G}v${T}h-${G}z"/></pattern>` +
    `<rect id="bm-grid" x="-80" y="-80" width="${n(sw + 160)}" height="${h + 160}" fill="url(#bm-grout)"/>` +
    tiles(sw, h, false, 'bm-t') +
    tiles(sw, h, true, 'bm-s') +
    // A star: one white tile with its grout.
    `<rect id="bm-st" x="${G / 2}" y="${G / 2}" width="${n(T - G)}" height="${n(T - G)}" fill="#f2f2f2" stroke="#000" stroke-opacity=".45" stroke-width="${G}"/>` +
    // The caption's panel: white tiles in grey grout.
    `<pattern id="bm-card" width="${T * 1.5}" height="${T * 1.5}" patternUnits="userSpaceOnUse"><rect width="${T * 1.5}" height="${T * 1.5}" fill="#c9c9c4"/><rect x="${G}" y="${G}" width="${n(T * 1.5 - 2 * G)}" height="${n(T * 1.5 - 2 * G)}" fill="#f4f4ef"/></pattern>` +
    glyphDefs()
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The tag's tiles, one color of the crowd to a letter, all light enough for a black glyph. */
const TAG_TILES = ['#ffd23a', '#7fe8ff', '#ff8fd0', '#dfdfdf', '#b8f06a', '#ffb070', '#c8a8ff']

export const BLOB: Look = {
  name: 'blob',
  label: 'Blob Mosaic',
  voice: 'a cheery crowd of tile-mosaic blobs with glyph eyes, cheering in monospace',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: 5.7,
  caption: { fill: '#f4f4ef', stroke: BLACK, ink: '#141414', radius: 0 },
  paper: { card: '#f4f4ef', ink: '#141414', kinds: { code: '#0b7a4e', path: '#1f4fd0', fn: '#a01cb8', num: '#b85200', bad: '#d0182a', good: '#16803a', face: '#c4502e' } },
  inset: 2,
  titleColor: '#141414',
  art: {
    painter: scenery,
    hero,
    sky: '#1dec80',
    ground: '#262626',
    defs,
  },
  // A plain black key round the picture.
  frame: (sw, h) => `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" fill="none" stroke="${BLACK}" stroke-width="2"/>`,
  // The chapter spelled one letter to a tile, each tile a color of the crowd, with the stepped shadow.
  tag: (text, inset) => {
    const size = 7.6
    const x0 = inset + 3 + T
    const y = inset + 3
    const chars = [...text]
    let tilesSvg = ''
    let shade = ''
    const xs: string[] = []
    chars.forEach((ch, i) => {
      const x = x0 + i * size
      xs.push(n(x + size / 2))
      if (ch === ' ') return
      const fill = TAG_TILES[i % TAG_TILES.length]
      shade += `M${n(x - T)} ${n(y + T)}h${size}v${size}h-${size}z`
      tilesSvg += `<rect x="${n(x + G)}" y="${n(y + G)}" width="${n(size - 2 * G)}" height="${n(size - 2 * G)}" fill="${fill}"/>`
    })
    const w = chars.length * size
    return {
      svg:
        `<path d="${shade}" fill="${BLACK}"/><g stroke="#000" stroke-opacity=".45" stroke-width="${G * 2}">${tilesSvg}</g>` +
        `<text x="${xs.join(' ')}" y="${n(y + size * 0.74)}" font-family="${MONO}" font-size="7" font-weight="800" text-anchor="middle" fill="#141414">${escape(text)}</text>`,
      w: x0 + w + 4,
      h: y + size + T + 3,
    }
  },
  bubble: {
    font: MONO,
    size: 9,
    charW: 5.5,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) => {
      // The tail: a staircase of tiles from the panel down to Claude, each with its shadow.
      const mx = (base[0][0] + base[1][0]) / 2
      const my = (base[0][1] + base[1][1]) / 2
      const steps = Math.max(1, Math.round(Math.hypot(tip[0] - mx, tip[1] - my) / (T * 1.4)))
      let tail = ''
      let shade = ''
      for (let i = 1; i <= steps; i++) {
        const k = i / steps
        const s = T * (1.9 - k * 0.6)
        const tx = Math.round((mx + (tip[0] - mx) * k - s / 2) / 0.5) * 0.5
        const ty = Math.round((my + (tip[1] - my) * k - s / 2) / 0.5) * 0.5
        shade += `M${n(tx - T * 0.6)} ${n(ty + T * 0.6)}h${n(s)}v${n(s)}h-${n(s)}z`
        tail += `M${n(tx)} ${n(ty)}h${n(s)}v${n(s)}h-${n(s)}z`
      }
      return (
        `<path fill="${BLACK}" d="M${n(x - T)} ${n(y + T)}h${w}v${h}h-${w}z${shade}"/>` +
        `<path fill="#f4f4ef" stroke="#9a9a94" stroke-width="${G * 2}" d="${tail}"/>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="url(#bm-card)" stroke="${BLACK}" stroke-width="1"/>`
      )
    },
  },
}

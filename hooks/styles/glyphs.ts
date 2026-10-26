/**
 * Atlas Glyph Tiles, after the gallery's "Atlas Glyph Tiles" (henrik-styles.js,
 * style 21, `eatlas`), itself after the FT "Atlas" glyph tiles, recoloured
 * orange on azure.
 *
 * The art bible, translated from the gallery's tile sheet to the Fables' worlds:
 *
 * - Two materials, and nothing else. The open world is flat field: untiled,
 *   unshaded colour, crisp to the pixel. Every thing standing in it is set in
 *   glyph tiles: square tiles on one grid, each a black square with a gutter,
 *   a coloured face inset in it, and a black glyph struck on the face. Nothing
 *   is smaller than a tile, and nothing is a fraction of one: shapes go up
 *   and down in whole tiles, so every edge is stepped.
 * - The tiles come in the sheet's few inks: black, a dark and a pale grey,
 *   silver, paper white, the signal orange, an amber for lamps and a tan
 *   for sunlit stone, so the orange stays Claude's, the sun's and the
 *   fire's. White tiles carry a ■; every other face carries a thin /; a
 *   black tile is solid.
 * - Every tiled thing casts the sheet's stepped shadow: a black copy of
 *   itself one tile down and one tile to the left, laid on the lit field
 *   (on the night's blue-black it would only double every star).
 * - Sky is field, in flat bands of azure, palest at the horizon; at blue hour
 *   it is deep navy, and at night the terminal's own blue-black.
 * - The ground is the plate's azure field, a deeper azure at night, strewn
 *   with stray glyphs (0 ? ! < > { } + = 1 A) that blink out now and then;
 *   paths are a paler azure laid on it, ripples, pits and litter darker.
 * - Sun: a disc of orange tiles, lit along its upper left in white ■ tiles.
 *   Moon: a disc of white ■ tiles, grey tiles for its seas. Earth: a disc of
 *   the ground's own azure field, white ■ tiles for its weather.
 * - Stars: the bright ones single white ■ tiles, the twinkling ones blinking
 *   wholly in and out, a sparkle a plus of five; the dim ones and the Milky
 *   Way are loose specks of pale field.
 * - Clouds: white ■ tiles by day, dark grey ones by night; ash grey.
 * - Land, rock and buildings: greys by tone, black in the deepest shade,
 *   sunlit rock in tan, rock lit by lava in orange. Night is the same sheet
 *   on the terminal's blue-black: the solid world is never white, and far
 *   things are never black, so they stand off the sky.
 * - Foliage and grass: dark grey and grey, the far trees a step lighter by
 *   day, so the depths stand apart; bark black.
 * - Glass is pale tiles; reflections are not drawn. Fire and lava: orange
 *   tiles, white-hot ■ at the vents, black crust. Lamps and lit windows:
 *   amber and orange tiles, and a lamp's pool a patch of white ■ tiles.
 * - Mist is a dotted row of white tiles drifting by whole tiles; beams,
 *   glows and blooms are not drawn. Motes, fireflies and sparks are single
 *   tiles; the hawk a few black ones.
 * - Claude is the gallery's: front faces orange /, the top and the lit rim
 *   white ■, the sides grey /, the shade black, eyes black tiles, and his
 *   stepped black shadow down and to the left.
 * - The frame is the terminal: a black band along the top in which a row of
 *   glyph tiles streams by, two steps a second, and under it a big ■ lights
 *   every ninth cell, stepping the other way. The chapter is spelled in
 *   orange glyph tiles at its start; the caption is a white tile with a black
 *   gutter and its stepped shadow, set in monospace.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { dropBlooms, isGreen, isWarm, lum, meanOf, num as n, poly } from '../art/ink'
import { type Ctx, painter } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
/** One tile, in stage units: 6 px at the band's height. */
const T = 4
/**
 * The gutter round each tile's face: 1.35 px at the band's 1.5 px a unit, so the face snaps to the
 * tile's inner four pixels and every tile is framed in black, a pixel each side.
 */
const GUT = 0.9

/** The tile inks. None is blue: whatever is blue is field (see the grade). */
const K = '#000000'
const D = '#3c3c3c'
const G = '#8a8a8a'
const S = '#b8b8b8'
const WH = '#f2f2f2'
const O = '#f07a2a'
const AMBER = '#ffc457'
const EMBER = '#b0441a'
/** Sunlit rock and sand: a tan, so the signal orange stays Claude's, the sun's and the fire's. */
const SAND = '#d9a868'

/**
 * The field inks: every one blue by a clear margin, which is how the grade
 * tells field from tile, pixel by pixel.
 */
const F = {
  ground: '#2d7fb8',
  groundN: '#1f5d90',
  path: '#4a93c8',
  pathN: '#2b6c9f',
  mark: '#1a5482',
  markN: '#123f6c',
  night: '#000a2a',
  dust: '#2a4a86',
  dim: '#7f9fd0',
  stray: '#00143a',
  /** The strays at night: a shade darker than the night's ground, still blue enough to be field. */
  strayN: '#000a24',
  day: ['#6fb0e0', '#8cc2ea', '#acd3f1', '#c8e2f7'],
  dusk: ['#0b2550', '#103064', '#163d78', '#1d4a88'],
}

/** Whether the scene is under a night sky: its sky (or the lab's wall) is painted first, and says so. */
let night = false
/** Whether the scene's ground has had its stray glyphs. */
let strewn = false

const pick = (ramp: readonly string[], t: number) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))] ?? ramp[0]!

/** A lit color as the tile ink of its family. */
function tile(color: string, family: Family, depth: number): string {
  // The lit scenes are dim; a sheet of tiles uses its whole range.
  const t = Math.min(1, Math.pow(lum(color), 0.7) * 1.2)
  const warm = isWarm(color)
  // Under a night sky the solid world is never white: white is for the moon, the stars and the windows.
  const dim = night && (family === 'land' || family === 'rock' || family === 'built')
  // At night a far thing is never black, so it stands off the sky.
  const floor = night && depth < 0.5 ? 1 : 0
  const greys = [K, D, G, S, WH].slice(floor, dim ? 4 : 5)
  // By day the far trees are a step lighter than the near ones, so the depths stand apart.
  const leaves = [K, D, D, G, S, S].slice(floor + (!night && depth < 0.35 ? 2 : 0), night ? 5 : 6)
  switch (family) {
    case 'fire':
      return t > 0.78 ? WH : t > 0.4 ? O : t > 0.2 ? EMBER : K
    case 'lamp':
      return warm ? (t > 0.7 ? AMBER : O) : WH
    case 'life':
      return warm ? O : t > 0.45 ? WH : K
    case 'stars':
      return WH
    case 'cloud':
    case 'air':
      return night ? (t > 0.55 ? G : D) : t > 0.5 ? WH : S
    case 'foliage':
    case 'grass':
      return pick(leaves, t)
    case 'bark':
      return night && depth < 0.5 ? D : t > 0.5 ? D : K
    case 'glass':
      return t > 0.55 ? WH : t > 0.3 ? S : G
    case 'shadow':
      return K
    default:
      if (isGreen(color)) return pick(leaves, t)
      if (warm && t > 0.42 && (family === 'rock' || family === 'land')) return night ? O : SAND
      return pick(greys, t)
  }
}

/** The families laid as field rather than tiles. */
const isField = (family: Family) => family === 'sky' || family === 'ground' || family === 'mark'

/** A field ink for a family. */
function field(family: Family): string {
  if (family === 'mark') return night ? F.markN : F.mark
  return night ? F.groundN : F.ground
}

// ---------------------------------------------------------------- stray glyphs

/** The strays, as 3 by 5 bitmaps: the gallery's loose glyphs on the ground. */
const BITMAPS: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'],
  '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
  '{': ['.##', '.#.', '#..', '.#.', '.##'],
  '}': ['##.', '.#.', '..#', '.#.', '##.'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '=': ['...', '###', '...', '###', '...'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
}
const STRAYS = Object.keys(BITMAPS)
/** One pixel of a stray glyph. */
const PX = 0.6

function bitmapPath(rows: readonly string[]): string {
  let d = ''
  rows.forEach((row, j) => {
    for (const m of row.matchAll(/#+/g)) d += `M${n((m.index ?? 0) * PX)} ${n(j * PX)}h${n(m[0].length * PX)}v${PX}h-${n(m[0].length * PX)}z`
  })
  return d
}

/** A small seeded sequence, so the same stage always strews the same glyphs. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** One stray for this many units of ground across, as thick as the gallery's plate strews them. */
const STRAY_SPACING = 22
/** How far down the strays go: a tile short of the stage's foot (128), so none is cut by the edge. */
const STRAY_FLOOR = 128 - T

/** The strays on a stretch of ground from `top` down: three companies, each blinking out for a moment of its own. */
function strays(sw: number, top: number): string {
  const rand = seeded(Math.round(sw) * 7 + Math.round(top))
  const count = Math.max(8, Math.round(sw / STRAY_SPACING))
  const groups: string[] = ['', '', '']
  for (let i = 0; i < count; i++) {
    const x = Math.floor((4 + rand() * (sw - 8)) / T) * T + 1
    const y = Math.floor((top + 3 + rand() * Math.max(4, STRAY_FLOOR - top)) / T) * T + 0.5
    const g = STRAYS[Math.floor(rand() * STRAYS.length)] ?? '0'
    groups[i % 3] += `<use href="#gt-s${STRAYS.indexOf(g)}" x="${x}" y="${n(y)}"/>`
  }
  const ink = night ? F.strayN : F.stray
  return groups
    .map(
      (g, i) =>
        `<g fill="${ink}">${g}<animate attributeName="visibility" values="visible;hidden" keyTimes="0;.82" calcMode="discrete" dur="2.7s" begin="${n(-i * 0.9)}s" repeatCount="indefinite"/></g>`,
    )
    .join('')
}

// ---------------------------------------------------------------- the scenery

/** The sky as flat bands of field, palest at the horizon; navy at blue hour, the terminal's blue-black at night. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  strewn = false
  const dusk = c.role === 'city.sky'
  const sw0 = n(sw)
  if (night && !dusk) return `<rect width="${sw0}" height="128" fill="${F.night}"/>`
  const bands = dusk ? F.dusk : F.day
  // Bands step down in whole tiles, the deepest at the top.
  const edges = [0, 9 * T, 15 * T, 19 * T, 22 * T]
  return bands.map((b, i) => `<rect y="${edges[i]}" width="${sw0}" height="${(i === bands.length - 1 ? 128 : (edges[i + 1] ?? 128)) - (edges[i] ?? 0)}" fill="${b}"/>`).join('')
}

/** Stars: the dim ones loose specks of pale field; the bright and twinkling ones single white tiles. */
function stars(svg: string, c: Ctx): string {
  if (c.role === 'space.milkyway') {
    // The band of the Milky Way as loose dust: its glow is not drawn.
    const dust = /<path\b[^>]*\sd="([^"]*)"/.exec(svg)?.[1] ?? ''
    return dust ? `<path fill="${F.dust}" d="${dust}"/>` : ''
  }
  const tiled = (d: string) =>
    d
      .replace(/M([\d.-]+) ([\d.-]+)h1v1h-1z/g, (_a, x: string, y: string) => `M${n(Number(x) - 1.5)} ${n(Number(y) - 1.5)}h${T}v${T}h-${T}z`)
      // A sparkle's cross is a plus of five tiles.
      .replace(/M([\d.-]+) ([\d.-]+)h([\d.]+)M[\d.-]+ [\d.-]+v[\d.]+/g, (_a, x: string, y: string, w: string) => {
        const cx = Number(x) + Number(w) / 2 - T / 2
        const cy = Number(y) - T / 2
        return `M${n(cx - T)} ${n(cy)}h${3 * T}v${T}h-${3 * T}zM${n(cx)} ${n(cy - T)}h${T}v${3 * T}h-${T}z`
      })
  // The sparkles' blooms are not drawn, and their white hearts are inside their tiles.
  return dropBlooms(svg).replace(/<circle\b[^>]*\/>/g, '').replace(/<path\b([^>]*?)\sd="([^"]*)"([^>]*?)(\/?)>/g, (_tag, pre: string, d: string, post: string, close: string) => {
    const op = Number(/\sopacity="([\d.]+)"/.exec(pre + post)?.[1] ?? 1)
    // A path left open has its animation inside: that star twinkles.
    const twinkles = !close
    if (op < 0.5 && !twinkles) return `<path fill="${F.dim}" d="${d}"/>`
    return `<path fill="${WH}" d="${tiled(d)}"${close ? '/' : ''}>`
  })
    // A twinkling star blinks in and out, a whole tile or none: half lit, it would be a ghost of field.
    .replace(/<animate attributeName="opacity" values="[^"]*"/g, '<animate attributeName="opacity" values="1;0;1" calcMode="discrete"')
}

/** The sun as a disc of orange tiles lit in white along its upper left; the moon white with grey seas; the Earth azure field with white weather. */
function body(_svg: string, c: Ctx): string {
  if (c.meta.part === 'halo') return ''
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r0 = c.meta.r ?? 8
  if (c.role === 'space.earth') {
    const r = r0 * 0.9
    const at = (dx: number, dy: number, w: number) => `M${n(cx + dx * r)} ${n(cy + dy * r)}h${w * T}v${T}h-${w * T}z`
    return (
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${F.ground}"/>` +
      `<path fill="${F.markN}" d="M${n(cx + r * 0.2)} ${n(cy - r)}a${n(r)} ${n(r)} 0 0 1 0 ${n(2 * r)}a${n(r * 0.75)} ${n(r)} 0 0 0 0 ${n(-2 * r)}z"/>` +
      `<path fill="${WH}" d="${at(-0.7, -0.45, 3)}${at(-0.2, -0.75, 2)}${at(-0.55, 0.15, 2)}${at(0, 0.45, 3)}${at(-0.9, -0.1, 1)}"/>`
    )
  }
  if (c.role === 'night.moon') {
    const r = r0 * 1.3
    return (
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${WH}"/>` +
      `<circle cx="${n(cx + r * 0.25)}" cy="${n(cy - r * 0.15)}" r="${n(r * 0.3)}" fill="${S}"/><circle cx="${n(cx - r * 0.3)}" cy="${n(cy + r * 0.35)}" r="${n(r * 0.22)}" fill="${S}"/>`
    )
  }
  const r = r0 * (c.role === 'desert.sun' ? 1.25 : 1.6)
  return `<circle cx="${n(cx - T * 0.6)}" cy="${n(cy - T * 0.6)}" r="${n(r)}" fill="${WH}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${O}"/>`
}

/** Mist as a dotted row of white tiles, drifting with the mist it replaces. */
function air(svg: string, c: Ctx): string {
  const y = c.meta.y ?? 80
  const h = c.meta.h ?? 12
  const w = c.meta.sw ?? 640
  const row = Math.floor((y + h * 0.4) / T) * T
  return `<g><path stroke="${night ? G : WH}" stroke-width="${T}" stroke-dasharray="${T} ${T * 2}" d="M-24 ${row + T / 2}H${n(w + 24)}"/>${c.motion(svg)}</g>`
}

/** Field ground: the element's shapes in the field ink (or `ink`), and, the first time, the stray glyphs on it. */
function ground(svg: string, c: Ctx, ink?: string): string {
  // The moon's regolith closes over its craters with a wash of sunlight and shade: a field has neither.
  if (c.meta.part === 'close') return '</g>'
  let out = c.repaint(svg).replace(/^<g\b[^>]*>/, '<g>')
  if (ink) out = out.replace(/\s(fill|stroke)="(?!none)[^"]*"/g, (_a, attr: string) => ` ${attr}="${ink}"`)
  if (strewn) return out
  strewn = true
  const top = c.meta.y ?? 100
  return out + strays(c.meta.sw ?? 640, Math.max(top, 92))
}

/** Small living things grow to a tile, so each is one tile on the grid. */
const life = (svg: string, c: Ctx) =>
  c.repaint(svg).replace(/\sr="([\d.]+)"/g, (_a, r: string) => ` r="${n(Math.max(Number(r), T * 0.55))}"`)

const scenery = () => {
  night = false
  strewn = false
  return painter(
    {
      ink: (color, family, depth) => (isField(family) ? field(family) : tile(color, family, depth)),
      // A gradient becomes one flat ink of its overall tone; a faint wash of light is not drawn.
      url: (_id, family, attr, g) => {
        if (isField(family)) return field(family)
        if (g?.tag === 'radialGradient' && (family === 'glow' || family === 'air' || family === 'beam' || family === 'cloud')) return 'none'
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr !== 'stroke' && mean.opacity < 0.5) return 'none'
        return tile(mean.color, family, 0.5)
      },
      // Every tile is a whole tile: no half-laid washes. Field keeps all but the faintest.
      opacity: (family, v) => (isField(family) ? (v >= 0.15 ? 1 : 0) : v >= 0.35 ? 1 : 0),
      // What that leaves unseen (the firs' lit rims, the faint glazes) is not sent at all; and a tiled
      // shape is read by the grade once a tile, so its outline needs no finer place than a whole unit.
      post: (svg, family) => {
        const out = svg.replace(/<(?:use|path|rect|circle|ellipse)\b[^>]*\sopacity="0"[^>]*\/>/g, '')
        return isField(family) ? out : out.replace(/\sd="([^"]*)"/g, (_a, d: string) => ` d="${d.replace(/-?\d*\.\d+/g, v => String(Math.round(Number(v)) || 0))}"`)
      },
      // A pool of lamplight is a patch of white tiles on the ground.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(Math.max(T, e.rx * 0.5))}" ry="${n(Math.max(T * 0.6, e.ry))}" fill="${WH}"/>`,
      redraw: {
        sky,
        stars,
        body,
        air,
        ground,
        life,
        lens: () => '',
        glow: () => '',
        beam: () => '',
        // No reflections: the street and the floor stay plain field.
        water: () => '',
        'night.crest': () => '',
        // The meadows are the ground's own field; the paths a paler azure on it.
        'forest.meadow': (svg, c) => ground(svg, c, F.ground),
        'night.meadow': (svg, c) => ground(svg, c, F.groundN),
        'forest.path': (svg, c) => c.repaint(svg).replace(/\sfill="(?!none)[^"]*"/g, ` fill="${night ? F.pathN : F.path}"`),
        'night.path': (svg, c) => c.repaint(svg).replace(/\sfill="(?!none)[^"]*"/g, ` fill="${F.pathN}"`),
        // The moon's swells are the ground's field, a paler azure on their sunny sides.
        'space.swells': (svg, c) => {
          strewn = false
          return ground(svg, c, F.pathN)
        },
        // The lab's wall is the terminal itself: blue-black field, the night it is.
        'lab.wall': (svg, c) => {
          night = true
          strewn = false
          const open = /^<g\b[^>]*>/.exec(svg)?.[0] ?? ''
          return `${open ? '<g>' : ''}<rect width="${n(c.meta.sw ?? 640)}" height="128" fill="${F.night}"/>`
        },
      },
    },
    'gt',
  )
}

// ---------------------------------------------------------------- Claude

/**
 * How much the eyes are swollen by their own stroke. An eye is narrower than a tile, and the grade
 * reads each tile at one point, so a bare eye can fall between two points and vanish; swollen
 * to about a tile, it always lands on one and is set as a black tile.
 */
const EYE_SWELL = 1.8

/** Claude in glyph tiles: front orange, top and lit rim white, sides grey, the shade black, black eyes. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  // The lit rim: the hulls in white, half a tile up and to the left, under the faces.
  const rim = m.parts.map(pt => poly(pt.hull, cx - T * 0.55, floor - T * 0.55)).join('')
  const runs: { fill: string; d: string }[] = []
  for (const f of outlinedFaces(m)) {
    const fill = f.name === 'top' ? WH : f.name === 'front' ? O : f.light > 0.62 ? S : f.light > 0.36 ? G : f.light > 0.15 ? D : K
    const d = poly(f.pts, cx, floor)
    const last = runs[runs.length - 1]
    if (last && last.fill === fill) last.d += d
    else runs.push({ fill, d })
  }
  const eyes = m.eyes
    .map(e => (e.poly ? poly(e.poly, cx, floor) : ''))
    .join('')
  const lines = m.eyes
    .map(e => (e.poly ? '' : poly(e.line ?? [], cx, floor, false)))
    .join('')
  return (
    `<path fill="${WH}" d="${rim}"/>` +
    runs.map(r => `<path fill="${r.fill}" d="${r.d}"/>`).join('') +
    (eyes ? `<path fill="${K}" stroke="${K}" stroke-width="${EYE_SWELL}" stroke-linejoin="round" d="${eyes}"/>` : '') +
    (lines ? `<path fill="none" stroke="${K}" stroke-width="${T * 0.8}" stroke-linecap="square" d="${lines}"/>` : '')
  )
}

// ---------------------------------------------------------------- the medium

/**
 * The grade: the stage set into glyph tiles. Every tile takes the color at its
 * centre; a blue one is field and shows the drawing as it is, crisp; any other
 * is a tile: a black square, its face inset in the tile's ink, a black glyph
 * struck on it (■ on white, / on the rest), and its stepped shadow on the field.
 */
function grade(): string {
  const f = (v: number) => n(v)
  const face = T - 2 * GUT
  const dot = T * 0.3
  // The / is two specks on the diagonal, a third of a unit either side of the middle: at the band's
  // 1.5 px a unit each falls in a device pixel of its own, so the stroke is one pixel thin and the
  // gutters, not the glyphs, are what draw the grid.
  const s = 0.4
  const slash = [-1, 1].map((k, i) => `<feFlood x="${f(T / 2 + k / 3 - s / 2)}" y="${f(T / 2 - k / 3 - s / 2)}" width="${f(s)}" height="${f(s)}" result="gt-l${i}"/>`).join('')
  // Each tile takes the color at one point, spread over the tile but never past it: a dilation
  // takes each channel's greatest, so a sample over two pixels, or a spread into a neighbour,
  // mixes two inks channel by channel (orange and azure make pink). So the point is one device
  // pixel and the spread stops a pixel short of the next tile at 1, 1.5, 2 and 3 px a unit (the
  // band at 1x and 2x); the last row and column are then filled from a copy shifted down and
  // right, laid under the tiles, so a copy reaching past its tile is covered by the next one.
  const s0 = 1.55
  const sample = 0.05
  const r = 1.4
  return (
    `<feFlood flood-color="#000" result="gt-k"/>` +
    `<feFlood x="${s0}" y="${s0}" width="${sample}" height="${sample}"/><feComposite x="0" y="0" width="${T}" height="${T}"/><feTile result="gt-at"/>` +
    `<feComposite in="SourceGraphic" in2="gt-at" operator="in"/><feMorphology operator="dilate" radius="${r}" result="gt-a"/>` +
    `<feOffset dx="1"/><feMerge result="gt-b"><feMergeNode/><feMergeNode in="gt-a"/></feMerge><feOffset dy="1"/>` +
    `<feMerge result="gt-q"><feMergeNode in="gt-k"/><feMergeNode/><feMergeNode in="gt-b"/></feMerge>` +
    // A tile is whatever is not blue: its alpha is how far red outweighs blue.
    `<feColorMatrix in="gt-q" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 10 0 -10 0 1.5" result="gt-m"/>` +
    // Field is what is blue, pixel by pixel, so its loose glyphs and specks stay crisp.
    `<feColorMatrix in="SourceGraphic" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -10 0 10 0 -.5" result="gt-p"/>` +
    // The stepped shadow falls on lit field only: on the night's blue-black it would be a second dark speck by every star.
    `<feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 20 0 -4" result="gt-n"/>` +
    `<feOffset in="gt-m" dx="${-T}" dy="${T}"/><feComposite in2="gt-n" operator="in" result="gt-sh"/>` +
    // The face of a tile, inset by its gutter; the ■ and the /; each laid once and tiled.
    `<feFlood flood-color="#fff" x="${f(GUT)}" y="${f(GUT)}" width="${f(face)}" height="${f(face)}"/><feComposite x="0" y="0" width="${T}" height="${T}"/><feTile result="gt-f"/>` +
    `<feFlood x="${f((T - dot) / 2)}" y="${f((T - dot) / 2)}" width="${f(dot)}" height="${f(dot)}"/><feComposite x="0" y="0" width="${T}" height="${T}"/><feTile result="gt-d"/>` +
    slash +
    `<feMerge x="0" y="0" width="${T}" height="${T}"><feMergeNode in="gt-l0"/><feMergeNode in="gt-l1"/></feMerge><feTile result="gt-s"/>` +
    // White faces take the ■, the rest the /.
    `<feColorMatrix in="gt-q" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3 3 3 0 -6.6" result="gt-w"/>` +
    `<feComposite in="gt-d" in2="gt-w" operator="in" result="gt-g1"/><feComposite in="gt-s" in2="gt-w" operator="out" result="gt-g2"/>` +
    `<feMerge result="gt-g"><feMergeNode in="gt-g1"/><feMergeNode in="gt-g2"/></feMerge>` +
    `<feComposite in="gt-q" in2="gt-f" operator="in"/><feComposite in2="gt-g" operator="out"/><feComposite in2="gt-m" operator="in" result="gt-c"/>` +
    `<feMerge><feMergeNode in="gt-q"/><feMergeNode in="gt-p"/><feMergeNode in="gt-sh"/><feMergeNode in="gt-m"/><feMergeNode in="gt-c"/></feMerge>`
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The terminal's stream, the gallery's own. */
const STREAM = 'AI 01{)<+ #*/&!?01 '
/** The chapter tag's tiles: bigger than the stage's, to be read; the face inset by a tenth, as the stage's is. */
const TAG = 8
const TAG_GUT = 0.8
/** The baseline of a tag letter, as a share of its tile: a 6.2 capital's cap height then sits centred on the face. */
const TAG_BASE = 0.74
/** The caption tile's black gutter, and its stepped shadow's step. */
const BUBBLE_GUT = 1.6
const BUBBLE_STEP = 3

/** The terminal band along the top, and the stream's tiles in it: the stream's row, and below it the row of big ■. */
const BAND = 15
const ST = 5
const ROW = 2
const ROW2 = 9
/** A big ■ lights every this many cells of the second row. */
const EVERY = 9

/** The definitions the whole style draws with, laid down once under the stage. */
const defs = () =>
  STRAYS.map((g, i) => `<path id="gt-s${i}" d="${bitmapPath(BITMAPS[g] ?? [])}"/>`).join('') +
  `<pattern id="gt-st" width="${ST}" height="${ST}" patternUnits="userSpaceOnUse" y="${ROW}"><rect x=".5" y=".5" width="${ST - 1}" height="${ST - 1}" fill="${WH}"/></pattern>` +
  `<pattern id="gt-bt" width="${EVERY * ST}" height="${ST}" patternUnits="userSpaceOnUse" y="${ROW2}"><rect x=".5" y=".5" width="${ST - 1}" height="${ST - 1}" fill="${WH}"/><rect x="1.35" y="1.35" width="2.3" height="2.3" fill="${K}"/></pattern>`

export const GLYPHS: Look = {
  name: 'glyphs',
  label: 'Atlas Glyph Tiles',
  voice: 'a terminal set in glyph tiles: terse, monospaced, deadpan',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: 5.7,
  caption: { fill: WH, stroke: K, ink: '#111111', radius: 0 },
  paper: { card: WH, ink: '#111111', kinds: { code: '#13609a', path: '#0d4a7a', fn: '#7a3a9a', num: '#c0501a', bad: '#c0221e', good: '#2a7a3a', face: '#d0601e' } },
  inset: 0,
  titleColor: K,
  grade,
  edge: K,
  art: {
    painter: scenery,
    hero,
    sky: F.night,
    ground: F.ground,
    defs,
  },
  // The terminal: a black band along the top, a row of glyph tiles streaming by in it, two steps a
  // second, and under it a big ■ on every ninth cell, stepping the other way.
  frame: sw => {
    const count = Math.ceil(sw / ST) + STREAM.length + 1
    const text = escape(STREAM.repeat(Math.ceil(count / STREAM.length)).slice(0, count))
    const steps = Array.from({ length: STREAM.length }, (_, i) => `${(i - STREAM.length) * ST} 0`).join(';')
    const back = Array.from({ length: EVERY }, (_, i) => `${-i * ST} 0`).join(';')
    return (
      `<rect width="${sw}" height="${BAND}" fill="${K}"/><rect y="${ROW}" width="${sw}" height="${ST}" fill="url(#gt-st)"/>` +
      `<rect y="${ROW2}" width="${sw + EVERY * ST}" height="${ST}" fill="url(#gt-bt)"><animateTransform attributeName="transform" type="translate" values="${back}" calcMode="discrete" dur="${EVERY / 2}s" repeatCount="indefinite"/></rect>` +
      `<g><text x="1.4" y="${ROW + 4.1}" textLength="${count * ST}" lengthAdjust="spacing" font-family="${MONO}" font-size="3.6" font-weight="700" fill="${K}" text-anchor="start">${text}</text>` +
      `<animateTransform attributeName="transform" type="translate" values="${steps}" calcMode="discrete" dur="${STREAM.length / 2}s" repeatCount="indefinite"/></g>`
    )
  },
  // The chapter, spelled in orange glyph tiles at the head of the stream.
  tag: (text, inset) => {
    const t = text.toUpperCase()
    const x = inset + 2
    const y = inset + 0.5
    const s = TAG
    const face = s - 2 * TAG_GUT
    let faces = ''
    for (let i = 0; i < t.length; i++) if (t[i] !== ' ') faces += `M${n(x + i * s + TAG_GUT)} ${n(y + TAG_GUT)}h${face}v${face}h-${face}z`
    const w = t.length * s
    return {
      svg:
        `<rect x="${n(x - 1)}" y="${n(y - 0.5)}" width="${n(w + 2)}" height="${s + 1}" fill="${K}"/>` +
        `<path fill="${O}" d="${faces}"/>` +
        `<text x="${Array.from(t, (_c, i) => n(x + i * s + s / 2)).join(' ')}" y="${n(y + s * TAG_BASE)}" text-anchor="middle" font-family="${MONO}" font-size="6.2" font-weight="700" fill="${K}">${escape(t)}</text>`,
      w: x + w + 3,
      h: y + s + 3,
    }
  },
  bubble: {
    font: MONO,
    size: 9,
    charW: 5.5,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A white tile: its stepped shadow down and to the left, a black gutter, a black tail.
      `<rect x="${n(x - BUBBLE_STEP)}" y="${n(y + BUBBLE_STEP)}" width="${w}" height="${h}" fill="${K}"/>` +
      `<path fill="${K}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${K}"/>` +
      `<rect x="${n(x + BUBBLE_GUT)}" y="${n(y + BUBBLE_GUT)}" width="${n(w - 2 * BUBBLE_GUT)}" height="${n(h - 2 * BUBBLE_GUT)}" fill="${WH}"/>`,
  },
}

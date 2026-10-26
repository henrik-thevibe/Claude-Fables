/**
 * Teletext Page, after the gallery's "Teletext Page" (henrik-styles.js,
 * style 26, `eteletext`), itself after Goto80's *Datagården*: a page of
 * broadcast teletext, Ceefax and Text-TV, as a television set draws it.
 *
 * The art bible, translated from the gallery's page to the Fables' worlds:
 *
 * - The medium is the teletext page: a black screen, eight colors and no
 *   others (black, red, green, yellow, blue, magenta, cyan, white), and
 *   mosaic graphics. Every character cell is two blocks wide and three high,
 *   each block one flat color; nothing is smaller than a block, nothing is
 *   blended, nothing has a line. The whole stage is set on that block grid.
 * - Where a color between the eight is wanted, it is dithered, as teletext
 *   artists do: a checker of blocks of two colors (blue and black for a dark
 *   blue, red and yellow for an orange, white and black for a grey). A
 *   checker of one color over nothing is a veil the scene shows through; one
 *   block in four, set in staggered rows on black, is a ground's grit.
 * - The sky is laid in bands, one character row deep, from the lit sky's
 *   colors: blue to cyan by day, blue through magenta to red at sunset, and
 *   black at night with only a band of dithered blue at the horizon. The
 *   transitions between bands are the dithers. An eruption lights its night
 *   in a red checker round the crater.
 * - Stars are the page's own: single white blocks and white plus signs that
 *   flash, as the plate's `.` and `+` do. The sun is a yellow disc of blocks,
 *   the moon a white one with grey craters, the Earth a blue disc with green
 *   continents and a white cap of cloud.
 * - Clouds are white and cyan-white blocks by day, dithered blue at night;
 *   mist and air are veils of checkered white, or blue at night; shafts of
 *   light are veils of yellow, and a lamp's pool a yellow checker.
 * - Land, rock and buildings take the color nearest their hue, lit parts in
 *   the solid color, shade in its checker with black, the far distance a
 *   step darker. Foliage and grass are green (yellow where lit), bark a dark
 *   red. Ground is dithered, darker than what stands on it, so Claude stands
 *   clear of it. Glass is cyan, fire runs red to yellow to white, lamps are
 *   solid yellow blocks. Reflections are not drawn: teletext has none.
 * - Claude is the plate's: in blocks, the top yellow, the front red, the
 *   sides and legs magenta, black blocks for his eyes, and a row of black
 *   blocks round him, the page's own black, so he reads on any ground.
 * - The page furniture is the frame: a header row at the top (page number,
 *   service name, a clock whose seconds tick), and the Fastext row at the
 *   bottom, four colored links. The chapter is the page's title, yellow
 *   capitals on a blue band; the caption is a boxed subtitle, white type on
 *   black, framed in blue, with a stepped tail of blocks down to Claude.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { hue, isWarm, lum, meanOf, num as n } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import { cells } from '../grade'
import type { Look } from '../looks'

/** The eight colors of teletext, as the gallery's page sets them. */
const K = { k: '#000000', R: '#ff3b30', G: '#34d058', Y: '#ffd60a', B: '#2255ff', M: '#ff4fd8', C: '#35e0ff', W: '#ffffff' } as const
type Hue = keyof typeof K
/** One mosaic block, in stage units: a character cell is two wide and three high. */
const SIX = 2
const ROW = SIX * 3
/** The ground's top on the stage, and the stage's height (svg.ts). */
const HORIZON = 104
const STAGE_H = 128
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const TYPE = `Monocraft, ${MONO}`

/**
 * The dithers the page uses: each a checker of blocks of its two colors, or of
 * one color over nothing (`_`), or a ground's grit of one color on black (`q`).
 * A token of one letter is a solid color.
 */
const DITHERS = ['Bk', 'Rk', 'Gk', 'Yk', 'Mk', 'Ck', 'Wk', 'BC', 'CW', 'RY', 'YW', 'GY', 'MB', 'MW', 'W_', 'Y_', 'B_', 'Rq', 'Gq', 'Yq', 'Bq', 'Mq', 'Cq', 'Wq'] as const

/**
 * A token as paint: a solid color, or its checker. Lines and stops cannot be
 * patterns: they take the first color, and a line on grit is the black it lies on.
 */
const paint = (tok: string, attr: string = 'fill'): string =>
  tok.length === 1 ? K[tok as Hue] : attr !== 'fill' ? (tok[1] === 'q' ? K.k : K[(tok[0] ?? 'k') as Hue]) : `url(#tx-${tok})`

/** The page's colors by hue, dark to light: black, the checker with black, the solid color, the checker toward white. */
const RAMP = {
  red: ['k', 'Rk', 'R', 'RY', 'Y', 'YW'],
  yellow: ['k', 'Yk', 'RY', 'Y', 'YW', 'W'],
  green: ['k', 'Gk', 'G', 'GY', 'Y'],
  cyan: ['k', 'Ck', 'C', 'CW', 'W'],
  blue: ['k', 'Bk', 'B', 'BC', 'C', 'CW', 'W'],
  violet: ['k', 'Bk', 'MB', 'M', 'MW', 'W'],
  magenta: ['k', 'Mk', 'M', 'MW', 'W'],
  grey: ['k', 'Bk', 'Wk', 'Wk', 'W'],
} as const
type Ramp = readonly string[]

const pick = (ramp: Ramp, t: number) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))] ?? 'k'
/** The lit scenes are dim; a page uses its colors at full strength. */
const lift = (l: number) => Math.min(1, Math.pow(l, 0.62) * 1.12)

/** The ramp a lit color's hue belongs to. */
function rampOf(color: string): Ramp {
  const { h, s } = hue(color)
  if (s < 0.16) return RAMP.grey
  if (h < 38 || h >= 330) return RAMP.red
  if (h < 68) return RAMP.yellow
  if (h < 165) return RAMP.green
  if (h < 196) return RAMP.cyan
  if (h < 252) return RAMP.blue
  if (h < 290) return RAMP.violet
  return RAMP.magenta
}

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false
/** Whether the element is indoors after dark (the lab): its colors a step down. */
let dim = false

/** A lit color as a teletext token, for an element of the family at the depth. */
function token(color: string, family: Family, depth: number): string {
  const l = lift(lum(color)) * (dim ? 0.62 : 1)
  const far = depth < 0.25 ? -0.12 : 0
  const t = Math.max(0, Math.min(1, l + far))
  const warm = isWarm(color)
  switch (family) {
    case 'stars':
    case 'life':
      return warm ? 'Y' : 'W'
    case 'lamp':
      return warm || l > 0.8 ? (l > 0.92 ? 'YW' : 'Y') : l > 0.5 ? 'C' : 'BC'
    case 'fire':
      return pick(['Rk', 'R', 'RY', 'Y', 'YW', 'W'], Math.pow(lum(color), 0.7))
    case 'cloud':
      return night || l < 0.35 ? (l > 0.45 ? 'Wk' : 'Bk') : warm ? (l > 0.65 ? 'YW' : 'MW') : l > 0.7 ? 'W' : 'CW'
    case 'air':
    case 'beam':
    case 'glow':
      return night ? 'B_' : warm ? 'Y_' : 'W_'
    case 'foliage':
    case 'grass':
      return pick(RAMP.green, t * (night ? 0.72 : 0.82))
    case 'bark':
      // Bark is a dark red: never the solid red of Claude's front.
      return pick(['k', 'Rk'], t)
    case 'ground':
    case 'mark':
      return grit(color)
    case 'land':
      // Land at the foot of the scene is ground.
      return depth >= 0.5 ? grit(color) : pick(rampOf(color), t * 0.85)
    case 'rock':
      return pick(rampOf(color), t * 0.85)
    case 'glass':
      return pick(RAMP.cyan, t)
    case 'water':
      return pick(RAMP.blue, t)
    case 'shadow':
    case 'lens':
      return 'k'
    case 'sky':
      return pick(skyRamp(color), t)
    default: {
      const r = rampOf(color)
      // Indoors after dark the greys go blue: a white board would be the loudest thing in the room.
      return dim && r === RAMP.grey ? (t > 0.4 ? 'Ck' : 'Bk') : pick(r, t)
    }
  }
}

/**
 * Ground is grit: one block in four of its hue on black, darker than anything
 * that stands on it. Warm earth is red grit, sand in the sun yellow.
 */
function grit(color: string): string {
  const l = lum(color)
  if (l < 0.04) return 'k'
  const r = rampOf(color)
  if (r === RAMP.grey) return l > 0.3 ? 'Wq' : 'Bq'
  if (r === RAMP.red || r === RAMP.magenta || r === RAMP.yellow) return l > 0.4 ? 'Yq' : 'Rq'
  return `${(r[2] ?? 'k')[0]}q`
}

/** A sky is never green: a teal dawn is laid in cyan. */
const skyRamp = (color: string): Ramp => {
  const r = rampOf(color)
  return r === RAMP.green ? RAMP.cyan : r === RAMP.grey ? RAMP.blue : r
}

/** The color of a gradient at an offset, its stops interpolated. */
function colorAt(stops: readonly { offset: number; color: string }[], at: number): string {
  if (!stops.length) return '#203060'
  let a = stops[0]!
  for (const b of stops) {
    if (b.offset >= at) {
      if (b === a || b.offset === a.offset) return b.color
      const k = (at - a.offset) / (b.offset - a.offset)
      const x = hex(a.color)
      const y = hex(b.color)
      return `#${x.map((v, i) => Math.round(v + ((y[i] ?? v) - v) * k).toString(16).padStart(2, '0')).join('')}`
    }
    a = b
  }
  return a.color
}
const hex = (c: string): number[] => {
  const m = /^#([0-9a-f]{6})$/i.exec(c)
  return m?.[1] ? [0, 2, 4].map(i => parseInt(m[1]!.slice(i, i + 2), 16)) : [32, 48, 96]
}

/** The sky in bands of one character row, from the lit sky's gradient; at night black, with blue at the horizon. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#203060'
  const low = stops[stops.length - 1]?.color ?? '#405080'
  night = lum(top) < 0.2 && lum(low) < 0.45
  const sw = c.meta.sw ?? 640
  let out = ''
  let run = ''
  let y0 = 0
  for (let y = 0; y <= HORIZON + ROW; y += ROW) {
    const color = colorAt(stops, (y + ROW / 2) / STAGE_H)
    let tok = pick(skyRamp(color), Math.pow(lum(color), 0.8))
    // Night is the page's black, with dithered blue rising only near the horizon.
    if (night) tok = y < HORIZON - ROW * 4 ? 'k' : y < HORIZON - ROW * 2 ? 'Bk' : tok === 'k' ? 'Bk' : tok
    if (tok !== run) {
      if (run) out += `<rect y="${y0}" width="${n(sw)}" height="${y - y0}" fill="${paint(run)}"/>`
      run = tok
      y0 = y
    }
  }
  out += `<rect y="${y0}" width="${n(sw)}" height="${STAGE_H - y0}" fill="${paint(run)}"/>`
  return out
}

/** A coordinate set on the block grid. */
const snap = (v: number) => Math.floor(v / SIX) * SIX

/** Stars as the page's dots and plus signs: a block each, every fifth a plus, the plus signs flashing. */
function stars(svg: string): string {
  const pts: [number, number][] = []
  for (const m of svg.matchAll(/<(path|rect|circle)\b([^>]*?)\/?>/g)) {
    const attrs = m[2] ?? ''
    if (m[1] === 'path') for (const p of (/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+)[ ,]([\d.-]+)/g)) pts.push([+p[1]!, +p[2]!])
    else {
      const x = /\s(?:x|cx)="([\d.-]+)"/.exec(attrs)?.[1]
      const y = /\s(?:y|cy)="([\d.-]+)"/.exec(attrs)?.[1]
      if (x && y) pts.push([+x, +y])
    }
  }
  let dots = ''
  let plus = ''
  const seen = new Set<string>()
  pts.forEach(([x, y], i) => {
    const at = `${snap(x)} ${snap(y)}`
    if (y > HORIZON || seen.has(at)) return
    seen.add(at)
    if (i % 5 === 2) plus += `<use href="#tx-plus" x="${snap(x) - SIX}" y="${snap(y) - SIX}"/>`
    else dots += `<use href="#tx-dot" x="${snap(x)}" y="${snap(y)}"/>`
  })
  // The plus signs flash, as teletext's flash attribute does: shown, then a dot.
  return (
    `<g fill="${K.W}">${dots}` +
    (plus ? `<g>${plus}<animate attributeName="visibility" values="visible;hidden" dur="1.4s" calcMode="discrete" repeatCount="indefinite"/></g>` : '') +
    `</g>`
  )
}

/** A disc of blocks: the sun, the moon. */
const disc = (cx: number, cy: number, r: number, fill: string) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}"/>`

function body(_svg: string, c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 8
  if (c.meta.part === 'halo') return ''
  if (c.role === 'space.earth')
    // The Earth: a blue disc, green continents, a white swirl of cloud, its night side checkered.
    return (
      disc(cx, cy, r, K.B) +
      `<ellipse cx="${n(cx - r * 0.35)}" cy="${n(cy - r * 0.45)}" rx="${n(r * 0.3)}" ry="${n(r * 0.22)}" fill="${K.G}"/>` +
      `<ellipse cx="${n(cx + r * 0.3)}" cy="${n(cy - r * 0.62)}" rx="${n(r * 0.22)}" ry="${n(r * 0.14)}" fill="${K.G}"/>` +
      `<path fill="none" stroke="${K.W}" stroke-width="${SIX}" d="M${n(cx - r * 0.75)} ${n(cy - r * 0.2)}q${n(r * 0.6)} ${n(-r * 0.3)} ${n(r * 1.3)} ${n(-r * 0.2)}"/>` +
      `<path fill="url(#tx-Bk)" d="M${n(cx + r * 0.25)} ${n(cy - r)}a${n(r)} ${n(r)} 0 0 1 0 ${n(r * 2)}a${n(r * 0.75)} ${n(r)} 0 0 0 0 ${n(-r * 2)}z"/>`
    )
  if (c.role === 'night.moon')
    return disc(cx, cy, r * 1.2, K.W) + disc(cx - r * 0.35, cy - r * 0.2, r * 0.3, 'url(#tx-Wk)') + disc(cx + r * 0.3, cy + r * 0.35, r * 0.22, 'url(#tx-Wk)')
  // The sun: a yellow disc, a white heart.
  const big = r * (c.role === 'forest.sun' ? 1.8 : 1.35)
  return disc(cx, cy, big, K.Y) + disc(cx, cy, big * 0.45, K.W)
}

/** A veil laid across the scene: a band of checkered blocks over what lies behind, drifting as the air it replaces. */
function veil(svg: string, c: Ctx): string {
  const y = c.meta.y ?? 80
  const h = c.meta.h ?? 12
  const sw = c.meta.sw ?? 640
  const top = snap(y + h * 0.3)
  const tall = Math.max(SIX * 2, snap(h * 0.4))
  return `<g><rect x="-20" y="${top}" width="${n(sw + 40)}" height="${tall}" fill="url(#tx-${night ? 'B_' : 'W_'})"/>${c.motion(svg)}</g>`
}

/** Small things (windows, lamps, sparks) grown to at least a block, so the grid never loses them. */
function blocky(svg: string): string {
  return svg
    .replace(/<rect\b([^>]*?)\swidth="([\d.]+)"([^>]*?)\sheight="([\d.]+)"/g, (all, a: string, w: string, b: string, h: string) =>
      +w >= SIX && +h >= SIX ? all : `<rect${a} width="${n(Math.max(+w, SIX))}"${b} height="${n(Math.max(+h, SIX))}"`,
    )
    .replace(/(<circle\b[^>]*?\sr=")([\d.]+)"/g, (all, a: string, r: string) => (+r >= 1.5 ? all : `${a}1.5"`))
}

/** The plate's grass along the front of the scene, under the Fastext row. */
const tufts = () =>
  `<rect x="-20" y="${HORIZON + ROW}" width="1640" height="${ROW}" fill="url(#tx-tuft)"/><rect x="-20" y="${HORIZON + ROW * 2}" width="1640" height="${ROW}" fill="${K.G}"/>`

/** An element repainted with some of its tokens traded for others. */
const swap = (svg: string, c: Ctx, trade: Record<string, string>) =>
  c.repaint(svg).replace(/url\(#tx-(\w+)\)|#[0-9a-f]{6}/g, (all, tok?: string) => {
    const key = tok ?? (Object.keys(K) as Hue[]).find(h => K[h] === all) ?? ''
    const to = trade[key]
    return to === undefined ? all : paint(to)
  })

/** An element repainted a step darker. */
function dimmed(svg: string, c: Ctx): string {
  dim = true
  const out = c.repaint(svg)
  dim = false
  return out
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => paint(token(color, family, depth), attr),
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (mean.opacity < 0.4 && attr !== 'stroke') return 'none'
        return paint(token(mean.color, family, 0.5), attr)
      },
      // Every block is a whole block: no half-laid washes.
      opacity: (_f, v) => (v >= 0.35 ? 1 : 0),
      post: (svg, family) => (family === 'lamp' || family === 'life' || family === 'fire' ? blocky(svg) : svg),
      // A lamp's pool on the floor is a checker of yellow blocks.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(Math.max(SIX * 1.5, e.ry))}" fill="url(#tx-Y_)"/>`,
      redraw: {
        sky,
        stars,
        body,
        air: veil,
        lens: () => '',
        glow: () => '',
        // The eruption lights the night: a red checker behind the whole mountain, wider
        // than its foot, so the black cone stands in it as a silhouette.
        'volcano.glow': (_svg, c) => {
          const r = c.meta.r ?? 150
          return `<ellipse cx="${n(c.meta.cx ?? 320)}" cy="${n((c.meta.cy ?? 60) + r * 0.27)}" rx="${n(r * 1.3)}" ry="${n(r * 0.36)}" fill="url(#tx-Rk)"/>`
        },
        // The cone is the page's black against that glow, the lava's channels bright on
        // it, its outline a row of red blocks where the crater lights it.
        'volcano.cone': (_svg, c) => `<path fill="${K.k}" stroke="url(#tx-Rk)" stroke-width="${SIX}" d="${c.meta.d ?? ''}"/>`,
        // Teletext has no reflections: the wet street and the polished floor stay plain.
        water: () => '',
        // Light falling through the air is a veil of yellow blocks.
        beam: (svg, c) => `<g>${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="url(#tx-${night ? 'B_' : 'Y_'})"`).replace(/\s(opacity|visibility)="[^"]*"/g, '')}</g>`,
        // The lab after dark: its walls and furniture a step down, so its lamps and screens tell.
        'lab.wall': (svg, c) => c.repaint(svg).replace(/\sfill="(#[0-9a-fA-F]{6}|url\(#tx-[A-Za-z_]+\))"/g, (_a, f: string) => ` fill="${f === K.k || f === K.R || f.includes('Rk') ? K.k : 'url(#tx-Bk)'}"`),
        'lab.board': (svg, c) => dimmed(svg, c),
        'lab.bench': (svg, c) => dimmed(svg, c),
        'lab.rack': (svg, c) => dimmed(svg, c),
        'lab.books': (svg, c) => dimmed(svg, c),
        // The nearest grass is the plate's: a row of swaying tufts on black over a solid green strip.
        'forest.grass': () => tufts(),
        'night.grass': () => tufts(),
        // The moon's dust is a blue grit, its craters cyan-rimmed, so the stars and the Earth
        // stay the brightest things in the sky.
        'space.regolith': (svg, c) => swap(svg, c, { Wq: 'Bq', Wk: 'Bk', W: 'Bk' }),
        'space.swells': (svg, c) => swap(svg, c, { Wq: 'Bq' }),
        'space.pits': (svg, c) => swap(svg, c, { Wq: 'Cq' }),
        'space.craters': (svg, c) => swap(svg, c, { Wk: 'Ck', W: 'C' }),
        // The volcano's plain is a dark crust of red grit; its cracks are left to the grit,
        // so Claude stands clear on it and the lava stream alone runs bright.
        'volcano.plain': (svg, c) => swap(svg, c, { Yq: 'Rq', Y: 'Rk', RY: 'Rk' }),
        'volcano.cracks': () => '',
        // The milky way's haze is not drawn; its dust is a scatter of blocks.
        'space.milkyway': svg => stars(svg.replace(/<ellipse[^>]*\/>/, '')),
      },
    },
    'tx',
  )
}

// ---------------------------------------------------------------- Claude

/**
 * A polygon in whole units, each point a step from the last: the block grid is
 * two units, so tenths are wasted on Claude, who is baked in every pose.
 */
function ipoly(points: readonly (readonly [number, number])[], dx: number, dy: number, close = true): string {
  let px = 0
  let py = 0
  let d = ''
  points.forEach(([x, y], i) => {
    const qx = Math.round(x + dx)
    const qy = Math.round(y + dy)
    d += i ? `${qx - px}${qy - py < 0 ? '' : ' '}${qy - py} ` : `M${qx} ${qy}l`
    px = qx
    py = qy
  })
  return d.trimEnd() + (close ? 'z' : '')
}

/** Claude in mosaic blocks, as the plate sets him: top yellow, front red, sides and legs magenta, black eyes, a black row round him. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => ipoly(pt.hull, cx, floor)).join('')
  // The faces in painter's order, runs of one color sharing a path.
  let faces = ''
  let tone = ''
  let d = ''
  for (const f of outlinedFaces(m)) {
    const t = f.name === 'top' ? K.Y : f.name === 'front' && f.part === 'body' ? K.R : K.M
    if (t !== tone && d) {
      faces += `<path fill="${tone}" d="${d}"/>`
      d = ''
    }
    tone = t
    d += ipoly(f.pts, cx, floor)
  }
  if (d) faces += `<path fill="${tone}" d="${d}"/>`
  // The eyes, widened by a stroke so each covers at least a block.
  const pill = m.eyes.filter(e => e.poly).map(e => ipoly(e.poly ?? [], cx, floor)).join('')
  const lines = m.eyes.filter(e => !e.poly && e.line).map(e => ipoly(e.line ?? [], cx, floor, false)).join('')
  return (
    `<path fill="${K.k}" d="${ipoly(m.shadow, cx, floor)}"/>` +
    `<path fill="${K.k}" stroke="${K.k}" stroke-width="${SIX * 1.3}" stroke-linejoin="round" d="${hulls}"/>` +
    faces +
    (pill ? `<path fill="${K.k}" stroke="${K.k}" stroke-width="1.3" d="${pill}"/>` : '') +
    (lines ? `<path fill="none" stroke="${K.k}" stroke-width="2.2" d="${lines}"/>` : '')
  )
}

// ---------------------------------------------------------------- the page

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** The header row's type: Monocraft's advance is two thirds of its size. */
const HEAD = 7
const HEAD_W = (HEAD * 2) / 3

/** The definitions the page draws with, laid down once: the dithers, the star blocks. */
function defs(): string {
  const two = SIX * 2
  const checker = `M0 0h${SIX}v${SIX}H0zm${SIX} ${SIX}h${SIX}v${SIX}h-${SIX}z`
  // Grit: one block in four, the rows staggered; a ground's grit lies on black.
  const scatter = `M0 0h${SIX}v${SIX}H0zm${SIX * 2} ${SIX}h${SIX}v${SIX}h-${SIX}zm-${SIX} ${SIX}h${SIX}v${SIX}h-${SIX}zm${SIX * 2} ${SIX}h${SIX}v${SIX}h-${SIX}z`
  let out = ''
  for (const tok of DITHERS) {
    const [a, b] = [tok[0] as Hue, tok[1]]
    // A checker's tile is two blocks square; grit's, four.
    const size = b === 'q' ? two * 2 : two
    out +=
      `<pattern id="tx-${tok}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">` +
      (b === '_' ? '' : `<path d="M0 0h${size}v${size}H0z" fill="${b === 'q' ? K.k : K[b as Hue]}"/>`) +
      `<path d="${b === 'q' ? scatter : checker}" fill="${K[a]}"/></pattern>`
  }
  // The plate's grass: tufts on black, the marks at two heights, swapping as the grass sways.
  const tick = (x: number, y: number) => `M${x * SIX} ${y * SIX}h${SIX}v${SIX * 2}h-${SIX}z`
  out +=
    `<pattern id="tx-tuft" width="${SIX * 4}" height="${ROW}" patternUnits="userSpaceOnUse"><path d="M0 0h${SIX * 4}v${ROW}H0z"/>` +
    `<path d="${tick(0, 0)}${tick(2, 1)}" fill="${K.G}"/>` +
    `<animateTransform attributeName="patternTransform" type="translate" values="0 0;${SIX * 2} 0" calcMode="discrete" dur=".9s" repeatCount="indefinite"/></pattern>`
  return (
    out +
    `<path id="tx-dot" d="M0 0h${SIX}v${SIX}H0z"/>` +
    `<path id="tx-plus" d="M${SIX} 0h${SIX}v${SIX}h${SIX}v${SIX}h-${SIX}v${SIX}H${SIX}V${SIX * 2}H0V${SIX}h${SIX}z"/>`
  )
}

/** A digit that ticks: 0 to `top`, one a step, in a window one character wide. */
function ticker(x: number, top: number, step: number): string {
  let digits = ''
  for (let d = 0; d <= top; d++) digits += `<tspan x="0" y="${n(6 + d * 8)}">${d}</tspan>`
  const values = Array.from({ length: top + 1 }, (_, d) => `0 ${-d * 8}`).join(';')
  return (
    `<svg x="${n(x)}" y="0" width="${n(HEAD_W)}" height="8"><g><text>${digits}</text>` +
    `<animateTransform attributeName="transform" type="translate" values="${values}" calcMode="discrete" dur="${(top + 1) * step}s" repeatCount="indefinite"/></g></svg>`
  )
}

/** The page furniture: the header row with its ticking clock, and the Fastext row of four colored links. */
function frame(sw: number, h: number): string {
  // The date is a frozen literal, as the gallery's page fakes its clock: only the seconds
  // tick. The slash before them is Ceefax's own, not a typo.
  const right = 'THU 22 OCT 21:00/'
  const rx = sw - 3 - (right.length + 2) * HEAD_W
  const links: [string, Hue][] = [
    ['READ', 'R'],
    ['EDIT', 'G'],
    ['RUN', 'Y'],
    ['NEXT', 'C'],
  ]
  return (
    `<g font-family="${TYPE}" font-size="${HEAD}" font-weight="700">` +
    `<rect width="${n(sw)}" height="8" fill="${K.k}"/>` +
    `<text x="3" y="6" fill="${K.W}">P101  FABLES 101</text>` +
    `<text x="${n(rx)}" y="6" fill="${K.Y}">${right}</text>` +
    `<g fill="${K.Y}">${ticker(rx + right.length * HEAD_W, 5, 10)}${ticker(rx + (right.length + 1) * HEAD_W, 9, 1)}</g>` +
    `<rect y="${h - 8}" width="${n(sw)}" height="8" fill="${K.k}"/>` +
    links.map(([word, c], i) => `<text x="${n(3 + (i * sw) / 4)}" y="${h - 2}" fill="${K[c]}">${word}</text>`).join('') +
    `</g>`
  )
}

export const TELETEXT: Look = {
  name: 'teletext',
  label: 'Teletext Page',
  voice: 'a 1980s teletext page: terse, in capitals where it counts, page numbers and all',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: 5.7,
  caption: { fill: K.k, stroke: K.B, ink: K.W, radius: 0 },
  paper: { card: K.k, ink: K.W, kinds: { code: K.C, path: K.G, fn: K.M, num: K.Y, bad: K.R, good: K.G, face: K.Y } },
  inset: 8,
  titleColor: K.Y,
  // The medium: the whole page, Claude and all, is set in mosaic blocks on one grid.
  grade: () => cells('SourceGraphic', SIX, 'set'),
  edge: K.k,
  art: {
    painter: scenery,
    hero,
    sky: K.k,
    ground: K.k,
    defs,
  },
  frame,
  // The page's title: yellow capitals on a blue band, from the screen's left edge.
  tag: (text, inset) => {
    const t = escape(text.toUpperCase())
    const y = inset + 1
    const w = text.length * 6 + 18
    return {
      svg:
        `<rect x="0" y="${y}" width="${n(w)}" height="11" fill="${K.B}"/>` +
        `<text x="9" y="${y + 8.5}" font-family="${TYPE}" font-size="9" font-weight="700" fill="${K.Y}">${t}</text>`,
      w: w + 4,
      h: y + 13,
    }
  },
  bubble: {
    font: TYPE,
    size: 9,
    charW: 6,
    line: 12,
    base: 13,
    // A boxed subtitle: black, framed in blue blocks, a stepped tail of cyan blocks down to Claude.
    draw: ({ x, y, w, h }, { base, tip }) => {
      const mx = (base[0][0] + base[1][0]) / 2
      const my = (base[0][1] + base[1][1]) / 2
      let steps = ''
      for (let k = 0; k <= 4; k++) {
        const px = mx + ((tip[0] - mx) * k) / 4
        const py = my + ((tip[1] - my) * k) / 4
        steps += `M${n(px - 1.5)} ${n(py - 1.5)}h3v3h-3z`
      }
      return (
        `<path fill="${K.C}" d="${steps}"/>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${K.k}" stroke="${K.B}" stroke-width="2"/>`
      )
    },
  },
}

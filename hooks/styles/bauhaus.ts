/**
 * Bauhaus, after the gallery's "Bauhaus: Dessau, 1920s" (index.html, style 12,
 * `bauhaus`): Clawd built from primary primitives, with zero outline.
 *
 * The art bible, translated from the gallery's poster to the Fables' worlds:
 *
 * - The medium is the Dessau poster: flat planes of the three primaries (red,
 *   yellow, blue) with black and a cream sheet, cut as circle, square,
 *   triangle and bar. Nothing is outlined, shaded or graded: a plane meets
 *   the next edge to edge, and a light that catches an edge is not drawn.
 *   Distance is told in tints: pale far off, a primary in the middle
 *   distance, black up close.
 * - The sky is the sheet itself, one flat color: cream at dawn, a warmer
 *   cream at sunset, Bauhaus blue at the city's blue hour, deep blue over
 *   the village at night, black over the moon, a dark ink at the eruption.
 *   Across it lie the plate's soft diagonal band and its big pale circle, and
 *   its three primitives (a red square, a blue circle, a yellow square) drift
 *   over everything far off, never crossed by a cloud, each world setting
 *   them a little differently.
 * - The sun is a primary disc set in the big circle: yellow at dawn, red at
 *   sunset. The moon is a cream half disc in a big circle of lighter blue;
 *   the Earth a blue circle, its day side a cream half disc. At the eruption
 *   the big circle is red, and the cone stands in it as a black triangle.
 * - Stars are cream squares, the smallest primitive, with no sparkle or
 *   streak. Clouds are a bar with a half disc standing on it, in the sheet's
 *   tint; the eruption's ash is one grey plane built the same way, a bar
 *   with three half discs on it. Mist is a run of long thin bars; a veil of
 *   mist between rows of trees is a transparent plane, as in Moholy-Nagy's
 *   constructions. Shafts of light are transparent yellow wedges, glows flat
 *   transparent yellow planes.
 * - Land and rock are flat planes: far ridges in pale tints, hills blue at
 *   night, mesas red, stone grey, boulders black. Firs are triangles stacked
 *   in three tiers, split down the middle into a shade half and a light
 *   half, yellow where the sun is on them; shrubs are clusters of discs;
 *   ferns are fans of thin black wedges; grass is black spikes; bark is
 *   black bars. No rim of light runs along a crest or a ridge.
 * - The ground is one flat plane, and Claude walks on the plate's heavy rule,
 *   drawn across the whole stage under his feet: black on a light ground,
 *   cream on a dark one.
 * - Buildings are rectangles in greys, cream and black, their lit windows
 *   yellow squares; a cottage is a cream square under a red triangle. Glass
 *   is blue. Water and polished floors keep no reflection, as a poster has none.
 * - Fire is red and yellow planes: lava a yellow ribbon, embers yellow and
 *   red squares, cracks red bars. Lamps are yellow, their pools flat yellow
 *   ellipses.
 * - Life and particles are small primitives in the primaries: leaves red
 *   and black chips, fireflies and sparks yellow, litter red flecks.
 * - Night: the sheet goes deep blue or black, the far planes take lighter
 *   blues so they stand off it, the drifting blue circle goes pale, and
 *   black turns to cream wherever it would vanish into the dark: the rule,
 *   Claude's legs and back.
 * - Claude is the gallery's figure: a red front, a yellow top, blue sides, a
 *   black back, yellow nubs, black bars for legs (cream on a dark ground),
 *   black stadium eyes each with a white dot, a black bar when closed. No
 *   outline, no shadow: he stands on the rule.
 * - The frame is the poster's cream margin. The chapter tag is set in bold
 *   lowercase with a red square and a heavy rule; the caption is a white
 *   card with heavy black bars along two sides and a red square in its corner.
 */
import type { HeroPainter } from '../hero3d'
import type { Model } from '../clawd3d'
import { dropBlooms, isGreen, isWarm, lum, meanOf, num as n, type PaintAttr, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import { type Family, type Painter, type Role, ROLES } from '../art/roles'
import type { Look } from '../looks'

/** The plate's colors. */
const C = { paper: '#efe8d8', circle: '#e6d7b8', band: '#e0d7c4', red: '#d4392b', blue: '#1f4fa0', yellow: '#f2b31a', black: '#1c1b19', white: '#f8f4ea' }
/** The width of a character of the sans at the caption's size: the bubble's measure, and the tag's after scaling. */
const CHAR_W = 5.2
/** The caption's size and the tag's, which is set a little larger and bold. */
const BUBBLE_SIZE = 9
const TAG_SIZE = 9.5
/** A bold character's width over a regular one's. */
const BOLD = 1.08
const SANS = "Futura, 'Century Gothic', 'Avenir Next', Avenir, 'Helvetica Neue', Arial, sans-serif"

/** Tints, dark to light: the neutral greys, and each primary with its shade and tint. */
const GREY = [C.black, '#3d3a34', '#6e695f', '#a39b89', '#cbc1aa', '#e2d8c2'] as const
const BLUE = ['#0f1f40', '#1a3a78', C.blue, '#4f76b8', '#8fa8d2', '#c3d0e6'] as const
const RED = ['#6e1e17', '#a82c20', C.red, '#e2735e', '#efab9c'] as const
const SAND = ['#c98a4e', '#ddb27a', '#ecd2a2', '#f4e4c4'] as const
/** The lab's walls by night: a dark plane, the lamp's light on it a lighter one. */
const WALL = ['#222120', '#2a2826', '#36322b', '#463f33', '#5a5040'] as const

type World = 'forest' | 'space' | 'city' | 'desert' | 'volcano' | 'lab' | 'night'
/** Each world's sheet: the sky's flat color, the big circle, the band, the rule, and whether it is dark. */
const SHEETS: Record<World, { sky: string; circle: string; band: string; rule: string; dark: boolean }> = {
  forest: { sky: C.paper, circle: C.circle, band: C.band, rule: C.black, dark: false },
  desert: { sky: '#f2e4c6', circle: '#f4cf72', band: '#ead6ae', rule: C.black, dark: false },
  city: { sky: '#2d5596', circle: '#3d67aa', band: '#284d8b', rule: C.paper, dark: true },
  space: { sky: C.black, circle: '#33312d', band: '#262522', rule: C.black, dark: true },
  volcano: { sky: '#1f1c26', circle: '#a82c20', band: '#28242f', rule: C.paper, dark: true },
  lab: { sky: '#2a2a30', circle: '#36363e', band: '#303037', rule: C.paper, dark: true },
  night: { sky: '#172a52', circle: '#203a6e', band: '#1b315f', rule: C.paper, dark: true },
}
/** The world being painted, and the element: the sheet and the role decide every ink. */
let world: World = 'forest'
let roleNow: Role = 'particles'
const sheet = () => SHEETS[world]

/** Claude's feet: where the rule runs. */
const floorOf = (w: World) => (w === 'space' ? 96 : 104)
/** The element each world's rule is drawn with: the ground plane Claude walks on. */
const RULE_ROLE: Record<World, Role> = {
  forest: 'forest.path',
  space: 'space.regolith',
  city: 'city.street',
  desert: 'desert.sand',
  volcano: 'volcano.plain',
  lab: 'lab.floor',
  night: 'night.path',
}

/** Families whose lit edges (a ridge's rim, a mesa's gullies, a needle's glint) a flat plane does without. */
const RIMLESS: readonly Family[] = ['land', 'rock', 'foliage', 'grass', 'bark']

/** The ink curve: the gamma by day and in the dark worlds, and the gain. */
const DAY_GAMMA = 0.8
const DARK_GAMMA = 0.55
const GAIN = 1.1

/** A lit color as the poster's ink, by what it is and how far off. */
function ink(color: string, family: Family, depth: number, attr: PaintAttr = 'fill'): string {
  const s = sheet()
  const l = lum(color)
  // Lightness spread out, more so in the dark worlds, so a dim lit scene still uses the whole ramp:
  // a gamma under 1 lifts the dim tones, and a gain over 1 lets the brightest reach the ramp's top step.
  const t = Math.min(1, Math.pow(l, s.dark ? DARK_GAMMA : DAY_GAMMA) * GAIN)
  const warm = isWarm(color)
  const green = isGreen(color)
  const far = depth < 0.25
  const near = depth >= 0.8
  if (attr === 'stroke' && (RIMLESS.includes(family) || (family === 'built' && warm))) return 'none'
  switch (family) {
    case 'sky':
      return s.sky
    case 'fire':
      // Cracks in the crust are red bars, so the lava ribbon is the one yellow on the plain.
      if (roleNow === 'volcano.cracks') return RED[1]
      return l > 0.6 ? C.yellow : l > 0.25 ? C.red : RED[0]
    case 'lamp':
      return warm || l > 0.5 ? C.yellow : s.dark ? GREY[1] : GREY[2]
    case 'body':
    case 'glow':
    case 'beam':
    case 'stars':
      return warm ? C.yellow : C.white
    case 'life':
      return warm ? (l > 0.5 ? C.yellow : C.red) : green ? (s.dark ? BLUE[3] : C.black) : s.dark ? C.white : C.black
    case 'cloud':
    case 'air':
      return world === 'volcano' ? GREY[1] : s.dark ? s.circle : C.circle
    case 'foliage':
      if (far) return s.dark ? step(BLUE.slice(1, 4), t) : step(GREY.slice(3, 6), t)
      if (near) return C.black
      return s.dark ? step(BLUE.slice(0, 3), t) : step(BLUE.slice(1, 4), t)
    case 'grass':
      if (far) return s.dark ? BLUE[2] : GREY[4]
      if (near) return C.black
      return s.dark ? step(BLUE.slice(0, 2), t) : step(BLUE.slice(1, 3), t)
    case 'bark':
      return far ? (s.dark ? BLUE[1] : GREY[3]) : C.black
    case 'land':
      if (world === 'space') return step(GREY.slice(3, 6), t)
      if (warm) return far ? RED[4] : step(RED.slice(1, 4), t)
      if (s.dark) return far ? step(BLUE.slice(1, 4), t) : step(BLUE.slice(0, 4), t)
      if (green) return far ? GREY[4] : step(BLUE.slice(1, 4), t)
      return far ? step(GREY.slice(3, 6), t) : step(GREY.slice(2, 6), t)
    case 'rock':
      if (near) return C.black
      if (world === 'desert' || warm || brown(color)) return far ? step(RED.slice(3), t) : step(RED.slice(1, 4), t)
      return world === 'space' ? step(GREY.slice(2, 6), t) : s.dark ? step(GREY.slice(0, 3), t) : step(GREY.slice(1, 5), t)
    case 'ground':
    case 'mark':
      // The path's worn edges are not drawn: the rule is the only line on the ground.
      if (family === 'mark' && warm) return attr === 'stroke' && world === 'forest' ? 'none' : C.red
      if (world === 'space') return step(GREY.slice(3, 6), t)
      if (world === 'desert') return warm || brown(color) ? step(SAND, t) : step(GREY.slice(1, 5), t)
      if (green) return s.dark ? step(BLUE.slice(0, 2), t) : step(BLUE.slice(1, 3), t)
      return s.dark ? step(GREY.slice(0, 3), t) : step(GREY.slice(2, 6), t)
    case 'built':
      if (roleNow === 'lab.wall') return step(WALL, t)
      // In the city the warm light on a tower's edge is not drawn; the train's lit windows are yellow squares.
      if (warm && world === 'city') return roleNow === 'city.train' ? C.yellow : 'none'
      if (warm) return step(RED.slice(1, 4), t)
      if (far) return s.dark ? step(GREY.slice(2, 6), t) : step(GREY.slice(3, 6), t)
      return s.dark ? step(GREY.slice(0, 5), t) : step(GREY.slice(1, 6), t)
    case 'glass':
    case 'water':
      return warm ? C.yellow : step(BLUE, t)
    default:
      return step(GREY, t)
  }
}

/** How much more red than blue a color needs to count as brown. */
const BROWN_MARGIN = 18

/** Browns and tans: earth, sand, wood, warm but unlit. */
function brown(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r > b + BROWN_MARGIN && r >= g
}

/** A seeded sequence, so the same stage always lays its bars in the same places. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** The extent of the absolute points in path data (M, L, Q and C coordinates; not arcs or relative steps). */
function extent(d: string): { x0: number; x1: number; y0: number; y1: number } {
  const xs: number[] = []
  const ys: number[] = []
  for (const m of d.matchAll(/(-?[\d.]+)[ ,](-?[\d.]+)/g)) {
    xs.push(Number(m[1]))
    ys.push(Number(m[2]))
  }
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}

// ---------------------------------------------------------------- the redraws

/** The big circle's radius where no sun, moon or glow sets it. */
const CIRCLE_R = 58

/** The sheet: one flat color, the plate's soft diagonal band, and its big circle where no sun stands. */
function sky(c: Ctx): string {
  const s = sheet()
  const sw = c.meta.sw ?? 640
  const band = `<path fill="${s.band}" d="M0 92L${n(sw)} 30v14L0 106z"/>`
  // Where no sun, moon or glow brings its own, the big circle stands at the right of the sheet.
  const circle = world === 'city' ? `<circle cx="${n(sw * 0.7)}" cy="40" r="${CIRCLE_R}" fill="${s.circle}"/>` : ''
  return `<rect width="${n(sw)}" height="128" fill="${s.sky}"/>` + band + circle
}

/**
 * The plate's red square, blue circle and yellow square, drifting each on its
 * own slow beat. They are laid with the rule, late in the stage, so no cloud,
 * mist or tower crosses them; each world shifts them a little, by its own seed.
 */
function primitives(sw: number): string {
  const s = sheet()
  const rand = seeded([...world].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7))
  const dx = (rand() - 0.5) * sw * 0.08
  const dy = (rand() - 0.5) * 6
  const yx = Math.min(sw * 0.95, sw * 0.94 + (rand() - 0.5) * sw * 0.05)
  const yy = 16 + (rand() - 0.5) * 8
  const drift = (dy: number, dur: number) => `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${dy};0 0" dur="${dur}s" repeatCount="indefinite"/>`
  return (
    `<rect x="${n(sw * 0.3 + dx)}" y="${n(10 + dy)}" width="11" height="11" fill="${C.red}">${drift(3, 5.7)}</rect>` +
    `<circle cx="${n(sw * 0.3 + dx + 19)}" cy="${n(31 + dy)}" r="4" fill="${s.dark ? BLUE[4] : C.blue}">${drift(-4, 7)}</circle>` +
    `<rect x="${n(yx)}" y="${n(yy)}" width="9" height="9" fill="${C.yellow}">${drift(2.5, 4.8)}</rect>`
  )
}

/**
 * Stars: cream squares, the smallest primitive, sized by the source (a dim
 * star 1.2, a bright one 1.6, a big one from its radius up to 2). The lit
 * painting's sparkle crosses and shooting streak are glints, and not drawn.
 */
function stars(svg: string, c: Ctx): string {
  const lit = dropBlooms(svg)
  const sq = (x: number, y: number, s: number) => `M${n(x)} ${n(y)}h${n(s)}v${n(s)}h${n(-s)}z`
  let dim = ''
  let bright = ''
  let twinkles = ''
  for (const m of lit.matchAll(/<path\b([^>]*?)(\/>|>([\s\S]*?)<\/path>)/g)) {
    const attrs = m[1] ?? ''
    if (/\sstroke="/.test(attrs)) continue
    const d = /\sd="([^"]*)"/.exec(attrs)?.[1] ?? ''
    const op = Number(/\sopacity="([\d.]+)"/.exec(attrs)?.[1] ?? 1)
    const size = op < 0.5 ? 1.2 : 1.6
    let path = ''
    for (const p of d.matchAll(/M([\d.-]+) ([\d.-]+)/g)) path += sq(Number(p[1]), Number(p[2]), size)
    if (!path) continue
    const anim = c.motion(m[3] ?? '')
    if (anim) twinkles += `<path fill="${C.white}" d="${path}">${anim}</path>`
    else if (op < 0.5) dim += path
    else bright += path
  }
  for (const m of lit.matchAll(/<circle\b[^>]*?\scx="([\d.-]+)"[^>]*?\scy="([\d.-]+)"[^>]*?\sr="([\d.]+)"[^>]*\/>/g)) {
    const s = Math.max(1.2, Math.min(2, Number(m[3]) * 2.4))
    bright += sq(Number(m[1]) - s / 2, Number(m[2]) - s / 2, s)
  }
  // The Milky Way's band is kept as the general rules paint it; only its dust is squared.
  const band = (lit.match(/<ellipse\b[^>]*\/>/g) ?? []).join('')
  return (
    (band ? c.repaint(band) : '') +
    (dim ? `<path fill="${C.white}" opacity=".55" d="${dim}"/>` : '') +
    (bright ? `<path fill="${C.white}" d="${bright}"/>` : '') +
    twinkles
  )
}

/** The sun, the moon and the Earth as primitives, each set in the big circle. */
function body(c: Ctx): string {
  const s = sheet()
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 8
  const at = `cx="${n(cx)}" cy="${n(cy)}"`
  // Each body's big circle and disc, as multiples of the lit painting's radius: the sun's halo and disc,
  // the moon's circle and lit half, the Earth's circle.
  const HALO = 7
  const SUN = 1.6
  const MOON_CIRCLE = 5.5
  const MOON = 1.4
  const EARTH_CIRCLE = 1.9
  // A half disc, its straight side upright: the moon's lit half, the Earth's day side.
  const half = (rr: number, fill: string) => `<path fill="${fill}" d="M${n(cx)} ${n(cy - rr)}a${n(rr)} ${n(rr)} 0 0 1 0 ${n(rr * 2)}z"/>`
  if (c.role === 'space.earth') return `<circle ${at} r="${n(r * EARTH_CIRCLE)}" fill="${s.circle}"/><circle ${at} r="${n(r)}" fill="${C.blue}"/>` + half(r, C.white)
  if (c.role === 'night.moon') return `<circle ${at} r="${n(r * MOON_CIRCLE)}" fill="${s.circle}"/>` + half(r * MOON, C.white)
  // The sun: the big circle with the halo, the disc with the core.
  if (c.meta.part === 'halo') return `<circle ${at} r="${n(r * HALO)}" fill="${s.circle}"/>`
  return `<circle ${at} r="${n(r * SUN)}" fill="${world === 'desert' ? C.red : C.yellow}"/>`
}

/** Clouds: a bar with a half disc standing on it, in the sheet's tint, where the lit painting drew a streak. */
function cloud(svg: string, c: Ctx): string {
  const fill = ink('#ffffff', 'cloud', c.depth)
  let out = ''
  for (const m of svg.matchAll(/d="M([\d.-]+) ([\d.-]+)q[\d.-]+ [\d.-]+ ([\d.]+) [\d.-]+q[\d.-]+ [\d.-]+ ([\d.]+) [\d.-]+q-/g)) {
    const x = Number(m[1])
    const y = Number(m[2])
    const w = Number(m[3]) + Number(m[4])
    const r = Math.min(9, w * 0.11)
    out += `M${n(x)} ${n(y - 1.2)}h${n(w)}v3.6h${n(-w)}zM${n(x + w * 0.3)} ${n(y - 1.2)}a${n(r)} ${n(r)} 0 0 1 ${n(r * 2)} 0z`
  }
  if (out) return `<path fill="${fill}" d="${out}"/>`
  // A cloud that is not a streak (the volcano's ash, its puffs) is one flat plane in its own shape.
  return `<g>${c.repaint(svg).replace(/\s(fill|stroke)="(?!none)[^"]*"/g, ` $1="${fill}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`
}

/**
 * The eruption's ash: one flat grey plane built like the clouds, a bar along
 * the foot of the column with three half discs standing on it, over the
 * extent of the lit painting's billows; it drifts as they did.
 */
function ash(svg: string, c: Ctx): string {
  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity
  for (const m of svg.matchAll(/M([\d.-]+) ([\d.-]+)a([\d.]+) ([\d.]+) 0 1 0 ([\d.]+) 0/g)) {
    const [x = 0, y = 0, , ry = 0, w = 0] = [1, 2, 3, 4, 5].map(i => Number(m[i]))
    x0 = Math.min(x0, x)
    x1 = Math.max(x1, x + w)
    y0 = Math.min(y0, y - ry)
    y1 = Math.max(y1, y + ry)
  }
  if (!Number.isFinite(x0)) return cloud(svg, c)
  const W = x1 - x0
  const H = y1 - y0
  const bar = Math.max(4, H * 0.3)
  const foot = y1 - bar
  // Three half discs on the bar, the middle one the tallest, together a little narrower than the bar.
  const discs = ([[0.06, 0.26, 0.55], [0.3, 0.42, 1], [0.7, 0.24, 0.6]] as const)
    .map(([at, k, tall]) => {
      const r = Math.min(W * k * 0.5, (H - bar) * tall)
      return `M${n(x0 + W * at)} ${n(foot)}a${n(r)} ${n(r)} 0 0 1 ${n(r * 2)} 0z`
    })
    .join('')
  return `<g><path fill="${GREY[1]}" d="M${n(x0)} ${n(foot)}h${n(W)}v${n(bar)}h${n(-W)}z${discs}"/>${c.motion(svg)}</g>`
}

/** Mist: long thin bars in the sheet's tint, staggered, drifting as the mist did. */
function mist(svg: string, c: Ctx): string {
  const s = sheet()
  const sw = c.meta.sw ?? 640
  const y = c.meta.y ?? 80
  const h = c.meta.h ?? 12
  // A veil between rows of trees is a transparent plane laid over the row behind.
  if (c.meta.veil) return `<rect x="0" y="${n(y + h * 0.3)}" width="${n(sw)}" height="${n(h * 0.7)}" fill="${s.sky}" opacity=".45"/>`
  const rand = seeded(Math.round(y * 7 + h))
  const th = Math.max(1.2, Math.min(2.6, h * 0.12))
  // Low over the ground a single run of bars; higher, two.
  const rows = c.role === 'forest.groundmist' ? [0.5] : [0.45, 0.8]
  let d = ''
  rows.forEach((k, row) => {
    for (let x = -20 + rand() * 60 + row * 40; x < sw; ) {
      const len = 40 + rand() * 120
      d += `M${n(x)} ${n(y + h * k)}h${n(len)}v${n(th)}h${n(-len)}z`
      x += len + 40 + rand() * 100
    }
  })
  return `<g><path fill="${s.dark ? s.circle : C.white}" d="${d}"/>${c.motion(svg)}</g>`
}

/** A cottage: a cream square under a red triangle, the lit one with a yellow window. */
function cottages(svg: string): string {
  let walls = ''
  let roofs = ''
  for (const m of svg.matchAll(/d="M([\d.-]+) ([\d.-]+)v-([\d.]+)l([\d.]+) -([\d.]+)l/g)) {
    const [x = 0, y = 0, h = 0, hw = 0, roof = 0] = [1, 2, 3, 4, 5].map(i => Number(m[i]))
    walls += `M${n(x)} ${n(y)}v${n(-h)}h${n(hw * 2)}v${n(h)}z`
    roofs += `M${n(x - 1)} ${n(y - h)}l${n(hw + 1)} ${n(-roof - 1)}l${n(hw + 1)} ${n(roof + 1)}z`
  }
  const lit = /<rect x="([\d.-]+)" y="([\d.-]+)" width="2" height="2" fill="#ffd27a"\/>/.exec(svg)
  return `<path fill="${C.white}" d="${walls}"/><path fill="${C.red}" d="${roofs}"/>` + (lit ? `<rect x="${lit[1]}" y="${lit[2]}" width="2.4" height="2.4" fill="${C.yellow}"/>` : '')
}

/**
 * The lit painting's templates redrawn as the plate's primitives: a fir as
 * three stacked triangles split into a shade half and a light half, its rim
 * the sunward halves in yellow; a shrub as its discs alone; a fern's frond
 * as a thin wedge, so a fern is a fan; a clump of grass as three spikes.
 */
function templates(svg: string): string {
  const fir = (d: string, half: 'both' | 'left' | 'right') => {
    const e = extent(d)
    const H = e.y1 - e.y0
    const W = Math.max(-e.x0, e.x1)
    let out = ''
    for (const [top, bottom, w] of [[0, 0.42, 0.5], [0.2, 0.7, 0.75], [0.42, 1, 1]] as const) {
      const ya = e.y0 + H * top
      const yb = e.y0 + H * bottom
      const hw = W * w
      out +=
        half === 'both'
          ? `M0 ${t1(ya)}L${t1(hw)} ${t1(yb)}H${t1(-hw)}z`
          : `M0 ${t1(ya)}L${t1(half === 'left' ? -hw : hw)} ${t1(yb)}H0z`
    }
    return out
  }
  return svg
    .replace(/<g id="(sc-fir\d+)"><path d="([^"]*)"\/>[\s\S]*?<\/g>/g, (_all, id: string, d: string) => `<g id="${id}"><path d="${fir(d, 'both')}"/><path fill="currentColor" d="${fir(d, 'left')}"/></g>`)
    .replace(/<path id="(sc-firrim\d+)"[^>]*\/>/g, (_all, id: string) => {
      const body = new RegExp(`<g id="${id.replace('rim', '')}"><path d="([^"]*)"`).exec(svg)?.[1] ?? ''
      return `<path id="${id}" fill="${C.yellow}" d="${body ? fir(body, 'right') : ''}"/>`
    })
    .replace(/<g id="(sc-shrub\d+)">(<path[^>]*\/>)[\s\S]*?<\/g>/g, (_all, id: string, first: string) => `<g id="${id}">${first}</g>`)
    .replace(/<g id="(sc-shrublit\d+)">[\s\S]*?<\/g>/g, (_all, id: string) => `<g id="${id}"/>`)
    .replace(/<path id="sc-frond" d="[^"]*"\/>/, '<path id="sc-frond" d="M-1.5 0L.2 -30L1.5 0z"/>')
    .replace(/<path id="(sc-clump\d+)" d="([^"]*)"\/>/g, (_all, id: string, d: string) => {
      const e = extent(d)
      const w = (e.x1 - e.x0) / 3
      let out = ''
      for (const [k, h] of [[0, 0.7], [1, 1], [2, 0.8]] as const) out += `M${t1(e.x0 + w * k)} 0L${t1(e.x0 + w * (k + 0.5))} ${t1(e.y0 * h)}L${t1(e.x0 + w * (k + 1))} 0z`
      return `<path id="${id}" d="${out}"/>`
    })
}

/** The heavy rule Claude walks on, across the whole stage. */
const rule = (sw: number) => `<rect x="0" y="${floorOf(world)}" width="${n(sw)}" height="2.6" fill="${sheet().rule}"/>`

const scenery = (sw: number): Painter => {
  world = 'forest'
  const p = painter(
    {
      ink: (color, family, depth, attr) => ink(color, family, depth, attr),
      // A gradient is one flat plane in its overall tone; a faint wash of light is not drawn.
      url: (_id, family, attr, g) => {
        if (!g) return undefined
        const mean = meanOf(g)
        if (attr !== 'stroke' && mean.opacity < 0.4) return 'none'
        return ink(mean.color, family, ROLES[roleNow].depth, attr)
      },
      // A poster is flat: a shape is there or it is not, but light may lie on it as a transparent plane.
      opacity: (family, v) => (family === 'glow' || family === 'beam' || family === 'stars' ? v : v >= 0.45 ? 1 : 0),
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.8)}" ry="${n(Math.max(1.2, e.ry * 0.7))}" fill="${C.yellow}" opacity=".55"/>`,
      redraw: {
        sky: (_svg, c) => sky(c),
        body: (_svg, c) => body(c),
        lens: () => '',
        water: () => '',
        cloud,
        'volcano.ash': ash,
        air: mist,
        'night.cottages': svg => cottages(svg),
        // The cone: a black triangle standing in the red circle.
        'volcano.cone': (svg, c) => (c.meta.d ? `<path fill="${C.black}" d="${c.meta.d}"/>` : c.repaint(svg)),
        // Shafts of light are transparent yellow wedges.
        beam: (svg, c) => `<g opacity=".2">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${C.yellow}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`,
        // Glows are flat transparent planes; the eruption's glow is the big circle, red.
        glow: (svg, c) => {
          // The circle sits a little below the crater, so the cone's apex stands inside it.
          if (c.role === 'volcano.glow') return `<circle cx="${n(c.meta.cx ?? 0)}" cy="${n((c.meta.cy ?? 0) + 6)}" r="${CIRCLE_R - 4}" fill="${sheet().circle}"/>`
          // The sun's patch on the forest floor: one solid yellow lozenge, low and flat, the grass standing in it.
          if (c.role === 'forest.sunpatch') {
            const rx = Number(/rx="([\d.]+)"/.exec(svg)?.[1] ?? 60)
            return `<ellipse cx="${n(c.meta.cx ?? 0)}" cy="${n((c.meta.cy ?? 0) + 3)}" rx="${n(rx * 0.55)}" ry="3.2" fill="${C.yellow}"/>`
          }
          return `<g opacity=".35">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${C.yellow}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`
        },
        // With the ground Claude walks on come the rule and, above every cloud and tower, the plate's three primitives.
        ground: (svg, c) => {
          const w = c.meta.sw ?? sw
          return c.repaint(svg) + (c.role === RULE_ROLE[world] && !(world === 'space' && c.meta.part === 'open') ? rule(w) + primitives(w) : '')
        },
        stars,
        // The moon's light along the crest is a lit rim; the planes meet edge to edge.
        'night.crest': () => '',
      },
    },
    'bh',
  )
  return {
    el: (role, svg, meta) => {
      const w = role.split('.')[0] as World
      if (w in SHEETS) world = w
      roleNow = role
      return p.el(role, svg, meta)
    },
    defs: svg => templates(p.defs(svg)),
  }
}

// ---------------------------------------------------------------- Claude

/**
 * Claude as the plate builds him: each face a flat primary by the way it
 * faces, the nubs yellow, the legs black bars, no outline. Runs of one color
 * share a path, in painter's order; under the body its hull, so no seam shows
 * between its faces.
 */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  // The legs are black bars on a light ground, cream on a dark one; on the moon, where he leaps from pale dust into black sky, blue.
  const leg = world === 'space' ? C.blue : sheet().dark ? C.paper : C.black
  const FACE: Record<string, string> = { front: C.red, top: C.yellow, left: C.blue, right: C.blue, back: leg, bottom: leg }
  let out = ''
  let fill = ''
  let d = ''
  const put = (f: string, path: string) => {
    if (f !== fill && d) {
      out += `<path fill="${fill}" d="${d}"/>`
      d = ''
    }
    fill = f
    d += path
  }
  for (const pt of m.parts) {
    if (pt.name === 'body') {
      put(C.red, poly(pt.hull, cx, floor))
      for (const f of pt.faces) put(FACE[f.name] ?? C.red, poly(f.pts, cx, floor))
    } else put(pt.name === 'arm' ? C.yellow : leg, poly(pt.hull, cx, floor))
  }
  if (d) out += `<path fill="${fill}" d="${d}"/>`
  // The eyes: black stadiums each with a white dot; a closed, happy or dizzy eye is a black bar.
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${C.black}" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[2]?.[0] ?? 0) + cx)}" cy="${t1((e.poly[2]?.[1] ?? 0) + floor + 0.4)}" r=".55" fill="#fff"/>`
        : `<path fill="none" stroke="${C.black}" stroke-width="1.3" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return out + eyes
}

// ---------------------------------------------------------------- the poster around the scene

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const BAUHAUS: Look = {
  name: 'bauhaus',
  label: 'Bauhaus',
  voice: 'a terse Bauhaus manifesto: form, function, few words',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: CHAR_W,
  caption: { fill: C.white, stroke: C.black, ink: C.black, radius: 0 },
  paper: { card: '#fbf8f0', ink: C.black, kinds: { code: C.blue, path: C.blue, fn: '#8a5a00', num: C.red, bad: C.red, good: '#2e6b3a', face: C.red } },
  inset: 4,
  titleColor: C.black,
  art: {
    painter: scenery,
    hero,
    sky: C.paper,
    ground: C.black,
    defs: () =>
      // A poster's circles are true circles: drawn smooth, not snapped to the pixel.
      `<style>svg[data-look="bauhaus"]{shape-rendering:geometricPrecision}</style>` +
      // The sheet's grain: sparse flecks of pigment in the paper.
      `<filter id="bh-paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="12"/>` +
      `<feColorMatrix values="0 0 0 0 .35  0 0 0 0 .27  0 0 0 0 .16  -2.2 0 0 0 1.05"/></filter>`,
  },
  texture: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#bh-paper)" opacity=".12"/>`,
  // The poster's cream margin.
  frame: (sw, h) => `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${C.paper}" stroke-width="3"/>`,
  tag: (text, inset) => {
    // The chapter in bold lowercase on a white card: a red square before it, a heavy rule under it.
    const t = escape(text.toLowerCase())
    const x = inset + 4
    const y = inset + 4
    const w = Math.ceil(text.length * CHAR_W * (TAG_SIZE / BUBBLE_SIZE) * BOLD + 22)
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${w}" height="14" fill="#fbf8f0"/>` +
        `<rect x="${x}" y="${y}" width="10" height="10" fill="${C.red}"/>` +
        `<text x="${x + 14}" y="${y + 9.6}" font-family="${SANS}" font-size="${TAG_SIZE}" font-weight="700" fill="${C.black}">${t}</text>` +
        `<rect x="${x}" y="${y + 12}" width="${w}" height="2.4" fill="${C.black}"/>`,
      w: x + w + 4,
      h: y + 18,
    }
  },
  bubble: {
    font: SANS,
    size: BUBBLE_SIZE,
    charW: CHAR_W,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A white card, heavy black bars along its left and its foot, a red square in its corner; the tail a black wedge.
      `<path fill="${C.black}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#fbf8f0"/>` +
      `<path fill="${C.black}" d="M${n(x)} ${n(y)}h2.6v${n(h - 2.6)}h${n(w - 2.6)}v2.6H${n(x)}z"/>` +
      `<rect x="${n(x + w - 6)}" y="${n(y)}" width="6" height="6" fill="${C.red}"/>`,
  },
}

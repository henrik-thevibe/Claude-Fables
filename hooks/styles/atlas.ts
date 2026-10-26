/**
 * Celestial Atlas, after the gallery's "Celestial Atlas: the constellation
 * Clavdivs" (index.html, style 07, `atlas`), and the plate's own sources: the
 * engraved star atlases of Bayer, Hevelius and Flamsteed, and Burritt's
 * blue-ground charts of the heavens.
 *
 * The art bible, translated from the gallery's chart to the Fables' worlds:
 *
 * - Every scene is a plate of an old navy star chart. The ground of the plate
 *   is the night sky, deepest at the top; a conic grid is ruled over it in
 *   pale blue, hour circles converging on a pole above the plate and the
 *   parallels arcing round it, the equator dashed and lettered "Æquator"
 *   wherever the sky is open to it. The Milky Way runs across every sky as a
 *   soft band knotted with clumps, its spine stroked with granular star
 *   clouds and split by a broken dark rift.
 * - Stars are the chart's: field stars as crisp discs sized by magnitude, the
 *   brighter with fine crossed spikes and a Flamsteed number in tiny italics;
 *   the named stars Opus, Sonnet and Haiku as great twinkling stars with soft
 *   glows and diffraction spikes, lettered in italic Caslon; the neighbouring
 *   constellations Cursor (a pointer) and Terminalis (a prompt) joined by faint
 *   lines. Every name is set where the scene leaves the sky open: under the
 *   frame, beside its stars, or clear of a plume. Now and then a meteor
 *   crosses the chart. The scenes' own stars are set in among them as discs;
 *   the desert's hawk circles as Aquila, five stars along its wings.
 * - Day is the chart's twilight edition: the plate is the same navy, its stars
 *   fewer and the Milky Way and its rift fainter, the horizon hand-tinted in a thin
 *   wash taken from the scene's own dawn or dusk. Night is the full chart:
 *   the deep navy, every star out, the Milky Way bright.
 * - Sun, moon and earth are drawn as an atlas draws them and named in Latin:
 *   the sun is Sol, a great gold star over the ☉ of its symbol; the moon is
 *   Luna, a cream crescent with its full disc ghosted in earthshine; the
 *   earth is Tellus, an engraved globe ruled with meridians and parallels.
 * - Clouds are nebulae: a faint haze within a dotted contour, the way a chart
 *   marks nebulosity; smoke and ash are dark nebulae. Mist is drawn as the
 *   Milky Way is, a soft band of nebulosity powdered with its star dust. Beams
 *   of light are fans of dotted rays; a wash of lamplight on a wall is a faint
 *   pale nebula; the volcano's glow a warm one.
 * - Land, rock, buildings, bark, foliage and grass are the chart's allegorical
 *   figures: the sky knocked back into each shape a touch lighter, faint field
 *   stars and all, with a pale contour that firms toward the front and fades
 *   with distance; the deepest shade is laid in fine form lines, and the
 *   forest's framing trunks in broken vertical ones, as bark. Needles, blades
 *   and fronds take a hairline. The ground is the plate below the horizon, a
 *   darker navy stippled with dust.
 * - Glass is a lighter pane of sky: the lab's window is a pane of the chart,
 *   a sliver of the Milky Way crossing it with a few field stars and a great
 *   star, a far town's lights through it pinpoint stars. Water and wet streets
 *   mirror only faintly.
 * - Every light is a star. Windows are clusters of small stars, each in its
 *   own light's color (gold, a deeper gold for a dim one, white for a cool
 *   one), a cottage's or a train's as the city's; lamps and beacons are great
 *   stars with spikes, their pools on the ground nebulae in a dotted gold rim;
 *   fireflies, motes, sparks, clods and confetti are specks of stardust, rain
 *   fine meteor streaks.
 *   Fire is the plate's one hand-coloured ink: a gold-and-vermilion wash, the
 *   lava's courses traced as chains of gold stars, a river constellation like
 *   Eridanus; the crater is a gold star named Vulcanus, embers are sparks.
 * - Claude is the constellation CLAVDIVS, as the gallery draws him: a pale
 *   allegory figure, the sky knocked back into each part with faint form
 *   lines and pale contours, and over it the constellation itself, bright
 *   stars on his body's corners, his nubs' tips and his feet, joined by cream
 *   lines that stop short of each star, as on an engraved chart. His eyes are
 *   the brightest pair, each a star with a halo and spikes, lettered α and β;
 *   closed, happy and dizzy eyes become little asterisms, and a sleeper's Z's
 *   rise as four-star asterisms.
 * - The plate is framed by a graduated double rule with hour numerals along
 *   the top and declinations down the side; the chapter is a title cartouche,
 *   "Tab. I" and the chapter in spaced capitals; the caption is lettered on a
 *   legend cartouche whose pointer is a constellation line to a star at Claude.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, type ModelPart, type P2, outlinedOrder } from '../clawd3d'
import { isWarm, lum, meanOf, mix, num as n, type PaintAttr, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family, Painter } from '../art/roles'
import type { Look } from '../looks'

/** The plate's inks. */
const NAVY = '#142549'
const DEEP = '#0a1330'
const MARGIN = '#0f1c40'
/** A figure: the sky knocked back into its shape, a touch lighter; far figures nearer the sky. */
const FIG = '#1b3062'
const FAR = '#172a56'
const BELOW = '#0c1734'
const PALE = '#d6e2fc'
const CREAM = '#ece2c6'
const STAR = '#fbfcff'
/** Nebulosity: the Milky Way's band, a cloud's haze, a wash of light, mist. */
const NEB = '#c4d2ff'
/** The one hand-coloured ink: the sun, fire and lamplight. */
const GOLD = '#f2cd7c'
const LAMP = '#ffe6b0'
const EMBER = '#e0844a'

const SERIF = "'Iowan Old Style', Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
const CASLON = "'Big Caslon', 'Hoefler Text', Baskerville, 'Libre Baskerville', 'Times New Roman', serif"

// ---------------------------------------------------------------- the chart's geometry

/** The stage's height: the plate the sky is ruled on. */
const STAGE = 128
/** The celestial pole stands this far above the plate: hour circles converge on it, parallels arc round it. */
const POLE = 1250
/** Hour circles' spacing along the top of the plate. */
const HOUR = 116
/** The parallels: how far below the plate's top each crosses its middle, and its declination. The third is the equator. */
const DECS: readonly [number, string][] = [
  [18, '+20°'],
  [52, '+10°'],
  [86, '0°'],
  [120, '−10°'],
]
const EQUATOR = DECS[2]![0]

/** Where a parallel crosses x. */
const arcY = (sw: number, d: number, x: number) => -POLE + Math.sqrt((POLE + d) ** 2 - (x - sw / 2) ** 2)
const arc = (sw: number, d: number) => {
  const R = POLE + d
  return `M-10 ${n(arcY(sw, d, -10))}A${R} ${R} 0 0 0 ${n(sw + 10)} ${n(arcY(sw, d, sw + 10))}`
}
/** The hour circles on a plate `sw` wide, as offsets from its middle. */
const hours = (sw: number) => {
  const k = Math.ceil((sw / 2 + 30) / HOUR)
  return Array.from({ length: 2 * k + 1 }, (_, i) => i - k)
}
const ROMAN: readonly [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
function roman(v: number): string {
  let s = ''
  for (const [k, r] of ROMAN) while (v >= k) (s += r), (v -= k)
  return s
}
/** Right ascension grows eastward, to the left, as a chart is read: VII in the middle. */
const hourName = (k: number) => roman((((7 - k - 1) % 24) + 24) % 24 + 1)

/** A small seeded sequence, so the same plate always shows the same stars. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** A box on the plate (x0, y0, x1, y1). */
type Box = [number, number, number, number]
/** The boxes a sky's names are lettered in, so no field star is set on a letter, and no name on another. */
type Boxes = Box[]
const meets = (b: Box, boxes: Boxes) => boxes.some(([x0, y0, x1, y1]) => b[0] < x1 && b[2] > x0 && b[1] < y1 && b[3] > y0)
/** The box a name is lettered in. */
const labelBox = (x: number, y: number, text: string, size: number, anchor: string): Box => {
  const w = text.length * size * 0.46
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  return [x0 - 1.5, y - size * 0.85, x0 + w + 1.5, y + size * 0.35]
}
/** A name lettered on the chart, in italic Caslon (its face a class, defs); on a sky, its box is kept in `boxes`. */
const label = (x: number, y: number, text: string, size = 4.6, anchor = 'start', opacity = 0.85, boxes?: Boxes) => {
  boxes?.push(labelBox(x, y, text, size, anchor))
  return `<text class="ca-t" x="${t1(x)}" y="${t1(y)}" font-size="${size}"${opacity === 0.85 ? '' : ` style="fill-opacity:${opacity}"`}${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}>${escape(text)}</text>`
}
/** A great star: glow, four spikes and a hot core, defined once; `kids` animate it. */
const bigStar = (x: number, y: number, k: number, extra = '', kids = '') =>
  `<use href="#ca-star" transform="translate(${t1(x)} ${t1(y)}) scale(${n(k)})"${extra}${kids ? `>${kids}</use>` : '/>'}`

// ---------------------------------------------------------------- the sky

/** The Milky Way: a soft band along one meandering course, clumped, powdered with star clouds and split by a broken dark rift; by day fainter. */
function milkyWay(sw: number, rand: () => number, night: boolean): string {
  const P = [[-30, 96], [sw * 0.24, 74], [sw * 0.52, 22], [sw + 30, -4]] as const
  const d = `M-30 96C${n(P[1][0])} 74 ${n(P[2][0])} 22 ${n(P[3][0])} -4`
  const k = night ? 1 : 0.6
  const band = (w: number, o: number, paint = '') => `<use href="#ca-mw"${paint} stroke-width="${w}" stroke-opacity="${n(o * k)}"/>`
  // Its clumps: soft knots of light strung along the course.
  let clumps = ''
  for (let i = 0; i < 6; i++) {
    const t = 0.08 + i * 0.16 + rand() * 0.06
    const u = 1 - t
    const x = u ** 3 * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t ** 3 * P[3][0]
    const y = u ** 3 * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t ** 3 * P[3][1]
    clumps += `<ellipse cx="${t1(x)}" cy="${t1(y + (rand() - 0.5) * 8)}" rx="${t1(16 + rand() * 18)}" ry="${t1(6 + rand() * 4)}" transform="rotate(-14 ${t1(x)} ${t1(y)})"/>`
  }
  return (
    `<defs><path id="ca-mw" d="${d}"/></defs>` +
    `<g fill="none" stroke="${NEB}" stroke-linecap="round">${band(50, 0.035)}${band(30, 0.045)}${band(15, 0.06)}</g>` +
    `<g fill="url(#ca-wash)" opacity="${n(0.9 * k)}">${clumps}</g>` +
    // The star clouds: the band stroked with fine stars, densest along its spine.
    `<g fill="none">${band(40, 0.5, ' stroke="url(#ca-dust)"')}${band(16, 0.75, ' stroke="url(#ca-dust2)"')}</g>` +
    // The rift: a broken dark lane, softened at its ends, a fainter lane beside it; by day as faint as the band it splits.
    `<g fill="none" stroke="${DEEP}" stroke-opacity="${n(0.3 * k)}" stroke-linecap="round"><use href="#ca-mw" stroke-width="3.4" stroke-dasharray="58 30 34 40 20 36" transform="translate(4 1.5)"/>` +
    `<use href="#ca-mw" stroke-width="1.5" stroke-dasharray="30 22 44 30" transform="translate(9 -1)"/></g>`
  )
}

/** The conic grid: hour circles toward the pole, parallels round it, the equator dashed and, where the sky is open, named. */
function grid(sw: number, named: boolean, boxes: Boxes): string {
  let d = ''
  for (const k of hours(sw)) d += `M${n(sw / 2 + k * HOUR)} 0L${n(sw / 2 + (k * HOUR * (POLE + STAGE)) / POLE)} ${STAGE}`
  for (const [dd] of DECS) if (dd !== EQUATOR) d += arc(sw, dd)
  const lx = sw - 58
  return (
    `<path d="${d}" fill="none" stroke="${PALE}" stroke-opacity=".2" stroke-width=".4"/>` +
    `<path d="${arc(sw, EQUATOR)}" fill="none" stroke="${PALE}" stroke-opacity=".36" stroke-width=".45" stroke-dasharray="3.2 2.6"/>` +
    (named ? label(lx, arcY(sw, EQUATOR, lx) - 1.6, 'Æquator', 3.8, 'start', 0.6, boxes) : '')
  )
}

/** The field stars: crisp discs by magnitude, the brighter crossed with spikes and numbered; fewer by day, none on a lettered name. */
function field(sw: number, rand: () => number, night: boolean, lettered: Boxes): string {
  const count = Math.round((sw / 640) * (night ? 150 : 95))
  let dim = ''
  let mid = ''
  let warm = ''
  let bright = ''
  let nums = ''
  for (let i = 0; i < count; i++) {
    const x = 8 + rand() * (sw - 16)
    const y = 8 + rand() ** 1.3 * 92
    const m = rand() ** 2.7
    // A bright star's spikes reach round it and its number runs off to its right, so it keeps a wider berth.
    const [l, r] = m > 0.5 ? [11, 3] : [0, 0]
    if (lettered.some(([x0, y0, x1, y1]) => x > x0 - l && x < x1 + r && y > y0 - r && y < y1 + r)) continue
    const at = `M${t1(x)} ${t1(y)}h0`
    if (m > 0.5) {
      bright += `<use href="#ca-x" x="${t1(x)}" y="${t1(y)}"/>`
      if (i % 3 === 0) nums += `<text x="${t1(x + 1.6)}" y="${t1(y - 1.1)}">${3 + Math.floor(rand() * 40)}</text>`
    } else if (m > 0.16) {
      if (rand() < 0.22) warm += at
      else mid += at
    } else dim += at
  }
  return (
    `<g fill="none" stroke-linecap="round"><path stroke="${STAR}" stroke-opacity=".5" stroke-width=".55" d="${dim}"/>` +
    `<path stroke="${STAR}" stroke-opacity=".85" stroke-width=".9" d="${mid}"/><path stroke="#ffe8c8" stroke-opacity=".8" stroke-width=".9" d="${warm}"/></g>` +
    bright +
    `<g font-family="${SERIF}" font-style="italic" font-size="3.2" fill="${CREAM}" fill-opacity=".5">${nums}</g>`
  )
}

/** The neighbouring constellations, Cursor (a pointer) and Terminalis (a prompt): stars, the links between them. */
const CURSOR: readonly P2[] = [[0, 0], [0, 17], [4.6, 13], [8.6, 20.5], [12, 12]]
const CURSOR_LINKS: readonly [number, number][] = [[0, 1], [1, 2], [2, 3], [2, 4], [4, 0]]
const TERMINALIS: readonly P2[] = [[0, 0], [7, 6], [0, 12], [10, 12.6], [18, 12.6]]
const TERMINALIS_LINKS: readonly [number, number][] = [[0, 1], [1, 2], [3, 4]]

/**
 * The names are laid out on the plate at its usual width, PLATE, as fractions of it. The title cartouche keeps
 * its size whatever the width: the widest title (24 capitals) ends at 212, and Sonnet's name reaches 16 left of
 * its star, so on a narrower plate the names are drawn in toward the span right of OPEN.
 */
const PLATE = 640
const OPEN = 230
/** Where a name laid out at fraction f stands: a wider plate spreads the names out, a narrower one draws them into the span right of the cartouche. */
const place = (sw: number, f: number) => (sw >= PLATE ? sw * f : OPEN + ((PLATE * f - OPEN) * (sw - OPEN)) / (PLATE - OPEN))

/**
 * The open sky the names are set in. On a full plate every name stands where it is laid out. On a narrow one a
 * name is set only where it fits (right of the cartouche, inside `right`, a little clear of the names already
 * set), and the stars it sets are kept clear too.
 */
type Room = { fits: (b: Box) => boolean; take: (b: Box) => void }
/** How far a name slides from where it is laid out to the nearest place its boxes fit (0 on a full plate); undefined if there is none within 40. */
function slide(room: Room, at: (dx: number) => Box[]): number | undefined {
  for (let i = 0; i <= 16; i++) {
    const dx = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 5
    if (at(dx).every(room.fits)) return dx
  }
  return undefined
}

/** A neighbouring constellation: its stars joined by faint lines, and its name; on a narrow plate, only if it fits. */
function neighbour(pts: readonly P2[], links: readonly [number, number][], ox: number, oy: number, k: number, name: string, lx: number, ly: number, boxes: Boxes, room: Room): string {
  const xs = pts.map(p => ox + p[0] * k)
  const ys = pts.map(p => oy + p[1] * k)
  const span = (dx: number): Box => [Math.min(...xs) + dx - 1, Math.min(...ys) - 1, Math.max(...xs) + dx + 1, Math.max(...ys) + 1]
  const ly0 = oy + ly * k
  const dx = slide(room, dx => [span(dx), labelBox(ox + lx * k + dx, ly0, name, 5, 'start')])
  if (dx === undefined) return ''
  room.take(span(dx))
  const P = pts.map(([x, y]) => [ox + dx + x * k, oy + y * k] as P2)
  const [x, y] = [ox + dx + lx * k, ly0]
  const d = links.map(([a, b]) => poly([P[a]!, P[b]!], 0, 0, false)).join('')
  return (
    `<path d="${d}" fill="none" stroke="${PALE}" stroke-opacity=".38" stroke-width=".4"/>` +
    `<path d="${P.map(([x, y]) => `M${t1(x)} ${t1(y)}h0`).join('')}" fill="none" stroke="${STAR}" stroke-width="1.3" stroke-linecap="round"/>` +
    label(x, y, name, 5, 'start', 0.85, boxes)
  )
}

/**
 * The named stars: great twinkling stars, lettered; Opus stands where the scene leaves it room, Haiku high over
 * a skyline. Opus is set first, then Sonnet, then Haiku, so on a narrow plate the last gives way.
 */
function named(at: (f: number) => number, opus: number, high: boolean, boxes: Boxes, room: Room): string {
  // Each star: where it stands (a fraction of the plate, and a height), its size, its name and where that is lettered.
  const stars: [number, number, number, string, number, number, string][] = [
    [0.37, 13, 0.85, 'Sonnet', -3, 1.6, 'end'],
    [opus, 11, 1.05, 'Opus', 4, 1.6, 'start'],
    high ? [0.93, 14, 0.7, 'Haiku', -3, 1.6, 'end'] : [0.93, 31, 0.7, 'Haiku', 0, 7.5, 'middle'],
  ]
  const out = ['', '', '']
  for (const i of [1, 0, 2]) {
    const [fx, y, k, name, dx, dy, anchor] = stars[i]!
    const r = 6.2 * k
    const star = (x: number): Box => [x - r, y - r, x + r, y + r]
    const move = slide(room, m => [star(at(fx) + m), labelBox(at(fx) + m + dx, y + dy, name, 4.4, anchor)])
    if (move === undefined) continue
    const x = at(fx) + move
    room.take(star(x))
    const twinkle = `<animate attributeName="opacity" values=".95;.65;.95" dur="${n(2.3 + i * 0.9)}s" begin="${-i}s" repeatCount="indefinite"/>`
    out[i] = bigStar(x, y, k, ` opacity=".9"`, twinkle) + label(x + dx, y + dy, name, 4.4, anchor, 0.85, boxes)
  }
  return out.join('')
}

/** Now and then a meteor crosses the chart. */
function meteor(sw: number): string {
  const x = sw * 0.62
  return (
    `<path d="M-30 -11L0 0" stroke="url(#ca-meteor)" stroke-width=".8" stroke-linecap="round" opacity="0" transform="translate(${n(x)} 18)">` +
    `<animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.02;.06;1" dur="11s" begin="-4s" repeatCount="indefinite"/>` +
    `<animateTransform attributeName="transform" type="translate" values="${n(x)} 18;${n(x + 60)} 40;${n(x + 60)} 40" keyTimes="0;.06;1" dur="11s" begin="-4s" repeatCount="indefinite"/></path>`
  )
}

/** The sky: the navy plate, hand-tinted at the horizon by day, with the Milky Way, the grid and the stars. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#203040'
  const low = stops[stops.length - 1]?.color ?? '#405060'
  const sw = c.meta.sw ?? 640
  const night = lum(top) < 0.2 && lum(low) < 0.45
  const rand = seeded(Math.round(sw) * 7 + 7007)
  // By day the horizon takes a thin hand-tinted wash of the scene's own dawn or dusk.
  const tint = night
    ? ''
    : `<defs><linearGradient id="ca-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(low, CREAM, 0.3)}" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="${mix(low, CREAM, 0.3)}" stop-opacity=".34"/></linearGradient></defs>` +
      `<rect y="34" width="${n(sw)}" height="94" fill="url(#ca-dawn)"/>`
  // The names go where the scene leaves the sky open. The title cartouche holds the top left, so every name
  // stands right of the widest one (24 capitals). The volcano's plume fills the top band from its crater
  // leftward, so there Terminalis hangs below it and Opus stands off the crater; elsewhere Terminalis keeps to
  // the clear band under the frame, its name beside it. The city's and the forest's skylines rise high, so
  // there Cursor and Haiku keep to that band too (in the city Cursor stands between Opus and Haiku, clear of
  // the spire and of a cloud), and the equator goes unnamed, as it does under the night's hills.
  // On a plate narrower than PLATE the names are drawn in toward the right (`place`) and each is set only where
  // it fits (`Room`): inside the frame, clear of the forest's canopy and of the volcano's plume, and of the
  // names set before it; the named stars are set first, so it is the neighbouring constellations that give way.
  const plume = c.role === 'volcano.sky'
  const skyline = c.role === 'city.sky' || c.role === 'forest.sky'
  const at = (f: number) => place(sw, f)
  // The names are lettered first, so the field stars can be set clear of them.
  const boxes: Boxes = []
  const narrow = sw < PLATE
  const right = sw - (c.role === 'forest.sky' ? 52 : 8)
  const room: Room = {
    fits: b => !narrow || (b[0] >= OPEN - 18 && b[2] <= right && !meets([b[0] - 2, b[1], b[2] + 2, b[3]], boxes)),
    take: b => void (narrow && boxes.push(b)),
  }
  // What else holds the top of a narrow plate: the plume, rising from the crater (at 0.72 of the plate) and
  // leaning left, with Vulcanus lettered right of it; the night's moon (at 0.8), with Luna lettered below it.
  if (plume) room.take([sw * 0.72 - 28, 0, sw * 0.72 + 42, 32])
  if (c.role === 'night.sky') room.take([sw * 0.8 - 12, 8, sw * 0.8 + 26, 40])
  const band = milkyWay(sw, rand, night)
  const ruled = grid(sw, !skyline && c.role !== 'night.sky', boxes)
  const stars = named(at, plume ? 0.79 : 0.71, skyline, boxes, room)
  const names =
    (skyline
      ? neighbour(CURSOR, CURSOR_LINKS, at(c.role === 'city.sky' ? 0.79 : 0.44), 8, 0.65, 'Cursor', 14, 10, boxes, room)
      : neighbour(CURSOR, CURSOR_LINKS, at(0.44), 18, 0.95, 'Cursor', 14, 10, boxes, room)) +
    (plume
      ? neighbour(TERMINALIS, TERMINALIS_LINKS, at(0.53), 20, 0.85, 'Terminalis', 0, 20, boxes, room)
      : neighbour(TERMINALIS, TERMINALIS_LINKS, at(0.53), 10, 0.85, 'Terminalis', 21, 10.5, boxes, room)) +
    stars
  return (
    `<rect width="${n(sw)}" height="${STAGE}" fill="url(#${night ? 'ca-skyn' : 'ca-sky'})"/>` +
    tint +
    band +
    ruled +
    field(sw, rand, night, boxes) +
    names +
    meteor(sw)
  )
}

/**
 * A light's star, by the light's own color: a warm one gold, a dim warm one a deeper gold, a cool one white.
 * Its ink is a class (defs) that sets its stroke's opacity whole, so a contour group it sits in cannot grey it.
 */
const starClass = (fill: string) => (isWarm(fill) ? (lum(fill) > 0.62 ? 'ca-d1' : 'ca-d2') : 'ca-d0')
const any = () => true

/**
 * The scenes' own lights set in among the chart's stars: every small square of light (a window, a scene's
 * star) becomes a disc. Read from the lit painting before it is repainted, so each keeps its own color;
 * `lit` picks which fills are lights. Long thin squares (a sill, a rim) are not lights.
 */
function discs(svg: string, lit: (fill: string) => boolean = any): string {
  return svg.replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (all, tag: string, attrs: string, close: string) => {
    const fill = /\sfill="(#[0-9a-fA-F]{3,6}|white)"/.exec(attrs)?.[1]
    if (!fill || !lit(fill)) return all
    const v = (k: string) => Number(new RegExp(`\\s${k}="([\\d.-]+)"`).exec(attrs)?.[1] ?? NaN)
    const sq: [number, number, number, number][] =
      tag === 'rect'
        ? close
          ? [[v('x') || 0, v('y') || 0, v('width'), v('height')]]
          : []
        : [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)h([\d.]+)v([\d.]+)h-[\d.]+z/g)].map(m => [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])])
    const [, , w0, h0] = sq[0] ?? [0, 0, 0, 0]
    if (!(w0 > 0 && h0 > 0) || w0 > 3 * h0 || h0 > 3 * w0) return all
    const dots = sq.map(([x, y, w, h]) => `M${t1(x + w / 2)} ${t1(y + h / 2)}h0`).join('')
    const rest = attrs.replace(/\s(d|x|y|width|height|rx|fill|stroke|stroke-width|stroke-opacity)="[^"]*"/g, '')
    return `<path class="${starClass(fill)}"${rest} stroke-width="${n(Math.max(0.6, Math.min(1.5, Math.min(w0, h0) * 0.62)))}" d="${dots}"${close}>`
  })
}
/** A warm, bright fill among a building's paint: a lit window. */
const litWindow = (fill: string) => isWarm(fill) && lum(fill) > 0.6

// ---------------------------------------------------------------- sun, moon and earth

/** Sol: a great gold star over the ☉ of its symbol, with fine rays, lettered. */
function sol(cx: number, cy: number, r: number): string {
  const R = Math.max(4.5, r * 0.8)
  let rays = ''
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16
    const r1 = R + 1.6
    const r2 = R + (i % 2 ? 3.4 : 5.6)
    rays += `M${t1(cx + Math.cos(a) * r1)} ${t1(cy + Math.sin(a) * r1)}L${t1(cx + Math.cos(a) * r2)} ${t1(cy + Math.sin(a) * r2)}`
  }
  return (
    `<circle cx="${t1(cx)}" cy="${t1(cy)}" r="${t1(R * 4.5)}" fill="url(#ca-sol)"/>` +
    `<path d="${rays}" stroke="${GOLD}" stroke-opacity=".75" stroke-width=".35"/>` +
    `<circle cx="${t1(cx)}" cy="${t1(cy)}" r="${t1(R)}" fill="${MARGIN}" fill-opacity=".55" stroke="${GOLD}" stroke-width=".7"/>` +
    bigStar(cx, cy, R / 3.2) +
    label(cx + R + 4, cy - R - 2.5, 'Sol', 5)
  )
}

/** Luna: a cream crescent, its full disc ghosted in earthshine, lettered. */
function luna(cx: number, cy: number, r: number): string {
  const R = r * 1.05
  const x = t1(cx)
  return (
    `<circle cx="${x}" cy="${t1(cy)}" r="${t1(R * 3.2)}" fill="url(#ca-halo)" opacity=".5"/>` +
    `<circle cx="${x}" cy="${t1(cy)}" r="${t1(R)}" fill="${FIG}" stroke="${CREAM}" stroke-opacity=".35" stroke-width=".4"/>` +
    `<path d="M${x} ${t1(cy - R)}A${t1(R)} ${t1(R)} 0 1 0 ${x} ${t1(cy + R)}A${t1(R * 0.74)} ${t1(R)} 0 1 1 ${x} ${t1(cy - R)}z" fill="${CREAM}" fill-opacity=".92"/>` +
    label(cx + R + 3, cy + R + 3.5, 'Luna', 5)
  )
}

/** Tellus: an engraved globe, ruled with meridians and parallels, lettered. */
function tellus(cx: number, cy: number, r: number): string {
  const x = t1(cx)
  const y = t1(cy)
  let lines = ''
  for (const k of [-0.6, -0.3, 0, 0.3, 0.6]) {
    const rr = Math.sqrt(1 - k * k) * r
    lines += `<ellipse cx="${x}" cy="${t1(cy + k * r)}" rx="${t1(rr)}" ry="${t1(rr * 0.2)}"/>`
  }
  for (const k of [0.25, 0.62, 0.92]) lines += `<ellipse cx="${x}" cy="${y}" rx="${t1(r * k)}" ry="${t1(r)}"/>`
  return (
    `<circle cx="${x}" cy="${y}" r="${t1(r * 1.6)}" fill="url(#ca-halo)" opacity=".35"/>` +
    `<circle cx="${x}" cy="${y}" r="${t1(r)}" fill="url(#ca-pane)" stroke="${CREAM}" stroke-opacity=".85" stroke-width=".6"/>` +
    `<g fill="none" stroke="${PALE}" stroke-opacity=".4" stroke-width=".3">${lines}</g>` +
    label(cx - r * 0.75, cy - r - 3, 'Tellus', 5.4)
  )
}

// ---------------------------------------------------------------- the scenery

/** Families drawn as conventions rather than outlined figures. */
const UNLINED: readonly Family[] = ['sky', 'stars', 'life', 'lens', 'fire', 'lamp', 'glow', 'beam', 'air', 'cloud', 'body', 'water', 'mark', 'shadow']
/** Families of many small shapes (needles, blades, fronds): a hairline, or they would fill in pale. */
const DENSE: readonly Family[] = ['foliage', 'grass']

/** A plain tone of the plate, for gradient stops and lines. */
function tone(color: string, family: Family): string {
  const l = lum(color)
  if (family === 'fire') return l > 0.6 ? LAMP : l > 0.3 ? GOLD : EMBER
  if (family === 'lamp') return LAMP
  return l > 0.55 ? PALE : l > 0.3 ? '#3a5290' : FIG
}

/** How a lit color is drawn on the chart, by what it belongs to. */
function ink(color: string, family: Family, depth: number, attr: PaintAttr): string {
  const l = lum(color)
  if (attr === 'stroke') {
    if (family === 'fire') return GOLD
    if (family === 'lamp') return l > 0.45 || isWarm(color) ? LAMP : '#5a70a8'
    // A dark keyline round a small bright thing (a letter, a spark) is the plate itself.
    return family === 'life' && l < 0.3 ? MARGIN : PALE
  }
  if (attr === 'color') return FIG
  if (attr === 'stop-color') return tone(color, family)
  switch (family) {
    case 'fire':
      return l > 0.75 ? '#fff3cf' : l > 0.45 ? GOLD : l > 0.25 ? EMBER : '#8a3a30'
    case 'lamp':
      return l > 0.45 || isWarm(color) ? (isWarm(color) || l < 0.9 ? LAMP : STAR) : '#4a5f92'
    case 'stars':
      return STAR
    case 'life':
      return l < 0.4 ? PALE : isWarm(color) ? '#ffe9a8' : STAR
    case 'shadow':
      return DEEP
    case 'mark':
      return l < 0.45 ? DEEP : PALE
    case 'glass':
      return l > 0.6 ? '#cfdcff' : 'url(#ca-pane)'
    case 'water':
    case 'ground':
      return l > 0.82 ? 'none' : 'url(#ca-below)'
    case 'cloud':
    case 'air':
    case 'beam':
    case 'glow':
    case 'body':
    case 'sky':
      return PALE
    default:
      // Lit slivers (rims, caps, glints) are light, not shape: a chart leaves them out.
      if (l > 0.78) return 'none'
      if (l < 0.15) return 'url(#ca-shade)'
      return depth < 0.25 ? 'url(#ca-far)' : 'url(#ca-fig)'
  }
}

/** A figure's contour: pale, firmer toward the front, fading with distance. */
const contour = (depth: number) => `stroke="${PALE}" stroke-opacity="${n(0.28 + depth * 0.36)}" stroke-width="${n(0.24 + depth * 0.3)}" stroke-linejoin="round"`
const hairline = (depth: number) => `stroke="${PALE}" stroke-opacity="${n(0.22 + depth * 0.3)}" stroke-width="${n(0.14 + depth * 0.14)}" stroke-linejoin="round"`

/** Clouds as nebulae: a faint haze within a dotted contour; smoke and ash as dark nebulae. */
function nebula(svg: string, c: Ctx): string {
  const lit = /\sfill="(#[0-9a-fA-F]{3,6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
  const dark = lum(lit) < 0.3
  const shapes = c
    .repaint(svg)
    .replace(/\s(fill|stroke|stroke-width|opacity|fill-opacity|stroke-opacity)="[^"]*"/g, '')
  return (
    `<g fill="${dark ? DEEP : NEB}" fill-opacity="${dark ? '.5' : '.09'}" stroke="${PALE}" stroke-opacity="${dark ? '.32' : '.5'}" ` +
    `stroke-width=".55" stroke-dasharray=".01 1.7" stroke-linecap="round">${shapes}</g>`
  )
}

/** Mist drawn as the Milky Way is: a soft band of nebulosity powdered with star dust, drifting as the mist did. */
function mist(svg: string, c: Ctx): string {
  if (c.meta.veil) return ''
  const sw = c.meta.sw ?? 640
  const y = c.meta.y ?? 80
  const h = c.meta.h ?? 12
  return (
    `<g><rect x="-20" y="${t1(y)}" width="${n(sw + 40)}" height="${t1(h)}" fill="url(#ca-mist)"/>` +
    // Powdered with the Milky Way's own star dust, thickest along its middle.
    `<path d="M-20 ${t1(y + h * 0.55)}H${n(sw + 20)}" fill="none" stroke="url(#ca-dust2)" stroke-opacity=".5" stroke-width="${t1(h * 0.45)}"/>` +
    `${c.motion(svg)}</g>`
  )
}

/**
 * Each light a star: the shapes as painted, a great star over every bright one. A faint highlight or a long
 * thin one (the glint down a lamp post) is light on the shape, not a light of its own.
 */
function starred(svg: string, c: Ctx, k: number): string {
  const out = c.repaint(svg)
  const seen = new Set<string>()
  let stars = ''
  // A beacon that blinks: its star blinks with it.
  for (const m of svg.matchAll(/<(rect|circle)\b([^>]*?)\/?>(<animate attributeName="opacity"[^>]*\/>)?/g)) {
    const at = m[2] ?? ''
    const fill = /\sfill="(#[0-9a-fA-F]{3,6})"/.exec(at)?.[1]
    if (!fill || (lum(fill) < 0.5 && !isWarm(fill))) continue
    const num = (name: string, or = 0) => Number(new RegExp(`\\s${name}="([\\d.-]+)"`).exec(at)?.[1] ?? or)
    if (num('opacity', 1) < 0.6) continue
    const w = num('width')
    const h = num('height')
    if (m[1] === 'rect' && (h > 6 * w || w > 6 * h)) continue
    const x = m[1] === 'rect' ? num('x') + w / 2 : num('cx')
    const y = m[1] === 'rect' ? num('y') + h / 2 : num('cy')
    const key = `${t1(x)} ${t1(y)}`
    if (seen.has(key)) continue
    seen.add(key)
    stars += bigStar(x, y, k, '', m[3] ?? '')
  }
  return out + stars
}

/** The lights of a far town seen through glass, its soft discs of light, become pinpoint stars, each in its own light's color. */
const pinpoints = (svg: string) =>
  svg.replace(/<path fill="(#[0-9a-fA-F]{3,6})" d="([^"]*)"\/>/g, (all, fill: string, d: string) => {
    const cs = [...d.matchAll(/M([\d.-]+) ([\d.-]+)a([\d.]+) /g)]
    if (!cs.length || lum(fill) < 0.5) return all
    const dots = cs.map(m => `M${t1(Number(m[1]) + Number(m[3]))} ${m[2]}h0`).join('')
    return `<path class="${starClass(fill)}" stroke-width="1.1" d="${dots}"/>`
  })

/**
 * Small square things (sparks, clods, confetti, flakes) become specks of stardust, a touch larger than a
 * field star so that weather reads as weather; long ones (rain) meteor streaks, as wide as the drop, slanted
 * as it falls, and fading up their tails (the trail's gradient is set in the drops' own space, where every
 * drop starts at the same height: a gradient on a line's own box would paint a vertical line nothing).
 */
const stardust = (svg: string) =>
  svg.replace(/<rect\b([^>]*?)(\/>|>([\s\S]*?)<\/rect>)/g, (all, a: string, _end: string, kids: string | undefined) => {
    const v = (k: string) => Number(new RegExp(`\\s${k}="([\\d.-]+)"`).exec(a)?.[1] ?? NaN)
    const w = v('width')
    const h = v('height')
    if (!(w > 0 && h > 0)) return all
    const rest = a.replace(/\s(x|y|width|height|fill)="[^"]*"/g, '')
    if (h > 2.5 * w) return `<path class="ca-rain" d="M${t1(v('x') + w / 2)} ${t1(v('y'))}l-.4 ${t1(h)}"${rest}>${kids ?? ''}</path>`
    if (w > 2.5 * h) return all
    const fill = /\sfill="[^"]*"/.exec(a)?.[0] ?? ''
    return `<circle cx="${t1(v('x') + w / 2)}" cy="${t1(v('y') + h / 2)}" r="${t1(Math.max(0.85, Math.min(1.4, Math.max(w, h) * 0.32)))}"${fill}${rest}>${kids ?? ''}</circle>`
  })

/** A sleeper's Z is a little asterism of four stars, as the gallery's sleeping Clavdivs breathes them. */
const zAsterism =
  `<path d="M-4.5 -10H4.5L-4.5 -1H4.5" fill="none" stroke="${PALE}" stroke-opacity=".6" stroke-width=".5"/>` +
  `<path d="M-4.5 -10h0M4.5 -10h0M-4.5 -1h0M4.5 -1h0" class="ca-d0" stroke-width="1.7"/>`

/** The hawk as the chart's Aquila: five stars along its wings, joined by faint lines, still circling. */
const aquila =
  `<g transform="translate(16 0)"><path d="M-6 0L-3 -1.9L0 0L3 -1.9L6 0" fill="none" stroke="${PALE}" stroke-opacity=".55" stroke-width=".35"/>` +
  `<path d="M-6 0h0M-3 -1.9h0M3 -1.9h0M6 0h0" class="ca-d0" stroke-width=".9"/><path d="M0 0h0" class="ca-d0" stroke-width="1.5"/></g>`

/**
 * The lab's window is a pane of the chart: a sliver of the Milky Way crosses it behind the far town, with a
 * few field stars and a great star, and the town's lights are pinpoint stars.
 */
function pane(svg: string, c: Ctx): string {
  const x = c.meta.cx ?? 0
  const y = c.meta.cy ?? 0
  const w = c.meta.sw ?? 150
  const h = c.meta.h ?? 56
  const d = `M${t1(x - 6)} ${t1(y + h * 0.62)}C${t1(x + w * 0.3)} ${t1(y + h * 0.42)} ${t1(x + w * 0.62)} ${t1(y + h * 0.3)} ${t1(x + w + 6)} ${t1(y - 2)}`
  const sky =
    `<g fill="none" stroke-linecap="round"><g stroke="${NEB}"><path d="${d}" stroke-opacity=".03" stroke-width="26"/><path d="${d}" stroke-opacity=".04" stroke-width="15"/><path d="${d}" stroke-opacity=".05" stroke-width="7"/></g>` +
    `<path d="${d}" stroke="url(#ca-dust)" stroke-opacity=".5" stroke-width="18"/><path d="${d}" stroke="url(#ca-dust2)" stroke-opacity=".8" stroke-width="7"/></g>` +
    `<use href="#ca-x" x="${t1(x + w * 0.12)}" y="${t1(y + h * 0.2)}"/><use href="#ca-x" x="${t1(x + w * 0.83)}" y="${t1(y + h * 0.45)}"/>` +
    bigStar(x + w * 0.36, y + h * 0.16, 0.5)
  return c.repaint(pinpoints(svg)).replace(/fill="url\(#ca-pane\)"\/>/, `$&${sky}`)
}

/** The lava's courses traced as chains of gold stars, a river constellation. */
const course = (d: string | undefined) =>
  d ? `<path d="${d}" fill="none" stroke="#fff0c0" stroke-width="1.3" stroke-linecap="round" stroke-dasharray=".01 4.6"/>` : ''

/** A faint wash the chart leaves out draws nothing, so it is not written at all. */
const unwritten = (svg: string) => svg.replace(/<(path|use|rect|circle|ellipse)\b[^>]*\svisibility="hidden"[^>]*\/>/g, '')

const scenery = (_sw: number): Painter => {
  const p = painter(
    {
      ink,
      // A gradient fill is a surface in its overall tone; a wash of light too faint to be a shape is not drawn.
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient' && family !== 'ground') {
          // A wash of light (lamplight on a wall, a lit window's glow) is a faint nebula; a lit rim stays a pale line.
          if (attr === 'fill' && family !== 'fire' && lum(meanOf(g).color) > 0.5) return 'url(#ca-wash)'
          return undefined
        }
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return ink(mean.color, family, 0.5, 'stroke')
        if (mean.opacity < 0.5) return 'none'
        return ink(mean.color, family, 0.5, 'fill')
      },
      line: (family, depth) => (UNLINED.includes(family) ? '' : DENSE.includes(family) ? hairline(depth) : contour(depth)),
      lineless: 0.6,
      faint: 'hide',
      templateFamily: 'foliage',
      // A nebula has no contour.
      post: svg => svg.replace(/fill="url\(#ca-wash\)"/g, '$& stroke="none"'),
      // Lamplight on the ground: a faint nebula within a dotted gold rim.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="url(#ca-wash)" stroke="${GOLD}" stroke-opacity=".55" stroke-width=".5" stroke-dasharray=".01 1.8" stroke-linecap="round"/>`,
      redraw: {
        sky,
        lens: () => '',
        glow: (_svg, c) => (c.role === 'volcano.glow' ? `<circle cx="${n(c.meta.cx ?? 0)}" cy="${n(c.meta.cy ?? 0)}" r="${n(c.meta.r ?? 120)}" fill="url(#ca-warm)"/>` : ''),
        // The plate's own Milky Way runs through every sky.
        'space.milkyway': () => '',
        stars: (svg, c) => c.repaint(discs(svg)),
        // A cottage's lit window and the train's are gold stars, as the city's are (a note on the lab's board is not a light).
        'night.cottages': (svg, c) => c.repaint(discs(svg, litWindow)),
        'city.train': (svg, c) => c.repaint(discs(svg, litWindow)),
        // The spire's red beacon is a small star, blinking as the beacon did.
        'city.spire': (svg, c) => {
          const beacon = /<circle\b[^>]*>(<animate\b[^>]*\/>)?<\/circle>|<circle\b[^>]*\/>/.exec(svg)
          return c.repaint(beacon ? svg.replace(beacon[0], '') : svg) + bigStar(c.meta.cx ?? 0, c.meta.cy ?? 0, 0.42, '', beacon?.[1] ?? '')
        },
        // A framing trunk is a figure in bark: broken vertical form lines within its contour, running down into its
        // flared root; its shaded side and lit edge, laid at part strength, are left to the lines. The moss at its
        // foot is ground, in level form lines.
        'forest.trunks': (svg, c) =>
          c
            .repaint(svg.replace(/<path\b[^>]*\sopacity="0?\.[0-7]\d*"[^>]*\/>/g, ''))
            .replace(/<path fill="url\(#ca-fig\)"([^>]*)\/>/g, (_, rest: string) => `<path fill="url(#ca-${/opacity/.test(rest) ? 'shade' : 'bark'})"${rest}/>`),
        'lab.lamp': (svg, c) => c.repaint(svg) + bigStar((c.meta.cx ?? 0) + 0.5, (c.meta.cy ?? 0) + 3.4, 0.62),
        body: (_svg, c) => {
          if (c.meta.part === 'halo') return ''
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return tellus(cx, cy, r)
          if (c.role === 'night.moon') return luna(cx, cy, r)
          return sol(cx, cy, r)
        },
        cloud: nebula,
        air: mist,
        // Light falling through the air: fans of dotted rays.
        beam: (svg, c) =>
          `<g fill="none" stroke="${PALE}" stroke-opacity=".3" stroke-width=".5" stroke-dasharray=".01 2.2" stroke-linecap="round">` +
          c.repaint(svg).replace(/\s(fill|stroke|opacity|fill-opacity|stroke-width)="[^"]*"/g, '') +
          `</g>`,
        // A street lamp's head is a great star big enough to read over its own bar of light.
        lamp: (svg, c) => (c.role.startsWith('city.windows') ? c.repaint(discs(svg)) : starred(svg, c, c.role === 'city.lamps' ? 0.95 : 0.62)),
        life: (svg, c) => stardust(c.repaint(svg)).replace(/<text\b[^>]*>Z<\/text>/g, zAsterism),
        'desert.hawk': svg => svg.replace(/<path\b[^>]*\/>/, aquila),
        'lab.window': pane,
        // Reflections are faint on a chart.
        water: (svg, c) => `<g opacity=".3">${c.repaint(svg)}</g>`,
        // Fire is the plate's one hand-coloured ink, its courses traced in gold stars.
        'volcano.crater': (svg, c) =>
          c.repaint(svg) + bigStar(c.meta.cx ?? 0, (c.meta.cy ?? 0) - 1, 1.25) + label((c.meta.cx ?? 0) + 9, (c.meta.cy ?? 0) - 7, 'Vulcanus', 5.2),
        'volcano.lava': (svg, c) => `<g opacity=".8">${c.repaint(svg)}</g>${course(c.meta.d)}`,
        'volcano.stream': (svg, c) => `<g opacity=".8">${c.repaint(svg)}</g>${course(c.meta.d)}`,
        'volcano.cracks': (svg, c) => `<g opacity=".55">${c.repaint(svg)}</g>`,
        mark: (svg, c) => `<g opacity=".55">${c.repaint(svg).replace(/\sstroke-width="([\d.]+)"/g, (_, w: string) => ` stroke-width="${n(Math.min(0.45, Number(w)))}"`)}</g>`,
      },
    },
    'ca',
  )
  return { el: (role, svg, meta) => unwritten(p.el(role, svg, meta)), defs: p.defs }
}

// ---------------------------------------------------------------- Claude

/**
 * The eight corners of one of the model's boxes, by the box's own index (bit 1 x,
 * bit 2 y, bit 4 z): its twelve edges come in a fixed order, front face first.
 */
function corners(pt: ModelPart): P2[] | undefined {
  const e = pt.edges
  if (e.length !== 12) return undefined
  const c: P2[] = []
  c[4] = e[0]!.a
  c[5] = e[0]!.b
  c[7] = e[1]!.b
  c[6] = e[2]!.b
  c[1] = e[4]!.a
  c[0] = e[4]!.b
  c[2] = e[5]!.b
  c[3] = e[6]!.b
  return c
}
const mean = (pts: readonly P2[]): P2 => [pts.reduce((t, p) => t + p[0], 0) / pts.length, pts.reduce((t, p) => t + p[1], 0) / pts.length]
const dot = (p: P2, cx: number, floor: number) => `M${t1(p[0] + cx)} ${t1(p[1] + floor)}h0`

/** Claude as the constellation CLAVDIVS: the allegory figure, then its stars joined by lines that stop short of each. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  // The figure: the sky knocked back into each part, a pale contour round it, faint creases.
  let fig = ''
  for (const pt of outlinedOrder(m)) {
    fig += `<path d="${poly(pt.hull, cx, floor)}"/>`
    // The body's light, as the gallery's form lines give it: its top a shade lighter, a face turned from the light
    // crossed with a second, denser set. Laid over the part's ground, translucent, so its contour still shows.
    if (pt.name === 'body')
      for (const f of pt.faces) {
        const tone = f.name === 'top' && f.light > 0.6 ? 'ca-lit' : f.light < 0.42 ? 'ca-dim' : ''
        if (tone) fig += `<path class="${tone}" d="${poly(f.pts, cx, floor)}"/>`
      }
    // The body's creases are the very edges its constellation lines trace; a leg's is finer than the plate can show.
    const cr = pt.name !== 'arm' ? '' : pt.edges.filter(e => e.kind === 'crease').map(e => poly([e.a, e.b], cx, floor, false)).join('')
    if (cr) fig += `<path class="ca-c" d="${cr}"/>`
  }
  // The constellation: stars by magnitude (0 bright, 1 middling, 2 faint), and the lines between them.
  const stars: { p: P2; mag: 0 | 1 | 2 }[] = []
  const links: [number, number][] = []
  const body = m.parts.find(p => p.name === 'body')
  const B = body && corners(body)
  if (B) {
    const centre = mean(B)
    stars.push({ p: B[6]!, mag: 0 }, { p: B[7]!, mag: 0 }, { p: B[5]!, mag: 0 }, { p: B[4]!, mag: 0 }, { p: B[2]!, mag: 1 }, { p: B[3]!, mag: 1 })
    links.push([0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [4, 5])
    for (const pt of m.parts) {
      const C = pt.name === 'body' ? undefined : corners(pt)
      if (!C) continue
      const at = stars.length
      if (pt.name === 'arm') {
        // The nub: a star at its tip, a faint one at its root, whichever end is farther from the body the tip.
        const a = mean([C[0]!, C[2]!, C[4]!, C[6]!])
        const b = mean([C[1]!, C[3]!, C[5]!, C[7]!])
        const far = Math.hypot(a[0] - centre[0], a[1] - centre[1]) > Math.hypot(b[0] - centre[0], b[1] - centre[1])
        stars.push({ p: far ? a : b, mag: 0 }, { p: far ? b : a, mag: 2 })
      } else {
        // A leg: a star on its foot, a faint one where it meets the body.
        stars.push({ p: mean([C[0]!, C[1]!, C[4]!, C[5]!]), mag: 1 }, { p: mean([C[2]!, C[3]!, C[6]!, C[7]!]), mag: 2 })
      }
      links.push([at + 1, at])
    }
  }
  const GAP = [1.7, 1.3, 1]
  let lines = ''
  for (const [i, j] of links) {
    const a = stars[i]!
    const b = stars[j]!
    const dx = b.p[0] - a.p[0]
    const dy = b.p[1] - a.p[1]
    const L = Math.hypot(dx, dy)
    const ra = GAP[a.mag]!
    const rb = GAP[b.mag]!
    if (L < ra + rb + 0.8) continue
    lines += poly([[a.p[0] + (dx / L) * ra, a.p[1] + (dy / L) * ra], [b.p[0] - (dx / L) * rb, b.p[1] - (dy / L) * rb]], cx, floor, false)
  }
  const by = (mag: number) => stars.filter(s => s.mag === mag).map(s => dot(s.p, cx, floor)).join('')
  // The eyes: the brightest pair, each a star lettered α and β; closed, happy and dizzy eyes little asterisms.
  let eyes = ''
  let asterisms = ''
  let eyeLines = ''
  const open = m.eyes.filter(e => e.poly)
  const mid = open.length === 2 ? (mean(open[0]!.poly!)[0] + mean(open[1]!.poly!)[0]) / 2 : 0
  let greek = ''
  for (const e of m.eyes) {
    if (e.poly) {
      const ys = e.poly.map(p => p[1])
      const h = Math.max(...ys) - Math.min(...ys)
      const c = mean(e.poly)
      eyes += `<path stroke-width="${n(Math.max(0.9, Math.min(2.6, 0.7 + h * 0.24)))}" d="${dot(c, cx, floor)}"/>`
      if (open.length === 2) {
        const side = c[0] < mid ? -1 : 1
        greek += `<text x="${t1(c[0] + cx + side * 4.2)}" y="${t1(c[1] + floor - 3.4)}">${side < 0 ? 'α' : 'β'}</text>`
      }
    } else if (e.line) {
      eyeLines += poly(e.line, cx, floor, false)
      // Three stars, its ends and its middle, so the arc between them still reads.
      const L = e.line
      asterisms += [L[0]!, L[Math.floor(L.length / 2)]!, L[L.length - 1]!].map(p => dot(p, cx, floor)).join('')
    }
  }
  // Every line's ink is a class (defs), and so is the bright stars' shine: Claude is baked in every pose, so each
  // attribute would be paid for again and again.
  return (
    `<g class="ca-f">${fig}</g><g class="ca-k">` +
    (lines ? `<path class="ca-l" d="${lines}"/>` : '') +
    (eyeLines ? `<path class="ca-e" d="${eyeLines}"/>` : '') +
    `<path class="ca-s2" d="${by(2)}"/><path class="ca-s1" d="${by(1)}${asterisms}"/>` +
    `<g class="ca-s0"><path d="${by(0)}"/>${eyes}</g></g>` +
    (greek ? `<g class="ca-g">${greek}</g>` : '')
  )
}

// ---------------------------------------------------------------- the plate

/** The definitions the whole plate draws with, laid down once under the stage. */
function defs(): string {
  const dots = (w: number, h: number, base: string, pts: [number, number, number][], o: number) =>
    `<rect width="${w}" height="${h}" fill="${base}"/><path d="${pts.map(([x, y]) => `M${x} ${y}h0`).join('')}" stroke="${STAR}" stroke-opacity="${o}" stroke-width="${pts[0]![2]}" stroke-linecap="round"/>`
  // Star clouds: a tile of fine stars, scattered once, that the Milky Way's band is stroked with.
  const cloud = (seed: number, w: number, h: number, count: number) => {
    const rand = seeded(seed)
    let small = ''
    let big = ''
    for (let i = 0; i < count; i++) {
      const at = `M${t1(rand() * w)} ${t1(rand() * h)}h0`
      if (rand() < 0.22) big += at
      else small += at
    }
    return `<path d="${small}" stroke-width=".42"/><path d="${big}" stroke-width=".8"/>`
  }
  return (
    `<style>.ca-c{fill:none;stroke-opacity:.3;stroke-width:.32px}` +
    `.ca-f{fill:url(#ca-clawd);stroke:${PALE};stroke-opacity:.62;stroke-width:.55px;stroke-linejoin:round}` +
    `.ca-lit{fill:${PALE};fill-opacity:.11;stroke:none}.ca-dim{fill:url(#ca-hatch);stroke:none}` +
    `.ca-k{fill:none;stroke-linecap:round}.ca-l{stroke:${CREAM};stroke-opacity:.85;stroke-width:.8px}` +
    // The scenes' lights as stars: white, gold, a deeper gold; whole whatever group they sit in.
    `.ca-d0,.ca-d1,.ca-d2{fill:none;stroke-linecap:round;stroke-opacity:1}.ca-d0{stroke:${STAR}}.ca-d1{stroke:${LAMP}}.ca-d2{stroke:${GOLD};stroke-opacity:.8}` +
    `.ca-e{stroke:${PALE};stroke-opacity:.85;stroke-width:.55px;stroke-linejoin:round}` +
    // Rain: meteor streaks as wide as the drop, brightest at the head.
    `.ca-rain{fill:none;stroke:url(#ca-trail);stroke-width:.95px;stroke-linecap:round}` +
    `.ca-s2{stroke:${STAR};stroke-opacity:.75;stroke-width:.7px}.ca-s1{stroke:${STAR};stroke-width:.95px}.ca-s0{stroke:${STAR};stroke-width:1.15px;filter:url(#ca-shine)}` +
    `.ca-t,.ca-g{font-family:${CASLON};font-style:italic;fill:${CREAM};fill-opacity:.85}.ca-g{font-size:3.6px;text-anchor:middle}</style>` +
    `<pattern id="ca-dust" width="47" height="31" patternUnits="userSpaceOnUse"><g stroke="#e4ecff" stroke-linecap="round">${cloud(31, 47, 31, 30)}</g></pattern>` +
    `<pattern id="ca-dust2" width="23" height="17" patternUnits="userSpaceOnUse"><g stroke="#eef3ff" stroke-linecap="round">${cloud(33, 23, 17, 16)}</g></pattern>` +
    // A wash of light is a faint nebula on the chart.
    `<radialGradient id="ca-wash"><stop offset="0" stop-color="${NEB}" stop-opacity=".2"/><stop offset=".45" stop-color="${NEB}" stop-opacity=".07"/><stop offset="1" stop-color="${NEB}" stop-opacity="0"/></radialGradient>` +
    // The plate: night deepest at the top, the twilight edition a shade lighter.
    `<linearGradient id="ca-skyn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070f28"/><stop offset=".55" stop-color="${NAVY}"/><stop offset="1" stop-color="#1e3462"/></linearGradient>` +
    `<linearGradient id="ca-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1838"/><stop offset=".5" stop-color="#182c58"/><stop offset="1" stop-color="#2a4274"/></linearGradient>` +
    // Figures: the sky knocked back in, with faint field stars; far ones nearer the sky; shade in form lines.
    `<pattern id="ca-fig" width="41" height="29" patternUnits="userSpaceOnUse">${dots(41, 29, FIG, [[7, 5, 0.45], [29, 13, 0.45], [17, 24, 0.45]], 0.3)}</pattern>` +
    `<pattern id="ca-far" width="37" height="23" patternUnits="userSpaceOnUse">${dots(37, 23, FAR, [[11, 6, 0.4], [28, 17, 0.4]], 0.28)}</pattern>` +
    // Bark: broken vertical form lines, unevenly spaced, as an engraver cuts a trunk.
    `<pattern id="ca-bark" width="7" height="31" patternUnits="userSpaceOnUse"><rect width="7" height="31" fill="${FIG}"/>` +
    `<path d="M.7 0V31M2.3 0V12M2.3 15V31M3.6 5V26M5.1 0V20M5.1 23V31M6.2 9V29" stroke="${PALE}" stroke-opacity=".3" stroke-width=".3"/></pattern>` +
    `<pattern id="ca-shade" width="24" height="1.6" patternUnits="userSpaceOnUse"><rect width="24" height="1.6" fill="${FIG}"/><path d="M0 .8H24" stroke="${PALE}" stroke-opacity=".16" stroke-width=".28"/></pattern>` +
    `<pattern id="ca-below" width="31" height="19" patternUnits="userSpaceOnUse">${dots(31, 19, BELOW, [[4, 3, 0.4], [19, 8, 0.4], [11, 15, 0.4], [26, 17, 0.4]], 0.22)}</pattern>` +
    `<pattern id="ca-pane" width="23" height="17" patternUnits="userSpaceOnUse">${dots(23, 17, '#223a76', [[5, 4, 0.5], [16, 12, 0.5]], 0.6)}</pattern>` +
    // Claude: the lit chart, a shade lighter still, with faint form lines.
    `<pattern id="ca-clawd" width="20" height="1.5" patternUnits="userSpaceOnUse"><rect width="20" height="1.5" fill="#24407a"/><path d="M0 .75H20" stroke="${PALE}" stroke-opacity=".11" stroke-width=".26"/></pattern>` +
    // Its shade: a veil of the plate's deep, crossed with a second, denser set of form lines.
    `<pattern id="ca-hatch" width="1.15" height="20" patternUnits="userSpaceOnUse"><rect width="1.15" height="20" fill="${DEEP}" fill-opacity=".26"/><path d="M.57 0V20" stroke="${PALE}" stroke-opacity=".15" stroke-width=".26"/></pattern>` +
    // A star's glow, a great star, a crossed field star.
    `<radialGradient id="ca-halo"><stop offset="0" stop-color="#cedeff" stop-opacity=".62"/><stop offset=".3" stop-color="#96b4ff" stop-opacity=".16"/><stop offset="1" stop-color="#7896ff" stop-opacity="0"/></radialGradient>` +
    `<g id="ca-star"><circle r="5" fill="url(#ca-halo)"/><path d="M0-6.2L.28 0L0 6.2L-.28 0zM-6.2 0L0 .28L6.2 0L0-.28z" fill="#f4f8ff" fill-opacity=".9"/><circle r=".7" fill="#fff"/></g>` +
    `<g id="ca-x"><path d="M-2.3 0h4.6M0-2.3v4.6" stroke="${STAR}" stroke-opacity=".5" stroke-width=".22"/><circle r=".62" fill="${STAR}"/></g>` +
    // Claude's stars shine: a halo and two fine spikes from the discs themselves, twinkling together (one animation, every pose).
    // The region is Claude's own box in the space each pose is drawn in (HERO_W = 52 across, centred on cx; the model
    // 40 tall standing on the floor at HERO_H = 36), with 40 to either side and above it for the spikes and for a
    // pose that leaps or tumbles out of the box.
    `<filter id="ca-shine" filterUnits="userSpaceOnUse" x="-40" y="-60" width="132" height="120" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur stdDeviation="1.1" result="h"/><feGaussianBlur in="SourceGraphic" stdDeviation="2.8 .14" result="x"/><feGaussianBlur in="SourceGraphic" stdDeviation=".14 2.8" result="y"/>` +
    `<feMerge><feMergeNode in="h"/><feMergeNode in="x"/><feMergeNode in="y"/></feMerge>` +
    `<feComponentTransfer><feFuncR type="linear" slope=".82"/><feFuncG type="linear" slope=".88"/>` +
    `<feFuncA type="linear" slope="3.4"><animate attributeName="slope" values="3.4;1.9;3.6;2.6;3.4" dur="2.9s" repeatCount="indefinite"/></feFuncA></feComponentTransfer>` +
    `<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    // Sol's gold glow, the volcano's warm nebula, mist's band, the meteor's trail.
    `<radialGradient id="ca-sol"><stop offset="0" stop-color="${GOLD}" stop-opacity=".5"/><stop offset=".35" stop-color="${GOLD}" stop-opacity=".14"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ca-warm"><stop offset="0" stop-color="${EMBER}" stop-opacity=".32"/><stop offset=".5" stop-color="#b0506a" stop-opacity=".1"/><stop offset="1" stop-color="#b0506a" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="ca-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${NEB}" stop-opacity="0"/><stop offset=".55" stop-color="${NEB}" stop-opacity=".12"/><stop offset="1" stop-color="${NEB}" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="ca-meteor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6eeff" stop-opacity="0"/><stop offset="1" stop-color="#f0f5ff"/></linearGradient>` +
    // A raindrop's trail, in the drops' own space: each starts 8 above the stage and is 6 long.
    `<linearGradient id="ca-trail" gradientUnits="userSpaceOnUse" x1="0" y1="-8" x2="0" y2="-2"><stop offset="0" stop-color="${NEB}" stop-opacity=".45"/><stop offset="1" stop-color="${STAR}"/></linearGradient>` +
    // The plate's age: its corners a little darker.
    `<radialGradient id="ca-vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="${DEEP}" stop-opacity="0"/><stop offset="1" stop-color="${DEEP}" stop-opacity=".5"/></radialGradient>` +
    // The frame's graduation: a long tick every fifth.
    `<pattern id="ca-tick-t" x="6.5" width="28" height="6.5" patternUnits="userSpaceOnUse"><path d="M0 6.5v-2.2M5.6 6.5v-1.2M11.2 6.5v-1.2M16.8 6.5v-1.2M22.4 6.5v-1.2" stroke="${CREAM}" stroke-opacity=".6" stroke-width=".35"/></pattern>` +
    `<pattern id="ca-tick-b" x="6.5" width="28" height="6.5" patternUnits="userSpaceOnUse"><path d="M0 0v2.2M5.6 0v1.2M11.2 0v1.2M16.8 0v1.2M22.4 0v1.2" stroke="${CREAM}" stroke-opacity=".6" stroke-width=".35"/></pattern>` +
    `<pattern id="ca-tick-l" y="6.5" width="6.5" height="28" patternUnits="userSpaceOnUse"><path d="M6.5 0h-2.2M6.5 5.6h-1.2M6.5 11.2h-1.2M6.5 16.8h-1.2M6.5 22.4h-1.2" stroke="${CREAM}" stroke-opacity=".6" stroke-width=".35"/></pattern>` +
    `<pattern id="ca-tick-r" y="6.5" width="6.5" height="28" patternUnits="userSpaceOnUse"><path d="M0 0h2.2M0 5.6h1.2M0 11.2h1.2M0 16.8h1.2M0 22.4h1.2" stroke="${CREAM}" stroke-opacity=".6" stroke-width=".35"/></pattern>`
  )
}

/** The plate's frame: a margin, a graduated double rule, hour numerals along the top and declinations down the side. */
function frame(sw: number, h: number): string {
  const I = 6.5
  let hoursText = ''
  for (const k of hours(sw)) {
    const x = sw / 2 + (k * HOUR * (POLE + I)) / POLE
    if (x > 14 && x < sw - 14) hoursText += `<text x="${t1(x)}" y="5.2">${hourName(k)}</text>`
  }
  let decs = ''
  for (const [d, name] of DECS) {
    const y = arcY(sw, d, I)
    if (y > 14 && y < h - 14) decs += `<text transform="translate(5.1 ${t1(y)}) rotate(-90)">${name}</text>`
  }
  return (
    `<path fill="${MARGIN}" fill-rule="evenodd" d="M0 0H${sw}V${h}H0zM${I} ${I}V${h - I}H${sw - I}V${I}z"/>` +
    `<rect x="${I}" y="0" width="${sw - 2 * I}" height="${I}" fill="url(#ca-tick-t)"/><rect x="${I}" y="${h - I}" width="${sw - 2 * I}" height="${I}" fill="url(#ca-tick-b)"/>` +
    `<rect x="0" y="${I}" width="${I}" height="${h - 2 * I}" fill="url(#ca-tick-l)"/><rect x="${sw - I}" y="${I}" width="${I}" height="${h - 2 * I}" fill="url(#ca-tick-r)"/>` +
    `<g fill="none" stroke="${CREAM}"><rect x="1.1" y="1.1" width="${sw - 2.2}" height="${h - 2.2}" stroke-opacity=".8" stroke-width=".9"/>` +
    `<rect x="2.7" y="2.7" width="${sw - 5.4}" height="${h - 5.4}" stroke-opacity=".5" stroke-width=".3"/>` +
    `<rect x="${I}" y="${I}" width="${sw - 2 * I}" height="${h - 2 * I}" stroke-opacity=".75" stroke-width=".5"/></g>` +
    `<g font-family="${SERIF}" font-size="2.9" fill="${CREAM}" fill-opacity=".85" text-anchor="middle">${hoursText}${decs}</g>`
  )
}

/** The width of a title in the cartouche's spaced capitals (6.6px serif, 1.7px tracking): a W is more than an em, an M an em, an I or a stop a third. */
const capsWidth = (t: string) =>
  [...t].reduce((w, ch) => w + 1.7 + 6.6 * (ch === 'W' ? 1.14 : ch === 'M' ? 1 : /[IJ.,:;'!|]/.test(ch) ? 0.38 : ch === ' ' ? 0.3 : /\d/.test(ch) ? 0.58 : 0.76), 0)

export const ATLAS: Look = {
  name: 'atlas',
  label: 'Celestial Atlas',
  voice: 'an old astronomer annotating a star chart, in plain English',
  cell: 'solid',
  figure: '3d',
  font: CASLON,
  charW: 5.1,
  caption: { fill: MARGIN, stroke: CREAM, ink: CREAM, radius: 0 },
  paper: { card: MARGIN, ink: '#efe6cc', kinds: { code: '#a9d4ff', path: '#c2d2ff', fn: '#e2c6ff', num: '#f3cd78', bad: '#ff9f8a', good: '#a8e6b6', face: '#f6b38f' } },
  inset: 8,
  titleColor: CREAM,
  art: {
    painter: scenery,
    hero,
    sky: NAVY,
    ground: BELOW,
    defs,
  },
  texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#ca-vig)"/>`,
  frame,
  // The chapter as a title cartouche: "Tab. I" in italic, the chapter in spaced capitals, ruled twice.
  tag: (text, inset) => {
    const t = text.toUpperCase()
    const x = inset + 3
    const y = inset + 3
    const w = capsWidth(t) + 40
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="14" fill="${MARGIN}" stroke="${CREAM}" stroke-width=".7"/>` +
        `<rect x="${x + 1.5}" y="${y + 1.5}" width="${n(w - 3)}" height="11" fill="none" stroke="${CREAM}" stroke-opacity=".5" stroke-width=".3"/>` +
        `<text x="${x + 5}" y="${y + 9.8}" font-family="${CASLON}" font-style="italic" font-size="7.2" fill="${CREAM}">Tab. I</text>` +
        `<text x="${x + 32}" y="${y + 9.6}" font-family="${SERIF}" font-size="6.6" letter-spacing="1.7" fill="${CREAM}">${escape(t)}</text>`,
      w: x + w + 4,
      h: y + 18,
    }
  },
  bubble: {
    font: CASLON,
    size: 9,
    charW: 5.1,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) => {
      // A legend cartouche, ruled twice; its pointer a constellation line stopping short of a star at Claude.
      const mx = (base[0][0] + base[1][0]) / 2
      const my = (base[0][1] + base[1][1]) / 2
      const dx = tip[0] - mx
      const dy = tip[1] - my
      const k = Math.max(0, (Math.hypot(dx, dy) - 2.4) / (Math.hypot(dx, dy) || 1))
      return (
        `<path d="M${n(mx)} ${n(my)}L${n(mx + dx * k)} ${n(my + dy * k)}" stroke="${CREAM}" stroke-opacity=".85" stroke-width=".6"/>` +
        bigStar(tip[0], tip[1], 0.5) +
        `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${MARGIN}" stroke="${CREAM}" stroke-width=".8"/>` +
        `<rect x="${n(x + 1.7)}" y="${n(y + 1.7)}" width="${n(w - 3.4)}" height="${n(h - 3.4)}" fill="none" stroke="${CREAM}" stroke-opacity=".5" stroke-width=".3"/>`
      )
    },
  },
}

/**
 * Delftware, after the gallery's "Delftware: tin-glazed tile, 17th century"
 * (index.html, style 06, `delft`).
 *
 * The art bible, translated from the gallery's tile to the Fables' worlds:
 *
 * - One pigment, cobalt, brushed on white tin glaze and fired: everything is
 *   blue on white. The cobalt goes on in a few strengths, a pale wash, a
 *   wash, a middle tone, full cobalt and a deep loaded line; light is not
 *   painted at all but left as the bare glaze. By day most of the tile stays
 *   glaze: a dark thing goes down as a wash, paler with distance, and the
 *   contour does the rest.
 * - Every shape is a wash inside a loose brush contour in deep cobalt, thinner
 *   and paler with distance and broken now and then, as a quick brush leaves
 *   it; the darkest masses (shaded rock, walls at night, and the near trees
 *   that frame the forest, whose bark is the darkest thing on the tile) are
 *   hatched, cobalt lines over a wash, as the gallery hatches Claude's shadow
 *   side. A mass of puffs (a crown of leaves, a shrub, a billow of ash) takes
 *   one contour round the whole, not a ring round every puff; the near crowns
 *   take the deep washes, so they hang over the picture as the trunks stand.
 * - The sky is the glaze, a pale wash brushed in toward its top and swept
 *   with a few streaks; clouds are long strokes of wash. The sun is a disc of
 *   bare glaze ringed in cobalt with brushed rays, the moon a glaze disc with
 *   a washed crescent, each in a halo wiped back to the glaze; the Earth is a
 *   painted globe, its lands washed, its meridians ruled, its night side
 *   hatched. Stars are dots of glaze left in the night wash. The gallery's
 *   birds, flicked "m" strokes, flap across the dawn.
 * - Mist and haze are level strokes of pale wash laid with a loaded brush;
 *   shafts of light and glows are the wash wiped back toward the glaze.
 * - Land, rock, foliage, grass and buildings take the wash their tone calls
 *   for, in their contour; fern fronds take a fine line so they stay a wash.
 *   Meadows are sown with the gallery's grass tufts, three flicks fanning from
 *   a point, among dots; paths and sand are dotted. Water is the gallery's
 *   ripples, short level strokes; a reflection is not painted.
 * - Fire, lava and lamps are light, so they are reserved glaze in a cobalt
 *   contour (a lit window a pane of glaze ruled in fine cobalt); what holds
 *   them (a post, a crater's lip) is washed like anything else, and a lamp's
 *   pool on the ground, or its glow on a wall, is glaze wiped out of the wash.
 *   Lights seen through glass are small dots of glaze.
 * - Dust is not painted; sparks, fireflies and confetti are flecks of cobalt
 *   or glaze. On the night hill stand the gallery's windmill, its laced sails
 *   turning under the moon, and its church, a gabled nave and a spire.
 * - Night (space, the volcano, the village, and the lab, which has no sky to
 *   say so) is the same tile with the sky washed in full cobalt, darkest at
 *   the top, the stars and moon left in glaze, and the land in deeper washes
 *   and hatching, so it lies under the sky.
 * - Claude is brushed as the gallery brushes him: on glaze, each face a
 *   graded wash pooling low (the lit ones left bare toward the top, the face
 *   with his eyes a light wash, each with a streak of glaze), his true side
 *   faces in shadow hatched, all in a loose deep contour, his eyes in dark
 *   cobalt with a glint of glaze, his shadow a pale wash.
 * - The picture is a tile tableau: square tiles with their joints, glaze
 *   pooling blue toward each tile's edges, crackled all over. The double
 *   cobalt rule of the gallery's roundel runs round it and swings round a
 *   quarter arc in each corner, leaving a spandrel of glaze where the
 *   gallery's ox-head corner sits. The chapter is lettered on a painted
 *   banderole; the caption is painted on a tile of its own, ruled twice, with
 *   a quarter disc in each corner, and lettered in deep cobalt: code in full
 *   cobalt, numbers and failures in manganese, the one other pigment on a
 *   Delft painter's bench.
 */
import type { HeroPainter } from '../hero3d'
import { type Face, type Model, outlinedFaces } from '../clawd3d'
import { lum, mix, num as n, poly, t1 } from '../art/ink'
import { MIST_TILE, tiled } from '../art/mist'
import { painter, type Ctx } from '../art/painter'
import type { Family, Painter } from '../art/roles'
import type { Look } from '../looks'

/** The glaze and the cobalt in its strengths, from the gallery's tile. */
const GLAZE = '#f5f3ec'
const PALE = '#c6d2ee'
const WASH = '#8ea6db'
const MID = '#4f6fbf'
const COB = '#2848a1'
const DEEP = '#162d7c'
const EYE = '#11236a'
/** Manganese purple, the one other pigment a Delft painter kept: the caption's numbers and failures. */
const MANGANESE = '#5e2f5c'
/**
 * The fired tile itself, not its painting, after the gallery's tile body: its
 * edge (`rgba(70,80,110,.3)` there), the blue its glaze pools to toward the
 * edges (`rgba(120,140,190,.16)`), its crackle (`rgba(110,106,96,…)`), and the
 * grout of the joints between tiles, the gallery's biscuit (#cbc6b9) deepened.
 */
const EDGE = '#46506e'
const POOL = '#7890be'
const CRACKLE = '#6e6a60'
const JOINT = '#8f8a7e'
/** The strengths dark to light. */
const RAMP = [DEEP, COB, MID, WASH, PALE, GLAZE] as const
const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif"

/** A lit lightness as the painter's: the dim lit scenes spread over the whole of the cobalt. */
const lift = (l: number) => Math.min(1, Math.pow(l, 0.45) * 1.1)

/** A continuous strength along the ramp, for a graded wash. */
function tint(t: number): string {
  const x = Math.max(0, Math.min(1, t)) * (RAMP.length - 1)
  const i = Math.min(RAMP.length - 2, Math.floor(x))
  return mix(RAMP[i] ?? DEEP, RAMP[i + 1] ?? GLAZE, x - i)
}

/** The grain each dark mass is hatched along. */
const GRAIN: Partial<Record<Family, 'd' | 'v' | 'h'>> = { land: 'd', rock: 'd', foliage: 'd', bark: 'v', built: 'v', grass: 'v', ground: 'h' }

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** How light a lit color is painted, 0 the deep line to 1 the bare glaze. */
function lightness(color: string, family: Family, depth: number): number {
  // The farthest things (depth under .25: far ridges, mesas, skylines) a step paler again, as the gallery's
  // windmill and church on the horizon are paler than the mound under Claude.
  const lit = lift(lum(color)) + (depth < 0.25 ? 0.12 : 0)
  // By day the painter leaves most of the tile to the glaze: a dark goes down as a wash, paler with distance,
  // and the contour does the rest. Under a night sky the washes go on at full strength.
  const t = night ? lit : 1 - (1 - Math.min(1, lit)) * (0.58 + 0.42 * depth)
  switch (family) {
    // Light is the bare glaze; what holds it (a lamp post, a crater's lip) a wash like anything else.
    // (The sun, moon and Earth, and every glow, are redrawn outright and never inked here.)
    case 'fire':
    case 'lamp':
    case 'beam':
      return lit > 0.55 ? 1 : t
    case 'stars':
      return 1
    // Under a night sky the land is washed a strength deeper, so it lies under the sky, not over it.
    case 'land':
    case 'grass':
    case 'ground':
    case 'foliage':
    case 'rock':
    case 'mark':
      return night ? t - 0.2 : t
    default:
      return t
  }
}

function ink(color: string, family: Family, depth: number, attr: string): string {
  const t = lightness(color, family, depth)
  if (attr === 'stop-color') return tint(t)
  // A line is the loaded brush: two strengths deeper than its wash, or a line wiped out of it.
  if (attr === 'stroke') return lum(color) > 0.7 ? GLAZE : RAMP[Math.max(0, Math.min(5, Math.floor((t - 0.3) * 6)))] ?? DEEP
  if (family === 'life') return t > 0.6 ? GLAZE : t > 0.3 ? COB : DEEP
  const k = Math.max(0, Math.min(5, Math.floor(t * 6)))
  const grain = GRAIN[family]
  if (attr === 'fill' && k <= 1 && grain) return `url(#df-x${k}${grain})`
  return RAMP[k] ?? DEEP
}

/**
 * Families repainted without a contour: stars, shafts of light, clouds. (The sky,
 * the sun and moon, air, glows and water are redrawn outright and never repainted.)
 */
const UNLINED: readonly Family[] = ['stars', 'beam', 'cloud']

/**
 * Path data written as tight as a browser reads it, losing nothing: no space before a minus sign, no zero before
 * a decimal point. The forest's firs and grasses, and Claude in every pose, are thousands of numbers.
 */
const tight = (svg: string) => svg.replace(/\sd="[^"]*"/g, d => d.replace(/ -/g, '-').replace(/([\s,A-Za-z-])0\./g, '$1.'))

/** A small seeded sequence, so the same stage is always painted the same. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** A tapered stroke of a loaded brush, lying level: `len` long, `w` at its widest. */
const stroke = (x: number, y: number, len: number, w: number) =>
  `M${t1(x)} ${t1(y)}q${t1(len * 0.45)} ${t1(-w * 1.1)} ${t1(len)} ${t1(-w * 0.2)}q${t1(-len * 0.5)} ${t1(w * 0.9)} ${t1(-len)} ${t1(w * 0.2)}z`

/** The gallery's birds: two flicks of the brush, flapping as they drift. */
function birds(sw: number): string {
  const at: [number, number, number][] = [
    [0.17, 24, 0],
    [0.205, 17, 0.7],
    [0.56, 30, 1.6],
  ]
  const flock = at
    .map(
      ([x, y, ph], i) =>
        `<g transform="translate(${n(sw * x)} ${y})"><path d="M-3.4-1.2Q-1.6-2 0 0Q1.6-2 3.4-1.2">` +
        `<animateTransform attributeName="transform" type="scale" values="1 1;1 .3;1 1" dur="${n(0.9 + i * 0.15)}s" begin="${-ph}s" repeatCount="indefinite"/></path>` +
        `<animateTransform attributeName="transform" type="translate" values="0 0;${7 - i * 2} -2;0 0" dur="${11 + i * 3}s" additive="sum" repeatCount="indefinite"/></g>`,
    )
    .join('')
  return `<g fill="none" stroke="${DEEP}" stroke-width=".6" stroke-linecap="round">${flock}</g>`
}

/** The sky: the glaze, washed toward the top in the strength the lit sky calls for, swept with brush streaks. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const sw = c.meta.sw ?? 640
  const top = lum(stops[0]?.color ?? '#808080')
  const low = lum(stops[stops.length - 1]?.color ?? '#808080')
  night = top < 0.2 && low < 0.45
  // By night a full cobalt wash, darkest at the top; by day the bare glaze, a pale wash brushed in toward the top.
  const strength = (l: number) => (night ? tint(Math.pow(l, 0.5) + 0.02) : mix(GLAZE, WASH, Math.pow(Math.max(0, 1 - l), 1.5) * 0.75))
  const wash = stops.map(s => `<stop offset="${s.offset}" stop-color="${strength(lum(s.color))}"/>`).join('')
  // Named for its scene, so two scenes on one page never share a sky.
  const id = `df-sky-${c.role.split('.')[0]}`
  return (
    `<defs><linearGradient id="${id}" x2="0" y2="1">${wash}</linearGradient></defs>` +
    `<rect width="${n(sw)}" height="128" fill="url(#${id})"/>` +
    `<rect width="${n(sw)}" height="104" fill="url(#df-brush${night ? 'n' : 'd'})"/>` +
    (c.role === 'forest.sky' ? birds(sw) : '')
  )
}

/** The sun: a disc of bare glaze ringed in cobalt, a wash in its lower half, brushed rays round it. */
function sun(c: Ctx): string {
  if (c.meta.part === 'halo') return ''
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = (c.meta.r ?? 8) * 1.15
  // Rays in turn straight and long, and short with a flick in them.
  let rays = ''
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.1
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const r1 = r + 2.2
    const at = (q: number, side = 0) => `${t1(cx + cos * q - sin * side)} ${t1(cy + sin * q + cos * side)}`
    rays += i % 2 ? `M${at(r1)}Q${at(r1 + 2, 1.4)} ${at(r + 6)}` : `M${at(r1)}L${at(r + 8.4)}`
  }
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r + 10)}" fill="url(#df-wipe)"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${GLAZE}" stroke="${COB}" stroke-width=".9"/>` +
    `<path fill="${PALE}" d="M${n(cx - r * 0.86)} ${n(cy + r * 0.5)}a${n(r)} ${n(r)} 0 0 0 ${n(r * 1.72)} 0q${n(-r * 0.86)} ${n(-r * 0.3)} ${n(-r * 1.72)} 0z"/>` +
    `<path d="${rays}" fill="none" stroke="${DEEP}" stroke-width=".7" stroke-linecap="round"/>`
  )
}

/** The moon: a glaze disc with a washed crescent, ringed, in a halo wiped out of the night wash. */
function moon(c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = (c.meta.r ?? 9) * 1.2
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 3)}" fill="url(#df-wipe)"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${GLAZE}" stroke="${DEEP}" stroke-width=".8"/>` +
    `<path fill="${WASH}" d="M${n(cx - r * 0.2)} ${n(cy - r * 0.98)}a${n(r)} ${n(r)} 0 0 0 0 ${n(r * 1.96)}a${n(r * 0.78)} ${n(r)} 0 0 1 0 ${n(-r * 1.96)}z"/>`
  )
}

/** The Earth as a painted globe: a pale disc, washed lands, its meridians, its night side hatched. */
function globe(c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 30
  const at = (x: number, y: number) => `${n(cx + x * r)} ${n(cy + y * r)}`
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${PALE}"/>` +
    `<path fill="${WASH}" stroke="${COB}" stroke-width=".4" d="M${at(-0.6, -0.5)}Q${at(-0.2, -0.75)} ${at(0.05, -0.45)}Q${at(0.2, -0.1)} ${at(-0.1, 0.1)}Q${at(-0.35, 0.45)} ${at(-0.5, 0.2)}Q${at(-0.8, -0.1)} ${at(-0.6, -0.5)}zM${at(0.25, 0.25)}Q${at(0.55, 0.1)} ${at(0.6, 0.45)}Q${at(0.45, 0.75)} ${at(0.3, 0.55)}z"/>` +
    `<path fill="url(#df-x1d)" opacity=".8" d="M${at(0.15, -0.99)}a${n(r)} ${n(r)} 0 0 1 0 ${n(r * 1.98)}a${n(r * 0.62)} ${n(r)} 0 0 0 0 ${n(-r * 1.98)}z"/>` +
    `<g fill="none" stroke="${COB}" stroke-width=".4"><ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r * 0.45)}" ry="${n(r)}"/><path d="M${at(-1, 0)}Q${at(0, 0.22)} ${at(1, 0)}"/></g>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${DEEP}" stroke-width=".9"/>`
  )
}

/** Mist and haze: long level strokes of pale wash, as a loaded brush lays them, drifting as the mist did. */
function mist(svg: string, c: Ctx): string {
  const sw = c.meta.sw ?? 640
  const y = c.meta.y ?? 80
  const h = c.meta.h ?? 12
  const w = Math.min(MIST_TILE, sw)
  const rnd = seeded(Math.round(y * 31 + h))
  const rows = c.meta.veil ? 1 : c.meta.lean ? 1 : 2
  let d = ''
  for (let row = 0; row < rows; row++) {
    const base = y + h * (rows === 1 ? 0.55 : row ? 0.78 : 0.42)
    for (let x = -20 + rnd() * 30; x < w + 20; ) {
      const len = 40 + rnd() * 70
      d += stroke(x, base + (rnd() - 0.5) * 2, len, 1.6 + rnd() * 1.4)
      x += len + 14 + rnd() * (c.meta.lean ? 90 : 50)
    }
  }
  const fill = night ? WASH : PALE
  const art = `<path fill="${fill}" opacity="${c.meta.veil ? '.45' : '.75'}" d="${d}"/>`
  return `<g>${tiled(`df-mist-${Math.round(y)}-${Math.round(h)}`, art, sw)}${c.motion(svg)}</g>`
}

/** Water as the gallery paints it: short level strokes of cobalt; the reflection itself is not painted. */
function ripples(c: Ctx): string {
  const sw = c.meta.sw ?? 640
  const y = c.meta.y ?? 98
  const h = Math.min(c.meta.h ?? 24, 30)
  const rnd = seeded(Math.round(y * 7 + sw))
  let d = ''
  for (let i = 0; i < Math.round(sw / 14); i++) d += `M${t1(rnd() * sw)} ${t1(y + 3 + rnd() * (h - 5))}h${t1(3 + rnd() * 7)}`
  return `<path d="${d}" fill="none" stroke="${PALE}" stroke-width=".6" stroke-linecap="round" opacity=".7"/>`
}

/** The point of the night hill's crest nearest a fraction of the way along it, whatever the stage's width. */
function crest(c: Ctx): (f: number) => readonly [number, number] {
  const pts = [...(c.meta.d ?? '').matchAll(/([\d.-]+) ([\d.-]+)/g)].map(m => [Number(m[1]), Number(m[2])] as const)
  const xs = pts.map(p => p[0])
  const [x0, x1] = xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, c.meta.sw ?? 640]
  return f => {
    const x = x0 + (x1 - x0) * f
    return pts.reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a), pts[0] ?? [x, 78])
  }
}

/**
 * The gallery's church beside the mill: a nave under its gable, a tower with its spire and cross, small dark
 * windows. Its numbers are the gallery tile's, times .6, so it stands to the band's scale beside the mill.
 */
const church = ([x, y]: readonly [number, number]) =>
  `<g transform="translate(${t1(x)} ${t1(y + 1.5)})" stroke="${DEEP}" stroke-width=".7" stroke-linejoin="round">` +
  `<path fill="${PALE}" d="M-8.4 0V-6L-2.4 -10.2L3.6 -6V0z"/>` +
  `<path fill="${WASH}" d="M3.6 0V-12.6H8.4V0zM3.6 -12.6L6 -26.4L8.4 -12.6z"/>` +
  `<path fill="none" stroke-width=".8" d="M6 -26.4V-30.4M4.7 -28.8H7.3"/><path stroke-width="1.5" stroke-linecap="round" d="M-5.4 -3h0M-1.8 -3h0M6 -8.4h0"/></g>`

/** The gallery's windmill on the crest of the night hill: a washed tower, a cap, and sails that turn. */
function windmill(near: readonly [number, number]): string {
  // Its sails, as the gallery paints them: a spar, and a sail of wash laced across with three bars.
  let spars = ''
  let sails = ''
  let bars = ''
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.3
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    const at = (d: number, s = 0) => `${t1(ux * d - uy * s)} ${t1(uy * d + ux * s)}`
    spars += `M0 0L${at(17)}`
    sails += `M${at(4.5)}L${at(17)}L${at(17, 3.4)}L${at(4.5, 3.4)}z`
    for (let k = 1; k < 4; k++) bars += `M${at(4.5 + k * 3.1)}L${at(4.5 + k * 3.1, 3.4)}`
  }
  return (
    `<g transform="translate(${t1(near[0])} ${t1(near[1] + 2)})">` +
    `<path fill="${PALE}" stroke="${DEEP}" stroke-width=".7" stroke-linejoin="round" d="M-8 0L-5 -22Q0 -29 5 -22L8 0z"/>` +
    `<path fill="${DEEP}" d="M-1.6 0v-6h3.2v6zM-1 -15h2v2.4h-2z"/>` +
    `<g transform="translate(0 -23)"><g><path fill="${PALE}" d="${sails}"/><path fill="none" stroke="${DEEP}" stroke-width=".5" d="${bars}"/>` +
    `<path fill="none" stroke="${DEEP}" stroke-width="1.1" stroke-linecap="round" d="${spars}"/>` +
    `<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite"/></g><circle r="1.5" fill="${DEEP}"/></g></g>`
  )
}

/**
 * Every shape in a loose contour of deep cobalt, thinner and paler with distance, broken now and then as a quick
 * brush leaves it; a lamp or a lit window, reserved glaze, in a fine unbroken line of cobalt round the glaze.
 */
const lineOf = (family: Family, depth: number) =>
  UNLINED.includes(family)
    ? ''
    : family === 'life'
      ? `stroke="${DEEP}" stroke-width=".3"`
      : family === 'lamp'
        ? `stroke="${COB}" stroke-width=".3"`
        : `stroke="${depth < 0.25 ? COB : DEEP}" stroke-width="${n(0.28 + depth * 0.5)}" stroke-linejoin="round" stroke-dasharray="${depth < 0.25 ? '18 1.2 7 .9' : '26 1.4 9 1'}"`

/**
 * A faint wash in a lined element (a rim of light, a glaze): an unstroked leaf shape lighter than the painter's
 * `lineless`, without an id. The painter would only hide it; it is left out of the markup altogether.
 */
const FAINT = /<(?:path|rect|circle|ellipse|use)\b(?![^>]*\s(?:stroke|id)=)(?=[^>]*\sopacity="(?:0|0?\.[0-5]\d*)")[^>]*\/>/g

/**
 * The near trees that frame the forest, the darkest mass on the tile: the bark
 * hatched upright in cobalt over a middle wash, its shaded side a stripe of full
 * cobalt, the glaze left bare along its lit edge, and the moss at its foot a wash.
 */
function trunks(svg: string, c: Ctx): string {
  const out = c.repaint(svg)
  // The bark is the first group: each trunk painted as its body, its shaded side, its lit edge.
  const a = out.indexOf('<g>')
  const b = out.indexOf('</g>', a)
  if (a < 0 || b < 0) return out
  let i = 0
  const bark = out.slice(a, b).replace(/<path fill="[^"]*"([^>]*)\/>/g, (_all, rest: string) => {
    const k = i++ % 3
    return k === 2 ? `<path fill="${GLAZE}" stroke="none"${rest}/>` : `<path fill="${k ? COB : 'url(#df-x1v)'}"${rest.replace(/\sopacity="[^"]*"/, '')}/>`
  })
  return out.slice(0, a) + bark + out.slice(b).replace(/\sfill="[^"]*"/g, ` fill="${WASH}"`)
}

/** The lab's window: the night through the glass, its lights small dots of glaze, not rings. */
function labWindow(svg: string, c: Ctx): string {
  const lights: string[] = []
  // Each light is a circle drawn as two arcs from its left edge: its centre is a radius along.
  const dots = (d: string) => [...d.matchAll(/M([\d.-]+) ([\d.-]+)a([\d.]+)/g)].map(m => `M${t1(Number(m[1]) + Number(m[3]))} ${m[2]}h0`).join('')
  const out = c.repaint(
    svg.replace(/<g filter="url\(#sc-dof\)"[^>]*>((?:<path\b[^>]*\/>)+)<\/g>/, (_all, paths: string) => {
      for (const m of paths.matchAll(/\sd="([^"]*)"/g)) lights.push(dots(m[1] ?? ''))
      return '<!--df-lights-->'
    }),
  )
  const [warm = '', cool = ''] = lights
  return out.replace(
    '<!--df-lights-->',
    `<g fill="none" stroke-linecap="round" stroke-dasharray="none"><path stroke="${GLAZE}" stroke-width="1.3" d="${warm}"/><path stroke="${PALE}" stroke-width=".9" d="${cool}"/></g>`,
  )
}

/** Each mass drawn in one contour needs an id of its own, named for its scene, as two scenes may share a page. */
let masses = 0

/**
 * A mass of puffs (a crown of leaves, a billow of ash) in one loose contour
 * round the whole, as a brush draws it, not a ring round every puff: the mass
 * is defined once, then drawn twice, a wide line under, the flat washes over.
 * `inks`, when given, lays the mass's washes in those strengths in turn (its
 * puffs, then their shaded undersides) in place of the strengths its tones call for.
 */
function massed(svg: string, c: Ctx, inks?: readonly string[]): string {
  const line = lineOf(c.family, c.depth)
  let out = c.repaint(svg)
  if (line) out = out.replace(`<g ${line}>`, '<g>')
  // A wash is laid flat: a puff a little thin would show the line beneath it.
  out = out.replace(/\s(?:fill-)?opacity="[^"]*"/g, '')
  let i = 0
  if (inks) out = out.replace(/\sfill="[^"]*"/g, () => ` fill="${inks[i++ % inks.length]}"`)
  // The shaded tops of the ash's billows, a flat wash, would read as dots on the puffs: they are hatched instead.
  else if (c.family === 'cloud') out = out.replace(/\sfill="#[0-9a-f]{6}"/g, ' fill="url(#df-xl)"')
  if (!out.trim()) return ''
  const id = `df-${c.role.split('.')[0]}-m${++masses}`
  const w = n(0.9 + c.depth * 1.1)
  return `<defs><g id="${id}">${out}</g></defs><use href="#${id}" stroke="${DEEP}" stroke-width="${w}" stroke-linejoin="round"/><use href="#${id}"/>`
}

/**
 * A meadow or a stretch of ground sown with the gallery's grass tufts and
 * dots: the element as painted, then the sowing, masked to the element itself.
 */
function sown(pattern: 'tufts' | 'dots') {
  return (svg: string, c: Ctx): string => {
    const out = c.repaint(svg)
    // Half of an element painted in two calls (its group opened in one, closed in the next) cannot be masked on its own.
    if ((out.match(/<g\b/g) ?? []).length !== (out.match(/<\/g>/g) ?? []).length) return out
    const id = `df-${c.role.split('.')[0]}-s${++masses}`
    return (
      `<g id="${id}">${out}</g>` +
      `<mask id="${id}k" style="mask-type:alpha"><use href="#${id}"/></mask>` +
      `<rect width="${n(c.meta.sw ?? 1600)}" height="128" fill="url(#df-${pattern})" mask="url(#${id}k)"/>`
    )
  }
}

/** Where the desert's sand lies: it is painted open, and closed by its ripples, which sow it with dots. */
let sand = { y: 104, sw: 640 }

/** The puffed masses drawn in one contour, in the washes their tones call for. */
const MASSED = ['night.oak', 'night.trees', 'forest.shrubs', 'desert.scrub', 'volcano.puffs', 'volcano.ash'] as const

const scenery = (): Painter => {
  night = false
  masses = 0
  const p = painter(
    {
      ink: (color, family, depth, attr) => ink(color, family, depth, attr),
      line: lineOf,
      lineless: 0.6,
      faint: 'hide',
      post: (svg, family, depth) => (lineOf(family, depth) ? svg.replace(FAINT, '') : svg),
      // A pool of lamplight is the wash wiped back to the glaze.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${GLAZE}" opacity=".35"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.55)}" ry="${n(e.ry * 0.55)}" fill="${GLAZE}" opacity=".6"/>`,
      redraw: {
        sky,
        lens: () => '',
        water: (_svg, c) => ripples(c),
        // Dust in the air is not painted.
        'forest.motes': () => '',
        'lab.motes': () => '',
        'desert.glare': () => '',
        // The Milky Way's band is light, and is not painted; its drift of stars is.
        'space.milkyway': (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, '')),
        body: (_svg, c) => (c.role === 'space.earth' ? globe(c) : c.role === 'night.moon' ? moon(c) : sun(c)),
        // Stars are dots of glaze left in the night wash.
        stars: (svg, c) => c.repaint(svg).replace(/\sopacity="\.3"/g, ' opacity=".6"'),
        // Crowns of leaves, shrubs and billows of ash: one contour round each mass.
        ...Object.fromEntries(MASSED.map(r => [r, massed])),
        // The near trees framing the forest are its darkest mass: crowns in the middle wash and full cobalt, hatched bark.
        'forest.canopy': (svg, c) => massed(svg, c, [MID, COB]),
        'forest.trunks': trunks,
        'forest.meadow': sown('tufts'),
        'night.meadow': sown('tufts'),
        'forest.path': sown('dots'),
        'night.path': sown('dots'),
        'desert.sand': (svg, c) => {
          sand = { y: c.meta.y ?? 104, sw: c.meta.sw ?? 640 }
          return c.repaint(svg)
        },
        'desert.ripples': (svg, c) => `${c.repaint(svg)}<rect y="${n(sand.y)}" width="${n(sand.sw)}" height="${n(128 - sand.y)}" fill="url(#df-dots)"/>`,
        // The boulders in the near corner sit half under the ox-head: a pale wash in their contour, not a dark slab.
        'desert.boulders': (svg, c) => c.repaint(svg).replace(/fill="(?:#[0-9a-f]{6}|url\(#df-x\d\w\))"/, `fill="${PALE}"`),
        // The cone's shaded flank, away from the fire, hatched in cobalt over its wash, so the mountain reads as the
        // scene's mass under the wiped glow: from the rim down the flank to the foot, and back up its right edge.
        'volcano.cone': (svg, c) => {
          const out = c.repaint(svg).replace(/<g clip-path="url\(#sc-cone\)"><\/g>/, '')
          const m = /L([\d.-]+) ([\d.-]+)C([\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+ ([\d.-]+) ([\d.-]+))z$/.exec(c.meta.d ?? '')
          if (!m) return out
          const [x1, base, rx, ry] = [Number(m[1]), Number(m[2]), Number(m[4]), Number(m[5])]
          const cx = c.meta.cx ?? rx
          const flank = `M${n(rx)} ${n(ry)}Q${n(rx + 3)} ${n((ry + base) / 2)} ${n(cx + (x1 - cx) * 0.3)} ${n(base)}H${n(x1)}C${m[3]}z`
          return `${out}<path fill="url(#df-xl)" d="${flank}"/>`
        },
        // Clouds are long strokes of pale wash.
        cloud: (svg, c) => {
          let i = 0
          return c
            .repaint(svg)
            .replace(/<path\b([^>]*?)\sfill="[^"]*"([^>]*)\/>/g, (_all, a: string, b: string) =>
              i++ % 2 === 0 ? `<path${a} fill="${night ? PALE : WASH}" opacity=".7"${b.replace(/\sopacity="[^"]*"/, '')}/>` : `<path${a} fill="${night ? WASH : PALE}"${b}/>`,
            )
        },
        air: mist,
        // Light falling through the air is the wash wiped back toward the glaze.
        beam: (svg, c) => `<g opacity=".3">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${GLAZE}"`)}</g>`,
        // A glow is the wash wiped back toward the glaze, sized by eye: over the volcano a broad
        // dome (90 by 60) round the crater, and the forest's patch of sun a long low pool (70 by 12).
        glow: (_svg, c) => {
          const [rx, ry] = c.role === 'volcano.glow' ? [90, 60] : c.role === 'forest.sunpatch' ? [70, 12] : [0, 0]
          return rx ? `<ellipse cx="${n(c.meta.cx ?? 0)}" cy="${n(c.meta.cy ?? 0)}" rx="${rx}" ry="${ry}" fill="url(#df-wipe)"/>` : ''
        },
        // A fern's leaflets are too small for the full contour: a fine line, so the frond stays a wash.
        'forest.ferns': (svg, c) => c.repaint(svg).replace(/stroke-width="[\d.]+"/, 'stroke-width=".3"'),
        // The lab has no sky to say so, but it is night there too: its wall is washed at full strength. The lit
        // painting's washes of lamp and screen light are not shapes, and are left out; the lamp's glow is the
        // wall's wash wiped back toward the glaze, unlined (the wall's line is still open round it).
        'lab.wall': (svg, c) => {
          night = true
          return (
            c.repaint(svg.replace(/<circle\b[^>]*url\(#sc-(?:lamp|screen)wash\)[^>]*\/>/g, '')) +
            `<circle cx="${n(c.meta.cx ?? 0)}" cy="${n(c.meta.y ?? 0)}" r="70" fill="url(#df-wipe)" stroke="none"/>`
          )
        },
        'lab.window': labWindow,
        // The lit cottage's glow is glaze wiped out of the night wash, unlined: the cottages' line would ring it.
        'night.cottages': (svg, c) => c.repaint(svg).replace(/fill="url\(#sc-window[^)]*\)"/, 'fill="url(#df-wipe)" stroke="none"'),
        // The moonlit crest is a line wiped out of the wash, and on it stand the windmill and the church.
        'night.crest': (_svg, c) => {
          const on = crest(c)
          return `<path d="${c.meta.d ?? ''}" fill="none" stroke="${PALE}" stroke-width=".7" opacity=".8"/>` + windmill(on(0.8)) + church(on(0.93))
        },
      },
    },
    'df',
  )
  return { el: (role, svg, meta) => tight(p.el(role, svg, meta)), defs: svg => tight(p.defs(svg)) }
}

// ---------------------------------------------------------------- Claude

/**
 * Which wash a face of Claude takes: the top (0), a lit face (1), a face half turned away (2), and, as the gallery
 * hatches every face darker than .45, a side in shadow hatched (3) and the front of an arm or a leg in shadow
 * hatched lightly (4). The face with his eyes is never hatched: Fables turns him so it is always a little in
 * shadow, where the gallery mostly shows it lit, so it takes the half-turned wash with its streak of glaze, and
 * the eyes read on it.
 */
const washOf = (f: Face) =>
  f.name === 'top' ? 0 : f.name === 'bottom' ? 3 : f.light > 0.55 ? 1 : f.light > 0.45 || (f.name === 'front' && f.part === 'body') ? 2 : f.name !== 'front' ? 3 : 4

/** Claude brushed on the glaze: graded washes per face, his shadow side hatched, a loose deep contour, cobalt eyes. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  // Faces of one wash share a path, each wash baked into a shared gradient. A face joins the latest path of its
  // wash so long as nothing of another part drawn since overlaps it, so painter's order still holds: the two
  // faces of one box never overlap, and a leg clear of the next leg shares its washes.
  const runs: { k: number; d: string; boxes: { part: Face['part']; x0: number; y0: number; x1: number; y1: number }[] }[] = []
  for (const f of outlinedFaces(m)) {
    const k = washOf(f)
    const xs = f.pts.map(p => p[0])
    const ys = f.pts.map(p => p[1])
    const box = { part: f.part, x0: Math.min(...xs) - 0.5, y0: Math.min(...ys) - 0.5, x1: Math.max(...xs) + 0.5, y1: Math.max(...ys) + 0.5 }
    let into: (typeof runs)[number] | undefined
    for (let i = runs.length - 1; i >= 0; i--) {
      const r = runs[i]
      if (!r) break
      if (r.k === k) {
        into = r
        break
      }
      if (r.boxes.some(b => b.part !== box.part && b.x0 < box.x1 && box.x0 < b.x1 && b.y0 < box.y1 && box.y0 < b.y1)) break
    }
    if (!into) runs.push((into = { k, d: '', boxes: [] }))
    into.d += poly(f.pts, cx, floor)
    into.boxes.push(box)
  }
  const faces = runs.map(r => `<path fill="url(#df-c${r.k})" d="${r.d}"/>`).join('')
  // The eyes in dark cobalt, a glint of glaze left in each: both eyes one path, both glints one stroke of round dots.
  let pills = ''
  let glints = ''
  let lines = ''
  for (const e of m.eyes) {
    if (e.poly) {
      pills += poly(e.poly, cx, floor)
      glints += `M${t1((e.poly[3]?.[0] ?? 0) + cx)} ${t1((e.poly[3]?.[1] ?? 0) + floor)}h0`
    } else lines += poly(e.line ?? [], cx, floor, false)
  }
  // His shadow a pale wash on the ground, an ellipse fitted to the one the model casts.
  const xs = m.shadow.map(p => p[0])
  const ys = m.shadow.map(p => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  // He is baked in up to two dozen poses, so every character counts: the contour and the faces share one group's line.
  return tight(
    `<ellipse cx="${t1(cx + (x0 + x1) / 2)}" cy="${t1(floor + (y0 + y1) / 2)}" rx="${t1((x1 - x0) / 2)}" ry="${t1((y1 - y0) / 2)}" fill="${COB}" opacity=".25"/>` +
      `<g stroke="${DEEP}" stroke-width=".45"><path fill="${GLAZE}" stroke-width="1.5" d="${hulls}"/>${faces}</g>` +
      (pills ? `<path fill="${EYE}" d="${pills}"/><path stroke="${GLAZE}" stroke-width=".9" stroke-linecap="round" d="${glints}"/>` : '') +
      (lines ? `<path fill="none" stroke="${EYE}" stroke-linecap="round" d="${lines}"/>` : ''),
  )
}

// ---------------------------------------------------------------- the tile

const grad = (id: string, stops: [number, string][], attrs = 'x2="0" y2="1"') =>
  `<linearGradient id="${id}" ${attrs}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`

/**
 * The hatching on Claude's shadow side: strokes a fixed stride apart in his own units, not the face's box, so a
 * small arm or leg face takes a stroke or two and the body several, as the gallery brushes them, nearly upright.
 */
const HATCH = 'gradientUnits="userSpaceOnUse" x2="2.6" y2=".35" spreadMethod="repeat"'

/** The washes Claude's faces are brushed in, laid down once: loaded strokes across each face, pooling low. */
function faceWashes(): string {
  return (
    // The top: the palest wash, pooling at its near edge.
    grad('df-c0', [[0, mix(GLAZE, PALE, 0.3)], [0.6, mix(GLAZE, PALE, 0.55)], [1, mix(PALE, WASH, 0.45)]]) +
    // A lit face: the glaze left bare toward the top, a streak, strokes pooling to a wash at the foot.
    grad('df-c1', [[0, GLAZE], [0.2, GLAZE], [0.27, mix(GLAZE, PALE, 0.55)], [0.33, mix(GLAZE, PALE, 0.2)], [0.4, mix(GLAZE, PALE, 0.65)], [0.62, PALE], [0.68, mix(GLAZE, PALE, 0.75)], [0.76, mix(PALE, WASH, 0.35)], [0.92, mix(PALE, WASH, 0.8)], [1, mix(WASH, MID, 0.35)]]) +
    // Half turned away: a wash all over, a glaze streak high up, pooling deeper.
    grad('df-c2', [[0, mix(GLAZE, WASH, 0.4)], [0.1, mix(GLAZE, WASH, 0.15)], [0.18, mix(GLAZE, WASH, 0.5)], [0.5, mix(PALE, WASH, 0.75)], [0.56, mix(PALE, WASH, 0.45)], [0.63, WASH], [0.9, mix(WASH, MID, 0.5)], [1, mix(WASH, MID, 0.9)]]) +
    // In shadow: hatched, cobalt strokes down the face over a middle wash.
    grad('df-c3', [[0, mix(WASH, MID, 0.3)], [0.62, mix(WASH, MID, 0.3)], [0.68, mix(MID, COB, 0.25)], [0.8, mix(MID, COB, 0.25)], [0.86, mix(WASH, MID, 0.3)]], HATCH) +
    // The front of an arm or a leg in shadow: a paler wash, hatched with finer, paler strokes.
    grad('df-c4', [[0, mix(PALE, WASH, 0.75)], [0.7, mix(PALE, WASH, 0.75)], [0.75, mix(WASH, MID, 0.55)], [0.84, mix(WASH, MID, 0.55)], [0.89, mix(PALE, WASH, 0.75)]], HATCH)
  )
}

/** The hatchings dark masses are painted in: cobalt strokes over a wash, along each family's grain. */
function hatches(): string {
  let out = ''
  const angle = { d: -40, v: 90, h: 0 }
  for (const [g, a] of Object.entries(angle))
    for (const [k, bg, line, w, gap] of [
      [0, COB, DEEP, 0.6, 1.5],
      [1, MID, COB, 0.5, 1.8],
    ] as const)
      out +=
        `<pattern id="df-x${k}${g}" width="4" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${a})">` +
        `<rect width="4" height="${gap}" fill="${bg}"/><path d="M0 ${n(gap / 2)}H4" stroke="${line}" stroke-width="${w}"/></pattern>`
  // And hatching alone, the strokes laid over whatever wash is already there.
  return out + `<pattern id="df-xl" width="4" height="1.7" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><path d="M0 .85H4" stroke="${COB}" stroke-width=".5"/></pattern>`
}

/** Brush streaks swept across the sky's wash: by day a little loaded cobalt, by night glaze wiped through it. */
function brushes(): string {
  const rnd = seeded(606)
  let day = ''
  let wipe = ''
  for (let i = 0; i < 7; i++) {
    const x = rnd() * 230
    const y = 6 + rnd() * 90
    const len = 30 + rnd() * 70
    const s = stroke(x, y, len, 0.8 + rnd() * 1.2)
    if (i % 2) day += s
    wipe += s
  }
  const box = 'width="260" height="104" patternUnits="userSpaceOnUse"'
  return `<pattern id="df-brushd" ${box}><path fill="${WASH}" opacity=".35" d="${day}"/></pattern><pattern id="df-brushn" ${box}><path fill="${GLAZE}" opacity=".16" d="${wipe}"/></pattern>`
}

/** Over the whole tile, the unevenness of every wash: strokes a little loaded, strokes a little wiped. */
function evenness(): string {
  const rnd = seeded(616)
  let loaded = ''
  let wiped = ''
  for (let i = 0; i < 14; i++) {
    const s = stroke(rnd() * 150, 3 + rnd() * 52, 18 + rnd() * 40, 0.7 + rnd() * 1.1)
    if (i % 2) loaded += s
    else wiped += s
  }
  return `<pattern id="df-even" width="173" height="61" patternUnits="userSpaceOnUse" patternTransform="rotate(-3)"><path fill="${COB}" opacity=".06" d="${loaded}"/><path fill="${GLAZE}" opacity=".16" d="${wiped}"/></pattern>`
}

/**
 * What the gallery sows its mound with, as two tiles of their own: grass tufts
 * (three flicks of the brush fanning from a point) among dots, and dots among
 * short level strokes for bare ground.
 */
function sowing(): string {
  const rnd = seeded(808)
  let tufts = ''
  let dots = ''
  for (let i = 0; i < 6; i++) {
    const x = 6 + i * 16 + rnd() * 8
    const y = 6 + rnd() * 14
    const h = 2.6 + rnd() * 1.8
    tufts += `M${t1(x - 0.9)} ${t1(y)}l${t1(-1 - rnd())} ${t1(-h * 0.8)}M${t1(x)} ${t1(y)}v${t1(-h)}M${t1(x + 0.9)} ${t1(y)}l${t1(1 + rnd())} ${t1(-h * 0.8)}`
    dots += `M${t1(x + 7 + rnd() * 3)} ${t1(4 + rnd() * 16)}h.1`
  }
  let bare = ''
  for (let i = 0; i < 9; i++) bare += `M${t1(rnd() * 70)} ${t1(2 + rnd() * 16)}${i % 3 ? 'h.1' : `h${t1(2 + rnd() * 3)}`}`
  const tile = 'patternUnits="userSpaceOnUse"'
  return (
    `<pattern id="df-tufts" width="101" height="23" ${tile}><path d="${tufts}" stroke="${DEEP}" stroke-width=".55" stroke-linecap="round"/><path d="${dots}" stroke="${COB}" stroke-width="1" stroke-linecap="round"/></pattern>` +
    `<pattern id="df-dots" width="73" height="19" ${tile}><path d="${bare}" stroke="${MID}" stroke-width=".9" stroke-linecap="round"/></pattern>`
  )
}

/** The glaze's crackle: fine wandering lines, on a tile that does not repeat with the tiles. */
function crackle(): string {
  const rnd = seeded(707)
  let d = ''
  for (let i = 0; i < 16; i++) {
    let x = rnd() * 211
    let y = rnd() * 128
    let a = rnd() * Math.PI * 2
    d += `M${t1(x)} ${t1(y)}`
    for (let k = 0; k < 4 + Math.floor(rnd() * 6); k++) {
      a += (rnd() - 0.5) * 1.4
      x += Math.cos(a) * 6
      y += Math.sin(a) * 6
      d += `L${t1(x)} ${t1(y)}`
    }
  }
  return `<pattern id="df-crackle" width="211" height="128" patternUnits="userSpaceOnUse"><path d="${d}" fill="none" stroke="${CRACKLE}" stroke-opacity=".16" stroke-width=".35"/></pattern>`
}

/** The ox-head corner of the gallery's tile: a quarter disc, three leaves, two buds and two curls. */
function oxHead(): string {
  // The leaves, buds and curls below are in the gallery tile's units; this scales them to the band's corner.
  const k = 0.36
  const leaf = (ang: number, r0: number, len: number, wid: number) => {
    const ux = Math.cos(ang)
    const uy = Math.sin(ang)
    const side = (s: number) =>
      Array.from({ length: 11 }, (_, i) => {
        const t = i / 10
        const w = Math.pow(Math.sin(Math.PI * t), 0.75) * (wid / 2) * (1 - 0.3 * t) * s
        return [k * (ux * (r0 + len * t) - uy * w), k * (uy * (r0 + len * t) + ux * w)] as [number, number]
      })
    const pts = [...side(1), ...side(-1).reverse()]
    const mid = [k * ux * (r0 + len * 0.45), k * uy * (r0 + len * 0.45)] as const
    const inner = pts.map(([x, y]) => [x * 0.5 + mid[0] * 0.5, y * 0.5 + mid[1] * 0.5] as [number, number])
    const at = (t: number) => `${t1(k * ux * (r0 + len * t))} ${t1(k * uy * (r0 + len * t))}`
    return { outer: poly(pts), inner: poly(inner), vein: `M${at(0.12)}L${at(0.86)}` }
  }
  const leaves = [leaf(Math.PI / 4, 15, 50, 15), leaf(Math.PI / 4 - 0.56, 17, 38, 11), leaf(Math.PI / 4 + 0.56, 17, 38, 11)]
  const r = 21 * k
  const buds = [Math.PI / 4 - 0.3, Math.PI / 4 + 0.3].map(a => `<circle cx="${t1(Math.cos(a) * 46 * k)}" cy="${t1(Math.sin(a) * 46 * k)}" r="${t1(2.4 * k)}"/>`).join('')
  const curl = (a: number, s: number) => {
    const x = Math.cos(a) * 34 * k
    const y = Math.sin(a) * 34 * k
    return `M${t1(x * 0.8)} ${t1(y * 0.8)}L${t1(x)} ${t1(y)}L${t1(x * 1.25 + (s ? 0 : 1))} ${t1(y * 1.25 + (s ? 1 : 0))}`
  }
  return (
    `<g id="df-ox"><path fill="${DEEP}" d="M0 0H${t1(r)}A${t1(r)} ${t1(r)} 0 0 1 0 ${t1(r)}z"/>` +
    `<path d="M${t1(r * 0.66)} ${t1(r * 0.08)}A${t1(r * 0.67)} ${t1(r * 0.67)} 0 0 1 ${t1(r * 0.08)} ${t1(r * 0.66)}" fill="none" stroke="${GLAZE}" stroke-width=".4"/>` +
    `<path fill="${COB}" stroke="${DEEP}" stroke-width=".4" stroke-linejoin="round" d="${leaves.map(l => l.outer).join('')}"/>` +
    `<path fill="${MID}" opacity=".55" d="${leaves.map(l => l.inner).join('')}"/>` +
    `<path fill="none" stroke="${GLAZE}" stroke-opacity=".85" stroke-width=".4" stroke-linecap="round" d="${leaves.map(l => l.vein).join('')}"/>` +
    `<g fill="${COB}">${buds}</g>` +
    `<path fill="none" stroke="${DEEP}" stroke-width=".55" stroke-linecap="round" d="${curl(0.08, 1)}${curl(Math.PI / 2 - 0.08, 0)}"/></g>`
  )
}

/** The side of each tile of the tableau, in the stage's units: two tiles span the picture's height. */
const TILE = 64
/** How far the rule swings round each corner, leaving glaze for the ox-head. */
const CORNER = 27
/** The longest the chapter's lettering runs on its banderole: a title in capitals fits, a title of Ws is set close. */
const TAG_MAX = 140

/**
 * What the painting is brushed with: Claude's washes, the hatchings, the sky's strokes, the sowings and the
 * wiped glow; and the tile it is fired on, each tile glossy and pooling blue toward its joints, the washes'
 * unevenness and the glaze's crackle, which the texture lays over the picture. They are defined with the art,
 * so the pixel figure's flat stage, which takes no art, is not tiled: like ukiyoe's and engraving's, it keeps
 * only the frame, whose ox-head corners the frame defines itself.
 */
function defs(sw: number): string {
  const x0 = n((sw % TILE) / 2 - TILE)
  return (
    faceWashes() +
    hatches() +
    brushes() +
    sowing() +
    `<radialGradient id="df-wipe"><stop offset="0" stop-color="${GLAZE}" stop-opacity=".55"/><stop offset="1" stop-color="${GLAZE}" stop-opacity="0"/></radialGradient>` +
    evenness() +
    crackle() +
    `<radialGradient id="df-pool" r=".75"><stop offset=".55" stop-color="${POOL}" stop-opacity="0"/><stop offset="1" stop-color="${POOL}" stop-opacity=".2"/></radialGradient>` +
    `<radialGradient id="df-gloss"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    // One tile: glaze pooling blue toward its edges, a gloss, its joint; the tiles centred on the band.
    `<pattern id="df-tile" x="${x0}" width="${TILE}" height="${TILE}" patternUnits="userSpaceOnUse">` +
    `<rect width="${TILE}" height="${TILE}" fill="url(#df-pool)"/><ellipse cx="19" cy="13" rx="13" ry="6" fill="url(#df-gloss)"/>` +
    `<path d="M0 .3H${TILE}M.3 0V${TILE}" stroke="${JOINT}" stroke-opacity=".55" stroke-width=".8"/><path d="M1 1.2H${TILE}M1.2 1V${TILE}" stroke="#fff" stroke-opacity=".5" stroke-width=".5"/></pattern>`
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const DELFT: Look = {
  name: 'delft',
  label: 'Delftware',
  voice: 'a homely 17th-century Delft tile, plain-spoken as a Dutch proverb',
  cell: 'solid',
  figure: '3d',
  font: SERIF,
  charW: 5.1,
  caption: { fill: GLAZE, stroke: COB, ink: DEEP, radius: 2 },
  // Lettered in deep cobalt; code in full cobalt, numbers, failures and faces in manganese, a pass in bold cobalt.
  paper: { card: GLAZE, ink: DEEP, kinds: { code: COB, path: COB, fn: COB, num: MANGANESE, bad: MANGANESE, good: COB, face: MANGANESE } },
  inset: 8,
  titleColor: DEEP,
  art: {
    painter: scenery,
    hero,
    sky: GLAZE,
    ground: GLAZE,
    defs,
  },
  // Over the picture: the unevenness of the washes, the tiles, each glossy and pooling blue toward its joints, and
  // the crackle of the glaze, all defined with the art (see defs).
  texture: (sw, h) =>
    `<rect width="${sw}" height="${h}" fill="url(#df-even)"/><rect width="${sw}" height="${h}" fill="url(#df-tile)"/><rect width="${sw}" height="${h}" fill="url(#df-crackle)"/>`,
  // A margin of bare glaze and the double rule of the gallery's roundel, laid along the band and swung
  // round a quarter arc in each corner, leaving a spandrel of glaze where an ox-head sits, as on the tile.
  frame: (sw, h) => {
    const rule = (a: number, r: number) => {
      const c = n(Math.sqrt(r * r - a * a))
      const arc = (x: string, y: string) => `A${r} ${r} 0 0 0 ${x} ${y}`
      return (
        `M${c} ${a}H${n(sw - Number(c))}${arc(n(sw - a), c)}V${n(h - Number(c))}${arc(n(sw - Number(c)), n(h - a))}` +
        `H${c}${arc(String(a), n(h - Number(c)))}V${c}${arc(c, String(a))}z`
      )
    }
    const corners: [number, number, number][] = [[0, 0, 0], [sw, 0, 90], [sw, h, 180], [0, h, -90]]
    return (
      `<defs>${oxHead()}</defs>` +
      `<path fill="${GLAZE}" d="${corners.map(([x, y]) => `M${n(x)} ${n(y)}m-${CORNER} 0a${CORNER} ${CORNER} 0 0 0 ${CORNER * 2} 0a${CORNER} ${CORNER} 0 0 0 -${CORNER * 2} 0`).join('')}"/>` +
      `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${GLAZE}" stroke-width="3.4"/>` +
      `<rect x=".4" y=".4" width="${sw - 0.8}" height="${h - 0.8}" rx="1.5" fill="none" stroke="${EDGE}" stroke-opacity=".4" stroke-width=".8"/>` +
      `<path d="${rule(4.2, CORNER)}" fill="none" stroke="${COB}" stroke-width="1.5"/>` +
      `<path d="${rule(6.6, CORNER + 2.4)}" fill="none" stroke="${DEEP}" stroke-width=".45"/>` +
      corners.map(([x, y, a]) => `<use href="#df-ox" transform="translate(${n(x === 0 ? 1.6 : x - 1.6)} ${n(y === 0 ? 1.6 : y - 1.6)})${a ? ` rotate(${a})` : ''}"/>`).join('')
    )
  },
  // The chapter lettered on a painted banderole hung from the rule, clear of the corner.
  tag: (text, inset) => {
    const x = inset + CORNER - 2
    const y = inset - 3
    // The lettering's length glyph by glyph, by the widest of the serif's fallbacks (Georgia italic at 7.6 with .5
    // spacing, measured in Chrome; the caption's charW, 5.1, is its upright 9px letter): a title in capitals, or in
    // Ws, runs half as long again as one in lower case. Past the longest banderole the lettering is set close to
    // fit it, so it never runs over the ribbon's notches or the ox-head.
    const est = [...text].reduce((t, ch) => t + (/[MW]/.test(ch) ? 7.8 : /[mw…]/.test(ch) ? 7 : /[A-Z]/.test(ch) ? 5.7 : /\d/.test(ch) ? 4.7 : /[a-z]/.test(ch) ? (/[ijlrtf]/.test(ch) ? 2.9 : 4.4) : 3.5), 0)
    const len = Math.min(est, TAG_MAX)
    const w = len + 18
    const ribbon = `M${x} ${y}h${n(w)}l-3.4 6l3.4 6h${n(-w)}l3.4 -6z`
    return {
      svg:
        `<path d="${ribbon}" fill="${GLAZE}" stroke="${DEEP}" stroke-width=".7" stroke-linejoin="round"/>` +
        `<path d="M${x + 4.5} ${y + 2}h${n(w - 9)}M${x + 4.5} ${y + 10}h${n(w - 9)}" stroke="${COB}" stroke-width=".35"/>` +
        `<text x="${n(x + w / 2)}" y="${y + 8.6}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="7.6" letter-spacing=".5" fill="${DEEP}"` +
        `${est > TAG_MAX ? ` textLength="${n(len)}" lengthAdjust="spacingAndGlyphs"` : ''}>${escape(text)}</text>`,
      w: x + w + 4,
      h: y + 15,
    }
  },
  bubble: {
    font: SERIF,
    size: 9,
    charW: 5.1,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) => {
      // A tile of its own: glaze ruled twice in cobalt, a quarter disc in each inner corner.
      const q = (cx: number, cy: number, sx: number, sy: number) => `M${n(cx)} ${n(cy)}h${n(sx * 2.6)}a2.6 2.6 0 0 ${sx * sy > 0 ? 1 : 0} ${n(-sx * 2.6)} ${n(sy * 2.6)}z`
      const i = 2.4
      return (
        `<path fill="${GLAZE}" stroke="${COB}" stroke-width="1.1" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="2.5" fill="${GLAZE}" stroke="${COB}" stroke-width="1.5"/>` +
        `<rect x="${n(x + i)}" y="${n(y + i)}" width="${n(w - i * 2)}" height="${n(h - i * 2)}" rx="1" fill="none" stroke="${DEEP}" stroke-width=".45"/>` +
        `<path fill="${COB}" d="${q(x + i, y + i, 1, 1)}${q(x + w - i, y + i, -1, 1)}${q(x + w - i, y + h - i, -1, -1)}${q(x + i, y + h - i, 1, -1)}"/>`
      )
    },
  },
}

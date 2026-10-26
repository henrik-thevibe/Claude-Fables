/**
 * Pop Art, after the gallery's "Pop Art: 1960s" (index.html, style 17,
 * `popart`): a Lichtenstein panel blown up from a romance comic.
 *
 * The art bible, translated from the gallery's panel to the Fables' worlds:
 *
 * - The medium is a comic panel painted large: a handful of flat printer's
 *   inks (a primary blue, red, yellow, black and white, with a pop green and
 *   Claude's coral) and Ben-Day dots for every tone between them. A tone is
 *   never blended: pink is red dots on white, orange red dots on yellow, a
 *   pale blue blue dots on white, a shade darker dots on the flat ink. The
 *   dots sit on a 45-degree screen, big enough to count.
 * - Everything solid carries a heavy black keyline, heavier toward the front.
 * - The sky is the plate's field: flat blue under a screen of darker blue
 *   dots. A dawn or a sunset is not a blend but stripes of flat screens laid
 *   across it, blue over orange dots over yellow; night is the field gone
 *   navy, its dots a brighter blue.
 * - The sun is a yellow disc keyed in black inside a wheel of yellow rays,
 *   the moon a yellow disc with red-dotted craters, the Earth a dotted blue
 *   ball with green continents and white swooshes of cloud.
 * - Stars are comic stars: five points, yellow, keyed in black.
 * - Clouds are comic clouds: flat-bottomed white heaps of scalloped puffs,
 *   keyed in black, the night's one lying low across the moon in pale blue
 *   dots. Volcanic ash is pale blue dots on white, its billows merged under
 *   one heavy outline.
 * - Land and rock take the primaries by what they are: warm earth as red
 *   dots on yellow and flat red, stone as blue dots on white and flat blue,
 *   the far distance a step paler. Foliage and grass are the pop green, its
 *   dark dotted, its light green dots on yellow. Ground is the same flat
 *   inks under the keyline.
 * - Buildings are flat blue and white screens with yellow windows keyed in
 *   black. Glass is the comic mirror: pale blue dots crossed by diagonal white
 *   gleams. Through the lab's window the city is a navy silhouette with fat
 *   yellow lights, the gleams crossing it too, in a heavy black frame; the
 *   monitors are the same mirror in black bezels, their code lettered in navy
 *   and red. A wet street or a polished floor shows no reflection, only a few
 *   white streaks of shine.
 * - Fire and lava are the comic explosion: yellow, orange dots and red,
 *   keyed in black, and the crater throws up a jagged yellow burst.
 * - Lamps are flat yellow, their pools of light yellow dots on the ground.
 * - Air has no blend either: mist is a band of white dots, beams of light
 *   are wedges of yellow dots, and glows and faint washes are not drawn.
 *   Life keeps to a few specks: the forest's motes are half as many dots.
 * - Claude is the plate's: flat coral planes built from red dots, the top
 *   pale, the sides deep, under a heavy black keyline with every crease
 *   inked; inked pill eyes with a big white glint, the glossy white gleam on
 *   his brow and his top, rosy dotted cheeks when he is happy and one big
 *   blue tear when he is sad. His shadow is a lozenge of black dots.
 * - The page: a heavy black panel border in a white gutter; the chapter in a
 *   yellow narration box lettered in capitals ("CHAPTER ONE..."); the
 *   caption lettered in capitals in a scalloped white thought cloud whose
 *   puffs trail down to Claude.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, num as n, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const INK = '#141010'
const WHITE = '#fff'
const BLUE = '#3b70da'
const RED = '#e0302a'
const YELLOW = '#ffd640'
const GREEN = '#2f9a44'
/** The lettering: a bold grotesk, as the gallery letters its balloon. */
const LETTERS = "'Arial Rounded MT Bold', 'Helvetica Neue', Helvetica, Arial, sans-serif"

/**
 * A swatch of the press: a flat ink, or a screen of dots of one ink on
 * another. `plain` is its overall tone, for what cannot take a pattern (a
 * line, a gradient stop, currentColor).
 */
type Swatch = { plain: string; base?: string; dot?: string; r?: number; pitch?: number }

const SW = {
  ink: { plain: INK },
  navy: { plain: '#16286a' },
  /** The night field: navy under brighter blue dots. */
  nv: { plain: '#21408e', base: '#16286a', dot: '#3f78e0', r: 0.8, pitch: 3.2 },
  /** The plate's field: blue under darker blue dots. */
  bd: { plain: BLUE, base: BLUE, dot: '#1a43a3', r: 1, pitch: 3.2 },
  blue: { plain: BLUE },
  lb: { plain: '#b4caf2', base: WHITE, dot: '#4a7ee0', r: 0.85, pitch: 2.6 },
  white: { plain: WHITE },
  deep: { plain: '#a8221a' },
  rd: { plain: '#c4281f', base: RED, dot: '#9a1a12', r: 0.9, pitch: 2.6 },
  red: { plain: RED },
  pk: { plain: '#f6aaa2', base: WHITE, dot: RED, r: 0.85, pitch: 2.6 },
  or: { plain: '#f5933a', base: YELLOW, dot: RED, r: 0.85, pitch: 2.6 },
  yellow: { plain: YELLOW },
  yw: { plain: '#fff1b0', base: WHITE, dot: YELLOW, r: 1, pitch: 2.6 },
  brown: { plain: '#7a3214' },
  dg: { plain: '#17602c' },
  gd: { plain: '#237a36', base: GREEN, dot: '#17602c', r: 0.9, pitch: 2.6 },
  green: { plain: GREEN },
  yg: { plain: '#a9cc3c', base: YELLOW, dot: GREEN, r: 0.95, pitch: 2.6 },
} as const satisfies Record<string, Swatch>
type Key = keyof typeof SW

const fillOf = (k: Key) => ('dot' in SW[k] ? `url(#pa-${k})` : SW[k].plain)

/** The press's ramps, dark to light, by what they print. */
const RAMP: Record<string, readonly Key[]> = {
  blue: ['ink', 'navy', 'bd', 'blue', 'lb', 'white'],
  stone: ['ink', 'navy', 'blue', 'lb', 'white'],
  red: ['ink', 'deep', 'red', 'pk', 'white'],
  warm: ['ink', 'deep', 'rd', 'red', 'or', 'yellow', 'yw'],
  earth: ['ink', 'brown', 'deep', 'or', 'yellow', 'yw'],
  green: ['ink', 'dg', 'gd', 'green', 'yg', 'yellow'],
  bark: ['ink', 'brown', 'brown', 'deep', 'or'],
  fire: ['deep', 'red', 'or', 'yellow', 'yellow'],
  /** Volcanic rock: black and brown, red-hot dots where the glow catches it. */
  volcanic: ['ink', 'ink', 'brown', 'deep', 'rd', 'or'],
  /** Moonlit stone: blues, never paper white. */
  moonlit: ['ink', 'navy', 'nv', 'bd', 'blue', 'lb'],
  lamp: ['or', 'yellow', 'yellow', 'yw'],
  cool: ['lb', 'white'],
  glass: ['ink', 'navy', 'bd', 'lb', 'white'],
}
const pick = (ramp: readonly Key[], t: number): Key => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))] ?? 'ink'

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false
/** Which world is being painted, from its sky's role: the desert prints its stone warm. */
let world = ''

/** Browns and tans: earth, sand, wood, unlit but warm. */
function brownish(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r > b + 16
}

/** A lit color as the press prints it: the swatch of its ramp at its lightness, lifted so dim scenes still print bright. */
function swatch(color: string, family: Family, depth: number): Key {
  const l = lum(color)
  const t = Math.min(1, (night ? Math.pow(l, 0.62) * 1.08 : Math.pow(l, 0.75) * 1.1) + (depth < 0.2 ? 0.1 : 0))
  const warm = isWarm(color)
  const green = isGreen(color)
  switch (family) {
    case 'fire':
      return pick(RAMP.fire!, Math.pow(l, 0.7))
    case 'lamp':
    case 'stars':
    case 'life':
    case 'body':
      return warm || l > 0.55 ? pick(RAMP.lamp!, l) : pick(RAMP.cool!, t)
    case 'foliage':
    case 'grass':
      return pick(RAMP.green!, warm ? Math.min(t, 0.5) : t)
    case 'bark':
      return pick(RAMP.bark!, t)
    case 'cloud':
    case 'air':
    case 'beam':
    case 'glow':
      return warm ? pick(RAMP.lamp!, t) : pick(RAMP.cool!, t)
    case 'glass':
    case 'water':
      return pick(RAMP.glass!, t)
    case 'land':
    case 'rock':
    case 'ground':
    case 'mark':
      if (world === 'volcano') return pick(RAMP.volcanic!, t)
      return green ? pick(RAMP.green!, t) : warm || brownish(color) || world === 'desert' ? pick(RAMP.earth!, t) : pick(night && world !== 'space' ? RAMP.moonlit! : RAMP.stone!, t)
    case 'built':
      return warm ? pick(RAMP.red!, t) : pick(RAMP.blue!, t)
    default:
      return warm ? pick(RAMP.warm!, t) : pick(RAMP.blue!, t)
  }
}

/** The families that print without a keyline. */
const UNLINED: readonly Family[] = ['sky', 'air', 'beam', 'glow', 'stars', 'life', 'lens', 'water', 'body']
/** The families whose lines are their own colors, not the key's black. */
const OWN_LINE: readonly Family[] = ['fire', 'lamp', 'stars', 'life', 'mark', 'water', 'glow', 'beam', 'air']

function ink(color: string, family: Family, depth: number, attr: string): string {
  if (attr === 'stroke' && !OWN_LINE.includes(family)) return INK
  const k = swatch(color, family, depth)
  // Glass lighter than the night's navy is the comic mirror; the dark steps stay flat for what is seen through it.
  if (attr === 'fill' && family === 'glass' && RAMP.glass!.indexOf(k) > 1) return 'url(#pa-glass)'
  return attr === 'fill' ? fillOf(k) : SW[k].plain
}

/** A redraw names a swatch of the press in the lit painting as `url(#pa-<swatch>)`; the url rule prints it. */
const press = (k: Key | 'glass') => `url(#pa-${k})`

// ---------------------------------------------------------------- the scenery

/** The sky's band of a lit color: the plate's field, its night navy, or a stripe of sunset. */
function skyKey(color: string): Key {
  const l = lum(color)
  if (isWarm(color) && l > 0.25) return l < 0.42 ? 'rd' : l < 0.62 ? 'or' : l < 0.82 ? 'yellow' : 'yw'
  if (isWarm(color)) return 'nv'
  return l < 0.3 ? 'nv' : l < 0.62 ? 'bd' : 'lb'
}

/** The sky: the plate's dot field, laid in flat stripes where the lit sky changes color. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  night = lum(top) < 0.2 && lum(low) < 0.45
  world = c.role.split('.')[0] ?? ''
  const sw = c.meta.sw ?? 640
  const H = 128
  // Each stop holds the sky from halfway to the stop before to halfway to the next; equal neighbours merge.
  const bands: { y0: number; y1: number; k: Key }[] = []
  stops.forEach((s, i) => {
    const prev = stops[i - 1]
    const next = stops[i + 1]
    const y0 = prev ? ((prev.offset + s.offset) / 2) * H : 0
    const y1 = next ? ((s.offset + next.offset) / 2) * H : H
    const k = skyKey(s.color)
    const last = bands[bands.length - 1]
    if (last && last.k === k) last.y1 = y1
    else bands.push({ y0, y1, k })
  })
  if (!bands.length) bands.push({ y0: 0, y1: H, k: night ? 'nv' : 'bd' })
  // The top of the panel is always the plate's field.
  const first = bands[0]
  if (first && first.k !== 'bd' && first.k !== 'nv') bands.unshift({ y0: 0, y1: first.y0 + (first.y1 - first.y0) * 0.35, k: night ? 'nv' : 'bd' }), (first.y0 = bands[0]!.y1)
  return bands.map(b => `<rect y="${n(b.y0)}" width="${n(sw)}" height="${n(b.y1 - b.y0 + 0.5)}" fill="${fillOf(b.k)}"/>`).join('')
}

/** Stars as comic stars: every shape becomes a group, keeping its own attributes and animation, of stars at its points. */
function stars(svg: string, c: Ctx): string {
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#pa-star" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap|opacity)="[^"]*"/g, '')
      return `<g${kept}>${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** A jagged comic burst centred on 0 0: `k` points, from radius `r` in to `r * inner`. */
function burstPath(r: number, k: number, inner: number, seed = 0): string {
  const pts: string[] = []
  for (let i = 0; i < k * 2; i++) {
    const a = (i * Math.PI) / k - Math.PI / 2
    const q = i % 2 ? r * inner : r * (0.82 + 0.18 * Math.abs(Math.sin(i * 2.3 + seed)))
    pts.push(`${t1(Math.cos(a) * q)} ${t1(Math.sin(a) * q)}`)
  }
  return `M${pts.join('L')}z`
}

/** A five-point star centred on 0 0. */
function starPath(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const q = i % 2 ? r * 0.42 : r
    pts.push(`${t1(Math.cos(a) * q)} ${t1(Math.sin(a) * q)}`)
  }
  return `M${pts.join('L')}z`
}

/** The sun: a yellow disc keyed in black inside a slowly turning wheel of yellow rays. */
function sun(c: Ctx, scale: number): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = (c.meta.r ?? 8) * scale
  if (c.meta.part === 'halo') {
    let rays = ''
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI * 2) / 14
      const w = Math.PI / 30
      const p = (ang: number, d: number) => `${t1(Math.cos(ang) * d)} ${t1(Math.sin(ang) * d)}`
      rays += `M${p(a - w * 2, r * 1.25)}L${p(a, r * 2.6)}L${p(a + w * 2, r * 1.25)}z`
    }
    return (
      `<g transform="translate(${n(cx)} ${n(cy)})"><path fill="${YELLOW}" stroke="${INK}" stroke-width=".7" stroke-linejoin="round" d="${rays}">` +
      `<animateTransform attributeName="transform" type="rotate" values="0;${n(360 / 14)}" dur="6s" repeatCount="indefinite"/></path></g>`
    )
  }
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${YELLOW}" stroke="${INK}" stroke-width="1.3"/>` +
    `<path fill="none" stroke="${WHITE}" stroke-width="${n(r * 0.16)}" stroke-linecap="round" d="M${n(cx - r * 0.62)} ${n(cy - r * 0.15)}A${n(r * 0.64)} ${n(r * 0.64)} 0 0 1 ${n(cx - r * 0.1)} ${n(cy - r * 0.62)}"/>`
  )
}

/** The moon: a yellow disc keyed in black, its craters red dots on yellow, a white gleam. */
function moon(cx: number, cy: number, r: number): string {
  const crater = (dx: number, dy: number, cr: number) => `<circle cx="${n(cx + dx * r)}" cy="${n(cy + dy * r)}" r="${n(cr * r)}"/>`
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${YELLOW}" stroke="${INK}" stroke-width="1.2"/>` +
    `<g fill="url(#pa-or)" stroke="${INK}" stroke-width=".5">${crater(0.3, 0.15, 0.28)}${crater(-0.25, 0.42, 0.16)}${crater(0.05, -0.45, 0.14)}</g>` +
    `<path fill="none" stroke="${WHITE}" stroke-width="${n(r * 0.14)}" stroke-linecap="round" d="M${n(cx - r * 0.66)} ${n(cy + r * 0.05)}A${n(r * 0.66)} ${n(r * 0.66)} 0 0 1 ${n(cx - r * 0.2)} ${n(cy - r * 0.6)}"/>`
  )
}

/** The Earth as a comic would ink it: a dotted blue ball, green continents, white swooshes of cloud. */
function earth(cx: number, cy: number, r: number): string {
  const P = (x: number, y: number) => `${n(cx + x * r)} ${n(cy + y * r)}`
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#pa-bd)"/>` +
    `<path fill="${GREEN}" stroke="${INK}" stroke-width=".7" stroke-linejoin="round" d="M${P(-0.55, -0.55)}Q${P(-0.1, -0.75)} ${P(0.05, -0.4)}Q${P(-0.05, -0.05)} ${P(-0.35, 0.05)}Q${P(-0.6, 0.35)} ${P(-0.85, 0.1)}Q${P(-0.9, -0.25)} ${P(-0.55, -0.55)}z` +
    `M${P(0.25, 0.05)}Q${P(0.6, -0.1)} ${P(0.75, 0.25)}Q${P(0.6, 0.65)} ${P(0.3, 0.7)}Q${P(0.1, 0.4)} ${P(0.25, 0.05)}z"/>` +
    `<path fill="none" stroke="${WHITE}" stroke-width="${n(r * 0.09)}" stroke-linecap="round" d="M${P(-0.7, 0.45)}Q${P(-0.2, 0.3)} ${P(0.2, 0.42)}M${P(0.1, -0.7)}Q${P(0.45, -0.62)} ${P(0.7, -0.35)}"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${INK}" stroke-width="1.2"/>`
  )
}

/** A band of dots lying across the scene (mist, haze), drifting as the element it replaces did. */
function band(c: Ctx, svg: string, fill: string, opacity: number): string {
  const y = c.meta.y ?? 80
  const h = c.meta.h ?? 12
  const w = c.meta.sw ?? 640
  return `<g opacity="${opacity}"><rect x="-20" y="${n(y + h * 0.2)}" width="${n(w + 40)}" height="${n(h * 0.6)}" fill="${fill}"/>${c.motion(svg)}</g>`
}

/** A wet floor's shine: no reflection, only a few white streaks across it. */
function shine(c: Ctx): string {
  const y = c.meta.y ?? 100
  const h = c.meta.h ?? 24
  const sw = c.meta.sw ?? 640
  let d = ''
  for (let i = 0; i < Math.round(sw / 70); i++) {
    const x = ((i * 97) % sw) + 8
    const yy = y + 3 + ((i * 7) % Math.max(4, h - 6))
    d += `M${n(x)} ${n(yy)}h${n(14 + ((i * 13) % 18))}m4 0h4`
  }
  return `<path fill="none" stroke="${WHITE}" stroke-width=".9" stroke-linecap="round" d="${d}"/>`
}

/**
 * The lab's window as the comic mirror: the pane pale blue dots crossed by white
 * gleams, the city a navy silhouette with yellow lights, the gleams again over
 * it, all in a heavy black frame on a blue sill.
 */
function window_(svg: string, c: Ctx): string {
  const x = c.meta.cx ?? 0
  const y = c.meta.cy ?? 0
  const w = c.meta.sw ?? 100
  const h = c.meta.h ?? 50
  const box = `x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"`
  const city = /<path fill="#141a2c" d="([^"]*)"/.exec(svg)?.[1] ?? ''
  const lights = /<path fill="#f6c97a" d="([^"]*)"/.exec(svg)?.[1] ?? ''
  return (
    `<clipPath id="pa-pane"><rect ${box}/></clipPath><g clip-path="url(#pa-pane)">` +
    `<rect ${box} fill="${press('glass')}"/>` +
    (city ? `<path fill="${SW.navy.plain}" d="${city}"/>` : '') +
    (lights ? `<path fill="${YELLOW}" stroke="${INK}" stroke-width=".4" d="${lights}"/>` : '') +
    `<rect ${box} fill="url(#pa-gleam)" opacity=".8"/></g>` +
    `<rect x="${n(x - 5)}" y="${n(y + h)}" width="${n(w + 10)}" height="3" fill="${BLUE}" stroke="${INK}" stroke-width=".8"/>` +
    `<path fill="none" stroke="${INK}" stroke-width="2.4" d="M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}zM${n(x + w / 2)} ${n(y)}v${n(h)}"/>`
  )
}

/** The lab's monitors: black bezels round mirror screens, their lines of code flat blue and red. */
function monitors(svg: string, c: Ctx): string {
  return c.repaint(
    svg
      .replace(/fill="#0c2628"/g, `fill="${press('glass')}"`)
      // The code lines are lettered, not keyed.
      .replace(/<rect\b([^>]*\sheight="1"[^>]*?)fill="(#[0-9a-fA-F]{6})"/g, (_a, pre: string, col: string) => `<rect${pre}stroke="none" fill="${press(isWarm(col) || col === '#c8a0ff' ? 'red' : 'navy')}"`),
  )
}

/**
 * A comic cloud: a flat-bottomed heap of puffs, 100 wide, standing on 0 0, its
 * line kept the same weight however the cloud is stretched.
 */
const CLOUD = (() => {
  const pts: [number, number][] = [[0, 0], [9, -6], [24, -11], [44, -15], [64, -13], [81, -8], [93, -4], [100, 0]]
  let d = 'M0 0'
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!
    const [x1, y1] = pts[i]!
    const r = Math.hypot(x1 - x0, y1 - y0) * 0.58
    d += `A${n(r)} ${n(r)} 0 0 1 ${x1} ${y1}`
  }
  return `<path id="pa-cloud" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round" vector-effect="non-scaling-stroke" d="${d}z"/>`
})()

/** Clouds are white, keyed in black; the volcano's ash pale blue dots on white, its puffs merged under one keyline. */
function cloud(svg: string, c: Ctx): string {
  const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
  const ash = c.role === 'volcano.ash' || c.role === 'volcano.puffs'
  const fill = ash || (night && lum(lit) < 0.3) ? press('lb') : WHITE
  // The lit painting's slivers of cloud, each a dark body from its left end: its width is 4 times its first curve's reach.
  // A sliver lying inside the one before it is that cloud's own light, not a cloud.
  let reach = -Infinity
  const heaps = (ash ? [] : [...svg.matchAll(/\sd="M([\d.-]+) ([\d.-]+)q([\d.]+) -/g)]).flatMap(m => {
    const x = Number(m[1])
    const w = Number(m[3]) * 4
    if (x < reach) return []
    reach = x + w
    return [{ x, y: Number(m[2]), w }]
  })
  if (heaps.length) {
    // The night's one cloud lies low across the moon, leaving most of her clear.
    const low = c.role === 'night.clouds'
    const uses = heaps
      .map(({ x, y, w }) => `<use href="#pa-cloud" transform="translate(${n(x)} ${n(y + (low ? 5 : 1.5))}) scale(${n(w / 100)} ${n(Math.min(low ? 0.5 : 0.85, w / 150))})"/>`)
      .join('')
    return `<g fill="${fill}">${uses}${c.motion(svg)}</g>`
  }
  // Puffs drawn twice: a black silhouette, stroked wide, then the fill alone over it, so overlaps merge into one keyed outline.
  const body = c
    .repaint(svg)
    .replace(/<g\b[^>]*>/g, '<g>')
    .replace(/\sopacity="[^"]*"/g, '')
  const as = (f: string) => body.replace(/\sfill="(?!none)[^"]*"/g, ` fill="${f}"`)
  return `<g stroke="${INK}" stroke-width="2" stroke-linejoin="round">${as(INK)}</g><g stroke="none">${as(fill)}</g>`
}

const scenery = () => {
  night = false
  world = ''
  const p = painter(
    {
      ink: (color, family, depth, attr) => ink(color, family, depth, attr),
      // A gradient prints as one flat swatch: the press has no blends. A wash of light is not printed.
      url: (id, family, attr, g) => {
        if (id.startsWith('pa-')) {
          const k = id.slice(3)
          return k in SW ? (attr === 'stroke' ? SW[k as Key].plain : fillOf(k as Key)) : `url(#${id})`
        }
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr !== 'stroke' && mean.opacity < 0.5) return 'none'
        return ink(mean.color, family, 0.5, attr === 'stroke' ? 'stroke' : 'fill')
      },
      line: (family, depth) =>
        UNLINED.includes(family) ? '' : `stroke="${INK}" stroke-width="${n(depth < 0.2 ? 0.4 : 0.45 + depth * 0.9)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool of light: yellow dots on the ground with a flat yellow heart.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="url(#pa-yd)"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.4)}" ry="${n(e.ry * 0.4)}" fill="${YELLOW}" opacity=".7"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        'space.milkyway': svg => {
          const band = /<ellipse\b[^>]*\/>/.exec(svg)?.[0] ?? ''
          return band.replace(/\sfill="[^"]*"/, ' fill="url(#pa-wd)"').replace(/\sfilter="[^"]*"/, '').replace('<ellipse', '<ellipse opacity=".5"')
        },
        'forest.sun': (_s, c) => sun(c, 1.6),
        'desert.sun': (_s, c) => sun(c, 1.25),
        'night.moon': (_s, c) => (c.meta.part === 'halo' ? '' : moon(c.meta.cx ?? 0, c.meta.cy ?? 0, (c.meta.r ?? 9) * 1.2)),
        'space.earth': (_s, c) => earth(c.meta.cx ?? 0, c.meta.cy ?? 0, c.meta.r ?? 30),
        cloud,
        // The forest's motes are a comic's few specks of sun, not a haze of them.
        'forest.motes': (svg, c) => {
          let i = 0
          return c.repaint(svg.replace(/<circle\b[\s\S]*?<\/circle>/g, m => (i++ % 2 ? '' : m)))
        },
        'lab.window': window_,
        'lab.monitors': monitors,
        air: (svg, c) => band(c, svg, 'url(#pa-wd)', c.meta.veil ? 0.55 : 0.9),
        beam: (svg, c) => `<g opacity=".75">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#pa-yd)"')}</g>`,
        water: (_s, c) => shine(c),
        // The crater throws up a jagged comic burst, yellow round red, keyed in black, throbbing.
        'volcano.crater': (svg, c) => {
          const r = (c.meta.r ?? 10) * 1.9
          return (
            `<g transform="translate(${n(c.meta.cx ?? 0)} ${n((c.meta.cy ?? 36) - 2)})"><g stroke="${INK}" stroke-linejoin="round">` +
            `<path fill="${YELLOW}" stroke-width="1" d="${burstPath(r, 11, 0.62)}"/><path fill="${RED}" stroke-width=".6" d="${burstPath(r * 0.55, 9, 0.6, 2)}"/>` +
            `<animateTransform attributeName="transform" type="scale" values="1;1.12;.96;1" dur=".9s" repeatCount="indefinite"/></g></g>` +
            c.repaint(svg)
          )
        },
      },
    },
    'pa',
  )
  // The faint washes the rules hide are left out of the markup altogether, and the lit
  // painting's templates lose theirs too: the press prints a shape or nothing.
  return {
    ...p,
    el: (...a: Parameters<typeof p.el>) => p.el(...a).replace(/<(?:path|rect|circle|ellipse|use)\b[^>]*\svisibility="hidden"[^>]*\/>/g, ''),
    defs: (svg: string) => p.defs(svg).replace(/<path\b[^>]*\sopacity="0?\.[0-5]\d*"[^>]*\/>/g, ''),
  }
}

// ---------------------------------------------------------------- Claude

/** Claude's planes: flat coral, each built from red dots, the top pale and the sides deep. */
/** Claude's planes, each a screen named in two letters (`pa-c<letter>`): his poses are baked many times over. */
const CLAUDE = {
  t: { base: '#ffc2a0', dot: '#ea4526', r: 0.56 },
  f: { base: '#ffa47e', dot: '#e33c1c', r: 0.7 },
  s: { base: '#f47c55', dot: '#d23419', r: 0.66 },
  d: { base: '#d9432c', dot: '#9a1d12', r: 0.66 },
  l: { base: '#f47c55', dot: '#ad2316', r: 0.6 },
  m: { base: '#c9372a', dot: '#8a1a10', r: 0.62 },
}
const CLAUDE_PITCH = 1.8

type P2 = readonly [number, number]
/** A point of a quad face: `u` across from its left edge, `v` down from its top. Corners as clawd3d orders a front face: BL, BR, TR, TL. */
function at(q: readonly P2[], u: number, v: number): [number, number] {
  const [bl, br, tr, tl] = q as [P2, P2, P2, P2]
  const top = [tl[0] + (tr[0] - tl[0]) * u, tl[1] + (tr[1] - tl[1]) * u]
  const bot = [bl[0] + (br[0] - bl[0]) * u, bl[1] + (br[1] - bl[1]) * u]
  return [top[0]! + (bot[0]! - top[0]!) * v, top[1]! + (bot[1]! - top[1]!) * v]
}

/** Claude as the plate paints him. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  // The planes in painter's order, runs of one swatch sharing a path; the hairline key on them inks every crease.
  let faces = ''
  let tone = ''
  let d = ''
  for (const f of outlinedFaces(m)) {
    const lit = f.light > 0.3
    const t = f.part === 'leg' ? (lit ? 'l' : 'm') : f.name === 'top' ? 't' : f.name === 'front' || f.name === 'back' ? 'f' : f.name === 'bottom' ? 'd' : lit ? 's' : 'd'
    if (t !== tone && d) {
      faces += `<path fill="url(#pa-c${tone})" d="${d}"/>`
      d = ''
    }
    tone = t
    d += poly(f.pts, cx, floor)
  }
  if (d) faces += `<path fill="url(#pa-c${tone})" d="${d}"/>`

  // The white gleams: a bar along the brow and down the left edge, and a patch on the top.
  let gleam = ''
  const body = m.parts.find(p => p.name === 'body')
  const front = body?.faces.find(f => f.name === 'front')
  if (front && front.pts.length === 4) {
    const q = front.pts
    const wide = Math.hypot(q[2]![0] - q[3]![0], q[2]![1] - q[3]![1])
    const tall = Math.hypot(q[3]![0] - q[0]![0], q[3]![1] - q[0]![1])
    if (wide > tall * 0.75) {
      const quad = (pts: [number, number][]) => poly(pts, cx, floor)
      gleam +=
        quad([at(q, 0.06, 0.06), at(q, 0.38, 0.06), at(q, 0.35, 0.13), at(q, 0.06, 0.13)]) +
        quad([at(q, 0.41, 0.06), at(q, 0.48, 0.06), at(q, 0.45, 0.13), at(q, 0.41, 0.13)]) +
        quad([at(q, 0.035, 0.17), at(q, 0.085, 0.17), at(q, 0.085, 0.4), at(q, 0.035, 0.36)])
    }
  }
  const top = body?.faces.find(f => f.name === 'top')
  if (top && top.pts.length === 4) {
    // The top's corners run front-left, front-right, back-right, back-left: as a quad, back is up.
    const q = top.pts
    gleam += poly([at(q, 0.08, 0.2), at(q, 0.42, 0.2), at(q, 0.4, 0.38), at(q, 0.08, 0.38)], cx, floor)
  }

  // Eyes: inked pills with a big white glint; every other eye a fat brush line.
  let eyes = ''
  let pupils = ''
  let glints = ''
  let sad = false
  let happy: [number, number][] = []
  const pills: { x: number; y: number; w: number; h: number }[] = []
  for (const e of m.eyes) {
    if (e.poly) {
      pupils += poly(e.poly, cx, floor)
      const xs = e.poly.map(p => p[0] + cx)
      const ys = e.poly.map(p => p[1] + floor)
      const box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
      pills.push(box)
      if (box.h > box.w * 0.9) {
        const r = box.w * 0.24
        glints += `<ellipse cx="${t1(box.x + box.w * 0.62)}" cy="${t1(box.y + box.h * 0.3)}" rx="${t1(r)}" ry="${t1(r * 1.3)}"/><circle cx="${t1(box.x + box.w * 0.3)}" cy="${t1(box.y + box.h * 0.72)}" r="${t1(r * 0.45)}"/>`
      }
    } else if (e.line) {
      const l = e.line
      if (l.length === 2 && m.eyes.some(o => o.poly)) sad = true
      if (l.length === 5 && (l[2]?.[1] ?? 0) < (l[0]?.[1] ?? 0)) happy.push([((l[0]?.[0] ?? 0) + (l[4]?.[0] ?? 0)) / 2 + cx, (l[2]?.[1] ?? 0) + floor])
      eyes += `<path fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="${poly(l, cx, floor, false)}"/>`
    }
  }
  if (happy.length !== 2) happy = []
  // Happy: rosy Ben-Day cheeks under the eyes.
  const cheeks = happy.map(([x, y]) => `<ellipse cx="${t1(x)}" cy="${t1(y + 5)}" rx="3.2" ry="1.7"/>`).join('')
  // Sad: one big blue tear welling under the right eye.
  let tear = ''
  const eye = pills[1]
  if (sad && eye) {
    const x = eye.x + eye.w * 0.9
    const y = eye.y + eye.h + 0.6
    const s = Math.max(1.6, eye.w * 0.75)
    tear =
      `<path fill="url(#pa-tear)" stroke="${INK}" stroke-width=".6" stroke-linejoin="round" d="M${t1(x)} ${t1(y)}C${t1(x + s * 0.2)} ${t1(y + s * 0.9)} ${t1(x + s)} ${t1(y + s * 1.3)} ${t1(x + s * 0.55)} ${t1(y + s * 2)}A${t1(s * 0.62)} ${t1(s * 0.62)} 0 0 1 ${t1(x - s * 0.55)} ${t1(y + s * 2)}C${t1(x - s)} ${t1(y + s * 1.3)} ${t1(x - s * 0.2)} ${t1(y + s * 0.9)} ${t1(x)} ${t1(y)}z"/>` +
      `<ellipse cx="${t1(x - s * 0.22)}" cy="${t1(y + s * 1.45)}" rx="${t1(s * 0.14)}" ry="${t1(s * 0.24)}" fill="${WHITE}"/>`
  }
  return (
    `<path fill="url(#pa-kd)" d="${poly(m.shadow, cx, floor)}"/>` +
    // The heavy keyline: every part's hull stroked wide in black under the planes.
    `<path fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round" d="${hulls}"/>` +
    `<g stroke="${INK}" stroke-width=".8" stroke-linejoin="round">${faces}</g>` +
    (gleam ? `<path fill="${WHITE}" d="${gleam}"/>` : '') +
    (cheeks ? `<g fill="url(#pa-pk)">${cheeks}</g>` : '') +
    (pupils ? `<path fill="${INK}" d="${pupils}"/>` : '') +
    eyes +
    (glints ? `<g fill="${WHITE}">${glints}</g>` : '') +
    tear
  )
}

// ---------------------------------------------------------------- the panel

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A Ben-Day screen: dots of one ink on a 45-degree grid, over a flat ink or nothing. */
const screen = (id: string, base: string | undefined, dot: string, r: number, pitch: number) =>
  `<pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
  (base ? `<rect width="${pitch}" height="${pitch}" fill="${base}"/>` : '') +
  `<circle cx="${n(pitch / 2)}" cy="${n(pitch / 2)}" r="${r}" fill="${dot}"/></pattern>`

/** The definitions the whole panel draws with, laid down once under the stage. */
function defs(): string {
  let out = ''
  for (const [k, s] of Object.entries(SW) as [Key, Swatch][]) if (s.dot) out += screen(`pa-${k}`, s.base, s.dot, s.r ?? 0.8, s.pitch ?? 2.6)
  for (const [k, s] of Object.entries(CLAUDE)) out += screen(`pa-c${k}`, s.base, s.dot, s.r, CLAUDE_PITCH)
  return (
    out +
    // Dots over nothing: white for mist, yellow for light, black for a shadow, blue for a tear.
    screen('pa-wd', undefined, WHITE, 1, 3) +
    screen('pa-yd', undefined, YELLOW, 1, 2.6) +
    screen('pa-kd', undefined, INK, 0.75, 1.9) +
    screen('pa-tear', '#8fcaff', '#3d8be8', 0.5, 1.6) +
    // The comic mirror: blue dots crossed by diagonal white gleams; the gleams alone, to cross what is seen through it.
    `<pattern id="pa-gleam" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path fill="${WHITE}" d="M0 4h30v6H0zM0 14h30v1.8H0z"/></pattern>` +
    `<pattern id="pa-glass" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="30" height="30" fill="url(#pa-lb)"/><path fill="${WHITE}" d="M0 4h30v6H0zM0 14h30v1.8H0z"/></pattern>` +
    CLOUD +
    `<path id="pa-star" fill="${YELLOW}" stroke="${INK}" stroke-width=".35" stroke-linejoin="round" d="${starPath(1.9)}"/>`
  )
}

/** A thought cloud round a box: scallops bulging out along every side. */
function scallops(x: number, y: number, w: number, h: number): string {
  const sides: [number, number, number, number][] = [
    [x, y, x + w, y],
    [x + w, y, x + w, y + h],
    [x + w, y + h, x, y + h],
    [x, y + h, x, y],
  ]
  let d = `M${n(x)} ${n(y)}`
  for (const [x0, y0, x1, y1] of sides) {
    const len = Math.hypot(x1 - x0, y1 - y0)
    const k = Math.max(1, Math.round(len / 11))
    const dx = (x1 - x0) / k
    const dy = (y1 - y0) / k
    const r = n((len / k) * 0.6)
    for (let i = 0; i < k; i++) d += `a${r} ${r} 0 0 1 ${n(dx)} ${n(dy)}`
  }
  return d + 'z'
}

export const POPART: Look = {
  name: 'popart',
  label: 'Pop Art',
  voice: 'a 1960s Lichtenstein pop-art panel, all comic melodrama in Ben-Day dots',
  cell: 'solid',
  figure: '3d',
  font: LETTERS,
  charW: 5.6,
  caption: { fill: '#ffffff', stroke: INK, ink: INK, radius: 10 },
  paper: { card: '#ffffff', ink: INK, kinds: { code: '#1a43a3', path: '#1a43a3', fn: '#8a1f8a', num: '#c8201a', bad: '#c8201a', good: '#17602c', face: '#c8201a' } },
  inset: 5,
  titleColor: INK,
  art: {
    painter: scenery,
    hero,
    sky: BLUE,
    ground: INK,
    defs,
  },
  // The panel: a heavy black border in a white gutter.
  frame: (sw, h) =>
    `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" fill="none" stroke="${WHITE}" stroke-width="2"/>` +
    `<rect x="3.6" y="3.6" width="${sw - 7.2}" height="${h - 7.2}" fill="none" stroke="${INK}" stroke-width="3.2"/>`,
  // The chapter in a yellow narration box, lettered in capitals and trailing off.
  tag: (text, inset) => {
    const t = `${escape(text.toUpperCase())}...`
    const x = inset + 3
    const y = inset + 3
    const w = t.length * 5.7 + 10
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="14" fill="${YELLOW}" stroke="${INK}" stroke-width="1.3"/>` +
        `<text x="${x + 5}" y="${y + 10}" font-family="${LETTERS}" font-size="8" letter-spacing=".4" fill="${INK}">${t}</text>`,
      w: x + w + 4,
      h: y + 18,
    }
  },
  bubble: {
    font: LETTERS,
    size: 8.4,
    charW: 5.8,
    line: 11,
    base: 12,
    upper: true,
    draw: ({ x, y, w, h }, { base, tip }) => {
      // A white thought cloud, scalloped, keyed in black; three puffs trail from it down to Claude.
      const mx = (base[0][0] + base[1][0]) / 2
      const my = (base[0][1] + base[1][1]) / 2
      const puffs = ([[0.55, 2.6], [1.05, 1.8], [1.5, 1.2]] as const)
        .map(([u, r]) => `<circle cx="${n(mx + (tip[0] - mx) * u)}" cy="${n(my + (tip[1] - my) * u)}" r="${r}"/>`)
        .join('')
      return `<g fill="${WHITE}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"><path d="${scallops(x + 2, y + 2, w - 4, h - 4)}"/>${puffs}</g>`
    },
  },
}

/**
 * Op Art, after the gallery's "Op Art: 1960s" (index.html, style 16,
 * `opart`), and the look's own sources: Vasarely's lenses and Vega spheres,
 * Bridget Riley's currents, chevrons and Movement in Squares.
 *
 * The art bible, translated from the gallery's plate to the Fables' worlds:
 *
 * - Black and white and nothing between. There is no grey, no gradient and
 *   no glow: every tone is a field of hard-edged bands, and a thing exists
 *   only as a change in the bands' direction, period and weight. Darker
 *   things carry heavier black bands, lighter things thinner ones.
 * - Each kind of thing has its own field, as a Riley canvas has its motif:
 *   the sky is upright bands that swell into a Vasarely lens in the middle
 *   of the picture and breathe, as the gallery's field swells round Clawd;
 *   hills and land run on the rising diagonal, rock and mesas on the falling
 *   one; firs, shrubs and cacti are stacked chevrons; grass and meadows are
 *   Riley's wavering currents; bark is upright; buildings are a
 *   checkerboard whose squares grow and shrink with the tone; glass and
 *   screens are level scan bands; water is a current that runs. The ground
 *   is a floor of level bands that thicken toward the viewer: perspective
 *   told in stripes alone.
 * - Light is the white of the paper: lamps, lit windows, sparks and stars
 *   are reserved white shapes, and no wash of light is drawn. Fire is a
 *   stack of chevrons climbing without end. The sun is a target of
 *   concentric rings that pulses; the moon and the Earth are Vega spheres,
 *   their rings pushed off-centre so a disc swells into a ball. Stars are the
 *   gallery's concentric stars: a white disc, a black star, a white star, a
 *   black star. A lamp's pool on the floor is a ring target laid flat.
 * - Clouds are white forms ruled with fine level lines, smoke ruled heavier;
 *   mist lies in banks of the wavering current; a shaft of light is only its
 *   dashed edge. Particles are black chips by day, white by night.
 * - Every nearer shape keeps a fine keyline, so the fields part where they meet.
 * - Night is the negative: space, the eruption, the village under the moon
 *   and the lab after hours are drawn white on black, the lens in thin white
 *   bands, the keylines white, the fields carried heavy, the lights the only
 *   open white.
 * - Claude is the gallery's: each face filled with its own band field laid
 *   on the face (the walls banded level, wrapping round the corners; the top
 *   banded front to back), the bands heavier as the face turns from the
 *   light, so the box reads in three dimensions from stripes alone. A white
 *   halo and a black keyline cut him out of the field. His eyes are
 *   concentric rings, a black pill in a white ring in a black ring in a white
 *   halo; his shadow is the bands crowding together.
 * - The frame is a black and white checker border, the chapter a black
 *   plate with Vasarely's nested squares, the caption a white card set in a
 *   striped mat, lettered in a 1960s grotesk.
 */
import type { HeroPainter } from '../hero3d'
import { type Face, type Model, outlinedFaces } from '../clawd3d'
import { lum, meanOf, num as n, poly, t1 } from '../art/ink'
import { MIST_TILE, mistBanks, tiled } from '../art/mist'
import { painter, type Ctx } from '../art/painter'
import type { Family, Meta, Role } from '../art/roles'
import type { Look } from '../looks'

const INK = '#000'
const PAPER = '#fff'
const GROTESK = "'Helvetica Neue', Helvetica, Arial, sans-serif"
/** The ground's top on the stage (svg.ts), and the stage's height. */
const GROUND_Y = 104
const H = 128

// ---------------------------------------------------------------- the fields

/**
 * Every field and ring the picture is drawn with, by id, made only when a
 * scene uses it: a scene uses a handful of the dozens there are.
 */
const MAKERS = new Map<string, () => string>()
const used = new Set<string>()
/** A field by id, as a paint, noted so its definition is laid down. */
const paint = (id: string) => {
  used.add(id)
  return `url(#${id})`
}

/** The black share of a band field, by tone, dark to light. */
const DUTY = [0.8, 0.6, 0.4, 0.2]

/** A band field: level bands `p` apart, `duty` of them `ink` on `ground`, turned to `angle`. */
const bands = (id: string, p: number, duty: number, angle: number, ink = INK, ground = PAPER) =>
  `<pattern id="${id}" width="8" height="${p}" patternUnits="userSpaceOnUse"${angle ? ` patternTransform="rotate(${angle})"` : ''}>` +
  `<rect width="8" height="${p}" fill="${ground}"/><rect width="8" height="${n(p * duty)}" fill="${ink}"/></pattern>`

/** Chevrons: a zigzag band `p` apart; `rise` sets them climbing, as flames. */
function chevrons(id: string, p: number, duty: number, rise: boolean): string {
  const a = p * 0.55
  const t = p * duty
  const zig = (y: number) => `M0 ${n(y)}L3 ${n(y - a)}L6 ${n(y)}v${n(t)}L3 ${n(y - a + t)}L0 ${n(y + t)}z`
  return (
    `<pattern id="${id}" width="6" height="${p}" patternUnits="userSpaceOnUse">` +
    `<rect width="6" height="${p}" fill="${PAPER}"/><path d="${zig(a)}${zig(a + p)}"/>` +
    (rise ? `<animateTransform attributeName="patternTransform" type="translate" values="0 0;0 ${-p}" dur=".8s" repeatCount="indefinite"/>` : '') +
    `</pattern>`
  )
}

/** Riley's current: wavering level bands; `run` sets them flowing sideways. */
function current(id: string, p: number, duty: number, run: boolean): string {
  const wave = (y: number) => `M0 ${n(y)}q2 -1.2 4 0t4 0`
  return (
    `<pattern id="${id}" width="8" height="${p}" patternUnits="userSpaceOnUse">` +
    `<rect width="8" height="${p}" fill="${PAPER}"/><path d="${wave(0)}${wave(p)}" fill="none" stroke="${INK}" stroke-width="${n(p * duty)}"/>` +
    (run ? `<animateTransform attributeName="patternTransform" type="translate" values="0 0;8 0" dur="2.4s" repeatCount="indefinite"/>` : '') +
    `</pattern>`
  )
}

/** Movement in Squares: a checkerboard whose black squares grow with the darkness, until the white ones shrink. */
function checker(id: string, duty: number): string {
  const s = 3.2
  const w = 2 * s
  const dark = duty > 0.5
  const q = s * Math.sqrt(2 * (dark ? 1 - duty : duty))
  const o = (s - q) / 2
  const sq = (x: number, y: number) => `M${n(x)} ${n(y)}h${n(q)}v${n(q)}h${n(-q)}z`
  return (
    `<pattern id="${id}" width="${w}" height="${w}" patternUnits="userSpaceOnUse"><rect width="${w}" height="${w}" fill="${dark ? INK : PAPER}"/>` +
    `<path fill="${dark ? PAPER : INK}" d="${dark ? sq(s + o, o) + sq(o, s + o) : sq(o, o) + sq(s + o, s + o)}"/></pattern>`
  )
}

/** The field each family is drawn in. */
type Kind = 'v' | 'h' | 'd' | 'e' | 'z' | 'c' | 'w' | 'r' | 'f'
const KINDS: Record<Kind, (id: string, duty: number) => string> = {
  v: (id, d) => bands(id, 3, d, 90),
  h: (id, d) => bands(id, 2.6, d, 0),
  d: (id, d) => bands(id, 3, d, -45),
  e: (id, d) => bands(id, 3, d, 45),
  z: (id, d) => chevrons(id, 3.2, d, false),
  f: (id, d) => chevrons(id, 3.6, d, true),
  w: (id, d) => current(id, 3, d, false),
  r: (id, d) => current(id, 3, d, true),
  c: (id, d) => checker(id, d),
}
for (const [kind, make] of Object.entries(KINDS)) DUTY.forEach((d, k) => MAKERS.set(`op-${kind}${k}`, () => make(`op-${kind}${k}`, d)))

const KIND: Record<Family, Kind> = {
  sky: 'v', body: 'h', stars: 'h', cloud: 'h', air: 'w', beam: 'h', glow: 'h',
  land: 'd', foliage: 'z', bark: 'v', grass: 'w', ground: 'h', rock: 'e',
  built: 'c', glass: 'h', water: 'r', fire: 'f', lamp: 'h', shadow: 'v', mark: 'h', life: 'h', lens: 'h',
}

/** The floor: level bands from the horizon, thickening toward the viewer, black and white by turns. */
function floor(id: string, heavy: number): string {
  const rows = 13
  const at = (v: number) => n(v ** 1.8)
  let stops = ''
  for (let j = 0; j < rows; j++) {
    const b = at((j + heavy) / rows)
    stops += `<stop offset="${at(j / rows)}"/><stop offset="${b}"/><stop offset="${b}" stop-color="#fff"/><stop offset="${at((j + 1) / rows)}" stop-color="#fff"/>`
  }
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${GROUND_Y - 8}" x2="0" y2="${H + 4}">${stops}</linearGradient>`
}
MAKERS.set('op-floor', () => floor('op-floor', 0.5))
MAKERS.set('op-floorn', () => floor('op-floorn', 0.74))

/** Rings, black and white by turns, from the centre out. */
function rings(id: string, extra: string, count: number, whiteFirst: boolean): string {
  let stops = ''
  for (let i = 0; i < count; i++) {
    const c = (i % 2 === 0) === whiteFirst ? PAPER : INK
    stops += `<stop offset="${n(i / count)}" stop-color="${c}"/><stop offset="${n((i + 1) / count)}" stop-color="${c}"/>`
  }
  return `<radialGradient id="${id}"${extra}>${stops}</radialGradient>`
}
MAKERS.set('op-ring', () => rings('op-ring', '', 9, false))
MAKERS.set('op-orb', () => rings('op-orb', ' fx=".34" fy=".32"', 7, true))

/** The gallery's op star: a white disc, a black star, a white star, a black star. */
function starPath(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const q = i % 2 ? r * 0.46 : r
    pts.push(`${n(Math.cos(a) * q)} ${n(Math.sin(a) * q)}`)
  }
  return `M${pts.join('L')}z`
}
MAKERS.set('op-star', () => `<g id="op-star"><circle r="2.3" fill="${PAPER}"/><path d="${starPath(2)}"/><path d="${starPath(1.24)}" fill="${PAPER}"/><path d="${starPath(0.6)}"/></g>`)

// ---------------------------------------------------------------- the inks

/** Whether the scene being painted is the negative: the dark worlds are. */
let night = false

/** How light a lit color reads, a little lifted at night so the dark scenes keep their tones apart. */
const tone = (color: string) => (night ? Math.min(1, lum(color) * 1.25 + 0.03) : lum(color))
const level = (t: number) => (t < 0.24 ? 0 : t < 0.44 ? 1 : t < 0.64 ? 2 : 3)

/** The line of the picture: black by day, white in the negative. */
const keyColor = () => (night ? PAPER : INK)

/** A lit color as a band field of its family's kind, its weight from the color's tone. */
function field(color: string, family: Family): string {
  let k = level(tone(color))
  // Fire is light: its chevrons stay white-heavy whatever the lit color.
  if (family === 'fire') k = Math.max(2, k)
  // The negative carries its walls and its trees heavy, so the lights are the only open white.
  if (night && (family === 'built' || family === 'foliage')) k = Math.min(1, k)
  return paint(`op-${KIND[family]}${k}`)
}

function ink(color: string, family: Family, attr: string): string {
  const t = tone(color)
  if (attr === 'stop-color' || attr === 'color') return t > 0.5 ? PAPER : INK
  if (attr === 'stroke') return family === 'lamp' || family === 'fire' || family === 'stars' || family === 'life' ? (t > 0.5 ? PAPER : INK) : keyColor()
  switch (family) {
    case 'lamp':
    case 'stars':
      return PAPER
    case 'life':
      return night ? PAPER : INK
    case 'mark':
      return t < 0.45 ? INK : PAPER
    case 'shadow':
      return paint('op-v0')
    default:
      return field(color, family)
  }
}

const UNLINED: readonly Family[] = ['sky', 'stars', 'life', 'lens', 'air', 'beam', 'glow', 'fire', 'lamp', 'mark', 'shadow']

// ---------------------------------------------------------------- the sky

const PERIOD = 6
MAKERS.set('op-sky', () => bands('op-sky', PERIOD, 0.5, 90))
MAKERS.set('op-skyn', () => bands('op-skyn', PERIOD, 0.3, 90, PAPER, INK))

/**
 * The sky: upright bands that swell into a Vasarely lens in the middle of the
 * stage, as the gallery's field swells round Clawd, and breathe. Outside the
 * lens the bands run straight, from a pattern; inside, each band is drawn bent.
 */
function lensSky(sw: number): string {
  const duty = night ? 0.3 : 0.5
  const cx = Math.round(sw / 2 / PERIOD) * PERIOD
  const half = Math.min(25, Math.floor(sw / 2 / PERIOD) - 1) * PERIOD
  const cy = 50
  const ry = 44
  const th0 = 1.3
  const ys = [-6, 10, 22, 32, 41, 50, 59, 68, 78, 90, 106]
  const theta = (y: number) => th0 * Math.exp(-(((y - cy) / ry) ** 2))
  const X = (u: number, y: number) => {
    const a = theta(y)
    return a > 1e-3 ? cx + (Math.sin(((u - cx) / half) * a) * half) / Math.sin(a) : u
  }
  let d = ''
  for (let u = cx - half; u < cx + half - 0.01; u += PERIOD) {
    const u1 = u + PERIOD * duty
    d += poly([...ys.map((y): [number, number] => [X(u, y), y]), ...[...ys].reverse().map((y): [number, number] => [X(u1, y), y])])
  }
  return (
    `<g transform="translate(${cx} 0)"><g>` +
    `<animateTransform attributeName="transform" type="scale" values="1 1;1.035 1;1 1" dur="7s" repeatCount="indefinite"/>` +
    `<g transform="translate(${-cx} 0)">` +
    `<rect x="-40" y="-6" width="${sw + 80}" height="${H + 6}" fill="${paint(night ? 'op-skyn' : 'op-sky')}"/>` +
    `<rect x="${cx - half}" y="-6" width="${half * 2}" height="${H + 6}" fill="${night ? INK : PAPER}"/>` +
    `<path fill="${night ? PAPER : INK}" d="${d}"/></g></g></g>`
  )
}

// ---------------------------------------------------------------- the lights

/** A target of rings that pulses: the sun. */
const target = (cx: number, cy: number, r: number) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${paint('op-ring')}" stroke="${INK}" stroke-width=".6">` +
  `<animate attributeName="r" values="${n(r)};${n(r * 1.12)};${n(r)}" dur="3.2s" repeatCount="indefinite"/></circle>`

/** A Vega sphere: rings pushed off-centre, so a disc swells into a ball. The moon, the Earth. */
const sphere = (cx: number, cy: number, r: number) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${paint('op-orb')}" stroke="${PAPER}" stroke-width=".8"/>`

/** Stars: every bright one an op star placed by <use>; the dim ones plain white points. */
function stars(svg: string, c: Ctx): string {
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#op-star" x="${n(Number(x) + 0.5)}" y="${n(Number(y) + 0.5)}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (all, tag: string, attrs: string, close: string) => {
      const op = Number(/\sopacity="([\d.]+)"/.exec(attrs)?.[1] ?? 1)
      // The dim field stays white points: a starfield holds hundreds.
      if (op < 0.4 || (tag === 'path' && !/\sd="M/.test(attrs))) return all.replace(/\sopacity="[^"]*"/, '').replace(/\sfill="[^"]*"/, ` fill="${PAPER}"`)
      used.add('op-star')
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap|opacity)="[^"]*"/g, '')
      return `<g${kept}>${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** Replaces every painted fill in an element with one field, its washes made solid. */
const refill = (svg: string, fill: string) =>
  svg.replace(/\sfill="(?!none)[^"]*"/g, ` fill="${fill}"`).replace(/\s(opacity|fill-opacity)="[^"]*"/g, '')

const scenery = () => {
  night = false
  used.clear()
  const p = painter(
    {
      ink: (color, family, _depth, attr) => ink(color, family, attr),
      // A gradient of the lit scene is one field at its overall tone; a wash of light is not drawn.
      url: (_id, family, attr, g) => {
        if (attr === 'stroke') return keyColor()
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (g?.tag === 'radialGradient') return family === 'lamp' || family === 'fire' ? ink(mean.color, family, 'fill') : 'none'
        if (mean.opacity < 0.5) return 'none'
        return ink(mean.color, family, 'fill')
      },
      line: (family, depth) =>
        UNLINED.includes(family) || depth < 0.1 ? '' : `stroke="${keyColor()}" stroke-width="${n(0.3 + depth * 0.35)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: 'hide',
      // No half measures: a wash is either there or not.
      opacity: (_f, v) => (v >= 0.35 ? 1 : 0),
      // A shape the lit painting filled only with light is gone, keyline and all.
      post: svg => svg.replace(/<(path|rect|circle|ellipse)\b(?=[^>]*\sfill="none")(?![^>]*\sstroke=)[^>]*\/>/g, ''),
      // A lamp's pool is a ring target laid flat on the floor.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.8)}" ry="${n(e.ry * 0.8)}" fill="${paint('op-ring')}"/>`,
      redraw: {
        sky: (_svg, c) => lensSky(c.meta.sw ?? 640),
        stars,
        // The Milky Way's band is light, and is not drawn; its dust stays as points.
        'space.milkyway': (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, '')).replace(/\sopacity="[^"]*"/g, ''),
        lens: () => '',
        glow: () => '',
        body: (_svg, c) => {
          if (c.meta.part === 'halo') return ''
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return sphere(cx, cy, r)
          if (c.role === 'night.moon') return sphere(cx, cy, r * 1.4)
          return target(cx, cy, r * (c.role === 'desert.sun' ? 2 : 2.4))
        },
        // The floor of bands, thickening toward the viewer.
        ground: (svg, c) => refill(c.repaint(svg), paint(night ? 'op-floorn' : 'op-floor')),
        // Clouds are white forms ruled level (smoke and night clouds ruled heavier), keyed.
        cloud: (svg, c) => {
          const lit = /\sfill="(#[0-9a-fA-F]{3,6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
          const k = night ? Math.min(2, level(tone(lit))) : Math.max(2, level(tone(lit)))
          return `<g stroke="${keyColor()}" stroke-width=".5">${refill(c.repaint(svg), paint(`op-h${k}`))}</g>`
        },
        // Mist lies in banks of the wavering current, keyed.
        air: (svg, c) => {
          const banks = mistBanks({ w: Math.min(MIST_TILE, c.meta.sw ?? 640), y: c.meta.y ?? 80, h: c.meta.h ?? 12, seed: 16, rows: (c.meta.h ?? 12) < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true })
          const art = `<path fill="${paint(`op-w${night ? 1 : 3}`)}" stroke="${keyColor()}" stroke-width=".5" d="${banks.map(b => b.d).join('')}"/>`
          return `<g>${tiled(`op-mist-${Math.round(c.meta.y ?? 80)}-${Math.round(c.meta.h ?? 12)}`, art, c.meta.sw ?? 640)}${c.motion(svg)}</g>`
        },
        // Water is a running current: no mirror, only the current, in the puddles the street holds (its mask made hard-edged in defs).
        water: (svg, c) => {
          const y = c.meta.y ?? GROUND_Y
          const mask = /\smask="url\(#sc-wetmask\)"/.test(svg)
          const h = mask ? H - y : 5
          return `<rect${mask ? ' mask="url(#sc-wetmask)"' : ''} y="${n(y)}" width="${c.meta.sw ?? 640}" height="${n(h)}" fill="${paint(`op-r${night ? 1 : 2}`)}"/>`
        },
        // The great oak is one mass of chevrons, keyed once round its silhouette, not round every clump.
        'night.oak': svg => {
          const body = refill(svg.replace(/<g[^>]*mix-blend-mode[^>]*>[\s\S]*?<\/g>/, '').replace(/\sfilter="[^"]*"/g, '').replace(/\sstroke="[^"]*"/g, ''), paint('op-z0'))
          return `<g stroke="${keyColor()}" stroke-width="1.4" stroke-linejoin="round"><g id="op-oak">${body}</g></g><use href="#op-oak" stroke="none"/>`
        },
        // A shaft of light is only its dashed edge.
        beam: (svg, c) =>
          `<g fill="none" stroke="${keyColor()}" stroke-width=".35" stroke-dasharray="2 2">${c.repaint(svg).replace(/\s(fill|stroke)="[^"]*"/g, '').replace(/\s(opacity|fill-opacity)="[^"]*"/g, '')}</g>`,
      },
    },
    'op',
  )
  // The dark worlds are the negative: space, the eruption, the village at night and the lab after hours.
  return {
    ...p,
    // Masks are hard-edged: a grey wash in one is nothing, white is all.
    defs: (svg: string) =>
      p.defs(svg).replace(/<mask\b[\s\S]*?<\/mask>/g, m => m.replace(/\sfill="#(?![fF]{3}\b|[fF]{6}\b)[0-9a-fA-F]{3,6}"/g, ' fill="#000"')),
    el: (role: Role, svg: string, meta?: Meta) => {
      if (role.includes('.')) night = /^(space|volcano|night|lab)\./.test(role)
      return p.el(role, svg, meta)
    },
  }
}

// ---------------------------------------------------------------- Claude

/** How many bands each face of each part carries: walls banded level, tops and undersides front to back. */
const BANDS = { body: { wall: 10, flat: 14 }, arm: { wall: 3, flat: 4 }, leg: { wall: 4, flat: 4 } } as const
/** The black share of a face's bands, by how far it is turned from the light. */
const FACE_DUTY = [0.25, 0.42, 0.6, 0.78]

/**
 * The band gradients the faces are filled with, on the unit square each face
 * is drawn in: one set shared by every face of every pose, so a face costs
 * one small element however it is shaded.
 */
function faceFields(): string {
  let out = ''
  const counts = { y: [BANDS.body.wall, BANDS.arm.wall, BANDS.leg.wall], x: [BANDS.body.flat, BANDS.arm.flat] }
  for (const [axis, list] of Object.entries(counts))
    for (const c of new Set(list))
      FACE_DUTY.forEach((d, k) => {
        const end = axis === 'y' ? `x2="0" y2="${n(1 / c)}"` : `x2="${n(1 / c)}" y2="0"`
        out += `<linearGradient id="op-${axis}${c}-${k}" gradientUnits="userSpaceOnUse" ${end} spreadMethod="repeat"><stop offset="${d}"/><stop offset="${d}" stop-color="${PAPER}"/></linearGradient>`
      })
  // The unit square: its keyline keeps its width whatever face it is mapped onto.
  return out + `<path id="op-q" d="M0 0H1V1H0z" vector-effect="non-scaling-stroke"/>`
}

/** One face: the unit square mapped onto it, filled with its part's bands, its darkness from the light. */
function faceSvg(f: Face, cx: number, cy: number): string {
  const [p0, p1, , p3] = f.pts as [[number, number], [number, number], [number, number], [number, number]]
  const ax = p1[0] - p0[0]
  const ay = p1[1] - p0[1]
  const bx = p3[0] - p0[0]
  const by = p3[1] - p0[1]
  if (Math.abs(ax * by - ay * bx) < 0.6) return ''
  const flat = f.name === 'top' || f.name === 'bottom'
  const count = BANDS[f.part][flat ? 'flat' : 'wall']
  const duty = Math.min(0.82, Math.max(0.2, 0.9 - 0.84 * f.light))
  let k = 0
  FACE_DUTY.forEach((d, i) => {
    if (Math.abs(d - duty) < Math.abs((FACE_DUTY[k] ?? 0) - duty)) k = i
  })
  return `<use href="#op-q" transform="matrix(${t1(ax)} ${t1(ay)} ${t1(bx)} ${t1(by)} ${t1(p0[0] + cx)} ${t1(p0[1] + cy)})" fill="url(#op-${flat ? 'x' : 'y'}${count}-${k})"/>`
}

const hero = (): HeroPainter => {
  // Each pose's outline and eyes are drawn once and repeated by reference, so each needs an id of its own.
  let ids = 0
  return (m: Model, cx: number, floor: number) => {
    const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
    const faces = outlinedFaces(m)
      .map(f => faceSvg(f, cx, floor))
      .join('')
    // The shadow: the bands crowding together under him.
    const xs = m.shadow.map(q => q[0])
    const ys = m.shadow.map(q => q[1])
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const shadow = `<ellipse cx="${t1((x0 + x1) / 2 + cx)}" cy="${t1((y0 + y1) / 2 + floor)}" rx="${t1((x1 - x0) / 2)}" ry="${t1((y1 - y0) / 2)}" fill="url(#op-v0)"/>`
    // The eyes: concentric rings round each pill, haloed strokes for every other shape, as the gallery draws them.
    const pills = m.eyes.filter(e => e.poly).map(e => poly((e.poly ?? []).filter((_q, i) => i % 2 === 0), cx, floor)).join('')
    const lines = m.eyes.filter(e => e.line).map(e => poly(e.line ?? [], cx, floor, false)).join('')
    const eyeYs = m.eyes.flatMap(e => (e.poly ?? []).map(q => q[1]))
    const r = Math.max(0.3, (eyeYs.length ? Math.max(...eyeYs) - Math.min(...eyeYs) : 6) * 0.11)
    let eyes = ''
    if (pills) {
      const id = `op-p${++ids}`
      eyes +=
        `<g fill="${INK}" paint-order="stroke"><g stroke="${PAPER}" stroke-width="${t1(r * 6.4)}"><path id="${id}" d="${pills}"/></g>` +
        `<use href="#${id}" stroke="${INK}" stroke-width="${t1(r * 4.2)}"/><use href="#${id}" stroke="${PAPER}" stroke-width="${t1(r * 2.1)}"/></g>`
    }
    if (lines) {
      const id = `op-l${++ids}`
      eyes +=
        `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${PAPER}" stroke-width="2.6"><path id="${id}" d="${lines}"/></g>` +
        `<use href="#${id}" stroke="${INK}" stroke-width="1.7"/><use href="#${id}" stroke="${PAPER}" stroke-width=".9"/><use href="#${id}" stroke="${INK}" stroke-width=".4"/></g>`
    }
    const out = `op-o${++ids}`
    return (
      shadow +
      // A white halo cuts him out of the field, a black keyline inside it.
      `<g fill="${PAPER}" stroke="${PAPER}" stroke-width="4.4" stroke-linejoin="round"><path id="${out}" d="${hulls}"/></g>` +
      `<use href="#${out}" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>` +
      `<g stroke="${INK}" stroke-width=".45" stroke-linejoin="round">${faces}</g>` +
      eyes
    )
  }
}

// ---------------------------------------------------------------- the sheet

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The definitions the scene drew with, laid down once under the stage; the caption's mat and Claude's shadow always. */
function defs(): string {
  used.add('op-v0').add('op-v1')
  return [...used].map(id => MAKERS.get(id)?.() ?? '').join('') + faceFields()
}

export const OPART: Look = {
  name: 'opart',
  label: 'Op Art',
  voice: 'a deadpan 1960s op-art gallery card, crisp and optical',
  cell: 'solid',
  figure: '3d',
  font: GROTESK,
  charW: 5.2,
  caption: { fill: PAPER, stroke: INK, ink: INK, radius: 0 },
  paper: { card: PAPER, ink: INK, kinds: { code: '#000000', path: '#3d3d3d', fn: '#3d3d3d', num: '#000000', bad: '#000000', good: '#000000', face: '#000000' } },
  inset: 5,
  titleColor: PAPER,
  art: {
    painter: scenery,
    hero,
    sky: PAPER,
    ground: INK,
    defs,
  },
  // A checker border, black and white by turns, inside a black rule.
  frame: (sw, h) =>
    `<rect x="1.6" y="1.6" width="${sw - 3.2}" height="${h - 3.2}" fill="none" stroke="${PAPER}" stroke-width="3.2"/>` +
    `<rect x="1.6" y="1.6" width="${sw - 3.2}" height="${h - 3.2}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-dasharray="3.2 3.2"/>` +
    `<rect x="3.6" y="3.6" width="${sw - 7.2}" height="${h - 7.2}" fill="none" stroke="${INK}" stroke-width=".7"/>`,
  // The chapter on a black plate, after Vasarely's nested squares.
  tag: (text, inset) => {
    const t = escape(text.toUpperCase())
    const x = inset + 3
    const y = inset + 3
    const w = text.length * 6.1 + 24
    let squares = ''
    for (let i = 0; i < 4; i++) squares += `<rect x="${n(x + 2 + i * 1.5)}" y="${n(y + 2 + i * 1.5)}" width="${n(10 - i * 3)}" height="${n(10 - i * 3)}" fill="${i % 2 ? INK : PAPER}"/>`
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="14" fill="${INK}" stroke="${PAPER}" stroke-width=".8"/>` +
        squares +
        `<text x="${x + 17}" y="${y + 10}" font-family="${GROTESK}" font-size="7.5" font-weight="800" letter-spacing="1.3" fill="${PAPER}">${t}</text>`,
      w: x + w + 4,
      h: y + 17,
    }
  },
  bubble: {
    font: GROTESK,
    size: 9,
    charW: 5.2,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A white card in a striped mat, its pointer solid black.
      `<path fill="${INK}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x - 2.6)}" y="${n(y - 2.6)}" width="${n(w + 5.2)}" height="${n(h + 5.2)}" fill="url(#op-v1)" stroke="${INK}" stroke-width=".8"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${PAPER}" stroke="${INK}" stroke-width="1"/>`,
  },
}

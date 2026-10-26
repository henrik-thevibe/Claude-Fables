/**
 * Tomb Painting, after the gallery's "Tomb Painting: Thebes, c. 1300 BC"
 * (henrik-styles.js, style 30, `stomb`): an Egyptian wall painting in flat
 * earth pigments, a hieroglyph column, a cartouche and a sun disc.
 *
 * The art bible, translated from the gallery's wall to the Fables' worlds:
 *
 * - The medium is secco on a plastered wall: a warm limestone plaster,
 *   blotched and cracked, with flat pigments laid inside a dark carbon
 *   contour. Nothing is lit or shaded; every mass is one pigment, and what the
 *   lit scenes show as light becomes the next pigment up. The palette is the
 *   painters' own: red and yellow ochre, Egyptian blue, malachite green,
 *   orpiment gold, carbon black and linen white.
 * - Sky: by day there is none; the bare plaster wall is the sky, as behind
 *   every figure in a tomb. By night (the moon, space, the eruption, the city
 *   at blue hour) the sky is the ceiling of Nut: a field of Egyptian blue
 *   strewn with gold five-pointed stars.
 * - Sun, moon, earth: the sun is Ra's disc, orpiment ringed in red ochre;
 *   the moon is Khonsu's, a linen disc cradled in a gold crescent; the Earth
 *   a blue disc with malachite and ochre lands, ringed in carbon.
 * - Stars are gold five-pointed stars, the hieroglyph for star, and the
 *   twinkling ones still twinkle.
 * - Clouds are flat linen bands keyed in carbon (pale blue under Nut's
 *   ceiling); ash is a flat smoke-brown.
 * - Land and rock: hills are ochre; desert rock is the painters' desert, pink
 *   ochre speckled with red and blue dots, its shadow side red ochre; moon
 *   rock is a grey limestone wash.
 * - Foliage is malachite set with rows of painted leaves, as on a sycomore;
 *   grass and far trees flat green; bark a dark umber.
 * - Ground: a darker band of plaster, and Claude stands on a ground line of
 *   carbon, the register every Egyptian figure walks on. No cast shadows.
 * - Buildings are limestone and mud brick in ochres and linen, windows gold.
 * - Glass is Egyptian blue faience; wet streets and polished floors reflect
 *   nothing, a wall painting leaves them plain.
 * - Fire and lava are red ochre and orpiment, flat, unlined.
 * - Lamps are orpiment gold; their pool on the ground a flat gold wash.
 * - Air, mist and beams are not painted at all: the bare wall is the air.
 * - Life and particles are dots of pigment; the hawk is Horus in carbon.
 * - Claude is the gallery's: red ochre blocks (a light top, a deep side)
 *   inside one carbon contour, each face edged in carbon, a pleated linen
 *   kilt with a gold belt across his front, kohl lines swept from his eyes
 *   toward the temples, and Ra's disc carried over his head.
 * - The frame is a border of painted squares, red, blue, green and gold, with
 *   a khekher frieze along the top and a column of hieroglyphs at the right.
 *   The chapter is written in a cartouche; the caption on a linen panel ruled
 *   as a register, a band of painted squares along its top.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { hue, isGreen, isWarm, lum, meanOf, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const P = {
  wall: '#dcbf86',
  blot: '#a07843',
  ink: '#2b1b12',
  red: '#b5432a',
  blue: '#2f5f9e',
  green: '#3d7c58',
  gold: '#d8a630',
  linen: '#f1ead6',
  top: '#e39468',
  front: '#c25a3b',
  side: '#9b432c',
  leg: '#b9533a',
  legDark: '#8c3b27',
}
const BAND = [P.red, P.blue, P.green, P.gold]

/** The painters' pigments, dark to light, by what they paint. */
const INK = {
  earth: [P.ink, '#5a3a22', '#7e5432', '#a2703f', '#c0935a', '#d4b27a', '#e6d1a2'],
  brick: ['#3a2a1e', '#6a4a30', '#8e6a48', '#b08c64', '#cfb386', '#e6d6b0', P.linen],
  stone: ['#3a332c', '#5e564c', '#857c6e', '#aaa290', '#cbc4b0', '#e4ddca'],
  pink: ['#6a2a1a', '#8f3a24', P.red, '#cf7550', 'url(#tb-desert)', '#ecc6a0'],
  green: ['#1f3a28', '#2a4f3a', P.green, P.green, '#5a9a6a', '#8ab884'],
  bark: [P.ink, '#4a2a18', '#6a3a22', '#8a5232', '#a86c42'],
  blue: ['#16294a', '#1f3f72', P.blue, '#5a86bc', '#9ab8d8'],
  fire: ['#6a1e12', '#8a2a1a', P.red, '#d8702e', P.gold, '#f0d070'],
  gold: ['#a8781a', P.gold, '#e8c45a', '#f4e0a0'],
  cloud: ['#5a4a3e', '#7a6656', '#a89480', '#e6dcc4', P.linen],
  nightCloud: ['#1f3f72', '#3a68a6', '#5a86bc', '#8aaad0'],
}

/** Lightness spread out, so the dim night scenes still use the whole of a ramp. */
const lift = (l: number) => Math.min(1, Math.pow(l, 0.7) * 1.08)

/** Browns and tans: earth, sand, wood. */
function brown(color: string): boolean {
  const { h, s } = hue(color)
  return s > 0.15 && (h < 60 || h > 330)
}

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** A lit color as the pigment the tomb painter would lay for it. */
function pigment(color: string, family: Family, depth: number): string {
  const l = lift(lum(color))
  // Far things are painted a step paler, as the plaster shows through a thinner coat.
  const t = Math.min(1, l + (depth < 0.25 ? 0.14 : 0))
  const warm = isWarm(color)
  const green = isGreen(color)
  switch (family) {
    case 'sky':
      return night ? P.blue : P.wall
    case 'stars':
    case 'life':
    case 'lamp':
    case 'body':
    case 'glow':
    case 'beam':
      return step(INK.gold, l)
    case 'cloud':
    case 'air':
      return night && !warm ? step(INK.nightCloud, t) : step(INK.cloud, t)
    case 'fire':
      return step(INK.fire, l)
    case 'foliage':
      return depth >= 0.3 && t > 0.2 && t < 0.75 ? 'url(#tb-leaf)' : step(INK.green, t)
    case 'grass':
      return step(INK.green, t)
    case 'bark':
      return step(INK.bark, t)
    case 'land':
      return green ? step(INK.green, t) : step(INK.earth, Math.max(0.35, t))
    case 'rock':
      return warm || brown(color) ? step(INK.pink, t) : step(INK.stone, Math.max(0.3, t))
    case 'ground':
    case 'mark':
      return green ? step(INK.green, t) : warm || brown(color) ? step(INK.earth, Math.max(0.4, t)) : step(INK.stone, Math.max(0.3, t))
    case 'built':
      return step(INK.brick, Math.max(0.15, t))
    case 'glass':
    case 'water':
      return step(INK.blue, Math.max(0.3, t))
    case 'shadow':
      return P.ink
    default:
      return step(INK.earth, t)
  }
}

/** A pigment that can be a line: a pattern cannot, so its own base takes its place. */
const plain = (c: string) => (c === 'url(#tb-desert)' ? '#e0a27a' : c === 'url(#tb-leaf)' ? P.green : c)

/** Families painted without the carbon contour: light, air, fire, the night sky, sparks. */
const UNLINED: readonly Family[] = ['sky', 'glow', 'beam', 'stars', 'life', 'lens', 'water', 'air', 'fire', 'lamp']

/** The sky: the bare wall by day; by night the blue ceiling of Nut. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  night = lum(top) < 0.22 && lum(low) < 0.5
  return night ? `<rect width="${n(c.meta.sw ?? 640)}" height="128" fill="url(#tb-nut)"/>` : ''
}

/** Stars as gold five-pointed stars: every shape becomes a group of stars at its points, keeping its own attributes and animation. */
function stars(svg: string, c: Ctx): string {
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#tb-star" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg.replace(/<ellipse[^>]*\/>/g, ''))
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      // A faint star is still a star of gold, only smaller in number: the opacity is kept, raised.
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '').replace(/\sopacity="([\d.]+)"/, (_m, v: string) => ` opacity="${n(Math.min(1, Number(v) + 0.45))}"`)
      return `<g${kept} fill="${night ? P.gold : P.red}">${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** Ra's disc: orpiment ringed in red ochre. */
const ra = (cx: number, cy: number, r: number) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${P.gold}" stroke="${P.red}" stroke-width="${n(Math.max(1, r * 0.13))}"/>`

/** Khonsu's moon: a linen disc in a gold crescent, keyed in carbon. */
const moon = (cx: number, cy: number, r: number) =>
  `<path fill="${P.gold}" stroke="${P.ink}" stroke-width=".5" d="M${n(cx - r * 1.25)} ${n(cy - r * 0.2)}a${n(r * 1.25)} ${n(r * 1.25)} 0 0 0 ${n(r * 2.5)} 0a${n(r * 1.25)} ${n(r * 0.95)} 0 0 1 ${n(-r * 2.5)} 0z"/>` +
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${P.linen}" stroke="${P.ink}" stroke-width=".6"/>`

/** The Earth: an Egyptian blue disc with malachite and ochre lands, ringed in carbon. */
const earth = (cx: number, cy: number, r: number) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${P.blue}"/>` +
  `<path fill="${P.green}" d="M${n(cx - r * 0.6)} ${n(cy - r * 0.55)}q${n(r * 0.5)} ${n(-r * 0.25)} ${n(r * 0.7)} ${n(r * 0.1)}q${n(-r * 0.1)} ${n(r * 0.45)} ${n(-r * 0.45)} ${n(r * 0.55)}q${n(-r * 0.4)} ${n(-r * 0.2)} ${n(-r * 0.25)} ${n(-r * 0.65)}z"/>` +
  `<path fill="${P.gold}" d="M${n(cx + r * 0.15)} ${n(cy + r * 0.1)}q${n(r * 0.5)} ${n(-r * 0.1)} ${n(r * 0.6)} ${n(r * 0.3)}q${n(-r * 0.2)} ${n(r * 0.4)} ${n(-r * 0.5)} ${n(r * 0.35)}z"/>` +
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${P.ink}" stroke-width=".8"/>`

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => (attr === 'fill' ? pigment(color, family, depth) : plain(pigment(color, family, depth))),
      // A gradient is laid as one flat pigment in its overall tone; a faint wash of light is not painted.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return plain(pigment(mean.color, family, 0.5))
        if (mean.opacity < 0.5 || g?.tag === 'radialGradient') return 'none'
        return pigment(mean.color, family, 0.5)
      },
      // The carbon contour round every mass, finer in the distance; the farthest band is laid flat, unlined.
      line: (family, depth) => (UNLINED.includes(family) || depth < 0.2 ? '' : `stroke="${P.ink}" stroke-width="${n(0.3 + depth * 0.4)}" stroke-linejoin="round"`),
      opacity: (family, v) => (family === 'stars' || family === 'life' ? v : v < 0.6 ? v : 1),
      lineless: 0.6,
      faint: 'hide',
      // A pool of lamplight is a flat wash of orpiment on the floor.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.8)}" ry="${n(e.ry * 0.8)}" fill="${P.gold}" opacity=".45"/>`,
      templateFamily: 'foliage',
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        air: () => '',
        beam: () => '',
        // A wall painting has no reflections: the wet street and the polished floor stay plain.
        water: () => '',
        // Nothing casts a shadow on a tomb wall.
        shadow: () => '',
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return ''
          if (c.role === 'space.earth') return earth(cx, cy, r)
          if (c.role === 'night.moon') return moon(cx, cy, r * 1.1)
          return ra(cx, cy, r * (c.role === 'desert.sun' ? 1.2 : 1.6))
        },
      },
    },
    'tb',
  )
}

// ---------------------------------------------------------------- Claude

type Pt = readonly [number, number]
const lerp = (a: Pt, b: Pt, t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** Claude in flat earth pigments inside a carbon contour, after the gallery's `unionOutline` and `tone(f, P)`. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  // Faces in painter's order, runs of one pigment sharing a path; the body's front is split into its upper part and the kilt.
  let faces = ''
  let tone = ''
  let d = ''
  const add = (t: string, pts: readonly Pt[]) => {
    if (t !== tone && d) {
      faces += `<path fill="${tone}" d="${d}"/>`
      d = ''
    }
    tone = t
    d += poly(pts, cx, floor)
  }
  let legSide = ''
  let legFront = ''
  const flushLegs = () => {
    if (!legSide && !legFront) return
    if (d) faces += `<path fill="${tone}" d="${d}"/>`
    d = ''
    tone = ''
    if (legSide) faces += `<path fill="${P.legDark}" d="${legSide}"/>`
    if (legFront) faces += `<path fill="${P.leg}" d="${legFront}"/>`
    legSide = legFront = ''
  }
  for (const f of outlinedFaces(m)) {
    if (f.part === 'body' && f.name === 'front' && f.pts.length === 4) {
      // Corners: bottom left, bottom right, top right, top left. The kilt is the bottom fifth.
      const [bl, br, tr, tl] = f.pts as unknown as [Pt, Pt, Pt, Pt]
      const kr = lerp(br, tr, 0.22)
      const kl = lerp(bl, tl, 0.22)
      add(P.front, [kl, kr, tr, tl])
      add('url(#tb-pleat)', [bl, br, kr, kl])
      // The gold belt: a band across the kilt's top, keyed in carbon with the rest.
      add(P.gold, [lerp(bl, tl, 0.18), lerp(br, tr, 0.18), lerp(br, tr, 0.26), lerp(bl, tl, 0.26)])
      continue
    }
    if (f.part === 'leg') {
      // A run of legs is laid in two coats, every side face then every front face: two paths, not one per face.
      if (f.name === 'front') legFront += poly(f.pts, cx, floor)
      else legSide += poly(f.pts, cx, floor)
      continue
    }
    flushLegs()
    add(f.name === 'top' ? P.top : f.name === 'front' ? P.front : P.side, f.pts)
  }
  flushLegs()
  if (d) faces += `<path fill="${tone}" d="${d}"/>`
  // Eyes in carbon; open eyes take a kohl line swept out toward the temples. Every carbon fill is one path, every carbon line another.
  const polys = m.eyes.filter(e => e.poly).map(e => e.poly ?? [])
  const mid = polys.length ? polys.reduce((s, p) => s + p.reduce((a, q) => a + q[0], 0) / p.length, 0) / polys.length : 0
  let kohl = ''
  const eyes = m.eyes
    .map(e => {
      if (!e.poly) {
        kohl += poly(e.line ?? [], cx, floor, false)
        return ''
      }
      const xs = e.poly.map(q => q[0])
      const ys = e.poly.map(q => q[1])
      const ex = xs.reduce((a, b) => a + b, 0) / xs.length
      const ey = ys.reduce((a, b) => a + b, 0) / ys.length
      const s = Math.max(...xs) - Math.min(...xs)
      const side = ex < mid ? -1 : 1
      if (polys.length === 2) kohl += `M${t1(ex + side * s * 0.45 + cx)} ${t1(ey + s * 0.4 + floor)}q${t1(side * s * 0.8)} ${t1(s * 0.2)} ${t1(side * s * 1.2)} ${t1(-s * 0.35)}`
      return poly(e.poly, cx, floor)
    })
    .join('')
  // Ra's disc carried over his head, and the ground line under his feet.
  const body = m.parts.find(p => p.name === 'body')
  let disc = ''
  if (body) {
    const hx = body.hull.reduce((a, q) => a + q[0], 0) / body.hull.length
    const hy = Math.min(...body.hull.map(q => q[1]))
    disc = `<use href="#tb-ra" x="${t1(hx + cx)}" y="${t1(hy + floor - 8)}"/>`
  }
  const sx = m.shadow.map(q => q[0])
  const gy = m.shadow.reduce((a, q) => a + q[1], 0) / m.shadow.length
  return (
    disc +
    // The contour: every hull stroked wide in carbon under the pigments, one line round the whole figure.
    `<path fill="${P.front}" stroke="${P.ink}" stroke-width="2" d="${hulls}"/>` +
    `<g stroke="${P.ink}" stroke-width=".5">${faces}</g>` +
    // The ground line he stands on, laid over his soles, with the eyes.
    `<path fill="${P.ink}" d="M${t1(Math.min(...sx) + cx - 3)} ${t1(gy + floor - 0.4)}h${t1(Math.max(...sx) - Math.min(...sx) + 6)}v1.3h${t1(Math.min(...sx) - Math.max(...sx) - 6)}z${eyes}"/>` +
    (kohl ? `<path fill="none" stroke="${P.ink}" stroke-width="1" stroke-linecap="round" d="${kohl}"/>` : '')
  )
}

// ---------------------------------------------------------------- the wall around the scene

const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
const TITLE = "Papyrus, 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
/** Where the frieze along the top ends, so the chapter tag clears it. */
const FRIEZE = 12
/** The hieroglyph column's width at the right edge. */
const COL = 12

/** The hieroglyphs, each centred on 0 0 in a cell of 10: drawn once, placed with `use`. */
const GLYPHS: Record<string, string> = {
  // Short keys, as their ids are spelled in every scene: sun, ankh, water, feather, bread, eye, reed, snake.
  gs: `<circle r="3" fill="none" stroke="${P.red}" stroke-width=".9"/><circle r=".8" fill="${P.red}"/>`,
  ga: `<path fill="none" stroke="${P.blue}" stroke-width="1" stroke-linecap="round" d="M0 -.6a1.2 1.6 0 1 1 0 -3.2a1.2 1.6 0 1 1 0 3.2M-2.6 0h5.2M0 -.6v4.6"/>`,
  gw: `<path fill="none" stroke="${P.blue}" stroke-width=".8" d="M-3.6 -.4l1.2 -.6 1.2 1.2 1.2 -1.2 1.2 1.2 1.2 -1.2 1.2 1.2M-3.6 1.8l1.2 -.6 1.2 1.2 1.2 -1.2 1.2 1.2 1.2 -1.2 1.2 1.2"/>`,
  gf: `<path fill="${P.green}" d="M0 4.2q-2.4 -5.2 .5 -8.4q1.3 4.2 -.5 8.4z"/>`,
  gb: `<path fill="${P.blue}" d="M-2.6 1.4a2.6 2.6 0 0 1 5.2 0z"/>`,
  ge: `<path fill="none" stroke="${P.ink}" stroke-width=".7" d="M-3.4 0q3.4 -2.4 6.4 0q-3 1.8 -6.4 0M-.5 1l-.5 2.4"/><circle cy="-.2" r=".8" fill="${P.ink}"/>`,
  gr: `<path fill="none" stroke="${P.green}" stroke-width=".8" stroke-linecap="round" d="M0 4v-7.8M0 -1q2.4 -1.4 2 -3.4"/>`,
  gn: `<path fill="none" stroke="${P.ink}" stroke-width=".9" stroke-linecap="round" d="M-3.4 2c2.4 -4 4.4 1 6.4 -3l.4 -1.6"/>`,
}
// Feather, sun, ankh, water, snake, reed, eye, bread, ankh, sun, water, feather.
const COLUMN = ['gf', 'gs', 'ga', 'gw', 'gn', 'gr', 'ge', 'gb', 'ga', 'gs', 'gw', 'gf']

/** A gold five-pointed star of the ceiling, centred on 0 0. */
function starPath(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const q = i % 2 ? r * 0.32 : r
    pts.push(`${n(Math.cos(a) * q)} ${n(Math.sin(a) * q)}`)
  }
  return `M${pts.join('L')}z`
}

/** The definitions the whole style paints with, laid down once under the stage. */
function defs(sw: number, h: number): string {
  const glyphs = Object.entries(GLYPHS)
    .map(([k, g]) => `<g id="tb-${k}">${g}</g>`)
    .join('')
  // The khekher frieze: knotted reed bundles in the four pigments, keyed in carbon.
  const khekher = BAND.map(
    (c, i) =>
      `<path fill="${c}" stroke="${P.ink}" stroke-width=".35" d="M${i * 5 + 0.6} 8.5v-5.4a1.9 1.9 0 0 1 3.8 0v5.4z"/>`,
  ).join('')
  return (
    glyphs +
    `<path id="tb-star" d="${starPath(1.7)}"/>` +
    `<g id="tb-ra">${ra(0, 0, 4.2)}</g>` +
    // The plaster: blots of a darker earth, and grain.
    `<filter id="tb-plaster" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".018 .03" numOctaves="4" seed="30"/>` +
    `<feColorMatrix values="0 0 0 0 .63  0 0 0 0 .47  0 0 0 0 .26  0 0 -2.2 0 1.25"/></filter>` +
    `<filter id="tb-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/>` +
    `<feColorMatrix values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .1  0 0 0 -1.8 1.05"/></filter>` +
    // Nut's ceiling: Egyptian blue, gold stars set in a staggered grid.
    `<pattern id="tb-nut" width="28" height="22" patternUnits="userSpaceOnUse"><rect width="28" height="22" fill="${P.blue}"/>` +
    `<use href="#tb-star" x="7" y="5.5" fill="${P.gold}" opacity=".55"/><use href="#tb-star" x="21" y="16.5" fill="${P.gold}" opacity=".55"/></pattern>` +
    // The desert: pink ochre speckled with red and blue.
    `<pattern id="tb-desert" width="6" height="5" patternUnits="userSpaceOnUse"><rect width="6" height="5" fill="#e0a27a"/><circle cx="1.4" cy="1.2" r=".45" fill="${P.red}"/><circle cx="4.4" cy="3.6" r=".4" fill="${P.blue}"/></pattern>` +
    // Malachite set with rows of leaves.
    `<pattern id="tb-leaf" width="5" height="4" patternUnits="userSpaceOnUse"><rect width="5" height="4" fill="${P.green}"/><path fill="#2a5a3c" d="M1 2.6q1.2 -2.4 2.4 0q-1.2 .9 -2.4 0zM-1.5 .6q1.2 -2.4 2.4 0zM3.5 .6q1.2 -2.4 2.4 0z"/></pattern>` +
    // Pleated linen.
    `<pattern id="tb-pleat" width="1.8" height="8" patternUnits="userSpaceOnUse" patternTransform="skewX(12)"><rect width="1.8" height="8" fill="${P.linen}"/><rect width=".35" height="8" fill="#a8987a"/></pattern>` +
    // The border of painted squares, along and down.
    `<pattern id="tb-band" width="12" height="${h}" patternUnits="userSpaceOnUse">${BAND.map((c, i) => `<rect x="${i * 3}" width="3" height="${h}" fill="${c}"/>`).join('')}</pattern>` +
    `<pattern id="tb-bandv" width="${sw}" height="12" patternUnits="userSpaceOnUse">${BAND.map((c, i) => `<rect y="${i * 3}" width="${sw}" height="3" fill="${c}"/>`).join('')}</pattern>` +
    `<pattern id="tb-khekher" width="20" height="10" patternUnits="userSpaceOnUse" x="3.5">${khekher}</pattern>`
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const TOMB: Look = {
  name: 'tomb',
  label: 'Tomb Painting',
  voice: 'a scribe of Thebes recording deeds on a tomb wall, solemn and formal',
  cell: 'solid',
  figure: '3d',
  font: SERIF,
  charW: 5.1,
  caption: { fill: P.linen, stroke: P.ink, ink: P.ink, radius: 2 },
  paper: { card: P.linen, ink: P.ink, kinds: { code: '#2f5f9e', path: '#2e6a4a', fn: '#7a4a12', num: '#a83a26', bad: '#a83a26', good: '#2e6a4a', face: '#a83a26' } },
  inset: FRIEZE,
  titleColor: P.ink,
  art: {
    painter: scenery,
    hero,
    sky: P.wall,
    ground: '#c9a46a',
    defs,
    // The plastered wall, blotched, under everything painted on it.
    under: (sw, h) => `<rect width="${sw}" height="${h}" fill="${P.wall}"/><rect width="${sw}" height="${h}" filter="url(#tb-plaster)" opacity=".5"/>`,
  },
  // The plaster's grain over the paint, and a few cracks.
  texture: (sw, h) =>
    `<rect width="${sw}" height="${h}" filter="url(#tb-grain)" opacity=".35"/>` +
    `<path fill="none" stroke="#3c230f" stroke-opacity=".35" stroke-width=".5" d="M${n(sw * 0.18)} 14l3 5 -1 6 4 4 1 7M${n(sw * 0.63)} 13l-2 6 3 3 -1 8M${n(sw * 0.41)} 128l2 -5 -3 -4 1 -6"/>`,
  frame: (sw, h) => {
    const x = sw - 3.5 - COL
    let col = ''
    COLUMN.forEach((k, i) => {
      const y = FRIEZE + 7 + i * 10
      if (y < h - 8) col += `<use href="#tb-${k}" x="${n(x + COL / 2)}" y="${y}"/>`
    })
    return (
      // The border of painted squares, an ink rule inside it.
      `<rect width="${sw}" height="3" fill="url(#tb-band)"/><rect y="${h - 3}" width="${sw}" height="3" fill="url(#tb-band)"/>` +
      `<rect width="3" height="${h}" fill="url(#tb-bandv)"/><rect x="${sw - 3}" width="3" height="${h}" fill="url(#tb-bandv)"/>` +
      // The khekher frieze along the top, on plaster, over a band of blue.
      `<rect x="3" y="3" width="${sw - 6}" height="7" fill="${P.wall}"/><rect x="3" y="2" width="${sw - 6}" height="8.6" fill="url(#tb-khekher)"/>` +
      `<rect x="3" y="10.4" width="${sw - 6}" height="1.4" fill="${P.blue}"/>` +
      // The column of hieroglyphs at the right, between rules.
      `<rect x="${n(x)}" y="${FRIEZE}" width="${COL}" height="${h - FRIEZE - 3}" fill="${P.wall}"/>${col}` +
      `<path fill="none" stroke="${P.ink}" stroke-width=".7" d="M${n(x)} ${FRIEZE}V${h - 3}"/>` +
      `<rect x="3.3" y="3.3" width="${sw - 6.6}" height="${h - 6.6}" fill="none" stroke="${P.ink}" stroke-width=".6"/>` +
      `<path stroke="${P.ink}" stroke-width=".5" d="M3 ${FRIEZE}H${sw - 3}"/>`
    )
  },
  // The chapter written in a cartouche: a linen oval ruled in carbon, the tie at its end.
  tag: (text, inset) => {
    const t = escape(text.toUpperCase())
    const w = text.length * 6 + 14
    const x = inset - 4
    const y = inset + 3
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="13" rx="6.5" fill="${P.linen}" stroke="${P.ink}" stroke-width="1.3"/>` +
        `<path stroke="${P.ink}" stroke-width="1.6" d="M${n(x + w + 1.4)} ${y - 0.5}v14"/>` +
        `<text x="${n(x + w / 2)}" y="${y + 9.6}" text-anchor="middle" font-family="${TITLE}" font-size="8.4" font-weight="700" letter-spacing="1" fill="${P.ink}">${t}</text>`,
      w: x + w + 6,
      h: y + 17,
    }
  },
  bubble: {
    font: SERIF,
    size: 9,
    charW: 5.1,
    line: 12,
    base: 14,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A linen panel ruled as a register: carbon rule, a band of painted squares along its top, a carbon wedge to Claude.
      `<path fill="${P.ink}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${P.linen}" stroke="${P.ink}" stroke-width="1.1"/>` +
      `<rect x="${n(x + 0.6)}" y="${n(y + 0.6)}" width="${n(w - 1.2)}" height="2" fill="url(#tb-band)"/>` +
      `<path stroke="${P.ink}" stroke-width=".4" d="M${n(x)} ${n(y + 2.8)}h${w}"/>`,
  },
}

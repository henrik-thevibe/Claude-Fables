/**
 * Art Nouveau, after the gallery's "Art Nouveau: Paris, c. 1900" (index.html,
 * style 10, `nouveau`): Clawd as a Mucha panel.
 *
 * The art bible, translated from the gallery's panel to the Fables' worlds:
 *
 * - The medium is the colour lithograph poster of the Belle Époque: flat,
 *   soft pastel stones printed over one warm-brown contour stone. Nothing is
 *   lit; form is told by the contour, which grows bolder as things come
 *   nearer, and by a second, paler stone laid where a shape turns away.
 * - The inks are the plate's: cream page, sage and olive, old gold for every
 *   hairline and dot, and the pastels of Mucha's ribbons (rose, peach,
 *   lavender, butter, teal), with leaf greens and white lilies.
 * - The sky is a flat tint graded on the stone, sage over cream by day,
 *   lavender into rose at the blue hour, butter and peach at sunset, with the
 *   panel's faint woven threads running down it.
 * - Sun, moon and Earth each stand in a Mucha halo: a cream disc ringed in
 *   gold, a row of gold dots, a wreath of petals, fine rays round the heart.
 *   The sun's heart is butter, the desert's rose, the moon's cream, the
 *   Earth's teal with sage lands. The volcano's glow is a halo of its own, in
 *   ember rose behind the crater.
 * - Stars are little gold eight-point sparkles. Clouds are cream (lavender
 *   at dusk, slate at night) under a hairline of contour.
 * - Land, rock and ground are flat sage, olive and ochre stones; foliage and
 *   grass the plate's leaf greens; bark the contour's own brown. Buildings
 *   are lavender or stone tints, their windows butter. Glass is teal; a
 *   poster has no reflections, so the wet street and the polished floor stay
 *   plain.
 * - Fire and lava are coral, peach and butter, contoured like everything
 *   else. Lamps are butter and gold, their pools flat gold ellipses.
 * - Mist and haze become Mucha's whiplash ribbons: long bands that swell and
 *   taper across the scene and end in a curl, paled to air in the distance,
 *   in the plate's full rose, butter and teal where they stream nearer, and
 *   across the desert's sky behind the sun's halo. Shafts of light are fans
 *   of gold hairline rays, as round the halo.
 * - Night is a deep teal-and-slate plate, the greens gone blue-green, the
 *   contour still warm brown, and the gold brighter against it.
 * - Life and particles are gold motes and pastel petals.
 * - Claude is the gallery's soft pastel Clawd: peach and blush faces in flat
 *   stones, one warm-brown contour round his whole figure with fainter inner
 *   lines, the shading crescent printed into his face, rosy cheeks, brown
 *   eyes with a cream glint, and a crown of little flowers on a green vine.
 * - The frame is the panel: a cream page mat whose opening is arched at the
 *   top, ruled in olive and gold with a row of gold dots, gold tendrils in
 *   the spandrels and white lilies in the lower corners. The chapter is the
 *   sage plaque with its gold studs, lettered in cream capitals; the caption
 *   is a cream card ruled in contour and gold.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces, type P2 } from '../clawd3d'
import { isGreen, isWarm, hue, lum, num as n, poly, step, t1 } from '../art/ink'
import { MIST_TILE, tiled } from '../art/mist'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const C = {
  page: '#f2e8cf',
  cream: '#fbf4e2',
  ink: '#6a4330',
  inkD: '#4a2e20',
  sage: '#a7b590',
  olive: '#666d46',
  oliveD: '#4f5a3a',
  gold: '#bf9a47',
  goldL: '#ddc27c',
  petal: '#edbdb6',
  petalD: '#c88d92',
  rose: '#e9a5ad',
  lav: '#b7a5d8',
  butter: '#efcf78',
  teal: '#8cc2b4',
  peach: '#f3b893',
  lily: '#fffbf3',
  lilyS: '#ede3cc',
  leaf: '#86a067',
  leafD: '#5d7a46',
  plaque: '#617a5a',
  plaqueL: '#f6ecd4',
  // Claude's stones.
  body: '#f1b296',
  top: '#f9d6c3',
  side: '#dd967a',
  back: '#e6a587',
  leg: '#e8a487',
  legD: '#cd896c',
  shadeF: '#e29a7e',
  eye: '#4a291f',
  blush: '#ef8a86',
}

/** The lithographer's stones, dark to light, by what they print. */
const INK = {
  sage: ['#4e5a3a', '#666d46', '#879872', '#a7b590', '#c2cca8', '#dfe3c8'],
  leaf: ['#3f5a32', '#5d7a46', '#86a067', '#a7bf86', '#c9d6a8'],
  earth: ['#5a3a28', '#8a5a3a', '#b9825a', '#d8a978', '#ecc99a', '#f6e3c0'],
  bark: ['#4a2f22', '#6a4330', '#8a5c40', '#a87a56'],
  stone: ['#3e4a52', '#5a6870', '#7e8c8c', '#a3ada4', '#c8ccbc', '#e6e2cc'],
  lav: ['#4a3f66', '#6d5f8e', '#9484b8', '#b7a5d8', '#d6cbe8', '#efe8f4'],
  glass: ['#2f4250', '#4a6470', '#6fa49a', '#8cc2b4', '#c8e6dc'],
  rose: ['#6e3a4a', '#9a5a66', '#c08080', '#dcaaa2', '#efcfc2'],
  fire: ['#8a3a3a', '#c25a4a', '#e07a5a', '#f3b893', '#efcf78', '#fbf0c8'],
  gold: [C.gold, C.goldL, C.butter, '#f6e2a0', C.cream],
  cloud: ['#a3a48a', '#c9c6ae', '#e6dfc8', C.page, C.cream],
  // Skies: by day sage, lavender at the blue hour, rose to butter toward the sun; slate and teal by night.
  skySage: ['#5e7060', '#879872', '#a7b590', '#c2cca8', '#dfe3c8', C.page],
  skyLav: ['#6d5f8e', '#9484b8', '#b7a5d8', '#d6cbe8', '#efe8f4'],
  dawn: ['#b0566a', '#d77f86', '#e9a5ad', '#f3b893', '#efcf78', '#f6e3c0', C.cream],
  nightSky: ['#26364a', '#2f4458', '#3e566a', '#557080', '#7a9298', '#a8bab4'],
  nightWarm: ['#4a2c3e', '#6e3a4a', '#9a4a52', '#c25a4a', '#e07a5a'],
  // The night plate: the greens gone blue-green, the land slate.
  nLeaf: ['#1f3236', '#2a4440', '#3a5a4e', '#557a62', '#7a9a7a'],
  nLand: ['#26364a', '#33485a', '#46606a', '#5e7a7e', '#86a09a'],
  nCloud: ['#3e566a', '#557080', '#7a9298', '#a8bab4', '#cfd8cc'],
}

/** Lightness spread out, so the dim lit scenes still use the whole of a ramp. */
const lift = (l: number) => Math.min(1, Math.pow(l, 0.8) * 1.08)

/** Browns and tans: earth, sand, wood, unlit but warm. */
function brown(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r > b + 18 && r >= g
}
/** Blues and violets: what the blue hour prints in lavender. */
const violet = (color: string) => {
  const { h, s } = hue(color)
  return s > 0.25 && h >= 215 && h < 320
}

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false
/** Each sky defines its own tint, under an id of its own. */
let skies = 0
/** The stage's width, as its sky says. */
let stage = 640
/** How far the forest's sun is lifted above where the lit painting sets it. */
const LIFT = 14
/** Whether the scene is indoors: the lab's walls are painted first, and say so. */
let room = false

/** A lit sky's color as the sky stone prints it. */
function skyInk(color: string): string {
  const l = lift(lum(color))
  if (night) return isWarm(color) ? step(INK.nightWarm, l * 1.6) : step(INK.nightSky, l * 1.6)
  if (isWarm(color)) return step(INK.dawn, l)
  return violet(color) ? step(INK.skyLav, l + 0.08) : step(INK.skySage, l + 0.06)
}

function ink(color: string, family: Family, depth: number): string {
  const l = lift(lum(color))
  const warm = isWarm(color)
  const green = isGreen(color)
  // Far things print paler: one step of distance for the horizon's quarter of the scene.
  const far = depth < 0.25 ? 0.12 : 0
  const t = Math.min(1, l + far)
  switch (family) {
    case 'sky':
      return skyInk(color)
    case 'cloud':
    case 'air':
      return night ? step(INK.nCloud, t + 0.15) : warm ? step(INK.dawn, Math.max(0.5, t)) : violet(color) ? step(INK.skyLav, t + 0.2) : step(INK.cloud, t + 0.1)
    case 'stars':
    case 'body':
    case 'beam':
    case 'glow':
      return step(INK.gold, t)
    case 'life':
      return l < 0.3 ? C.ink : warm ? step(INK.fire, l + 0.2) : green ? step(INK.leaf, t) : step(INK.gold, t)
    case 'fire':
      return step(INK.fire, l)
    case 'lamp':
      return step(INK.gold, Math.max(0.35, l))
    case 'foliage':
    case 'grass':
      if (night) return step(INK.nLeaf, depth >= 0.85 ? Math.max(0.45, t * 1.3) : t * 1.3)
      if (depth < 0.25) return step(INK.sage, t + 0.1)
      // The near fronds and blades print in the plate's leaf greens, not in shadow.
      return step(INK.leaf, depth >= 0.85 ? Math.max(0.4, t) : warm ? t * 0.8 : t)
    case 'bark':
      return step(INK.bark, t * 1.2)
    case 'land':
      if (night) return green ? step(INK.nLeaf, t * 1.3) : step(INK.nLand, t * 1.3)
      return warm || brown(color) ? step(INK.earth, t) : step(INK.sage, t + 0.05)
    case 'ground':
    case 'mark':
      if (green) return night ? step(INK.nLeaf, t * 1.3) : step(INK.leaf, t)
      if (warm || brown(color) || room) return step(INK.earth, t)
      return night ? step(INK.nLand, t * 1.3) : step(INK.stone, t)
    case 'rock':
      if (warm || brown(color)) return step(INK.earth, t)
      return night ? step(INK.nLand, t * 1.3) : violet(color) ? step(INK.rose, t + 0.1) : step(INK.stone, t)
    case 'built':
      if (warm || brown(color)) return step(INK.earth, t)
      return violet(color) ? step(INK.lav, t + 0.05) : room ? step(INK.sage, t) : step(INK.stone, t)
    case 'glass':
    case 'water':
      return step(INK.glass, t)
    case 'shadow':
      return C.inkD
    default:
      return step(INK.stone, t)
  }
}

/** Families printed without the contour: the sky's tint, light, air, sparks. */
const UNLINED: readonly Family[] = ['sky', 'stars', 'life', 'lens', 'air', 'beam', 'glow', 'lamp', 'water', 'shadow', 'body']

// ---------------------------------------------------------------- whiplash

type Pt = [number, number]

/** Integrates a curvature profile into a whiplash centre line: k(u) in radians per unit, u from 0 to 1. */
function whip(x: number, y: number, a: number, len: number, steps: number, k: (u: number) => number): Pt[] {
  const out: Pt[] = [[x, y]]
  const ds = len / steps
  for (let i = 1; i <= steps; i++) {
    a += k((i - 0.5) / steps) * ds
    x += Math.cos(a) * ds
    y += Math.sin(a) * ds
    out.push([x, y])
  }
  return out
}

/** A band along a centre line, `w(u)` wide: its outline, closed. */
function band(pts: readonly Pt[], w: (u: number) => number): Pt[] {
  const L: Pt[] = []
  const R: Pt[] = []
  const last = pts.length - 1
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)] ?? p
    const b = pts[Math.min(last, i + 1)] ?? p
    let tx = b[0] - a[0]
    let ty = b[1] - a[1]
    const len = Math.hypot(tx, ty) || 1
    tx /= len
    ty /= len
    const h = w(i / last) / 2
    L.push([p[0] - ty * h, p[1] + tx * h])
    R.push([p[0] + ty * h, p[1] - tx * h])
  })
  return L.concat(R.reverse())
}

/** A short name for a piece of content, so ids stay apart when several drawings share one page. */
function hash(s: string): string {
  let h = 7
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** A small seeded sequence, so the same stage always draws the same ribbons. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * Mist as Mucha's ribbons: long bands across the band of air from `y` to
 * `y + h`, swelling and tapering, rolling into a curl at one end, with a paler
 * stroke of sheen along them. Replaces mist and haze.
 */
function ribbons(o: { sw: number; y: number; h: number; veil?: boolean; lean?: boolean; bold?: boolean }, motion: string): string {
  const { y, h } = o
  const w = Math.min(MIST_TILE, o.sw)
  const veil = o.veil === true
  const lean = o.lean === true
  const rnd = seeded(Math.round(y * 37 + h * 101))
  const thick = Math.max(2.8, Math.min(6, h * 0.34))
  // The plate's ribbon pastels, paled a stone so they read as air (rose, butter, lavender, teal, peach),
  // or at full strength for the ribbons that stream through the scene as they stream behind the plate's Clawd.
  const fills = night
    ? ['#9fb0b8', '#a99cc8', '#8fa8a0', '#b8a0aa']
    : veil
      ? ['#f3e8d4', '#f2e2dc', '#e8e2f0']
      : o.bold
        ? [C.rose, C.butter, C.teal, C.lav, C.peach]
        : ['#f4d0cc', '#f6e2a6', '#dcd2ee', '#c9e2d8', '#f8d8c0']
  let bands = ''
  let sheen = ''
  let k = 0
  for (let x = -20 + rnd() * 50; x < w + 10; k++) {
    const len = 110 + rnd() * 110
    const dir = k % 2 ? -1 : 1
    const base = y + h * (0.35 + rnd() * 0.45)
    const amp = Math.min(h * 0.22, 4) * (0.6 + rnd() * 0.6)
    const ph = rnd() * 6.28
    const steps = 8
    // The body of the ribbon: a long slow wave, drawn in the ribbon's direction of travel.
    const body: Pt[] = []
    for (let i = 0; i <= steps; i++) {
      const u = i / steps
      const px = dir > 0 ? x + u * len : x + len - u * len
      body.push([px, base + amp * Math.sin(ph + u * 5.2)])
    }
    // Its end rolls up into a curl.
    const e = body[steps] ?? [x, base]
    const p = body[steps - 1] ?? [x, base]
    const a = Math.atan2(e[1] - p[1], e[0] - p[0])
    const curl = whip(e[0], e[1], a, 20 + rnd() * 8, 6, u => -dir * (0.06 + 0.42 * u * u))
    const line = body.concat(curl.slice(1))
    const W = thick * (0.9 + rnd() * 0.5)
    const outline = band(line, u => W * Math.min(1, u / 0.14) * (1 - 0.82 * u) + 0.3)
    bands += `<path fill="${fills[k % fills.length]}" d="${poly(outline)}"/>`
    if (!veil && !lean) sheen += poly(body.slice(1, steps - 1), 0, -W * 0.12, false)
    x += len + (lean ? 70 : 18) + rnd() * 60
  }
  const art =
    `<g stroke="${C.ink}" stroke-width=".45" stroke-linejoin="round">${bands}</g>` +
    (sheen ? `<path fill="none" stroke="${night ? '#cfd8cc' : C.lily}" stroke-width=".6" stroke-linecap="round" d="${sheen}"/>` : '')
  return `<g>${tiled(`nv-mist-${Math.round(y)}-${Math.round(h)}-${hash(fills.join(''))}`, art, o.sw)}${motion}</g>`
}

// ---------------------------------------------------------------- halos, stars, rays

/**
 * A Mucha halo behind a heavenly body, drawn once (radius 30) and placed
 * scaled: `back` is its disc, `petals` its wreath.
 */
const halo = (cx: number, cy: number, r: number, back: string, petals: string) =>
  `<use href="#nv-halo" transform="translate(${n(cx)} ${n(cy)}) scale(${n(r / 30)})" color="${back}" fill="${petals}"/>`

/** A heavenly body's heart in its halo: a disc in its ink, ringed in gold. */
const heart = (cx: number, cy: number, r: number, fill: string) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" stroke="${C.gold}" stroke-width=".8"/>` +
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.72)}" fill="none" stroke="${C.cream}" stroke-opacity=".6" stroke-width=".4"/>`

function body(_svg: string, c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 8
  switch (c.role) {
    case 'forest.sun':
      // Lifted clear of the far firs, so its halo stands in the sky as the desert's does.
      return c.meta.part === 'halo' ? halo(cx, cy - LIFT, 30, C.cream, C.petal) : heart(cx, cy - LIFT, r * 1.05, C.butter)
    case 'desert.sun':
      // Two of the plate's whiplash ribbons stream across the sky behind the sun's halo.
      return c.meta.part === 'halo'
        ? ribbons({ sw: stage, y: 26, h: 22, lean: true, bold: true }, `<animateTransform attributeName="transform" type="translate" values="0 0;14 0;0 0" dur="36s" repeatCount="indefinite"/>`) +
            halo(cx, cy, 34, '#f6e3c0', C.rose)
        : heart(cx, cy, r * 0.95, C.peach)
    case 'night.moon':
      return halo(cx, cy, 30, '#55707e', C.lav) + heart(cx, cy, r, '#f6ecd4')
    case 'space.earth': {
      // The Earth: teal seas, sage lands in flowing whiplash shapes, a cream swirl of cloud; risen a little,
      // so more of its wreath stands above the horizon.
      const cy = (c.meta.cy ?? 0) - 9
      return (
        halo(cx, cy, r * 1.6, '#3e566a', C.teal) +
        heart(cx, cy, r, C.teal) +
        `<path fill="${C.sage}" stroke="${C.ink}" stroke-width=".4" d="M${n(cx - r * 0.7)} ${n(cy - r * 0.45)}q${n(r * 0.35)} ${n(-r * 0.3)} ${n(r * 0.7)} ${n(-r * 0.1)}q${n(r * 0.2)} ${n(r * 0.35)} ${n(-r * 0.1)} ${n(r * 0.55)}q${n(-r * 0.3)} ${n(r * 0.1)} ${n(-r * 0.6)} ${n(-r * 0.45)}zM${n(cx + r * 0.15)} ${n(cy + r * 0.25)}q${n(r * 0.4)} ${n(-r * 0.15)} ${n(r * 0.55)} ${n(r * 0.2)}q${n(-r * 0.1)} ${n(r * 0.35)} ${n(-r * 0.45)} ${n(r * 0.3)}z"/>` +
        `<path fill="none" stroke="${C.cream}" stroke-width=".8" stroke-linecap="round" d="M${n(cx - r * 0.85)} ${n(cy + r * 0.1)}q${n(r * 0.5)} ${n(-r * 0.2)} ${n(r * 0.9)} ${n(r * 0.05)}t${n(r * 0.7)} ${n(-r * 0.1)}"/>`
      )
    }
    default:
      return heart(cx, cy, r, C.butter)
  }
}

/** Stars as gold sparkles: every shape becomes a group, keeping its own attributes and animation, of sparkles at its points. */
function stars(svg: string, c: Ctx): string {
  // One sparkle, defined once, placed at every point: a starfield holds hundreds.
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#nv-star" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg.replace(/<ellipse\b[^>]*\/>/g, ''))
    .replace(/<(path|rect|circle)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+)[ ,]([\d.-]+)/g)].map(m => [m[1] ?? '0', m[2] ?? '0'])
          : tag === 'circle'
            ? [[/\scx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\scy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
            : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|cx|cy|r|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      return `<g${kept} fill="${C.butter}">${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect|circle)>/g, '</g>')
}

/** Shafts of light as a fan of gold hairline rays from the sun, as round the halo. */
function rays(svg: string, c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = (c.meta.cy ?? 0) - (c.role === 'forest.shafts' ? LIFT : 0)
  const y = c.meta.y ?? 104
  let d = ''
  for (let i = -5; i <= 5; i++) {
    const a = Math.PI / 2 + i * 0.13
    const r0 = 34
    const r1 = (y - cy) / Math.max(0.3, Math.sin(a))
    d += `M${n(cx + Math.cos(a) * r0)} ${n(cy + Math.sin(a) * r0)}L${n(cx + Math.cos(a) * r1)} ${n(cy + Math.sin(a) * r1)}`
  }
  return `<g><path fill="none" stroke="${C.goldL}" stroke-width=".5" stroke-opacity=".7" stroke-dasharray="6 2 1 2" d="${d}"/>${c.motion(svg)}</g>`
}

/** The lit sky as the sky stone: its own tint, graded from the lit sky's colors, with the panel's threads down it. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#6080a0'
  const low = stops[stops.length - 1]?.color ?? '#a0b0c0'
  night = lum(top) < 0.2 && lum(low) < 0.45
  const sw = c.meta.sw ?? 640
  stage = sw
  const tint = (stops.length ? stops : [{ offset: 0, color: top }, { offset: 1, color: low }])
    .map(s => `<stop offset="${n(s.offset)}" stop-color="${skyInk(s.color)}"/>`)
    .join('')
  const id = `nv-sky${++skies}-${hash(tint)}`
  return (
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${tint}</linearGradient></defs>` +
    `<rect width="${n(sw)}" height="128" fill="url(#${id})"/><rect width="${n(sw)}" height="128" fill="url(#nv-threads)"/>`
  )
}

const scenery = () => {
  night = false
  skies = 0
  room = false
  stage = 640
  return painter(
    {
      ink: (color, family, depth) => ink(color, family, depth),
      // The contour stone, bolder as things come nearer; fronds and blades up close take a leaf-green line, or the brown would swamp them.
      line: (family, depth) =>
        UNLINED.includes(family)
          ? ''
          : `stroke="${(family === 'grass' || family === 'foliage') && depth >= 0.85 ? (night ? '#1a2a2c' : C.leafD) : C.ink}" stroke-width="${n(family === 'fire' ? 0.3 : family === 'grass' || family === 'foliage' ? Math.min(0.4, 0.2 + depth * 0.3) : 0.25 + depth * 0.55)}" stroke-linejoin="round"${depth < 0.25 ? ' stroke-opacity=".65"' : ''}`,
      // A lithograph lays its stones flat: washes print as solid tints, faint glazes not at all.
      opacity: (family, v) => (family === 'cloud' ? Math.min(1, v * 1.5) : family === 'glow' || family === 'beam' ? v * 0.6 : v),
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool is a flat gold ellipse with a paler heart.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${C.butter}" opacity=".35"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="#fbf0c8" opacity=".5"/>`,
      redraw: {
        sky,
        stars,
        body,
        // The nearer of the forest's mists streams in the plate's full pastels; the rest are paled to air.
        air: (svg, c) =>
          ribbons(
            { sw: c.meta.sw ?? stage, y: c.meta.y ?? 80, h: c.meta.h ?? 12, veil: c.meta.veil === true, lean: c.meta.lean === true, bold: c.role === 'forest.mist' && (c.meta.y ?? 0) >= 80 },
            c.motion(svg),
          ),
        // The lab is a room: sage walls, a wooden floor.
        'lab.wall': (svg, c) => {
          room = true
          return c.repaint(svg)
        },
        beam: rays,
        glow: (_svg, c) => {
          // The volcano's glow is an ember halo behind the crater; the sun on the forest floor a flat gold patch.
          if (c.role === 'volcano.glow') return halo(c.meta.cx ?? 0, (c.meta.cy ?? 40) + 6, 50, '#6e3a4a', '#e07a5a')
          if (c.role === 'forest.sunpatch') return `<ellipse cx="${n(c.meta.cx ?? 0)}" cy="${n(c.meta.cy ?? 100)}" rx="60" ry="6" fill="${C.butter}" opacity=".3"/>`
          return ''
        },
        // A poster has no reflections: the wet street and the polished floor stay plain.
        water: () => '',
        lens: () => '',
      },
    },
    'nv',
  )
}

// ---------------------------------------------------------------- Claude

/**
 * Claude as the gallery draws him in Mucha's line: flat pastel stones under
 * one bold warm-brown contour, fainter inner lines, the shading crescent
 * printed into his face's own tint, blush, eyes and a flower crown.
 */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  // The contour: every part's hull stroked wide under the stones, so the union carries one line.
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  // The legs: their fronts in one stone; their sides are the contour's fill showing between, a step darker.
  const legs = m.parts.filter(pt => pt.name === 'leg').flatMap(pt => pt.faces.filter(f => f.name === 'front').map(f => poly(f.pts, cx, floor)))
  let faces = legs.length ? `<path fill="${C.leg}" d="${legs.join('')}"/>` : ''
  let tone = ''
  let d = ''
  for (const f of outlinedFaces(m)) {
    if (f.part === 'leg') continue
    const t =
      f.name === 'top'
          ? C.top
          : f.name === 'front'
            ? f.part === 'body'
              ? 'url(#nv-front)'
              : C.body
            : f.name === 'back'
              ? C.back
              : C.side
    if (t !== tone && d) {
      faces += `<path fill="${tone}" d="${d}"/>`
      d = ''
    }
    tone = t
    d += poly(f.pts, cx, floor)
  }
  if (d) faces += `<path fill="${tone}" d="${d}"/>`
  const body = m.parts.find(p => p.name === 'body')
  const front = body?.faces.find(f => f.name === 'front')?.pts
  const top = body?.faces.find(f => f.name === 'top')?.pts
  // The face's own frame, from its bottom left corner: across, and up. The cheeks are drawn once in
  // that frame and placed by it; the crown along the brow, its flowers upright.
  const frame = (o: P2, x: P2, y: P2) => `${t1(x[0] - o[0])} ${t1(x[1] - o[1])} ${t1(y[0] - o[0])} ${t1(y[1] - o[1])} ${t1(o[0] + cx)} ${t1(o[1] + floor)}`
  const blush = front?.[0] && front[1] && front[3] ? `<use href="#nv-cheeks" transform="matrix(${frame(front[0], front[1], front[3])})"/>` : ''
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${C.eye}" d="${poly(e.poly, cx, floor)}"/>` +
          `<circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx + 0.1)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor + 0.2)}" r=".5" fill="${C.cream}"/>`
        : `<path fill="none" stroke="${C.eye}" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  // The flower crown: a green vine along his brow, three flowers on it.
  const brow = top?.[0] && top[1] ? [top[0], top[1]] : front?.[3] && front[2] ? [front[3], front[2]] : undefined
  const crown = brow?.[0] && brow[1] ? `<use href="#nv-crown" transform="matrix(${frame(brow[0], brow[1], [brow[0][0], brow[0][1] + 1])})"/>` : ''
  // The shadow: a flat oval of contour ink on the ground.
  const xs = m.shadow.map(p => p[0])
  const ys = m.shadow.map(p => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const shadow = `<ellipse cx="${t1((x0 + x1) / 2 + cx)}" cy="${t1((y0 + y1) / 2 + floor)}" rx="${t1((x1 - x0) / 2)}" ry="${t1((y1 - y0) / 2)}" fill="${C.inkD}" opacity=".22"/>`
  return (
    shadow +
    `<path fill="${C.legD}" stroke="${C.ink}" stroke-width="1.7" stroke-linejoin="round" d="${hulls}"/>` +
    // The inner lines: each stone's edge in a fainter contour.
    `<g stroke="${C.ink}" stroke-opacity=".7" stroke-width=".45" stroke-linejoin="round">${faces}</g>` +
    blush +
    eyes +
    crown
  )
}

// ---------------------------------------------------------------- the panel

const SANS = "Optima, Candara, 'Gill Sans', 'Segoe UI', sans-serif"
/** The plaque's lettering: rounded monoline capitals, as the gallery draws its plaque. */
const LETTER = "'Arial Rounded MT Bold', 'Avenir Next', Optima, 'Segoe UI', sans-serif"

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A leaf along a quadratic from `a` by `c` to `b`, `w` wide. */
function leaf(a: Pt, c: Pt, b: Pt, w: number, fill: string): string {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy) || 1
  const nx = (-dy / l) * w
  const ny = (dx / l) * w
  return (
    `<path fill="${fill}" d="M${t1(a[0])} ${t1(a[1])}Q${t1(c[0] + nx)} ${t1(c[1] + ny)} ${t1(b[0])} ${t1(b[1])}Q${t1(c[0] - nx)} ${t1(c[1] - ny)} ${t1(a[0])} ${t1(a[1])}z"/>` +
    `<path fill="none" stroke-opacity=".5" stroke-width=".35" d="M${t1(a[0])} ${t1(a[1])}Q${t1(c[0])} ${t1(c[1])} ${t1(b[0])} ${t1(b[1])}"/>`
  )
}

/** A white lily seen from the front: two rings of three petals, gold stamens. */
function lily(x: number, y: number, r: number, rot: number): string {
  let out = ''
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < 3; i++) {
      const a = rot + ((i * 2 + pass) * Math.PI) / 3
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const m = r * 0.5
      const w = r * 0.42
      out += `<path fill="${pass ? C.lily : C.lilyS}" d="M${t1(x)} ${t1(y)}Q${t1(x + ca * m - sa * w)} ${t1(y + sa * m + ca * w)} ${t1(x + ca * r)} ${t1(y + sa * r)}Q${t1(x + ca * m + sa * w)} ${t1(y + sa * m - ca * w)} ${t1(x)} ${t1(y)}z"/>`
    }
  return out + `<circle cx="${t1(x)}" cy="${t1(y)}" r="${t1(r * 0.22)}" fill="${C.goldL}"/>`
}

/** The lilies in the panel's lower left corner, their root at 0 0, growing up and in. */
function lilies(): string {
  const stems = `<path fill="none" stroke="${C.leafD}" stroke-width=".9" d="M2 0Q5 -8 11 -14M1 0Q-1 -10 4 -20M3 0Q10 -3 17 -5"/>`
  return (
    `<g stroke="${C.ink}" stroke-width=".5" stroke-linejoin="round">` +
    leaf([0, 0], [-6, -10], [-1, -24], 3.2, C.leaf) +
    leaf([2, 0], [12, -6], [20, -16], 2.8, C.leafD) +
    leaf([1, 0], [8, -3], [24, -2], 2.2, C.leaf) +
    stems +
    lily(11, -15, 6, -0.2) +
    lily(4, -21, 4.6, 0.3) +
    lily(17.5, -5.5, 3.6, 0.1) +
    `</g>`
  )
}

/** A gold tendril in a spandrel: a whiplash stem rolling into a curl, two leaves and three dots. Top left corner; mirrored for the right. */
function tendril(): string {
  const stem = whip(5, 34, -Math.PI / 2 + 0.15, 30, 14, u => 0.02 + 0.5 * u * u)
  const s = stem[6] ?? [5, 20]
  return (
    `<path fill="none" stroke="${C.gold}" stroke-width=".8" stroke-linecap="round" d="${poly(stem, 0, 0, false)}"/>` +
    `<g stroke="${C.gold}" stroke-width=".4">${leaf(s, [s[0] + 4, s[1] - 1], [s[0] + 6, s[1] + 3], 1.4, C.goldL)}${leaf(s, [s[0] - 1, s[1] - 4], [s[0] + 2, s[1] - 7], 1.2, C.goldL)}</g>` +
    `<g fill="${C.gold}"><circle cx="13" cy="10" r="1"/><circle cx="16.5" cy="7.5" r=".7"/><circle cx="10" cy="13" r=".6"/></g>`
  )
}

/** The panel's arched opening, `i` in from the edge, its top corners arched with radius `r`. */
const opening = (sw: number, h: number, i: number, r: number) =>
  `M${n(i)} ${n(h - i)}V${n(i + r)}A${n(r)} ${n(r)} 0 0 1 ${n(i + r)} ${n(i)}H${n(sw - i - r)}A${n(r)} ${n(r)} 0 0 1 ${n(sw - i)} ${n(i + r)}V${n(h - i)}z`

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(): string {
  // The halo at radius 30: disc in its back color, gold rim, a row of gold dots, a wreath of petals, rays round the heart.
  let petals = ''
  for (let i = 0; i < 22; i++) petals += `<use href="#nv-petal" transform="rotate(${n((i * 360) / 22)})"/>`
  return (
    `<pattern id="nv-threads" width="6" height="128" patternUnits="userSpaceOnUse"><path d="M3 0V128" stroke="${C.ink}" stroke-opacity=".1" stroke-width=".5"/></pattern>` +
    `<path id="nv-petal" d="M0 -14Q2.6 -19 0 -24.5Q-2.6 -19 0 -14z" stroke="${C.petalD}" stroke-width=".4"/>` +
    `<g id="nv-halo">` +
    `<circle r="30" fill="currentColor" stroke="${C.gold}" stroke-width=".9"/>` +
    `<circle r="27.6" fill="none" stroke="${C.gold}" stroke-width="1.2" stroke-dasharray="0 2.5" stroke-linecap="round"/>` +
    `<circle r="25.4" fill="none" stroke="${C.gold}" stroke-width=".45"/>` +
    petals +
    `<circle r="13.4" fill="none" stroke="${C.gold}" stroke-width=".5"/>` +
    `<circle r="9.6" fill="none" stroke="${C.goldL}" stroke-width="7" stroke-dasharray=".3 1.05"/>` +
    `</g>` +
    `<path id="nv-star" fill="${C.butter}" d="M0 -2.2L.5 -.5L2.2 0L.5 .5L0 2.2L-.5 .5L-2.2 0L-.5 -.5z"/>` +
    // A flower of the crown: five round petals in the fill it is placed with, a gold heart.
    `<g id="nv-bloom" stroke="${C.ink}" stroke-width=".25"><circle cx=".85" cy="-.25" r=".72"/><circle cx="-.85" cy="-.25" r=".72"/><circle cx=".52" cy=".72" r=".72"/><circle cx="-.52" cy=".72" r=".72"/><circle cy="-.9" r=".72"/><circle r=".5" fill="${C.goldL}"/></g>` +
    // The crown in the brow's frame: along it from 0 to 1, upright in stage units; the flowers as wide as a full-face brow makes them.
    `<g id="nv-crown"><path fill="none" stroke="${C.leafD}" stroke-width=".8" vector-effect="non-scaling-stroke" d="M.04 -.3Q.5 -1.6 .96 -.3"/>` +
    [[0.2, -1, C.rose], [0.5, -1.5, C.butter], [0.8, -1, C.lav]].map(([x, y, f]) => `<use href="#nv-bloom" transform="matrix(.035 0 0 1.32 ${x} ${y})" fill="${f}"/>`).join('') +
    `</g>` +
    // The cheeks in the face's frame: across 0 to 1, up 0 to 1.
    `<g id="nv-cheeks" fill="${C.blush}" opacity=".45"><ellipse cx=".146" cy=".5" rx=".08" ry=".055"/><ellipse cx=".854" cy=".5" rx=".08" ry=".055"/></g>` +
    // The shading crescent printed into the face's own tint: the lower right of the face a step darker.
    `<linearGradient id="nv-front" x1="0" y1="0" x2="1" y2="1"><stop offset=".66" stop-color="${C.body}"/><stop offset=".66" stop-color="${C.shadeF}"/></linearGradient>`
  )
}

export const NOUVEAU: Look = {
  name: 'nouveau',
  label: 'Art Nouveau',
  voice: 'an elegant Paris 1900 Art Nouveau poster, all lilies and whiplash curves',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 5.2,
  caption: { fill: C.cream, stroke: C.ink, ink: C.inkD, radius: 4 },
  paper: { card: C.cream, ink: C.inkD, kinds: { code: '#2f6a5e', path: '#55468a', fn: '#8a3a6a', num: '#b0562a', bad: '#b3332a', good: '#4a7a32', face: '#c25a4a' } },
  inset: 6,
  titleColor: C.plaqueL,
  art: {
    painter: scenery,
    hero,
    sky: C.sage,
    ground: '#8f9a6c',
    defs,
  },
  // The page's grain: faint tan flecks over the whole sheet.
  texture: (sw, h) =>
    `<defs><pattern id="nv-grain" width="29" height="23" patternUnits="userSpaceOnUse"><path fill="#78582a" fill-opacity=".09" d="M3 4h1.6v.5H3zM17 2h.9v.5H17zM11 12h2v.5h-2zM24 9h1.2v.5H24zM6 18h1v.5H6zM20 19h1.8v.5H20zM14 21h.8v.5h-.8z"/></pattern></defs>` +
    `<rect width="${n(sw)}" height="${n(h)}" fill="url(#nv-grain)"/>`,
  // The panel: a cream page mat round an opening arched at the top, ruled in olive and gold with a row of
  // gold dots; gold tendrils in the spandrels, white lilies in the lower corners.
  frame: (sw, h) => {
    const R = 30
    return (
      `<path fill="${C.page}" fill-rule="evenodd" d="M0 0H${n(sw)}V${n(h)}H0z${opening(sw, h, 4.5, R)}"/>` +
      `<rect x=".6" y=".6" width="${n(sw - 1.2)}" height="${n(h - 1.2)}" fill="none" stroke="${C.olive}" stroke-width="1.2"/>` +
      `<path fill="none" stroke="${C.olive}" stroke-width="1.1" d="${opening(sw, h, 4.5, R)}"/>` +
      `<path fill="none" stroke="${C.gold}" stroke-width=".5" d="${opening(sw, h, 6.4, R - 1.9)}"/>` +
      `<path fill="none" stroke="${C.gold}" stroke-width=".9" stroke-dasharray="0 3" stroke-linecap="round" d="${opening(sw, h, 2.6, R + 1.9)}"/>` +
      `<g id="nv-tendril">${tendril()}</g><use href="#nv-tendril" transform="matrix(-1 0 0 1 ${n(sw)} 0)"/>` +
      `<g id="nv-lilies" transform="translate(5 ${n(h - 4.5)})">${lilies()}</g><use href="#nv-lilies" transform="matrix(-1 0 0 1 ${n(sw)} 0)"/>`
    )
  },
  // The chapter on the sage plaque: an olive rule, a cream hairline inside, gold studs, cream capitals.
  tag: (text, inset) => {
    const t = text.toUpperCase()
    const x = inset + 6
    const y = inset + 4
    const w = t.length * 6 + 30
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="15" fill="${C.plaque}" stroke="${C.oliveD}" stroke-width="1"/>` +
        `<rect x="${x + 2}" y="${y + 2}" width="${n(w - 4)}" height="11" fill="none" stroke="${C.plaqueL}" stroke-opacity=".8" stroke-width=".45"/>` +
        `<g fill="${C.goldL}" stroke="${C.ink}" stroke-width=".4"><circle cx="${x + 7.5}" cy="${y + 7.5}" r="1.7"/><circle cx="${n(x + w - 7.5)}" cy="${y + 7.5}" r="1.7"/></g>` +
        `<text x="${n(x + w / 2)}" y="${y + 10.6}" text-anchor="middle" font-family="${LETTER}" font-size="8" letter-spacing="1.3" fill="${C.plaqueL}">${escape(t)}</text>`,
      w: x + w + 4,
      h: y + 19,
    }
  },
  bubble: {
    font: SANS,
    size: 9,
    charW: 5.2,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A cream card ruled in the contour's brown, a gold hairline inside, gold studs at its corners.
      `<path fill="${C.cream}" stroke="${C.ink}" stroke-width="1" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="5" fill="${C.cream}" stroke="${C.ink}" stroke-width="1.2"/>` +
      `<rect x="${n(x + 2.4)}" y="${n(y + 2.4)}" width="${n(w - 4.8)}" height="${n(h - 4.8)}" rx="3.4" fill="none" stroke="${C.gold}" stroke-width=".5"/>` +
      `<g fill="${C.gold}"><circle cx="${n(x + 4.6)}" cy="${n(y + 4.6)}" r=".9"/><circle cx="${n(x + w - 4.6)}" cy="${n(y + 4.6)}" r=".9"/><circle cx="${n(x + 4.6)}" cy="${n(y + h - 4.6)}" r=".9"/><circle cx="${n(x + w - 4.6)}" cy="${n(y + h - 4.6)}" r=".9"/></g>`,
  },
}

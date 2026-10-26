/**
 * Illuminated Initial, after the gallery's "Illuminated Initial: Book of
 * hours, c. 1410" (henrik-styles.js, style 33, `sinitial`), and the plate's
 * own sources: the miniatures of the books of hours, the Limbourg brothers'
 * calendar pages, their gilded initials and ivy margins.
 *
 * The art bible, translated from the plate to the Fables' worlds:
 *
 * - The medium is tempera and gold on vellum: flat, bright pigments laid
 *   inside a fine line of iron-gall ink, burnished gold leaf, and lead white
 *   for the highlights. Nothing is lit; a thing is its pigment, a step darker
 *   where it turns away. The pigments are the illuminator's few: ultramarine
 *   in four strengths, vermilion and the rubricator's red, rose, verdigris and
 *   sap green, ochre and umber, a grey-violet stone, lead white and gold.
 * - The sky is ultramarine, deepest at the top and paling to azure, almost to
 *   the vellum, at the horizon, as over the Limbourgs' fields; a dawn or a
 *   sunset pales to rose. The top of the sky is diapered, as the plate's
 *   initial is: a lattice of gold dots on the blue, fading as it comes down.
 *   Night is the same sky in deep lapis, sown with gold stars.
 * - The sun is a gold disc with a face, its rays cut straight and flaming
 *   by turns; the moon a crescent of silver leaf; the Earth, seen from the
 *   moon, a T-O map of the world: Asia above, Europe and Africa below,
 *   parted by a T of blue water inside the ring of the Ocean.
 * - Stars are six-pointed and gold. Clouds are lead white edged in blue, their
 *   lit rims picked out in gold; smoke and ash are a grey-violet. Mist is a
 *   run of lead-white banks, edged in ink; shafts of light are gold rays.
 * - Land is drawn in the pigment of what it is: green hills, ochre and rose
 *   rock, grey-violet stone, paling to blue in the distance, every shape in
 *   the ink line. Foliage is verdigris and sap green, bark umber.
 * - The ground is a field strewn with small flowers where it is grass, as in
 *   the plate's margins; sand and earth are stippled ochre, stone and dust
 *   stippled grey; a street is laid in cobbles; a room's floor in tiles of two
 *   colors; a room's wall is hung with a diapered cloth of gold quatrefoils.
 * - Buildings are rose and lead white, their dark masses ultramarine, the
 *   lamps and windows gold. Glass is ultramarine. A miniature paints no
 *   reflections, so wet streets and polished floors stay plain.
 * - Fire is vermilion over gold, outlined like everything else; lamplight on
 *   the ground is a pool of gold.
 * - Life and motes are gold dots and ink strokes; fireflies are gold.
 * - Claude is painted as the plate paints him: vermilion pigment inside a fine
 *   black line, the side a step deeper, gold leaf on his top faces, a stroke
 *   of lead white along his front, ink eyes with a white glint.
 * - The miniature is set on the page: a margin of vellum, a burnished gold
 *   bar with blue and pink blocks let into it, a sprig of gold and blue ivy at
 *   each corner, and the vellum's grain over all. The chapter opens with a
 *   gilded initial, a pink letter on a blue diapered ground in a gold square,
 *   the rest of its title rubricated, closed by a blue and gold line filler;
 *   the caption is written on a ruled vellum leaf framed in gold.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, num as n, poly, step, t1 } from '../art/ink'
import { MIST_TILE, mistBanks, tiled } from '../art/mist'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const P = {
  vellum: '#f1e6c8',
  ink: '#2a1d14',
  rubric: '#b22d1f',
  blue: '#2a49a0',
  pink: '#d77a88',
  gold: '#d6a53a',
  goldL: '#f4d27a',
  goldD: '#9c7420',
  white: '#fbf6ea',
  top: '#f29a6a',
  front: '#dd5a32',
  frontD: '#c94d2a',
  side: '#a8401f',
  sideD: '#8e3519',
  leg: '#c64e2b',
  legDark: '#93391d',
}

/** The illuminator's pigments, dark to light. */
const PIG = {
  ultra: ['#13235a', '#1e3a8a', P.blue, '#4a6cc0', '#7f9ad8', '#b8c8ec'],
  far: ['#4a6cc0', '#6a88cc', '#8ea6d8', '#b0c2e2', '#d0dcee'],
  rose: ['#6a2a3a', '#9a4a5e', '#c06a7a', P.pink, '#e8a4ae', '#f4ccd0'],
  green: ['#14301e', '#1f4a28', '#2f6a34', '#4a8a3e', '#7aac5a', '#b4cf8a'],
  ochre: ['#4a2e14', '#6a4420', '#9a6a30', '#c0924a', '#dcb874', '#efdcae'],
  umber: ['#2e1c10', '#4a2e1a', '#6a4426', '#8a5c34', '#a8784a'],
  stone: ['#3a3650', '#55526e', '#7a7690', '#a8a2b0', '#d2ccc6', '#f1ebdc'],
  gold: [P.goldD, P.gold, '#e8bc52', P.goldL, '#fbeab0'],
  fire: ['#7a1a10', P.rubric, '#d6452a', '#ec7a2a', '#f4b23a', '#fbe08a'],
  cloud: ['#7f9ad8', '#b8c8ec', '#e4e4e4', P.white],
  smoke: ['#3a3650', '#55526e', '#7a7690', '#a8a2b0'],
}

/** Whether the scene is under a night sky: its sky is painted first, and says so. */
let night = false

/** Lightness spread out, so the dim lit scenes still use the whole of a ramp. */
const lift = (l: number) => Math.min(1, Math.pow(l, 0.75) * 1.1)

/** Browns and tans: earth, sand, wood. */
function brown(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r > b + 18 && r >= g
}

/** The plain pigment for a lit color: for lines, gradient stops, and everything not a field. */
function pigment(color: string, family: Family, depth: number): string {
  const l = lum(color)
  const warm = isWarm(color)
  const green = isGreen(color)
  const t = lift(l)
  const far = depth < 0.25
  switch (family) {
    case 'sky':
      return step(PIG.ultra, t)
    case 'cloud':
      if (warm && l > 0.45) return step(PIG.gold, l)
      return night ? step(PIG.smoke, 0.3 + t) : step(PIG.cloud, 0.35 + t)
    case 'air':
      return P.white
    case 'stars':
    case 'lamp':
    case 'body':
    case 'beam':
    case 'glow':
      return !warm && family === 'lamp' && l < 0.5 ? step(PIG.ultra, 0.4 + t) : step(PIG.gold, t)
    case 'life':
      return warm || l > 0.55 ? step(PIG.gold, t) : green ? step(PIG.green, t) : P.ink
    case 'fire':
      return step(PIG.fire, Math.min(1, t * 1.15))
    case 'foliage':
    case 'grass':
      return far ? step(PIG.far, t + 0.1) : step(PIG.green, warm ? 0.3 : t + 0.08)
    case 'bark':
      return step(PIG.umber, t + 0.15)
    case 'land':
      if (far) return step(PIG.far, t + 0.15)
      return green ? step(PIG.green, t + 0.1) : warm || brown(color) ? step(PIG.ochre, t + 0.1) : step(night ? PIG.ultra : PIG.stone, t + 0.15)
    case 'rock':
      if (far) return warm ? step(PIG.rose, t + 0.25) : step(PIG.far, t + 0.15)
      return warm ? step(PIG.rose, t + 0.12) : brown(color) ? step(PIG.ochre, t + 0.1) : step(PIG.stone, t + 0.2)
    case 'ground':
    case 'mark':
      return green ? step(PIG.green, t + 0.1) : warm || brown(color) ? step(PIG.ochre, t + 0.1) : step(PIG.stone, t + 0.15)
    case 'built':
      if (warm) return step(PIG.rose, t + 0.15)
      if (brown(color)) return step(PIG.ochre, t + 0.1)
      return far ? step(PIG.far, t + 0.1) : step(PIG.stone, t * 0.9 + 0.2)
    case 'glass':
    case 'water':
      return step(PIG.ultra, t + 0.15)
    case 'shadow':
      return P.ink
    default:
      return step(PIG.ultra, t)
  }
}

/** A field of ground in the pattern its pigment is laid in: flowers on grass, stipple on earth and stone. */
function field(color: string, family: Family): string {
  const t = lift(lum(color))
  const i = Math.max(0, Math.min(3, Math.floor(t * 4)))
  if (isGreen(color) || family === 'grass') return `url(#il-mead${i})`
  if (isWarm(color) || brown(color)) return `url(#il-sand${i})`
  return `url(#il-dust${i})`
}

/** Families painted without the ink line: the sky, light, air, sparks. */
const UNLINED: readonly Family[] = ['sky', 'glow', 'beam', 'stars', 'life', 'lens', 'water', 'air', 'lamp']

/** A small seeded sequence, so the same stage always comes out the same. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** The sky: ultramarine graded to the horizon, its top diapered in gold. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  const id = night ? 'il-skyn' : isWarm(low) || isWarm(stops[Math.floor(stops.length / 2)]?.color ?? '') ? 'il-skyd' : 'il-sky'
  return `<rect width="${n(sw)}" height="128" fill="url(#${id})"/><rect width="${n(sw)}" height="60" fill="url(#il-diaper)" mask="url(#il-fade)"/>`
}

/** Stars as gold six-pointed stars: every shape becomes a group of stars at its points. */
function stars(svg: string, c: Ctx): string {
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#il-star" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<ellipse\b[^>]*\/>/g, '')
    .replace(/<(path|rect|circle)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : tag === 'circle'
            ? [[/\scx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\scy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
            : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|cx|cy|r|width|height|fill|stroke|stroke-width|stroke-linecap|stroke-opacity|transform)="[^"]*"/g, '')
      return `<g${kept} fill="${P.goldL}">${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect|circle)>/g, '</g>')
}

/** The sun: a gold disc with a face, its rays straight and flaming by turns. */
function sun(cx: number, cy: number, r: number): string {
  let rays = ''
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8
    const long = i % 2 ? r * 1.55 : r * 1.9
    const w = 0.22
    const p = (ang: number, d: number) => `${n(cx + Math.cos(ang) * d)} ${n(cy + Math.sin(ang) * d)}`
    rays += i % 2 ? `M${p(a - w, r * 0.95)}L${p(a, long)}L${p(a + w, r * 0.95)}` : `M${p(a - w, r * 0.95)}Q${p(a + 0.25, r * 1.4)} ${p(a, long)}Q${p(a - 0.15, r * 1.3)} ${p(a + w, r * 0.95)}`
  }
  const e = r * 0.32
  return (
    `<path fill="url(#il-goldv)" stroke="${P.ink}" stroke-width=".4" stroke-linejoin="round" d="${rays}"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#il-sun)" stroke="${P.ink}" stroke-width=".55"/>` +
    `<path fill="none" stroke="${P.goldD}" stroke-width=".6" stroke-linecap="round" d="M${n(cx - e * 1.3)} ${n(cy - e * 0.35)}h${n(e * 0.7)}M${n(cx + e * 0.6)} ${n(cy - e * 0.35)}h${n(e * 0.7)}M${n(cx - e)} ${n(cy + e * 0.9)}q${n(e)} ${n(e * 0.7)} ${n(e * 2)} 0"/>`
  )
}

/** The moon: a crescent of silver leaf in the ink line. */
const moon = (cx: number, cy: number, r: number) =>
  `<path fill="url(#il-silver)" stroke="${P.ink}" stroke-width=".55" d="M${n(cx + r * 0.2)} ${n(cy - r)}A${n(r)} ${n(r)} 0 1 0 ${n(cx + r * 0.2)} ${n(cy + r)}A${n(r * 0.78)} ${n(r)} 0 1 1 ${n(cx + r * 0.2)} ${n(cy - r)}z"/>`

/** The Earth as a T-O map: Asia above, Europe and Africa below, a T of water, the ring of the Ocean. */
function mappa(cx: number, cy: number, r: number): string {
  const c = (dx: number, dy: number) => `${n(cx + dx)} ${n(cy + dy)}`
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${PIG.ochre[4]}"/>` +
    `<path fill="${PIG.green[4]}" d="M${c(-r, 0)}A${n(r)} ${n(r)} 0 0 1 ${c(r, 0)}z"/>` +
    `<path fill="${PIG.rose[4]}" d="M${c(0, 0)}H${n(cx - r)}A${n(r)} ${n(r)} 0 0 0 ${c(0, r)}z"/>` +
    `<path fill="none" stroke="${PIG.ultra[3]}" stroke-width="${n(r * 0.14)}" d="M${c(-r, 0)}H${n(cx + r)}M${c(0, 0)}V${n(cy + r)}"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.95)}" fill="none" stroke="${P.blue}" stroke-width="${n(r * 0.12)}"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 1.01)}" fill="none" stroke="${P.ink}" stroke-width=".6"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.07)}" fill="${P.gold}" stroke="${P.ink}" stroke-width=".3"/>`
  )
}

/** Mist as banks of lead white edged in ink, drawn once for a tile and repeated. */
function mist(svg: string, c: Ctx): string {
  const sw = c.meta.sw ?? 640
  const banks = mistBanks({ w: Math.min(MIST_TILE, sw), y: c.meta.y ?? 80, h: c.meta.h ?? 12, seed: 33, rows: (c.meta.h ?? 12) < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true })
  const art =
    `<path fill="${night ? '#c8cce4' : P.white}" fill-opacity="${c.meta.veil ? '.7' : '.88'}" stroke="${P.ink}" stroke-width=".4" stroke-linejoin="round" d="${banks.map(b => b.d).join('')}"/>` +
    `<path fill="none" stroke="${PIG.ultra[4]}" stroke-width=".35" d="${banks.map(b => b.echo).join('')}"/>`
  return `<g>${tiled(`il-mist-${Math.round(c.meta.y ?? 80)}-${Math.round(c.meta.h ?? 12)}`, art, sw)}${c.motion(svg)}</g>`
}

/** A floor of one pattern across the stretch the element covered. */
const floor = (c: Ctx, fill: string) => {
  const y = c.meta.y ?? 104
  return `<rect y="${n(y)}" width="${n(c.meta.sw ?? 640)}" height="${n(c.meta.h ?? 128 - y)}" fill="${fill}" stroke="${P.ink}" stroke-width=".5"/>`
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => {
        if (attr === 'fill' && (family === 'ground' || (family === 'grass' && depth < 0.9))) return field(color, family)
        return pigment(color, family, depth)
      },
      // A gradient of the lit scene becomes the flat pigment of its overall tone; a wash of light is not painted.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return pigment(mean.color, family, 0.5)
        if (g?.tag === 'radialGradient' && family !== 'fire' && family !== 'cloud' && family !== 'body') return 'none'
        if (mean.opacity < 0.45) return 'none'
        if (family === 'ground' || family === 'grass') return field(mean.color, family)
        return undefined
      },
      line: (family, depth) => (UNLINED.includes(family) ? '' : `stroke="${P.ink}" stroke-width="${n(0.25 + depth * 0.3)}" stroke-linejoin="round"`),
      opacity: (family, v) => (family === 'beam' ? v * 0.6 : v),
      lineless: 0.55,
      faint: 'hide',
      // Lamplight on the ground: a pool of gold.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${P.goldL}" opacity=".3"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="${P.goldL}" opacity=".45"/>`,
      redraw: {
        sky,
        stars,
        'space.milkyway': () => '',
        lens: () => '',
        glow: () => '',
        water: () => '',
        air: mist,
        beam: (svg, c) => `<g opacity=".5">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#il-ray)"')}</g>`,
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return ''
          if (c.role === 'space.earth') return mappa(cx, cy, r)
          if (c.role === 'night.moon') return moon(cx, cy, r * 1.25)
          return sun(cx, cy, r * (c.role === 'forest.sun' ? 1.5 : 1.15))
        },
        'city.street': (_svg, c) => floor(c, 'url(#il-cobble)'),
        'lab.floor': (_svg, c) => floor(c, 'url(#il-tiles)'),
        // The room's plaster becomes a hanging of cloth diapered with gold quatrefoils.
        'lab.wall': (svg, c) => c.repaint(svg.replace(/(<rect width="[\d.]+" height="[\d.]+") fill="#[0-9a-f]{6}"/, '$1 fill="#4a5a3a"')).replace(/(<rect width="[\d.]+" height="[\d.]+") fill="[^"]*"/, '$1 fill="url(#il-cloth)"'),
      },
    },
    'il',
  )
}

// ---------------------------------------------------------------- Claude

/**
 * Claude as the plate paints him: vermilion inside a fine black line, gold
 * leaf on the top faces, lead white along the front, ink eyes with a glint.
 * One path a run of faces of one pigment; the gold is one shared gradient.
 */
const hero =
  (): HeroPainter =>
  (m: Model, cx: number, floor: number) => {
    const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
    let faces = ''
    let tone = ''
    let d = ''
    for (const f of outlinedFaces(m)) {
      const t =
        f.name === 'top'
          ? 'url(#il-leaf)'
          : f.part === 'leg'
            ? f.name === 'front'
              ? P.leg
              : P.legDark
            : f.name === 'front'
              ? f.light > 0.55
                ? P.front
                : P.frontD
              : f.light > 0.35
                ? P.side
                : P.sideD
      if (t !== tone && d) {
        faces += `<path fill="${tone}" d="${d}"/>`
        d = ''
      }
      tone = t
      d += poly(f.pts, cx, floor)
    }
    if (d) faces += `<path fill="${tone}" d="${d}"/>`
    // The lead-white stroke along the body's front, a little under its top edge.
    let white = ''
    const front = m.parts.find(p => p.name === 'body')?.faces.find(f => f.name === 'front')
    if (front && front.pts.length === 4) {
      const byY = [...front.pts].sort((a, b) => a[1] - b[1])
      const [t0, t1_] = [byY[0]!, byY[1]!].sort((a, b) => a[0] - b[0]) as [[number, number], [number, number]]
      const [b0, b1] = [byY[2]!, byY[3]!].sort((a, b) => a[0] - b[0]) as [[number, number], [number, number]]
      const at = (p: [number, number], q: [number, number], k: number): [number, number] => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]
      const l = at(t0, b0, 0.16)
      const r = at(t1_, b1, 0.16)
      const a = at(l, r, 0.12)
      const b = at(l, r, 0.88)
      white = `<path stroke="${P.white}" stroke-opacity=".75" stroke-width="1.2" stroke-linecap="round" d="M${t1(a[0] + cx)} ${t1(a[1] + floor)}L${t1(b[0] + cx)} ${t1(b[1] + floor)}"/>`
    }
    const eyes = m.eyes
      .map(e =>
        e.poly
          ? `<path fill="${P.ink}" d="${poly(e.poly, cx, floor)}"/>` +
            `<circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor)}" r=".45" fill="${P.white}"/>`
          : `<path fill="none" stroke="${P.ink}" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
      )
      .join('')
    return (
      `<path fill="${P.ink}" opacity=".25" d="${poly(m.shadow, cx, floor)}"/>` +
      `<path fill="${P.front}" stroke="${P.ink}" stroke-width="1.4" stroke-linejoin="round" d="${hulls}"/>` +
      `<g stroke="${P.ink}" stroke-width=".5" stroke-linejoin="round">${faces}</g>` +
      white +
      eyes
    )
  }

// ---------------------------------------------------------------- the page around the miniature

const SERIF = "'Big Caslon', 'Hoefler Text', Baskerville, 'Libre Baskerville', 'Times New Roman', serif"

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A ground of one pigment strewn with a pattern of small marks, `w` by `h`, as a tile. */
const strewn = (id: string, w: number, h: number, base: string, marks: string) =>
  `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"><rect width="${w}" height="${h}" fill="${base}"/>${marks}</pattern>`

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(sw: number): string {
  const gold = (id: string, x2: string, y2: string) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${P.goldL}"/><stop offset=".5" stop-color="${P.gold}"/><stop offset="1" stop-color="${P.goldD}"/></linearGradient>`
  let out = gold('il-leaf', '1', '1') + gold('il-goldv', '0', '1') + gold('il-goldbar', '1', '1')
  // The meadows: a green field strewn with flowers, white, red, gold and blue, and dark tufts.
  const meadow = PIG.green.slice(1, 5)
  meadow.forEach((g, i) => {
    out += strewn(
      `il-mead${i}`,
      16,
      10,
      g,
      `<path fill="none" stroke="${PIG.green[0]}" stroke-width=".4" stroke-linecap="round" d="M2 9l.6-2M3 9l-.2-2.4M4 9l-.7-1.8M11 4.5l.5-1.8M12 4.5l-.3-2"/>` +
        `<circle cx="6" cy="3" r=".7" fill="${P.white}"/><circle cx="13" cy="8" r=".6" fill="${P.rubric}"/><circle cx="9" cy="6.5" r=".55" fill="${P.goldL}"/><circle cx="1" cy="4" r=".5" fill="${PIG.ultra[4]}"/>`,
    )
  })
  PIG.ochre.slice(1, 5).forEach((g, i) => {
    out += strewn(`il-sand${i}`, 9, 6, g, `<path fill="${PIG.ochre[0]}" fill-opacity=".55" d="M1 1h.6v.6H1zM5.5 3.5h.6v.6h-.6zM3 5h.5v.5H3zM7.6 1.2h.5v.5h-.5z"/>`)
  })
  PIG.stone.slice(1, 5).forEach((g, i) => {
    out += strewn(`il-dust${i}`, 9, 6, g, `<path fill="${PIG.stone[0]}" fill-opacity=".5" d="M1 1h.6v.6H1zM5.5 3.5h.6v.6h-.6zM3 5h.5v.5H3zM7.6 1.2h.5v.5h-.5z"/>`)
  })
  // The street in cobbles; the room's floor in tiles of two colors; its wall a cloth of gold quatrefoils.
  out += strewn('il-cobble', 8, 5, PIG.stone[2]!, `<path fill="none" stroke="${PIG.stone[0]}" stroke-width=".45" d="M0 .2H8M0 2.7H8M3 .2v2.5M7 2.7v2.3"/><path fill="${PIG.stone[3]}" d="M.6 .8h1.8v1.3H.6zM4.6 3.3h1.8v1.3H4.6z"/>`)
  out += strewn('il-tiles', 12, 6, PIG.ochre[3]!, `<path fill="${P.rubric}" fill-opacity=".85" d="M0 0h6v3H0zM6 3h6v3H6z"/><path fill="none" stroke="${P.ink}" stroke-width=".3" d="M0 0H12M0 3H12M6 0v6"/><circle cx="3" cy="4.5" r=".6" fill="${P.goldL}"/>`)
  out += strewn(
    'il-cloth',
    12,
    12,
    '#3a5a3a',
    `<path fill="${P.gold}" stroke="${P.goldD}" stroke-width=".25" d="M6 3.4a1.3 1.3 0 0 1 0 2.6a1.3 1.3 0 0 1 0-2.6zM6 6a1.3 1.3 0 0 1 0 2.6zM3.4 6a1.3 1.3 0 0 1 2.6 0zM6 6a1.3 1.3 0 0 1 2.6 0z"/>` +
      `<circle cx="0" cy="0" r=".6" fill="${P.goldL}"/><circle cx="12" cy="0" r=".6" fill="${P.goldL}"/><circle cx="0" cy="12" r=".6" fill="${P.goldL}"/><circle cx="12" cy="12" r=".6" fill="${P.goldL}"/>` +
      `<path fill="none" stroke="#2a4a2a" stroke-width=".35" d="M0 6H3M9 6H12M6 0V3M6 9V12"/>`,
  )
  // The diaper of the initial: gold dots in a lattice, each row offset by half.
  out += `<pattern id="il-diaper" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.75" cy="1.75" r=".55" fill="${P.goldL}"/><circle cx="5.25" cy="5.25" r=".55" fill="${P.goldL}"/></pattern>`
  out += `<pattern id="il-diaperb" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="${P.blue}"/><circle cx=".75" cy=".75" r=".3" fill="${P.goldL}"/><circle cx="2.25" cy="2.25" r=".3" fill="${P.goldL}"/></pattern>`
  out += `<linearGradient id="il-fadeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
  out += `<mask id="il-fade"><rect width="${n(sw)}" height="60" fill="url(#il-fadeg)"/></mask>`
  // The star, six-pointed, and the ivy sprig of the margins.
  out += `<path id="il-star" d="M0-1.6L.45-.8 1.4-.8.9 0 1.4.8.45.8 0 1.6-.45.8-1.4.8-.9 0-1.4-.8-.45-.8z"/>`
  const leaf = (x: number, y: number, fill: string, rot: number) =>
    `<path transform="translate(${x} ${y}) rotate(${rot})" fill="${fill}" stroke="${P.ink}" stroke-width=".35" d="M0-3Q3 0 0 2.4Q-3 0 0-3z"/>`
  out +=
    `<g id="il-ivy"><path fill="none" stroke="${P.ink}" stroke-width=".55" stroke-linecap="round" d="M0 0Q8 1 10 8M0 0Q1 8 8 10M5 2.2Q9 -1 12 1"/>` +
    leaf(10, 8, 'url(#il-leaf)', 150) + leaf(8, 10, P.blue, 120) + leaf(12, 1, 'url(#il-leaf)', 75) + leaf(3, 6.5, P.pink, 200) +
    `<circle cx="14" cy="5" r=".9" fill="${P.gold}" stroke="${P.ink}" stroke-width=".3"/><circle cx="5" cy="13" r=".9" fill="${P.gold}" stroke="${P.ink}" stroke-width=".3"/></g>`
  return (
    out +
    `<linearGradient id="il-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset=".45" stop-color="#3f62b8"/><stop offset=".78" stop-color="#9fb6e0"/><stop offset="1" stop-color="#e6e8e6"/></linearGradient>` +
    `<linearGradient id="il-skyd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset=".45" stop-color="#4a6cc0"/><stop offset=".75" stop-color="#c8b8d0"/><stop offset="1" stop-color="#f4d0b8"/></linearGradient>` +
    `<linearGradient id="il-skyn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101c4c"/><stop offset=".6" stop-color="#1e3480"/><stop offset="1" stop-color="#3a58a8"/></linearGradient>` +
    `<radialGradient id="il-sun"><stop offset="0" stop-color="#fbeab0"/><stop offset=".6" stop-color="${P.goldL}"/><stop offset="1" stop-color="${P.gold}"/></radialGradient>` +
    `<linearGradient id="il-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8f0"/><stop offset=".6" stop-color="#d8d6d8"/><stop offset="1" stop-color="#9a98a8"/></linearGradient>` +
    `<linearGradient id="il-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.goldL}"/><stop offset="1" stop-color="${P.goldL}" stop-opacity="0"/></linearGradient>` +
    `<filter id="il-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9 .6" numOctaves="2" seed="33"/>` +
    `<feColorMatrix values="0 0 0 0 .42  0 0 0 0 .3  0 0 0 0 .16  -1.5 0 0 0 1"/></filter>`
  )
}

export const INITIAL: Look = {
  name: 'initial',
  label: 'Illuminated Initial',
  voice: 'a scribe glossing a book of hours, c. 1410, devout and a little wry',
  cell: 'solid',
  figure: '3d',
  font: SERIF,
  charW: 5,
  caption: { fill: '#f6eed6', stroke: P.goldD, ink: P.ink, radius: 0 },
  paper: { card: '#f6eed6', ink: P.ink, kinds: { code: '#2a49a0', path: '#1f5a6a', fn: '#7a2d6a', num: P.rubric, bad: P.rubric, good: '#2f6a34', face: P.rubric } },
  inset: 6,
  titleColor: P.rubric,
  art: {
    painter: scenery,
    hero,
    sky: '#1e3a8a',
    ground: '#4a3a22',
    defs,
  },
  // The vellum's grain over the whole page.
  texture: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#il-grain)" opacity=".22"/>`,
  // The page: a vellum margin, a burnished gold bar with blue and pink blocks let into it, ink rules, ivy at the corners.
  frame: (sw, h) => {
    const bar = (attrs: string) => `<rect x="3.6" y="3.6" width="${n(sw - 7.2)}" height="${n(h - 7.2)}" fill="none" ${attrs}/>`
    return (
      `<rect x="1.2" y="1.2" width="${n(sw - 2.4)}" height="${n(h - 2.4)}" fill="none" stroke="${P.vellum}" stroke-width="2.4"/>` +
      bar(`stroke="url(#il-goldbar)" stroke-width="2.6"`) +
      bar(`stroke="${P.blue}" stroke-width="1.4" stroke-dasharray="5 21"`) +
      bar(`stroke="${P.pink}" stroke-width="1.4" stroke-dasharray="5 21" stroke-dashoffset="13"`) +
      `<rect x="2.3" y="2.3" width="${n(sw - 4.6)}" height="${n(h - 4.6)}" fill="none" stroke="${P.ink}" stroke-width=".4"/>` +
      `<rect x="4.9" y="4.9" width="${n(sw - 9.8)}" height="${n(h - 9.8)}" fill="none" stroke="${P.ink}" stroke-width=".4"/>` +
      `<use href="#il-ivy" transform="translate(${n(sw - 4)} 4) scale(-1 1)"/>` +
      `<use href="#il-ivy" transform="translate(4 ${n(h - 4)}) scale(1 -1)"/>` +
      `<use href="#il-ivy" transform="translate(${n(sw - 4)} ${n(h - 4)}) scale(-1 -1)"/>`
    )
  },
  // The chapter opens with a gilded initial: a pink letter on a blue diapered ground in a gold square, the rest rubricated, a line filler after.
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 3
    const s = 19
    const first = escape(text.slice(0, 1).toUpperCase())
    const rest = escape(text.slice(1))
    const tw = text.slice(1).length * 4.9
    const lx = x + s - 1
    const ly = y + 5
    const lw = tw + 26
    return {
      svg:
        `<rect x="${n(lx)}" y="${n(ly)}" width="${n(lw)}" height="11" fill="#f6eed6" stroke="${P.ink}" stroke-width=".5"/>` +
        `<text x="${n(lx + 3)}" y="${n(ly + 8.2)}" font-family="${SERIF}" font-size="8.6" fill="${P.rubric}">${rest}</text>` +
        `<rect x="${n(lx + tw + 6)}" y="${n(ly + 4.4)}" width="16" height="2.2" fill="${P.blue}"/>` +
        `<path stroke="${P.goldL}" stroke-width="1" stroke-dasharray="1 2" d="M${n(lx + tw + 7)} ${n(ly + 5.5)}h14"/>` +
        `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="url(#il-leaf)" stroke="${P.goldD}" stroke-width=".6"/>` +
        `<rect x="${x + 1.8}" y="${y + 1.8}" width="${s - 3.6}" height="${s - 3.6}" fill="url(#il-diaperb)"/>` +
        `<text x="${n(x + s / 2)}" y="${n(y + s - 3.6)}" text-anchor="middle" font-family="${SERIF}" font-size="15.5" font-weight="700" fill="${P.pink}" stroke="${P.white}" stroke-width=".45">${first}</text>`,
      w: lx + lw + 4,
      h: y + s + 3,
    }
  },
  bubble: {
    font: SERIF,
    size: 9,
    charW: 5,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) => {
      // A leaf of vellum framed in gold and ink, ruled faintly in red-brown under each line, a gilded wedge pointing at Claude.
      let rules = ''
      for (let b = y + 14.5; b < y + h - 2; b += 12) rules += `M${n(x + 3)} ${n(b)}H${n(x + w - 3)}`
      return (
        `<path fill="url(#il-goldv)" stroke="${P.ink}" stroke-width=".5" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
        `<rect x="${n(x - 1.4)}" y="${n(y - 1.4)}" width="${n(w + 2.8)}" height="${n(h + 2.8)}" fill="url(#il-goldbar)" stroke="${P.ink}" stroke-width=".5"/>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#f6eed6" stroke="${P.ink}" stroke-width=".4"/>` +
        (rules ? `<path stroke="#a0785a" stroke-opacity=".3" stroke-width=".4" d="${rules}"/>` : '')
      )
    },
  },
}

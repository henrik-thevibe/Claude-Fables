/**
 * Contour Map, after the gallery's "Contour Map: topographic survey"
 * (index.html, style 19, `contour`), where Clawd is an island in the Sea of
 * Context, tinted by height and ringed with contours.
 *
 * The art bible, translated from the gallery's survey sheet to the Fables' worlds:
 *
 * - The scene is a printed topographic sheet: cream paper, flat printed
 *   tints, fine brown contours, a slate coastline, and lettering in italic
 *   serif for water and spaced capitals for land. Nothing is lit. Light and
 *   shade are not painted; the cartographer's hillshade darkens the slopes
 *   turned from the light, a step at a time.
 * - The sky is the sea: the gallery's pale chart blue, scattered with its
 *   little wave marks, the coastal shallows banding paler along the horizon
 *   where the land meets it, and ripples that run out from the shore. It is
 *   labelled, as the sheet is, "Sea of Context". At night it is deep water,
 *   the same chart printed in its deeper blues, the marks in pale ink.
 * - Land and rock are hypsometric: every hill, ridge, mesa and cone is
 *   tinted by its height above the horizon, green lowland through tan to the
 *   rust of the summits, in bands, and every band edge is a contour, every
 *   fourth an index contour drawn heavier. Seen from the side, a contour is
 *   a level line, so the mesas read as strata and the cone as its terraces.
 *   Nearer masses rise from a lower datum, so boulders in front are tan, not
 *   lowland green. Each mass is edged in the slate of the coastline.
 * - Foliage is the map's woodland: a flat green tint printed with little
 *   tree rings. Grass and meadows are lowland green with marsh tufts; bark
 *   is a brown ink line. Sand is stippled ochre; bare ground, regolith and
 *   floors are a stippled grey-buff.
 * - Buildings are the built-up area: a rose tint, hatched, keyed in ink;
 *   lit windows are the chart's lights, in yellow.
 * - Glass and lakes are the gallery's lake blue, water-lined; a wet street
 *   or a polished floor shows nothing, as a map shows no reflection.
 * - Fire and lava are the geologist's flows: vermilion, orange and a yellow
 *   heart. Lamps are chart lights; a lamp's pool on the ground is a light
 *   sector, dashed arcs in the chart's magenta, and shafts of light are
 *   sectors too, dashed magenta lines.
 * - Clouds and mist are shoals: shallows tint in a dashed depth contour.
 * - The sun is a compass rose round an ochre disc, its points half ink,
 *   half paper as the gallery's north arrow is. The moon is a cream disc
 *   surveyed with crater contours; the Earth a small globe with graticule
 *   and contoured continents. Stars are triangulation stations, little
 *   triangles; motes and fireflies are spot marks.
 * - Summits that the scenes name are labelled: the volcano is "Mt. Prompt"
 *   with its spot height, as on the gallery's island.
 * - Claude is the Isle of Clawd: each face of the body is an island of its
 *   own, ringed with tint bands and contours from green shore to rust
 *   summit set high to the west, so the rings crowd on the steep side, and
 *   every shore and contour wanders as a surveyed line does, not a ruled
 *   one; the slopes turned from the light are hillshaded; arms and legs are
 *   capes in lowland green. A slate coastline runs round him and the
 *   coastal shallows lie around it in a pale blue. His eyes are lakes,
 *   blue with a dark shore; a summit triangle marks his top.
 * - The sheet has the gallery's neatline: a graduated border, ink and paper
 *   by turns, between two rules; a north arrow at the top right, a scale bar
 *   in kilotokens at the bottom right, the survey grid and the sheet's folds
 *   across the picture. The chapter is a title block in spaced capitals with
 *   its contour interval in italic, and the caption a legend box with a
 *   leader to Claude.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, num as n, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const SERIF = "'Iowan Old Style', Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif"
const SANS = "Futura, 'Avenir Next', 'Century Gothic', 'Trebuchet MS', sans-serif"

const INK = '#2a231d'
const BROWN = '#3a2614'
const WATER = '#2b5d78'
const COAST = '#35505c'
const SEA = '#a5cee0'
const SHALLOW1 = '#b9dae8'
const SHALLOW2 = '#cfe7f0'
const LAKE = '#8fc1da'
const CARD = '#fbf8ef'
const MAGENTA = '#b0407a'
/** The hypsometric tints, lowland to summit, as the gallery prints them. */
const TINT = ['#b2d199', '#c3d99c', '#d4dfa0', '#e2dfa1', '#e9d498', '#e6c58a', '#dfb27a', '#d49e6b', '#c88a5d', '#ba7752', '#ab6748', '#9b5940', '#8c4e39']
const CLINE = '#764e30'
const INDEX = '#643c22'
/** What the night chart's inks are dimmed toward. */
const NIGHT = '#1a2c40'
/** The cartographer's hillshade, and the sunlit slope, as mixes of a tint. */
const SHADE = '#4e4058'
const LIT = '#fffbea'
/** The stage's height and the top of its ground (svg.ts): the horizon, the datum heights are taken from. */
const H = 128
const HORIZON = 104
/** The band of each tint, in stage units of height. */
const BAND = 7

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false
/** Whether it is the Moon being surveyed: its heights are tinted in the greys of a lunar chart. */
let lunar = false
/** Which printing of the sheet the scene takes: the day chart, the night chart or the lunar chart, each its own ids. */
let kit = ''
/** The sheet's patterns a scene has used, so the definitions carry only those. */
const used = new Set<string>()
const url = (name: string) => {
  used.add(name)
  return `url(#cm-${kit}${name})`
}
const dim = (c: string, k = lunar ? 0.18 : 0.3) => (night ? mix(c, NIGHT, k) : c)
/** The lunar chart's heights: buff greys, pale lowland to dark summit. */
const MOON_TINT = ['#d9d3c4', '#cfc8b8', '#c6beac', '#bcb3a0', '#b2a894', '#a89d89', '#9d927e', '#928774', '#877c6a', '#7c7261', '#726858', '#685f50', '#5e5648']
const tints = () => (lunar ? MOON_TINT : TINT)

/** Hillshade steps: 0 the slope turned from the light, 1 the plain tint, 2 the sunlit slope. */
const stepOf = (color: string) => {
  const t = night ? Math.min(1, lum(color) * 2.2) : lum(color)
  return t < 0.3 ? 0 : t < 0.62 ? 1 : 2
}
const shadeTint = (c: string, k: number) => (k === 0 ? mix(c, SHADE, 0.24) : k === 2 ? mix(c, LIT, 0.22) : c)

const WOOD = ['#86b878', '#a6cf8c', '#c4e1a6'] as const
const URBAN = ['#cf9a8c', '#e7b9a8', '#f3d4c6'] as const
const BARK = ['#5e3c26', '#80563a', '#a47654'] as const
const LOW = '#c3d99c'
const SAND = '#ecd9a2'
const FLAT = '#ddd5c4'

/** Browns and tans: earth, sand, wood, unlit but warm. */
function brownish(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r > b + 18
}

/** The ground's tint, by what the lit ground was: grass, sand, or bare. */
function groundOf(color: string): 'low' | 'sand' | 'flat' {
  if (isGreen(color)) return 'low'
  if ((isWarm(color) || brownish(color)) && lum(color) > 0.3) return 'sand'
  return 'flat'
}

/** A lit color as the sheet prints it, filling a shape of the family at the depth. */
function fillOf(color: string, family: Family, depth: number): string {
  const k = stepOf(color)
  const t = lum(color)
  switch (family) {
    case 'land':
    case 'rock':
      return url(`hyp${k}${depth >= 0.6 ? 'n' : ''}`)
    case 'foliage':
      return url(`wood${k}`)
    case 'grass':
      return dim(shadeTint(LOW, k))
    case 'bark':
      return dim(BARK[k])
    case 'built':
      return url(`urb${k}`)
    case 'glass':
    case 'water':
      // What shows through glass at night: lights in the chart's yellow, a skyline in the built-up tint, the rest deep water.
      if (night && (isWarm(color) || t > 0.5)) return '#f4cf52'
      if (night && t < 0.12) return '#5a4658'
      return night ? url('deep') : url('lake')
    case 'ground':
      return url(groundOf(color))
    case 'fire':
      return t > 0.65 ? '#f6c55a' : t > 0.38 ? '#ec8236' : '#cf4426'
    case 'lamp':
      return t > 0.42 || isWarm(color) ? '#f4cf52' : dim('#6a5a50')
    case 'life':
      return isGreen(color) ? '#5f9a52' : isWarm(color) ? '#b4532a' : t > 0.55 || night ? '#f6efd8' : INK
    case 'shadow':
      return dim('#7d6f60')
    default:
      return dim(isGreen(color) ? WOOD[k] : TINT[3 + k * 2] ?? TINT[3]!)
  }
}

/** A plain color for what cannot be a pattern: a gradient's stop, currentColor. */
function plainOf(color: string, family: Family): string {
  const k = stepOf(color)
  switch (family) {
    case 'land':
    case 'rock':
      return dim(shadeTint(TINT[4]!, k))
    case 'foliage':
      return dim(WOOD[k])
    case 'built':
      return dim(URBAN[k])
    case 'glass':
    case 'water':
      return dim(LAKE, 0.3)
    case 'ground': {
      const g = groundOf(color)
      return dim(g === 'low' ? LOW : g === 'sand' ? SAND : FLAT)
    }
    default: {
      const f = fillOf(color, family, 0.5)
      return f.startsWith('url') ? dim(TINT[4]!) : f
    }
  }
}

/** The ink line of each family. */
function lineColor(family: Family): string {
  switch (family) {
    case 'land':
    case 'rock':
    case 'ground':
      return COAST
    case 'foliage':
    case 'grass':
      return '#3d6b3e'
    case 'bark':
      return '#4a2e1c'
    case 'glass':
    case 'water':
      return WATER
    case 'fire':
      return '#7a2416'
    case 'mark':
      return '#7a5236'
    default:
      return INK
  }
}

/** Families drawn without a line of their own. */
const UNLINED: readonly Family[] = ['sky', 'body', 'stars', 'cloud', 'air', 'beam', 'glow', 'lamp', 'shadow', 'mark', 'life', 'lens', 'water']

/** A seeded sequence, so the same stage is always surveyed the same way. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** Where the sea's name is lettered, clear of the scene's own landmarks. */
const LABEL_AT: Partial<Record<string, number>> = { 'city.sky': 0.34, 'volcano.sky': 0.3, 'night.sky': 0.52 }

/** The sea: chart blue with its wave marks, the shallows along the shore, ripples running out, and its name. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  lunar = c.role === 'space.sky'
  kit = lunar ? 'm' : night ? 'n' : ''
  const s1 = night ? '#2f6584' : SHALLOW1
  const s2 = night ? '#3d7593' : SHALLOW2
  const depthLine = `fill="none" stroke="${night ? '#9cc4d8' : WATER}" stroke-opacity=".4" stroke-width=".35" stroke-dasharray="2 1.4"`
  // A ripple rises from the shore and fades, three at a time, staggered.
  let ripples = ''
  for (let i = 0; i < 3; i++)
    ripples +=
      `<g><rect y="-2" width="${n(sw)}" height="4" fill="${url('ripple')}"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0 ${HORIZON - 14};0 ${HORIZON - 52}" dur="7.5s" begin="${n(-i * 2.5)}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values=".9;0" dur="7.5s" begin="${n(-i * 2.5)}s" repeatCount="indefinite"/></g>`
  return (
    `<rect width="${n(sw)}" height="${H}" fill="${url('sea')}"/>` +
    `<rect y="${HORIZON - 22}" width="${n(sw)}" height="22" fill="${s1}"/><rect y="${HORIZON - 10}" width="${n(sw)}" height="10" fill="${s2}"/>` +
    `<path ${depthLine} d="M0 ${HORIZON - 22}H${n(sw)}M0 ${HORIZON - 10}H${n(sw)}"/>` +
    ripples +
    `<text x="${n(sw * (LABEL_AT[c.role] ?? 0.74))}" y="30" font-family="${SERIF}" font-size="7.5" font-style="italic" letter-spacing="2" text-anchor="middle" fill="${night ? '#cfe7f0' : WATER}" fill-opacity=".85">Sea of Context</text>`
  )
}

/** Stars as triangulation stations: every point of the lit starfield a small triangle, defined once. */
function stars(svg: string, c: Ctx): string {
  used.add('star')
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#cm-star" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      return `<g${kept} fill="${night ? '#f1ead7' : INK}">${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** The sun: a compass rose round an ochre disc. */
const rose = (cx: number, cy: number, r: number) =>
  used.add('rose') &&
  `<use href="#cm-rose" transform="translate(${n(cx)} ${n(cy)}) scale(${n(r / 10)})"/>`

/** The moon: a cream disc, surveyed with the contours of its craters. */
function moon(cx: number, cy: number, r: number): string {
  const ring = (x: number, y: number, rr: number) => `M${n(cx + x - rr)} ${n(cy + y)}a${n(rr)} ${n(rr * 0.85)} 0 1 0 ${n(rr * 2)} 0a${n(rr)} ${n(rr * 0.85)} 0 1 0 ${n(-rr * 2)} 0`
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 1.9)}" fill="none" stroke="#cfe7f0" stroke-opacity=".35" stroke-width=".4" stroke-dasharray="2 1.4"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="#f4ecd4" stroke="${INK}" stroke-width=".6"/>` +
    `<path fill="none" stroke="${CLINE}" stroke-opacity=".6" stroke-width=".35" d="${ring(-r * 0.3, -r * 0.2, r * 0.32)}${ring(-r * 0.3, -r * 0.2, r * 0.16)}${ring(r * 0.35, r * 0.3, r * 0.22)}${ring(r * 0.1, -r * 0.55, r * 0.12)}"/>`
  )
}

/** The Earth: a small globe, graticule over the sea, two continents in tint with a contour each. */
function globe(cx: number, cy: number, r: number): string {
  const p = (x: number, y: number) => `${n(cx + x * r)} ${n(cy + y * r)}`
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${SEA}"/>` +
    `<path fill="${TINT[1]}" stroke="${COAST}" stroke-width=".5" d="M${p(-0.62, -0.5)}Q${p(-0.2, -0.85)} ${p(0.1, -0.5)}Q${p(0.3, -0.1)} ${p(-0.05, 0.1)}Q${p(-0.15, 0.55)} ${p(-0.45, 0.4)}Q${p(-0.8, 0.05)} ${p(-0.62, -0.5)}z` +
    `M${p(0.35, 0.05)}Q${p(0.7, -0.05)} ${p(0.75, 0.35)}Q${p(0.6, 0.75)} ${p(0.3, 0.6)}Q${p(0.15, 0.3)} ${p(0.35, 0.05)}z"/>` +
    `<path fill="${TINT[5]}" stroke="${CLINE}" stroke-width=".3" d="M${p(-0.45, -0.35)}Q${p(-0.15, -0.55)} ${p(-0.05, -0.3)}Q${p(-0.15, 0)} ${p(-0.4, 0)}z"/>` +
    `<g fill="none" stroke="${WATER}" stroke-opacity=".45" stroke-width=".3"><ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r)}" ry="${n(r * 0.3)}"/>` +
    `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r * 0.45)}" ry="${n(r)}"/><path d="M${n(cx)} ${n(cy - r)}V${n(cy + r)}"/></g>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${INK}" stroke-width=".6"/>`
  )
}

/** A label pinned to a summit: the triangle, the name in italic, the spot height. */
const summit = (x: number, y: number, name: string, height: string) =>
  `<g fill="${BROWN}" stroke="${CARD}" stroke-opacity=".85" stroke-width="1.4" paint-order="stroke"><path d="M${n(x)} ${n(y - 3.2)}l-2.8 4.8h5.6z"/>` +
  `<text x="${n(x - 5)}" y="${n(y + 1.6)}" font-family="${SERIF}" font-size="6.5" font-style="italic" font-weight="700" text-anchor="end">${name}</text>` +
  `<text x="${n(x + 5)}" y="${n(y + 1.6)}" font-family="${SANS}" font-size="5" font-weight="700">${height}</text></g>`

/** Shapes redrawn as shoals: their own fills replaced with shallows, edged in a dashed depth contour. */
const shoal = (svg: string, c: Ctx, opacity: number) => {
  const fill = night ? '#4a7f9c' : SHALLOW2
  const edge = night ? '#bfdcea' : WATER
  return (
    `<g opacity="${opacity}" stroke="${edge}" stroke-opacity=".55" stroke-width=".4" stroke-dasharray="2 1.3">` +
    c.repaint(svg).replace(/\sfill="(?!none)[^"]*"/g, ` fill="${fill}"`).replace(/\s(opacity|fill-opacity)="[^"]*"/g, '').replace(/\sstroke="[^"]*"/g, '') +
    `</g>`
  )
}

const scenery = () => {
  night = false
  lunar = false
  kit = ''
  used.clear()
  return painter(
    {
      ink: (color, family, depth, attr) => (attr === 'fill' ? fillOf(color, family, depth) : attr === 'stroke' ? (family === 'life' || family === 'lamp' || family === 'fire' ? fillOf(color, family, depth) : lineColor(family)) : plainOf(color, family)),
      // A gradient of the lit scene is one printed tint in its overall tone; a wash of light is not printed.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return lineColor(family)
        if (mean.opacity < 0.5 || (g?.tag === 'radialGradient' && family !== 'fire')) return 'none'
        return fillOf(mean.color, family, family === 'ground' ? 0.5 : 0.3)
      },
      line: (family, depth) =>
        UNLINED.includes(family)
          ? ''
          : `stroke="${lineColor(family)}" stroke-width="${n(family === 'foliage' || family === 'grass' ? 0.2 + depth * 0.25 : 0.3 + depth * 0.45)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: 'hide',
      templateFamily: 'foliage',
      // A lamp's pool is a light sector: dashed magenta arcs about the lamp's foot.
      pool: e =>
        `<g fill="none" stroke="${MAGENTA}" stroke-width=".45" stroke-dasharray="2.2 1.2"><ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.9)}" ry="${n(e.ry * 0.9)}" stroke-opacity=".7"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" stroke-opacity=".9"/></g>`,
      redraw: {
        sky,
        stars,
        'space.milkyway': () => '',
        lens: () => '',
        glow: () => '',
        water: () => '',
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return ''
          if (c.role === 'space.earth') return globe(cx, cy, r)
          if (c.role === 'night.moon') return moon(cx, cy, r * 1.2)
          return rose(cx, cy, r * 1.4)
        },
        cloud: (svg, c) => shoal(svg, c, 0.9),
        air: (svg, c) => shoal(svg, c, 0.5),
        // Shafts of light are light sectors: dashed magenta lines, no wash.
        beam: (svg, c) =>
          `<g fill="none" stroke="${MAGENTA}" stroke-opacity=".5" stroke-width=".4" stroke-dasharray="3 1.6">` +
          c.repaint(svg).replace(/\sfill="[^"]*"/g, '').replace(/\s(opacity|stroke|stroke-width)="[^"]*"/g, '') +
          `</g>`,
        // The lab is surveyed at night: the night chart's inks, the window deep water.
        'lab.wall': (svg, c) => {
          night = true
          kit = 'n'
          // The wall itself is the sheet's buff; what hangs on it is the built-up area.
          return c.repaint(svg).replace(/fill="url\(#cm-nurb\d\)"/, `fill="${dim('#efe6cf', 0.18)}"`)
        },
        // The volcano's cone is Mt. Prompt, its summit labelled with its height.
        'volcano.cone': (svg, c) => c.repaint(svg) + summit((c.meta.cx ?? 0) - 16, (c.meta.cy ?? 40) - 3, 'Mt. Prompt', '1,024'),
      },
    },
    'cm',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude as the Isle of Clawd: faces ringed with tints and contours, a slate coast, shallows round him, eye lakes. */
const hero =
  (): HeroPainter =>
  (m: Model, cx: number, floor: number) => {
    const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
    // The body's faces are islands of their own, by hillshade step; arms and legs are capes in a flat lowland tint.
    let faces = ''
    for (const f of outlinedFaces(m)) faces += `<path class="cm-${f.part === 'body' ? 'f' : 'k'}${f.light > 0.6 ? 0 : f.light > 0.3 ? 1 : 2}" d="${poly(f.pts, cx, floor)}"/>`
    const eyes = m.eyes
      .map(e =>
        e.poly
          ? `<path class="cm-lk" d="${poly(e.poly, cx, floor)}"/>`
          : `<path fill="none" stroke="#24506e" stroke-width="1.1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
      )
      .join('')
    // The summit: a spot-height triangle at the middle of the body's top.
    const top = m.parts.find(p => p.name === 'body')?.faces.find(f => f.name === 'top')
    let peak = ''
    if (top) {
      const x = top.pts.reduce((a, p) => a + p[0], 0) / top.pts.length + cx
      const y = top.pts.reduce((a, p) => a + p[1], 0) / top.pts.length + floor
      peak = `<path fill="${BROWN}" d="M${t1(x)} ${t1(y - 1.5)}l-1.3 2.2h2.6z"/>`
    }
    return (
      `<path fill="${SEA}" opacity=".7" d="${poly(m.shadow, cx, floor)}"/>` +
      // The coastal shallows round him: the outline stroked wide in the shallows' blue, under the faces.
      // The land is surveyed, not ruled: the shore and every contour on it wander, by one shared filter.
      `<g filter="url(#cm-survey)"><path fill="${COAST}" stroke="${SHALLOW1}" stroke-width="4.4" stroke-linejoin="round" d="${hulls}"/>` +
      // Each face's edge is the slate coastline: at the outline it rims the island, within it marks the creases.
      `<g stroke="${COAST}" stroke-width=".55" stroke-linejoin="round">${faces}</g></g>` +
      eyes +
      peak
    )
  }

// ---------------------------------------------------------------- the sheet

/** A wavy level line across a pattern tile 64 wide, so contours read as surveyed, not ruled. */
const level = (y: number) => `M0 ${n(y)}q16 -.8 32 0t32 0`

/** The hypsometric tile: bands of tint by height above the datum, each band's edge a contour, every fourth an index. */
function hypsometric(name: string, k: number, near: boolean): string {
  const id = `cm-${kit}${name}`
  const ramp = tints()
  let out = `<rect width="64" height="${H}" fill="${dim(shadeTint(ramp[ramp.length - 1]!, k))}"/>`
  let lines = ''
  let index = ''
  for (let L = 0; L < ramp.length - 1; L++) {
    const y = H - BAND * (L + 1)
    out += `<rect y="${y}" width="64" height="${BAND}" fill="${dim(shadeTint(ramp[L]!, k))}"/>`
    if (L % 4 === 3) index += level(y)
    else lines += level(y)
  }
  // On the night chart the tints are dimmer, so the contours print darker and firmer to stay read.
  out += `<path fill="none" stroke="${night ? '#3e2716' : CLINE}" stroke-opacity="${night ? 0.8 : 0.6}" stroke-width="${night ? 0.45 : 0.35}" d="${lines}"/>`
  out += `<path fill="none" stroke="${night ? '#24140a' : INDEX}" stroke-opacity=".9" stroke-width="${night ? 0.85 : 0.7}" d="${index}"/>`
  // Far and middle masses stand on the horizon; nearer ones rise from a lower datum.
  return (
    `<pattern id="${id}" width="64" height="${H}" patternUnits="userSpaceOnUse" patternTransform="translate(0 ${HORIZON - H})">${out}</pattern>` +
    (near ? `<pattern id="${id}n" href="#${id}" patternTransform="translate(0 22)"/>` : '')
  )
}

/**
 * Claude's island: bands from green shore to rust summit, ringed with contours,
 * hillshaded by step, its summit set high and to the light. Baked into one
 * gradient per step, so each face is drawn once in every pose.
 */
function isle(id: string, k: number): string {
  const steps = [0, 1, 3, 5, 7]
  const c = (i: number) => (k === 0 ? mix(TINT[steps[i]!]!, LIT, 0.2) : k === 1 ? TINT[steps[i]!]! : mix(TINT[steps[i]!]!, SHADE, 0.14))
  const w = 0.03
  let stops = `<stop offset="0" stop-color="${c(steps.length - 1)}"/>`
  for (let i = steps.length - 1; i > 0; i--) {
    const a = n(1 - i / steps.length)
    const line = i === 2 ? INDEX : CLINE
    stops += `<stop offset="${a}" stop-color="${c(i)}"/><stop offset="${a}" stop-color="${line}"/><stop offset="${n(+a + w)}" stop-color="${line}"/><stop offset="${n(+a + w)}" stop-color="${c(i - 1)}"/>`
  }
  // The summit stands high and to the west, so the contours crowd on the steep side and open out on the gentle one.
  return `<radialGradient id="${id}" cx=".52" cy=".56" r=".72" fx=".36" fy=".32">${stops}</radialGradient>`
}

/** The compass rose, radius 10: ring and ticks, eight points half ink, half paper, an ochre disc for the sun. */
function compassRose(): string {
  let pts = ''
  let halves = ''
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2
    const R = i % 2 === 0 ? 16 : 11
    const w = i % 2 === 0 ? 2.6 : 2
    const tip = `${n(Math.cos(a) * R)} ${n(Math.sin(a) * R)}`
    const lx = Math.cos(a - Math.PI / 2) * w
    const ly = Math.sin(a - Math.PI / 2) * w
    pts += `M0 0L${n(lx)} ${n(ly)}L${tip}z`
    halves += `M0 0L${n(-lx)} ${n(-ly)}L${tip}z`
  }
  return (
    `<g id="cm-rose"><circle r="12.5" fill="${CARD}" fill-opacity=".55" stroke="${INK}" stroke-width=".5"/><circle r="11.2" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray=".4 1.36" stroke-opacity=".8"/>` +
    `<path fill="${CARD}" stroke="${INK}" stroke-width=".4" stroke-linejoin="round" d="${halves}"/><path fill="${INK}" d="${pts}"/>` +
    `<circle r="6" fill="#e9a23b" stroke="${INK}" stroke-width=".5"/><circle r="3.6" fill="none" stroke="${BROWN}" stroke-opacity=".5" stroke-width=".35"/></g>`
  )
}

/** Each of the sheet's patterns, by name, for the printing the scene takes. */
function pattern(name: string): string {
  const id = `cm-${kit}${name}`
  const k = Number(name.slice(-1)) as 0 | 1 | 2
  const tile = (w: number, h: number, fill: string, marks: string, extra = '') =>
    `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${extra}><rect width="${w}" height="${h}" fill="${fill}"/>${marks}</pattern>`
  const stipple = (dot: string) => `<path fill="${dot}" fill-opacity=".55" d="M1 1h.5v.5h-.5zM4.6 2.4h.5v.5h-.5zM2.4 4.5h.5v.5h-.5zM6 5h.5v.5h-.5z"/>`
  switch (name.replace(/\d$/, '')) {
    // Woodland: a flat green printed with little tree rings.
    case 'wood':
      return tile(9, 8, dim(WOOD[k]), `<path fill="none" stroke="${dim(mix(WOOD[k], '#1e4a26', 0.45))}" stroke-width=".35" d="M3 2.6a1 1 0 1 0 .01 0M7.5 6.6a1 1 0 1 0 .01 0"/>`)
    // The built-up area: a rose tint, hatched.
    case 'urb':
      return tile(3, 3, dim(URBAN[k]), `<path stroke="#8a4a3a" stroke-opacity=".35" stroke-width=".4" d="M0 0v3"/>`, ' patternTransform="rotate(45)"')
    case 'sand':
      return tile(7, 6, dim(SAND), stipple('#a8874a'))
    case 'flat':
      return tile(7, 6, dim(lunar ? '#cfc9bb' : FLAT), stipple('#857a68'))
    // Lowland: green with marsh tufts.
    case 'low':
      return tile(11, 8, dim(LOW), `<path stroke="#5f8a4a" stroke-opacity=".7" stroke-width=".35" d="M2 3.4v-1.2M3 3.4v-1.8M4 3.4v-1.2M7.5 7.4v-1.2M8.5 7.4v-1.8M9.5 7.4v-1.2"/>`)
    // Lakes and glass: lake blue, water-lined; deep water by night.
    case 'lake':
      return tile(12, 3, LAKE, `<path stroke="${WATER}" stroke-opacity=".35" stroke-width=".3" d="M0 1.5h12"/>`)
    case 'deep':
      return tile(12, 3, '#2a5874', `<path stroke="${SHALLOW2}" stroke-opacity=".3" stroke-width=".3" d="M0 1.5h12"/>`)
    // The sea and its wave marks.
    case 'sea':
      return tile(44, 30, night ? '#24506e' : SEA, `<path fill="none" stroke="${night ? SEA : '#346884'}" stroke-opacity=".32" stroke-width=".6" stroke-linecap="round" d="M4 8q2 -1.8 4 0t4 0M26 23q2 -1.8 4 0t4 0"/>`)
    // A ripple running out from the shore.
    case 'ripple':
      return `<pattern id="${id}" width="24" height="4" patternUnits="userSpaceOnUse" y="-2"><path fill="none" stroke="#fff" stroke-width=".6" d="M0 2q6 -1.4 12 0t12 0"/></pattern>`
    default:
      return ''
  }
}

/** The definitions the sheet draws with, laid down once under the stage: only those the scene has used. */
function defs(): string {
  let out = ''
  for (const k of [0, 1, 2] as const) {
    if (used.has(`hyp${k}`) || used.has(`hyp${k}n`)) out += hypsometric(`hyp${k}`, k, used.has(`hyp${k}n`))
    out += isle(`cm-c${k}`, k)
  }
  for (const name of used) if (!name.startsWith('hyp')) out += pattern(name)
  if (used.has('rose')) out += compassRose()
  // The surveyor's hand: a gentle wander that turns Claude's ruled rings and edges into surveyed contours and shore.
  out += `<filter id="cm-survey" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="19"/><feDisplacementMap in="SourceGraphic" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>`
  if (used.has('star')) out += `<path id="cm-star" d="M0 -1.2l1 1.7h-2z"/>`
  // Claude's faces in his island rings, his capes in flat lowland tints by step, his eyes lakes with a dark shore.
  return (
    out +
    `<style>.cm-f0{fill:url(#cm-c0)}.cm-f1{fill:url(#cm-c1)}.cm-f2{fill:url(#cm-c2)}.cm-k0{fill:${TINT[2]}}.cm-k1{fill:${TINT[1]}}.cm-k2{fill:${shadeTint(TINT[0]!, 0)}}` +
    `.cm-lk{fill:#5f9fc4;stroke:#1f4660;stroke-width:.5px}</style>`
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const CONTOUR: Look = {
  name: 'contour',
  label: 'Contour Map',
  voice: 'a surveyor annotating a topographic sheet, dry and precise',
  cell: 'solid',
  figure: '3d',
  font: SERIF,
  charW: 5.1,
  caption: { fill: CARD, stroke: INK, ink: INK, radius: 0 },
  paper: { card: CARD, ink: INK, kinds: { code: '#1f5f7a', path: '#3d6b2a', fn: '#7a3a6a', num: '#a0461e', bad: '#b3261e', good: '#2e6f2e', face: '#9b5940' } },
  inset: 7,
  titleColor: INK,
  art: {
    painter: scenery,
    hero,
    sky: SEA,
    ground: LOW,
    defs,
  },
  // The survey grid in fine blue, and the sheet's folds.
  texture: (sw, h) => {
    let grid = ''
    for (let x = 80; x < sw; x += 80) grid += `M${x} 0V${h}`
    for (let y = 32; y < h; y += 64) grid += `M0 ${y}H${sw}`
    const folds = `M${n(sw / 3)} 0V${h}M${n((sw * 2) / 3)} 0V${h}M0 ${h / 2}H${sw}`
    return (
      `<path fill="none" stroke="${WATER}" stroke-opacity=".2" stroke-width=".3" d="${grid}"/>` +
      `<path fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".9" d="${folds}"/>` +
      `<path fill="none" stroke="#4a3a2a" stroke-opacity=".12" stroke-width=".35" transform="translate(.6 .6)" d="${folds}"/>`
    )
  },
  // The neatline: a graduated border, ink and paper by turns, between rules; a north arrow; a scale bar in kilotokens.
  frame: (sw, h) => {
    const nx = sw - 20
    const sx = sw - 66
    const sy = h - 18
    let bar = ''
    for (let i = 0; i < 4; i++) bar += `<rect x="${sx + i * 12}" y="${sy}" width="12" height="2.4" fill="${i % 2 ? CARD : INK}"/>`
    return (
      `<rect x="0" y="0" width="${sw}" height="${h}" fill="none" stroke="${CARD}" stroke-width="14"/>` +
      `<g fill="none" stroke="${INK}"><rect x=".8" y=".8" width="${sw - 1.6}" height="${h - 1.6}" stroke-width=".8"/>` +
      `<rect x="2.2" y="2.2" width="${sw - 4.4}" height="${h - 4.4}" stroke-width=".3"/>` +
      `<rect x="3.6" y="3.6" width="${sw - 7.2}" height="${h - 7.2}" stroke-width="2" stroke-dasharray="8 8"/>` +
      `<rect x="5" y="5" width="${sw - 10}" height="${h - 10}" stroke-width=".3"/>` +
      `<rect x="6.6" y="6.6" width="${sw - 13.2}" height="${h - 13.2}" stroke-width=".6"/></g>` +
      // The north arrow.
      `<g stroke="${INK}" stroke-width=".5" stroke-linejoin="round"><text x="${nx}" y="17" text-anchor="middle" font-family="${SERIF}" font-size="6.5" font-weight="700" fill="${INK}" stroke="${CARD}" stroke-width="1.4" paint-order="stroke">N</text>` +
      `<path fill="${INK}" d="M${nx} 19l-3.2 15l3.2 -3.4z"/><path fill="${CARD}" d="M${nx} 19l3.2 15l-3.2 -3.4z"/></g>` +
      // The scale bar.
      `<rect x="${sx - 3}" y="${sy - 3}" width="54" height="14" fill="${CARD}" fill-opacity=".85"/>` +
      bar +
      `<rect x="${sx}" y="${sy}" width="48" height="2.4" fill="none" stroke="${INK}" stroke-width=".4"/>` +
      `<g font-family="${SANS}" font-size="3.6" font-weight="600" fill="${INK}" text-anchor="middle">${[0, 1, 2, 3, 4].map(i => `<text x="${sx + i * 12}" y="${sy + 6.6}">${i}</text>`).join('')}</g>` +
      `<text x="${sx + 24}" y="${sy + 10.4}" font-family="${SERIF}" font-size="3.8" font-style="italic" fill="#5c5148" text-anchor="middle">kilotokens</text>`
    )
  },
  // The title block: the chapter in spaced capitals, its contour interval in italic beneath.
  tag: (text, inset) => {
    const t = text.toUpperCase()
    const x = inset + 4
    const y = inset + 3
    const w = Math.max(t.length * 6.9, 66) + 10
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="19" fill="${CARD}" stroke="${INK}" stroke-width=".7"/>` +
        `<text x="${x + 5}" y="${y + 9}" font-family="${SANS}" font-size="7.4" font-weight="700" letter-spacing="1.9" fill="${INK}">${escape(t)}</text>` +
        `<text x="${x + 5}" y="${y + 15.6}" font-family="${SERIF}" font-size="4.6" font-style="italic" fill="#5c5148">Contours every 128 tokens</text>`,
      w: x + w + 4,
      h: y + 23,
    }
  },
  bubble: {
    font: SERIF,
    size: 9,
    charW: 5.1,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) => {
      // A legend box, ruled twice, and a leader from it to a benchmark ring at Claude.
      const mx = (base[0][0] + base[1][0]) / 2
      const my = (base[0][1] + base[1][1]) / 2
      return (
        `<path d="M${n(mx)} ${n(my)}L${n(tip[0])} ${n(tip[1])}" stroke="${INK}" stroke-width=".7"/>` +
        `<circle cx="${n(tip[0])}" cy="${n(tip[1])}" r="1.5" fill="${CARD}" stroke="${INK}" stroke-width=".6"/><circle cx="${n(tip[0])}" cy="${n(tip[1])}" r=".45" fill="${INK}"/>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${CARD}" stroke="${INK}" stroke-width="1"/>` +
        `<rect x="${n(x + 1.8)}" y="${n(y + 1.8)}" width="${w - 3.6}" height="${h - 3.6}" fill="none" stroke="${INK}" stroke-width=".35"/>`
      )
    },
  },
}


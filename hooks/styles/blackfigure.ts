/**
 * Black-Figure, after the gallery's "Black-Figure: Attic amphora, c. 540 BC"
 * (index.html, style 02, `blackfig`).
 *
 * The art bible, translated from the gallery's panel to the Fables' worlds:
 *
 * - The picture is a frieze on a pot. The ground of everything is the fired
 *   clay, orange and unpainted, darker toward the panel's ends where the pot
 *   turns away, with the gloss's vertical sheen down one side; wheel marks
 *   and grain show in it. The sky is that bare clay: nothing is painted there
 *   but what stands in it, and the plate's filler rosettes.
 * - Every figure is a silhouette in black slip, fired to a gloss, and drawn
 *   the black-figure way: its details are incised through the slip with a
 *   point, so they show as fine lines of clay. Where one figure stands over
 *   another the painter incises its contour, so overlapping firs, towers and
 *   boulders are parted by a clay line, not by tone; the strata of a mesa,
 *   the ribs of a cactus, the gullies of a cone, the drawers of a bench are
 *   scratched in the same way, each one stroke of the point.
 * - Two added colors are laid over the slip: a purple-red, and a white. The
 *   painter tells distance as he tells a team of horses apart: the nearest
 *   figures in full black, the middle rank in added red, the farthest in
 *   thinned slip, a brown wash the clay shows through.
 * - The sun is a disc of added red ringed by an incision, with painted rays;
 *   the moon a disc of added white, ringed; the Earth the Ionian map, a disc of
 *   land in added red within the river Ocean, its waves incised. Stars are the
 *   plate's fillers: rosettes with their petals incised, black on the bare clay
 *   by day, added white by night; the faintest a single painted dot.
 * - Clouds are thin washes of added white, smoke and ash washes of thinned
 *   slip. Mist, haze, beams of light, glows and the motes in them are not
 *   painted at all: the clay is the air and the light.
 * - Land and rock are silhouettes by rank. Foliage is black near by with its
 *   tiers incised; where it hangs in a mass, the forest's canopy and shrubs
 *   and the night's oak, it is unlined slip with the under-curve of every
 *   shaded clump incised as a scallop, as a painter scores a vine's leaves.
 *   Bark is black. Grass and ferns are fine strokes of slip, too slight to
 *   incise.
 * - The ground is the clay again, the bare band a figure stands on: its top a
 *   painted ground line, its tracks and marks painted strokes, its sunlit
 *   patches and its meadows the same plain clay.
 * - Buildings are black blocks by rank, their lit windows dots of added white.
 *   Glass is black, or the clay reserved where it is lit; the lab's window is a
 *   panel of the night's clay ruled in black, the city a black frieze along its
 *   foot, its rain painted streaks. Water and reflections are left out, as a
 *   vase leaves them.
 * - Fire and lava are added red with a white heart, their edges incised;
 *   embers and sparks are dots of added red. Lamps are dots of added white; a
 *   pool of lamplight is a reserved ellipse ringed in red.
 * - Life is small: fireflies and particles are dots, white or black by their
 *   light; a bird is a black silhouette, as the plate's fillers are. Two of
 *   the plate's own motifs carry over whole: a dazed figure's stars are its
 *   spinning rosettes, eight petals of a brighter added red round a black
 *   heart with an incised point; a sleeper's Z's are the Greek zeta, painted
 *   in slip with the slip scraped back round it.
 * - Night is told the way a vase painter tells it, by its signs, not by its
 *   dark: the clay of sky and ground is the deeper red of the pot's shadowed
 *   side, and the frame's bands with it; the far ranks are washed darker, and
 *   the rosettes are added white. The ground line is painted all the same.
 * - Claude is the gallery's: a glossy black figure painted part by part, each
 *   part's contour incised so the near arm and legs part from what is behind;
 *   his lid and arms in added red; the lid ribbed, the sides scored with three
 *   bowed strokes, the arms banded at the shoulder, the legs at ankle and knee;
 *   his eyes incised rings with a pupil of bare clay. He casts no shadow: the
 *   painted ground line is all he stands on.
 * - The panel is framed as the amphora's is: a dark border, a band of black
 *   and red tongues along the top, a meander along the bottom, and painted
 *   Greek, ΚΛΑΥΔΙΟΣ ΚΑΛΟΣ, set in the field: it stops short of a figure
 *   standing tall at the panel's end, as the lab's rack does, and its letters
 *   are ringed in clay where anything lower stands behind them. The chapter is painted on a reserved metope beside a rosette;
 *   the caption on a white-ground panel ruled in red, as on a lekythos.
 */
import type { HeroPainter } from '../hero3d'
import { type Face, type Model, type P2 } from '../clawd3d'
import { dropBlooms, lum, meanOf, num as n, poly, repaint, stripLight, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const C = {
  frame: '#1d1410',
  clay: '#cf6c36',
  /** The clay a figure stands on: the same body, a touch deeper below the ground line. */
  earth: '#c5632f',
  /** And on the pot's shadowed side, under a night sky. */
  earthN: '#a8522a',
  /** An incision: a line scratched through the slip to the clay. */
  inc: '#e39a62',
  gloss: '#150e0b',
  paint: '#1a110d',
  red: '#8c2b22',
  /** The brighter added red of the dizzy rosettes. */
  redL: '#a83b2b',
  white: '#f0e2c6',
  /** Thinned slip: a brown wash the clay shows through. */
  dilute: '#9e4a25',
  diluteN: '#5c2614',
  /** The clay on the pot's shadowed side, for night. */
  night: '#9a4422',
  /** The slip scraped back round an inscription, by day and by night. */
  scrape: '#b45a2c',
  scrapeN: '#7c351b',
  /** The eye's incised ring: the slip within it fired a shade deeper. */
  eye: '#0d0806',
}

const FONT = "'Optima', 'Candara', 'Gill Sans', 'Segoe UI', 'Trebuchet MS', sans-serif"

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false
/**
 * Where the open field ends on the right of the scene being painted: the left
 * edge of a figure standing tall at the panel's end (the lab's rack), which the
 * painted Greek stops short of, as a vase painter sets an inscription in the field.
 */
let field = Infinity
/**
 * What the frame being drawn must know of the picture it closes: whether it was
 * painted under a night sky, and where its open field ends. The panel's clay
 * (`under`) is laid in every drawing the art paints, and the frame closes it, so
 * a frame on the flat stage, with no art under it, is the day's, its field open.
 */
const OPEN = { dark: false, end: Infinity }
let closing = OPEN
/** How deep the element being painted stands, so a gradient it is filled with takes the ink of its rank. */
let depthNow = 0.5

/** The painter's rank for a figure at this depth: far in thinned slip, middle in added red, near in black. */
function rank(depth: number): string {
  if (depth < 0.2) return night ? C.diluteN : C.dilute
  if (depth < 0.4) return C.red
  return C.gloss
}

/** The clay a figure stands on, deeper under a night sky. */
const earthTone = () => (night ? C.earthN : C.earth)

/**
 * A lit color in the vase's few colors. The sky, the stars, light in the air and
 * water are redrawn outright (or left out), so they never come here.
 */
function ink(color: string, family: Family, depth: number): string {
  const l = lum(color)
  switch (family) {
    case 'life':
      return l > 0.6 ? C.white : C.paint
    case 'lamp':
      return l > 0.3 ? C.white : C.gloss
    case 'fire':
      return l > 0.8 ? C.white : C.red
    // A cloud is a wash of added white; smoke and ash a wash of thinned slip.
    case 'cloud':
      return l > 0.45 ? C.white : night ? C.diluteN : C.dilute
    case 'ground':
      return earthTone()
    case 'mark':
    case 'shadow':
      return C.paint
    case 'glass':
      return l > 0.45 ? C.clay : C.gloss
    case 'grass':
      return depth < 0.7 ? earthTone() : C.gloss
    case 'bark':
      return C.gloss
    default:
      return rank(depth)
  }
}

/** The families repainted without an incised contour: the clay, washes and dots. */
const UNLINED: readonly Family[] = ['life', 'cloud', 'ground', 'grass', 'mark', 'shadow', 'lamp']

/** The families whose drawn details are incised through the slip: a mesa's strata, a cactus's ribs, a trunk's bark, a fir's tiers. */
const INCISED: readonly Family[] = ['rock', 'land', 'bark', 'foliage']

/** A shape the lit look keeps but does not show: a black-figure painter leaves it out altogether. */
const HIDDEN = /<(?:path|rect|circle|ellipse|use)\b[^>]*\svisibility="hidden"\/>/g
/** A shape the opacity rule brings to full strength, which is any shape's own: the attribute says nothing. */
const OPAQUE = /\sopacity="1"/g

/**
 * Path data drawn as straight runs between absolute points (the firs, the ridges, the rows of
 * towers), rewritten as `poly` writes its own: each point a step from the last. The steps are
 * counted in the tenths or hundredths the points were given in, so none drifts. A path with
 * curves, arcs or steps of its own is left as it was drawn, and so is one that comes out no shorter.
 */
function runs(d: string): string {
  if (!/^[MLZz\d\s,.-]+$/.test(d)) return d
  const tokens = d.match(/[MLZz]|-?(?:\d+\.?\d*|\.\d+)/g) ?? []
  const places = Math.max(0, ...tokens.map(t => (t.includes('.') ? t.length - t.indexOf('.') - 1 : 0)))
  if (places > 2) return d
  const k = 10 ** places
  const fmt = (v: number) => {
    const s = (v / k).toFixed(places).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
    return s.replace(/^(-?)0\./, '$1.')
  }
  const pair = (x: number, y: number) => {
    const sy = fmt(y)
    return `${fmt(x)}${sy.startsWith('-') ? '' : ' '}${sy}`
  }
  let out = ''
  let cmd = ''
  let x = 0
  let y = 0
  let x0 = 0
  let y0 = 0
  // Whether the last thing written was a step, so the next step needs no letter of its own.
  let stepping = false
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i] ?? ''
    if (/[MLZz]/.test(t)) {
      cmd = t
      if (t === 'Z' || t === 'z') {
        out += 'z'
        x = x0
        y = y0
        stepping = false
      }
      continue
    }
    const px = Math.round(Number(t) * k)
    const py = Math.round(Number(tokens[++i]) * k)
    if (Number.isNaN(py)) return d
    if (cmd === 'M') {
      out += `M${pair(px, py)}`
      x0 = px
      y0 = py
      // Further points after a move are lines to them.
      cmd = 'L'
      stepping = false
    } else if (cmd === 'L') {
      const s = pair(px - x, py - y)
      out += stepping ? (s.startsWith('-') ? s : ` ${s}`) : `l${s}`
      stepping = true
    } else return d
    x = px
    y = py
  }
  return out.length < d.length ? out : d
}
/** Every path in a piece of markup, its straight runs written as steps. */
const lean = (svg: string) => svg.replace(/\sd="([^"]*)"/g, (_a, d: string) => ` d="${runs(d)}"`)

const at = (x: number, y: number) => `${n(x)} ${n(y)}`

/** A dot-rosette, the plate's filler, centred on 0 0 with radius 1: a black disc, its petals and heart incised. */
function rosette(id: string, disc: string, petal: string): string {
  let d = ''
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.3
    d += `M${at(Math.cos(a) * 0.55 - 0.15, Math.sin(a) * 0.55)}a.15 .15 0 1 0 .3 0a.15 .15 0 1 0 -.3 0`
  }
  return `<g id="${id}"><circle r="1" fill="${disc}"/><path fill="${petal}" d="${d}M-.16 0a.16 .16 0 1 0 .32 0a.16 .16 0 1 0 -.32 0"/></g>`
}

/** Where the plate's filler rosettes fall in an open sky: across the stage, and how high. */
const FILLERS = [[0.2, 30, 1.8], [0.33, 47, 1.5], [0.47, 26, 1.7], [0.61, 42, 1.5], [0.74, 24, 1.9], [0.88, 38, 1.6], [0.97, 54, 1.4]] as const

/** The sky: the bare clay with the plate's filler rosettes in it; at night, the pot's shadowed side, the stars its rosettes. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  night = lum(top) < 0.2 && lum(low) < 0.45
  const sw = c.meta.sw ?? 640
  const fillers = FILLERS.map(([x, y, r]) => `<use href="#bf-r${night ? 'w' : 'b'}" transform="translate(${n(sw * x)} ${y}) scale(${r})"/>`).join('')
  return night ? `<rect width="${n(sw)}" height="128" fill="url(#bf-nightclay)"/>${fillers}` : fillers
}

/** Stars as the plate's fillers: the faint ones a painted dot, the bright ones rosettes, black by day and white by night. */
function stars(svg: string): string {
  const tone = night ? C.white : C.paint
  const use = night ? '#bf-rw' : '#bf-rb'
  const r = night ? 2.1 : 1.7
  const ros = (d: string, k = r) =>
    [...d.matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => `<use href="${use}" transform="translate(${t1(Number(m[1]) + 0.5)} ${t1(Number(m[2]) + 0.5)}) scale(${n(k)})"/>`).join('')
  return (
    stripLight(dropBlooms(svg))
      .replace(/<path d="([^"]*)" fill="white" opacity="\.3"\/>/g, (_a, d: string) => `<path d="${d}" fill="${tone}"/>`)
      .replace(/<path d="([^"]*)" fill="white"(?: opacity="[^"]*")?\/>/g, (_a, d: string) => ros(d))
      .replace(/<path d="([^"]*)" fill="white">([\s\S]*?)<\/path>/g, (_a, d: string, anim: string) => `<g>${ros(d)}${anim}</g>`)
      // A glint with spikes: a larger rosette at its heart, the spikes painted.
      .replace(/<circle cx="([\d.-]+)" cy="([\d.-]+)" r="[^"]*" fill="white"\/>/g, (_a, x: string, y: string) => ros(`M${Number(x) - 0.5} ${Number(y) - 0.5}`, r * 1.5))
      .replace(/\sstroke="white"/g, ` stroke="${tone}"`)
  )
}

/** How wide the painted rim round a disc is. */
const DISC_RIM = 0.8

/** A disc in an added color, ringed by an incision and a painted rim: the sun, the moon. */
function disc(cx: number, cy: number, r: number, fill: string, rays: boolean): string {
  let out = ''
  if (rays) {
    let d = ''
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      const r0 = r + 2
      const r1 = r + (i % 2 ? 4.5 : 6.5)
      d += `M${at(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)}L${at(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)}`
    }
    out += `<path d="${d}" stroke="${C.paint}" stroke-width=".9" stroke-linecap="round"/>`
  }
  return (
    out +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" stroke="${C.paint}" stroke-width="${DISC_RIM}"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.68)}" fill="none" stroke="${fill === C.white ? C.red : C.inc}" stroke-width=".5"/>`
  )
}

/** The Earth as the Ionian map: a disc of land in added red, ringed by the river Ocean with its waves incised. */
function earth(cx: number, cy: number, r: number): string {
  // Even waves all round: each crest bowed outward midway between two troughs, the last closing on the first.
  const k = 14
  const rr = r * 0.84
  const ring = (a: number, k2: number) => at(cx + Math.cos(a) * rr * k2, cy + Math.sin(a) * rr * k2)
  let wave = `M${ring(0, 1)}`
  for (let i = 1; i <= k; i++) wave += `Q${ring(((i - 0.5) / k) * Math.PI * 2, 1.12)} ${ring((i / k) * Math.PI * 2, 1)}`
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${C.gloss}" stroke="${C.paint}" stroke-width=".8"/>` +
    `<path d="${wave}" fill="none" stroke="${C.inc}" stroke-width=".5"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.7)}" fill="${C.red}" stroke="${C.inc}" stroke-width=".5"/>` +
    `<path d="M${at(cx - r * 0.5, cy - r * 0.05)}h${n(r)}M${at(cx, cy - r * 0.6)}v${n(r * 1.2)}" stroke="${C.inc}" stroke-width=".45"/>`
  )
}

/** An element repainted by the general rules, its depth noted for the gradients it is filled with. */
const ranked = (svg: string, c: Ctx) => {
  depthNow = c.depth
  return c.repaint(svg)
}

/** An element painted in inks chosen by its role, its light and blooms left out, with an optional line. */
const flat = (svg: string, to: (color: string) => string, line = '') => {
  const out = repaint(stripLight(dropBlooms(svg)), { ink: color => to(color), url: () => 'none' })
  return line ? `<g ${line}>${out}</g>` : out
}

/** A path drawn as nothing but ellipses, whole or halved: clumps of leaves. */
const CLUMPS = /^(?:M[^Ma]+a[\d.]+ [\d.]+ 0 [01] 0 [\d.-]+ 0(?:a[\d.]+ [\d.]+ 0 [01] 0 [\d.-]+ 0)?z?)+$/
const PATH = /<path fill="(#[0-9a-fA-F]{3,6})"(?: opacity="[^"]*")? d="([^"]*)"\/>/g
/** A marker for the incised strokes while the rest is repainted. */
const CUT = '#bf0001'

/**
 * Foliage in a mass, the forest's canopy and the night's oak: black slip,
 * unlined, with the under-curve of every shaded clump incised as a scallop,
 * the way a vase painter scores the leaves of a vine; the highlights left out.
 */
function leafy(svg: string): string {
  const raw = stripLight(dropBlooms(svg))
  let main = 0
  for (const m of raw.matchAll(PATH)) if (CLUMPS.test(m[2] ?? '') && lum(m[1] ?? '') <= 0.6) main = Math.max(main, lum(m[1] ?? ''))
  const scored = raw.replace(PATH, (all, fill: string, d: string) =>
    CLUMPS.test(d) && lum(fill) < main - 0.02
      ? `<path fill="none" stroke="${CUT}" stroke-width=".45" d="${d.replace(/(M[^Ma]+a[\d.]+ [\d.]+ 0 [01] 0 [\d.-]+ 0)[^M]*/g, '$1')}"/>`
      : all,
  )
  return flat(scored, color => (color === CUT ? C.inc : lum(color) > 0.6 ? 'none' : C.gloss))
}

/** A dot of added white: a lamp, a lit window, a star too faint for a rosette. */
const dot = (x: number, y: number, r: number) => `M${at(x - r, y)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`

/**
 * The lab's window: a panel of the night's clay ruled in black, the city a
 * black frieze along its foot with its lights in added white, filler rosettes
 * for the stars, and the rain painted streaks running down it.
 */
function labWindow(svg: string, c: Ctx): string {
  const x = c.meta.cx ?? 0
  const y = c.meta.cy ?? 0
  const w = c.meta.sw ?? 150
  const h = c.meta.h ?? 56
  const city = /<path fill="#141a2c" d="([^"]*)"/.exec(svg)?.[1] ?? ''
  let lights = ''
  for (const m of svg.matchAll(/<path fill="#(?:f6c97a|9ad0ff)" d="([^"]*)"/g))
    for (const q of (m[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)a([\d.]+)/g)) lights += dot(Number(q[1]) + Number(q[3]), Number(q[2]), 0.55)
  const rain = (svg.match(/<path d="M[\d.]+ [\d.]+q\.6 4 0 8"[^>]*>[\s\S]*?<\/path>/g) ?? []).join('').replace(/\sstroke="[^"]*"/g, ` stroke="${C.white}"`)
  const sash = svg.slice(svg.lastIndexOf('</g>') + 4)
  const stars = [[0.12, 0.2], [0.3, 0.12], [0.55, 0.26], [0.78, 0.14], [0.92, 0.3]].map(([u, v]) => `<use href="#bf-rw" transform="translate(${n(x + w * (u ?? 0))} ${n(y + h * (v ?? 0))}) scale(1.6)"/>`).join('')
  // Named by its place, which moves with the stage's width, so two lab bands on one page keep their own.
  const glass = `bf-glass${Math.round(x)}-${Math.round(w)}`
  return (
    `<clipPath id="${glass}"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"/></clipPath>` +
    `<g clip-path="url(#${glass})"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${C.diluteN}"/>${stars}` +
    `<path fill="${C.gloss}" d="${city}"/><path fill="${C.white}" d="${lights}"/>${rain}</g>` +
    flat(sash, color => (lum(color) > 0.5 ? 'none' : C.paint))
  )
}

/** The lit look's trip stars: four-point stars, each a path from its top point. */
const TRIP_STAR = /<path d="M([\d.-]+) ([\d.-]+)l1\.5 3\.5 3\.5 1\.5[^"]*z"\/>/g
/** How far a trip star's centre lies below its top point: 3.5 down to the inner corner, 1.5 more to the side point, level with the centre. */
const STAR_DROP = 3.5 + 1.5
/** The dizzy rosette's radius: drawn one unit round (see `defs`), scaled a touch past the star's reach of 5, so it spins in the star's place. */
const DIZZY_R = 5.5
/** And a sleeper's Z's, set in type. */
const SLEEP_Z = /<text\b[^>]*>Z<\/text>/g
/** The painted zeta's id: its scraped ring takes the night's clay, so a night's zeta is named apart from a day's. */
const zeta = () => (night ? 'bf-zetan' : 'bf-zeta')

/**
 * The bits a move throws off, in the vase's inks; and the plate's own two:
 * a dazed figure's stars are the spinning rosettes of added red, a sleeper's
 * Z's the Greek zeta painted in slip, scraped round so it reads on a figure.
 */
const particles = (svg: string, c: Ctx) =>
  ranked(
    svg
      .replace(TRIP_STAR, (_a, x: string, y: string) => `<use href="#bf-dizzy" transform="translate(${x} ${Number(y) + STAR_DROP}) scale(${DIZZY_R})"/>`)
      .replace(SLEEP_Z, `<use href="#${zeta()}"/>`),
    c,
  )

/**
 * The cone's gullies, each a sliver the lit look shades, cut as one incised
 * line down its edge instead of two, so the cone stays black at a glance.
 */
const ribs = (svg: string) =>
  svg.replace(/<path fill="#1a0e12" opacity="[^"]*" d="([^"]*)"\/>/, (_a, d: string) => {
    const lines = d
      .split('M')
      .filter(Boolean)
      .map(s => {
        const p = s.replace(/z$/, '').split('L')
        return `M${p.slice(0, Math.ceil(p.length / 2)).join('L')}`
      })
    return `<path fill="none" stroke="#1a0e12" stroke-width=".3" d="${lines.join('')}"/>`
  })

/** Lines painted over a figure in slip or added red, scratched through it instead. */
const scratched = (svg: string) => svg.replace(/\sstroke="(#150e0b|#1a110d|#8c2b22)"/g, ` stroke="${C.inc}"`)

/** The painted ground line along the top of the ground a figure stands on. */
const groundLine = (y: number, sw: number) => `<path d="M-4 ${n(y)}H${n(sw + 4)}" stroke="${C.paint}" stroke-width="1.3"/>`

const scenery = (sw: number) => {
  night = false
  field = Infinity
  const p = painter(
    {
      ink: (color, family, depth, attr) => {
        if (attr === 'stroke' && (family === 'mark' || family === 'ground')) return C.paint
        // A detail drawn within a silhouette is scratched through it to the clay.
        if (attr === 'stroke' && INCISED.includes(family) && depth >= 0.2) return C.inc
        return ink(color, family, depth)
      },
      // A faint wash of light and a pool of light are the clay itself, so not painted; any other gradient is
      // one flat ink, its overall tone and the element's rank deciding. A line drawn with a gradient is
      // painted, in added red where it is fire: lava, the cracks in the plain.
      url: (_id, family, attr, g) => {
        if (attr === 'stroke') return family === 'fire' ? C.red : C.paint
        if (g && (meanOf(g).opacity < 0.5 || g.tag === 'radialGradient')) return 'none'
        return ink(g ? meanOf(g).color : '#808080', family, depthNow)
      },
      line: (family, depth) => (UNLINED.includes(family) ? '' : `stroke="${C.inc}" stroke-width="${n(0.25 + depth * 0.3)}" stroke-linejoin="round"`),
      opacity: (family, v) => (family === 'cloud' ? Math.min(0.75, v * 1.4) : v >= 0.45 ? 1 : v),
      lineless: 0.6,
      faint: 'hide',
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${C.clay}" stroke="${C.red}" stroke-width=".8"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        beam: () => '',
        air: () => '',
        water: () => '',
        // The Milky Way is light: only its dust is painted, as dots.
        'space.milkyway': svg => stars(svg.replace(/<ellipse[^>]*\/>/, '').replace(/fill="white" opacity="[^"]*"/g, 'fill="white" opacity=".3"')),
        body: (_svg, c) => {
          if (c.meta.part === 'halo') return ''
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return earth(cx, cy, r)
          // The moon is painted a size up, and hung low enough to clear the tongue band by two.
          if (c.role === 'night.moon') return disc(cx, Math.max(cy, BAND_FOOT + 2 + r * 1.2 + DISC_RIM / 2), r * 1.2, C.white, false)
          return disc(cx, cy, r * (c.role === 'forest.sun' ? 1.5 : 1.2), C.red, true)
        },
        ground: (svg, c) => ranked(svg, c) + (c.meta.y !== undefined && c.meta.part !== 'close' ? groundLine(c.meta.y + 1, c.meta.sw ?? sw) : ''),
        // The night's meadow is the ground Claude stands on: its wavy top edge is the painted ground line
        // (its sides and foot lie off the stage); the moonlit patch on it is not lined.
        'night.meadow': (svg, c) => ranked(svg, c).replace(/<path fill="([^"]+)" d="/, `<path fill="$1" stroke="${C.paint}" stroke-width="1.3" d="`),
        // The track up the hill is the same clay, its two edges painted strokes (its foot lies off the stage).
        'night.path': (svg, c) => ranked(svg, c).replace(/<path fill="([^"]+)" d="/, `<path fill="$1" stroke="${C.paint}" stroke-width=".6" stroke-linejoin="round" d="`),
        // The moon's swells are more of the ground, their crests painted lines.
        'space.swells': svg => flat(svg, color => (lum(color) > 0.55 ? 'none' : earthTone()), `stroke="${C.paint}" stroke-width=".6"`),
        // What stands on the night's red hill is black, so it does not sink into it.
        'night.trees': (svg, c) => ranked(svg, c).replaceAll(C.red, C.gloss),
        'night.cottages': (svg, c) => ranked(svg, c).replaceAll(C.red, C.gloss),
        // The cone is black, so its lava shows in added red down it; its gullies are single incised lines.
        'volcano.cone': (svg, c) => ranked(ribs(svg), c).replaceAll(C.red, C.gloss),
        land: ranked,
        rock: ranked,
        foliage: ranked,
        bark: ranked,
        grass: ranked,
        built: ranked,
        glass: ranked,
        fire: ranked,
        cloud: ranked,
        lamp: ranked,
        life: ranked,
        particles,
        mark: ranked,
        shadow: ranked,
        // The lab's wall is the bare clay, its joints and rivets painted; the lamp's wash on it is not.
        'lab.wall': svg => flat(svg.replace(/<rect\b[^>]*\/>/, ''), color => (lum(color) > 0.5 ? 'none' : C.paint)),
        'lab.window': labWindow,
        // The bench and the rack are black figures; their drawers and handles are incised.
        'lab.bench': (svg, c) => scratched(ranked(svg, c)),
        // The rack rises into the inscription's line at the panel's end, so the Greek stops short of it.
        'lab.rack': (svg, c) => {
          field = Number(/<rect x="([\d.-]+)"/.exec(svg)?.[1] ?? Infinity)
          return scratched(ranked(svg, c))
        },
        'lab.board': (svg, c) => scratched(ranked(svg, c)),
        'forest.canopy': leafy,
        'night.oak': leafy,
        // The shrubs are drawn once as templates, scored the same way there (see `defs` below): here they
        // are laid unlined, so no clump takes a contour of its own, and their highlights are left out.
        'forest.shrubs': svg => flat(svg.replace(/<use href="#sc-shrublit\d+"[^>]*\/>/g, ''), () => C.gloss),
        // Ferns are fronds of black slip, too fine to take an incised contour.
        'forest.ferns': svg => flat(svg, () => C.gloss),
        // Motes are light in the air, and the clay is the light.
        'forest.motes': () => '',
      },
    },
    'bf',
  )
  return {
    el: (role: Parameters<typeof p.el>[0], svg: string, meta?: Parameters<typeof p.el>[2]) => lean(p.el(role, svg, meta).replace(HIDDEN, '').replace(OPAQUE, '')),
    // The forest's shrub templates: black slip with the under-curves of their shaded clumps incised, as the
    // canopy's are; their highlight templates go, as the shrubs no longer use them.
    defs: (svg: string) => lean(p.defs(svg.replace(/<g id="sc-shrublit\d+">[\s\S]*?<\/g>/g, '').replace(/<g id="sc-shrub\d+">[\s\S]*?<\/g>/g, leafy))),
  }
}

// ---------------------------------------------------------------- Claude

/** A point on a face: `u` along its first edge, `v` along its last, as the gallery's `f.at`. */
function on(f: Face, u: number, v: number): P2 {
  const [a, b, c, d] = f.pts as [P2, P2, P2, P2]
  return [a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v + (a[0] - b[0] + c[0] - d[0]) * u * v, a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v + (a[1] - b[1] + c[1] - d[1]) * u * v]
}

const far = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1])
const mid = (pts: readonly P2[]): P2 => pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length] as P2, [0, 0] as P2)

/**
 * Claude in black slip, part by part in the painter's order, as the gallery
 * paints him: each box a silhouette, its contour incised so the near legs and
 * the near arm part from what stands behind them; the lid and the arms in
 * added red; the lid ribbed, the sides scored with three curved strokes, the
 * arms banded at the shoulder and the legs at the ankle and the knee; the
 * eyes incised rings with a pupil of bare clay. Every line is one path of the
 * pose's group, which carries the incision's color and width once, and no
 * fill, so a path of cuts needs no attribute but its data.
 *
 * Claude is baked in every pose a move needs, two dozen for a trip, so each
 * cut is written as `poly` writes a face: its start, then a step in tenths.
 */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const P = (pts: readonly P2[]) => poly(pts, cx, floor)
  /** A pair of numbers, the space between them dropped where a minus sign parts them. */
  const pair = (x: string, y: string) => `${x}${y.startsWith('-') ? '' : ' '}${y}`
  const xy = (q: P2) => pair(t1(q[0] + cx), t1(q[1] + floor))
  /** The step from a to b, measured between the two points as rounded to tenths, so the steps add up. */
  const T = (v: number) => Math.round(v * 10)
  const step = (a: P2, b: P2) => pair(t1((T(b[0] + cx) - T(a[0] + cx)) / 10), t1((T(b[1] + floor) - T(a[1] + floor)) / 10))
  const seg = (a: P2, b: P2) => `M${xy(a)}l${step(a, b)}`
  /** A stroke from a to b bowed toward c. */
  const bow = (a: P2, c: P2, b: P2) => `M${xy(a)}q${pair(step(a, c), step(a, b))}`
  const body = m.parts.find(p => p.name === 'body')
  const heart = body ? mid(body.hull) : ([0, -12] as P2)
  let out = ''
  for (const pt of m.parts) {
    let cuts = ''
    const cut = (f: Face, u0: number, v0: number, u1: number, v1: number) => (cuts += seg(on(f, u0, v0), on(f, u1, v1)))
    // An arm painted before the body is the far one: the body hides its bands and edges.
    const hidden = pt.name === 'arm' && body !== undefined && m.parts.indexOf(pt) < m.parts.indexOf(body)
    if (pt.name === 'arm') {
      out += `<path fill="${C.red}" d="${P(pt.hull)}"/>`
      if (!hidden) for (const f of pt.faces) {
        if (f.name === 'left' || f.name === 'right' || f.name === 'bottom') continue
        // The bands go round the arm by the shoulder: whichever end of the face lies nearer the body.
        const near = far(on(f, 0.15, 0.5), heart) < far(on(f, 0.85, 0.5), heart)
        for (const u of near ? [0.2, 0.36] : [0.8, 0.64]) cut(f, u, 0.1, u, 0.9)
      }
    } else if (pt.name === 'leg') {
      out += `<path fill="${C.gloss}" d="${P(pt.hull)}"/>`
      for (const f of pt.faces) if (f.name !== 'bottom') for (const v of [0.2, 0.58]) cut(f, 0.1, v, 0.9, v)
    } else {
      out += `<path fill="${C.gloss}" d="${P(pt.hull)}"/>`
      let red = ''
      let sheen = ''
      for (const f of pt.faces) {
        if (f.name === 'top') {
          red += P(f.pts)
          for (let k = 0; k < 7; k++) cut(f, 0.14 + k * 0.12, 0.2, 0.14 + k * 0.12, 0.8)
        } else if (f.name !== 'bottom') {
          if (f.light > 0.35) sheen += P(f.pts)
          // Three strokes down each side and the back, bowed a little as the gallery's are.
          if (f.name !== 'front') for (const u of [0.3, 0.5, 0.7]) cuts += bow(on(f, u, 0.26), on(f, u + 0.1, 0.52), on(f, u, 0.78))
        }
      }
      out += `<path fill="${C.red}" stroke="none" d="${red}"/>` + (sheen ? `<path fill="url(#bf-sheen)" stroke="none" d="${sheen}"/>` : '')
    }
    if (pt.name !== 'leg' && !hidden) for (const e of pt.edges) if (e.kind === 'crease') cuts += seg([e.a[0] + (e.b[0] - e.a[0]) * 0.05, e.a[1] + (e.b[1] - e.a[1]) * 0.05], [e.a[0] + (e.b[0] - e.a[0]) * 0.95, e.a[1] + (e.b[1] - e.a[1]) * 0.95])
    if (pt === body) {
      let rings = ''
      let pupils = ''
      let lines = ''
      for (const e of m.eyes) {
        if (e.poly) {
          // The ring is cut a little wide of the eye, an ellipse to its bounds.
          const c = mid(e.poly)
          const xs = e.poly.map(q => q[0])
          const ys = e.poly.map(q => q[1])
          const rx = ((Math.max(...xs) - Math.min(...xs)) / 2) * 1.25
          const h = Math.max(...ys) - Math.min(...ys)
          const ry = (h / 2) * 1.18
          rings += `M${t1(c[0] + cx - rx)} ${t1(c[1] + floor)}a${t1(rx)} ${t1(ry)} 0 1 0 ${t1(rx * 2)} 0a${t1(rx)} ${t1(ry)} 0 1 0 ${t1(-rx * 2)} 0`
          if (h > 1.6) pupils += `M${xy([c[0], c[1] + h * 0.08])}h0`
        } else if (e.line) lines += poly(e.line, cx, floor, false)
      }
      if (rings) out += `<path fill="${C.eye}" stroke-width=".75" d="${rings}"/>`
      // Each pupil a dot of bare clay: a stroke of no length, its round caps a disc as wide as the stroke.
      if (pupils) out += `<path stroke-width="1.8" d="${pupils}"/>`
      if (lines) out += `<path stroke-width=".9" d="${lines}"/>`
    }
    if (cuts) out += `<path d="${cuts}"/>`
  }
  // One group carries the incision: every silhouette's contour and every scored line.
  return `<g fill="none" stroke="${C.inc}" stroke-width=".55" stroke-linecap="round" stroke-linejoin="round">${out}</g>`
}

// ---------------------------------------------------------------- the pot

/** Painted Greek capitals: polylines in a box one high, after the gallery's `GLYPH`. */
const GLYPH: Record<string, { w: number; s: number[][] }> = {
  Κ: { w: 0.66, s: [[0, 0, 0, 1], [0.66, 0, 0.03, 0.56], [0.26, 0.38, 0.68, 1]] },
  Λ: { w: 0.76, s: [[0, 1, 0.38, 0, 0.76, 1]] },
  Α: { w: 0.76, s: [[0, 1, 0.38, 0, 0.76, 1], [0.16, 0.62, 0.6, 0.58]] },
  Υ: { w: 0.74, s: [[0, 0, 0.37, 0.5, 0.74, 0], [0.37, 0.5, 0.37, 1]] },
  Δ: { w: 0.78, s: [[0, 1, 0.39, 0, 0.78, 1, 0, 1]] },
  Ι: { w: 0.1, s: [[0.05, 0, 0.05, 1]] },
  Ο: { w: 0.72, s: [] },
  Σ: { w: 0.66, s: [[0.66, 0.02, 0, 0, 0.4, 0.5, 0, 1, 0.68, 0.98]] },
  Ζ: { w: 0.66, s: [[0, 0, 0.66, 0, 0, 1, 0.68, 1]] },
}

const KALOS = 'ΚΛΑΥΔΙΟΣ ΚΑΛΟΣ'

/** How wide a line of painted Greek runs, `h` high. */
const greekWidth = (text: string, h: number) => [...text].reduce((w, ch) => w + (GLYPH[ch] ? (GLYPH[ch]?.w ?? 0) * h + h * 0.38 : h * 0.5), -h * 0.38)

/**
 * A line of painted Greek from x, y (its top), `h` high: `d` its strokes, and
 * `o` the counter of each Ο, which is scraped back too where the line crosses a
 * figure, so a line behind the letter does not bar it into a Θ.
 */
function greek(text: string, x: number, y: number, h: number): { d: string; o: string } {
  let d = ''
  let o = ''
  let px = x
  for (const ch of text) {
    const g = GLYPH[ch]
    if (!g) {
      px += h * 0.5
      continue
    }
    if (ch === 'Ο') o += `M${at(px, y + h * 0.5)}a${n(h * 0.36)} ${n(h * 0.48)} 0 1 0 ${n(h * 0.72)} 0a${n(h * 0.36)} ${n(h * 0.48)} 0 1 0 ${n(-h * 0.72)} 0`
    for (const s of g.s) for (let i = 0; i < s.length; i += 2) d += `${i ? 'L' : 'M'}${at(px + (s[i] ?? 0) * h, y + (s[i + 1] ?? 0) * h)}`
    px += g.w * h + h * 0.38
  }
  return { d: d + o, o }
}

/** The meander's key, one unit, `g` a step of its grid: the gallery's ten turns and the run to the next. */
const KEY = [[0, 8], [0, 0], [8, 0], [8, 6], [4, 6], [4, 4], [6, 4], [6, 2], [2, 2], [2, 8], [10, 8]]

/** The border's inner edge, where the frame's bands start. */
const RIM = 2.5
/** Where the tongues hang from: just inside the foot of the black band, so no seam shows between them. */
const TONGUE_Y = 3.8
/** The fine rule under the tongues, and the band's foot, its lower edge: nothing in the sky rises past it. */
const BAND_RULE = { y: 15, w: 0.45 }
const BAND_FOOT = BAND_RULE.y + BAND_RULE.w / 2
/** The meander's band: its corner, measured in from the left and up from the panel's foot, and its height. */
const MEANDER = { x: 4, up: 10.3, h: 7 }

/**
 * The frame's own paint, laid down with it so a frame drawn on the flat stage
 * keeps its bands: the clay of its strips (by day and by night), the tongues,
 * the meander and the filler rosettes. The art's clay, sky and stars use them too.
 *
 * A pattern's tile is laid from its own x and y, so each band's tile is
 * registered at the corner of the strip that shows it: the tongues' from the
 * strip's top, and the meander's drawn at 0 0 in a group moved to its strip
 * (see `frame`), else a band would show the foot of one row of tiles over the
 * head of the next.
 */
const FRAME_DEFS = (() => {
  const g = 0.72
  // The key is set in from the tile's left edge by half its stroke and over, so its first upright is not
  // clipped to half its weight by the tile; a run-in from the edge carries the run on from the last key.
  const inset = 0.4
  const key = `M0 ${n(8 * g + 0.6)}` + KEY.map(([x, y]) => `L${n((x ?? 0) * g + inset)} ${n((y ?? 0) * g + 0.6)}`).join('')
  return (
    // The clay: darker toward the panel's ends, where the pot turns away.
    `<linearGradient id="bf-clay" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a9532a"/><stop offset=".1" stop-color="#c9672f"/><stop offset=".34" stop-color="#d9773d"/><stop offset=".66" stop-color="#cf6c36"/><stop offset=".9" stop-color="#bb5c2d"/><stop offset="1" stop-color="#a24f28"/></linearGradient>` +
    `<linearGradient id="bf-nightclay" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e2f18"/><stop offset=".12" stop-color="#8a3d1f"/><stop offset=".36" stop-color="#a04824"/><stop offset=".66" stop-color="#963f21"/><stop offset=".9" stop-color="#83381c"/><stop offset="1" stop-color="#6a2d17"/></linearGradient>` +
    // The tongues: black and red in turn, hanging from a black band.
    `<pattern id="bf-tongue" x="${RIM}" y="${TONGUE_Y}" width="10" height="10" patternUnits="userSpaceOnUse"><path fill="${C.paint}" d="M.8 0h3.4v6.3a1.7 1.7 0 0 1 -3.4 0z"/><path fill="${C.red}" d="M5.8 0h3.4v6.3a1.7 1.7 0 0 1 -3.4 0z"/></pattern>` +
    `<pattern id="bf-meander" width="${n(10 * g)}" height="8" patternUnits="userSpaceOnUse"><path fill="none" stroke="${C.paint}" stroke-width=".75" stroke-linecap="square" d="${key}"/></pattern>` +
    rosette('bf-rb', C.paint, C.inc) +
    rosette('bf-rw', C.white, C.red)
  )
})()

/** A sleeper's Ζ, painted: a box one high from its baseline, centred on 0. */
const ZETA = greek('Ζ', -3, -9, 9).d

/** What Claude's painter and the flourishes draw with: the gloss's sheen, the dizzy rosette, the painted zeta. */
function defs(): string {
  let petals = ''
  for (let i = 0; i < 8; i++) petals += dot(Math.cos((i * Math.PI) / 4) * 0.64, Math.sin((i * Math.PI) / 4) * 0.64, 0.33)
  return (
    `<linearGradient id="bf-sheen" x1="0" y1="0" x2=".7" y2=".8"><stop offset="0" stop-color="#ffe8d2" stop-opacity=".16"/><stop offset="1" stop-color="#ffe8d2" stop-opacity="0"/></linearGradient>` +
    // The dizzy rosette: eight petals of the brighter added red round a black heart with an incised point.
    // Its own stroke is none, so the line of the group it is laid in does not carry into it.
    `<g id="bf-dizzy" stroke="none"><path fill="${C.redL}" d="${petals}"/><circle r=".4" fill="${C.paint}"/><circle r=".13" fill="${C.inc}"/></g>` +
    // The zeta in black slip, the slip scraped back round it as round the inscription, so it reads on a figure too.
    `<g id="${zeta()}" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="${night ? C.scrapeN : C.scrape}" stroke-width="3" d="${ZETA}"/><path stroke="${C.paint}" stroke-width="1.4" d="${ZETA}"/></g>`
  )
}

/** The type's advance for each capital, in ems (Optima's, which the faces after it come near). */
const CAPS: Record<string, number> = {}
for (const [chars, w] of [['W', 1], ['M', 0.9], ['DGHNOQU&', 0.82], ['ACV', 0.68], ['BKRXYZ', 0.62], ['PT0123456789#', 0.57], ['EFLS_?', 0.52], ['IJ!-()"/', 0.36], [" .,:;'", 0.28]] as const)
  for (const ch of chars) CAPS[ch] = w

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** How far the frame's border and tongue band reach into the picture. */
const INSET = 15

export const BLACKFIGURE: Look = {
  name: 'blackfigure',
  label: 'Black-Figure',
  voice: 'an Attic vase painter labelling a heroic frieze, in terse Homeric epithets',
  cell: 'solid',
  figure: '3d',
  font: FONT,
  charW: 5.2,
  caption: { fill: C.white, stroke: C.paint, ink: C.paint, radius: 0 },
  paper: { card: C.white, ink: C.paint, kinds: { code: '#9a3f17', path: '#6e4a2a', fn: C.red, num: '#b2401f', bad: '#a3241c', good: '#56602a', face: '#b2401f' } },
  inset: INSET,
  titleColor: C.paint,
  art: {
    painter: scenery,
    hero,
    // Past the stage's edges, the clay of the sky and of the ground, deeper under a night sky
    // (read once the scenery is painted, so its sky has said whether it is night).
    get sky() {
      return night ? C.night : C.clay
    },
    get ground() {
      return earthTone()
    },
    defs,
    // The bare clay of the panel, under everything painted on it.
    under: (sw, h) => {
      closing = { dark: night, end: field }
      return `<rect width="${sw}" height="${h}" fill="url(#bf-clay)"/>`
    },
  },
  texture: (sw, h) =>
    // The grain and the wheel marks darken the clay and are lost in the slip; the gloss's vertical sheen is
    // laid over clay and slip alike.
    `<defs><filter id="bf-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9 .7" numOctaves="2" seed="202"/>` +
    `<feColorMatrix values="0 0 0 0 .32  0 0 0 0 .13  0 0 0 0 .05  -1.8 0 0 0 1.05"/></filter>` +
    `<pattern id="bf-wheel" width="${n(sw)}" height="23" patternUnits="userSpaceOnUse"><path d="M0 3.5h${n(sw)}M0 11.2h${n(sw)}M0 18.6h${n(sw)}" stroke="#5a2814" stroke-opacity=".07" stroke-width="1.1"/><path d="M0 7.4h${n(sw)}M0 15h${n(sw)}" stroke="#ffdcb4" stroke-opacity=".06" stroke-width=".8"/></pattern>` +
    `<linearGradient id="bf-glare" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffecd6" stop-opacity="0"/><stop offset=".5" stop-color="#ffecd6" stop-opacity=".13"/><stop offset="1" stop-color="#ffecd6" stop-opacity="0"/></linearGradient></defs>` +
    `<g style="mix-blend-mode:multiply"><rect width="${sw}" height="${h}" fill="url(#bf-wheel)"/><rect width="${sw}" height="${h}" filter="url(#bf-grain)" opacity=".55"/></g>` +
    `<rect x="${n(sw * 0.22)}" width="${n(sw * 0.2)}" height="${h}" fill="url(#bf-glare)"/>`,
  frame: (sw, h) => {
    // The bands' clay is the night's where the picture is; the next drawing's clay says afresh.
    const { dark, end } = closing
    closing = OPEN
    const clay = `url(#bf-${dark ? 'night' : ''}clay)`
    const scrape = dark ? C.scrapeN : C.scrape
    // The Greek runs to the border's corner, or stops short of a figure standing tall at the panel's end.
    // Where it starts is all that differs from one drawing to the next, so it names the path: two bands on
    // one page then never draw each other's inscription.
    const x0 = Math.min(sw - 8, end - 5) - greekWidth(KALOS, 6)
    const kalos = greek(KALOS, x0, 18.5, 6)
    const id = `bf-kalos${Math.round(x0 * 10)}`
    return (
      `<defs>${FRAME_DEFS}<path id="${id}" d="${kalos.d}"/></defs>` +
      `<path fill="${C.frame}" fill-rule="evenodd" d="M-2 -2H${sw + 2}V${h + 2}H-2zM${RIM} ${RIM}V${h - RIM}H${sw - RIM}V${RIM}z"/>` +
      // The tongue band along the top, on a strip of the pot's own clay, two painted lines under it.
      `<rect x="${RIM}" y="${RIM}" width="${sw - 2 * RIM}" height="12" fill="${clay}"/>` +
      `<rect x="${RIM}" y="${RIM}" width="${sw - 2 * RIM}" height="1.6" fill="${C.paint}"/>` +
      `<rect x="${RIM}" y="${TONGUE_Y}" width="${sw - 2 * RIM}" height="8.2" fill="url(#bf-tongue)"/>` +
      `<path d="M${RIM} 13.2H${sw - RIM}" stroke="${C.paint}" stroke-width="1.1"/><path d="M${RIM} ${BAND_RULE.y}H${sw - RIM}" stroke="${C.paint}" stroke-width="${BAND_RULE.w}"/>` +
      // The meander along the bottom, between two lines, on a strip of clay of its own.
      `<rect x="${RIM}" y="${h - 11.6}" width="${sw - 2 * RIM}" height="9.1" fill="${clay}"/>` +
      `<rect transform="translate(${MEANDER.x} ${h - MEANDER.up})" width="${sw - 2 * MEANDER.x}" height="${MEANDER.h}" fill="url(#bf-meander)"/>` +
      `<path d="M${RIM} ${h - 11.6}H${sw - RIM}M${RIM} ${h - 2.9}H${sw - RIM}" stroke="${C.paint}" stroke-width="1"/>` +
      // ΚΛΑΥΔΙΟΣ ΚΑΛΟΣ, painted in the field as the plate has it; where a figure stands behind, the letters are
      // ringed in the clay so they still read, as a painter scrapes the slip back round an inscription.
      `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><use href="#${id}" stroke="${scrape}" stroke-width="2"/>` +
      `<path fill="${scrape}" d="${kalos.o}"/><use href="#${id}" stroke="${C.paint}" stroke-width=".72"/></g>`
    )
  },
  tag: (text, inset) => {
    // A reserved metope ruled in black, the chapter painted in capitals beside a rosette. The metope is
    // measured capital by capital, and the line is held to that measure in whichever face is found.
    const t = text.toUpperCase()
    const x = inset - 4
    const y = inset - 1
    const tw = [...t].reduce((s, ch) => s + (CAPS[ch] ?? 0.72) * 8 + 1.3, 0)
    const w = tw + 21
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="14" fill="${C.clay}" stroke="${C.paint}" stroke-width=".9"/>` +
        `<use href="#bf-rb" transform="translate(${x + 7} ${y + 7}) scale(3.6)"/>` +
        `<text x="${x + 14}" y="${y + 10.2}" font-family="${FONT}" font-size="8" font-weight="600" letter-spacing="1.3" textLength="${n(tw)}" fill="${C.paint}">${escape(t)}</text>`,
      w: x + w + 4,
      h: y + 16,
    }
  },
  bubble: {
    font: FONT,
    size: 9,
    charW: 5.2,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A white-ground panel ruled in black slip, a painted wedge pointing to Claude.
      `<path fill="${C.paint}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${C.white}" stroke="${C.paint}" stroke-width="1.4"/>` +
      `<rect x="${n(x + 2.2)}" y="${n(y + 2.2)}" width="${w - 4.4}" height="${h - 4.4}" fill="none" stroke="${C.red}" stroke-width=".5"/>`,
  },
}

/**
 * Cubism, after the gallery's "Cubism: Synthetic, c. 1913" (index.html,
 * style 11, `cubism`), and the look's own sources: the papiers collés of
 * Braque, Picasso and Gris, pasted in Paris cafés the winter before the war.
 *
 * The art bible, translated from the gallery's plate to the Fables' worlds:
 *
 * - The medium is pasted paper and charcoal. Every mass is a flat scrap cut
 *   with scissors and laid on a cream sheet: no light is painted, only planes.
 *   The papers are the plate's: slate, sage, ochre faux-bois printed with wood
 *   grain, tan stippled with pointillist dots, a café-crème, cream newsprint
 *   with its columns of type, a grey tissue laid translucent over the rest.
 * - The scissors cut straight. Every curve the lit scenes draw is cut as a
 *   run of straight edges, every round mass as a facet, so hills, firs,
 *   clouds and boulders come out angular, as at L'Estaque.
 * - The line is charcoal: a contour round each nearer scrap, heavier as it
 *   comes forward, and the drafting hand's guide lines and arcs running across
 *   the sheet past the shapes they measure, with one heavy charcoal bar.
 * - The sky is not a gradient but a few big planes pasted edge to edge: a slate
 *   one, a sliver of cream, a faux-bois one and a stippled one, under a grey
 *   tissue square. A dawn or a sunset leans to the ochres; blue hour to the
 *   slates and the newsprint; night is the same collage in darker papers
 *   (deep slate, umber faux-bois, a stipple of slate), its guide lines drawn in
 *   chalk instead of charcoal.
 * - The sun is a disc of ochre paper cut in two and pasted back askew, its
 *   other half terracotta; the moon a cream disc half covered in stipple; the
 *   Earth a slate disc with a sage half and a band of cream. Stars are little
 *   diamonds of cream and ochre paper.
 * - Clouds are cream and grey scraps; at night and in the volcano's ash, grey
 *   and umber ones. Land is sage and slate, earth ochre and umber, rock slate
 *   or umber; foliage and grass olive and sage. Trunks are faux-bois.
 * - The ground is stippled paper: tan by day, umber or slate when dark.
 * - Buildings are a collage of every paper in the box, scrap by scrap:
 *   slate, sage, tan, faux-bois, newsprint, stipple, darker ones by night.
 * - Glass and water are slate cut flat; a reflection is a grey tissue laid
 *   over the floor. Fire and lava are terracotta and ochre scraps, lamps ochre
 *   and cream; a lamp's pool is a disc of ochre tissue.
 * - Air, mist and beams of light are translucent tissue: tilted panes of
 *   cream paper laid one over another, the scene showing through.
 * - Life and particles are chips of paper.
 * - Claude is seen from two viewpoints at once. The live view is warm terra
 *   planes (a front cut in three shards, a faux-bois top pasted askew, hatched
 *   sides) with a frontal almond eye; a seam of charcoal runs down his face,
 *   and left of it the same Claude turned to profile: a café-crème stippled
 *   plane with a sage top, his own legs and a profile eye ringed in charcoal.
 *   Charcoal construction lines run past his corners and a grey tissue lies
 *   across his top.
 * - The sheet has its grain and a thin charcoal rule; the chapter is a torn
 *   scrap of newspaper with the title as its masthead, the caption a scrap
 *   of newsprint pasted over a slate tissue, and the sheet is signed
 *   "Clawd 13" in the corner.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, type P2, outlinedFaces } from '../clawd3d'
import { hue, isGreen, isWarm, lum, meanOf, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family, Painter } from '../art/roles'
import type { Look } from '../looks'

/** The plate's papers and charcoal. */
const C = {
  cream: '#ece2c8',
  paper: '#f2ead5',
  slate: '#6c8299',
  slateD: '#566a80',
  sage: '#9aa086',
  sageD: '#7b836a',
  ochre: '#cfa257',
  ochreD: '#a87f3c',
  tan: '#dcc18e',
  umber: '#6b4a33',
  umberD: '#47311f',
  char: '#1e1b18',
  gray: '#8a8983',
  terra: '#c97250',
  terraL: '#dc8f6a',
  terraD: '#a65a3c',
  terraS: '#bd6a4a',
  bone: '#efe5cb',
  ink: '#29231f',
  cafe: '#dfc394',
}

const DIDONE = '"Didot", "Bodoni 72", "Bodoni MT", "Bodoni Moda", Georgia, serif'
const CASLON = '"Big Caslon", "Hoefler Text", "Baskerville", "Libre Baskerville", "Times New Roman", serif'

/** The papers in the box, dark to light, by what they are cut for. */
const RAMP = {
  olive: ['#2f3528', '#454d38', '#5d6650', C.sageD, C.sage, '#b5b896'],
  earth: ['#3a2a1e', C.umberD, C.umber, '#8a6440', C.ochreD, C.ochre, C.tan],
  stone: ['#2c323a', '#3e4a58', C.slateD, C.slate, '#9aa3a8', '#c9c6b8'],
  fire: ['#6a2a18', C.terraD, C.terra, '#d45a34', C.terraL, '#e8a050', '#f0d28a'],
  lamp: [C.ochreD, C.ochre, '#e8c77a', C.bone],
  cloud: ['#4a4642', '#5e5a54', C.gray, '#bdb6a4', C.bone],
  dawn: [C.terraD, C.terraL, C.tan, C.bone],
}

/**
 * Buildings are pasted from every paper in the box, scrap by scrap; a darker
 * lit tone takes a darker paper. Each set by tone, dark to pale.
 */
const COLLAGE = [
  ['#2b3138', '#3e4a58', C.umberD, '#4a4f44', 'url(#cb-woodn)', 'url(#cb-dotsk)'],
  [C.slateD, C.umber, C.gray, C.sageD, 'url(#cb-newsn)', 'url(#cb-dotsd)'],
  [C.slate, C.sage, C.tan, 'url(#cb-news)', 'url(#cb-wood)', 'url(#cb-dotsc)'],
  [C.bone, 'url(#cb-news)', C.cream, '#c9c6b8'],
]

/** Lightness spread out and lifted, so the dark scenes are cut from dark papers, never from black. */
const lift = (l: number) => Math.min(1, 0.1 + Math.pow(l, 0.8) * 1.0)

/** Browns and tans: earth, sand, wood. */
function brown(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r > b + 18 && r >= g
}

/** Blues and violets: the slate a lit color asks for even at sunset. */
const blue = (color: string) => {
  const { h, s } = hue(color)
  return s > 0.25 && h >= 170 && h < 250
}
/** Whether a lit color is cut from earth papers: it is warm, or brown, or the scene is, unless it is blue. */
const earthy = (color: string) => !blue(color) && (isWarm(color) || brown(color) || mood === 'warm')

/** The stippled paper a stretch of ground is cut from: warm or cool, light or dark. */
const dots = (color: string, t: number) => (earthy(color) ? (t < 0.38 ? 'url(#cb-dotsd)' : 'url(#cb-dots)') : t < 0.38 ? 'url(#cb-dotsk)' : 'url(#cb-dotsc)')

/** A small seeded sequence, so the same stage is always pasted the same way. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}
const hash = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// ---------------------------------------------------------------- scissors

/**
 * Cuts a path straight: every curve becomes the straight edge between its
 * ends, as scissors would cut it. Arcs are kept (a disc is cut round); the
 * path comes back in absolute coordinates.
 */
export function facet(d: string): string {
  const tok = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) ?? []
  let i = 0
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  let cmd = ''
  let out = ''
  // The last point written, in tenths, so the relative steps never drift.
  let px = 0
  let py = 0
  let lined = false
  const num = () => Number(tok[i++] ?? 0)
  const isNum = () => i < tok.length && !/^[a-zA-Z]$/.test(tok[i] ?? '')
  const pair = (a: number, b: number) => {
    const sa = t1(a)
    const sb = t1(b)
    return `${sa}${sb.startsWith('-') ? '' : ' '}${sb}`
  }
  const move = () => {
    px = Math.round(x * 10)
    py = Math.round(y * 10)
    out += `M${pair(px / 10, py / 10)}`
    lined = false
  }
  const to = (nx: number, ny: number) => {
    x = nx
    y = ny
    const qx = Math.round(x * 10)
    const qy = Math.round(y * 10)
    const step = pair((qx - px) / 10, (qy - py) / 10)
    out += lined ? (step.startsWith('-') ? step : ` ${step}`) : `l${step}`
    lined = true
    px = qx
    py = qy
  }
  while (i < tok.length) {
    if (!isNum()) cmd = tok[i++] ?? ''
    const rel = cmd === cmd.toLowerCase()
    const ox = rel ? x : 0
    const oy = rel ? y : 0
    switch (cmd.toUpperCase()) {
      case 'M': {
        x = ox + num()
        y = oy + num()
        sx = x
        sy = y
        move()
        // Further pairs after a move are lines.
        cmd = rel ? 'l' : 'L'
        break
      }
      case 'L':
        to(ox + num(), oy + num())
        break
      case 'H':
        to(ox + num(), y)
        break
      case 'V':
        to(x, oy + num())
        break
      case 'C':
        i += 4
        to(ox + num(), oy + num())
        break
      case 'S':
      case 'Q':
        i += 2
        to(ox + num(), oy + num())
        break
      case 'T':
        to(ox + num(), oy + num())
        break
      case 'A': {
        const a = [num(), num(), num(), num(), num()]
        x = ox + num()
        y = oy + num()
        out += `A${a.join(' ')} ${pair(Math.round(x * 10) / 10, Math.round(y * 10) / 10)}`
        px = Math.round(x * 10)
        py = Math.round(y * 10)
        lined = false
        break
      }
      case 'Z':
        out += 'z'
        x = sx
        y = sy
        px = Math.round(x * 10)
        py = Math.round(y * 10)
        lined = false
        break
      default:
        // Not a path command this knows: leave the path as it was.
        return d
    }
  }
  return out
}

const attr = (attrs: string, name: string) => {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(attrs)
  return m ? Number(m[1]) : undefined
}

/** A round mass cut as a facet: a hexagon round its centre, tilted a little each way. */
function hex(cx: number, cy: number, rx: number, ry: number): string {
  const k = hash(Math.round(cx * 7 + cy * 13)) * 0.5 - 0.25
  const pts: [number, number][] = []
  for (let j = 0; j < 6; j++) {
    const a = (j * Math.PI) / 3 + k
    pts.push([cx + Math.cos(a) * rx * 1.05, cy + Math.sin(a) * ry * 1.05])
  }
  return poly(pts)
}

const N = '(-?(?:\\d*\\.\\d+|\\d+\\.?))'
/** An ellipse drawn as two half arcs (a puff of smoke, a crater): `M x y a rx ry 0 1 0 dx 0 a ... z`, or the same in absolute terms. */
const OVAL = new RegExp(`M${N}[ ,]?${N}([Aa])${N}[ ,]${N}[ ,]0[ ,][01][ ,][01][ ,]?${N}[ ,]?${N}[Aa][^MmZz]*[Zz]`, 'g')

/** Every round mass cut as a facet: circles, ellipses and the paths drawn as one. */
function facetShapes(svg: string): string {
  return svg
    .replace(/<path\b([^>]*?)\sd="([^"]*)"/g, (_all, pre: string, d: string) => {
      const cut = d.replace(OVAL, (all, x: string, y: string, a: string, rx: string, ry: string, x2: string) =>
        Math.min(+rx, +ry) < 1.2 ? all : hex((+x + +x2 + (a === 'a' ? +x : 0)) / 2, +y, +rx, +ry),
      )
      return `<path${pre} d="${facet(cut)}"`
    })
    .replace(/<(circle|ellipse)\b([^>]*?)\/>/g, (all, tag: string, attrs: string) => {
      const cx = attr(attrs, 'cx') ?? 0
      const cy = attr(attrs, 'cy') ?? 0
      const rx = (tag === 'circle' ? attr(attrs, 'r') : attr(attrs, 'rx')) ?? 0
      const ry = (tag === 'circle' ? attr(attrs, 'r') : attr(attrs, 'ry')) ?? 0
      // A chip too small to show its facets stays as it is.
      if (Math.min(rx, ry) < 2.5) return all
      const rest = attrs.replace(/\s(cx|cy|r|rx|ry)="[^"]*"/g, '')
      return `<path${rest} d="${hex(cx, cy, rx, ry)}"/>`
    })
}

// ---------------------------------------------------------------- the scenery

/** What the scene's sky said it is: a dawn or sunset, blue hour, or night. */
let mood: 'warm' | 'cool' | 'night' = 'warm'
/** Each building scrap takes the next paper in the box. */
let scrap = 0

function ink(color: string, family: Family, depth: number, kind: 'fill' | 'stroke' | 'color' | 'stop-color'): string {
  const l = lum(color)
  const t = lift(l)
  const warm = isWarm(color)
  const green = isGreen(color)
  const fill = kind === 'fill'
  // Far things are cut from paler paper, one step of distance.
  const far = depth < 0.25 ? 0.1 : 0
  switch (family) {
    case 'sky':
      return step(warm ? RAMP.dawn : RAMP.stone, t)
    case 'cloud':
      return warm && l > 0.35 ? step(RAMP.dawn, t) : step(RAMP.cloud, Math.min(1, t + 0.15))
    case 'air':
    case 'beam':
    case 'glow':
    case 'body':
      return warm ? step(RAMP.lamp, t) : C.bone
    case 'stars':
      return warm ? C.ochre : C.bone
    case 'life':
      return green ? step(RAMP.olive, t + 0.2) : warm ? step(RAMP.fire, t + 0.2) : l > 0.45 ? C.bone : step(RAMP.earth, t)
    case 'fire':
      // Fire is never cut darker than terracotta.
      return step(RAMP.fire, Math.max(0.3, Math.pow(l, 0.6)))
    case 'lamp':
      return warm || l > 0.5 ? step(RAMP.lamp, l) : step(RAMP.stone, t)
    case 'foliage':
    case 'grass':
      return step(RAMP.olive, Math.min(1, t + far))
    case 'bark':
      return fill ? (t < 0.35 ? 'url(#cb-woodn)' : 'url(#cb-wood)') : step(RAMP.earth, t)
    case 'land':
      return green ? step(RAMP.olive, t + far) : earthy(color) ? step(RAMP.earth, t + far) : step(RAMP.stone, t + far)
    case 'ground':
      if (fill) return green ? step(RAMP.olive, t) : dots(color, t)
      return earthy(color) ? step(RAMP.earth, t) : step(RAMP.stone, t)
    case 'mark':
      if (kind === 'stroke') return l > 0.5 ? C.bone : C.char
      return warm || brown(color) ? step(RAMP.earth, t) : step(RAMP.stone, t)
    case 'rock': {
      // By night rock is cut from the darker papers, so fire shows against it.
      const r = t + far - (mood === 'night' ? 0.2 : 0)
      return earthy(color) ? step(RAMP.earth, r) : step(RAMP.stone, r)
    }
    case 'built': {
      if (!fill) return warm || brown(color) ? step(RAMP.earth, t) : step(RAMP.stone, t)
      const set = COLLAGE[Math.min(3, Math.floor(Math.min(1, t + far) * 4))] ?? COLLAGE[0]!
      return set[scrap++ % set.length] ?? C.slate
    }
    case 'glass':
    case 'water':
      return step(RAMP.stone, t)
    case 'shadow':
      return C.umberD
    default:
      return step(RAMP.stone, t)
  }
}

/** Families pasted without a charcoal contour: tissue, light, chips, the sky's planes. */
const UNLINED: readonly Family[] = ['sky', 'glow', 'beam', 'stars', 'life', 'lens', 'water', 'air', 'body', 'lamp']
/** Families the scissors cut straight. */
const CUT: readonly Family[] = ['land', 'rock', 'foliage', 'grass', 'cloud', 'ground', 'built', 'fire', 'bark', 'mark', 'glass', 'water', 'beam', 'lamp']

/** A polygon given as fractions of the stage's width and stage units down. */
const plane = (sw: number, pts: readonly (readonly [number, number])[], flip: boolean) => poly(pts.map(([fx, y]) => [(flip ? 1 - fx : fx) * sw, y]))

/** The sky's papers, by mood: the base sheet, then the planes pasted over it. */
const SKIES = {
  warm: { base: C.cream, a: C.slate, b: C.sage, wood: 'url(#cb-wood)', dots: 'url(#cb-dots)', sliver: C.bone, tissue: C.gray, tissueOp: 0.34, bar: C.char, guide: C.char, guideOp: 0.8 },
  cool: { base: '#a9b2b4', a: C.slateD, b: '#5d6a74', wood: 'url(#cb-news)', dots: 'url(#cb-dotsc)', sliver: C.bone, tissue: C.bone, tissueOp: 0.3, bar: C.char, guide: C.char, guideOp: 0.75 },
  night: { base: '#2c3542', a: '#3e4f63', b: '#2e3a34', wood: 'url(#cb-woodn)', dots: 'url(#cb-dotsk)', sliver: '#7a6440', tissue: C.bone, tissueOp: 0.1, bar: '#14110e', guide: '#d8ccaa', guideOp: 0.45 },
}

/** The sky: big planes of paper pasted edge to edge, a tissue square, a charcoal bar and guide lines. */
function sky(svg: string, c: Ctx): string {
  const g = c.gradient(svg)
  const stops = g?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  // The sky's overall tone says night; the tone halfway down says dawn or blue hour.
  const halfway = stops.reduce((a, b) => (Math.abs(b.offset - 0.55) < Math.abs(a.offset - 0.55) ? b : a), stops[0] ?? { offset: 0, color: top, opacity: 1 }).color
  mood = lum(g ? meanOf(g).color : top) < 0.25 ? 'night' : isWarm(halfway) || brown(halfway) ? 'warm' : 'cool'
  const S = SKIES[mood]
  // Each sky pasted its own way round, so no two scenes repeat one sheet.
  const flip = Math.round(lum(top) * 1000 + lum(low) * 100) % 2 === 1
  const P = (pts: readonly (readonly [number, number])[], fill: string, extra = '') => `<path fill="${fill}"${extra} d="${plane(sw, pts, flip)}"/>`
  const gx = (f: number) => n((flip ? 1 - f : f) * sw)
  const sq = 0.72 * sw
  return (
    `<rect width="${n(sw)}" height="128" fill="${S.base}"/>` +
    P([[0, 0], [0.27, 0], [0.25, 72], [0, 80]], S.a) +
    P([[0, 80], [0.25, 72], [0.24, 128], [0, 128]], S.b) +
    P([[0.6, 0], [1, 0], [1, 56], [0.8, 66], [0.66, 38]], S.wood) +
    P([[0.36, 0], [0.5, 0], [0.47, 42], [0.38, 50]], S.dots) +
    P([[0.27, 0], [0.31, 0], [0.29, 28], [0.265, 38]], S.sliver) +
    P([[0, 40], [0.17, 36], [0.15, 70], [0, 76]], S.a, ` opacity=".5"`) +
    `<rect x="${n((flip ? sw - sq : sq) - 26)}" y="12" width="52" height="50" fill="${S.tissue}" opacity="${S.tissueOp}" transform="rotate(7 ${n(flip ? sw - sq : sq)} 37)"/>` +
    P([[0.252, 0], [0.252 + 4 / sw, 0], [0.246 + 4 / sw, 128], [0.246, 128]], S.bar) +
    `<path fill="none" stroke="${S.guide}" stroke-opacity="${S.guideOp}" stroke-width=".45" d="M${gx(0)} 96L${gx(0.34)} 0M${gx(0.4)} 128L${gx(0.56)} 0M0 70L${n(sw)} 22M${gx(0.86)} 128L${gx(1)} 70` +
    `M${gx(0.5)} 128A${n(sw * 0.4)} ${n(sw * 0.4)} 0 0 ${flip ? 0 : 1} ${gx(0.95)} 10"/>`
  )
}

/** The sun: a disc of ochre paper cut in two and pasted back askew, its other half terracotta, a guide line through. */
function sun(c: Ctx, r: number): string {
  if (c.meta.part === 'halo') return ''
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${C.ochre}" stroke="${C.char}" stroke-width=".5"/>` +
    `<path fill="${C.terraL}" stroke="${C.char}" stroke-width=".5" d="M${n(cx + 1.2)} ${n(cy - r - 1)}a${n(r)} ${n(r)} 0 0 1 0 ${n(r * 2)}z"/>` +
    `<path stroke="${C.char}" stroke-width=".4" d="M${n(cx - r * 1.8)} ${n(cy + r * 0.9)}L${n(cx + r * 1.8)} ${n(cy - r * 0.7)}"/>`
  )
}

/** The moon: a cream disc half covered in stipple, ringed in charcoal. */
function moon(c: Ctx): string {
  if (c.meta.part === 'halo') return ''
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = (c.meta.r ?? 9) * 1.25
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${C.bone}" stroke="${C.char}" stroke-width=".5"/>` +
    `<path fill="url(#cb-dotsc)" stroke="${C.char}" stroke-width=".4" d="M${n(cx - 1)} ${n(cy - r)}a${n(r)} ${n(r)} 0 0 0 0 ${n(r * 2)}z"/>`
  )
}

/** The Earth: a slate disc with a sage half and a band of cream. */
function earth(c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 30
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${C.slate}"/>` +
    `<path fill="${C.sageD}" d="M${n(cx + r * 0.15)} ${n(cy - r * 0.99)}a${n(r)} ${n(r)} 0 0 1 0 ${n(r * 1.98)}l${n(-r * 0.3)} ${n(-r)}z"/>` +
    `<path fill="${C.bone}" opacity=".8" d="M${n(cx - r * 0.95)} ${n(cy - r * 0.15)}L${n(cx + r * 0.9)} ${n(cy - r * 0.42)}l${n(r * 0.08)} ${n(r * 0.2)}L${n(cx - r * 0.98)} ${n(cy + r * 0.08)}z"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${C.char}" stroke-width=".6"/>`
  )
}

/** Stars as little diamonds of paper: each square of light becomes one. */
function stars(svg: string, c: Ctx): string {
  return c
    .repaint(svg)
    .replace(/M([\d.-]+) ([\d.-]+)h1v1h-1z/g, (_all, x: string, y: string) => `M${x} ${t1(Number(y) - 0.4)}l.9 .9-.9.9-.9-.9z`)
}

/** Mist and haze as tissue: tilted panes of cream paper laid over one another across the band. */
function tissue(svg: string, c: Ctx): string {
  const sw = c.meta.sw ?? 640
  const y = c.meta.y ?? 80
  const h = c.meta.h ?? 14
  const rand = seeded(Math.round(y * 31 + h * 7))
  let d = ''
  for (let x = -20 + rand() * 30; x < sw + 20; x += 70 + rand() * 90) {
    const w = 50 + rand() * 70
    const top = y + rand() * h * 0.3
    const bot = y + h * (0.7 + rand() * 0.3)
    const lean = (rand() - 0.5) * 10
    d += poly([[x, top], [x + w, top + (rand() - 0.5) * 4], [x + w + lean, bot], [x + lean, bot]])
  }
  const fill = mood === 'night' ? '#b8b4a6' : C.bone
  return `<g><path fill="${fill}" opacity="${mood === 'night' ? '.22' : '.4'}" stroke="${C.char}" stroke-opacity=".25" stroke-width=".3" d="${d}"/>${c.motion(svg)}</g>`
}

const scenery = (): Painter => {
  mood = 'warm'
  scrap = 0
  const p = cutter()
  // The templates (firs, shrubs, fronds) are cut with the same scissors as the rest.
  return { el: p.el, defs: svg => facetShapes(p.defs(svg)) }
}

const cutter = () =>
  painter(
    {
      ink: (color, family, depth, kind) => ink(color, family, depth, kind),
      // A gradient of the lit scene is one flat paper in its overall tone; a faint wash is not pasted at all.
      url: (_id, family, kind, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (kind === 'stroke') return ink(mean.color, family, 0.5, 'stroke')
        if (mean.opacity < (g?.tag === 'radialGradient' ? 0.5 : 0.3)) return 'none'
        return ink(mean.color, family, 0.5, 'fill')
      },
      line: (family, depth) =>
        UNLINED.includes(family) ? '' : `stroke="${C.char}" stroke-width="${n(0.25 + depth * 0.45)}" stroke-linejoin="miter" stroke-miterlimit="3"`,
      // Paper is opaque; only the tissue is laid translucent.
      opacity: (family, v) => (family === 'water' ? v * 0.45 : family === 'beam' ? v * 0.6 : v >= 0.55 ? 1 : v),
      lineless: 0.55,
      post: (svg, family) => (CUT.includes(family) ? facetShapes(svg) : svg).replace(/\sopacity="1"/g, ''),
      // A lamp's pool of light is a disc of ochre tissue on the floor.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${C.ochre}" opacity=".3"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="#e8c77a" opacity=".4"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        air: tissue,
        // A beam of light is a long pane of cream tissue.
        beam: (svg, c) => `<g opacity=".16">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${C.bone}"`)}</g>`,
        // The Milky Way's band is light, and is not pasted; its dust is.
        'space.milkyway': (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, '')),
        'forest.sun': (_s, c) => sun(c, (c.meta.r ?? 7) * 1.6),
        'desert.sun': (_s, c) => sun(c, (c.meta.r ?? 11) * 1.3),
        'night.moon': (_s, c) => moon(c),
        'space.earth': (_s, c) => earth(c),
      },
    },
    'cb',
  )

// ---------------------------------------------------------------- Claude

/** A point on a face: `u` along its first edge, `v` along its last, as the gallery's `f.at(u, v)`. */
function at(pts: readonly P2[], u: number, v: number): P2 {
  const [a, b, c, d] = pts as [P2, P2, P2, P2]
  const top: P2 = [d[0] + (c[0] - d[0]) * u, d[1] + (c[1] - d[1]) * u]
  const bot: P2 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
  return [bot[0] + (top[0] - bot[0]) * v, bot[1] + (top[1] - bot[1]) * v]
}
const add = (p: P2, dx: number, dy: number): P2 => [p[0] + dx, p[1] + dy]
const mid = (pts: readonly P2[]): P2 => {
  const s = pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1]] as P2, [0, 0] as P2)
  return [s[0] / pts.length, s[1] / pts.length]
}

/** A shape by its box, as an ellipse: the pupil, the flat cast shadow. */
const oval = (pts: readonly P2[], fill: string, extra = '') => {
  const xs = pts.map(q => q[0])
  const ys = pts.map(q => q[1])
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = Math.min(...ys)
  const y1 = Math.max(...ys)
  return `<ellipse cx="${t1((x0 + x1) / 2 + ox)}" cy="${t1((y0 + y1) / 2 + oy)}" rx="${t1((x1 - x0) / 2)}" ry="${t1((y1 - y0) / 2)}" fill="${fill}"${extra}/>`
}
/** Where the hero being painted stands, for `oval`. */
let ox = 0
let oy = 0

/** The paper each face of the live view is cut from. */
function paperOf(part: string, name: string): string {
  // A leg is one block of dark terra, its faces parted by the charcoal edge alone.
  if (part === 'leg') return C.terraD
  if (part === 'body') return name === 'front' ? 'url(#cb-front)' : name === 'top' ? 'url(#cb-top)' : name === 'bottom' ? C.umberD : name === 'back' ? C.terraS : 'url(#cb-side)'
  // An arm is one small scrap of terra.
  return C.terra
}

/**
 * Claude seen from two viewpoints at once: the live view in warm terra
 * planes, and left of a charcoal seam down his face the same Claude turned
 * to profile, in café-crème, with a profile eye.
 */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const P = (pts: readonly P2[], close = true) => poly(pts, cx, floor, close)
  ox = cx
  oy = floor
  const body = m.parts.find(p => p.name === 'body')
  const front = body?.faces.find(f => f.name === 'front')
  // The live view's faces, a run of one paper sharing a path; the body's top pasted a little askew.
  let faces = ''
  let fill = ''
  let d = ''
  for (const f of outlinedFaces(m)) {
    const p = paperOf(f.part, f.name)
    // A gradient or pattern spans its own path's box: the body's faces each get their own.
    if (p !== fill || f.part === 'body') {
      if (d) faces += `<path fill="${fill}" d="${d}"/>`
      d = ''
    }
    fill = p
    d += f.part === 'body' && f.name === 'top' ? poly(f.pts, cx + 0.7, floor - 0.8) : P(f.pts)
  }
  if (d) faces += `<path fill="${fill}" d="${d}"/>`

  // Charcoal construction lines: the body's outline edges, run past their corners (its creases are cut by the faces' own edges).
  let lines = ''
  body?.edges.forEach((e, i) => {
    if (e.kind !== 'sil') return
    const dx = e.b[0] - e.a[0]
    const dy = e.b[1] - e.a[1]
    const L = Math.hypot(dx, dy)
    if (L < 1) return
    const ext = 1.6 + 3.4 * hash(i * 31 + 3)
    const e0 = hash(i * 7 + 3) > 0.5 ? ext : ext * 0.3
    lines += P([[e.a[0] - (dx / L) * e0, e.a[1] - (dy / L) * e0], [e.b[0] + (dx / L) * ext, e.b[1] + (dy / L) * ext]], false)
  })

  let profile = ''
  let eyes = ''
  let seam = ''
  if (front) {
    const fp = front.pts
    const fw = Math.hypot(fp[1]![0] - fp[0]![0], fp[1]![1] - fp[0]![1])
    const fh = Math.hypot(fp[3]![0] - fp[0]![0], fp[3]![1] - fp[0]![1])
    const s = fh / 9
    // The seam rides the front face between the eyes, running past its top and bottom.
    const A = at(fp, 0.42, 1)
    const B = at(fp, 0.33, 0)
    const side = (q: P2) => Math.sign((B[0] - A[0]) * (q[1] - A[1]) - (B[1] - A[1]) * (q[0] - A[0]))
    const right = side(fp[1]!)
    // The turned view: a café-crème plane receding to the left, its sage top, its own legs.
    const w = Math.max(fw * 0.62, s * 5)
    const TR = add(A, 0, s * 0.4)
    const BR = add(B, 0, s * 0.6)
    const TL = add(TR, -w, s * 0.7)
    const BL = add(BR, -w * 1.04, -s * 1.6)
    const top = [TL, TR, add(TR, -w * 0.08, -s * 1.5), add(TL, w * 0.3, -s * 1.2)]
    const legX = [0.22, 0.62]
    const legs = legX
      .map(u => {
        const q = [BL[0] + (BR[0] - BL[0]) * u, BL[1] + (BR[1] - BL[1]) * u] as P2
        const lw = s * 1.15
        return P([add(q, 0, -s * 0.4), add(q, lw, -s * 0.4), [q[0] + lw, Math.max(q[1], 0) + 0.2], [q[0], Math.max(q[1], 0) + 0.2]])
      })
      .join('')
    // The profile eye: a charcoal-ringed cream disc, holding a dot or the mode's mark.
    const pe = at([BL, BR, TR, TL], 0.3, 0.72)
    const r = Math.max(1.8, s * 0.78)
    const hidden = m.eyes.filter(e => side(mid(e.poly ?? e.line ?? [])) !== right)
    let mark = ''
    const open = hidden.find(e => e.poly)
    if (open?.poly) {
      const ys = open.poly.map(q => q[1])
      const xs = open.poly.map(q => q[0])
      const k = Math.min(1, (Math.max(...ys) - Math.min(...ys)) / Math.max(0.1, (Math.max(...xs) - Math.min(...xs)) * 1.6))
      mark = `<ellipse cx="${t1(pe[0] + cx + r * 0.1)}" cy="${t1(pe[1] + floor)}" rx="${t1(r * 0.42)}" ry="${t1(Math.max(0.25, r * 0.6 * k))}" fill="${C.char}"/>`
    } else {
      // A line eye (happy, closed, dizzy) set into the disc, drawn smaller.
      mark = hidden
        .filter(e => e.line)
        .map(e => {
          const c0 = mid(e.line!)
          return `<path fill="none" stroke="${C.char}" stroke-width=".55" d="${P(e.line!.map(q => [pe[0] + (q[0] - c0[0]) * 0.75, pe[1] + (q[1] - c0[1]) * 0.75] as P2), false)}"/>`
        })
        .join('')
    }
    profile =
      `<path fill="url(#cb-cafe)" d="${P([BL, BR, TR, TL])}"/>` +
      `<path fill="url(#cb-sagedot)" d="${P(top)}"/>` +
      `<path fill="${C.umber}" d="${legs}"/>` +
      `<circle cx="${t1(pe[0] + cx)}" cy="${t1(pe[1] + floor)}" r="${t1(r)}" fill="${C.bone}" stroke="${C.char}" stroke-width=".7"/>` +
      mark
    // The frontal eyes right of the seam: a cream almond round the pupil, a cream glint; line eyes cut angular in charcoal.
    const ux: P2 = [(fp[1]![0] - fp[0]![0]) / 12, (fp[1]![1] - fp[0]![1]) / 12]
    const uy: P2 = [(fp[3]![0] - fp[0]![0]) / 9, (fp[3]![1] - fp[0]![1]) / 9]
    const E = (c0: P2, dx: number, dy: number): P2 => [c0[0] + ux[0] * dx + uy[0] * dy, c0[1] + ux[1] * dx + uy[1] * dy]
    for (const e of m.eyes) {
      if (hidden.includes(e)) continue
      if (e.poly) {
        const c0 = mid(e.poly)
        const al: P2[] = []
        // An almond cut with scissors: four straight edges above, three below.
        for (let i = 0; i <= 4; i++) {
          const u = -1 + i / 2
          al.push(E(c0, 1.7 * u, 1.25 * (1 - u * u)))
        }
        for (let i = 3; i > 0; i--) {
          const u = -1 + i / 2
          al.push(E(c0, 1.7 * u, -1.1 * (1 - u * u)))
        }
        eyes +=
          `<path fill="${C.bone}" stroke="${C.char}" stroke-width=".55" d="${P(al)}"/>` +
          oval(e.poly, C.char) +
          `<circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor)}" r=".4" fill="${C.bone}"/>`
      } else if (e.line) eyes += `<path fill="none" stroke="${C.char}" stroke-width=".9" d="${P(e.line, false)}"/>`
    }
    // The seam itself: a heavy charcoal cut; a grey tissue laid across the top.
    const dA: P2 = [A[0] + (A[0] - B[0]) * 0.12, A[1] + (A[1] - B[1]) * 0.12]
    const dB: P2 = [B[0] + (B[0] - A[0]) * 0.1, B[1] + (B[1] - A[1]) * 0.1]
    seam = `<path stroke="${C.char}" stroke-width="1.1" d="${P([dA, dB], false)}"/>`
  } else {
    eyes = m.eyes.map(e => (e.poly ? oval(e.poly, C.char) : `<path fill="none" stroke="${C.char}" stroke-width=".9" d="${P(e.line ?? [], false)}"/>`)).join('')
  }
  const tp = body?.faces.find(f => f.name === 'top')?.pts
  const tissue = tp ? `<path fill="${C.slate}" opacity=".38" d="${P([at(tp, 0.5, -0.4), at(tp, 1.25, -0.4), at(tp, 1.25, 1.6), at(tp, 0.5, 1.6)].map(q => add(q, 0.5, -1.2)))}"/>` : ''
  return (
    oval(m.shadow, C.umberD, ' opacity=".3"') +
    `<g stroke="${C.char}" stroke-width=".3" stroke-linejoin="miter">${faces}</g>` +
    profile +
    eyes +
    seam +
    tissue +
    `<path fill="none" stroke="${C.char}" stroke-width=".55" d="${lines}"/>`
  )
}

// ---------------------------------------------------------------- the sheet

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A scrap's torn edge: its box, the right and bottom edges ragged. */
function torn(x: number, y: number, w: number, h: number, seed: number): string {
  const r = seeded(seed)
  const pts: [number, number][] = [[x, y]]
  for (let i = 1; i <= 6; i++) pts.push([x + (w * i) / 6, y + (r() - 0.5) * 0.8])
  for (let i = 1; i <= 3; i++) pts.push([x + w + (r() - 0.5) * 2.4, y + (h * i) / 4])
  for (let i = 6; i >= 0; i--) pts.push([x + (w * i) / 6 + (r() - 0.5) * 1.5, y + h + (r() - 0.3) * 2])
  pts.push([x + (r() - 0.5) * 0.8, y + h / 2])
  return poly(pts)
}

/** The papers the whole style is cut from, laid down once under the stage. */
function defs(): string {
  // Faux-bois as the house painter combs it: wavy grain, and two knots that never line up.
  const grain = (bg: string, line: string) =>
    `<rect width="80" height="32" fill="${bg}"/><path fill="none" stroke="${line}" stroke-width=".45" d="M0 2.5C20 1.2 40 4 80 2.5M0 6.5C24 5 50 8.6 80 6.5M0 10.5C16 12 44 9 80 10.5M0 14C30 13 50 15.6 80 14` +
    `M0 18.5C26 17 46 20.4 80 18.5M0 22.5C14 24 40 21 80 22.5M0 26.5C30 25.4 54 28 80 26.5M0 30.2C22 29 44 31.4 80 30.2"/>` +
    `<path fill="none" stroke="${line}" stroke-width=".45" d="M43 8.5a9 2.6 0 1 0 18 0a9 2.6 0 1 0-18 0M47.5 8.5a4.5 1.2 0 1 0 9 0a4.5 1.2 0 1 0-9 0M7 24.5a7 2 0 1 0 14 0a7 2 0 1 0-14 0"/>`
  const stipple = (id: string, bg: string, dot: string) =>
    `<pattern id="${id}" width="3.4" height="3.4" patternUnits="userSpaceOnUse"><rect width="3.4" height="3.4" fill="${bg}"/><circle cx="1.7" cy="1.7" r=".55" fill="${dot}"/></pattern>`
  const news = (id: string, bg: string, line: string) =>
    `<pattern id="${id}" width="26" height="6.4" patternUnits="userSpaceOnUse"><rect width="26" height="6.4" fill="${bg}"/>` +
    `<path stroke="${line}" stroke-width=".7" d="M1 1.6h4.2m1 0h3m1 0h2.4M14 1.6h3.4m1 0h5.6M1 3.4h2.6m1 0h4.6m1 0h1.8M14 3.4h6m1 0h3M1 5.2h7m1 0h3M14 5.2h2m1 0h4.4"/><path stroke="${line}" stroke-width=".25" d="M13 0v6.4"/></pattern>`
  return (
    `<pattern id="cb-wood" width="80" height="32" patternUnits="userSpaceOnUse">${grain(C.ochre, '#8a6440')}</pattern>` +
    `<pattern id="cb-woodn" width="80" height="32" patternUnits="userSpaceOnUse">${grain('#5a4030', '#2e2016')}</pattern>` +
    stipple('cb-dots', C.tan, C.umberD) +
    stipple('cb-dotsd', '#5e4634', '#b89a6a') +
    stipple('cb-dotsc', '#b9b8ae', C.slateD) +
    stipple('cb-dotsk', '#3a4552', '#7d8a98') +
    news('cb-news', C.paper, '#6b625a') +
    news('cb-newsn', '#a89c84', '#4a423a') +
    // Claude's papers: a front cut in three shards, a faux-bois top, hatched sides, the profile's stipples.
    `<linearGradient id="cb-front" x1="0" y1="1" x2="1" y2="0"><stop offset=".26" stop-color="${C.terraD}"/><stop offset=".26" stop-color="${C.terra}"/><stop offset=".7" stop-color="${C.terra}"/><stop offset=".7" stop-color="${C.terraL}"/></linearGradient>` +
    `<pattern id="cb-top" width="8" height="1.6" patternUnits="userSpaceOnUse"><rect width="8" height="1.6" fill="${C.ochre}"/><path fill="none" stroke="${C.umber}" stroke-opacity=".7" stroke-width=".3" d="M0 .8C2 .3 5 1.3 8 .8"/></pattern>` +
    `<pattern id="cb-side" width="1.5" height="1.5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="1.5" height="1.5" fill="${C.terraS}"/><path stroke="${C.umberD}" stroke-opacity=".45" stroke-width=".35" d="M0 .75h1.5"/></pattern>` +
    `<pattern id="cb-cafe" width="1.5" height="1.5" patternUnits="userSpaceOnUse"><rect width="1.5" height="1.5" fill="${C.cafe}"/><circle cx=".75" cy=".75" r=".26" fill="${C.umber}" fill-opacity=".55"/></pattern>` +
    `<pattern id="cb-sagedot" width="1.3" height="1.3" patternUnits="userSpaceOnUse"><rect width="1.3" height="1.3" fill="${C.sage}"/><circle cx=".65" cy=".65" r=".25" fill="${C.char}" fill-opacity=".6"/></pattern>` +
    // The sheet's grain.
    `<filter id="cb-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="13"/>` +
    `<feColorMatrix values="0 0 0 0 .2  0 0 0 0 .14  0 0 0 0 .08  -1.5 0 0 0 .95"/></filter>`
  )
}

export const CUBISM: Look = {
  name: 'cubism',
  label: 'Cubism',
  voice: 'a Paris café collage of 1913: pasted newsprint, dry wit, the same thing seen from two sides at once',
  cell: 'solid',
  figure: '3d',
  font: CASLON,
  charW: 5,
  caption: { fill: C.paper, stroke: C.char, ink: C.ink, radius: 0 },
  paper: { card: C.paper, ink: C.ink, kinds: { code: '#2f5468', path: '#3d5a78', fn: '#6a3a5a', num: C.terraD, bad: '#a8301f', good: '#4a6332', face: C.terraD } },
  inset: 4,
  titleColor: C.ink,
  art: {
    painter: scenery,
    hero,
    sky: C.slate,
    ground: C.umber,
    defs,
  },
  // The sheet's grain over everything, and the signature in the corner.
  texture: (sw, h) =>
    `<rect width="${sw}" height="${h}" filter="url(#cb-grain)" opacity=".22"/>` +
    `<g transform="rotate(-4 ${sw - 12} ${h - 9})" font-family="${CASLON}" font-style="italic" font-weight="600" font-size="7" text-anchor="end">` +
    `<text x="${sw - 12}" y="${h - 9}" fill="${C.tan}" stroke="${C.tan}" stroke-width="2" stroke-opacity=".8" stroke-linejoin="round">Clawd 13</text>` +
    `<text x="${sw - 12}" y="${h - 9}" fill="${C.umberD}">Clawd 13</text>` +
    `<path fill="none" stroke="${C.umberD}" stroke-width=".5" d="M${sw - 46} ${h - 6.6}q16 1.2 34 -1"/></g>`,
  // The sheet's edge: a cream margin and a thin charcoal rule.
  frame: (sw, h) =>
    `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${C.cream}" stroke-width="3"/>` +
    `<rect x="3.4" y="3.4" width="${sw - 6.8}" height="${h - 6.8}" fill="none" stroke="${C.char}" stroke-width=".8"/>`,
  // The chapter as a torn scrap of newspaper: the title its masthead, a double rule, the edition line.
  tag: (text, inset) => {
    const t = escape(text.toUpperCase())
    const x = inset + 6
    const y = inset + 4
    const w = text.length * 6.6 + 14
    const h = 23
    const scrapD = torn(x, y, w, h, text.length * 13 + 7)
    return {
      svg:
        `<g transform="rotate(-1.5 ${x} ${y})">` +
        `<path fill="#28201a" opacity=".22" transform="translate(1.4 1.8)" d="${scrapD}"/>` +
        `<path fill="${C.paper}" stroke="${C.char}" stroke-width=".35" d="${scrapD}"/>` +
        `<text x="${n(x + w / 2)}" y="${y + 10.5}" text-anchor="middle" font-family="${DIDONE}" font-size="9.5" font-weight="700" letter-spacing=".6" fill="${C.ink}">${t}</text>` +
        `<path stroke="${C.ink}" d="M${x + 5} ${y + 13.2}h${n(w - 10)}" stroke-width=".8"/><path stroke="${C.ink}" d="M${x + 5} ${y + 15}h${n(w - 10)}" stroke-width=".3"/>` +
        `<text x="${n(x + w / 2)}" y="${y + 20}" text-anchor="middle" font-family="${CASLON}" font-style="italic" font-size="4" fill="${C.ink}">N° 13 · ÉDITION DU SOIR · 15 c.</text>` +
        `</g>`,
      w: x + w + 6,
      h: y + h + 4,
    }
  },
  bubble: {
    font: CASLON,
    size: 9,
    charW: 5,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) => {
      const d = torn(x, y, w, h, Math.round(w * 7 + h))
      return (
        // A scrap of newsprint pasted over a strip of faux-bois, its tail a charcoal wedge.
        `<path fill="url(#cb-wood)" stroke="${C.char}" stroke-width=".35" d="${poly([[x + w - 40, y - 3], [x + w + 6, y - 7], [x + w + 8, y + 12], [x + w - 38, y + 14]])}"/>` +
        `<path fill="${C.char}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
        `<path fill="#28201a" opacity=".2" transform="translate(1.6 2)" d="${d}"/>` +
        `<path fill="${C.paper}" stroke="${C.char}" stroke-width=".6" d="${d}"/>`
      )
    },
  },
}

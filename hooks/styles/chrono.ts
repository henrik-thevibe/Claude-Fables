/**
 * Chronophotography, after the gallery's "Chronophotography: after Muybridge,
 * 1878" (index.html, style 09, `chrono`), and the look's own sources:
 * Muybridge's cabinet cards of The Horse in Motion (1878) and the plates of
 * Animal Locomotion (1887).
 *
 * The art bible, translated from the gallery's card to the Fables' worlds:
 *
 * - The medium is an albumen print from wet collodion plates, toned sepia:
 *   one brown in every strength from umber to the bare cream of the paper,
 *   continuous tone, no line anywhere. The stage is not one picture but a
 *   row of plates mounted on a cream card, as if a row of cameras stood
 *   along the track and each caught its own stretch of the world as Claude
 *   passed. The prints are pasted edge to edge along the card, each its
 *   own exposure: a hairline where one meets the next, the card showing in
 *   a short tab at either end of it where their corners part, and each
 *   plate's number printed on the card beneath. There is always an odd
 *   number of them, so the middle of the stage, where Claude most often
 *   stands, is the middle of a plate. The hairline runs only above and below
 *   the band Claude moves in, fading out before it reaches him: across that
 *   band one plate gives way to the next in its own exposure and vignette
 *   alone, so crossing from one into the next he is one figure seen by two
 *   cameras, never cut in two by a line.
 * - The sequence, the look's signature: as the gallery repeats its subject
 *   from plate to plate, the camera a plate behind Claude still holds him,
 *   an earlier exposure not quite cleared, faint and a plate's width back,
 *   moving as he moves.
 * - The subject always stands out of the plate. By day the world is printed
 *   high in the scale, from mid sepia to cream, and Claude is the one dark
 *   thing on it, as the horse is against the white shed wall. By night the
 *   plate is Muybridge's later black backdrop: the world printed low, umber
 *   into deep brown, and Claude lit pale against it as if by the flash.
 * - The sky is the backdrop: graded like a burned-in sky, ruled at the top
 *   and divided by numbered vertical lines, so every scene is measured as
 *   the track was. At night it is umber whatever the hour, with no haze, and
 *   its lines are pale and cross into the grid of the 1887 backdrop. The
 *   lab has no sky: its wall is the backdrop, ruled and numbered the same.
 * - Light burns out to the bare paper: the sun and the moon are blank discs
 *   ringed by halation; lamps, lit windows, fire and the lava's rivers are
 *   cream on the dark; a lamp's pool on the floor is a pale halation. Washes
 *   of light on a wall stay tones, or the subject would vanish into them.
 * - Stars are pale specks, like the dust on the plate. The Earth prints
 *   as a toned globe, pale on the dark.
 * - Clouds barely register: the blue-blind plate saw the sky and the cloud
 *   alike, so they are faint pale shapes on the sky. Ash and smoke, which
 *   are dark, print dark.
 * - Land, rock, foliage, grass, ground and buildings are printed by their
 *   lightness alone, far things paler for the haze between; glass and
 *   water hold their lights; reflections on a wet street or a polished
 *   floor are kept, a little fainter, as a lens sees them. The forest
 *   path's leaf litter is too fine for the plate and lost in its dust; the
 *   path's two ruts stay, ruled straight along it like the track's lines.
 * - Air, mist and beams are a pale veil, the haze a long exposure sees.
 *   Life and particles are specks, dark by day, but a bright one (a snow
 *   flake, a star) burns out pale with a thin dark rim, so it still reads
 *   on the pale world; by night bright ones (a firefly, a spark) print pale
 *   and dull ones (the dug earth) mid-tone, so they show on the black
 *   backdrop and on the pale subject alike. Near things at the frame's
 *   edge by day (the trunks, the canopy, boulders) print darker, holding
 *   the frame as the lit original does.
 * - Claude is the gallery's dark subject: each face toned by how it faces
 *   the light (legs in shade), solid eyes with a small cream glint, a soft
 *   cast shadow; at night the same figure printed pale, lit by the flash,
 *   legs and all, every face kept above the tone of the ground. His earlier
 *   exposure is the same pose at under a third of its strength by day, so
 *   it still shows among the forest's dark firs, and at a sixth by night,
 *   when the pale figure stands out on the black backdrop far more.
 * - The print: a fine grain over every plate, each with its own exposure,
 *   a vignette, scratches, dust and now and then a hair or a light leak.
 *   The card is paler at its heart and foxed with age, with a heavy rule and
 *   a hairline round its edge, the plates' numbers beneath them and its
 *   copyright set small between the last two, and past its edge, where a box
 *   the stage cannot fill shows more, the card goes on. The chapter is the
 *   card's title in spaced capitals on a pasted slip, ending in a full stop
 *   unless it ends in its own; the caption is printed on a slip of the card,
 *   ruled twice, its tail a wedge of the same slip, and its code and names
 *   picked out in a tinted print's few hand-tints: burnt sienna, blue slate,
 *   madder lake, yellow ochre, carmine, olive.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isWarm, lum, mix, num as n, type PaintAttr, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family, Painter } from '../art/roles'
import type { Look } from '../looks'

const INK = '#2b2118'
const DEEP = '#0b0604'
/** The cream card the plates are mounted on, and the lighter slips pasted on it. */
const CARD = '#ece2c6'
const SLIP = '#f4ecd7'
const GLINT = '#f2e6c8'
const CASLON = "'Big Caslon', 'Hoefler Text', Baskerville, 'Libre Baskerville', 'Times New Roman', serif"
const CAPS = "Copperplate, 'Copperplate Gothic Light', 'Felix Titling', 'Big Caslon', serif"
const FIGURES = "'Iowan Old Style', Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif"

/** The sepia scale, umber to bare paper. */
const SCALE: [number, string][] = [
  [0, '#100a05'],
  [0.15, '#2e2014'],
  [0.3, '#4f3a26'],
  [0.45, '#745a3e'],
  [0.6, '#9a7f5a'],
  [0.75, '#bfa67c'],
  [0.88, '#dccaa2'],
  [1, '#f4ebd3'],
]
const LEVELS = 28
/** The scale in printable steps: a few dozen tones are all a print needs, and repeated colors keep the markup short. */
const SEPIA = Array.from({ length: LEVELS }, (_, i) => {
  const t = i / (LEVELS - 1)
  const k = SCALE.findIndex(([at]) => at >= t)
  if (k <= 0) return SCALE[0]![1]
  const [a, ca] = SCALE[k - 1]!
  const [b, cb] = SCALE[k]!
  return mix(ca, cb, (t - a) / (b - a))
})
const sepia = (t: number) => SEPIA[Math.max(0, Math.min(LEVELS - 1, Math.round(t * (LEVELS - 1))))]!

/** The gallery's tones for its dark subject: umber to a warm mid brown. */
const SUBJECT = Array.from({ length: 10 }, (_, i) => {
  const k = i / 9
  const c = [17 + 88 * k, 11 + 66 * k, 6 + 46 * k].map(v => Math.round(v).toString(16).padStart(2, '0'))
  return `#${c.join('')}`
})

/** Whether the plate is a night one: its sky (or the lab's wall) is painted first, and says so. */
let night = false

/** How light a lit color prints, from 0 (umber) to 1 (the bare paper), by what it is; `wash` for a gradient's stop. */
function printOf(color: string, family: Family, depth: number, wash = false): number {
  const l = lum(color)
  const f = Math.pow(l, night ? 0.6 : 0.85)
  // Whatever gives light burns out to the paper; its unlit parts print as anything else would.
  const burns = isWarm(color) || l > 0.5
  switch (family) {
    case 'fire':
    case 'lamp':
      if (burns) return 0.86 + 0.14 * l
      break
    case 'stars':
      return 0.82 + 0.18 * l
    case 'glow':
    case 'beam':
      return 0.8 + 0.2 * f
    case 'air':
      return night ? 0.45 + 0.4 * f : 0.82 + 0.18 * f
    case 'body':
      return night ? 0.3 + 0.7 * f : 0.55 + 0.45 * f
    // Specks on the plate: dust by day; by night bright ones burn pale and dull ones (dug earth) print mid-tone, seen on the backdrop and on Claude.
    case 'life':
      return night ? 0.4 + 0.5 * f : l > 0.8 ? 1 : 0.12 + 0.35 * f
    // The blue-blind plate hardly tells a cloud from the sky; smoke and ash still print dark.
    case 'cloud':
      return night ? 0.1 + 0.55 * f : l < 0.35 ? 0.5 + 0.4 * f : 0.78 + 0.22 * f
    // A lit window, a lamp's glint on glass or water, burns out at night like the lamp itself.
    case 'built':
    case 'water':
      if (night && burns && !wash && isWarm(color)) return 0.88 + 0.12 * l
      break
    case 'glass':
      if (night) return burns && !wash && isWarm(color) ? 0.88 + 0.12 * l : 0.1 + 0.88 * f
      break
    case 'shadow':
      return night ? 0.05 : 0.38
    // The night plate's sky is the black backdrop: umber, whatever the hour, with no haze.
    case 'sky':
      if (night) return 0.02 + 0.3 * f
      break
  }
  // By day the near frame (trunks, canopy, boulders at the stage's edge) prints darker, so it holds the picture in.
  let t = night ? 0.1 + 0.62 * f : depth >= 0.95 ? 0.16 + 0.62 * f : 0.34 + 0.66 * f
  // Far things print paler, for the air between.
  if (depth < 0.3) t += (1 - t) * (0.3 - depth) * (night ? 0.6 : 0.85)
  return t
}

const ink = (color: string, family: Family, depth: number, attr?: PaintAttr) => sepia(printOf(color, family, depth, attr === 'stop-color'))

/** The sky's gradient says whether the plate is a night one: dark at the top, not light at the horizon. */
function nightSky(c: Ctx, svg: string): boolean {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#808080'
  const low = stops[stops.length - 1]?.color ?? '#808080'
  return lum(top) < 0.2 && lum(low) < 0.45
}

/**
 * Every scene's sky is the lit `sc-sky` printed in its own tones, under the
 * same carried-over id. Named after its own stops instead, one scene's sky
 * can never stand in for another's when several drawings share a page.
 */
function ownIds(svg: string): string {
  let h = 5381
  for (const m of svg.matchAll(/stop-color="#([0-9a-f]{6})"/g)) for (const ch of m[1]!) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0
  return svg.replace(/\b(sc-[\w-]+)-cr-sky\b/g, `$1-cr-sky${h.toString(36)}`)
}

/** The stage's height (svg.ts's H): the sky's backdrop runs down to it, under the land. */
const STAGE_H = 128

/** Where the backdrop's rule runs, below the card's top edge. */
const RULE = 9.5
/** The numbered lines' spacing. */
const SPACING = 8.4

/** A figure's advance in the backdrop's numbering, at its size. */
const FIGURE_W = 1.9

/**
 * The numbered backdrop: a rule along the top, lines dropping from it at even
 * spacing (a pattern, defined once), each space numbered; at night pale lines
 * that cross into a grid. The numbers are one run of text, each figure placed;
 * a number a plate's edge would cut in two is left out, as the camera missed it.
 */
function backdrop(sw: number, from: number): string {
  const cuts = plates(sw, 0)
    .slice(1)
    .map(p => p.x)
  const xs: string[] = []
  let figures = ''
  // Numbered from 11, as the gallery's first camera sees its stretch of the backdrop.
  for (let x = SPACING, k = 11; x + SPACING / 2 < sw; x += SPACING, k++) {
    const s = String(k)
    const half = (s.length * FIGURE_W) / 2 + 0.6
    if (cuts.some(c => Math.abs(c - x) < half)) continue
    figures += s
    for (let i = 0; i < s.length; i++) xs.push(n(x + (i - s.length / 2) * FIGURE_W))
  }
  const line = night ? '#e6d8b6' : INK
  return (
    `<path stroke="${line}" stroke-opacity="${night ? 0.4 : 0.5}" stroke-width=".5" d="M0 ${RULE}H${n(sw)}"/>` +
    `<rect y="${RULE}" width="${n(sw)}" height="${n(from - RULE)}" fill="url(#cr-back${night ? 'n' : 'd'})"/>` +
    `<text x="${xs.join(' ')}" y="${n(RULE + 4.6)}" font-family="${FIGURES}" font-size="3.4" fill="${line}" fill-opacity="${night ? 0.5 : 0.6}">${figures}</text>`
  )
}

/** A light burnt out to the paper: a blank disc in a ring of halation. */
const burnt = (cx: number, cy: number, r: number, halo: number) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * halo)}" fill="url(#cr-halo)"/>` + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${SEPIA[LEVELS - 1]}"/>`

/** A disc as one path's subpath, as the lit painting draws its out-of-focus lights. */
const disc = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0z`
/** One such disc in the lit painting: its left point, then its radius. */
const BOKEH = /M(-?[\d.]+) (-?[\d.]+)a([\d.]+) [\d.]+ 0 1 0 -?[\d.]+ 0a[\d.]+ [\d.]+ 0 1 0 -?[\d.]+ 0z/g

/** A number to the hundredth, as short as it spells: no leading zero, no trailing ones. */
const t2 = (v: number) => {
  const s = String(Math.round(v * 100) / 100)
  return s.startsWith('0.') ? s.slice(1) : s.startsWith('-0.') ? `-${s.slice(2)}` : s
}

/**
 * The lit painting spells its outlines in absolute steps (M, L). The same outline
 * in relative steps, with h and v where a step is level or plumb and the letter
 * left out where it repeats, is a good deal shorter: in the forest, whose firs are
 * all such outlines, several thousand characters. Every point is still placed to
 * the hundredth on its own, so nothing moves and no error adds up along the way.
 * A path with any other command (a curve, an arc, a relative step) is left as it is.
 */
function relative(d: string): string {
  if (!/^[MLZz\d\s.,-]+$/.test(d) || !d.includes('L')) return d
  const toks = d.match(/[MLZz]|-?\d*\.?\d+/g) ?? []
  let out = ''
  let cmd = ''
  let last = ''
  let [x, y, sx, sy] = [0, 0, 0, 0]
  for (let i = 0; i < toks.length; ) {
    const t = toks[i]!
    if (/[MLZz]/.test(t)) {
      cmd = t
      i++
      if (t === 'Z' || t === 'z') {
        out += 'z'
        ;[x, y, last] = [sx, sy, 'z']
      }
      continue
    }
    const X = Math.round(Number(t) * 100)
    const Y = Math.round(Number(toks[i + 1]) * 100)
    i += 2
    if (!Number.isFinite(X) || !Number.isFinite(Y) || cmd === 'Z' || cmd === 'z' || !cmd) return d
    if (cmd === 'M') {
      out += `M${t2(X / 100)} ${t2(Y / 100)}`
      ;[x, y, sx, sy, cmd, last] = [X, Y, X, Y, 'L', 'M']
      continue
    }
    const [dx, dy] = [X - x, Y - y]
    if (dy === 0) out += `h${t2(dx / 100)}`
    else if (dx === 0) out += `v${t2(dy / 100)}`
    else {
      const [a, b] = [t2(dx / 100), t2(dy / 100)]
      out += (last === 'l' ? (a.startsWith('-') ? '' : ' ') : 'l') + a + (b.startsWith('-') ? '' : ' ') + b
    }
    last = dy === 0 ? 'h' : dx === 0 ? 'v' : 'l'
    ;[x, y] = [X, Y]
  }
  return out.length < d.length ? out : d
}

/** Every outline in a piece of the painting spelled in relative steps. */
const compact = (svg: string) => svg.replace(/\sd="([^"]+)"/g, (all, d: string) => {
  const r = relative(d)
  return r === d ? all : ` d="${r}"`
})

/** The scenery as the plate prints it (paint), every outline it hands on spelled in relative steps. */
const scenery = (sw: number): Painter => {
  const p = paint(sw)
  return { el: (role, svg, meta) => compact(p.el(role, svg, meta)), defs: svg => compact(p.defs(svg)) }
}

/** The painter's rules: the inks by family and depth, and the roles the plate prints its own way. */
const paint = (sw: number) => {
  night = false
  plateW = plates(sw, STAGE_H)[0]!.w
  return painter(
    {
      ink,
      // Haze and cloud register faintly; light on wet stone and polished floors a little less than it was.
      opacity: (family, v) => (family === 'cloud' && !night ? v * 0.6 : family === 'water' ? v * 0.7 : family === 'beam' ? v * 0.5 : family === 'glow' ? v * 0.7 : v),
      // A bright speck by day (a snow flake, a star) burns out pale, and a thin dark rim keeps it on the pale world.
      post: (svg, family) => (family === 'life' && !night ? svg.replaceAll(`fill="${sepia(1)}"`, `fill="${sepia(1)}" stroke="${INK}" stroke-width=".4" stroke-opacity=".7"`) : svg),
      redraw: {
        sky: (svg, c) => {
          night = nightSky(c, svg)
          return ownIds(c.repaint(svg)) + backdrop(c.meta.sw ?? 640, STAGE_H)
        },
        // The lab has no sky: its wall is the backdrop, numbered as the shed wall was. Lit by its lamps
        // in a dark room, it is always a black-backdrop plate, so Claude prints pale against it.
        'lab.wall': (svg, c) => {
          night = true
          return c.repaint(svg) + backdrop(c.meta.sw ?? 640, c.meta.y ?? 96)
        },
        'forest.sun': (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 7
          return c.meta.part === 'halo' ? `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 7)}" fill="url(#cr-halo)"/>` : burnt(cx, cy, r * 1.3, 2.4)
        },
        'desert.sun': (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 11
          return c.meta.part === 'halo' ? `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 5)}" fill="url(#cr-halo)"/>` : burnt(cx, cy, r * 1.1, 2)
        },
        'night.moon': (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          return burnt(cx, cy, (c.meta.r ?? 9) * 1.1, 3.4)
        },
        // The Earth as the plate takes it: a toned globe lit from the left, its night side in umber, bands of cloud, a ring of halation.
        'space.earth': (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 30
          const band = (dy: number, w: number) => {
            const half = Math.sqrt(Math.max(0, 1 - dy * dy)) * r * w
            return `M${n(cx - half)} ${n(cy + dy * r)}q${n(half)} ${n(-r * 0.08)} ${n(half * 2)} 0`
          }
          return (
            `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 1.5)}" fill="url(#cr-halo)" opacity=".35"/>` +
            `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#cr-globe)"/>` +
            `<path fill="none" stroke="${SEPIA[LEVELS - 1]}" stroke-opacity=".3" stroke-width="1.1" stroke-linecap="round" d="${band(-0.62, 0.45)}${band(-0.35, 0.6)}"/>`
          )
        },
        // The city through the lab's window, out of focus: each light a small burnt core in a faint disc of halation,
        // not a blank disc as big as the blur, which would read as damage to the plate.
        // This reads the lit painting's markup for those lights (scenery.ts, the lab's window): a group with an opacity
        // holding a path of discs per color, each disc two `a` arcs, as BOKEH and disc() spell them. Should that
        // markup change and the group no longer match, every disc of the window wider than the raindrops on the glass
        // (radius 1 at most) still shrinks to its core, so the big blank discs can never come back.
        'lab.window': (svg, c) => {
          const lit = c.repaint(svg)
          const core = (_m: string, x: string, y: string, r: string) => disc(+x + +r, +y, Math.max(0.5, +r * 0.32))
          const out = lit.replace(/<g opacity="[\d.]+">((?:<path fill="#[0-9a-f]{6}" d="[^"]*"\/>)+)<\/g>/, (_all, lights: string) => {
            const cores = lights.replace(/d="([^"]*)"/g, (_d, d: string) => `d="${d.replace(BOKEH, core)}"`)
            return `<g opacity=".3">${lights}</g>${cores}`
          })
          return out !== lit ? out : lit.replace(BOKEH, (m, x: string, y: string, r: string) => (+r > 1 ? core(m, x, y, r) : m))
        },
        // The leaf litter's flecks are too small for the plate, whose own dust stands in for them; the path's two ruts
        // stay, ruled straight along it like the track's lines, each at its mean height.
        'forest.litter': svg => {
          const [, stroke = '#2a2418', ruts = ''] = /<path\b[^>]*stroke="([^"]+)"[^>]*\sd="([^"]*)"/.exec(svg) ?? []
          let d = ''
          for (const rut of ruts.split('M').filter(Boolean)) {
            const pts = [...rut.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(q => [+q[1]!, +q[2]!] as const)
            if (pts.length < 2) continue
            const y = pts.reduce((s, q) => s + q[1], 0) / pts.length
            d += `M${n(pts[0]![0])} ${n(y)}H${n(pts[pts.length - 1]![0])}`
          }
          return d ? `<path fill="none" stroke="${ink(stroke, 'mark', 0.6)}" stroke-width=".6" opacity=".45" d="${d}"/>` : ''
        },
        // The valley's low mist, a pale veil. The lit painting defines its gradient later, with the near
        // scenery, so the general repaint never learns it: the veil takes the style's own instead.
        'night.mist': (svg, c) => c.repaint(svg).replace(/url\(#sc-lowmist\)/g, 'url(#cr-mist)'),
        // Motes in a beam are too faint and too quick for the plate: its own dust stands in for them.
        'forest.motes': () => '',
        'lab.motes': () => '',
        lens: () => '',
      },
    },
    'cr',
  )
}

// ---------------------------------------------------------------- Claude

/** A short hash of a pose's markup, so a pose's id says what it holds. */
function hashOf(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/**
 * How strongly the earlier exposure, a plate behind Claude, still shows: by day,
 * dark on the pale plate, strong enough to hold among the forest's mid-dark firs;
 * by night, pale on the black backdrop, where less shows as much.
 */
const EARLIER = { day: 0.3, night: 0.17 }

/**
 * Claude as the gallery's subject: each face toned by how it faces the light,
 * legs in shade, solid eyes with a cream glint. By day dark against the
 * light world; by night pale, as if lit by the flash. One plate behind him, the
 * last camera's exposure has not quite cleared: the same pose, faint, a plate's
 * width back, as the gallery repeats its subject from plate to plate. It is a
 * <use> of the pose, never drawn again. Each pose is named after its markup, with
 * a count for a pose that comes round again in the same drawing, so an id is
 * never defined twice in a drawing, and on a page of several drawings one id is
 * always the same pose.
 */
const hero = (): HeroPainter => {
  const seen = new Map<string, number>()
  return (m: Model, cx: number, floor: number) => {
    const body = pose(m, cx, floor)
    const key = hashOf(body)
    const k = (seen.get(key) ?? 0) + 1
    seen.set(key, k)
    const id = `cr-x${key}${k > 1 ? `-${k}` : ''}`
    return `<use href="#${id}" x="${n(-plateW)}" opacity="${night ? EARLIER.night : EARLIER.day}"/><g id="${id}">${body}</g>`
  }
}

/** One pose of Claude in the print. */
function pose(m: Model, cx: number, floor: number): string {
  const pale = night
  // The gallery's tone, 0.08 + 0.92 × light. Its model lights a face up to 1, this one only to about .78
  // (a top face square to the light), so the 1.3 stretches these faces over the gallery's whole range of tones.
  // By night the pale figure keeps to the top of the scale, so a face turned from the flash (his underside in a hop)
  // never sinks to the tone of the ground behind it.
  const toneOf = (light: number) => {
    const q = Math.min(1, (0.08 + 0.92 * light) * 1.3)
    return pale ? sepia(0.6 + 0.4 * q) : SUBJECT[Math.round(q * 9)]!
  }
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  // Faces of one tone in a row share a path; draw order is kept, so overlaps stay right.
  // The legs are their hulls alone: by day in the subject's darkest tone, standing in shade; by night the flash
  // reaches them too, and they print a little below the body's pale, never as low as the ground behind them.
  let faces = ''
  let fill = ''
  let d = ''
  for (const f of outlinedFaces(m)) {
    if (f.part === 'leg') continue
    const c = toneOf(f.light)
    if (c !== fill && d) {
      faces += `<path fill="${fill}" d="${d}"/>`
      d = ''
    }
    fill = c
    d += poly(f.pts, cx, floor)
  }
  if (d) faces += `<path fill="${fill}" d="${d}"/>`
  // The eyes. An open eye is a pill, two half circles joined by straight sides: drawn as the stroke between its two
  // half circles' centers, as wide as the eye, with round caps, both eyes in one path. Its points 0 and 6 are the
  // ends of the upper half circle's diameter, 7 and 13 the lower's, and 3 its top. Any other eye (wide, a slit) is
  // its own outline; the closed, happy and dizzy ones are lines.
  let pills = ''
  let pillW = 0
  let pillN = 0
  let shapes = ''
  let lines = ''
  let glints = ''
  for (const e of m.eyes) {
    if (!e.poly) {
      lines += poly(e.line ?? [], cx, floor, false)
      continue
    }
    const xs = e.poly.map(q => q[0])
    const ys = e.poly.map(q => q[1])
    const w = Math.max(...xs) - Math.min(...xs)
    const h = Math.max(...ys) - Math.min(...ys)
    const [a, b, c, dd] = [e.poly[0], e.poly[6], e.poly[7], e.poly[13]]
    if (e.poly.length === 14 && a && b && c && dd) {
      const across = Math.hypot(a[0] - b[0], a[1] - b[1])
      pillW += across
      pillN++
      pills += poly([[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], [(c[0] + dd[0]) / 2, (c[1] + dd[1]) / 2]], cx, floor, false)
    } else shapes += poly(e.poly, cx, floor)
    // The glint is sized by the eye, as the gallery's is: about a quarter of its width across, set a little way down
    // from its top, so it sits inside the eye clear of its rim, and a squint gets a smaller one.
    const top = e.poly[3] ?? [0, 0]
    const r = Math.min(0.12 * w, 0.18 * h)
    glints += `<circle cx="${t1(top[0] + cx)}" cy="${t1(top[1] + floor + Math.min(0.38 * w, 0.45 * h))}" r="${t1(Math.max(0.4, r))}" fill="${GLINT}"/>`
  }
  const eyes =
    (pills ? `<path stroke="${DEEP}" stroke-width="${t1(pillW / pillN)}" stroke-linecap="round" d="${pills}"/>` : '') +
    (shapes ? `<path fill="${DEEP}" d="${shapes}"/>` : '') +
    (lines ? `<path fill="none" stroke="${DEEP}" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" d="${lines}"/>` : '') +
    glints
  // The cast shadow is the ground's ellipse under him, drawn as one: the box of the model's shadow outline.
  const sx = m.shadow.map(q => q[0])
  const sy = m.shadow.map(q => q[1])
  const [x0, x1, y0, y1] = [Math.min(...sx), Math.max(...sx), Math.min(...sy), Math.max(...sy)]
  return (
    // The gallery's cast shadow: its subject() lays the shadow in #22150a at .36; by night a deeper one under the pale figure.
    `<ellipse cx="${t1((x0 + x1) / 2 + cx)}" cy="${t1((y0 + y1) / 2 + floor)}" rx="${t1((x1 - x0) / 2)}" ry="${t1((y1 - y0) / 2)}" fill="${pale ? DEEP : '#22150a'}" opacity="${pale ? 0.5 : 0.36}"/>` +
    // The hulls under the faces close every seam, in the subject's own shade: the gallery's subject() fills them in its
    // fourth tone of 32 (TONES[3]), which is SUBJECT[1] here; by night a pale tone under the pale figure.
    `<path fill="${pale ? sepia(0.7) : SUBJECT[1]}" d="${hulls}"/>` +
    faces +
    eyes
  )
}

// ---------------------------------------------------------------- the card

/** The card's margins: round the opening, and below it, where the plates' numbers are printed. */
const MARGIN = 4
const FOOT = 10
/** The card showing in the gutter at either end of a division between plates: the tab's width, and how far it reaches in. */
const TAB_W = 3
const TAB = 2.5
/**
 * About how wide a plate is: on the usual stage (640 units) nine plates. Claude
 * can stop anywhere, so some join always falls on him; its hairline is drawn
 * only above and below the band he moves in (see JOIN_TOP), and across that band
 * the plates are told apart by their own exposures and vignettes.
 */
const PLATE_W = 70
/** How wide each plate is on the stage being painted: the scenery is painted first, and sets it. */
let plateW = PLATE_W
/**
 * Where a join's hairline stops above Claude and starts again below him: he flies
 * with his top at about y 34, stands from 68 to 104 and jumps between, so the line
 * fades out from JOIN_TOP to JOIN_TOP + 4, is gone down to JOIN_FOOT, is back by
 * JOIN_FOOT + 2, and never crosses him.
 */
const JOIN_TOP = 26
const JOIN_FOOT = 106

/**
 * The plates along the card: as many cameras as the stage is long, about
 * seventy units each, pasted edge to edge in one row. Always an odd number,
 * so no division falls at the stage's middle, where Claude so often stands.
 */
function plates(sw: number, h: number) {
  const count = Math.max(3, 2 * Math.round(((sw - 2 * MARGIN) / PLATE_W - 1) / 2) + 1)
  const w = (sw - 2 * MARGIN) / count
  return Array.from({ length: count }, (_, k) => ({ k, x: MARGIN + k * w, y: MARGIN, w, h: h - MARGIN - FOOT }))
}

/** A small seeded sequence, so the same card always has the same scratches. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

const rect = (p: { x: number; y: number; w: number; h: number }) => `M${n(p.x)} ${n(p.y)}h${n(p.w)}v${n(p.h)}h${n(-p.w)}z`

/** Over the stage: the print's grain, and each plate's own exposure, vignette, scratches, dust, hairs and leaks. */
function texture(sw: number, h: number): string {
  // Seeded with 919, the gallery's seed for this same overlay of scratches, dust and hairs.
  const r = seeded(919 + Math.round(sw))
  const ps = plates(sw, h)
  let washes = ''
  let light = ''
  let dark = ''
  let dust = ''
  let specks = ''
  let hairs = ''
  for (const p of ps) {
    const wash = (r() - 0.5) * 0.12
    washes += `<path fill="${wash > 0 ? '#fff4dc' : '#28180a'}" opacity="${n(Math.abs(wash))}" d="${rect(p)}"/>`
    if (r() > 0.72) {
      const left = r() > 0.5
      washes += `<rect x="${n(left ? p.x : p.x + p.w * 0.4)}" y="${n(p.y)}" width="${n(p.w * 0.6)}" height="${n(p.h)}" fill="url(#cr-leak${left ? 'l' : 'r'})"/>`
    }
    for (let i = 0, count = 1 + Math.floor(r() * 3); i < count; i++) {
      const sx = p.x + r() * p.w
      const sy = p.y + r() * p.h * 0.6
      const len = 8 + r() * 40
      const s = `M${n(sx)} ${n(sy)}l${n((r() - 0.5) * 2)} ${n(Math.min(len, p.y + p.h - sy))}`
      if (r() < 0.65) light += s
      else dark += s
    }
    for (let i = 0; i < 9; i++) {
      const s = `M${n(p.x + r() * p.w)} ${n(p.y + r() * p.h)}h.01`
      if (r() < 0.5) dust += s
      else specks += s
    }
    if (r() < 0.35) {
      const hx = p.x + 6 + r() * (p.w - 20)
      const hy = p.y + 6 + r() * (p.h - 14)
      hairs += `M${n(hx)} ${n(hy)}c4 -3 6 5 11 2`
    }
  }
  // Every plate's vignette is one tile of a pattern a plate wide (see defs), laid once over the whole row.
  const last = ps[ps.length - 1]!
  return (
    `<rect width="${sw}" height="${h}" filter="url(#cr-grain)" opacity=".2"/>` +
    washes +
    `<rect x="${MARGIN}" y="${MARGIN}" width="${n(last.x + last.w - MARGIN)}" height="${n(last.h)}" fill="url(#${vignetteId(sw, h)})"/>` +
    `<path fill="none" stroke="#faeed2" stroke-opacity=".45" stroke-width=".35" d="${light}"/>` +
    `<path fill="none" stroke="#1e1208" stroke-opacity=".3" stroke-width=".3" d="${dark}"/>` +
    `<path fill="none" stroke="#1e1208" stroke-opacity=".5" stroke-width=".9" stroke-linecap="round" d="${dust}"/>` +
    `<path fill="none" stroke="#faf0d7" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round" d="${specks}"/>` +
    (hairs ? `<path fill="none" stroke="#190f06" stroke-opacity=".45" stroke-width=".25" d="${hairs}"/>` : '')
  )
}

/** The card's line of copyright, as Muybridge's cards carried theirs. */
const COPYRIGHT = 'COPYRIGHT, 1878.'
/** The card's own tone at its edge, where it goes on past the stage. */
const CARD_EDGE = '#e0cfa8'

/**
 * The card: the prints pasted along it, edge to edge, with the card showing in
 * a tab at either end of each join and a hairline from each tab, fading out
 * before the band Claude moves in (cr-join); the row's cast shadow; numbered
 * beneath, its edge ruled, its copyright.
 */
function frame(sw: number, h: number): string {
  const ps = plates(sw, h)
  const top = MARGIN
  const bottom = MARGIN + ps[0]!.h
  const right = sw - MARGIN
  const cuts = ps.slice(1).map(p => p.x)
  // The opening the prints fill, notched at each join by the card's tabs.
  let opening = `M${n(MARGIN)} ${n(top)}`
  for (const x of cuts) opening += `H${n(x - TAB_W / 2)}v${TAB}h${TAB_W}v${-TAB}`
  opening += `H${n(right)}V${n(bottom)}`
  for (const x of [...cuts].reverse()) opening += `H${n(x + TAB_W / 2)}v${-TAB}h${-TAB_W}v${TAB}`
  opening += `H${n(MARGIN)}z`
  const joins = cuts.map(x => `M${n(x)} ${n(top + TAB)}V${n(bottom - TAB)}`).join('')
  // The shadow the row of prints casts on the card, below and to the right.
  const shadow = `M${n(right)} ${n(top + 1.2)}h.9V${n(bottom + 1.2)}H${n(MARGIN + 0.9)}v-1.2H${n(right)}z`
  const figures = ps.map(p => `<text x="${n(p.x + p.w / 2)}" y="${n(h - 3.2)}">${p.k + 1}</text>`).join('')
  // The copyright, as an imprint at the card's foot on the right: under the last join, between the last two plates'
  // numbers, where it has a plate's width less those numbers. Each letter takes about .7 of its size, letter spacing
  // included, and a number about 1.4 a figure either side of its middle, with a little air: on the usual stage the
  // copyright is set at its full 3.3, and only a very narrow stage asks for smaller.
  const last = ps[ps.length - 1]!
  const room = last.w - 2 * (String(ps.length).length * 1.4 + 2)
  const size = Math.min(3.3, room / (COPYRIGHT.length * 0.7))
  // Foxing: the card's age, a few soft brown spots, on the plates as on the card. Seeded with 909, the gallery's seed for its card.
  const r = seeded(909 + Math.round(sw))
  let fox = ''
  for (let i = 0, count = Math.round(sw / 90); i < count; i++) fox += `<circle cx="${n(r() * sw)}" cy="${n(r() * h)}" r="${n(2 + r() * 7)}"/>`
  // The card's shape changes with the stage's size, so its id says the size: drawings of other sizes on one page keep their own.
  const id = `cr-card${Math.round(sw)}x${Math.round(h)}`
  return (
    // Past the card's edge, where a box the stage cannot fill shows more, the card goes on.
    `<path fill="${CARD_EDGE}" fill-rule="evenodd" d="M${-sw * 4} ${-h * 4}H${sw * 5}V${h * 5}H${-sw * 4}zM0 0H${sw}V${h}H0z"/>` +
    `<path id="${id}" fill="url(#cr-cardg)" fill-rule="evenodd" d="M0 0H${sw}V${h}H0z${opening}"/>` +
    `<use href="#${id}" filter="url(#cr-grain)" opacity=".22"/>` +
    `<g fill="url(#cr-fox)">${fox}</g>` +
    `<path fill="#3c2814" opacity=".22" d="${shadow}"/>` +
    `<path fill="none" stroke="#24180e" stroke-opacity=".85" stroke-width=".7" d="${opening}"/>` +
    `<path fill="none" stroke="url(#cr-join)" stroke-width=".35" d="${joins}"/>` +
    // The card's ruled edge: a heavy rule and a hairline inside it.
    `<rect x=".9" y=".9" width="${n(sw - 1.8)}" height="${n(h - 1.8)}" fill="none" stroke="${INK}" stroke-width=".9"/>` +
    `<rect x="2.5" y="2.5" width="${n(sw - 5)}" height="${n(h - 5)}" fill="none" stroke="${INK}" stroke-width=".3"/>` +
    `<g fill="${INK}" text-anchor="middle" font-family="${FIGURES}" font-size="5.4">${figures}</g>` +
    `<text x="${n(last.x)}" y="${n(h - 3.4)}" text-anchor="middle" font-family="${FIGURES}" font-size="${n(size)}" letter-spacing="${n(size * 0.15)}" textLength="${n(size * 0.7 * COPYRIGHT.length)}" lengthAdjust="spacingAndGlyphs" fill="${INK}">${COPYRIGHT}</text>`
  )
}

/**
 * The chapter's slip: its height; how far in its inner rule runs (so the rule is
 * 13 − 2 × 1.5 = 10 high); the title's baseline below the slip's top, centring
 * the capitals in that rule; the title's size, its letter spacing, and the room
 * each letter is given (Copperplate's capitals average about 5 at size 7, plus
 * the spacing); and the margin either side of the title.
 */
const TAG_H = 13
const TAG_RULE = 1.5
const TAG_BASE = 9.3
const TAG_SIZE = 7
const TAG_SPACE = 1.3
const TAG_CH = 6.3
const TAG_PAD = 6

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * The joins' hairline, in the stage's own units: opaque from the card's tabs down to
 * JOIN_TOP and from JOIN_FOOT + 2 down to the tabs below, gone between, where Claude is.
 * A zero-width line has no box, so the gradient runs in user space, down the opening.
 */
function joinInk(h: number): string {
  const top = MARGIN
  const bottom = h - FOOT
  const at = (y: number) => n(Math.max(0, Math.min(1, (y - top) / (bottom - top))))
  const stop = (y: number, o: number) => `<stop offset="${at(y)}" stop-color="#24180e" stop-opacity="${o}"/>`
  return (
    `<linearGradient id="cr-join" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${n(bottom)}">` +
    stop(JOIN_TOP, 0.7) +
    stop(JOIN_TOP + 4, 0) +
    stop(JOIN_FOOT, 0) +
    stop(JOIN_FOOT + 2, 0.7) +
    `</linearGradient>`
  )
}

/** The vignettes' pattern changes with the stage's size, so its id says the size, as the card's does. */
const vignetteId = (sw: number, h: number) => `cr-vig${Math.round(sw)}x${Math.round(h)}`

/**
 * Each plate's own vignette, darkening toward its edges and corners, so the plates
 * dip at every join and are told apart across Claude's band: a pattern whose tile
 * is one plate, starting at the first, holding the vignette fitted to that plate.
 */
function vignettes(sw: number, h: number): string {
  const p = plates(sw, h)[0]!
  const size = `width="${n(p.w)}" height="${n(p.h)}"`
  return `<pattern id="${vignetteId(sw, h)}" patternUnits="userSpaceOnUse" x="${n(p.x)}" y="${n(p.y)}" ${size}><rect ${size} fill="url(#cr-vig)"/></pattern>`
}

/** The definitions the whole style draws with, laid down once under the stage. */
const defs = (sw: number, h: number) =>
  joinInk(h) +
  vignettes(sw, h) +
  // The print's grain: fine noise in the toner's brown, held to whatever shape it is laid on.
  // Dark grains where the noise runs high, pale ones where it runs low, so the grain never shifts a tone. Its seed,
  // 909, is the gallery's for the card, whose grain this is.
  `<filter id="cr-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="909" result="n"/>` +
  `<feColorMatrix in="n" values="0 0 0 0 .16  0 0 0 0 .1  0 0 0 0 .04  3 0 0 0 -1.75" result="d"/>` +
  `<feColorMatrix in="n" values="0 0 0 0 .97  0 0 0 0 .93  0 0 0 0 .83  -3 0 0 0 1.25" result="l"/>` +
  `<feMerge><feMergeNode in="d"/><feMergeNode in="l"/></feMerge><feComposite in2="SourceAlpha" operator="in"/></filter>` +
  // The backdrop's ruled lines, by day dark on the pale wall, by night pale on the black one and crossed into a grid.
  `<pattern id="cr-backd" width="${SPACING}" height="${SPACING}" patternUnits="userSpaceOnUse"><path d="M${SPACING / 2} 0V${SPACING}" stroke="${INK}" stroke-opacity=".45" stroke-width=".5"/></pattern>` +
  `<pattern id="cr-backn" width="${SPACING}" height="${SPACING}" patternUnits="userSpaceOnUse"><path d="M${SPACING / 2} 0V${SPACING}M0 ${SPACING / 2}H${SPACING}" stroke="#e6d8b6" stroke-opacity=".3" stroke-width=".45"/></pattern>` +
  // The valley's low mist at night: a pale veil, densest low down.
  `<linearGradient id="cr-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sepia(0.7)}" stop-opacity="0"/><stop offset=".6" stop-color="${sepia(0.7)}" stop-opacity=".3"/><stop offset="1" stop-color="${sepia(0.7)}" stop-opacity="0"/></linearGradient>` +
  `<linearGradient id="cr-globe" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="${sepia(0.97)}"/><stop offset=".45" stop-color="${sepia(0.66)}"/><stop offset=".72" stop-color="${sepia(0.3)}"/><stop offset="1" stop-color="${sepia(0.1)}"/></linearGradient>` +
  // The card: paler at its heart, toned toward its edges; and a fox spot on it.
  `<radialGradient id="cr-cardg" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#f2e9d0"/><stop offset="1" stop-color="#e0cfa8"/></radialGradient>` +
  `<radialGradient id="cr-fox"><stop offset="0" stop-color="#966932" stop-opacity=".14"/><stop offset=".7" stop-color="#966932" stop-opacity=".05"/><stop offset="1" stop-color="#966932" stop-opacity="0"/></radialGradient>` +
  // A plate's vignette, fitted to the plate it is laid on (the vignettes' pattern holds one), its heart a little high as the gallery's is.
  `<radialGradient id="cr-vig" cx=".5" cy=".47" r=".7"><stop offset=".45" stop-color="#301e0e" stop-opacity="0"/><stop offset="1" stop-color="#301e0e" stop-opacity=".42"/></radialGradient>` +
  `<radialGradient id="cr-halo"><stop offset="0" stop-color="#f6eed8" stop-opacity=".9"/><stop offset=".35" stop-color="#f0e4c6" stop-opacity=".45"/><stop offset="1" stop-color="#e8d9b4" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="cr-leakl" cx="0" cy=".4" r=".9"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".3"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="cr-leakr" cx="1" cy=".4" r=".9"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".3"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>`

export const CHRONO: Look = {
  name: 'chrono',
  label: 'Chronophotography',
  voice: 'an 1878 Muybridge motion study: a solemn Victorian scientific record',
  cell: 'solid',
  figure: '3d',
  font: CASLON,
  // Big Caslon's capitals run wide: 5.3 a character gives an all-capitals caption room on its slip.
  charW: 5.3,
  caption: { fill: SLIP, stroke: INK, ink: INK, radius: 0 },
  // The caption's code and names in a tinted print's few hand-tints, each well clear of the umber ink and of the
  // others: burnt sienna for code, a blue slate for paths, madder lake for calls, yellow ochre for figures, carmine, olive.
  paper: { card: SLIP, ink: INK, kinds: { code: '#8a3e12', path: '#34526e', fn: '#762a4a', num: '#7f6410', bad: '#a3221a', good: '#4c5a1e', face: '#7f6410' } },
  inset: MARGIN,
  titleColor: INK,
  art: {
    painter: scenery,
    hero,
    sky: CARD,
    ground: '#7a6246',
    defs,
  },
  texture,
  frame,
  // The chapter as the card's title: spaced capitals ending in a stop (a full stop, unless the title has its own),
  // on a slip pasted at the first plate's corner.
  tag: (text, inset) => {
    const bare = text.toUpperCase().replace(/\s+$/, '')
    const t = /[.!?…:;]$/.test(bare) ? bare : `${bare}.`
    const x = inset + 3
    const y = inset + 3
    // The title is set to the room the slip gives it, so wide capitals (W, M) can never run past the rule.
    const room = t.length * TAG_CH
    const w = room + 2 * TAG_PAD
    return {
      svg:
        `<rect x="${x + 0.9}" y="${y + 1.2}" width="${n(w)}" height="${TAG_H}" fill="#3c2814" opacity=".22"/>` +
        `<rect x="${x}" y="${y}" width="${n(w)}" height="${TAG_H}" fill="${SLIP}" stroke="${INK}" stroke-width=".6"/>` +
        `<rect x="${x + TAG_RULE}" y="${y + TAG_RULE}" width="${n(w - 2 * TAG_RULE)}" height="${TAG_H - 2 * TAG_RULE}" fill="none" stroke="${INK}" stroke-width=".25"/>` +
        `<text x="${n(x + w / 2)}" y="${y + TAG_BASE}" text-anchor="middle" font-family="${CAPS}" font-size="${TAG_SIZE}" font-weight="700" letter-spacing="${TAG_SPACE}" textLength="${n(room - TAG_SPACE)}" lengthAdjust="spacingAndGlyphs" fill="${INK}">${escape(t)}</text>`,
      w: x + w + 4,
      h: y + TAG_H + 4,
    }
  },
  bubble: {
    font: CASLON,
    size: 9,
    charW: 5.3,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A slip of the card pasted by Claude: its cast shadow, ruled twice, a wedge of the same slip pointing back,
      // edged in ink so it reads on the pale day plates and the umber night ones alike; the slip covers its base.
      `<rect x="${n(x + 0.9)}" y="${n(y + 1.2)}" width="${w}" height="${h}" fill="#3c2814" opacity=".22"/>` +
      `<path fill="${SLIP}" stroke="${INK}" stroke-width=".7" stroke-linejoin="miter" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${SLIP}" stroke="${INK}" stroke-width=".7"/>` +
      `<rect x="${n(x + 1.8)}" y="${n(y + 1.8)}" width="${n(w - 3.6)}" height="${n(h - 3.6)}" fill="none" stroke="${INK}" stroke-width=".3"/>`,
  },
}

/**
 * Code Poem, after the gallery's "Code Poem" (henrik-styles.js, style 28,
 * `epoem`), itself after Kerr & Holden's *cold_cloud.cc*: a picture made of
 * letters taken from its own source code.
 *
 * The art bible, translated from the gallery's screen to the Fables' worlds:
 *
 * - The medium is a dark terminal, near-black blue (#0b0d12), and type. Every
 *   mass in the scene is set in bold monospace letters lifted from this very
 *   file: the style's own functions, read back with toString(), stripped of
 *   their spaces and set in one grid of rows and columns that runs unbroken
 *   across the whole stage. A shape is the letters that fall inside it,
 *   printed in its ink; a nearer shape takes the same letters in another ink.
 *   Behind the letters each shape keeps the faintest wash of its ink, so a
 *   mass still reads as a mass.
 * - The inks are the plate's three: old gold (#c9b27a) for what the light
 *   falls on, phosphor white-green (#d9ffe6) for what faces us, a dim
 *   sea-green (#6f8a7a) for what turns away. Each is set in steps, dark to
 *   bright; the cursor's cyan (#2fd4c8) is kept for glass, water and cool
 *   lamps. Warm lit colors take the gold, cool and green ones the greens.
 * - The sky is the poem left behind as a ghost: rows of source at a fifth of
 *   their strength, a little brighter toward the horizon, and warmer there
 *   under a dawn or a sunset. Night is the same screen with the ghost dimmer.
 * - The sun is a disc of bright gold letters in a ring of dim gold ones; the
 *   moon a disc of phosphor; the Earth a disc of cyan type. Stars are glyphs,
 *   `*`, `+` and `.`, in phosphor and gold.
 * - Clouds are patches of brighter ghost text; mist and the volcano's ash are
 *   bands of dim type; light falling through the air is a faint wash of gold
 *   letters, and glows are rings of them.
 * - Ridges, rock, land, bark and buildings are type in the greens, dimmer with
 *   distance, gold where the lit painting was warm (mesas, sand, brick).
 *   Foliage and grass are set in the greens; the ground in the darkest steps.
 * - Fire and lava are the brightest gold, embers and sparks `*` and `^`
 *   flying; lamps and lit windows are blocks of gold type on an amber wash.
 * - Glass and water are cyan type, half-struck. A lamp's pool on the floor is
 *   a ring of gold letters.
 * - Life and particles are single glyphs: a firefly is a gold `*`, a mote a
 *   `.`, rain a `|`, snow a `*`, a leaf a `~`, a bubble an `o`, the hawk a `v`.
 * - Claude is set in letters as the gallery sets him: his top in old gold,
 *   his front in phosphor, his sides and legs in the dim green, each a step
 *   darker as it turns from the light, on a dark knock-out so he stands clear
 *   of the type behind him. His eyes are holes in the type.
 * - Over everything, the screen's scanlines. The frame is the terminal's
 *   bezel; the chapter tag is a comment line, `// chapter`, with a blinking
 *   cyan cursor; the caption is set in phosphor on a terminal panel with a
 *   prompt and a cursor of its own.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, num as n, poly } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const BG = '#0b0d12'
const OLD = '#c9b27a'
const TERMINAL = '#d9ffe6'
const DIMC = '#6f8a7a'
const CURSOR = '#2fd4c8'
const MONO = "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace"

/** The letter inks, dark to bright: the greens, the golds, the cursor's cyans. */
const INKS = {
  g: ['#2a3832', '#3b4d45', '#53695d', DIMC, '#a3c7b0', TERMINAL],
  a: ['#463d29', '#665a3e', '#8f7f53', OLD, '#e8d49c', '#fff1c9'],
  c: ['#22706a', CURSOR],
} as const
type Ramp = keyof typeof INKS

/** The grid of type: one column and one row, in stage units, and the tile of source it repeats. */
const CW = 2.8
const LH = 4.2
const COLS = 60
const ROWS = 12
const TW = CW * COLS
const TH = LH * ROWS

/** The letter ink `i` of a ramp, as the pattern that sets it. */
const type = (r: Ramp, i: number) => `url(#po-${r}${Math.max(0, Math.min(INKS[r].length - 1, i))})`

/** Lightness spread out, so the dim lit scenes still reach the bright inks. */
const lift = (l: number) => Math.min(1, Math.pow(l, 0.7) * 1.25)

/** Whether the scene is under a night sky: its sky is painted first, and says so. */
let night = false

/** The letter ink for a lit color in a family, at a depth. */
function letters(color: string, family: Family, depth: number): string {
  const t = lift(lum(color))
  const warm = isWarm(color)
  // Far things are set a step dimmer: the distance is told in fainter type.
  const far = depth < 0.25 ? 1 : 0
  const at = (len: number) => Math.floor(t * len) - far
  switch (family) {
    case 'fire':
      return type('a', 3 + Math.round(t * 2))
    case 'lamp':
      return warm || !isGreen(color) ? 'url(#po-lamp)' : type('c', 1)
    case 'glass':
    case 'water':
      return t > 0.45 ? type('c', 1) : type('c', 0)
    case 'body':
      return warm ? type('a', 5) : type('g', 5)
    case 'cloud':
      return night ? type('g', 1 + Math.round(t)) : warm ? type('a', 1 + Math.round(t * 2)) : type('g', 2 + Math.round(t * 2))
    case 'ground':
      return warm ? type('a', Math.min(2, at(5))) : type('g', Math.min(2, at(5)))
    case 'foliage':
    case 'grass':
      return type('g', at(6) + (night ? 0 : 1))
    case 'shadow':
      return type('g', 0)
    default:
      return warm ? type('a', at(6)) : type('g', at(6) + (night ? 0 : 1))
  }
}

/** A plain tone, for what cannot be a pattern: lines, gradient stops, currentColor. */
function tone(color: string, family: Family): string {
  const t = lift(lum(color))
  if (family === 'fire' || family === 'lamp') return INKS.a[Math.min(5, 3 + Math.floor(t * 3))]!
  const ramp = isWarm(color) ? INKS.a : INKS.g
  return ramp[Math.max(0, Math.min(5, Math.floor(t * 6)))]!
}

// ---------------------------------------------------------------- glyphs

/** The glyph a small thing becomes: rain a stroke, a bubble a ring, a spark a cross, a leaf a tilde. */
function glyphFor(tag: string, attrs: string, k: number, role: string): string {
  if (role === 'desert.hawk') return 'v'
  if (tag === 'circle' || tag === 'ellipse') return /\sfill="none"/.test(attrs) ? 'o' : k % 3 ? '.' : '*'
  const w = Number(/\swidth="([\d.]+)"/.exec(attrs)?.[1] ?? 2)
  const h = Number(/\sheight="([\d.]+)"/.exec(attrs)?.[1] ?? 2)
  if (h > w * 2) return '|'
  if (w > h) return '~'
  return role === 'volcano.embers' ? '^' : k % 2 ? '+' : '*'
}

/** Where a shape stands, for the glyph that replaces it. */
function anchor(tag: string, attrs: string): [number, number] {
  const num = (name: string) => Number(new RegExp(`\\s${name}="([\\d.-]+)"`).exec(attrs)?.[1] ?? 0)
  if (tag === 'circle' || tag === 'ellipse') return [num('cx'), num('cy')]
  if (tag === 'path') {
    const m = /\sd="M\s*([\d.-]+)[ ,]([\d.-]+)/.exec(attrs)
    return [Number(m?.[1] ?? 0), Number(m?.[2] ?? 0)]
  }
  return [num('x') + num('width') / 2, num('y') + num('height') / 2]
}

/**
 * Every small shape of an element set as one glyph in its place, keeping its
 * own animation: a firefly's drift, a spark's flight, a star's twinkle.
 */
function glyphs(svg: string, c: Ctx, ink: (color: string) => string, size = 4.6): string {
  let k = 0
  const body = svg
    .replace(/<(rect|circle|ellipse|path)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const [x, y] = anchor(tag, attrs)
      const lit = /\s(?:fill|stroke)="(#[0-9a-fA-F]{3,6})"/.exec(attrs)?.[1] ?? '#d0d0d0'
      const kept = /\sopacity="[^"]*"/.exec(attrs)?.[0] ?? ''
      const ch = glyphFor(tag, attrs, k++, c.role)
      return `<text x="${n(x)}" y="${n(y + size * 0.36)}" fill="${ink(lit)}"${kept}>${ch}${close ? '</text>' : ''}`
    })
    .replace(/<\/(rect|circle|ellipse|path)>/g, '</text>')
  return `<g font-family="${MONO}" font-size="${size}" font-weight="700" text-anchor="middle">${body}</g>`
}

/** Stars as glyphs: every point of a starfield a `*`, `+` or `.`, from one glyph defined once. */
function stars(svg: string, c: Ctx): string {
  let k = 0
  return c
    .repaint(svg)
    .replace(/<(path|rect|circle)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+)[ ,]([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : tag === 'circle'
            ? [[/\scx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\scy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
            : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|cx|cy|r|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      const uses = pts.map(([x, y]) => `<use href="#po-s${k++ % 3}" x="${x}" y="${y}"/>`).join('')
      return `<g${kept} fill="${k % 4 ? TERMINAL : OLD}">${uses}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect|circle)>/g, '</g>')
}

// ---------------------------------------------------------------- the scenery

/** The sky: the poem's ghost, brighter toward the horizon, warm under a dawn or a sunset. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#203040'
  const low = stops[stops.length - 1]?.color ?? '#405060'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  const warm = isWarm(low) || isWarm(stops[Math.floor(stops.length / 2)]?.color ?? low)
  const band = (y: number, h: number, fill: string) => `<rect y="${y}" width="${n(sw)}" height="${h}" fill="${fill}"/>`
  return (
    `<rect width="${n(sw)}" height="128" fill="url(#po-ghost)"/>` +
    (night
      ? band(76, 52, 'url(#po-g0)')
      : band(48, 28, warm ? 'url(#po-a0)' : 'url(#po-g0)') + band(76, 52, warm ? 'url(#po-a1)' : 'url(#po-g1)'))
  )
}

/** A disc of type: the sun, the moon, the Earth, ringed in fainter letters. */
const disc = (cx: number, cy: number, r: number, fill: string, ring: string) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 1.9)}" fill="${ring}" opacity=".8"/>` +
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}"/>`

/** A shape filled in one letter ink throughout, its lit fills and opacities set aside. */
const inked = (svg: string, c: Ctx, fill: string, opacity = 1) =>
  `<g${opacity < 1 ? ` opacity="${opacity}"` : ''}>${c.repaint(svg).replace(/\sfill="(?!none)[^"]*"/g, ` fill="${fill}"`).replace(/\s(fill-)?opacity="[^"]*"/g, '')}</g>`

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => (attr === 'fill' ? letters(color, family, depth) : tone(color, family)),
      // A lit gradient becomes the type of its overall tone; a faint wash of light is not set at all.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return tone(mean.color, family)
        if (mean.opacity < 0.35) return 'none'
        return letters(mean.color, family, 0.5)
      },
      // Washes keep a little of their strength; type is either struck or not.
      opacity: (_f, v) => (v < 0.2 ? 0 : Math.min(1, v * 1.4)),
      // A lamp's pool on the floor: a ring of gold letters with a brighter heart.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="url(#po-a2)" opacity=".8"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="url(#po-a4)"/>`,
      templateFamily: 'foliage',
      redraw: {
        sky,
        stars,
        lens: () => '',
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return ''
          if (c.role === 'space.earth') return disc(cx, cy, r, type('c', 1), type('c', 0))
          if (c.role === 'night.moon') return disc(cx, cy, r * 1.2, type('g', 5), type('g', 1))
          return disc(cx, cy, Math.max(r * 1.4, 9), type('a', 5), type('a', 1))
        },
        cloud: (svg, c) => {
          const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#a0a0a0'
          return inked(svg, c, letters(lit, 'cloud', c.depth))
        },
        air: (svg, c) => inked(svg, c, night ? type('g', 1) : type('g', 2), 0.55),
        beam: (svg, c) => inked(svg, c, type('a', 1), 0.45),
        glow: (svg, c) => inked(svg, c, night || c.role === 'volcano.glow' ? type('a', 1) : type('a', 0), 0.6),
        water: (svg, c) => `<g opacity=".5">${c.repaint(svg)}</g>`,
        life: (svg, c) => glyphs(svg, c, lit => (isWarm(lit) || c.role === 'night.fireflies' ? INKS.a[4] : TERMINAL), c.role === 'desert.hawk' ? 7 : 4.6),
        'volcano.embers': (svg, c) => glyphs(svg, c, () => INKS.a[5], 4.2),
      },
    },
    'po',
  )
}

// ---------------------------------------------------------------- Claude

/**
 * Which letter ink a face of Claude is set in: the top in old gold, the front
 * in phosphor, the sides and legs in dim green, a step darker as the face turns
 * from the light. Every ink is a shared pattern: one path a face, in every pose.
 */
function heroInk(part: string, name: string, light: number): string {
  const k = light > 0.62 ? 0 : 1
  if (name === 'top') return `url(#po-ht${k})`
  if (part === 'leg') return name === 'front' ? 'url(#po-hs0)' : 'url(#po-hs1)'
  if (name === 'front') return `url(#po-hf${k})`
  if (name === 'bottom') return 'url(#po-hs1)'
  return `url(#po-hs${k})`
}

/** Claude in letters, on a dark knock-out, his eyes holes in the type. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  // Faces of one ink go in one path: a pose is a handful of paths, not a path a face.
  const byInk = new Map<string, string>()
  for (const f of outlinedFaces(m)) {
    const ink = heroInk(f.part, f.name, f.light)
    byInk.set(ink, (byInk.get(ink) ?? '') + poly(f.pts, cx, floor))
  }
  const faces = [...byInk].map(([ink, d]) => `<path fill="${ink}" d="${d}"/>`).join('')
  const pills = m.eyes.filter(e => e.poly).map(e => poly(e.poly ?? [], cx, floor)).join('')
  const lines = m.eyes.filter(e => !e.poly).map(e => poly(e.line ?? [], cx, floor, false)).join('')
  return (
    `<path fill="#000" opacity=".5" d="${poly(m.shadow, cx, floor)}"/>` +
    // The knock-out: every face edged in the screen's dark, so the type behind stops at his edge
    // and each face reads as its own block of letters.
    `<g stroke="${BG}" stroke-width="1.1" stroke-linejoin="round" paint-order="stroke">${faces}</g>` +
    (pills ? `<path fill="${BG}" stroke="${BG}" stroke-width="1.1" stroke-linejoin="round" d="${pills}"/>` : '') +
    (lines ? `<path fill="none" stroke="${BG}" stroke-width="1.6" stroke-linecap="round" d="${lines}"/>` : '')
  )
}

// ---------------------------------------------------------------- the source

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * The poem: this style's own source, read back from its functions, every
 * space taken out, in rows of the grid. As the gallery's plate does, the
 * picture is set in letters lifted from the code that draws it.
 */
function source(): string[] {
  let src = [hero, scenery, letters, sky, glyphs].map(f => f.toString()).join('').replace(/[^!-~]/g, '')
  while (src.length < COLS * ROWS) src += src || 'poem'
  return Array.from({ length: ROWS }, (_, i) => src.slice(i * COLS, (i + 1) * COLS))
}
let rows: string[] | undefined

/** One tile of letters in an ink, on a faint wash of it. */
const tile = (id: string, ink: string, wash: number) =>
  `<pattern id="${id}" width="${n(TW)}" height="${n(TH)}" patternUnits="userSpaceOnUse">` +
  `<rect width="${n(TW)}" height="${n(TH)}" fill="${mix(BG, ink, wash)}"/><use href="#po-src" fill="${ink}"/></pattern>`

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(): string {
  rows ??= source()
  let out =
    `<g id="po-src" font-family="${MONO}" font-size="4.1" font-weight="700">` +
    rows.map((r, i) => `<text y="${n((i + 0.8) * LH)}" textLength="${n(TW - 0.4)}" lengthAdjust="spacing">${escape(r)}</text>`).join('') +
    `</g>`
  for (const [r, ramp] of Object.entries(INKS)) ramp.forEach((ink, i) => (out += tile(`po-${r}${i}`, ink, 0.1)))
  // The poem left behind: the source at a fifth of its strength, on the bare screen.
  out += tile('po-ghost', mix(BG, DIMC, 0.32), 0)
  // Lamps and lit windows: gold type on an amber wash.
  out += tile('po-lamp', '#fff1c9', 0.0).replace(/fill="#[0-9a-f]{6}"\/><use/, `fill="#7a5e2a"/><use`)
  // Claude's inks: the plate's three, on a stronger wash so his body reads as one mass.
  out += tile('po-ht0', '#fff1c9', 0.42) + tile('po-ht1', '#e8d49c', 0.36)
  out += tile('po-hf0', '#f2fff6', 0.36) + tile('po-hf1', TERMINAL, 0.3)
  out += tile('po-hs0', '#a3c7b0', 0.3) + tile('po-hs1', DIMC, 0.28)
  // Star glyphs, defined once and placed at every point of a starfield.
  out +=
    `<g font-family="${MONO}" font-weight="700" text-anchor="middle">` +
    `<text id="po-s0" y="1.5" font-size="4.2">*</text><text id="po-s1" y="1.4" font-size="3.8">+</text><text id="po-s2" y=".6" font-size="4.2">.</text></g>`
  // The screen's scanlines.
  out += `<pattern id="po-scan" width="8" height="3" patternUnits="userSpaceOnUse"><rect width="8" height="1" fill="#000" opacity=".22"/></pattern>`
  out += `<radialGradient id="po-vignette" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>`
  return out
}

/** A cursor that blinks: the cyan block of the gallery's typing. */
const cursor = (x: number, y: number, w: number, h: number) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${CURSOR}"><animate attributeName="opacity" values="1;0" dur="1s" calcMode="discrete" repeatCount="indefinite"/></rect>`

export const POEM: Look = {
  name: 'poem',
  label: 'Code Poem',
  voice: 'a terse code poem, set in lines like a program comment',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: 4.9,
  caption: { fill: BG, stroke: DIMC, ink: TERMINAL, radius: 2 },
  paper: { card: '#0e1219', ink: TERMINAL, kinds: { code: CURSOR, path: '#8fb8ff', fn: '#e8d49c', num: '#ffc47a', bad: '#ff7a6a', good: '#8fe39a', face: '#f0a07a' } },
  inset: 4,
  titleColor: TERMINAL,
  art: {
    painter: scenery,
    hero,
    sky: BG,
    ground: '#10151a',
    defs,
  },
  // The screen: its scanlines, and a darkening toward the corners of the tube.
  texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#po-scan)"/><rect width="${sw}" height="${h}" fill="url(#po-vignette)"/>`,
  // The terminal's bezel: a dark rounded rim and a faint inner line of phosphor.
  frame: (sw, h) =>
    `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" rx="6" fill="none" stroke="#05070a" stroke-width="2.4"/>` +
    `<rect x="2.6" y="2.6" width="${sw - 5.2}" height="${h - 5.2}" rx="5" fill="none" stroke="${DIMC}" stroke-opacity=".45" stroke-width=".5"/>`,
  // The chapter as a comment line, with the cursor blinking after it.
  tag: (text, inset) => {
    const x = inset + 5
    const y = inset + 4
    const t = `// ${text}`
    const w = t.length * 4.8 + 12
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="12" fill="${BG}" fill-opacity=".88"/>` +
        `<text x="${x + 4}" y="${y + 8.6}" font-family="${MONO}" font-size="8" font-weight="700" fill="${TERMINAL}"><tspan fill="${DIMC}">//</tspan> ${escape(text)}</text>` +
        cursor(x + 4 + t.length * 4.82 + 1.2, y + 2.4, 4, 7.6),
      w: x + w + 4,
      h: y + 16,
    }
  },
  bubble: {
    font: MONO,
    size: 8,
    charW: 4.9,
    line: 11,
    base: 12,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A terminal panel: the screen's dark, a dim phosphor rule, a prompt mark and a blinking cursor.
      `<path fill="${BG}" stroke="${DIMC}" stroke-width=".7" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="2" fill="${BG}" fill-opacity=".94" stroke="${DIMC}" stroke-width=".8"/>` +
      `<rect x="${n(x + 1.6)}" y="${n(y + 3)}" width="1" height="${n(h - 6)}" fill="${CURSOR}" opacity=".7"/>` +
      cursor(x + w - 6, y + h - 9.4, 3.6, 6.4),
  },
}

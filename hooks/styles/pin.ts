/**
 * Enamel Pin, after the gallery's "Enamel Pin: hard enamel, 2020s"
 * (index.html, style 20, `pin`): a hard-enamel Clawd pin standing on a
 * terminal-window pin, gold star pins beside him, all on a pink backing card.
 *
 * The art bible, translated from the gallery's card to the Fables' worlds:
 *
 * - The whole picture is one big landscape pin. Every shape is a cell of hard
 *   enamel, flat and opaque, polished level with the metal: no shading inside
 *   a cell, only the next cell in another enamel. Cells are walled by raised
 *   gold lines, and the gold is lit: it runs dark to pale as the light moves
 *   along it, so the walls glint here and there across the picture.
 * - The enamels are the plate's: coral and rust for Claude, a pearlescent
 *   pastel for lids and clouds, the terminal's cream and its dark glitter
 *   screen, the traffic lights' red, amber and green. To carry the worlds the
 *   enameller adds a pin maker's stock: leaf greens, lilac stones, desert
 *   tans, navy and cornflower blues. Far things take paler enamel.
 * - The sky is enamelled in flat bands, each band one color sampled from the
 *   scene's own sky, walled from the next by a gently curving gold wire, as a
 *   sunset pin is. Gold star pins, faceted lit and shaded, are set in it, and
 *   a white glint travels round them now and then. By night the sky is the
 *   terminal screen's dark enamel with glitter suspended in it.
 * - The sun is an enamel disc in a gold bezel with a gloss on it; the moon is
 *   pearlescent enamel with two crater cells; the Earth is blue enamel with
 *   green land cells and a white cloud wire. Stars are glitter.
 * - Clouds are pearlescent enamel cells in gold; smoke and ash a mauve one.
 *   Mist is banks of pearl enamel lying across the scene, walled in gold.
 * - Land and rock, foliage and grass, the ground and buildings are flat cells
 *   by lightness, each walled in gold: the nearer, the heavier the wall. A
 *   scene's own lines (rails, ripples, cracks) become gold wire.
 * - Glass is pale blue enamel; reflections and wet shine are not drawn, nor
 *   are beams, glares and halos of light: enamel holds no light but its gloss.
 * - Fire and lava are red, orange and amber enamel walled in gold; lamps are
 *   amber enamel dots, their pools a pale amber cell on the ground.
 * - Particles are glitter and little enamel chips.
 * - Night keeps every cell in enamel: navy, indigo and deep green, never black,
 *   so a night pin reads as clearly as a day one.
 * - Claude is the gallery's pin: every visible face an enamel cell (coral
 *   front, pearlescent lid, deeper side, rust limbs), walled by gold whose tone
 *   follows the face's light, a heavy gold rim round his whole figure on a
 *   dark keyline, a gloss streak across his front and a little glitter; his
 *   eyes black enamel in gold bezels with a white glint.
 * - The picture is set on the pink backing card, with the euro hang slot
 *   punched at its top and the maker's line in the margin; a gloss sweeps over
 *   the enamel now and then. The chapter is the terminal-window pin, traffic
 *   lights, prompt, blinking cursor and all; the caption is a cream enamel
 *   speech bubble in a gold rim.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, nearest, num as n, poly, step, t1 } from '../art/ink'
import { MIST_TILE, mistBanks, tiled } from '../art/mist'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const SANS = "'Avenir Next', 'Nunito', 'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif"
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"

/** The plate's metal and enamels. */
const K = {
  card: '#f2c9ce',
  ink: '#3a2226',
  brand: '#93646a',
  slot: '#b88990',
  gold: '#d8aa47',
  goldL: '#fde9a8',
  goldD: '#9a6c22',
  goldDD: '#5f4113',
  enF: '#ea8160',
  enS: '#c9664a',
  enB: '#a9513b',
  liF: '#c4533b',
  liT: '#d8694e',
  liS: '#9b3c2a',
  blk: '#1d1615',
  bar: '#f8ece4',
  scr: '#2a2127',
}
const PEARL = ['#fcd8c3', '#f6bfc4', '#f9e0b6', '#e7cdea', '#d3e6e4', '#fcd8c3']
/** The ground's top on the stage (svg.ts). */
const HORIZON = 104

/** The enameller's stock, dark to light, by what it fills. */
const EN = {
  green: ['#1e3e3a', '#285a46', '#3a8256', '#56a868', '#8ccf86', '#c6ebb0'],
  night: ['#16283a', '#1e3a48', '#2a5052', '#3e6e60', '#62927a'],
  bark: ['#3a2220', '#5a3228', '#7a4630', '#9a5e3a', '#b87a4e'],
  earth: ['#4a2a2a', '#7a3e2e', '#b0603a', '#e0904e', '#f2b878', '#f9e0b6'],
  stone: ['#2e2a48', '#46406c', '#6a6496', '#968fbe', '#c6bede', '#ece6f4'],
  coral: ['#6a2a28', '#a9513b', '#c9664a', '#ea8160', '#f6b598', '#fcd8c3'],
  blue: ['#1e2a4a', '#2c4676', '#456cab', '#6a9cd6', '#a8d2ee', '#e0f0f4'],
  glass: ['#1c1a30', '#2c3a66', '#456cab', '#6a9cd6', '#a8d2ee', '#e0f0f4'],
  fire: ['#7a2a22', '#c4533b', '#f2675a', '#f49a4c', '#f4bd4c', '#fde9a8'],
  lamp: ['#f49a4c', '#f4bd4c', '#fde08a', '#fff6d8'],
  cloud: ['#4a4470', '#6e6898', '#a89cc8', '#e7cdea', '#f6e6ee', '#fff8f4'],
  glitter: ['#c8c0e0', '#fde9a8', '#ffffff'],
}
/** The sky's enamels: a band of sky takes whichever is nearest the scene's own color there. */
const SKY = [
  '#1c1a30', '#262a4a', '#2e3a66', '#3e4e88', '#4a72b0', '#6a9cd6', '#9cccec', '#c8e6f2', '#eaf4f2',
  '#e7cdea', '#c8a8d8', '#8a6aa8', '#5a3e78', '#3a2448',
  '#f6bfc4', '#fcd8c3', '#f9e0b6', '#f4bd4c', '#f49a4c', '#ea8160', '#c4533b', '#7a2a22', '#4a1e22',
]

/** Lightness spread out, so the dim lit scenes still use the whole of a ramp. */
const lift = (l: number) => Math.min(1, Math.pow(l, 0.72) * 1.12)

/** Browns and tans: earth, sand, wood, unlit but warm. */
function brown(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r > b + 18 && r >= g
}

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** The enamel a lit color is filled with, in an element of the given family at the given depth. */
function enamel(color: string, family: Family, depth: number): string {
  const l = lum(color)
  // Far things take paler enamel; by night the solid things take the deeper enamels of the ramp.
  const t = night && DIMMED.includes(family) ? lift(l) * 0.8 : Math.min(1, lift(l) + (depth < 0.25 ? 0.12 : 0))
  const warm = isWarm(color)
  const green = isGreen(color)
  switch (family) {
    case 'sky':
      return nearest(color, SKY)
    case 'cloud':
    case 'air':
      return step(EN.cloud, t)
    case 'stars':
    case 'life':
      return warm ? step(EN.lamp, t) : step(EN.glitter, t)
    case 'body':
    case 'beam':
    case 'glow':
      return step(EN.lamp, t)
    case 'fire':
      return step(EN.fire, Math.max(0.15, l))
    case 'lamp':
      return warm || l > 0.5 ? step(EN.lamp, Math.max(0.3, l)) : step(EN.blue, t)
    case 'foliage':
    case 'grass':
      return step(night ? EN.night : EN.green, warm ? 0.9 : t)
    case 'bark':
      return step(EN.bark, t)
    case 'land':
    case 'ground':
    case 'mark':
      return green ? step(night ? EN.night : EN.green, t) : warm || brown(color) ? step(EN.earth, t) : step(EN.stone, t)
    case 'rock':
      return warm || brown(color) ? step(EN.earth, t) : step(EN.stone, t)
    case 'built':
      return warm ? step(EN.coral, t) : brown(color) ? step(EN.earth, t) : step(EN.blue, t)
    case 'glass':
    case 'water':
      // The lights seen through a window are amber enamel dots.
      return l > 0.55 || (warm && l > 0.4) ? step(EN.lamp, l) : step(EN.glass, t)
    case 'shadow':
      return K.ink
    default:
      return step(EN.stone, t)
  }
}

/** Families on which a radial gradient is a wash of light, not a thing. */
const WASHED: readonly Family[] = ['built', 'ground', 'land', 'rock', 'mark', 'glass']

/** Families that take the deeper enamels by night. */
const DIMMED: readonly Family[] = ['land', 'ground', 'rock', 'foliage', 'grass', 'built', 'mark', 'bark', 'cloud']

/** Families enamelled without a gold wall: the sky's bands carry their own; light, glitter and air have none. */
const UNLINED: readonly Family[] = ['sky', 'stars', 'life', 'lens', 'glow', 'beam', 'water', 'shadow', 'air']
/** Families whose own lines are raised gold wire. */
const WIRED: readonly Family[] = ['built', 'mark', 'rock', 'land', 'ground', 'body', 'glass', 'lamp']

/** A lit gradient's color at `t` (0 to 1) along it. */
function sample(stops: readonly { offset: number; color: string }[], t: number): string {
  if (!stops.length) return '#6a9cd6'
  let a = stops[0]!
  for (const s of stops) {
    if (s.offset >= t) return a === s ? s.color : mix(a.color, s.color, (t - a.offset) / Math.max(0.001, s.offset - a.offset))
    a = s
  }
  return a.color
}

/** A small seeded sequence, so the same stage always sets its pins in the same places. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** A gold star pin at x, y, `r` to a point, with a glint that travels round the pins now and then. */
const starPin = (x: number, y: number, r: number, rot: number, glint: number) =>
  `<use href="#pn-star" transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(r / 6)})"/>` +
  `<g transform="translate(${n(x - r * 0.3)} ${n(y - r * 0.35)})"><use href="#pn-glint">` +
  `<animateTransform attributeName="transform" type="scale" values="0;1;0;0" keyTimes="0;.12;.24;1" dur="7.8s" begin="${n(-glint)}s" repeatCount="indefinite"/></use></g>`

/** The sky in bands of enamel, each sampled from the scene's own sky, walled by curving gold wire; star pins set in it. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  // Bands narrower toward the horizon, as a sunset pin is laid out.
  const edges = [0, 26, 48, 66, 80, 92, 128]
  const bands: { y: number; fill: string }[] = []
  for (let i = 0; i < edges.length - 1; i++) {
    const y0 = edges[i] ?? 0
    const y1 = edges[i + 1] ?? 128
    const lit = sample(stops, (y0 + y1) / 2 / 128)
    // A day sky is enamelled a little paler than it is lit, as a pin maker would pick it.
    const fill = nearest(night ? lit : mix(lit, '#ffffff', 0.14), SKY)
    if (bands[bands.length - 1]?.fill !== fill) bands.push({ y: y0, fill })
  }
  // Each band's top is a gentle wave: a band filled from its wire down to the bottom, the next laid over it.
  const wave = (y: number, k: number) => `M0 ${y}q${n(sw / 4)} ${k % 2 ? -2.4 : 2.4} ${n(sw / 2)} 0t${n(sw / 2)} 0`
  let out = ''
  let wires = ''
  bands.forEach((b, k) => {
    out += k ? `<path fill="${b.fill}" d="${wave(b.y, k)}V128H0z"/>` : `<rect width="${n(sw)}" height="128" fill="${b.fill}"/>`
    if (k) wires += wave(b.y, k)
  })
  if (wires) out += `<path fill="none" stroke="url(#pn-gold)" stroke-width=".7" d="${wires}"/>`
  // By night the enamel holds glitter, as the terminal's screen does.
  if (night) out += `<rect width="${n(sw)}" height="${HORIZON}" fill="url(#pn-glitter)"/>`
  const rand = seeded(Math.round(sw) + 20)
  const count = Math.max(2, Math.round(sw / 200))
  for (let i = 0; i < count; i++) out += starPin(((i + 0.3 + rand() * 0.4) * sw) / count, 10 + rand() * 26, 4.6 + rand() * 2, rand() * 36 - 18, i * 2.6 + rand())
  return out
}

/** An enamel disc in a gold bezel, with a gloss across it: the sun. */
function sun(cx: number, cy: number, r: number): string {
  const at = `cx="${n(cx)}" cy="${n(cy)}"`
  return (
    `<circle ${at} r="${n(r + 1.5)}" fill="${K.goldDD}"/><circle ${at} r="${n(r + 1)}" fill="url(#pn-rim)"/>` +
    `<circle ${at} r="${n(r)}" fill="#f4bd4c" stroke="${K.goldD}" stroke-width=".3"/>` +
    `<circle ${at} r="${n(r * 0.62)}" fill="#fde08a" stroke="url(#pn-gold)" stroke-width=".5"/>` +
    `<path fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="${n(Math.max(0.6, r * 0.12))}" stroke-linecap="round" d="M${n(cx - r * 0.62)} ${n(cy - r * 0.3)}a${n(r * 0.7)} ${n(r * 0.7)} 0 0 1 ${n(r * 0.42)} ${n(-r * 0.4)}"/>`
  )
}

/** The moon in pearlescent enamel, two crater cells walled in gold, in a gold bezel. */
function moon(cx: number, cy: number, r: number): string {
  const at = `cx="${n(cx)}" cy="${n(cy)}"`
  return (
    `<circle ${at} r="${n(r + 1.4)}" fill="${K.goldDD}"/><circle ${at} r="${n(r + 0.9)}" fill="url(#pn-rim)"/>` +
    `<circle ${at} r="${n(r)}" fill="url(#pn-pearl)"/>` +
    `<g fill="#e7cdea" stroke="url(#pn-gold)" stroke-width=".45"><circle cx="${n(cx + r * 0.3)}" cy="${n(cy - r * 0.2)}" r="${n(r * 0.24)}"/><circle cx="${n(cx - r * 0.25)}" cy="${n(cy + r * 0.35)}" r="${n(r * 0.17)}"/></g>` +
    `<path fill="none" stroke="#fff" stroke-opacity=".9" stroke-width=".8" stroke-linecap="round" d="M${n(cx - r * 0.7)} ${n(cy - r * 0.2)}a${n(r * 0.75)} ${n(r * 0.75)} 0 0 1 ${n(r * 0.45)} ${n(-r * 0.45)}"/>`
  )
}

/** The Earth as an enamel pin: blue enamel, green land cells and a white cloud wire, in a gold bezel. */
function earth(cx: number, cy: number, r: number): string {
  const at = `cx="${n(cx)}" cy="${n(cy)}"`
  const p = (dx: number, dy: number) => `${n(cx + dx * r)} ${n(cy + dy * r)}`
  return (
    `<circle ${at} r="${n(r + 1.6)}" fill="${K.goldDD}"/><circle ${at} r="${n(r + 1)}" fill="url(#pn-rim)"/>` +
    `<circle ${at} r="${n(r)}" fill="#456cab"/>` +
    `<path fill="#56a868" stroke="url(#pn-gold)" stroke-width=".6" stroke-linejoin="round" d="M${p(-0.55, -0.6)}Q${p(-0.1, -0.75)} ${p(0.05, -0.35)}Q${p(-0.2, 0)} ${p(-0.05, 0.3)}Q${p(-0.35, 0.55)} ${p(-0.6, 0.2)}Q${p(-0.85, -0.2)} ${p(-0.55, -0.6)}zM${p(0.35, 0.05)}Q${p(0.7, -0.1)} ${p(0.75, 0.3)}Q${p(0.55, 0.65)} ${p(0.3, 0.5)}Q${p(0.15, 0.25)} ${p(0.35, 0.05)}z"/>` +
    `<path fill="none" stroke="#fff8f4" stroke-width="${n(r * 0.09)}" stroke-linecap="round" d="M${p(-0.7, 0.45)}Q${p(0, 0.2)} ${p(0.6, -0.5)}"/>` +
    `<path fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="${n(r * 0.06)}" stroke-linecap="round" d="M${p(-0.72, -0.35)}a${n(r * 0.8)} ${n(r * 0.8)} 0 0 1 ${n(r * 0.4)} ${n(-r * 0.42)}"/>`
  )
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => {
        // A scene's own lines are raised gold wire where they wall a solid thing.
        if (attr === 'stroke' && WIRED.includes(family)) return 'url(#pn-gold)'
        return enamel(color, family, depth)
      },
      // Enamel is flat: a gradient becomes one cell in its overall color; a faint wash of light is not drawn.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return WIRED.includes(family) ? 'url(#pn-gold)' : enamel(mean.color, family, 0.5)
        // A pool of light washed over a wall or the ground is light, not a cell.
        if (mean.opacity < 0.5 || (g?.tag === 'radialGradient' && WASHED.includes(family))) return 'none'
        return enamel(mean.color, family, 0.5)
      },
      // Every solid cell walled in gold: the nearer, the heavier the wall.
      // The wall is laid under the enamel, so a cluster of leaves or a bank of cloud is one cell with one outline;
      // leaves and blades are small cells, walled in finer wire.
      line: (family, depth) =>
        UNLINED.includes(family)
          ? ''
          : `stroke="url(#pn-gold)" stroke-width="${n(family === 'foliage' || family === 'grass' ? 0.35 + depth * 0.4 : 0.5 + depth * 0.8)}" stroke-linejoin="round" paint-order="stroke"`,
      // Enamel is opaque: a cell is filled or not, and a faint wash of light is not a cell at all.
      opacity: (family, v) => (family === 'stars' || family === 'life' || family === 'shadow' ? v : v >= 0.4 ? 1 : 0),
      lineless: 0.6,
      faint: 'hide',
      // A wash left unfilled is not a cell, and takes no wall.
      post: svg => svg.replace(/<(path|rect|circle|ellipse)\b((?:(?!\sstroke=)[^>])*?\sfill="none"(?:(?!\sstroke=)[^>])*?)(\/?)>/g, '<$1$2 stroke="none"$3>'),
      // A lamp's pool is a pale amber cell on the ground.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.8)}" ry="${n(Math.max(1, e.ry * 0.7))}" fill="#fde08a" opacity=".55" stroke="url(#pn-gold)" stroke-width=".4"/>`,
      redraw: {
        sky,
        lens: () => '',
        glow: () => '',
        beam: () => '',
        // The lab at night: its walls and benches take the deeper enamels, as a night sky would set them.
        'lab.wall': (svg, c) => {
          night = true
          return c.repaint(svg)
        },
        // The night through the lab's window is the terminal's dark glitter enamel: the blurred lights become glitter.
        'lab.window': (svg, c) =>
          c.repaint(svg.replace(/<g filter="url\(#sc-dof\)"[^>]*>[\s\S]*?<\/g>/, '')) +
          `<rect x="${n(c.meta.cx ?? 0)}" y="${n(c.meta.cy ?? 0)}" width="${n(c.meta.sw ?? 0)}" height="${n(c.meta.h ?? 0)}" fill="url(#pn-glitter)"/>`,
        // Enamel holds no reflection: the wet street and the polished floor stay plain.
        water: () => '',
        // The Milky Way is a drift of glitter, not a band of light.
        'space.milkyway': (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, '')),
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return ''
          if (c.role === 'space.earth') return earth(cx, cy, r)
          if (c.role === 'night.moon') return moon(cx, cy, r * 1.2)
          return sun(cx, cy, c.role === 'forest.sun' ? r * 1.3 : r * 1.1)
        },
        // Clouds are pearlescent enamel cells walled in gold; smoke and ash a mauve enamel.
        cloud: (svg, c) => {
          const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
          const fill = night || lum(lit) < 0.4 ? (c.role.startsWith('volcano') ? '#7a6078' : '#6e6898') : 'url(#pn-pearl)'
          return `<g>${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${fill}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`
        },
        // Mist as banks of pearl enamel lying across the scene, walled in gold.
        air: (svg, c) => {
          const banks = mistBanks({ w: Math.min(MIST_TILE, c.meta.sw ?? 640), y: c.meta.y ?? 80, h: c.meta.h ?? 12, seed: 20, rows: (c.meta.h ?? 12) < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true })
          const art = `<path fill="${night ? '#a89cc8' : 'url(#pn-pearlh)'}" stroke="url(#pn-gold)" stroke-width=".5" stroke-linejoin="round" d="${banks.map(b => b.d).join('')}"/>`
          return `<g opacity="${c.meta.veil ? 0.8 : 0.95}">${tiled(`pn-mist-${Math.round(c.meta.y ?? 80)}-${Math.round(c.meta.h ?? 12)}`, art, c.meta.sw ?? 640)}${c.motion(svg)}</g>`
        },
      },
    },
    'pn',
  )
}

// ---------------------------------------------------------------- Claude

/** The gold of a wall, by the light on the face it walls: dark, mid or pale. */
const wallGold = (light: number) => (light > 0.78 ? '#f6d98a' : light > 0.5 ? K.gold : '#a87a2a')

/** Claude as the gallery's pin: enamel cells walled in lit gold, a heavy gold rim on a dark keyline, gloss and glitter. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  // The cells in painter's order, runs of one enamel and one gold sharing a path.
  let cells = ''
  let key = ''
  let d = ''
  for (const f of outlinedFaces(m)) {
    const limb = f.part !== 'body'
    const fill = limb
      ? f.name === 'top' ? K.liT : f.name === 'front' || f.name === 'back' ? K.liF : K.liS
      : f.name === 'top' ? 'url(#pn-pearl)' : f.name === 'bottom' ? K.enB : f.name === 'front' || f.name === 'back' ? K.enF : K.enS
    const k = `fill="${fill}" stroke="${wallGold(f.light)}"`
    if (k !== key && d) {
      cells += `<path ${key} d="${d}"/>`
      d = ''
    }
    key = k
    d += poly(f.pts, cx, floor)
  }
  if (d) cells += `<path ${key} d="${d}"/>`
  // The gloss streaks and glitter across his front, set by the front face's corners.
  let gloss = ''
  const front = m.faces.find(f => f.part === 'body' && f.name === 'front')
  if (front && front.pts.length === 4) {
    const [a, b, c, e] = front.pts as [[number, number], [number, number], [number, number], [number, number]]
    // u runs left to right, v bottom to top.
    const at = (u: number, v: number): [number, number] => {
      const bx = a[0] + (b[0] - a[0]) * u
      const by = a[1] + (b[1] - a[1]) * u
      const tx = e[0] + (c[0] - e[0]) * u
      const ty = e[1] + (c[1] - e[1]) * u
      return [bx + (tx - bx) * v, by + (ty - by) * v]
    }
    const quad = (u0: number, u1: number, s: number) => poly([at(u0, 0.08), at(u1, 0.08), at(u1 + s, 0.92), at(u0 + s, 0.92)], cx, floor)
    const width = Math.abs(b[0] - a[0])
    if (width > 4) {
      gloss =
        `<path fill="#fff" opacity=".32" d="${quad(0.2, 0.34, 0.3)}${quad(0.4, 0.45, 0.3)}"/>` +
        `<path fill="#fff" d="${[[0.18, 0.7], [0.82, 0.28], [0.62, 0.82]]
          .map(([u, v]) => {
            const p = at(u ?? 0, v ?? 0)
            return `M${t1(p[0] + cx)} ${t1(p[1] + floor - 0.5)}l.18 .5l-.18 .5l-.18 -.5z`
          })
          .join('')}"/>`
    }
  }
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${K.blk}" stroke="${K.gold}" stroke-width=".45" d="${poly(e.poly, cx, floor)}"/>` +
          `<circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx + 0.1)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor + 0.1)}" r=".4" fill="#fff"/>`
        : `<path fill="none" stroke="${K.goldDD}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="${poly(e.line ?? [], cx, floor, false)}"/>` +
          `<path fill="none" stroke="${K.gold}" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="${K.ink}" opacity=".24" d="${poly(m.shadow, cx, floor)}"/>` +
    // The stamped blank's rim: a dark keyline, then the lit gold over it.
    `<path fill="${K.goldDD}" stroke="${K.goldDD}" stroke-width="2.5" stroke-linejoin="round" d="${hulls}"/>` +
    `<path fill="none" stroke="url(#pn-rim)" stroke-width="1.6" stroke-linejoin="round" d="${hulls}"/>` +
    `<g stroke-width=".55" stroke-linejoin="round">${cells}</g>` +
    gloss +
    eyes
  )
}

// ---------------------------------------------------------------- the card

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A five-point star's ten corners about 0 0, `r` to a point. */
function starPts(r: number): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i < 10; i++) {
    const q = i % 2 ? r * 0.46 : r
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push([Math.cos(a) * q, Math.sin(a) * q])
  }
  return pts
}

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(): string {
  // The faceted gold star pin, each point split into a lit and a shaded facet, lit from the upper left.
  const P = starPts(6)
  let facets = ''
  P.forEach((a, i) => {
    const b = P[(i + 1) % 10] ?? a
    const ang = Math.atan2((a[1] + b[1]) / 2, (a[0] + b[0]) / 2)
    const lit = 0.5 + 0.5 * Math.cos(ang + 2.2)
    facets += `<path fill="${mix(K.goldD, K.goldL, Math.min(1, Math.max(0, lit * 1.05 - 0.05)))}" d="M0 0L${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}z"/>`
  })
  const outline = `M${P.map(p => `${n(p[0])} ${n(p[1])}`).join('L')}z`
  const sparkle = (r: number) => `M0 ${-r}L${n(r * 0.18)} 0L0 ${r}L${n(-r * 0.18)} 0zM${-r} 0L0 ${n(r * 0.18)}L${r} 0L0 ${n(-r * 0.18)}z`
  // Glitter: a few flecks of white and gold suspended in a tile, repeated.
  const flecks = [[2, 3, 0.35, '#fff'], [9, 1.5, 0.25, '#ffe2a0'], [14, 7, 0.3, '#fff'], [5, 11, 0.22, '#fff'], [18, 13, 0.32, '#ffe2a0'], [11, 15, 0.2, '#fff']] as const
  return (
    `<g id="pn-star"><path d="${outline}" fill="${K.goldDD}" stroke="${K.goldDD}" stroke-width="1.6" stroke-linejoin="round" transform="translate(.6 .9)" opacity=".35"/>` +
    `<path d="${outline}" fill="${K.gold}" stroke="${K.goldDD}" stroke-width="1" stroke-linejoin="round"/>${facets}</g>` +
    `<path id="pn-glint" fill="#fff" d="${sparkle(3)}"/>` +
    `<pattern id="pn-glitter" width="21" height="17" patternUnits="userSpaceOnUse">${flecks.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".75"/>`).join('')}</pattern>` +
    `<pattern id="pn-grain" width="7" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".3" fill="#965060" opacity=".14"/><circle cx="4.5" cy="3.4" r=".3" fill="#fff" opacity=".3"/></pattern>` +
    `<linearGradient id="pn-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="34" y2="20" spreadMethod="reflect"><stop offset="0" stop-color="${K.goldD}"/><stop offset=".5" stop-color="${K.gold}"/><stop offset=".85" stop-color="#f6d98a"/><stop offset="1" stop-color="${K.goldL}"/></linearGradient>` +
    `<linearGradient id="pn-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde5a0"/><stop offset=".45" stop-color="#d9aa45"/><stop offset="1" stop-color="#8d641f"/></linearGradient>` +
    `<linearGradient id="pn-pearl" x1="0" y1="0" x2="1" y2=".6">${PEARL.map((c, i) => `<stop offset="${n(i / (PEARL.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>` +
    `<linearGradient id="pn-pearlh" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="0" spreadMethod="reflect">${PEARL.map((c, i) => `<stop offset="${n(i / (PEARL.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>` +
    `<linearGradient id="pn-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/><stop offset=".62" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
  )
}

/** The margin of backing card round the pin, and the rim's rounded corner. */
const CARD = 5
const RIM_R = 6

export const PIN: Look = {
  name: 'pin',
  label: 'Enamel Pin',
  voice: 'a cute hard-enamel pin on its backing card, collectible and cheerful',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 5.3,
  caption: { fill: K.bar, stroke: K.goldD, ink: K.ink, radius: 5 },
  paper: { card: K.bar, ink: K.ink, kinds: { code: '#1f6a6a', path: '#2c4a8a', fn: '#8a3a8a', num: '#b8452e', bad: '#b3261e', good: '#2e7d32', face: '#b8452e' } },
  inset: CARD + 3,
  titleColor: K.bar,
  art: {
    painter: scenery,
    hero,
    sky: '#9cccec',
    ground: '#3a2226',
    defs,
  },
  // Now and then a gloss sweeps over the enamel, as light crosses a pin turned in the hand.
  texture: (sw, h) =>
    `<rect x="${n(-sw * 0.25)}" y="0" width="${n(sw * 0.25)}" height="${h}" fill="url(#pn-sweep)" transform="skewX(-24)">` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;${n(sw * 1.5)} 0;${n(sw * 1.5)} 0" keyTimes="0;.3;1" dur="9s" repeatCount="indefinite" additive="sum"/></rect>`,
  // The pink backing card round the pin: its grain, the euro hang slot punched at the top, the maker's line; the pin's gold rim on a keyline.
  frame: (sw, h) => {
    const i = CARD
    const inner = `M${i + RIM_R} ${i}H${sw - i - RIM_R}a${RIM_R} ${RIM_R} 0 0 1 ${RIM_R} ${RIM_R}V${h - i - RIM_R}a${RIM_R} ${RIM_R} 0 0 1 ${-RIM_R} ${RIM_R}H${i + RIM_R}a${RIM_R} ${RIM_R} 0 0 1 ${-RIM_R} ${-RIM_R}V${i + RIM_R}a${RIM_R} ${RIM_R} 0 0 1 ${RIM_R} ${-RIM_R}z`
    const card = `M-2 -2H${sw + 2}V${h + 2}H-2z${inner}`
    const mid = sw / 2
    return (
      `<path fill-rule="evenodd" fill="${K.card}" d="${card}"/><path fill-rule="evenodd" fill="url(#pn-grain)" d="${card}"/>` +
      // The pin's shadow on the card, then its rim: dark keyline, lit gold, a pale ridge.
      `<path fill="none" stroke="#965060" stroke-opacity=".3" stroke-width="2" d="${inner}" transform="translate(.8 1.2)"/>` +
      `<path fill="none" stroke="${K.goldDD}" stroke-width="2.6" d="${inner}"/>` +
      `<path fill="none" stroke="url(#pn-rim)" stroke-width="1.6" d="${inner}"/>` +
      `<path fill="none" stroke="${K.goldL}" stroke-opacity=".7" stroke-width=".35" d="${inner}"/>` +
      // The euro hang slot: a capsule with a round crown, punched through the card.
      `<path fill="${K.slot}" d="M${n(mid - 16)} 1.2h32a1.3 1.3 0 0 1 0 2.6h-32a1.3 1.3 0 0 1 0-2.6zM${n(mid - 2)} 1.2a2 2 0 0 1 4 0z"/>` +
      `<text x="${n(sw - i - 8)}" y="${n(h - 1.3)}" text-anchor="end" font-family="${SANS}" font-size="3" font-weight="600" letter-spacing=".9" fill="${K.brand}">CLAW &amp; CURSOR PIN CO. · HARD ENAMEL · GOLD PLATED</text>`
    )
  },
  // The chapter is the terminal-window pin: a gold frame, a cream title bar with enamel traffic lights, a dark glitter screen with a coral prompt and a blinking cursor.
  tag: (text, inset) => {
    const x = inset + 2
    const y = inset + 1
    const w = Math.round(text.length * 4.7 + 26)
    const bar = 5.5
    const hgt = 18
    const sy = y + bar
    const py = sy + (hgt - bar) / 2
    const lights = ['#f2675a', '#f4bd4c', '#5bc46a']
      .map((c, k) => `<circle cx="${n(x + 4 + k * 3.6)}" cy="${n(y + bar / 2 + 0.3)}" r="1.2" fill="${c}" stroke="${K.goldD}" stroke-width=".5"/>`)
      .join('')
    const cursorX = x + 15 + text.length * 4.7 + 1
    return {
      svg:
        `<rect x="${x + 0.8}" y="${y + 1.3}" width="${w}" height="${hgt}" rx="2.6" fill="#965060" opacity=".25"/>` +
        `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="2.6" fill="url(#pn-rim)" stroke="${K.goldDD}" stroke-width=".9"/>` +
        `<rect x="${x + 1.2}" y="${y + 1.2}" width="${w - 2.4}" height="${n(bar - 1.4)}" rx="1" fill="${K.bar}"/>` +
        `<rect x="${x + 1.2}" y="${n(sy + 0.4)}" width="${w - 2.4}" height="${n(hgt - bar - 1.6)}" rx="1" fill="${K.scr}"/>` +
        `<rect x="${x + 1.2}" y="${n(sy + 0.4)}" width="${w - 2.4}" height="${n(hgt - bar - 1.6)}" fill="url(#pn-glitter)" opacity=".7"/>` +
        lights +
        `<path fill="none" stroke="${K.gold}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M${x + 4} ${n(py - 2.6)}l3 2.6l-3 2.6"/>` +
        `<path fill="none" stroke="${K.enF}" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" d="M${x + 4} ${n(py - 2.6)}l3 2.6l-3 2.6"/>` +
        `<text x="${x + 11}" y="${n(py + 2.6)}" font-family="${MONO}" font-size="7.4" font-weight="700" fill="#fcd8c3">${escape(text)}</text>` +
        `<rect x="${n(cursorX)}" y="${n(py - 3.2)}" width="3.4" height="6.4" fill="${K.enF}" stroke="${K.gold}" stroke-width=".4">` +
        `<animate attributeName="opacity" values="1;0" keyTimes="0;.55" calcMode="discrete" dur="1.1s" repeatCount="indefinite"/></rect>`,
      w: x + w + 3,
      h: y + hgt + 3,
    }
  },
  bubble: {
    font: SANS,
    size: 9,
    charW: 5.3,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) => {
      const tail = `M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z`
      // A cream enamel bubble in a gold rim on a dark keyline, its tail walled too, a gloss stroke along its top.
      return (
        `<rect x="${n(x + 0.8)}" y="${n(y + 1.3)}" width="${w}" height="${h}" rx="6" fill="#965060" opacity=".22"/>` +
        `<path fill="${K.bar}" stroke="${K.goldDD}" stroke-width="2.4" stroke-linejoin="round" d="${tail}"/>` +
        `<path fill="${K.bar}" stroke="url(#pn-rim)" stroke-width="1.3" stroke-linejoin="round" d="${tail}"/>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="6" fill="${K.bar}" stroke="${K.goldDD}" stroke-width="2.4"/>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="6" fill="none" stroke="url(#pn-rim)" stroke-width="1.3"/>` +
        `<path fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1" stroke-linecap="round" d="M${n(x + 6)} ${n(y + 2.6)}h${n(Math.min(30, w * 0.25))}"/>`
      )
    },
  },
}

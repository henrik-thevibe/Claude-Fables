/**
 * Mid-Century Modern, after the gallery's "Mid-Century Modern (1950s)"
 * (index.html, style 15, `midcentury`), and the look's own source: Charley
 * Harper's nature prints, the 1950s screen-printed posters of birds and
 * woods drawn as flat geometry.
 *
 * The art bible, translated from the gallery's plate to the Fables' worlds:
 *
 * - The medium is flat screen-printed planes and nothing else: no outline,
 *   no gradient, no glow. A form is a few flat shapes of ink, and every form
 *   is split along a straight line into a light plane and a shadow plane.
 *   Where inks overlap a little translucency shows, as one screen over
 *   another. A fine grain lies over the whole print, as on the plate.
 * - The inks are the plate's: banded teal for the sky, a mustard field, sage
 *   and olive greens, a brown-black for trunks, cream and tan for the sun,
 *   coral and rust for Claude, and the cardinal's red. To carry a desert, a
 *   moon and a lab the printer adds what Harper would: terracotta and plum
 *   for mesas, a teal-grey for stone and regolith, walnut for wood, slate for
 *   towers and walls, and lamp yellow.
 * - Skies are horizontal bands of flat ink, stepping lighter toward the
 *   horizon: the plate's teal at dawn, teal into gold and cream at sunset,
 *   teal-black over the moon, plum into ember red over the volcano.
 * - The sun is the plate's disc, split down the middle: cream on the lit
 *   half, tan on the other. The moon is the same disc in cream and a cool
 *   grey-teal; the Earth a split disc of teal sea with flat olive continents.
 *   A low sun and the volcano's glow radiate as concentric flat rings.
 * - Stars are the atomic age's: four-point sparkles in sun cream, the
 *   brighter ones whole atomic starbursts, the faint ones cream specks.
 * - Clouds are flat sage planes with a cream underside; mist is a few long
 *   pills of pale ink laid across the scene; light through the air is a
 *   flat, faint wedge of cream; glare and pools of light are flat ellipses.
 * - Land and rock are printed in a few flat tones by how they were lit, so
 *   every slope and mesa falls into planes of light and shade. A mesa is its
 *   body, its lit side and its lip, with its strata as flat bands of a deeper
 *   ink; the volcano is a triangle split at the apex, warm on its lit half,
 *   its gullies a fan of darker wedges. The far distance prints a step paler.
 * - Foliage is the plate's two greens. Firs are redrawn as Harper firs:
 *   stacked triangles split down the middle, light on the sun's side; the
 *   crowns framing the forest are the plate's lollipop crowns, one flat green
 *   split down the middle, a branch line across. Grass is the plate's mustard
 *   field with its little V-shaped tufts.
 * - Buildings, walls and benches are flat panels in slate, walnut and cream,
 *   lit windows flat squares of lamp yellow. Glass is flat teal; a wet street
 *   or a polished floor is shown, as a print shows water, by a scatter of
 *   broken horizontal strokes.
 * - Fire and lava are flat cardinal red, orange and mustard; lamps flat lamp
 *   yellow; life (motes, fireflies, the hawk, sparks) small flat shapes.
 * - Night keeps the same flat planes in deeper inks: teal-black bands, olive
 *   gone to ochre-brown, the moon's split disc, cream starbursts, and the old
 *   oak as one of the plate's lollipop trees: a brown-black trunk under a
 *   crown split down the middle into two greens, the deeper half away from
 *   the moon, a branch line across it.
 *   The volcano's far ridges go plum under its plum-to-ember sky.
 * - Claude is the plate's Clawd: coral faces each split into a light facet and
 *   a shadow facet, a plain rust belly band, a cream top with a row of coral
 *   dots and cream dots down his sides, ring-and-pupil eyes, and stilt legs:
 *   each tapering to half its width at the foot, split lengthwise into a light
 *   and a deep half, on a dark foot. A red cardinal perches toward the front of
 *   his head, facing the way he looks.
 * - The print sits in a cream mat; the chapter is a slanted mustard tab with
 *   a starburst on a teal disc; the caption a cream card with a flat teal
 *   offset shadow, lettered in a geometric sans.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, type ModelPart, outlinedOrder } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family, Role } from '../art/roles'
import type { Look } from '../looks'

/** The plate's inks, and the few the printer adds, each named once. */
const C = {
  sun: '#f2e1b2',
  sunD: '#e2c68b',
  ground: '#d8a23e',
  groundD: '#bf8b2c',
  grass: '#62803f',
  // The plate's two lollipop greens, each with its shade half.
  treeA: '#71904a',
  treeAD: '#566f36',
  treeB: '#86a25a',
  treeBD: '#68833f',
  trunk: '#4a3a2b',
  trunkL: '#6a4e36',
  coral: '#e27a52',
  coralL: '#ef9b74',
  coralD: '#c9623f',
  band: '#b8543a',
  cream: '#f4e3c7',
  creamL: '#fbf2e1',
  rust: '#b3553a',
  rustL: '#c96846',
  rustD: '#8b402a',
  foot: '#2c221d',
  eye: '#1c1512',
  eyeW: '#fbf4e4',
  red: '#cc2f2a',
  redD: '#9e211d',
  mask: '#1d1714',
  beak: '#ee8e2e',
  // The teals, from the deep of a night sky to the pale of a lit wall.
  tealK: '#0f2a30',
  tealD: '#163a40',
  teal: '#1e4c52',
  tealM: '#275e62',
  tealS: '#22555a',
  sea: '#3f7a76',
  sage: '#6a9a8e',
  pale: '#a8c4b0',
  // Added inks: lamp yellow, slate, tan, walnut, a mesa's strata, night leaves.
  lamp: '#f2c14e',
  slate: '#3a5a60',
  slateL: '#82988e',
  tan: '#c49e68',
  walnut: '#3a2e24',
  strata: '#76423a',
  leafN: '#22382e',
  // Mist and the air: a pale screen by day, a teal-grey one under a dark sky.
  airDay: '#d8dcc4',
  airNight: '#4e6e74',
}

/** The printer's ramps, dark to light, by what they print. */
const R = {
  teal: [C.tealK, C.tealD, C.teal, C.tealM, C.sea, C.sage, C.pale],
  green: ['#2a3a22', '#3d5230', C.treeAD, C.treeBD, C.treeA, C.treeB, '#a3b878'],
  field: ['#5a3e1c', '#8a6022', C.groundD, C.ground, '#e0ae4d', '#ecc477', '#f4dca0'],
  earth: [C.walnut, '#5a4430', '#7a5c3e', '#a07a50', C.tan, '#e2c690'],
  bark: [C.foot, C.walnut, C.trunk, C.trunkL, '#8a6646'],
  // The night oak's trunk: the bark ramp deepened a step under the moon.
  barkN: ['#1a1411', C.foot, C.walnut, C.trunk, C.trunkL],
  stone: ['#1a2628', '#2c3e40', '#455a5a', '#647a76', '#8fa49a', '#bfcab8', '#dfe0cc'],
  mesa: ['#3a2224', '#56302e', C.strata, '#955a46', '#b47452', '#d09464', '#e6b884'],
  slate: ['#14262c', '#1d343a', '#284650', C.slate, '#567472', C.slateL, '#c0c8b4'],
  fire: ['#7a1916', C.redD, C.red, '#e0582a', C.beak, C.lamp, C.sun],
  lamp: [C.beak, C.lamp, '#f4d27a', C.sun, C.creamL],
  cloud: [C.tealD, C.tealS, C.sea, C.sage, C.pale, C.airDay],
  // Night: the same greens and the field, printed in deeper inks under the moon.
  nightGreen: ['#142420', '#1a2e28', C.leafN, '#2c4434', '#3a523c', '#4c6446', '#627a52'],
  nightField: ['#2a2618', '#36301e', '#443c24', '#544a2a', '#665a30', '#7a6c3a', '#908048'],
  // The volcano's far ridges: plum, a step under its plum-to-ember sky.
  plum: ['#1c1420', '#261a28', '#33202f', '#422836', '#53303c', '#663a44', '#7a4a4e'],
  basalt: ['#1a1517', '#251d1f', '#302527', '#3d2e2e', '#4c3936', '#5e4740'],
  smoke: ['#221c22', '#33282c', '#4a3a3a', '#665050', '#8a6e64', '#ae9484'],
  glow: [C.sunD, C.sun, C.creamL],
}

/** The sky's bands, top to horizon, by the scene they hang over. */
const SKIES: Record<string, readonly string[]> = {
  forest: ['#1a434a', C.teal, C.tealS, C.tealM, '#2b6669', '#36706d'],
  desert: [C.teal, C.tealM, '#4f7a6c', '#c7a463', '#e2c27e', '#f0d9a0'],
  city: ['#132e38', '#173742', '#1c404a', '#244a52', '#4e625e', '#b88a5e'],
  space: ['#0a171b', '#0c1c21', '#0f2227', '#11272d', '#142d33', '#173339'],
  volcano: ['#15171f', '#1b1b24', '#241e27', '#312229', '#46282a', '#64302a'],
  night: ['#0d2030', '#102636', '#142d3d', '#173444', '#1b3b4a', '#224553'],
}
const SKY_TOP = SKIES.forest?.[0] ?? C.teal

/**
 * Scenes printed in the deep inks. The lab is a lit interior, but its walls are
 * deep teal and its window looks out on the night, so its mist and air take the
 * dark screen too: a pale one would wash the wall out.
 */
const DARK = new Set(['space', 'volcano', 'night', 'lab'])

/** The scene and the role being painted: a printer picks its inks by what it prints. */
let scene = ''
let role = ''
const dark = () => DARK.has(scene)

/** Lightness spread out, so the dim lit scenes still use the whole of a ramp. */
const lift = (l: number) => Math.min(1, Math.pow(l, 0.8) * 1.1)

/** Browns and tans: earth, sand, wood, unlit but warm. */
function brownish(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r > b + 16
}

/** A lit color as the nearest flat ink of the print. */
function ink(color: string, family: Family, depth: number): string {
  const l = lum(color)
  const warm = isWarm(color)
  const green = isGreen(color)
  // The far distance prints a step paler.
  const t = Math.min(1, lift(l) + (depth < 0.25 ? 0.12 : 0))
  switch (family) {
    case 'sky':
      return step(R.teal, t)
    case 'cloud':
      return scene === 'volcano' ? step(R.smoke, t) : warm ? step(R.glow, t) : step(R.cloud, t)
    case 'air':
      return dark() ? C.airNight : C.airDay
    case 'stars':
      return C.sun
    case 'body':
    case 'beam':
    case 'glow':
      return warm ? step(R.lamp, t) : step(R.glow, t)
    case 'fire':
      return step(R.fire, l)
    case 'lamp':
      return warm || l > 0.55 ? step(R.lamp, l) : step(R.slate, t)
    case 'life':
      return warm ? step(R.fire, Math.max(0.5, l)) : green ? step(R.green, t) : step(R.glow, t)
    case 'foliage':
      return step(scene === 'night' ? R.nightGreen : R.green, t)
    case 'grass':
      if (role.endsWith('meadow')) return step(scene === 'night' ? R.nightField : R.field, t)
      return step(scene === 'night' ? R.nightGreen : R.green, t * 0.9)
    case 'bark':
      return step(R.bark, t)
    case 'land':
      if (scene === 'night') return step(R.nightGreen, t)
      if (scene === 'volcano') return step(R.plum, t)
      return green || scene === 'forest' ? step(R.green, t) : warm || brownish(color) ? step(R.mesa, t) : step(R.stone, t)
    case 'ground':
    case 'mark':
      if (scene === 'desert') return step(R.field, t * 0.82)
      if (scene === 'volcano') return warm && l > 0.5 ? step(R.fire, l) : step(R.basalt, t)
      if (scene === 'night') return step(R.nightField, t)
      if (scene === 'forest' || scene === 'lab') return step(R.earth, t)
      if (scene === 'city') return step(R.slate, t)
      // The moon's regolith prints a step deeper, a teal-grey under the black.
      return warm && l > 0.3 ? step(R.fire, l) : step(R.stone, t * 0.82)
    case 'rock':
      if (scene === 'desert') return step(R.mesa, t)
      if (scene === 'volcano') return step(R.basalt, t * 1.4)
      return warm || brownish(color) ? step(R.mesa, t) : step(R.stone, t)
    case 'built':
      return warm || brownish(color) ? step(R.earth, t) : step(R.slate, t)
    case 'glass':
      return warm && l > 0.45 ? step(R.lamp, l * 0.6) : step(R.teal, t)
    case 'water':
      return step(R.teal, t)
    case 'shadow':
      return C.foot
    default:
      return step(R.teal, t)
  }
}

/** A small seeded sequence, so the same stage prints the same way every time. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// ---------------------------------------------------------------- the scenery

/** The sky in horizontal bands of flat ink, lighter toward the horizon. */
function sky(_svg: string, c: Ctx): string {
  const bands = SKIES[scene] ?? SKIES.forest ?? []
  const sw = c.meta.sw ?? 640
  const bh = 104 / bands.length
  return bands.map((b, i) => `<rect y="${n(i * bh)}" width="${n(sw)}" height="${n(i === bands.length - 1 ? 128 - i * bh : bh + 0.5)}" fill="${b}"/>`).join('')
}

/** A disc split down the middle: its lit half and its shadow half, as the plate's sun. */
function splitDisc(cx: number, cy: number, r: number, lit: string, shade: string): string {
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${lit}"/>` +
    `<path fill="${shade}" d="M${n(cx)} ${n(cy - r)}a${n(r)} ${n(r)} 0 0 1 0 ${n(r * 2)}z"/>`
  )
}

/** Concentric flat rings of ink, the mid-century way to draw radiance. */
const rings = (cx: number, cy: number, radii: readonly number[], fill: string, opacity: number) =>
  `<g fill="${fill}" opacity="${opacity}">${radii.map(r => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`).join('')}</g>`

/** The sun, the moon and the Earth: split discs. */
function body(_svg: string, c: Ctx): string {
  const cx = c.meta.cx ?? 0
  const cy = c.meta.cy ?? 0
  const r = c.meta.r ?? 8
  if (c.role === 'space.earth') {
    // A teal sea with flat olive continents and a cream band of weather; its night half a dark screen over it.
    return (
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${C.sea}"/>` +
      `<path fill="${C.treeA}" d="M${n(cx - r * 0.7)} ${n(cy - r * 0.45)}l${n(r * 0.5)} ${n(-r * 0.25)} ${n(r * 0.25)} ${n(r * 0.3)} ${n(-r * 0.1)} ${n(r * 0.45)} ${n(-r * 0.45)} ${n(r * 0.2)}z` +
      `M${n(cx + r * 0.05)} ${n(cy + r * 0.05)}l${n(r * 0.55)} ${n(-r * 0.2)} ${n(r * 0.2)} ${n(r * 0.45)} ${n(-r * 0.35)} ${n(r * 0.4)}z"/>` +
      `<path fill="none" stroke="${C.creamL}" stroke-width="${n(r * 0.08)}" stroke-linecap="round" d="M${n(cx - r * 0.55)} ${n(cy + r * 0.35)}h${n(r * 0.6)}M${n(cx - r * 0.2)} ${n(cy - r * 0.68)}h${n(r * 0.5)}"/>` +
      `<path fill="${C.tealK}" opacity=".5" d="M${n(cx + r * 0.15)} ${n(cy - r * 0.99)}a${n(r)} ${n(r)} 0 0 1 0 ${n(r * 1.98)}a${n(r * 0.75)} ${n(r)} 0 0 0 0 ${n(-r * 1.98)}z"/>`
    )
  }
  if (c.role === 'night.moon') return rings(cx, cy, [r * 2.6], '#2b5560', 0.35) + splitDisc(cx, cy, r * 1.35, C.sun, '#a9b8a4')
  if (c.meta.part === 'halo') return c.role === 'desert.sun' ? rings(cx, cy, [r * 3.6, r * 2.5], C.creamL, 0.16) : ''
  return splitDisc(cx, cy, r * (c.role === 'forest.sun' ? 2.5 : 1.6), C.sun, C.sunD)
}

/**
 * Stars of the atomic age: the faint ones cream specks, the bright ones
 * four-point sparkles, the twinkling ones whole starbursts that keep their twinkle.
 */
function stars(svg: string, c: Ctx): string {
  if (c.role === 'space.milkyway') {
    // The Milky Way: a flat band of paler ink across the sky, dusted with specks.
    return c
      .repaint(svg)
      .replace(/<ellipse\b([^>]*?)\sfill="[^"]*"([^>]*)\/>/, `<ellipse$1 fill="#1d3c42"$2 opacity=".7"/>`)
      .replace(/\sopacity="\.45"/, ' opacity=".3"')
  }
  const at = (d: string, id: string) => [...d.matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => `<use href="#${id}" x="${t1(Number(m[1]) + 0.5)}" y="${t1(Number(m[2]) + 0.5)}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<path\b([^>]*?)>(<animate\b[\s\S]*?)<\/path>/g, (all, attrs: string, kids: string) => {
      if (/\sstroke=/.test(attrs)) return all
      const d = /\sd="([^"]*)"/.exec(attrs)?.[1] ?? ''
      return `<g fill="${C.sun}">${at(d, 'mc-sb')}${kids}</g>`
    })
    .replace(/<path\b([^>]*?)\/>/g, (all, attrs: string) => {
      // A bright star's diffraction cross becomes a starburst.
      const spike = /\sd="M([\d.-]+) ([\d.-]+)h7M/.exec(attrs)
      if (spike) return `<use href="#mc-sb" x="${t1(Number(spike[1]) + 3.5)}" y="${spike[2]}" fill="${C.sun}"/>`
      if (/\sstroke=/.test(attrs)) return all
      const op = Number(/\sopacity="([\d.]+)"/.exec(attrs)?.[1] ?? 1)
      if (op < 0.5) return all
      const d = /\sd="([^"]*)"/.exec(attrs)?.[1] ?? ''
      return `<g fill="${C.sun}">${at(d, 'mc-st')}</g>`
    })
}

/** Mist as long flat pills of pale ink, staggered across the band it fills. */
function mist(svg: string, c: Ctx): string {
  const sw = c.meta.sw ?? 640
  const y = c.meta.y ?? 80
  const h = c.meta.h ?? 12
  const rand = seeded(Math.round(y * 31 + h))
  const thick = Math.max(2, Math.min(5, h * 0.28))
  let pills = ''
  for (let row = 0; row < (c.meta.lean || h < 12 ? 1 : 2); row++) {
    for (let x = -20 + rand() * 40 + row * 45; x < sw + 20; ) {
      const len = 40 + rand() * 90
      pills += `<rect x="${t1(x)}" y="${t1(y + h * (row ? 0.62 : 0.3) + (rand() - 0.5) * 2)}" width="${t1(len)}" height="${t1(thick)}" rx="${t1(thick / 2)}"/>`
      x += len + 20 + rand() * 70
    }
  }
  const op = c.meta.veil ? 0.18 : dark() ? 0.22 : 0.32
  return `<g fill="${dark() ? C.airNight : C.airDay}" opacity="${op}">${pills}${c.motion(svg)}</g>`
}

/** A wet street or a polished floor, as a print shows water: broken horizontal strokes. */
function water(_svg: string, c: Ctx): string {
  const sw = c.meta.sw ?? 640
  const y = c.meta.y ?? 104
  const h = c.meta.h ?? 20
  const rand = seeded(Math.round(y * 7 + sw))
  const strokes = ['', '']
  const count = Math.round(sw / 22)
  for (let i = 0; i < count; i++) {
    const yy = y + 2 + rand() * (h - 4)
    strokes[i % 2] += `M${t1(rand() * sw)} ${t1(yy)}h${t1(4 + rand() * 14 * (0.5 + (yy - y) / h))}`
  }
  return (
    `<path fill="none" stroke="${scene === 'lab' ? C.tan : C.slate}" stroke-width=".8" opacity=".7" d="${strokes[0]}"/>` +
    `<path fill="none" stroke="${scene === 'lab' ? C.slateL : C.lamp}" stroke-width=".7" opacity=".5" d="${strokes[1]}"/>`
  )
}

/**
 * The sc-firN templates' height: the tip stands at y = -60 and the crown meets
 * the trunk 51 below it, at -9, so a redrawn fir fills the place the lit one did.
 */
const FIR_TOP = -60
const FIR_H = 51
/** Per sc-fir variant, 0 to 5: how many tiers it is stacked of, and the bottom tier's half width. */
const FIR_TIERS = [3, 2, 4, 3, 2, 1]
const FIR_W = [12, 13, 11, 14, 12, 8]
/** Each tier overlaps the one above by half its height. */
const FIR_STEP = 0.5

/** A Harper fir: stacked triangles split down the middle, its body in the placement's fill, its shade half in its color. */
function fir(k: number): string {
  const tiers = FIR_TIERS[k] ?? 3
  const w = FIR_W[k] ?? 12
  // A tier's height, so that `tiers` tiers, each starting FIR_STEP of a tier below the last, span FIR_H.
  const H = FIR_H / (1 + FIR_STEP * (tiers - 1))
  let body = ''
  let shade = ''
  for (let i = 0; i < tiers; i++) {
    const top = FIR_TOP + i * H * FIR_STEP
    const hw = w * (0.45 + (0.55 * (i + 1)) / tiers)
    body += `M0 ${t1(top)}L${t1(hw)} ${t1(top + H)}H${t1(-hw)}z`
    shade += `M0 ${t1(top)}V${t1(top + H)}H${t1(-hw)}z`
  }
  return `<path d="${body}"/><path fill="currentColor" d="${shade}"/>`
}

/** The plate's grass: tufts of three straight blades in a V, as filled slivers for a template filled by its placements. */
function tuft(k: number): string {
  const s = [1.6, 1.9, 1.4, 2.1, 1.7][k] ?? 1.7
  const blade = (x: number, dx: number, h: number) => `M${t1((x - 0.5) * s)} 0L${t1((x + dx) * s)} ${t1(-h * s)}L${t1((x + 0.5) * s)} 0z`
  return blade(-2.2, -2.4, 4.4) + blade(0, 0.4, 6) + blade(2.2, 2.6, 4.8)
}

/** The cone's inks: its half lit from the crater, its shade half, its gullies. */
const CONE_LIT = '#5a3c34'
const CONE_SHADE = '#2e2224'
const CONE_GULLY = '#1f1719'

/** The box a crown's clumps fill: each clump starts at its left edge and spans twice its radius. */
function crownBox(d: string): { x0: number; x1: number; y0: number; y1: number } | undefined {
  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity
  for (const m of d.matchAll(/M([\d.-]+) ([\d.-]+)a([\d.]+) ([\d.]+)/g)) {
    const [x, y, rx, ry] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
    x0 = Math.min(x0, x)
    x1 = Math.max(x1, x + rx * 2)
    y0 = Math.min(y0, y - ry)
    y1 = Math.max(y1, y + ry)
  }
  return Number.isFinite(x0) ? { x0, x1, y0, y1 } : undefined
}

/**
 * A crown as Harper cuts one: the clumps' silhouette in one flat green, its half
 * away from the light laid over in a deeper green, split down the middle, and a
 * branch line across it. `id` names the silhouette, drawn once and used again.
 */
function crown(d: string, id: string, lit: string, shade: string): string {
  const b = crownBox(d)
  if (!b) return `<path fill="${lit}" d="${d}"/>`
  const cx = (b.x0 + b.x1) / 2
  const cy = (b.y0 + b.y1) / 2
  const rx = (b.x1 - b.x0) / 2
  const ry = (b.y1 - b.y0) / 2
  return (
    `<clipPath id="${id}h"><rect x="${n(b.x0 - 4)}" y="${n(b.y0 - 2)}" width="${n(rx + 4)}" height="${n(ry * 2 + 4)}"/></clipPath>` +
    `<path id="${id}" fill="${lit}" d="${d}"/><use href="#${id}" fill="${shade}" clip-path="url(#${id}h)"/>` +
    `<path fill="none" stroke="${shade}" stroke-width="2" stroke-linecap="round" d="M${n(cx + rx * 0.45)} ${n(cy - ry * 0.2)}L${n(cx)} ${n(cy + ry * 0.25)}"/>`
  )
}

/**
 * The night's oak as Harper prints a tree. Its trunk takes the bark inks, deepened
 * under the moon and stepped by how lit the lit painting had each piece; its crown
 * is a split crown, its shade half away from the moon. The lit painting's moonlit
 * caps are not printed.
 */
function oak(svg: string, c: Ctx): string {
  const bark = /<g filter="url\(#sc-oakbark\)">([\s\S]*?)<\/g>/.exec(svg)?.[1]
  const leaves = /<g filter="url\(#sc-oakleaves\)"><path fill="[^"]*" d="([^"]*)"\/>/.exec(svg)?.[1]
  if (!bark || !leaves || !crownBox(leaves)) return c.repaint(svg)
  const trunk = bark.replace(/\sfill="(#[0-9a-fA-F]{6})"/g, (_all, col: string) => ` fill="${step(R.barkN, lum(col))}"`)
  return `<g>${trunk}</g>` + crown(leaves, 'mc-oak', R.nightGreen[5] ?? C.leafN, R.nightGreen[3] ?? C.leafN)
}

/** The forest's framing crowns, cropped by the stage's corners: split crowns in the plate's two greens. */
function canopy(svg: string, c: Ctx): string {
  // Each side is a crown of clumps and its underside; only the crowns are printed.
  const ds = [...svg.matchAll(/<path fill="[^"]*" d="([^"]*)"\/>/g)].map(m => m[1] ?? '')
  const crowns = [ds[0], ds[2]].filter((d): d is string => !!d && !!crownBox(d))
  if (crowns.length < 2) return c.repaint(svg)
  return crowns.map((d, i) => crown(d, `mc-crown${i}`, C.treeB, C.treeAD)).join('')
}

const scenery = () => {
  scene = ''
  role = ''
  const p = painter(
    {
      ink: (color, family, depth) => ink(color, family, depth),
      // A gradient of the lit scene prints as one flat ink, its overall tone; a faint wash is not printed.
      url: (_id, family, attr, g) => {
        if (!g) return undefined
        const mean = meanOf(g)
        // A line takes the gradient's overall tone; a radial wash of light is not printed.
        if (attr === 'stroke') return ink(mean.color, family, 0.5)
        if (g.tag === 'radialGradient') return 'none'
        return mean.opacity < 0.45 ? 'none' : ink(mean.color, family, 0.5)
      },
      // Inks are opaque; a faint wash prints as a thin screen, the faintest not at all.
      opacity: (family, v) => (family === 'stars' || family === 'mark' ? v : v >= 0.45 ? 1 : v < 0.15 ? 0 : v),
      redraw: {
        sky,
        stars,
        body,
        lens: () => '',
        air: mist,
        water,
        // Light through the air: a flat, faint wedge of cream.
        beam: (svg, c) => `<g opacity=".13">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${C.creamL}"`)}</g>`,
        // Glare and pools of light: flat pale shapes; the volcano's glow, concentric rings.
        glow: (svg, c) =>
          c.role === 'volcano.glow'
            ? rings(c.meta.cx ?? 320, (c.meta.cy ?? 40) + 10, [150, 105, 68, 38], '#b8432a', 0.13)
            : `<g opacity=".22">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${C.sun}"`)}</g>`,
        // The meadows are the plate's mustard field, set with its V-shaped tufts.
        'forest.meadow': (svg, c) => c.repaint(svg) + `<rect y="${n(c.meta.y ?? 96)}" width="${n(c.meta.sw ?? 640)}" height="${n(128 - (c.meta.y ?? 96))}" fill="url(#mc-tuft)"/>`,
        'night.meadow': (svg, c) => c.repaint(svg) + `<rect y="${n(c.meta.y ?? 96)}" width="${n(c.meta.sw ?? 640)}" height="${n(128 - (c.meta.y ?? 96))}" fill="url(#mc-tuftn)"/>`,
        // The grass clumps along the path and the front edge become the plate's V tufts.
        'forest.grass': (svg, c) => c.repaint(svg.replace(/<path id="sc-clump(\d)" d="[^"]*"\/>/g, (_all, k: string) => `<path id="sc-clump${k}" d="${tuft(Number(k))}"/>`)),
        // A mesa is cut in flat planes, its body, its lit side and its lip: the lit painting's gullies and joints are not printed.
        // The near rank shows its strata as flat bands of a deeper ink.
        'desert.mesas': (svg, c) => {
          const body = /fill="url\(#sc-rockshade\)" d="([^"]*)"/.exec(svg)?.[1] ?? ''
          const out = c.repaint(svg.replace(/<path fill="none" stroke="[^"]*"[^>]*\/>/g, ''))
          return out.replace(/(<path fill="[^"]*" d="[^"]*"\/>)/, `$1<path fill="url(#mc-strata)" d="${body}"/>`)
        },
        'desert.mesas-far': (svg, c) => c.repaint(svg.replace(/<path fill="none" stroke="[^"]*"[^>]*\/>/g, '')),
        // The cone, as Harper would cut it: a triangle split at the apex, its lit half warm from the crater,
        // a fan of darker wedges for its gullies.
        'volcano.cone': (_svg, c) => {
          const x = c.meta.cx ?? 400
          const y = c.meta.cy ?? 40
          // Sizes, in stage units: the gullies' spacing where they reach the ground, the fan's reach
          // from the apex to below the plain, and the halves' reach, a little past it; the halves start
          // a little above the apex, so the crater's rim sits on them, and are wider than any cone.
          const GULLY = 22
          const FAN = 130
          const ABOVE = 4
          const DEEP = 140
          const HALF = 300
          let fan = ''
          for (let k = -7; k <= 7; k += 2) fan += `M${n(x)} ${n(y)}L${n(x + k * GULLY)} ${n(y + FAN)}h${n(14 + Math.abs(k) * 2)}z`
          return (
            `<clipPath id="mc-cone"><path d="${c.meta.d ?? ''}"/></clipPath>` +
            `<g clip-path="url(#mc-cone)"><rect x="${n(x - HALF)}" y="${n(y - ABOVE)}" width="${HALF * 2}" height="${DEEP}" fill="${CONE_LIT}"/>` +
            `<rect x="${n(x)}" y="${n(y - ABOVE)}" width="${HALF}" height="${DEEP}" fill="${CONE_SHADE}"/>` +
            `<path fill="${CONE_GULLY}" opacity=".55" d="${fan}"/></g>`
          )
        },
        // The night's oak and the forest's framing crowns, as Harper cuts a tree.
        'night.oak': oak,
        'forest.canopy': canopy,
        // The concrete wall is a flat teal panel; the lamp's light on it, concentric rings of a paler ink.
        'lab.wall': (svg, c) =>
          c.repaint(svg) + `<g clip-path="url(#mc-wall)">${rings(c.meta.cx ?? 300, c.meta.y ?? 90, [120, 78, 44], C.pale, 0.1)}</g>` +
          `<clipPath id="mc-wall"><rect width="${n(c.meta.sw ?? 640)}" height="${n(c.meta.y ?? 90)}"/></clipPath>`,
      },
    },
    'mc',
  )
  return {
    el: (r: Role, svg: string, meta?: Parameters<typeof p.el>[2]) => {
      role = r
      const s = r.split('.')[0] ?? ''
      if (r !== 'particles' && r !== 'lens') scene = s
      return p.el(r, svg, meta)
    },
    // The forest's firs are redrawn as Harper's, and their warm rims and the trunks' lit slivers left out.
    defs: (svg: string) =>
      p.defs(
        svg
          .replace(/<g id="sc-fir(\d)">[\s\S]*?<\/g>/g, (_all, k: string) => `<g id="sc-fir${k}">${fir(Number(k))}</g>`)
          .replace(/<path id="sc-(firrim\d|trunkkey)"[^>]*\/>/g, (_all, id: string) => `<path id="sc-${id}" d=""/>`)
          // A fern's frond is a single long leaf split along its rib, as Harper cuts a leaf.
          .replace(/<path id="sc-frond" d="[^"]*"\/>/, `<path id="sc-frond" d="M0 0Q5 -14 1 -30Q-4 -15 0 0z"/>`),
      ),
  }
}

// ---------------------------------------------------------------- Claude

/** Each of Claude's faces is a flat paint, its light and shadow facets laid in once, in the definitions. */
const FACE: Record<string, Record<string, string>> = {
  body: { front: 'url(#mc-f)', top: 'url(#mc-t)', left: 'url(#mc-sl)', right: 'url(#mc-sr)', back: C.coralD, bottom: C.rustD },
  arm: { front: 'url(#mc-af)', top: C.cream, left: 'url(#mc-as)', right: 'url(#mc-as)', back: C.coralD, bottom: C.rustD },
}

type P = readonly [number, number]
const mid = (qs: readonly P[]): [number, number] => [qs.reduce((t, q) => t + q[0], 0) / qs.length, qs.reduce((t, q) => t + q[1], 0) / qs.length]

/** The stilt's taper: its foot is this much of its top's width; the dark foot is this much of its length. */
const STILT_TAPER = 0.5
const STILT_FOOT = 0.16

/**
 * A leg as the plate's stilt: a quad tapering from the leg's full width where it
 * meets the hull to half at the foot, split lengthwise into a light and a deep
 * half, with a dark foot below. The leg's box gives its eight corners; the four
 * highest on screen are its top.
 */
function stilt(edges: ModelPart['edges'], light: string, deep: string, cx: number, floor: number): string {
  const seen = new Map<string, P>()
  for (const e of edges) for (const q of [e.a, e.b]) seen.set(`${q[0]} ${q[1]}`, q)
  const cs = [...seen.values()].sort((a, b) => a[1] - b[1])
  if (cs.length < 8) return ''
  const tops = cs.slice(0, 4)
  const T = mid(tops)
  const F = mid(cs.slice(4))
  const len = Math.hypot(F[0] - T[0], F[1] - T[1]) || 1
  const ux = (F[0] - T[0]) / len
  const uy = (F[1] - T[1]) / len
  const w0 = (Math.max(...tops.map(q => q[0])) - Math.min(...tops.map(q => q[0]))) / 2
  const w1 = w0 * STILT_TAPER
  // A point `w` across the stilt from `q`: k = 1 toward the lit side (-x for a leg standing upright), -1 the other way.
  const at = (q: P, k: number, w: number): P => [q[0] - uy * w * k, q[1] + ux * w * k]
  const B: P = [F[0] - ux * len * STILT_FOOT, F[1] - uy * len * STILT_FOOT]
  const wf = w1 * 1.25
  return (
    `<path fill="${light}" d="${poly([at(T, 1, w0), T, F, at(F, 1, w1)], cx, floor)}"/>` +
    `<path fill="${deep}" d="${poly([T, at(T, -1, w0), at(F, -1, w1), F], cx, floor)}"/>` +
    `<path fill="${C.foot}" d="${poly([at(B, 1, wf), at(B, -1, wf), at(F, -1, wf), at(F, 1, wf)], cx, floor)}"/>`
  )
}

/** The cardinal's perch: on the top face, toward its front edge and to the side Claude faces. */
const PERCH_FRONT = 0.4
const PERCH_SIDE = 0.25

/** Claude as the plate draws Clawd: faceted coral planes, stilt legs, ring eyes, a cardinal on his head. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const xs = m.shadow.map(p => p[0])
  const ys = m.shadow.map(p => p[1])
  const sx0 = Math.min(...xs)
  const sx1 = Math.max(...xs)
  const sy0 = Math.min(...ys)
  const sy1 = Math.max(...ys)
  let out = `<ellipse cx="${t1((sx0 + sx1) / 2 + cx)}" cy="${t1((sy0 + sy1) / 2 + floor)}" rx="${t1((sx1 - sx0) / 2)}" ry="${t1((sy1 - sy0) / 2)}" fill="${C.foot}" opacity=".22"/>`
  let legs = 0
  let top: readonly P[] | undefined
  let facing = 0
  for (const pt of outlinedOrder(m)) {
    // A leg is a two-tone stilt with a dark foot, the far pair a shade deeper.
    if (pt.name === 'leg') {
      const far = legs++ < 2
      out += stilt(pt.edges, far ? C.rust : C.rustL, far ? C.rustD : C.rust, cx, floor) || `<path fill="${C.rust}" d="${poly(pt.hull, cx, floor)}"/>`
      continue
    }
    if (pt.name === 'body') {
      // Which way he faces: where his front (or, turned away, his back) lies from his middle.
      const c0 = mid(pt.hull)
      for (const f of pt.faces) if (f.name === 'front' || f.name === 'back') facing = (mid(f.pts)[0] - c0[0]) * (f.name === 'front' ? 1 : -1)
    }
    for (const f of pt.faces) {
      out += `<path fill="${FACE[pt.name]?.[f.name] ?? C.coral}" d="${poly(f.pts, cx, floor)}"/>`
      if (pt.name === 'body' && f.name === 'top') top = f.pts
    }
  }
  for (const e of m.eyes) {
    if (e.poly) {
      // A ring, a white and a pupil with a glint, sized to the eye the model shows.
      const ex = e.poly.map(q => q[0])
      const ey = e.poly.map(q => q[1])
      const x0 = Math.min(...ex)
      const x1 = Math.max(...ex)
      const y0 = Math.min(...ey)
      const y1 = Math.max(...ey)
      out += `<use href="#mc-e" transform="matrix(${t1((x1 - x0) / 1.2)} 0 0 ${t1((y1 - y0) / 2)} ${t1((x0 + x1) / 2 + cx)} ${t1((y0 + y1) / 2 + floor)})"/>`
    } else out += `<path fill="none" stroke="${C.eye}" stroke-width="1.1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`
  }
  // The cardinal perches on his head, facing where he looks.
  if (top) {
    const c0 = mid(top)
    const front = mid([...top].sort((a, b) => b[1] - a[1]).slice(0, 2))
    const w = Math.max(...top.map(q => q[0])) - Math.min(...top.map(q => q[0]))
    const dir = facing > 0.3 ? 1 : -1
    const x = c0[0] + (front[0] - c0[0]) * PERCH_FRONT + dir * w * PERCH_SIDE * 0.5 + cx
    const y = c0[1] + (front[1] - c0[1]) * PERCH_FRONT + floor + 0.6
    out += `<use href="#mc-c" transform="matrix(${-dir} 0 0 1 ${t1(x)} ${t1(y)})"/>`
  }
  return out
}

// ---------------------------------------------------------------- the print around the scene

const SANS = "Futura, 'Century Gothic', 'Avenir Next', 'Trebuchet MS', sans-serif"

/** A four-point sparkle or an eight-ray starburst centred on 0 0, `r` from its centre to a point. */
function starPath(r: number, rays: number, waist: number): string {
  const pts: string[] = []
  for (let i = 0; i < rays * 2; i++) {
    const a = (i * Math.PI) / rays - Math.PI / 2
    const q = i % 2 ? r * waist : r * (rays > 4 && (i / 2) % 2 ? 0.55 : 1)
    pts.push(`${n(Math.cos(a) * q)} ${n(Math.sin(a) * q)}`)
  }
  return `M${pts.join('L')}z`
}

/** A box paint: shapes in the unit square stretched over each face it fills, so a face is one path in every pose. */
const box = (id: string, shapes: string) => `<pattern id="${id}" width="1" height="1" patternContentUnits="objectBoundingBox">${shapes}</pattern>`
const sq = (fill: string) => `<path fill="${fill}" d="M0 0h1v1H0z"/>`
const dots = (fill: string, pts: readonly (readonly [number, number])[], rx: number, ry: number) =>
  `<g fill="${fill}">${pts.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`

/** The definitions the whole print draws with, laid down once under the stage. */
function defs(): string {
  const sides = (base: string, deep: string, dot: string) =>
    sq(base) + `<path fill="${deep}" d="M0 1h1V.28z"/><path fill="${deep}" d="M0 .78h1V1H0z"/>` + dots(dot, [[0.5, 0.24], [0.5, 0.41], [0.5, 0.58]], 0.09, 0.03)
  const split = (id: string, a: string, b: string) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/></linearGradient>`
  return (
    // Claude's faces: the front with its light facet, its shadow facet and the belly band; the cream top with its dots; the sides.
    box('mc-f', sq(C.coral) + `<path fill="${C.coralL}" d="M0 0h.56L0 .66z"/><path fill="${C.coralD}" d="M1 .78V.34L.6 .78z"/><path fill="${C.band}" d="M0 .8h1V1H0z"/>`) +
    box('mc-t', sq(C.cream) + `<path fill="${C.creamL}" d="M0 0h.72L0 .82z"/>` + dots(C.coralL, [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map(x => [x, 0.5] as const), 0.022, 0.14)) +
    box('mc-sl', sides(C.rustL, C.rust, C.cream)) +
    box('mc-sr', sides(C.rust, C.rustD, C.cream)) +
    split('mc-af', C.coral, C.coralD) +
    split('mc-as', C.rust, C.rustD) +
    // The eye: a dark ring, a white and a pupil with a glint, in the model's units.
    `<g id="mc-e"><circle r="1.2" fill="${C.eye}"/><circle r=".86" fill="${C.eyeW}"/><circle cx=".12" cy=".08" r=".46" fill="${C.eye}"/><circle cx=".26" cy="-.06" r=".14" fill="${C.eyeW}"/></g>` +
    // The cardinal, after the plate's, its beak to the left (a placement mirrors it to face right); its feet at 0 0.
    `<g id="mc-c" transform="scale(.36)"><path fill="none" stroke="${C.mask}" stroke-width="1.4" d="M-1.2 -2.8L-1.6 0M1.8 -2.8L2.2 0"/>` +
    `<path fill="${C.redD}" d="M4.5 -8.5L16.5 -2L13.6 1.2L3.2 -5.6z"/>` +
    `<ellipse cx=".5" cy="-8.2" rx="8.4" ry="6.1" transform="rotate(-17 .5 -8.2)" fill="${C.red}"/>` +
    `<circle cx="-5.4" cy="-14.4" r="5.2" fill="${C.red}"/><path fill="${C.red}" d="M-8.6 -17.4L-2.4 -25.8L-1.6 -16.2z"/>` +
    `<ellipse cx="2.4" cy="-8.8" rx="6.4" ry="3.1" transform="rotate(-24 2.4 -8.8)" fill="${C.redD}"/>` +
    `<path fill="${C.mask}" d="M-11.8 -16.4L-6.6 -18.6L-4.6 -13.4L-9.6 -11.4z"/><path fill="${C.beak}" d="M-10.6 -17.2L-16.4 -14.4L-10.6 -12.2z"/>` +
    `<circle cx="-7.4" cy="-15.6" r="1.1" fill="${C.cream}"/></g>` +
    // Stars of the atomic age.
    `<path id="mc-st" d="${starPath(1.8, 4, 0.3)}"/>` +
    `<path id="mc-sb" d="${starPath(3.6, 8, 0.2)}"/>` +
    // A mesa's strata: flat bands of a deeper ink.
    `<pattern id="mc-strata" width="8" height="7" patternUnits="userSpaceOnUse"><path fill="${C.strata}" opacity=".45" d="M0 2h8v1.6H0z"/></pattern>` +
    // The plate's tufts on its mustard field, by day and by night.
    `<pattern id="mc-tuft" width="46" height="13" patternUnits="userSpaceOnUse"><path fill="none" stroke="${C.grass}" stroke-width=".7" stroke-linecap="round" d="M5 7.5l1.1 2.4.7-3.2m0 3.2l1.8-2.6M29 11.5l1.1 2.4.7-3.2m0 3.2l1.8-2.6M38 4.5l.9 2 .6-2.6m0 2.6l1.5-2.1"/></pattern>` +
    `<pattern id="mc-tuftn" width="46" height="13" patternUnits="userSpaceOnUse"><path fill="none" stroke="${C.leafN}" stroke-width=".7" stroke-linecap="round" d="M5 7.5l1.1 2.4.7-3.2m0 3.2l1.8-2.6M29 11.5l1.1 2.4.7-3.2m0 3.2l1.8-2.6M38 4.5l.9 2 .6-2.6m0 2.6l1.5-2.1"/></pattern>` +
    // The print's grain: light and dark specks, as the plate's.
    `<pattern id="mc-grain" width="11" height="9" patternUnits="userSpaceOnUse"><g fill="#fff"><rect x="1" y="2" width=".6" height=".6"/><rect x="6.5" y="6" width=".6" height=".6"/><rect x="9" y="1" width=".6" height=".6"/></g>` +
    `<g fill="#000"><rect x="3.5" y="4.5" width=".6" height=".6"/><rect x="8" y="7.8" width=".6" height=".6"/></g></pattern>`
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const MIDCENTURY: Look = {
  name: 'midcentury',
  label: 'Mid-Century Modern',
  voice: 'a breezy 1950s nature print, all clean shapes',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 5.3,
  caption: { fill: C.cream, stroke: C.teal, ink: C.foot, radius: 6 },
  paper: { card: C.cream, ink: C.foot, kinds: { code: '#1f6a66', path: '#2e5a8a', fn: '#7a3a6a', num: '#b0501a', bad: '#b3261e', good: '#4d6e22', face: '#c4512f' } },
  inset: 4,
  titleColor: C.cream,
  art: {
    painter: scenery,
    hero,
    sky: SKY_TOP,
    ground: C.groundD,
    defs,
  },
  texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#mc-grain)" opacity=".09"/>`,
  // A cream mat round the print.
  frame: (sw, h) => `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${C.cream}" stroke-width="3"/>`,
  tag: (text, inset) => {
    // The chapter on a slanted mustard tab, a cream starburst on a teal disc at its head.
    const t = escape(text.toUpperCase())
    const x = inset + 5
    const y = inset + 4
    const w = text.length * 6.3 + 16
    return {
      svg:
        `<path fill="${C.ground}" d="M${x + 8} ${y + 1}h${n(w)}l-4 12h${n(-w)}z"/>` +
        `<circle cx="${x + 7}" cy="${y + 7}" r="8" fill="${C.teal}"/>` +
        `<use href="#mc-sb" transform="translate(${x + 7} ${y + 7}) scale(1.75)" fill="${C.sun}"/>` +
        `<text x="${x + 19}" y="${y + 10}" font-family="${SANS}" font-size="7.5" font-weight="700" letter-spacing="1.3" fill="${C.foot}">${t}</text>`,
      w: x + w + 12,
      h: y + 17,
    }
  },
  bubble: {
    font: SANS,
    size: 9,
    charW: 5.3,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A cream card on a flat teal offset shadow, its tail cut in cream.
      `<rect x="${n(x + 2.5)}" y="${n(y + 2.5)}" width="${w}" height="${h}" rx="5" fill="${C.teal}"/>` +
      `<path fill="${C.cream}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="5" fill="${C.cream}"/>`,
  },
}

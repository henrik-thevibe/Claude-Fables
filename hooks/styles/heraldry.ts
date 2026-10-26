/**
 * Heraldry, after the gallery's "Heraldry" (index.html, style 03, `heraldry`):
 * "Azure, a Clawd rampant gules", the mascot as the charge on a coat of arms.
 *
 * The art bible, translated from the gallery's shield to the Fables' worlds:
 *
 * - The stage is the shield's field, painted as a herald paints arms: in
 *   tinctures, flat, each charge outlined in sable. The metals are Or and
 *   argent, the colours azure, gules, vert, purpure and tenné, with sable for
 *   smoke and the void. Every element takes the tincture of what it is, not of
 *   the light on it (the moon's dust is argent though the lit scene paints it
 *   slate, a mesa tenné though its shade is mauve), in a few flat tones; the
 *   shade of a solid thing is engraved in its tincture's Petra Sancta hatching
 *   (gules in pale, azure in fess, vert in bend, purpure and tenné in bend
 *   sinister, sable crossed, Or in dots), as the gallery shades Claude's
 *   turned planes. Washes and glows are not painted: arms are opaque.
 * - The sky is the plate's azure field, diapered: a lozenge lattice in a paler
 *   blue with a small quatrefoil in every lozenge. By night the field is a
 *   deep azure and the diaper fainter; over the volcano the deep azure burns
 *   down to murrey at the horizon. Space is a field sable, diapered in smoke.
 * - The sun is a sun in splendour, a disc Or within rays alternately straight
 *   and wavy, turning slowly; the moon a crescent argent; the Earth a
 *   terrestrial globe azure, landed vert, its meridian Or turning. Stars are
 *   strewn as charges where the lit stars stood: dim ones small mullets argent,
 *   bright ones estoiles Or, and one great estoile Or of eight wavy rays with a
 *   bright heart (the plate's estoile in sinister chief) where a star
 *   twinkled or threw diffraction spikes, twinkling slowly as it sways. The
 *   Milky Way is a bend wavy, opaque, a paler sable edged in black.
 * - Clouds are heraldic clouds: banks argent of billows of uneven width over
 *   an underside scalloped the other way, edged in sable, a curl of azure cut
 *   in each broad billow. Mist lies in the same banks (cerulean by night),
 *   and the volcano's smoke is a cloud sable.
 * - Hills are mounts vert, the far ones purpure; the moon's swells and craters
 *   argent; mesas and boulders tenné; firs, crowns and grass vert, trunks
 *   tenné; the ground Or, tenné or argent as it is sand, earth or stone.
 * - Buildings are towers argent masoned sable, as a castle is blazoned; their
 *   lit windows Or. Cottages are argent masoned and roofed gules, whatever
 *   the moon does to them. The lab's wall is a field sable diapered in smoke,
 *   its floor a pavement chequy. Glass is azure, the lights beyond it bezants
 *   Or, the rain on it goutté d'eau; wet stone is barry wavy argent and
 *   azure, as heraldic water is.
 * - Fire and lava are gules and Or with the volcano's earth tenné, cracked Or;
 *   lamps and their pools Or, the pools strewn with golden points; beams of
 *   light a semé of golden points.
 * - Small life is charged as roundels named by tincture: Claude's confetti
 *   bezants, torteaux, hurts and pommes, his dug earth oranges (tenné), snow
 *   plates; motes Or, a hawk sable.
 * - Claude is the charge, "a Clawd gules": fimbriated Or round his whole
 *   figure within a sable edge, each face outlined in sable, his turned planes
 *   hatched in pale, armed Or with three hooked talons on each claw and
 *   crowned with a ducal coronet Or set with pearls and gems; eyes sable with
 *   an argent glint. His sleep's z's are the plate's italic Caslon, Or
 *   outlined sable.
 * - The field has the plate's own light: vellum grain, an inner shade at the
 *   edges, a soft sheen in chief. It is bordered Or, the shield's gilded rim;
 *   the chapter is lettered on the motto scroll, swallow-tailed, in spaced
 *   Caslon capitals between two pellets, and the caption is written on an
 *   unrolled scroll of parchment ruled in gilt, in Caslon, its words picked
 *   out in the tinctures (code azure, paths vert, names purpure, numbers gules).
 */
import type { HeroPainter } from '../hero3d'
import { type Model, type ModelPart, outlinedOrder, type P2 } from '../clawd3d'
import { hue, isGreen, isWarm, lum, meanOf, num as n, poly, rgb, t1 } from '../art/ink'
import { MIST_TILE, mistBanks, tiled } from '../art/mist'
import { painter, type Ctx } from '../art/painter'
import type { Family, Role } from '../art/roles'
import type { Look } from '../looks'

const CASLON = "'Big Caslon', 'Hoefler Text', Baskerville, 'Libre Baskerville', 'Times New Roman', serif"

/** The gallery's tinctures. */
const C = {
  sable: '#1b140f',
  or: '#e4b23e',
  orL: '#fbe28f',
  gu: '#d4573a',
  guTop: '#ea8a63',
  guSide: '#a43f28',
  guBot: '#7a2a19',
  legF: '#c64f36',
  legS: '#8f3420',
  argent: '#fbf6ea',
  scroll: '#f6edd7',
  scrollB: '#dcc9a0',
  scrollF: '#a88f60',
  motto: '#33241a',
}

/** Each tincture in flat tones, dark to light. */
const R = {
  or: ['#6e4c12', '#93681a', '#c9952f', '#e4b23e', '#f3cd62', '#fbe28f'],
  ar: ['#7e786c', '#9e988a', '#bdb7a8', '#d8d2c2', '#ebe6d8', '#fbf6ea'],
  gu: ['#5a1c10', '#7a2a19', '#a43f28', '#c64f36', '#d4573a', '#ea8a63'],
  az: ['#0f1d44', '#16295e', '#1b3c86', '#2a57ad', '#3a6cc2', '#6e98d8'],
  ce: ['#33507e', '#4a6aa0', '#6a8cc4', '#8eaedc', '#b4cbee', '#d6e2f6'],
  vt: ['#13291a', '#1c3e22', '#28552c', '#386c34', '#4e8a40', '#79a85a'],
  pu: ['#24162e', '#382244', '#4e2e5a', '#6a4276', '#8a5e96', '#ac88b6'],
  tn: ['#2a170c', '#432812', '#653c1c', '#8a5428', '#b0763c', '#d29e5c'],
  sa: ['#0e0a08', '#1b140f', '#2a221c', '#3a3029', '#4c4038', '#625548'],
  smoke: ['#1b140f', '#2e2622', '#463c36', '#5e544c', '#7a7066', '#968c80'],
  fire: ['#5a1c10', '#a8301e', '#d04a26', '#ec7a2a', '#f4b23a', '#fbe28f'],
} as const
type Tincture = keyof typeof R

/**
 * Petra Sancta: the hatching that names each tincture, engraved on its shade.
 * Only the tinctures a solid thing can take are here: fire and cerulean are
 * never the tincture of land, rock, foliage, ground or a building.
 */
const HATCH: Partial<Record<Tincture, 'pale' | 'fess' | 'bend' | 'sinister' | 'cross' | 'dots'>> = {
  or: 'dots',
  gu: 'pale',
  az: 'fess',
  vt: 'bend',
  pu: 'sinister',
  tn: 'sinister',
  sa: 'cross',
}

/** Families solid enough to carry hatching on their shade. */
const SOLID: readonly Family[] = ['land', 'rock', 'foliage', 'ground', 'built', 'bark', 'grass']
/** Families painted without the sable outline: the field, light, air, small bright things. */
const UNLINED: readonly Family[] = ['sky', 'stars', 'life', 'lens', 'air', 'beam', 'glow', 'water', 'lamp']

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/**
 * A herald tinctures a thing by what it is, not by the light on it: the moon's
 * dust is argent though the lit scene paints it slate, a mesa tenné though its
 * shade is mauve. While one of these roles is painted, its tincture is fixed.
 */
const ROLE_TINCTURE: Partial<Record<Role, Tincture>> = {
  'space.regolith': 'ar',
  'space.swells': 'ar',
  'space.craters': 'ar',
  'space.rocks': 'ar',
  'space.pits': 'ar',
  'desert.mesas': 'tn',
  'desert.mesas-far': 'tn',
  'desert.sand': 'or',
  'desert.ripples': 'or',
  'desert.boulders': 'tn',
  'volcano.ash': 'smoke',
}
let fixed: ((color: string) => Tincture) | undefined

/** Repaints an element with its role's tincture fixed (or chosen by the role's own rule). */
const tinctured = (t: Tincture | ((color: string) => Tincture)) => (svg: string, c: Ctx) => {
  fixed = typeof t === 'string' ? () => t : t
  try {
    return c.repaint(svg)
  } finally {
    fixed = undefined
  }
}

/**
 * A cottage as a herald blazons it, whatever the moonlight does to it: walls
 * argent (masoned, below), the roof gules, a lit window Or, a dark one sable.
 * The lit painting's roof is the shade between its walls and its dark panes.
 */
const cottage = (color: string): Tincture => (isWarm(color) ? 'or' : lum(color) < 0.1 ? 'sa' : lum(color) < 0.17 ? 'gu' : 'ar')

/**
 * Earth-colored: a dull warm color too gray for `isWarm` (bark, dry earth,
 * dusk-lit stone), told by red leading blue by more than 18 of 255 (about 7%,
 * past the noise of a neutral gray) with green no higher than red.
 */
function brownish(color: string): boolean {
  const [r, g, b] = rgb(color) ?? [0, 0, 0]
  return r > b + 18 && r >= g
}

/** The tincture an element of a family takes, by its lit color. */
function tinctureOf(color: string, family: Family, depth: number): Tincture {
  if (fixed) return fixed(color)
  const l = lum(color)
  const warm = isWarm(color)
  const green = isGreen(color)
  const { h, s } = hue(color)
  const brown = brownish(color)
  const blue = s > 0.25 && h >= 185 && h < 265
  const red = s > 0.45 && (h < 18 || h > 335)
  switch (family) {
    case 'fire':
      return 'fire'
    case 'lamp':
      return warm || l > 0.7 ? 'or' : red ? 'gu' : green ? 'vt' : l < 0.3 ? 'sa' : blue ? 'ce' : 'ar'
    case 'stars':
      return warm ? 'or' : 'ar'
    case 'life':
      return green ? 'vt' : red ? 'gu' : (warm || brown) && l < 0.45 ? 'tn' : warm ? 'or' : l < 0.3 ? 'sa' : blue ? 'ce' : h > 265 && h < 300 && s > 0.25 ? 'pu' : 'ar'
    case 'body':
    case 'beam':
    case 'glow':
      return warm ? 'or' : 'ar'
    case 'cloud':
    case 'air':
      return warm && l < 0.45 ? 'smoke' : warm ? 'or' : night ? 'ce' : 'ar'
    case 'foliage':
    case 'grass':
      return warm && !green && l > 0.45 ? 'or' : 'vt'
    case 'bark':
      return 'tn'
    case 'land':
      return green ? 'vt' : warm || brown ? 'tn' : depth < 0.2 ? 'pu' : 'vt'
    case 'rock':
      return warm || brown ? 'tn' : l < 0.2 ? 'sa' : 'ar'
    case 'ground':
    case 'mark':
    case 'shadow':
      return green ? 'vt' : warm || brown ? (l > 0.5 ? 'or' : 'tn') : l < 0.16 ? 'sa' : blue && s > 0.4 ? 'az' : 'ar'
    case 'built':
      return warm || brown ? (red && l < 0.5 ? 'gu' : 'tn') : green ? 'vt' : blue && s > 0.5 ? 'az' : l < 0.14 ? 'sa' : 'ar'
    case 'glass':
    case 'water':
      // Glass azure, the lights seen through it bezants Or.
      return warm ? 'or' : l > 0.65 ? 'ce' : 'az'
    default:
      return 'ar'
  }
}

/** Lightness spread out, so dim scenes still reach the light end of a tincture. */
const lift = (l: number) => Math.min(0.999, Math.pow(l, 0.75) * 1.08)

/** The tone index of a lit color within a tincture's six. */
function toneOf(color: string, family: Family, depth: number): number {
  const far = depth < 0.2 && family !== 'sky' && family !== 'body' ? 0.12 : 0
  return Math.max(0, Math.min(5, Math.floor((lift(lum(color)) + far) * 6)))
}

/** A lit color as a flat tincture; the shade of a solid thing hatched in its tincture's lines. */
function ink(color: string, family: Family, depth: number, attr: string): string {
  const t = tinctureOf(color, family, depth)
  // Oranges, the roundels tenné of dug earth, in the tincture's own orange: darker, they read as holes in what they fly past.
  const k = family === 'life' && t === 'tn' ? 4 : toneOf(color, family, depth)
  if (attr === 'fill' && k === 1 && HATCH[t] && SOLID.includes(family)) return `url(#hd-s-${t})`
  return R[t][k] ?? C.sable
}

// ---------------------------------------------------------------- the charges of the sky

/** An estoile: wavy, tapering rays, alternately long and short, as the gallery cuts it. */
function estoile(rays: number, long: number, short: number, w: number, wave: number, steps: number): string {
  let d = ''
  for (let k = 0; k < rays; k++) {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / rays
    const r = k % 2 ? short : long
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    const L: string[] = []
    const Rt: string[] = []
    for (let i = 0; i <= steps; i++) {
      const s = i / steps
      const dd = s * r
      const off = Math.sin(s * Math.PI * 2) * wave * r * Math.min(1, s * 4)
      const hw = w * 0.5 * Math.pow(1 - s, 0.85)
      const x = ux * dd - uy * off
      const y = uy * dd + ux * off
      L.push(`${n(x - uy * hw)} ${n(y + ux * hw)}`)
      // The tip has no width: one point serves both edges.
      if (i < steps) Rt.push(`${n(x + uy * hw)} ${n(y - ux * hw)}`)
    }
    d += `M${L.concat(Rt.reverse()).join('L')}z`
  }
  return d
}

/** A mullet: a five-pointed star, straight rayed. */
function mullet(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const q = i % 2 ? r * 0.42 : r
    pts.push(`${n(Math.cos(a) * q)} ${n(Math.sin(a) * q)}`)
  }
  return `M${pts.join('L')}z`
}

/**
 * The sky: the azure field, diapered; deep azure by night. Space is a field
 * sable, diapered in smoke, for the estoiles to be strewn on; over the
 * volcano the deep azure burns down to murrey at the horizon.
 */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  const field = c.role === 'space.sky' ? 's' : c.role === 'volcano.sky' ? 'v' : night ? 'n' : ''
  const diaper = c.role === 'space.sky' ? 's' : night ? 'n' : ''
  return `<rect width="${n(sw)}" height="128" fill="url(#hd-sky${field})"/><rect width="${n(sw)}" height="128" fill="url(#hd-diaper${diaper})"/>`
}

/**
 * The plate's great estoile Or at x, y, alive as the gallery's is: a slow
 * twinkle in size (17 + .8 sin 1.7t there, a twentieth either way every 3.7s)
 * and a sway.
 */
const greatEstoile = (x: string, y: string) =>
  `<g transform="translate(${x} ${y})"><animateTransform attributeName="transform" type="scale" additive="sum" values="1;1.05;1;.95;1" dur="3.7s" repeatCount="indefinite"/>` +
  `<use href="#hd-E" fill="${C.or}"><animateTransform attributeName="transform" type="rotate" values="-5;5;-5" dur="10s" repeatCount="indefinite"/></use></g>`

/**
 * Stars as charges, each placed where the lit starfield had its tiny square:
 * the dim ones mullets argent, the bright ones estoiles Or, the first that
 * twinkles the great estoile, and a star with diffraction spikes one too.
 */
const SQUARES = /^(M-?[\d.]+ -?[\d.]+h[\d.]+v[\d.]+h-[\d.]+z)+$/
function stars(svg: string, c: Ctx): string {
  let great = 0
  return c
    .repaint(svg)
    .replace(/<path d="M[^"]*h7M[^"]*v7"[^>]*\/><circle cx="([\d.]+)" cy="([\d.]+)" r="\.8"[^>]*\/>/g, (_all, x: string, y: string) => {
      great++
      return greatEstoile(x, y)
    })
    .replace(/<path\b([^>]*?)(\/>|>((?:<animate\b[^>]*\/>)*)<\/path>)/g, (all, attrs: string, _end: string, kids: string | undefined) => {
      const d = /\sd="([^"]*)"/.exec(attrs)?.[1] ?? ''
      if (!SQUARES.test(d)) return all
      const at = [...d.matchAll(/M(-?[\d.]+) (-?[\d.]+)h/g)]
      if (kids && !great++ && at[0]) return greatEstoile(at[0][1] ?? '0', at[0][2] ?? '0')
      const op = Number(/\sopacity="([\d.]+)"/.exec(attrs)?.[1] ?? 1)
      const glyph = !kids && op < 0.5 ? 'hd-m' : 'hd-e'
      const uses = at.map(m => `<use href="#${glyph}" x="${m[1]}" y="${m[2]}"/>`).join('')
      const kept = attrs.replace(/\s(d|fill|stroke|stroke-width)="[^"]*"/g, '')
      return `<g${kept} fill="${glyph === 'hd-m' ? C.argent : C.or}">${uses}${kids ?? ''}</g>`
    })
}

/** The Milky Way as a bend wavy across the sable of space, opaque as an ordinary is, in a paler sable edged in black. */
function bendWavy(sw: number): string {
  const waves = Math.max(6, Math.round(sw / 36))
  const step = (sw + 40) / waves
  const slope = 50 / sw
  let top = `M-20 ${n(6 - 20 * slope)}`
  let bottom = ''
  for (let i = 0; i < waves; i++) {
    const dy = step * slope
    top += `q${n(step / 2)} ${n(dy / 2 - 3)} ${n(step)} ${n(dy)}`
    bottom = `q${n(-step / 2)} ${n(-dy / 2 + 3)} ${n(-step)} ${n(-dy)}` + bottom
  }
  return `<path d="${top}l0 9${bottom}z" fill="${R.sa[4]}" stroke="${R.sa[0]}" stroke-width=".7" stroke-linejoin="round"/>`
}

/** A sun in splendour: a disc Or within rays alternately straight and wavy, turning slowly. */
function splendour(cx: number, cy: number, r: number): string {
  let rays = ''
  const N = 16
  for (let k = 0; k < N; k++) {
    const a = (k * Math.PI * 2) / N - Math.PI / 2
    const at = (rr: number, aa: number) => `${n(cx + Math.cos(aa) * rr)} ${n(cy + Math.sin(aa) * rr)}`
    if (k % 2 === 0) rays += `M${at(r * 0.9, a - 0.12)}L${at(r * 1.85, a)}L${at(r * 0.9, a + 0.12)}z`
    else {
      // A wavy ray: its spine swings across and back as it tapers.
      const L: string[] = []
      const Rt: string[] = []
      for (let i = 0; i <= 6; i++) {
        const s = i / 6
        const rr = r * (0.9 + 0.65 * s)
        const sway = Math.sin(s * Math.PI * 2) * 0.09
        const hw = 0.1 * Math.pow(1 - s, 0.9)
        L.push(at(rr, a + sway - hw))
        Rt.push(at(rr, a + sway + hw))
      }
      rays += `M${L.concat(Rt.reverse()).join('L')}z`
    }
  }
  return (
    `<g><path d="${rays}" fill="${C.or}" stroke="${C.sable}" stroke-width=".45" stroke-linejoin="round"/>` +
    `<animateTransform attributeName="transform" type="rotate" values="0 ${n(cx)} ${n(cy)};45 ${n(cx)} ${n(cy)}" dur="24s" repeatCount="indefinite"/></g>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${C.or}" stroke="${C.sable}" stroke-width=".6"/>` +
    `<circle cx="${n(cx - r * 0.32)}" cy="${n(cy - r * 0.32)}" r="${n(r * 0.24)}" fill="${C.orL}"/>`
  )
}

/** The moon: a crescent argent, horns to the dexter. */
function crescent(cx: number, cy: number, r: number): string {
  const d = r * 0.5
  const r2 = r * 0.84
  // Where the cutting circle (centred d to the left) meets the moon's rim.
  const a = (d * d + r * r - r2 * r2) / (2 * d)
  const hh = Math.sqrt(Math.max(0, r * r - a * a))
  const p1 = `${n(cx - a)} ${n(cy - hh)}`
  const p2 = `${n(cx - a)} ${n(cy + hh)}`
  return `<path d="M${p1}A${n(r)} ${n(r)} 0 1 1 ${p2}A${n(r2)} ${n(r2)} 0 0 0 ${p1}z" fill="${C.argent}" stroke="${C.sable}" stroke-width=".6"/>`
}

/** The Earth as a terrestrial globe: a roundel azure, landed vert, girt and meridianed Or. */
function globe(cx: number, cy: number, r: number): string {
  const land = (pts: [number, number][]) => poly(pts.map(([x, y]) => [cx + x * r, cy + y * r] as [number, number]))
  const lands =
    land([[-0.72, -0.42], [-0.5, -0.72], [-0.18, -0.84], [-0.08, -0.62], [-0.3, -0.48], [-0.24, -0.22], [-0.46, -0.08], [-0.66, -0.2]]) +
    land([[0.08, -0.72], [0.34, -0.9], [0.62, -0.66], [0.78, -0.36], [0.52, -0.28], [0.36, -0.44], [0.14, -0.4]])
  // The meridian turns: its width follows |cos| of its angle.
  const widths = Array.from({ length: 13 }, (_, i) => n(Math.abs(Math.cos((i * Math.PI) / 12)) * r)).join(';')
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${R.az[4]}"/>` +
    `<path d="${lands}" fill="${R.vt[4]}" stroke="${C.sable}" stroke-width=".4"/>` +
    `<g fill="none" stroke="${C.or}" stroke-width="1.1"><ellipse cx="${n(cx)}" cy="${n(cy - r * 0.55)}" rx="${n(r * 0.835)}" ry="${n(r * 0.14)}"/>` +
    `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r)}" ry="${n(r)}"><animate attributeName="rx" values="${widths}" dur="12s" repeatCount="indefinite"/></ellipse></g>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${C.sable}" stroke-width=".7"/>`
  )
}

/**
 * A heraldic cloud: a bank of billows of uneven width, rising toward its middle,
 * over an underside scalloped the other way (the nebuly line), and a curl
 * cut inside each broad billow.
 */
function nebuly(x: number, y: number, w: number, h: number, seed: number): { d: string; curl: string } {
  let s = Math.round(seed * 9301 + x * 131) % 233280
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280
  const lobes = Math.max(3, Math.round(w / 13))
  const widths = Array.from({ length: lobes }, () => 0.65 + rnd() * 0.7)
  const total = widths.reduce((a, b) => a + b, 0)
  let d = `M${n(x)} ${n(y)}`
  let curl = ''
  let at = x
  widths.forEach((u, k) => {
    const span = (w * u) / total
    const mid = 1 - Math.abs((at - x + span / 2) / w - 0.5) * 1.5
    const rise = h * (0.4 + 0.75 * mid) * (0.85 + rnd() * 0.3)
    d += `a${n(span / 2)} ${n(rise)} 0 0 1 ${n(span)} 0`
    if (u > 0.9) curl += `M${n(at + span * 0.3)} ${n(y - rise * 0.15)}a${n(span * 0.22)} ${n(rise * 0.5)} 0 0 1 ${n(span * 0.42)} 0`
    at += span
  })
  // The underside, right to left: a few shallow scallops hanging down.
  const under = Math.max(2, Math.round(lobes / 2))
  for (let k = 0; k < under; k++) d += `a${n(w / under / 2)} ${n(h * 0.22)} 0 0 1 ${n(-w / under)} 0`
  return { d: d + 'z', curl }
}

/** The lit painting's streaks of cloud, each redrawn as a nebuly cloud where it lay. */
function clouds(svg: string, c: Ctx): string {
  let d = ''
  let curl = ''
  for (const m of svg.matchAll(/<path fill="[^"]*" d="M(-?[\d.]+) (-?[\d.]+)((?:q-?[\d.]+ -?[\d.]+ -?[\d.]+ -?[\d.]+)+)z"\/>/g)) {
    const x = Number(m[1])
    const y = Number(m[2])
    let w = 0
    for (const q of (m[3] ?? '').matchAll(/q-?[\d.]+ -?[\d.]+ (-?[\d.]+) -?[\d.]+/g)) w += Math.max(0, Number(q[1]))
    if (w < 20) continue
    const b = nebuly(x, y + 1, w, Math.min(7, Math.max(4, w * 0.05)), d.length)
    d += b.d
    curl += b.curl
  }
  if (!d) return ''
  const fill = night ? R.ce[2] : C.argent
  return (
    `<g><path d="${d}" fill="${fill}" stroke="${C.sable}" stroke-width=".5" stroke-linejoin="round"/>` +
    `<path d="${curl}" fill="none" stroke="${night ? R.az[2] : R.ce[2]}" stroke-width=".45"/>${c.motion(svg)}</g>`
  )
}

/** Mist in the same banks, argent edged in sable, laid across the band it filled. */
function mist(svg: string, c: Ctx): string {
  const banks = mistBanks({ w: Math.min(MIST_TILE, c.meta.sw ?? 640), y: c.meta.y ?? 80, h: c.meta.h ?? 12, seed: 3, rows: (c.meta.h ?? 12) < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true })
  const fill = night ? R.ce[1] : c.meta.veil ? R.ar[4] : C.argent
  const art =
    `<path fill="${fill}" stroke="${C.sable}" stroke-width=".45" stroke-linejoin="round" d="${banks.map(b => b.d).join('')}"/>` +
    `<path fill="none" stroke="${night ? R.az[2] : R.ce[2]}" stroke-width=".4" d="${banks.map(b => b.echo).join('')}"/>`
  // Drawn for one tile and repeated, the banks drifting as the mist they replace did.
  return `<g>${tiled(`hd-mist-${Math.round(c.meta.y ?? 80)}-${Math.round(c.meta.h ?? 12)}`, art, c.meta.sw ?? 640)}${c.motion(svg)}</g>`
}

/**
 * Every squarish speck a roundel outlined in sable, keeping its tincture and motion; a streak (rain)
 * stays a streak. When every shape is a roundel (a fall of sparks, snow or leaves) they share one
 * outline on a group rather than each carrying its own.
 */
const LINE = ` stroke="${C.sable}" stroke-width=".35"`
function roundels(svg: string): string {
  let made = 0
  const round = (line: string) =>
    svg.replace(/<rect\b([^>]*?)(\/>|>([\s\S]*?)<\/rect>)/g, (all, attrs: string, _end: string, kids: string | undefined) => {
      const get = (k: string) => Number(new RegExp(`\\s${k}="([\\d.-]+)"`).exec(attrs)?.[1] ?? 0)
      const w = get('width')
      const h = get('height')
      if (!w || !h || w > h * 2 || h > w * 2) return all
      made++
      const rest = attrs.replace(/\s(x|y|width|height)="[^"]*"/g, '')
      return `<circle cx="${n(get('x') + w / 2)}" cy="${n(get('y') + h / 2)}" r="${n(Math.max(w, h) / 2 + 0.2)}"${line}${rest}>${kids ?? ''}</circle>`
    })
  const shared = round('')
  const shapes = svg.match(/<(rect|circle|ellipse|path|polygon|text|use)\b/g)?.length ?? 0
  return made && made === shapes ? `<g${LINE}>${shared}</g>` : round(LINE)
}

/** A tower argent masoned sable: each argent tone of a building laid in courses of stone. */
const masoned = (svg: string) => svg.replace(/\sfill="(#[0-9a-f]{6})"/g, (all, color: string) => {
  const i = (R.ar as readonly string[]).indexOf(color)
  return i >= 1 ? ` fill="url(#hd-mason${i})"` : all
})

/** A gradient's flat tone, resolved once the element's depth is known (in `post`). */
const FLAT = /FLAT(#[0-9a-f]{6})/g
/** A wash of light, which is not painted: marked by `url`, taken out in `post`. */
const WASH = /<(\w+)\b([^>]*?)\sfill="WASH"([^>]*?)(\/?)>/g
/**
 * A wash left out, and its outline with it: the sable line the group gives every
 * shape would otherwise draw a ring where the glow was (a cottage window's).
 * One that strokes a line of its own keeps it.
 */
const unwash = (svg: string) =>
  svg.replace(WASH, (_all, tag: string, a: string, b: string, close: string) =>
    /\sstroke=/.test(a + b) ? `<${tag}${a} fill="none"${b}${close}>` : close ? '' : `<${tag}${a} fill="none" stroke="none"${b}>`,
  )

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => ink(color, family, depth, attr),
      // A herald paints flat: a gradient becomes one tincture in its overall tone; a wash of light is not painted.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return ink(mean.color, family, 0.5, 'stroke')
        if (mean.opacity < 0.5) return 'WASH'
        return `FLAT${mean.color}`
      },
      post: (svg, family, depth) => unwash(svg).replace(FLAT, (_all, color: string) => ink(color, family, depth, 'fill')),
      line: (family, depth) => (UNLINED.includes(family) ? '' : `stroke="${C.sable}" stroke-width="${n(0.22 + depth * 0.45)}" stroke-linejoin="round"`),
      // Arms are painted opaque: a wash either holds its tincture or is not painted.
      opacity: (_f, v) => (v >= 0.4 ? 1 : v),
      lineless: 0.6,
      faint: 'hide',
      // A pool of lamplight: a roundel Or laid flat, strewn with golden points.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${C.or}" opacity=".3"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.6)}" ry="${n(Math.max(0.8, e.ry * 0.6))}" fill="url(#hd-semy)"/>`,
      redraw: {
        ...(Object.fromEntries(Object.entries(ROLE_TINCTURE).map(([role, t]) => [role, tinctured(t)])) as Partial<Record<Role, (svg: string, c: Ctx) => string>>),
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        air: mist,
        cloud: clouds,
        // Smoke over the volcano: a cloud sable, its billows outlined (the ash keeps its tones of smoke, above).
        'volcano.puffs': (svg, c) => c.repaint(svg.replace(/\sfilter="url\(#sc-wide\)"/, '')).replace(/\sfill="[^"]*"/g, ` fill="${R.smoke[3]}"`),
        'space.milkyway': (_svg, c) => bendWavy(c.meta.sw ?? 640),
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return globe(cx, cy, r)
          if (c.role === 'night.moon') return crescent(cx, cy, r * 1.25)
          if (c.meta.part === 'halo') return ''
          return splendour(cx, cy, r * (c.role === 'forest.sun' ? 1.5 : 1.25))
        },
        // Beams of light: a semé of golden points where the shafts fell.
        beam: (svg, c) => `<g opacity=".7">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#hd-semy)"')}</g>`,
        // Wet stone is barry wavy, as a herald paints water; a polished floor is left plain.
        'city.reflection': (_svg, c) => `<rect x="0" y="${n((c.meta.y ?? 110) + 2)}" width="${n(c.meta.sw ?? 640)}" height="${n(Math.max(2, (c.meta.h ?? 18) - 2))}" fill="url(#hd-wavy)"/>`,
        water: () => '',
        // Towers and cottages argent masoned sable.
        'city.towers-far': (svg, c) => masoned(c.repaint(svg)),
        'city.towers-mid': (svg, c) => masoned(c.repaint(svg)),
        'city.towers-low': (svg, c) => masoned(c.repaint(svg)),
        'city.spire': (svg, c) => masoned(c.repaint(svg)),
        'night.cottages': (svg, c) => masoned(tinctured(cottage)(svg, c)),
        // The rain on the lab's window is goutté d'eau: its drops argent, outlined, where the lit glass had dark beads.
        'lab.window': (svg, c) => c.repaint(svg.replace(/<path fill="#0a0e18" opacity="\.5"/, '<path fill="#e4eefa"')),
        // The lab's floor is a pavement chequy, argent and a grey of argent, laid flat as a herald lays a field.
        'lab.floor': (svg, c) =>
          // Moved rather than placed, so the checks start square on the floor's edge.
          `${c.repaint(svg)}<rect transform="translate(0 ${n(c.meta.y ?? 100)})" width="${n(c.meta.sw ?? 640)}" height="${n(c.meta.h ?? 28)}" fill="url(#hd-chequy)"/>`,
        // The lab's wall is a field of its own, sable diapered in smoke: the lamp's and the screens'
        // washes of light are not painted, and the concrete keeps its board joints and tie holes in sable.
        'lab.wall': (svg, c) =>
          tinctured('sa')(svg.replace(/<circle\b[^>]*url\(#sc-(lampwash|screenwash)\)[^>]*\/>/g, ''), c) +
          `<rect width="${n(c.meta.sw ?? 640)}" height="${n(c.meta.y ?? 80)}" fill="url(#hd-diapers)"/>`,
        // Claude's confetti and dug earth are roundels, each named by its tincture (bezants, torteaux,
        // hurts, pommes, oranges); a sleeper's Z's are the plate's italic Caslon z's, Or outlined sable.
        particles: (svg, c) =>
          roundels(c.repaint(svg)).replace(
            /<text\b[^>]*>Z<\/text>/g,
            `<text text-anchor="middle" font-family="${CASLON}" font-style="italic" font-size="17" font-weight="700" fill="${C.or}" stroke="${C.sable}" stroke-width="1.8" stroke-linejoin="round" paint-order="stroke">z</text>`,
          ),
      },
    },
    'hd',
  )
}

// ---------------------------------------------------------------- Claude

/** A short, stable hash of a string (FNV-1a, 32 bits). */
function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return h >>> 0
}

/**
 * Claude's shadow, a ring of points evenly round an ellipse on the ground, as
 * one unit circle carried there by a matrix: the circle's center and its two
 * conjugate radii, fitted from the ring. A fifth of the markup of the ring.
 */
function oval(pts: readonly P2[], dx: number, dy: number): string {
  const N = pts.length || 1
  const c = centroid(pts)
  let ux = 0
  let uy = 0
  let vx = 0
  let vy = 0
  pts.forEach((p, i) => {
    const a = (Math.PI * 2 * i) / N
    ux += (p[0] - c[0]) * Math.cos(a)
    uy += (p[1] - c[1]) * Math.cos(a)
    vx += (p[0] - c[0]) * Math.sin(a)
    vy += (p[1] - c[1]) * Math.sin(a)
  })
  const m = [ux, uy, vx, vy].map(v => t1((v * 2) / N))
  return `<circle class="hd-sh" r="1" transform="matrix(${m.join(' ')} ${t1(c[0] + dx)} ${t1(c[1] + dy)})"/>`
}

const mid = (a: P2 | undefined, b: P2 | undefined): P2 => [((a?.[0] ?? 0) + (b?.[0] ?? 0)) / 2, ((a?.[1] ?? 0) + (b?.[1] ?? 0)) / 2]
const centroid = (pts: readonly P2[]): P2 => {
  const s = pts.reduce<P2>((t, p) => [t[0] + p[0], t[1] + p[1]], [0, 0])
  return [s[0] / Math.max(1, pts.length), s[1] / Math.max(1, pts.length)]
}

/** Each face's tincture: gules lit and shaded, the turned planes of the body hatched in pale. */
function tinct(part: string, name: string): string {
  if (part === 'leg') return name === 'front' || name === 'back' ? C.legF : name === 'bottom' ? C.guBot : C.legS
  if (name === 'top') return C.guTop
  if (part === 'arm') return name === 'front' || name === 'back' ? C.gu : name === 'bottom' ? C.guBot : C.guSide
  return name === 'front' ? C.gu : name === 'back' ? 'url(#hd-pale-b)' : name === 'bottom' ? 'url(#hd-pale-d)' : 'url(#hd-pale)'
}

/** Armed Or: three hooked talons at the outer end of an arm, curling downward. */
function claw(pt: ModelPart, body: P2, cx: number, floor: number): string {
  const a = centroid(pt.hull)
  let ux = a[0] - body[0]
  let uy = a[1] - body[1]
  const l = Math.hypot(ux, uy) || 1
  ux /= l
  uy /= l
  const reach = Math.max(...pt.hull.map(p => (p[0] - a[0]) * ux + (p[1] - a[1]) * uy))
  const ex = a[0] + ux * (reach - 0.6) + cx
  const ey = a[1] + uy * (reach - 0.6) + floor
  const deg = (Math.atan2(uy, ux) * 180) / Math.PI
  return `<use href="#hd-claw" transform="translate(${t1(ex)} ${t1(ey)}) rotate(${Math.round(deg)})${ux < 0 ? ' scale(1 -1)' : ''}"/>`
}

/**
 * The paint Claude's layers share, set once for every pose: his shadow; the
 * hull in gules within its broad sable edge; the gold fimbriation drawn over
 * it (a `<use>` of the hull, which takes this paint as its own); and the fine
 * sable line round each face. The hull's path carries no paint, so the `<use>`
 * can give it gold.
 */
const HERO_CSS =
  `<style>.hd-sh{fill:${C.sable};opacity:.22}` +
  `.hd-h{fill:${C.gu};stroke:${C.sable};stroke-width:3px;stroke-linejoin:round}` +
  `.hd-f{fill:none;stroke:${C.or};stroke-width:1.8px;stroke-linejoin:round}` +
  `.hd-o{stroke:${C.sable};stroke-width:.4px;stroke-linejoin:round}</style>`

/** A ducal coronet Or, set on the top of the head and tilted with the body. */
function coronet(body: ModelPart, cx: number, floor: number): string {
  const side = ['front', 'back', 'left', 'right'].map(nm => body.faces.find(f => f.name === nm)).find(f => f)
  if (!side) return ''
  const lo = mid(side.pts[0], side.pts[1])
  const hi = mid(side.pts[2], side.pts[3])
  const top = body.faces.find(f => f.name === 'top')
  const at = top ? centroid(top.pts) : hi
  const deg = Math.round((Math.atan2(hi[0] - lo[0], -(hi[1] - lo[1])) * 180) / Math.PI)
  return `<use href="#hd-crown" transform="translate(${t1(at[0] + cx)} ${t1(at[1] + floor + 1)})${deg ? ` rotate(${deg})` : ''}"/>`
}

/**
 * Claude as the charge: gules, fimbriated Or (a gold rim inside a sable one,
 * round the union of his parts only), each face outlined in sable, the turned
 * planes hatched, armed and crowned Or, his eyes sable with an argent glint.
 */
const hero = (): HeroPainter => {
  // How often each hull has been drawn in this scene.
  const seen = new Map<string, number>()
  return (m: Model, cx: number, floor: number) => {
    const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
    // Named by its shape, not its place in the scene: with several Fables on one page, each
    // `<use>` finds this pose's hull, since an id names one shape wherever it is defined. A hull
    // drawn again (a pose that comes round, or a scene baked again in fewer poses to fit) takes
    // a numbered id, so no id is defined twice in a drawing.
    const h = fnv1a(hulls).toString(36)
    const k = seen.get(h) ?? 0
    seen.set(h, k + 1)
    const id = `hd-c${h}${k ? `-${k}` : ''}`
    const hull = `<path id="${id}" d="${hulls}"/>`
    const body = m.parts.find(p => p.name === 'body')
    const bc = body ? centroid(body.hull) : ([0, -20] as P2)
    // The faces in the order an outlined figure draws them, runs of one tincture sharing a path, each claw after its arm.
    let faces = ''
    let fill = ''
    let d = ''
    const flush = () => {
      if (d) faces += `<path fill="${fill}" d="${d}"/>`
      d = ''
    }
    for (const pt of outlinedOrder(m)) {
      // A box's shown faces never overlap, so within a part they go in any order: the faces that
      // carry on the run in hand first, then the rest by tincture (four legs make five runs, not eight).
      const tinted = pt.faces.map(f => ({ f, t: tinct(f.part, f.name) }))
      tinted.sort((a, b) => Number(b.t === fill) - Number(a.t === fill) || (a.t < b.t ? -1 : a.t > b.t ? 1 : 0))
      for (const { f, t } of tinted) {
        if (t !== fill) flush()
        fill = t
        d += poly(f.pts, cx, floor)
      }
      if (pt.name === 'arm' && pt.faces.length) {
        flush()
        faces += claw(pt, bc, cx, floor)
      }
    }
    flush()
    // The eyes: both in one path sable (or one stroke, shut or smiling), each open eye's glint argent after.
    let open = ''
    let shut = ''
    let glints = ''
    for (const e of m.eyes) {
      if (!e.poly) {
        shut += poly(e.line ?? [], cx, floor, false)
        continue
      }
      const ys = e.poly.map(p => p[1])
      const top = e.poly[3] ?? [0, 0]
      open += poly(e.poly, cx, floor)
      if (Math.max(...ys) - Math.min(...ys) > 4) glints += `<use href="#hd-gl" x="${t1(top[0] + cx - 0.5)}" y="${t1(top[1] + floor + 1.7)}"/>`
    }
    const eyes =
      (open ? `<path fill="${C.sable}" d="${open}"/>` : '') +
      (shut ? `<path fill="none" stroke="${C.sable}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="${shut}"/>` : '') +
      glints
    // Baked in every pose, so the paint each layer shares is a class (HERO_CSS) rather than spelled out each time.
    return (
      oval(m.shadow, cx, floor) +
      // The fimbriation: the hulls stroked wide in sable, then again narrower in gold; the faces cover their inner halves.
      `<g class="hd-h">${hull}</g><use class="hd-f" href="#${id}"/>` +
      `<g class="hd-o">${faces}</g>` +
      eyes +
      (body ? coronet(body, cx, floor) : '')
    )
  }
}

// ---------------------------------------------------------------- the shield

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A quatrefoil of four pellets round 0 0. */
const quatrefoil = (o: number, r: number) =>
  [[o, 0], [-o, 0], [0, o], [0, -o]].map(([dx, dy]) => `M${n((dx ?? 0) + r)} ${n(dy ?? 0)}a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0`).join('')

/** The diaper's tile, half its width and half its height. */
const DH = [6, 8.6] as const

/**
 * The diaper's lattice, drawn once: a lozenge stroked, a quatrefoil filled in
 * every lozenge (the tile's corners hold quarters of its neighbors'). Each
 * diaper is this in its own colors.
 */
function lattice(): string {
  const [hx, hy] = DH
  const foils = ([[hx, hy], [0, 0], [2 * hx, 0], [0, 2 * hy], [2 * hx, 2 * hy]] as const).map(([x, y]) => `<use href="#hd-q" x="${x}" y="${y}"/>`).join('')
  return `<path id="hd-q" d="${quatrefoil(1.5, 0.7)}"/><g id="hd-dl"><path d="M${hx} 0L${2 * hx} ${hy}L${hx} ${2 * hy}L0 ${hy}z" fill="none"/><g stroke="none">${foils}</g></g>`
}

/** A diaper: the lattice in a line color and a foil color, each at its own strength. */
const diaper = (id: string, line: string, lineOp: number, dot: string, dotOp: number) =>
  `<pattern id="${id}" width="${2 * DH[0]}" height="${2 * DH[1]}" patternUnits="userSpaceOnUse">` +
  `<use href="#hd-dl" stroke="${line}" stroke-opacity="${lineOp}" stroke-width=".45" fill="${dot}" fill-opacity="${dotOp}"/></pattern>`

/** Petra Sancta: a tincture's shade tone with its hatching engraved over it. */
function hatchPattern(t: Tincture): string {
  const kind = HATCH[t]
  const base = R[t][2]
  const line = R[t][0]
  const id = `hd-s-${t}`
  switch (kind) {
    case 'dots':
      return `<pattern id="${id}" width="1.8" height="1.8" patternUnits="userSpaceOnUse"><rect width="1.8" height="1.8" fill="${base}"/><circle cx=".9" cy=".9" r=".35" fill="${line}"/></pattern>`
    case 'cross':
      return `<pattern id="${id}" width="1.8" height="1.8" patternUnits="userSpaceOnUse"><rect width="1.8" height="1.8" fill="${base}"/><path d="M0 .9H1.8M.9 0V1.8" stroke="${line}" stroke-width=".4"/></pattern>`
    case undefined:
      return ''
    default: {
      const rot = kind === 'pale' ? 0 : kind === 'fess' ? 90 : kind === 'bend' ? -45 : 45
      return `<pattern id="${id}" width="1.8" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})"><rect width="1.8" height="4" fill="${base}"/><path d="M.9 0V4" stroke="${line}" stroke-width=".45"/></pattern>`
    }
  }
}

/**
 * The claw: three hooked talons fanned from an arm's end, pointing along +x,
 * curling toward +y. Each is broad at its root and bowed back before it hooks
 * over to a point, the gallery's chunky talon at the Fables' scale.
 */
function clawGlyph(): string {
  const len = 6.2
  const bw = 1.6
  let d = ''
  for (const k of [-1, 0, 1]) {
    // Three talons side by side, barely fanned, so each reads as its own crescent.
    const by = k * 2.6
    const a = k * 0.18
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    const nx = -dy
    const ny = dx
    // The point hooks well over (four tenths of the talon's length); the back bows out, the inside less, so the talon is fat.
    const tip = [dx * len, by + dy * len + len * 0.4]
    d +=
      `M${n(nx * bw)} ${n(by + ny * bw)}` +
      `Q${n(dx * len * 0.8 + nx * bw * 1.4)} ${n(by + dy * len * 0.8 + ny * bw * 1.4 - len * 0.2)} ${n(tip[0] ?? 0)} ${n(tip[1] ?? 0)}` +
      `Q${n(dx * len * 0.5 - nx * bw * 0.9)} ${n(by + dy * len * 0.5 - ny * bw * 0.9)} ${n(-nx * bw)} ${n(by - ny * bw)}z`
  }
  return `<path id="hd-claw" d="${d}" fill="${C.or}" stroke="${C.sable}" stroke-width=".4" stroke-linejoin="round"/>`
}

/** The ducal coronet, its base on 0 0, rising toward -y. */
function crownGlyph(): string {
  const s = 7.4
  const p = (x: number, y: number) => `${n(x * s)} ${n(y * s)}`
  return (
    `<g id="hd-crown" stroke="${C.sable}" stroke-width=".38" stroke-linejoin="round">` +
    `<path fill="${C.or}" d="M${p(-1, 0)}L${p(-1, -0.3)}L${p(-1.04, -0.86)}L${p(-0.5, -0.44)}L${p(0, -1.02)}L${p(0.5, -0.44)}L${p(1.04, -0.86)}L${p(1, -0.3)}L${p(1, 0)}Q${p(0, 0.16)} ${p(-1, 0)}z"/>` +
    `<path fill="none" d="M${p(-1, -0.3)}Q${p(0, -0.16)} ${p(1, -0.3)}"/>` +
    `<path fill="${C.orL}" stroke="none" d="M${p(-0.92, -0.36)}L${p(-0.92, -0.66)}L${p(-0.6, -0.42)}z"/>` +
    `<path fill="${C.argent}" d="${[[-1.04, -0.96], [0, -1.12], [1.04, -0.96]].map(([x, y]) => `M${p((x ?? 0) + 0.12, y ?? 0)}a${n(0.12 * s)} ${n(0.12 * s)} 0 1 0 ${n(-0.24 * s)} 0a${n(0.12 * s)} ${n(0.12 * s)} 0 1 0 ${n(0.24 * s)} 0`).join('')}"/>` +
    `<g stroke-width=".25">` +
    [[-0.52, '#2d5fbf'], [0, '#c0392b'], [0.52, '#2d5fbf']].map(([x, c]) => `<ellipse cx="${n((x as number) * s)}" cy="${n(-0.1 * s)}" rx="${n(0.11 * s)}" ry="${n(0.085 * s)}" fill="${c}"/>`).join('') +
    `</g></g>`
  )
}

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(): string {
  let out = ''
  for (const t of Object.keys(HATCH) as Tincture[]) out += hatchPattern(t)
  // Masoned: courses of stone in sable lines, drawn once, over each argent tone.
  out += `<path id="hd-mc" d="M0 .2H6M0 2.2H6M.2 .2V2.2M3.2 2.2V4" fill="none" stroke="${C.sable}" stroke-opacity=".45" stroke-width=".3"/>`
  for (let i = 1; i < R.ar.length; i++)
    out += `<pattern id="hd-mason${i}" width="6" height="4" patternUnits="userSpaceOnUse"><rect width="6" height="4" fill="${R.ar[i]}"/><use href="#hd-mc"/></pattern>`
  // Claude's turned planes hatched in pale: gules, the gallery's palewise lines.
  for (const [id, base, op] of [['hd-pale', C.guSide, 0.45], ['hd-pale-b', C.gu, 0.3], ['hd-pale-d', C.guBot, 0.45]] as [string, string, number][])
    out += `<pattern id="${id}" width="1.5" height="4" patternUnits="userSpaceOnUse"><rect width="1.5" height="4" fill="${base}"/><path d="M.75 0V4" stroke="#460e06" stroke-opacity="${op}" stroke-width=".35"/></pattern>`
  return (
    out +
    lattice() +
    diaper('hd-diaper', '#9bbef8', 0.32, '#aacafc', 0.4) +
    diaper('hd-diapern', '#6a8ad0', 0.22, '#7a9ae0', 0.26) +
    diaper('hd-diapers', '#8a7a68', 0.2, '#a08c70', 0.22) +
    `<linearGradient id="hd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24509f"/><stop offset=".55" stop-color="#3363b8"/><stop offset=".85" stop-color="#4f82cc"/></linearGradient>` +
    `<linearGradient id="hd-skyn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1838"/><stop offset=".6" stop-color="#162a60"/><stop offset=".85" stop-color="#1f3a7a"/></linearGradient>` +
    `<linearGradient id="hd-skys" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e0a08"/><stop offset=".7" stop-color="#1b140f"/><stop offset=".9" stop-color="#2a221c"/></linearGradient>` +
    `<linearGradient id="hd-skyv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1838"/><stop offset=".42" stop-color="#1a2658"/><stop offset=".64" stop-color="#4a1e44"/><stop offset=".82" stop-color="#7a2430"/></linearGradient>` +
    // Or in Petra Sancta: a semé of golden points, for beams and pools of light.
    `<pattern id="hd-semy" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".45" fill="${C.or}"/><circle cx="2.5" cy="2.5" r=".45" fill="${C.orL}"/></pattern>` +
    `<pattern id="hd-chequy" width="16" height="9" patternUnits="userSpaceOnUse"><path d="M0 0h8v4.5H0zM8 4.5h8V9H8z" fill="${R.ar[1]}" fill-opacity=".6"/></pattern>` +
    // Barry wavy argent and azure over wet stone: azure bars, waved, the stone's argent between them.
    `<pattern id="hd-wavy" width="8" height="4.4" patternUnits="userSpaceOnUse"><path d="M0 1.2q2 -1 4 0t4 0v.6q-2 1 -4 0t-4 0z" fill="${R.az[4]}"/></pattern>` +
    `<path id="hd-m" d="${mullet(1.25)}"/>` +
    `<path id="hd-e" d="${estoile(6, 2.7, 1.7, 0.95, 0.07, 3)}" stroke="${C.sable}" stroke-width=".22" stroke-linejoin="round"/>` +
    // The plate's estoile in sinister chief: eight wavy rays and a bright heart.
    `<g id="hd-E"><path d="${estoile(8, 10.2, 6.1, 2.3, 0.085, 4)}" stroke="${C.sable}" stroke-width=".5" stroke-linejoin="round"/><circle cx="-.45" cy="-.45" r="1.1" fill="${C.orL}"/></g>` +
    clawGlyph() +
    crownGlyph() +
    // The glint argent in each open eye.
    `<circle id="hd-gl" r=".65" fill="${C.argent}"/>` +
    HERO_CSS +
    `<linearGradient id="hd-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9df8e"/><stop offset=".3" stop-color="#e2b448"/><stop offset=".62" stop-color="#c9952f"/><stop offset="1" stop-color="#8a6116"/></linearGradient>` +
    `<radialGradient id="hd-vig" cx=".5" cy=".5" r=".72"><stop offset=".6" stop-color="#06102e" stop-opacity="0"/><stop offset="1" stop-color="#06102e" stop-opacity=".32"/></radialGradient>` +
    `<radialGradient id="hd-sheen" cx=".3" cy=".15" r=".45"><stop offset="0" stop-color="#ffffff" stop-opacity=".09"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>` +
    `<filter id="hd-vellum" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9 .7" numOctaves="2" seed="311"/>` +
    `<feColorMatrix values="0 0 0 0 .55  0 0 0 0 .41  0 0 0 0 .2  -1.4 0 0 0 .9"/></filter>`
  )
}

/** The motto scroll: a band of parchment over two swallow-tailed ends, its folds in shade. */
function scroll(x: number, y: number, w: number, h: number): string {
  const dd = 3
  const tail = 9
  const ov = 4
  const notch = 3
  const end = (sg: 1 | -1) => {
    const x0 = sg < 0 ? x + ov : x + w - ov
    const x1 = sg < 0 ? x - tail : x + w + tail
    const t = `M${n(x0)} ${n(y + dd)}H${n(x1)}l${-sg * notch} ${n(h / 2)}l${sg * notch} ${n(h / 2)}H${n(x0)}z`
    const xe = sg < 0 ? x : x + w
    const fold = `M${n(xe)} ${n(y + h)}H${n(xe - sg * ov)}V${n(y + h + dd)}z`
    return `<path d="${t}" fill="${C.scrollB}"/><path d="${fold}" fill="${C.scrollF}"/>`
  }
  return (
    `<g stroke="${C.sable}" stroke-width=".6" stroke-linejoin="round">${end(-1)}${end(1)}` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${h}" fill="${C.scroll}"/></g>` +
    // The band's roll: a shade along its top and bottom edges.
    `<path d="M${n(x + 0.5)} ${n(y + 1.2)}H${n(x + w - 0.5)}M${n(x + 0.5)} ${n(y + h - 1.2)}H${n(x + w - 0.5)}" stroke="#96733c" stroke-opacity=".3" stroke-width="1.4"/>`
  )
}

export const HERALDRY: Look = {
  name: 'heraldry',
  label: 'Heraldry',
  voice: 'a herald blazoning a coat of arms: grave, formal, a touch of Latin',
  cell: 'solid',
  figure: '3d',
  font: CASLON,
  charW: 5.2,
  caption: { fill: C.scroll, stroke: C.sable, ink: C.motto, radius: 1 },
  paper: { card: C.scroll, ink: C.motto, kinds: { code: '#1f4a9a', path: '#2d5f2a', fn: '#6a3478', num: '#a8321e', bad: '#b0261c', good: '#2d6a2a', face: '#a8321e' } },
  inset: 4,
  titleColor: C.motto,
  art: {
    painter: scenery,
    hero,
    sky: '#2a57ad',
    ground: '#2a221c',
    defs,
  },
  // The field's own light: vellum grain, a shade at its edges, a soft sheen in chief.
  texture: (sw, h) =>
    `<rect width="${sw}" height="${h}" fill="url(#hd-vig)"/><rect width="${sw}" height="${h}" fill="url(#hd-sheen)"/>` +
    `<rect width="${sw}" height="${h}" filter="url(#hd-vellum)" opacity=".16"/>`,
  // A bordure Or: the shield's gilded rim, a dark edge outside, a sable line within.
  frame: (sw, h) =>
    `<rect x="1.8" y="1.8" width="${sw - 3.6}" height="${h - 3.6}" fill="none" stroke="url(#hd-gold)" stroke-width="3.2"/>` +
    `<rect x=".4" y=".4" width="${sw - 0.8}" height="${h - 0.8}" fill="none" stroke="#3a2a0e" stroke-width=".8"/>` +
    `<rect x="1.1" y="1.1" width="${sw - 2.2}" height="${h - 2.2}" fill="none" stroke="#fff4c8" stroke-opacity=".55" stroke-width=".4"/>` +
    `<rect x="3.7" y="3.7" width="${sw - 7.4}" height="${h - 7.4}" fill="none" stroke="${C.sable}" stroke-width=".7"/>`,
  // The chapter on the motto scroll, in spaced Caslon capitals between two pellets.
  tag: (text, inset) => {
    const t = text.toUpperCase()
    const x = inset + 13
    const y = inset + 4
    const h = 11
    // Spaced capitals take about 6.8 units each, an M or W 8.8 (measured 8.5); the pellets sit 6 in from either end, clear of the letters.
    const w = [...t].reduce((s, ch) => s + (ch === 'M' || ch === 'W' ? 8.8 : 6.8), 24)
    return {
      svg:
        scroll(x, y, w, h) +
        `<path d="M${n(x + 6)} ${n(y + h / 2)}h.01M${n(x + w - 6)} ${n(y + h / 2)}h.01" fill="none" stroke="${C.motto}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<text x="${n(x + w / 2)}" y="${n(y + 8)}" text-anchor="middle" font-family="${CASLON}" font-size="7.5" font-weight="600" letter-spacing="1.3" fill="${C.motto}">${escape(t)}</text>`,
      w: x + w + 14,
      h: y + h + 6,
    }
  },
  bubble: {
    font: CASLON,
    size: 9,
    charW: 5.2,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // An unrolled scroll: parchment ruled in gilt, a roll at either end, its pointer a parchment wedge.
      `<path fill="${C.scroll}" stroke="${C.sable}" stroke-width=".7" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${C.scroll}" stroke="${C.sable}" stroke-width=".8"/>` +
      `<rect x="${n(x + 2.2)}" y="${n(y + 2.2)}" width="${n(w - 4.4)}" height="${n(h - 4.4)}" fill="none" stroke="${C.or}" stroke-width=".5"/>` +
      `<g fill="${C.scrollB}" stroke="${C.sable}" stroke-width=".6">` +
      `<rect x="${n(x - 2.6)}" y="${n(y - 1.6)}" width="3.6" height="${n(h + 3.2)}" rx="1.8"/>` +
      `<rect x="${n(x + w - 1)}" y="${n(y - 1.6)}" width="3.6" height="${n(h + 3.2)}" rx="1.8"/></g>`,
  },
}

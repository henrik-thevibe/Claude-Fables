/**
 * Low Poly, after the gallery's "Low Poly: polygon era, 1999" (henrik-styles.js,
 * style 46, `slowpoly`), and the look's own sources: the late-90s console
 * games drawn in a few hundred flat-shaded polygons, a ring to fly through.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Every surface is flat-shaded: one color a polygon, no gradient within it,
 *   from a short console palette (slate and concrete greys, a grass green, a
 *   brick and a road yellow, a sea blue). Curves are what the hardware could
 *   not afford: a wash of light is not drawn, and a soft gradient becomes the
 *   one flat color of its middle.
 * - The sky is a stack of hard bands, deep blue at the top to near white at
 *   the horizon; by night the same bands in navy, never black.
 * - Distance is fog: the farther a thing stands, the more it fades into the
 *   horizon's color, as the draw distance closes in.
 * - The ground is a mesh of triangles, each a shade lighter or darker than
 *   its neighbour, the way the terrain was tiled.
 * - The sun and moon are octagons, lit on one half; stars are little diamonds.
 * - Claude is the gallery's: coral polygons, a light top, a deeper front and
 *   a shadowed side, each quad split in two triangles a shade apart, the way
 *   the hardware drew it; black eyes with a glint, a flat dark shadow.
 * - The chapter is a HUD readout, heavy italic gold with a dark key and a gold
 *   ring before it; the caption sits in a pale dialog box with a navy bevel.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const SANS = "'Arial Black', 'Helvetica Neue', Arial, sans-serif"
const KEY = '#1a1206'
const NAVY = '#14205a'

/** The sky's bands, top to horizon. */
const BANDS = {
  day: ['#5e93c9', '#73a5d4', '#8ab6dd', '#a3c7e6', '#bdd8ee', '#d6e8f4'],
  night: ['#121a46', '#18245a', '#1f306c', '#2a3f80', '#3a5292', '#5068a6'],
}
/** The fog's color, which the far distance fades into: the horizon's band. */
const FOG = { day: '#c8dcec', night: '#3a5292' }

/** The console palette, by what a thing is, dark to light. */
const RAMP = {
  stone: ['#3a4250', '#5a5d64', '#7a8590', '#9eabb2', '#c4ccd0', '#e8ecec'],
  warm: ['#5a2a1c', '#a2432a', '#d65a35', '#e8904a', '#e8c547', '#f6e8b0'],
  earth: ['#4a3424', '#6e5034', '#8e7a5a', '#a89a74', '#c8bc94'],
  green: ['#24401f', '#3a6230', '#55843e', '#76a24e', '#a4c46a'],
  bark: ['#3e2818', '#5e4028', '#80603c'],
  water: ['#1e3e6e', '#2e5e9a', '#4a86c0', '#7ab0dc', '#b8d8f0'],
  fire: ['#a2232a', '#e8693e', '#ffb428', '#fff3a8'],
}

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** The lit scenes are dim; the console palette uses its whole range, a little lifted at night. */
const level = (color: string) => Math.min(0.999, Math.pow(lum(color), 0.75) * 1.12 + (night ? 0.08 : 0))

/** A lit color as the flat polygon color of its family, faded into the fog by its distance. */
function flat(color: string, family: Family, depth: number): string {
  const t = level(color)
  let c: string
  switch (family) {
    case 'fire':
      return step(RAMP.fire, Math.max(0.3, t))
    case 'lamp':
    case 'life':
      return isWarm(color) ? '#ffc928' : '#bfefff'
    case 'stars':
      return '#fff3a8'
    case 'glass':
    case 'water':
      c = step(RAMP.water, t)
      break
    case 'foliage':
    case 'grass':
      c = step(RAMP.green, t)
      break
    case 'bark':
      c = step(RAMP.bark, t)
      break
    case 'shadow':
      return night ? '#0e1430' : '#3a4250'
    default:
      c = isGreen(color) ? step(RAMP.green, t) : isWarm(color) ? step(t < 0.55 ? RAMP.earth : RAMP.warm, t) : step(RAMP.stone, t)
  }
  // Distance fog: the far things fade toward the horizon.
  const fog = Math.max(0, 0.55 - depth) * (night ? 0.5 : 0.7)
  return fog > 0.02 ? mix(c, night ? FOG.night : FOG.day, fog) : c
}

/** The sky: hard bands of blue, deep at the top to pale at the horizon; navy by night. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  return `<use href="#lw-sky${night ? 'n' : 'd'}" transform="scale(${n(sw / 100)} 1)"/>`
}

/** An octagon centred on cx, cy: the sun or the moon, lit on its upper left half. */
function octagon(cx: number, cy: number, r: number): string {
  const pt = (i: number) => {
    const a = (i * Math.PI) / 4 + Math.PI / 8
    return `${n(cx + Math.cos(a) * r)} ${n(cy + Math.sin(a) * r)}`
  }
  const all = Array.from({ length: 8 }, (_, i) => pt(i)).join('L')
  const lit = [4, 5, 6, 7].map(pt).join('L')
  const [face, light] = night ? ['#c8d0dc', '#f2f4f8'] : ['#ffb428', '#fff3a8']
  return `<path fill="${face}" d="M${all}z"/><path fill="${light}" d="M${n(cx)} ${n(cy)}L${lit}z"/>`
}

/** Stars as diamonds: every shape becomes a group, keeping its own attributes and animation, of little diamonds at its points. */
function stars(svg: string, c: Ctx): string {
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#lw-star" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      return `<g${kept} fill="#fff3a8">${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => (attr === 'stroke' ? (family === 'fire' || family === 'lamp' ? '#ffc928' : flat(color, family, depth)) : flat(color, family, depth)),
      // A gradient was beyond the hardware: it becomes the one flat color of its middle, and a faint wash is not drawn.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'fill' && mean.opacity < 0.5) return 'none'
        return flat(mean.color, family, 0.6)
      },
      // Polygons have no outlines.
      line: () => '',
      // Translucency is costly: a thing is drawn, or it is not.
      opacity: (family, v) => (family === 'air' || family === 'beam' ? v : v >= 0.4 ? 1 : v),
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool is a flat octagon of light on the floor.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="#ffc928" opacity=".35"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        body: (_svg, c) => {
          if (c.meta.part === 'halo') return ''
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth')
            return `<path fill="#2e5e9a" d="M${n(cx - r)} ${n(cy)}L${n(cx)} ${n(cy - r)}L${n(cx + r)} ${n(cy)}L${n(cx)} ${n(cy + r)}z"/><path fill="#55843e" d="M${n(cx - r * 0.5)} ${n(cy - r * 0.2)}L${n(cx)} ${n(cy - r * 0.7)}L${n(cx + r * 0.3)} ${n(cy)}z"/><path fill="#4a86c0" d="M${n(cx)} ${n(cy)}L${n(cx + r)} ${n(cy)}L${n(cx)} ${n(cy + r)}z"/>`
          return octagon(cx, cy, r)
        },
        // Clouds are flat: white by day, a slate blue by night and in the volcano's ash.
        cloud: (svg, c) => {
          const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
          const fill = night || lum(lit) < 0.4 ? '#6a7aa0' : '#f2f4f8'
          return `<g>${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${fill}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`
        },
        // Mist is not drawn: the fog is in the colors of the far things.
        air: () => '',
        // Shafts of light were beyond the hardware.
        beam: () => '',
      },
    },
    'lw',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude's polygon colors, by face. */
const FACE = { top: '#f7a77c', front: '#e8693e', left: '#b84b2c', right: '#b84b2c', back: '#b84b2c', bottom: '#a2432a' } as const
/**
 * How far a face darkens as it turns from the light, in three steps baked into
 * its gradient. Each face's gradients are named by one letter (back is k,
 * bottom u), short since every pose names them.
 */
const SHADES = [0, 0.1, 0.2]

/** Claude in flat-shaded polygons: each face one path, its two triangles a shade apart in a hard-stopped gradient. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => {
      const shade = (1 - f.light) * 0.45
      const k = shade < 0.1 ? 0 : shade < 0.25 ? 1 : 2
      return `<path fill="url(#lw-${f.name[0] === 'b' ? (f.name === 'back' ? 'k' : 'u') : f.name[0]}${k})" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${KEY}" d="${poly(e.poly, cx, floor)}"/><rect x="${t1((e.poly[3]?.[0] ?? 0) + cx - 0.3)}" y="${t1((e.poly[3]?.[1] ?? 0) + floor - 0.3)}" width=".9" height=".9" fill="#fff"/>`
        : `<path fill="none" stroke="${KEY}" stroke-width="1" stroke-linejoin="miter" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return `<path fill="#1a1206" opacity=".4" d="${poly(m.shadow, cx, floor)}"/><path fill="#a2432a" d="${hulls}"/>` + faces + eyes
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A face's split: the upper left triangle in one shade, the lower right a shade deeper, with a hard stop on the diagonal. */
const split = (id: string, c: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="${c}"/><stop offset=".5" stop-color="${mix(c, KEY, 0.1)}"/></linearGradient>`

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(): string {
  let out = ''
  for (const [face, c] of Object.entries(FACE)) SHADES.forEach((k, i) => (out += split(`lw-${face[0] === 'b' ? (face === 'back' ? 'k' : 'u') : face[0]}${i}`, mix(c, KEY, k))))
  // The sky's bands, 100 wide, scaled to the stage.
  for (const [name, bands] of Object.entries(BANDS))
    out += `<g id="lw-sky${name[0]}">${bands.map((c, i) => `<rect y="${n(i * 21.4)}" width="100" height="${i === bands.length - 1 ? 30 : 21.8}" fill="${c}"/>`).join('')}</g>`
  out += `<path id="lw-star" d="M0 -1.6L.9 0L0 1.6L-.9 0z"/>`
  // The terrain mesh: triangles a shade lighter and darker than the ground they tile.
  out +=
    `<pattern id="lw-mesh" width="16" height="8" patternUnits="userSpaceOnUse">` +
    `<path d="M0 0L16 0L0 8z" fill="#ffffff" fill-opacity=".07"/><path d="M16 0L16 8L0 8z" fill="#000000" fill-opacity=".07"/>` +
    `<path d="M16 0L0 8" stroke="#000000" stroke-opacity=".05" stroke-width=".4"/></pattern>`
  return (
    out +
    `<linearGradient id="lw-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".5" stop-color="#ffc928"/><stop offset="1" stop-color="#e8781a"/></linearGradient>`
  )
}

export const LOWPOLY: Look = {
  name: 'lowpoly',
  label: 'Low Poly',
  voice: 'a 1999 polygon-era console game, all HUD readouts and jump-through-the-ring cheer',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 6,
  caption: { fill: '#f2f4f8', stroke: NAVY, ink: NAVY, radius: 2 },
  paper: { card: '#f2f4f8', ink: KEY, kinds: { code: '#1f5fa0', path: '#5a3aa0', fn: '#a0306a', num: '#c0501a', bad: '#c8202a', good: '#2a7a2a', face: '#a0306a' } },
  inset: 2,
  titleColor: '#ffc928',
  art: {
    painter: scenery,
    hero,
    sky: '#8ab6dd',
    ground: '#76866a',
    defs,
  },
  // The terrain mesh over the ground, below the horizon.
  texture: (sw, h, ground) => `<rect x="0" y="${n(ground)}" width="${n(sw)}" height="${n(h - ground)}" fill="url(#lw-mesh)"/>`,
  // The chapter as a HUD readout: a gold ring, then heavy italic gold with a dark key.
  tag: (text, inset) => {
    const x = inset + 6
    const y = inset + 13
    const w = text.length * 6.2 + 16
    return {
      svg:
        `<circle cx="${n(x + 4)}" cy="${n(y - 3.5)}" r="3.6" fill="none" stroke="${KEY}" stroke-width="2.6"/><circle cx="${n(x + 4)}" cy="${n(y - 3.5)}" r="3.6" fill="none" stroke="#ffc928" stroke-width="1.4"/>` +
        `<text x="${n(x + 11)}" y="${n(y)}" font-family="${SANS}" font-size="10" font-style="italic" font-weight="900" fill="url(#lw-gold)" stroke="${KEY}" stroke-width="1.8" stroke-linejoin="round" paint-order="stroke">${escape(text)}</text>`,
      w: x + w + 4,
      h: y + 6,
    }
  },
  bubble: {
    font: SANS,
    size: 8.5,
    charW: 5.9,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A pale dialog box with a navy bevel, its tail a flat triangle.
      `<path fill="${NAVY}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#f2f4f8" stroke="${NAVY}" stroke-width="2.4"/>` +
      `<rect x="${n(x + 2)}" y="${n(y + 2)}" width="${w - 4}" height="${h - 4}" fill="none" stroke="#a3c7e6" stroke-width=".8"/>`,
  },
}

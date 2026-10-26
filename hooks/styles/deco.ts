/**
 * Art Deco, after the gallery's "Art Deco: streamline poster, 1930s"
 * (henrik-styles.js, style 40, `sdeco`), and the look's own sources: the
 * travel and world's-fair posters of the thirties, Cassandre's liners and
 * trains, the skyscraper crowns of New York.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Everything is a streamline poster: flat planes of teal, jade and bronze,
 *   each a smooth vertical ramp from a lit top to a deeper foot. Buildings are
 *   the poster's towers, two-toned: a lit face on the left, a shadowed one on
 *   the right. Far things fade to a blue haze. Every near shape is edged in a
 *   fine gold line.
 * - The sky is a sunburst: fine rays fanning from the horizon's centre over a
 *   glow of gold. By day it runs from deep teal to a peach-gold horizon, by
 *   night from navy to midnight blue, the rays pale.
 * - The sun is a gilded disc in concentric rings; the moon a cream one; the
 *   Earth a gold globe in its tilted ring, as on the poster's skyline. Stars
 *   are gold. Lamps and windows burn gold; fire runs gold into vermilion.
 *   Searchlights are pale beams.
 * - Claude is streamlined: each face a smooth vertical ramp of its terracotta,
 *   darkened in steps as it turns from the light, edged all round in gold,
 *   with navy eyes and a gold glint.
 * - The picture sits in a double gold rule; the chapter is cream capitals,
 *   widely spaced, on a navy band over a gold rule; the caption a cream card
 *   in a double frame of navy and gold.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const FONT = "'Futura', 'Century Gothic', 'Avenir Next', 'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif"
/** The ground's top on the stage (svg.ts): the sunburst's centre. */
const HORIZON = 104
const NAVY = '#0f1a33'
const BAND = '#0b1324'
const GOLD = '#d9b25a'
const GOLD_L = '#f4dc93'
const CREAM = '#f2e8cf'

/** The poster's planes, by what they are, dark to light. */
const PLANES = {
  teal: ['#164c55', '#21737b', '#3f9a9a'],
  jade: ['#1d4a3a', '#2f7a5a', '#5aa878'],
  bronze: ['#3a2418', '#7a4a2a', '#b07a44'],
  far: ['#3a5a7a', '#5a82a0', '#8ab0c4'],
} as const
type Kind = keyof typeof PLANES
/** At night every plane sinks toward the navy sky, but not into it. */
const dusk = (c: string) => mix(c, NAVY, 0.3)

/** Claude's terracotta, by face. */
const FACES = { top: '#f6b48c', front: '#e2774f', back: '#e2774f', left: '#b4553a', right: '#b4553a', bottom: '#9a4630' } as const
/** How far a face darkens as it turns from the light, in steps baked into its gradient: one path a face. */
const SHADES = [0, 0.18, 0.36]

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** A lit color as a poster plane of the family's kind, at the tone its lightness gives. */
function surface(color: string, family: Family, depth: number): string {
  const t = lum(color)
  const i = t < 0.3 ? 0 : t < 0.6 ? 1 : 2
  const nt = night ? 'n' : ''
  if (family === 'built') return `url(#dc-split${nt}${i})`
  let kind: Kind = 'teal'
  if (family === 'foliage' || family === 'grass' || isGreen(color)) kind = 'jade'
  else if (family === 'bark' || family === 'ground' || (family === 'land' && isWarm(color))) kind = 'bronze'
  if (depth < 0.25 && family !== 'body') kind = 'far'
  return `url(#dc-${kind}${nt}${i})`
}

/** A plain tone in the style's colors, for lines and gradient stops. */
function tone(color: string, family: Family): string {
  const t = lum(color)
  switch (family) {
    case 'fire':
      return t > 0.6 ? GOLD_L : t > 0.35 ? '#e8a040' : '#c8452a'
    case 'lamp':
    case 'stars':
    case 'life':
      return t > 0.5 ? GOLD_L : GOLD
    case 'glass':
    case 'water':
      return step(['#164c55', '#2f8a90', '#7ac0c0', '#d8eee4'], t)
    case 'foliage':
    case 'grass':
      return step(PLANES.jade, t)
    default:
      return step([BAND, PLANES.teal[0], PLANES.teal[1], PLANES.teal[2], CREAM], t)
  }
}

/** The sunburst: the sky's ramp, a glow of gold at the horizon, and fine rays fanning from it. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  const cx = sw / 2
  const L = Math.max(sw, 200)
  let rays = ''
  for (let k = 0; k < 36; k += 2) {
    const a0 = Math.PI + (k / 36) * Math.PI
    const a1 = Math.PI + ((k + 1) / 36) * Math.PI
    rays += `M${n(cx)} ${HORIZON}L${n(cx + Math.cos(a0) * L)} ${n(HORIZON + Math.sin(a0) * L)}L${n(cx + Math.cos(a1) * L)} ${n(HORIZON + Math.sin(a1) * L)}z`
  }
  return (
    `<rect width="${n(sw)}" height="128" fill="url(#${night ? 'dc-skyn' : 'dc-sky'})"/>` +
    `<path d="${rays}" fill="${night ? '#a0c8e6' : '#fff4d8'}" opacity="${night ? 0.08 : 0.16}"/>` +
    `<ellipse cx="${n(cx)}" cy="${HORIZON}" rx="${n(Math.min(sw * 0.4, 260))}" ry="90" fill="url(#dc-glow)" opacity="${night ? 0.6 : 0.9}"/>`
  )
}

/** The sun as a gilded disc in rings, the moon in cream, the Earth a gold globe in its tilted ring. */
function body(cx: number, cy: number, r: number, kind: 'sun' | 'moon' | 'earth'): string {
  const fill = kind === 'moon' ? CREAM : kind === 'earth' ? '#3f9a9a' : GOLD
  let out = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 2.4)}" fill="url(#dc-glow)"/>`
  if (kind === 'sun') for (const k of [1.9, 1.5]) out += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * k)}" fill="none" stroke="${GOLD_L}" stroke-opacity=".55" stroke-width=".7"/>`
  out += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" stroke="${GOLD_L}" stroke-width=".8"/>`
  if (kind === 'earth')
    out +=
      `<path d="M${n(cx - r)} ${n(cy)}H${n(cx + r)}M${n(cx)} ${n(cy - r)}V${n(cy + r)}" stroke="${GOLD_L}" stroke-width=".5" opacity=".7"/>` +
      `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r * 1.6)}" ry="${n(r * 0.38)}" transform="rotate(-17 ${n(cx)} ${n(cy)})" fill="none" stroke="${GOLD}" stroke-width="1.1"/>`
  return out
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => {
        if (attr !== 'fill') return tone(color, family)
        switch (family) {
          case 'fire':
            return 'url(#dc-fire)'
          case 'lamp':
          case 'stars':
          case 'life':
            return tone(color, family)
          case 'glass':
          case 'water':
            return 'url(#dc-glass)'
          case 'shadow':
            return BAND
          default:
            return surface(color, family, depth)
        }
      },
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient') return undefined
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return tone(mean.color, family)
        if (mean.opacity < 0.5) return 'none'
        return family === 'fire' ? 'url(#dc-fire)' : family === 'glass' || family === 'water' ? 'url(#dc-glass)' : surface(mean.color, family, 0.5)
      },
      // A fine gold edge on every nearer shape; air, light and the far haze have none.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'life' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'fire' || family === 'lamp' || family === 'grass' || depth < 0.4
          ? ''
          : `stroke="${GOLD}" stroke-opacity="${n(0.45 + depth * 0.4)}" stroke-width="${n(0.25 + depth * 0.3)}"`,
      lineless: 0.6,
      faint: 'hide',
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${GOLD_L}" opacity=".22"/>`,
      redraw: {
        sky,
        lens: () => '',
        glow: () => '',
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 4)}" fill="url(#dc-glow)" opacity=".6"/>`
          if (c.role === 'space.earth') return body(cx, cy, r, 'earth')
          return body(cx, cy, r, night || /moon/.test(c.role) ? 'moon' : 'sun')
        },
        // Clouds are streamlined bands: cream over gold by day, slate over teal by night.
        cloud: (svg, c) => {
          const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
          const fill = night || lum(lit) < 0.4 ? 'url(#dc-cloudn)' : 'url(#dc-cloud)'
          return `<g>${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${fill}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`
        },
        air: (svg, c) => `<g opacity=".2">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? '#8ab0c4' : CREAM}"`)}</g>`,
        beam: (svg, c) => `<g opacity=".3">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#dc-beam)"')}</g>`,
      },
    },
    'dc',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude streamlined: each face a vertical ramp of terracotta, edged all round in gold. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => {
      const shade = (1 - f.light) * 0.45
      const k = shade < 0.1 ? 0 : shade < 0.25 ? 1 : 2
      const face = f.name in FACES ? f.name : 'front'
      return `<path fill="url(#dc-f-${face}${k})" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${NAVY}" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx - 0.2)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor - 0.2)}" r=".6" fill="${GOLD_L}"/>`
        : `<path fill="none" stroke="${NAVY}" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="${BAND}" opacity=".45" d="${poly(m.shadow, cx, floor)}"/>` +
    `<path fill="#e2774f" stroke="${GOLD}" stroke-width="1.3" stroke-linejoin="round" d="${hulls}"/>` +
    faces +
    eyes
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const ramp = (id: string, top: string, foot: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${foot}"/></linearGradient>`
/** A tower's two tones: the lit face on the left, a hard edge, the shadowed face on the right. */
const split = (id: string, lit: string, dark: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${lit}"/><stop offset=".62" stop-color="${lit}"/><stop offset=".62" stop-color="${dark}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(): string {
  let out = ''
  for (const [kind, cs] of Object.entries(PLANES))
    cs.forEach((c, i) => {
      out += ramp(`dc-${kind}${i}`, mix(c, '#ffffff', 0.14), mix(c, '#000000', 0.22))
      out += ramp(`dc-${kind}n${i}`, dusk(mix(c, '#ffffff', 0.1)), dusk(mix(c, '#000000', 0.25)))
    })
  PLANES.teal.forEach((c, i) => {
    const lit = mix(c, '#ffffff', 0.12)
    const dark = mix(c, '#000000', 0.3)
    out += split(`dc-split${i}`, lit, dark)
    out += split(`dc-splitn${i}`, dusk(lit), dusk(dark))
  })
  for (const [face, c] of Object.entries(FACES))
    SHADES.forEach((k, i) => {
      const base = mix(c, '#3a1a20', k)
      out += ramp(`dc-f-${face}${i}`, mix(base, '#ffffff', 0.15), mix(base, '#000000', 0.2))
    })
  return (
    out +
    `<linearGradient id="dc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f4f6a"/><stop offset=".55" stop-color="#4a8a96"/><stop offset=".85" stop-color="#e0b47a"/><stop offset="1" stop-color="#f4d8a0"/></linearGradient>` +
    `<linearGradient id="dc-skyn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${NAVY}"/><stop offset=".7" stop-color="#24426a"/><stop offset="1" stop-color="#3a5a82"/></linearGradient>` +
    `<radialGradient id="dc-glow"><stop offset="0" stop-color="${GOLD_L}" stop-opacity=".6"/><stop offset="1" stop-color="${GOLD_L}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="dc-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf4e2"/><stop offset=".6" stop-color="${CREAM}"/><stop offset="1" stop-color="${GOLD}"/></linearGradient>` +
    `<linearGradient id="dc-cloudn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ab0c4"/><stop offset="1" stop-color="#2f5a70"/></linearGradient>` +
    `<linearGradient id="dc-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c8"/><stop offset="1" stop-color="#fff0c8" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="dc-fire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GOLD_L}"/><stop offset=".45" stop-color="#e8a040"/><stop offset="1" stop-color="#c8452a"/></linearGradient>` +
    `<linearGradient id="dc-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8eee4"/><stop offset=".4" stop-color="#7ac0c0"/><stop offset="1" stop-color="#164c55"/></linearGradient>`
  )
}

export const DECO: Look = {
  name: 'deco',
  label: 'Art Deco',
  voice: 'a 1930s streamline travel poster, all chrome-age optimism and gilded promise',
  cell: 'solid',
  figure: '3d',
  font: FONT,
  charW: 5.6,
  caption: { fill: CREAM, stroke: GOLD, ink: NAVY, radius: 1 },
  paper: { card: CREAM, ink: NAVY, kinds: { code: '#16606a', path: '#24426a', fn: '#7a3a6a', num: '#a8561a', bad: '#b3261e', good: '#2e6a3a', face: '#b4553a' } },
  inset: 5,
  titleColor: CREAM,
  art: {
    painter: scenery,
    hero,
    sky: '#24426a',
    ground: '#164c55',
    defs,
  },
  // The poster's double gold rule.
  frame: (sw, h) =>
    `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${GOLD}" stroke-width="1"/>` +
    `<rect x="4" y="4" width="${sw - 8}" height="${h - 8}" fill="none" stroke="${GOLD}" stroke-width=".6"/>`,
  // The chapter as the poster's title band: cream capitals, widely spaced, on navy over a gold rule.
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 2
    const t = escape(text.toUpperCase())
    const w = t.length * 7 + 12
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="15" fill="${BAND}"/>` +
        `<path d="M${x} ${y + 16.5}h${n(w)}" stroke="${GOLD}" stroke-width="1"/>` +
        `<text x="${x + 6}" y="${y + 11}" font-family="${FONT}" font-size="9" letter-spacing="1.6" fill="${CREAM}">${t}</text>`,
      w: x + w + 4,
      h: y + 19,
    }
  },
  bubble: {
    font: FONT,
    size: 9,
    charW: 5.6,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A cream card in a double frame, navy without and gold within, its tail in navy.
      `<path fill="${CREAM}" stroke="${NAVY}" stroke-width="1.2" stroke-linejoin="miter" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="1" fill="${CREAM}" stroke="${NAVY}" stroke-width="2"/>` +
      `<rect x="${n(x + 2.5)}" y="${n(y + 2.5)}" width="${w - 5}" height="${h - 5}" fill="none" stroke="${GOLD}" stroke-width=".8"/>`,
  },
}

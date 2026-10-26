/**
 * Neon, after the gallery's "Neon: diner sign, 1950s" (henrik-styles.js,
 * style 42, `sneon`), and the look's own sources: the bent-glass signs over
 * roadside diners and motels, lit against a brick wall after dark.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - The sky is a brick wall: dark red-brown courses in near-black mortar,
 *   warmer at dusk by day, deeper by night, with a soft pink wash where the
 *   sign's light falls on it.
 * - Every solid thing is a sign bent in glass tube: its shape is a dark,
 *   unlit pane in the tube's own tint, its outline a lit tube with a halo
 *   round it. Each kind of thing has its tube color: green for leaves and
 *   grass, orange for bark, pink for land and rock, cyan for buildings,
 *   glass and water, violet for clouds, yellow for fire, lamps and stars.
 *   Far things are thinner tubes with no halo.
 * - The sun and moon are yellow tube rings; the Earth a cyan ring with a
 *   green tube for land. Stars are yellow points of light.
 * - Claude is bent in orange glass, as on the sign: the outline a hot orange
 *   tube, the front face traced in coral, the eyes in blue, the glass between
 *   a dark pane, faintly lit, and now and then the whole sign flickers.
 * - The chapter is a pink script tube, the caption a dark pane in a pink
 *   tube, the screen framed in one too.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { lum, meanOf, mix, num as n, poly } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const SANS = "'Futura', 'Century Gothic', 'Avenir Next', 'Trebuchet MS', Arial, sans-serif"
const SCRIPT = "'Snell Roundhand', 'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive"
const MORTAR = '#120a0c'
const PANE = '#1a1214'
/** The tube each kind of thing is bent in. */
const TUBE: Partial<Record<Family, string>> = {
  foliage: '#3dff7a',
  grass: '#3dff7a',
  bark: '#ff8a3d',
  land: '#ff4fa3',
  ground: '#ff4fa3',
  rock: '#ff6fd0',
  built: '#5fc8ff',
  glass: '#5fc8ff',
  water: '#4fa8ff',
  cloud: '#c08aff',
  fire: '#fff27a',
  lamp: '#fff27a',
  stars: '#fff27a',
  body: '#fff27a',
  life: '#ff8a3d',
  mark: '#ff4fa3',
  shadow: '#ff4fa3',
}
const tubeOf = (family: Family) => TUBE[family] ?? '#ff6f61'

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** A dark, unlit pane of glass in the tube's tint: lighter lit colors show a little more of it. */
function pane(color: string, family: Family): string {
  const t = lum(color)
  return mix(tubeOf(family), MORTAR, 0.84 - t * 0.22)
}

/** The sky as a brick wall, warmer by day, deeper by night, with the sign's pink wash on it. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  return (
    `<rect width="${n(sw)}" height="128" fill="url(#${night ? 'ne-brickn' : 'ne-brick'})"/>` +
    `<rect width="${n(sw)}" height="128" fill="url(#ne-vignette)"/>` +
    `<ellipse cx="${n(sw * 0.5)}" cy="70" rx="${n(sw * 0.45)}" ry="70" fill="url(#ne-wash)"/>`
  )
}

/** A ring of tube: the sun, the moon, or the Earth with a green tube of land across it. */
function ring(cx: number, cy: number, r: number, color: string, earth: boolean): string {
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 2.4)}" fill="url(#ne-wash)"/>` +
    `<g filter="url(#ne-glow)" fill="none" stroke-linecap="round">` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${PANE}" stroke="${color}" stroke-width="1.4"/>` +
    (earth
      ? `<path d="M${n(cx - r * 0.6)} ${n(cy - r * 0.2)}q${n(r * 0.3)} ${n(-r * 0.4)} ${n(r * 0.6)} 0t${n(r * 0.5)} ${n(r * 0.5)}" stroke="#3dff7a" stroke-width="1"/>`
      : `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.55)}" stroke="#ffffff" stroke-opacity=".6" stroke-width=".5"/>`) +
    `</g>`
  )
}

const scenery = () => {
  night = false
  return painter(
    {
      // Fills are unlit panes in the tube's tint; lines, stops and currentColor take the tube itself, or the pane for a stop.
      ink: (color, family, _depth, attr) => {
        if (attr === 'stroke') return tubeOf(family)
        switch (family) {
          case 'fire':
          case 'lamp':
          case 'stars':
            return tubeOf(family)
          case 'shadow':
            return MORTAR
          default:
            return pane(color, family)
        }
      },
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient') return undefined
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return tubeOf(family)
        if (mean.opacity < 0.5) return 'none'
        return family === 'fire' ? 'url(#ne-fire)' : pane(mean.color, family)
      },
      // Every nearer shape outlined in its lit tube with a halo; far things in a thin tube; air and light in none.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow'
          ? ''
          : depth < 0.25
            ? `stroke="${tubeOf(family)}" stroke-opacity=".7" stroke-width=".4" stroke-linejoin="round"`
            : `stroke="${tubeOf(family)}" stroke-width="${n(0.5 + depth * 0.5)}" stroke-linejoin="round" filter="url(#ne-glow)"`,
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool is the tube's light thrown on the floor.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="url(#ne-pool)"/>`,
      redraw: {
        sky,
        lens: () => '',
        glow: () => '',
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 4)}" fill="url(#ne-wash)"/>`
          return c.role === 'space.earth' ? ring(cx, cy, r, '#5fc8ff', true) : ring(cx, cy, r, night ? '#fff6c0' : '#fff27a', false)
        },
        air: (svg, c) => `<g opacity=".18">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="#ff8ad0"')}</g>`,
        beam: (svg, c) => `<g opacity=".22">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#ne-beam)"')}</g>`,
      },
    },
    'ne',
  )
}

// ---------------------------------------------------------------- Claude

/**
 * Claude bent in orange glass: one dark pane behind, the outline a hot tube, the
 * front face in coral, blue eyes, an occasional flicker. The pane is one path
 * for all the hulls, not a path a face: a sign has no shading to draw, and every
 * pose Claude is baked in would carry each face again.
 */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const front = outlinedFaces(m).filter(f => f.part === 'body' && f.name === 'front').map(f => poly(f.pts, cx, floor)).join('')
  const eyes = m.eyes.map(e => (e.poly ? poly(e.poly, cx, floor) : poly(e.line ?? [], cx, floor, false))).join('')
  return (
    `<path fill="#ff8a3d" opacity=".22" d="${poly(m.shadow, cx, floor)}"/>` +
    `<g fill="none" stroke-linejoin="round" stroke-linecap="round" filter="url(#ne-glow)">` +
    `<path fill="url(#ne-pane)" stroke="#ff8a3d" stroke-width="1.6" d="${hulls}"/>` +
    (front ? `<path stroke="#ff6f61" stroke-width="1" d="${front}"/>` : '') +
    `<path stroke="#5fc8ff" stroke-width="1.1" d="${eyes}"/>` +
    `<animate attributeName="opacity" values="1;1;.35;1;.3;1;1" keyTimes="0;.86;.88;.9;.92;.94;1" dur="9s" repeatCount="indefinite"/></g>`
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A course of bricks in mortar, as a pattern: `brick` the face color, `hi` its lighter run. */
const bricks = (id: string, mortar: string, brick: string, hi: string) =>
  `<pattern id="${id}" width="44" height="18" patternUnits="userSpaceOnUse"><rect width="44" height="18" fill="${mortar}"/>` +
  `<rect x="1" y="1" width="20" height="7.5" fill="${brick}"/><rect x="23" y="1" width="20" height="7.5" fill="${hi}"/>` +
  `<rect x="-10" y="10" width="20" height="7.5" fill="${hi}"/><rect x="12" y="10" width="20" height="7.5" fill="${brick}"/><rect x="34" y="10" width="20" height="7.5" fill="${hi}"/></pattern>`

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(): string {
  return (
    `<filter id="ne-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    bricks('ne-brick', '#1e1214', '#5a3032', '#6a3a3a') +
    bricks('ne-brickn', '#140c0e', '#3e2426', '#4a2c2e') +
    `<linearGradient id="ne-pane" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="#5a2a1c"/><stop offset="1" stop-color="#2a120e"/></linearGradient>` +
    `<radialGradient id="ne-vignette" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>` +
    `<radialGradient id="ne-wash"><stop offset="0" stop-color="#ff5aa8" stop-opacity=".3"/><stop offset="1" stop-color="#ff5aa8" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ne-pool"><stop offset="0" stop-color="#fff27a" stop-opacity=".35"/><stop offset=".6" stop-color="#ff8a3d" stop-opacity=".15"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="ne-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff27a"/><stop offset="1" stop-color="#fff27a" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="ne-fire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0"/><stop offset=".45" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff2a7a"/></linearGradient>`
  )
}

export const NEON: Look = {
  name: 'neon',
  label: 'Neon',
  voice: 'a 1950s diner sign buzzing in the window, all chrome-stool cheer and blue-plate patter',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 5.3,
  caption: { fill: PANE, stroke: '#ff4fa3', ink: '#fff0f6', radius: 6 },
  paper: { card: PANE, ink: '#fff0f6', kinds: { code: '#5fc8ff', path: '#ff8a3d', fn: '#ff6fd0', num: '#fff27a', bad: '#ff5a5a', good: '#3dff7a', face: '#ff6fd0' } },
  inset: 5,
  titleColor: '#ff4fa3',
  art: {
    painter: scenery,
    hero,
    sky: '#3e2426',
    ground: '#24161a',
    defs,
  },
  // The screen framed in a pink tube, a dark margin inside it.
  frame: (sw, h) =>
    `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" rx="5" fill="none" stroke="${MORTAR}" stroke-width="2"/>` +
    `<rect x="3" y="3" width="${sw - 6}" height="${h - 6}" rx="5" fill="none" stroke="#ff4fa3" stroke-width="1" filter="url(#ne-glow)"/>`,
  // The chapter in pink script tube, as the diner's name on the sign.
  tag: (text, inset) => {
    const x = inset + 6
    const y = inset + 14
    const w = text.length * 6.4 + 6
    return {
      svg:
        `<text x="${n(x)}" y="${n(y)}" font-family="${SCRIPT}" font-size="14" font-style="italic" font-weight="700" fill="#ffd0e8" stroke="#ff4fa3" stroke-width=".6" filter="url(#ne-glow)">${escape(text)}` +
        `<animate attributeName="stroke-opacity" values="1;1;.4;1" keyTimes="0;.9;.93;1" dur="11s" repeatCount="indefinite"/></text>`,
      w: x + w + 4,
      h: y + 6,
    }
  },
  bubble: {
    font: SANS,
    size: 9,
    charW: 5.3,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A dark pane in a pink tube, its tail bent in the same tube.
      `<g stroke="#ff4fa3" stroke-width="1.1" stroke-linejoin="round" filter="url(#ne-glow)">` +
      `<path fill="${PANE}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="6" fill="${PANE}"/></g>`,
  },
}

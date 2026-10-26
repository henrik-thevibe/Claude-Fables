/**
 * Silhouette, after the gallery's "Silhouette: cut paper, c. 1790"
 * (henrik-styles.js, style 35, `ssil`), and the look's own sources: the
 * profile cutters of the Georgian parlour, and the paper-cut landscapes and
 * shadow theatres that followed them.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Everything solid is cut from paper with one clean stroke of the scissors
 *   and laid on a cream card: no line, no shading, no texture in the cut.
 *   The nearest things are the black paper of the portrait; things further
 *   off are cut from greyer and paler papers, layer behind layer, so the
 *   depth of a world is told in the tone of its sheets alone.
 * - The card is the sky: cream, warming toward its edge as an old mount does.
 *   Night is the same card under moonlight, a pale blue-grey; never dark.
 *   Clouds and mist are cut from white paper laid on the card.
 * - Gilt is the only color: the sun, the moon and the stars are gilt paper,
 *   and so are fire and lamplight. Light itself is not drawn.
 * - Claude is the gallery's portrait: one black cut, lifted a hair off the
 *   card so it throws a faint shadow, a margin of card left round him so he
 *   stands clear of the black sheets behind, his eyes cut clean through.
 * - The picture hangs in a gilt frame with a beaded rim; the chapter is the
 *   sitter's name on a cream label, the caption written on a cream card in
 *   a gilt rule.
 */
import type { HeroPainter } from '../hero3d'
import type { Model } from '../clawd3d'
import { lum, meanOf, mix, num as n, poly } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const SERIF = "'Didot', 'Bodoni 72', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif"
const CUT = '#121110'
const CREAM = '#f2ead6'
const INK = '#3d3a33'
const GOLD = '#c99a3d'
const GOLD_D = '#7a5a1c'

/** The papers, far to near, by day and by moonlight. */
const PAPERS = {
  day: { far: '#c4b89e', mid: '#6e6556', near: CUT },
  night: { far: '#9aa3b0', mid: '#4e5462', near: CUT },
} as const

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** The paper a thing at this depth is cut from; a lighter lit color picks a slightly paler sheet of the same layer. */
function paper(color: string, depth: number): string {
  const p = night ? PAPERS.night : PAPERS.day
  const d = Math.max(0, Math.min(1, depth))
  const base = d < 0.5 ? mix(p.far, p.mid, d / 0.5) : mix(p.mid, p.near, Math.min(1, (d - 0.5) / 0.35))
  return mix(base, night ? '#d8dde4' : CREAM, Math.max(0, lum(color) - 0.45) * 0.35)
}

function ink(color: string, family: Family, depth: number): string {
  switch (family) {
    case 'fire':
      return 'url(#sl-gilt)'
    case 'lamp':
    case 'stars':
    case 'life':
      return family === 'life' ? paper(color, Math.max(depth, 0.8)) : GOLD
    case 'glass':
      return night ? '#c2c9d2' : '#e6dcc4'
    case 'cloud':
    case 'air':
      return night ? '#e4e8ee' : '#fbf7ec'
    case 'shadow':
      return night ? '#3a3f4a' : '#4a4237'
    default:
      return paper(color, depth)
  }
}

/** The card: cream warming toward its edge, or the same card under moonlight. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  night = lum(top) < 0.2 && lum(low) < 0.45
  return `<rect width="${n(c.meta.sw ?? 640)}" height="128" fill="url(#${night ? 'sl-moon' : 'sl-card'})"/>`
}

/** The sun and moon as gilt paper discs, the Earth as a gilt one with its continents cut out in card. */
function body(_svg: string, c: Ctx): string {
  if (c.meta.part === 'halo') return ''
  const cx = n(c.meta.cx ?? 0)
  const cy = n(c.meta.cy ?? 0)
  const r = c.meta.r ?? 8
  const disc = `<circle cx="${cx}" cy="${cy}" r="${n(r)}" fill="url(#sl-gilt)" stroke="${GOLD_D}" stroke-width=".5"/>`
  if (c.role === 'night.moon') return disc + `<circle cx="${n((c.meta.cx ?? 0) + r * 0.4)}" cy="${n((c.meta.cy ?? 0) - r * 0.25)}" r="${n(r * 0.85)}" fill="url(#sl-moon)"/>`
  if (c.role === 'space.earth')
    return disc + `<path fill="${night ? '#c9cfd6' : CREAM}" d="M${n((c.meta.cx ?? 0) - r * 0.5)} ${n((c.meta.cy ?? 0) - r * 0.3)}q${n(r * 0.4)} ${n(-r * 0.4)} ${n(r * 0.7)} 0t${n(r * 0.2)} ${n(r * 0.6)}q${n(-r * 0.5)} ${n(r * 0.2)} ${n(-r * 0.9)} ${n(-r * 0.6)}z"/>`
  return disc
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, depth, attr) => (attr === 'stroke' && family !== 'fire' && family !== 'lamp' ? paper(color, depth) : ink(color, family, depth)),
      // A gradient is one sheet of paper in its overall tone; a faint wash of light is not drawn.
      url: (_id, family, _attr, g) => {
        if (g?.tag === 'radialGradient' && family !== 'fire') return 'none'
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (mean.opacity < 0.5) return 'none'
        return ink(mean.color, family, family === 'sky' ? 0 : 0.5)
      },
      // Scissors leave no line.
      line: () => '',
      lineless: 0.6,
      faint: 'hide',
      opacity: (family, v) => (family === 'cloud' || family === 'air' ? Math.max(0.6, v) : v >= 0.4 ? 1 : v),
      // A lamp's pool is a gilt paper ellipse on the floor.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.7)}" ry="${n(e.ry * 0.6)}" fill="${GOLD}" opacity=".55"/>`,
      redraw: {
        sky,
        body,
        lens: () => '',
        glow: () => '',
        beam: () => '',
      },
    },
    'sl',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude as the portrait: one black cut, a margin of card round him, a faint shadow, eyes cut through. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${CREAM}" d="${poly(e.poly, cx, floor)}"/>`
        : `<path fill="none" stroke="${CREAM}" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="#4a4237" opacity=".5" d="${poly(m.shadow, cx, floor)}"/>` +
    // The margin of card, then the shadow the lifted paper throws, then the cut itself.
    `<path fill="${CREAM}" stroke="${CREAM}" stroke-width="2.6" stroke-linejoin="round" d="${hulls}"/>` +
    `<path fill="#3c2d14" opacity=".28" transform="translate(.7 .9)" d="${hulls}"/>` +
    `<path fill="${CUT}" d="${hulls}"/>` +
    eyes
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const defs = () =>
  `<linearGradient id="sl-gilt" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#f0d58a"/><stop offset=".45" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD_D}"/></linearGradient>` +
  `<radialGradient id="sl-card" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#fbf6e8"/><stop offset="1" stop-color="#ddd2b6"/></radialGradient>` +
  `<radialGradient id="sl-moon" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#e2e6ea"/><stop offset="1" stop-color="#a9b2be"/></radialGradient>` +
  `<radialGradient id="sl-age" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#5a4020" stop-opacity="0"/><stop offset="1" stop-color="#5a4020" stop-opacity=".22"/></radialGradient>` +
  `<linearGradient id="sl-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d58a"/><stop offset=".45" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD_D}"/></linearGradient>`

export const SILHOUETTE: Look = {
  name: 'silhouette',
  label: 'Silhouette',
  voice: 'a genteel Georgian parlour, 1790, the sitter described with polite formality',
  cell: 'solid',
  figure: '3d',
  font: SERIF,
  charW: 5,
  caption: { fill: CREAM, stroke: GOLD, ink: INK, radius: 3 },
  paper: { card: '#f7f1e2', ink: '#2a2620', kinds: { code: '#2d5a43', path: '#3a4a7a', fn: '#6a2f5a', num: '#8a5a12', bad: '#a0281e', good: '#2e6b3a', face: '#8a5a12' } },
  inset: 6,
  titleColor: INK,
  art: {
    painter: scenery,
    hero,
    sky: '#ddd2b6',
    ground: CUT,
    defs,
  },
  // The card yellows toward its edges, as an old mount does.
  texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#sl-age)"/>`,
  // A gilt frame: a dark edge, the gilt moulding, a rim of gilt beads, and the dark slip inside.
  frame: (sw, h) =>
    `<rect x="1.8" y="1.8" width="${sw - 3.6}" height="${h - 3.6}" fill="none" stroke="url(#sl-frame)" stroke-width="3.6"/>` +
    `<rect x=".3" y=".3" width="${sw - 0.6}" height="${h - 0.6}" fill="none" stroke="${GOLD_D}" stroke-width=".6"/>` +
    `<rect x="2" y="2" width="${sw - 4}" height="${h - 4}" fill="none" stroke="#f0d58a" stroke-width="1.1" stroke-dasharray="0 2.6" stroke-linecap="round"/>` +
    `<rect x="4" y="4" width="${sw - 8}" height="${h - 8}" fill="none" stroke="#0d0c0b" stroke-width=".8"/>`,
  // The sitter's name on a cream label in a gilt rule, as under the gallery's portrait.
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 3
    const w = text.length * 5.4 + 14
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="14" rx="7" fill="${CREAM}" stroke="${GOLD}" stroke-width="1.1"/>` +
        `<text x="${n(x + w / 2)}" y="${y + 10}" text-anchor="middle" font-family="${SERIF}" font-size="8.5" font-style="italic" fill="${INK}">${escape(text)}</text>`,
      w: x + w + 4,
      h: y + 15,
    }
  },
  bubble: {
    font: SERIF,
    size: 9,
    charW: 5,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      `<path fill="${CREAM}" stroke="${GOLD_D}" stroke-width=".7" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="4" fill="${CREAM}" stroke="${GOLD}" stroke-width="1.6"/>` +
      `<rect x="${n(x + 2.4)}" y="${n(y + 2.4)}" width="${w - 4.8}" height="${h - 4.8}" rx="2.5" fill="none" stroke="${GOLD_D}" stroke-width=".4"/>`,
  },
}

/**
 * Stencil, after the gallery's "Stencil: spray paint, 2000s" (henrik-styles.js,
 * style 47, `sstencil`), and the look's own sources: the street stencils of
 * the 2000s, cut from card and sprayed fast on a concrete wall.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - The wall is the picture. Every sky is the same concrete panel, grey and
 *   grainy, ruled by its seams and studded with its bolts; by night it is the
 *   same wall under a streetlight, cooler and a step darker, never black.
 * - Every shape is sprayed through a stencil, in three layers and no more:
 *   black paint for the darks, a grey second layer for the middles, a pale
 *   layer for the lights. No gradient survives the cut. Each shape carries
 *   its overspray: a soft dark haze just outside its edge.
 * - Red is the one other can in the bag: fire, lamps, the sun and every live
 *   thing glow in it, as the gallery's heart balloon does.
 * - Stars are pale flecks of spray; the moon is a pale disc; light, beams and
 *   lens flares are not drawn, for a stencil has no light of its own.
 * - Claude is the gallery's cut: a black body in a ring of bare wall, haloed
 *   in overspray, a grey second layer on his tops, his eyes left bare, and
 *   paint dripping from his feet.
 * - The chapter is cut as a stencil, its letters broken by bridges, with a
 *   blue tag scrawled under it; the caption is a paper paste-up on the wall.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { lum, meanOf, num as n, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const GROTESK = "'Helvetica Neue', 'Arial Black', Arial, sans-serif"
const PAINT = '#1d1c1c'
const GREY = '#5b5856'
const PALE = '#dedad2'
const RED = '#d0261d'
const BLUE = '#3c5bb5'
const WALL = '#b9b5ad'

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** A lit color as one of the three layers of paint, or red for what glows. */
function layer(color: string, family: Family): string {
  switch (family) {
    case 'fire':
    case 'lamp':
    case 'life':
      return RED
    case 'stars':
      return PALE
    case 'shadow':
      return PAINT
    case 'sky':
      return WALL
    default: {
      const t = lum(color)
      return t < 0.3 ? PAINT : t < 0.58 ? GREY : PALE
    }
  }
}

/** The wall: a concrete panel ruled by seams, studded with bolts, a streetlight's pool on it by night. */
function wall(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? '#80a0c0'
  const low = stops[stops.length - 1]?.color ?? top
  night = lum(top) < 0.2 && lum(low) < 0.45
  const sw = c.meta.sw ?? 640
  let bolts = ''
  for (let x = 40; x < sw; x += 140) for (const y of [24, 92]) bolts += `<use href="#st-bolt" x="${x}" y="${y}"/>`
  return (
    `<rect width="${n(sw)}" height="128" fill="url(#${night ? 'st-walln' : 'st-wall'})"/>` +
    (night ? `<ellipse cx="${n(sw * 0.72)}" cy="20" rx="${n(sw * 0.3)}" ry="70" fill="url(#st-lamp)"/>` : '') +
    `<path d="M0 44H${n(sw)}M0 112H${n(sw)}" stroke="#3c3a36" stroke-opacity=".35" stroke-width=".7"/>` +
    bolts
  )
}

/** The sun as a red disc, the moon a pale one, the Earth grey: each sprayed with its overspray. */
function disc(_svg: string, c: Ctx): string {
  if (c.meta.part === 'halo') return ''
  const cx = n(c.meta.cx ?? 0)
  const cy = n(c.meta.cy ?? 0)
  const r = c.meta.r ?? 8
  const fill = c.role === 'space.earth' ? GREY : night ? PALE : RED
  return `<circle cx="${cx}" cy="${cy}" r="${n(r + 1.6)}" fill="${fill}" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="${n(r)}" fill="${fill}"/>`
}

const scenery = () => {
  night = false
  return painter(
    {
      ink: (color, family, _depth, attr) => (attr === 'stroke' ? (family === 'fire' || family === 'lamp' ? RED : PAINT) : layer(color, family)),
      // A gradient is cut as one layer, in its overall tone; a faint wash of light is not drawn.
      url: (_id, family, attr, g) => {
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return PAINT
        if (mean.opacity < 0.5) return 'none'
        return layer(mean.color, family)
      },
      // Overspray: a soft dark haze just outside every nearer shape's edge.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || depth < 0.2
          ? ''
          : `stroke="${PAINT}" stroke-opacity="${n(0.12 + depth * 0.12)}" stroke-width="${n(0.8 + depth * 0.9)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: 'hide',
      opacity: (_f, v) => (v >= 0.4 ? 1 : v),
      // A lamp's pool is a pale mist of spray on the ground.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${PALE}" opacity=".35"/>`,
      redraw: {
        sky: wall,
        body: disc,
        lens: () => '',
        glow: () => '',
        beam: () => '',
        air: (svg, c) => `<g opacity=".3">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${PALE}"`)}</g>`,
      },
    },
    'st',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude as the gallery's cut: overspray, a ring of bare wall, black paint, grey tops, bare eyes, drips. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const tops = outlinedFaces(m)
    .filter(f => f.name === 'top' && f.part === 'body')
    .map(f => poly(f.pts, cx, floor))
    .join('')
  const eyes = m.eyes
    .map(e => (e.poly ? `<path fill="${PALE}" d="${poly(e.poly, cx, floor)}"/>` : `<path fill="none" stroke="${PALE}" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`))
    .join('')
  // Drips from the feet: one under every other leg, its length set by where it hangs.
  let drips = ''
  m.parts
    .filter(p => p.name === 'leg')
    .forEach((p, i) => {
      if (i % 2) return
      const foot = p.hull.reduce((a, b) => (b[1] > a[1] ? b : a))
      const x = foot[0] + cx - 0.6
      const y = foot[1] + floor
      const len = 2.5 + ((i * 7) % 5)
      drips += `M${t1(x)} ${t1(y - 1)}V${t1(y + len)}`
    })
  return (
    `<path fill="none" stroke="${PAINT}" stroke-opacity=".1" stroke-width="7" stroke-linejoin="round" d="${hulls}"/>` +
    `<path fill="none" stroke="${PALE}" stroke-opacity=".85" stroke-width="3.2" stroke-linejoin="round" d="${hulls}"/>` +
    `<path fill="${PAINT}" stroke="${PAINT}" stroke-opacity=".4" stroke-width="1" stroke-linejoin="round" d="${hulls}"/>` +
    (tops ? `<path fill="${GREY}" d="${tops}"/>` : '') +
    eyes +
    (drips ? `<path fill="none" stroke="${PAINT}" stroke-width=".8" stroke-linecap="round" d="${drips}"/>` : '')
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const STENCIL: Look = {
  name: 'stencil',
  label: 'Stencil',
  voice: 'a terse street stencil slogan, sprayed fast',
  cell: 'solid',
  figure: '3d',
  font: GROTESK,
  charW: 5.4,
  caption: { fill: '#ebe7de', stroke: PAINT, ink: PAINT, radius: 0 },
  paper: { card: '#ebe7de', ink: PAINT, kinds: { code: '#24439a', path: '#1f6a5a', fn: '#7a2a8a', num: '#b8521a', bad: RED, good: '#2a7a3a', face: RED } },
  inset: 5,
  titleColor: PAINT,
  art: {
    painter: scenery,
    hero,
    sky: WALL,
    ground: GREY,
    defs: () =>
      `<linearGradient id="st-wall" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#c4c0b8"/><stop offset=".6" stop-color="${WALL}"/><stop offset="1" stop-color="#a9a59d"/></linearGradient>` +
      `<linearGradient id="st-walln" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#6c6e74"/><stop offset=".6" stop-color="#83848a"/><stop offset="1" stop-color="#76777c"/></linearGradient>` +
      `<radialGradient id="st-lamp"><stop offset="0" stop-color="#f2e6c4" stop-opacity=".45"/><stop offset="1" stop-color="#f2e6c4" stop-opacity="0"/></radialGradient>` +
      `<g id="st-bolt"><circle cx=".5" cy=".5" r="2.2" fill="#ffffff" fill-opacity=".25"/><circle r="1.9" fill="#5f5b55"/></g>` +
      // The concrete's grain: flecks of light and dark aggregate, one tile repeated.
      `<pattern id="st-grain" width="9" height="7" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.5" r=".35" fill="#000" fill-opacity=".12"/><circle cx="5.6" cy="4.2" r=".3" fill="#fff" fill-opacity=".14"/><circle cx="7.8" cy="0.8" r=".25" fill="#000" fill-opacity=".1"/><circle cx="3.3" cy="5.9" r=".3" fill="#000" fill-opacity=".08"/></pattern>` +
      // The stencil's bridges: thin gaps cut through the chapter's letters.
      `<pattern id="st-bridges" width="6.4" height="20" patternUnits="userSpaceOnUse"><rect width="6.4" height="20" fill="#fff"/><rect x="5.6" width=".8" height="20" fill="#000"/></pattern>` +
      `<mask id="st-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="2000" height="200"><rect width="2000" height="200" fill="url(#st-bridges)"/></mask>`,
  },
  texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#st-grain)"/>`,
  // The panel's edge: a rule of black paint with its overspray.
  frame: (sw, h) =>
    `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${PAINT}" stroke-opacity=".18" stroke-width="3.4"/>` +
    `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${PAINT}" stroke-width="1.6"/>`,
  // The chapter cut as a stencil: heavy capitals broken by bridges, a blue tag scrawled under them.
  tag: (text, inset) => {
    const x = inset + 6
    const y = inset + 13
    const w = text.length * 6.6
    let scrawl = `M${n(x)} ${n(y + 4)}`
    for (let k = 1; k <= 12; k++) scrawl += `L${n(x + (k * w) / 12)} ${n(y + 4 - Math.sin(k * 0.9) * 1.2)}`
    return {
      svg:
        `<rect x="${x - 3}" y="${y - 10}" width="${n(w + 6)}" height="16" fill="${WALL}" opacity=".85"/>` +
        `<text x="${x}" y="${y}" font-family="${GROTESK}" font-size="10" font-weight="900" letter-spacing="1.2" fill="${PAINT}" mask="url(#st-cut)">${escape(text.toUpperCase())}</text>` +
        `<path d="${scrawl}" fill="none" stroke="${BLUE}" stroke-width=".8" stroke-linecap="round"/>`,
      w: x + w + 6,
      h: y + 7,
    }
  },
  bubble: {
    font: GROTESK,
    size: 9,
    charW: 5.4,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A paper paste-up: its overspray shadow, the sheet, a black rule, its tail cut from the same sheet.
      `<rect x="${n(x + 1.6)}" y="${n(y + 1.8)}" width="${w}" height="${h}" fill="${PAINT}" opacity=".22"/>` +
      `<path fill="#ebe7de" stroke="${PAINT}" stroke-width=".9" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#ebe7de" stroke="${PAINT}" stroke-width="1.3"/>`,
  },
}

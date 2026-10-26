/**
 * Sampler, after the gallery's "Sampler: Cross-stitch, 1840s" (henrik-styles.js,
 * style 37, `ssampler`): a Victorian girl's cross-stitch sampler, the alphabet,
 * a date between two hearts, two little trees and HOME SWEET ~/ along the hem.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Stitched, not painted: the whole scene sits on the count of the linen,
 *   one cross to a square, every square a single thread. Each cross has its
 *   darker underside showing at the arms and a little sheen on top, and the
 *   bare linen shows between the squares as the holes of the cloth.
 * - A sampler's few threads: turkey red, indigo, a leaf green, a walnut
 *   brown, a gold silk and the undyed linen. Every element is worked in the
 *   thread nearest its color, its tones in two or three skeins, never a blend.
 * - Skies are indigo, pale by day and deep by night (never black: a girl had
 *   no black silk to spare); the sun is gold, the moon and the stars linen.
 *   Grass and leaves are the green, bark and earth the walnut, brick and
 *   fire the red.
 * - Claude is the gallery's: worked in three clay skeins, the top lightest,
 *   the sides darkest, a rim of the deepest, two dark crosses for his eyes.
 * - The cloth is bordered in a stitched band of green crosses broken with
 *   red; the chapter is worked in red on a linen tab, and the caption sits
 *   on linen inside a running stitch.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, num as n, poly, step } from '../art/ink'
import { painter } from '../art/painter'
import type { Family } from '../art/roles'
import { cells } from '../grade'
import type { Look } from '../looks'

/** The threads, dark to light. Nothing darker than the deepest indigo or walnut. */
const T = {
  red: ['#5e1a14', '#8a2a22', '#a8392f', '#c9584a', '#e08a78'],
  blue: ['#1e2c52', '#2c4272', '#3b5a8a', '#6a8ab8', '#a8c0dc'],
  green: ['#22381a', '#3b5a28', '#5d7a3e', '#86a25a', '#b8cc8a'],
  brown: ['#2e1c12', '#4a2e1e', '#5a3a28', '#80583a', '#a88460'],
  gold: ['#7a5418', '#a87a24', '#c99a3d', '#e2c06a', '#f2dc9a'],
  linen: ['#b8a47a', '#d4c39c', '#e7dab9', '#f3ead2'],
}
const CLAY = ['#6b2a1c', '#8d3d29', '#9c4430', '#c25537', '#d0603c', '#eba27c']
const EYE = '#2a1c16'
const LINEN = T.linen[2]!
const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
/** One square of the linen's count, in stage units. */
const COUNT = 2.6

/** The thread nearest a lit color, by what it is. */
function thread(color: string, family: Family): string {
  const t = Math.min(1, Math.pow(lum(color), 0.75) * 1.1)
  const warm = isWarm(color)
  switch (family) {
    case 'sky':
    case 'water':
    case 'glass':
      return warm && t > 0.35 ? step(T.gold, t) : step(T.blue, t)
    case 'stars':
    case 'life':
      return T.linen[3]!
    case 'body':
      return warm ? step(T.gold, Math.max(0.5, t)) : step(T.linen, t)
    case 'cloud':
    case 'air':
      return t < 0.4 ? step(T.blue, t + 0.3) : step(T.linen, t)
    case 'fire':
      return t > 0.6 ? T.gold[3]! : step(T.red, t)
    case 'lamp':
      return step(T.gold, Math.max(0.6, t))
    case 'foliage':
    case 'grass':
      return step(T.green, t)
    case 'bark':
      return step(T.brown, t)
    case 'shadow':
      return T.brown[1]!
    case 'mark':
      return step(T.red, t)
    default:
      return isGreen(color)
        ? step(T.green, t)
        : warm && redish(color)
          ? step(T.red, t)
          : warm
            ? step(T.brown, t)
            : t > 0.72
              ? step(T.linen, t)
              : step(T.blue, t)
  }
}
/** Whether a warm color leans red (brick, clay) rather than brown (earth, wood). */
function redish(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  return r > g * 1.6
}

const scenery = () =>
  painter(
    {
      ink: (color, family) => thread(color, family),
      url: (_id, family, _attr, g) => (g && meanOf(g).opacity < 0.5 ? 'none' : thread(g ? meanOf(g).color : '#808080', family)),
      // Cross-stitch has no outline: a shape is where its crosses are.
      line: () => '',
      // A thread is there or it is not: no half-worked crosses.
      opacity: (_f, v) => (v >= 0.4 ? 1 : 0),
      lineless: 0.6,
      faint: 'hide',
      redraw: {
        lens: () => '',
        glow: () => '',
        beam: () => '',
        // Stars worked as small linen crosses, big enough to keep on the count.
        stars: (svg, c) =>
          c
            .repaint(svg)
            .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
              const pts: [string, string][] =
                tag === 'path'
                  ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
                  : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
              const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
              return `<g${kept}>${pts.map(([x, y]) => `<use href="#sm-star" x="${x}" y="${y}"/>`).join('')}${close ? '</g>' : ''}`
            })
            .replace(/<\/(path|rect)>/g, '</g>'),
      },
    },
    'sm',
  )

/** Claude worked in the gallery's three clay skeins, the top lightest, a rim of the deepest, two dark crosses for eyes. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  let faces = ''
  for (const f of outlinedFaces(m)) {
    const k = f.part === 'leg' ? 1 + f.light * 2 : 1.5 + f.light * 4
    faces += `<path fill="${CLAY[Math.min(5, Math.round(k))]}" d="${poly(f.pts, cx, floor)}"/>`
  }
  const eyes = m.eyes
    .map(e => (e.poly ? `<path fill="${EYE}" stroke="${EYE}" stroke-width=".8" d="${poly(e.poly, cx, floor)}"/>` : `<path fill="none" stroke="${EYE}" stroke-width="2.2" d="${poly(e.line ?? [], cx, floor, false)}"/>`))
    .join('')
  return `<path fill="${T.brown[1]}" opacity=".55" d="${poly(m.shadow, cx, floor)}"/><path fill="${CLAY[0]}" stroke="${CLAY[0]}" stroke-width="2.4" stroke-linejoin="round" d="${hulls}"/>` + faces + eyes
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** One cross on the count: the linen's holes round the square, the darker underside at its arms, a sheen on the top thread. */
const CROSS =
  `<pattern id="sm-x" width="${COUNT}" height="${COUNT}" patternUnits="userSpaceOnUse">` +
  `<path d="M0 0h${COUNT}M0 0v${COUNT}" stroke="${T.linen[1]}" stroke-opacity=".55" stroke-width=".35"/>` +
  `<path d="M.45 .45L${n(COUNT - 0.45)} ${n(COUNT - 0.45)}M${n(COUNT - 0.45)} .45L.45 ${n(COUNT - 0.45)}" stroke="#1a0e08" stroke-opacity=".32" stroke-width=".55" stroke-linecap="round"/>` +
  `<path d="M.7 .5L${n(COUNT - 0.6)} ${n(COUNT - 0.8)}" stroke="#fff" stroke-opacity=".22" stroke-width=".3" stroke-linecap="round"/></pattern>`

/** The border band: green crosses, every third one red, one repeat worked once and tiled. */
const BAND = 5
const BORDER =
  `<pattern id="sm-band" width="${BAND * 3}" height="${BAND}" patternUnits="userSpaceOnUse"><rect width="${BAND * 3}" height="${BAND}" fill="${LINEN}"/>` +
  [T.green[2], T.green[2], T.red[2]].map((c, i) => `<path d="M${i * BAND + 1} 1l3 3M${i * BAND + 4} 1l-3 3" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`).join('') +
  `</pattern>`

export const SAMPLER: Look = {
  name: 'sampler',
  label: 'Sampler',
  voice: 'a pious little motto stitched on an 1840s sampler',
  cell: 'solid',
  figure: '3d',
  font: SERIF,
  charW: 5.1,
  caption: { fill: '#efe4c8', stroke: T.red[2]!, ink: '#3a2418', radius: 0 },
  paper: { card: '#efe4c8', ink: '#3a2418', kinds: { code: '#2c4272', path: '#2a6a6a', fn: '#7a3a7a', num: '#9a6418', bad: '#a8392f', good: '#3b6a28', face: '#c25537' } },
  inset: 6,
  titleColor: LINEN,
  // The medium: the whole stage on the linen's count, one thread to a square.
  grade: () => cells('SourceGraphic', COUNT, 'stitch'),
  art: {
    painter: scenery,
    hero,
    sky: T.blue[3]!,
    ground: T.green[2]!,
    defs: () =>
      CROSS +
      BORDER +
      `<path id="sm-star" d="M-1.6 -1.6L1.6 1.6M1.6 -1.6L-1.6 1.6" stroke="${T.linen[3]}" stroke-width="1.6" stroke-linecap="round"/>`,
  },
  texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#sm-x)"/>`,
  frame: (sw, h) =>
    `<rect width="${sw}" height="${BAND}" fill="url(#sm-band)"/><g transform="translate(0 ${h - BAND})"><rect width="${sw}" height="${BAND}" fill="url(#sm-band)"/></g>` +
    `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" fill="none" stroke="${T.brown[2]}" stroke-width="2"/>`,
  // The chapter worked in red on a linen tab, a running stitch round it.
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 2
    const w = text.length * 5.8 + 12
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="15" fill="#efe4c8" stroke="${T.brown[2]}" stroke-width="1"/>` +
        `<rect x="${x + 2}" y="${y + 2}" width="${n(w - 4)}" height="11" fill="none" stroke="${T.green[2]}" stroke-width=".8" stroke-dasharray="2 1.4"/>` +
        `<text x="${x + 6}" y="${y + 10.6}" font-family="${SERIF}" font-weight="700" font-size="8.4" letter-spacing=".4" fill="${T.red[1]}">${escape(text)}</text>`,
      w: x + w + 6,
      h: y + 19,
    }
  },
  bubble: {
    font: SERIF,
    size: 9,
    charW: 5.1,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      `<path fill="#efe4c8" stroke="${T.brown[2]}" stroke-width="1" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#efe4c8" stroke="${T.brown[2]}" stroke-width="1.2"/>` +
      `<rect x="${n(x + 2.2)}" y="${n(y + 2.2)}" width="${w - 4.4}" height="${h - 4.4}" fill="none" stroke="${T.red[2]}" stroke-width=".8" stroke-dasharray="2.4 1.6"/>`,
  },
}

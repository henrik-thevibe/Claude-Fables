/**
 * Patch, after the gallery's "Patch: embroidered, 2020s" (henrik-styles.js,
 * style 48, `spatch`), and the look's own sources: the iron-on and sew-on
 * patches on denim jackets, merch drops and supply-co. labels.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Everything is embroidered. Every shape is a satin stitch in one of a
 *   short run of flosses: denim blues, brick and coral reds, a mustard gold,
 *   leaf greens, walnut browns and undyed cream. A shape's tones come in steps
 *   of floss, each laid as close rows of thread, a lighter sheen on every row.
 * - Every nearer shape is outlined in a dark stem stitch, a dashed run of
 *   thread; far things and the air are stitched with no line.
 * - The sky is the denim itself: a chambray blue by day, an indigo wash by
 *   night, its twill running on the diagonal. Stars are gold cross-stitches;
 *   the sun and moon are round patches with a satin border and a running stitch.
 *   Mist and light beams are sheer organza, a pale gauze over the cloth.
 * - Claude is the gallery's patch: brick-red satin, each face laid in its own
 *   direction and lighter toward the light, black satin eyes, sewn down with a
 *   fat merrowed border and standing proud of the denim on its shadow.
 * - The picture is sewn round with a gold topstitch, the chapter on a woven
 *   cream label stitched in red, the caption on the same label.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { hue, isGreen, isWarm, lum, meanOf, mix, num as n, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const SANS = "'Futura', 'Avenir Next', 'Helvetica Neue', Arial, sans-serif"
const DARK = '#1a1412'
const LABEL = '#efe6d2'
const RED_INK = '#b8352a'

/** The flosses, dark to light, by name: every shape is stitched in one step of one of these. */
const FLOSS = {
  denim: ['#14213d', '#1f3560', '#2f5a91', '#4a78b0', '#7fa2cf', '#a9c4e4'],
  red: ['#5a1a12', '#7c2a20', '#b04a36', '#e06a42', '#f4ae86'],
  gold: ['#6a4210', '#a8701e', '#d99a3a', '#f0c060', '#f8e0a0'],
  green: ['#173a22', '#2a5a32', '#3f7d3a', '#6aa04a', '#a8c878'],
  brown: ['#2a1a10', '#4a2e1c', '#6e4a2a', '#9a6a3a', '#c49a6a'],
  cream: ['#3a3836', '#6a6660', '#a8a296', '#d8cfbc', '#efe6d2'],
} as const
type Floss = keyof typeof FLOSS
/** The satin's slant for each floss, in degrees, so neighbouring shapes catch the light differently. */
const SLANT: Record<Floss, number> = { denim: -35, red: 50, gold: 20, green: 65, brown: -60, cream: 10 }

/** The step of a ramp a lightness falls on. */
const at = (ramp: readonly string[], t: number) => Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))

/** Which floss and step a lit color is stitched in, by its family. */
function floss(color: string, family: Family): [Floss, number] {
  const t = Math.min(1, Math.pow(lum(color), 0.75) * 1.1)
  const warm = isWarm(color)
  const pickOf = (f: Floss): [Floss, number] => [f, at(FLOSS[f], t)]
  switch (family) {
    case 'fire':
      return t > 0.6 ? ['gold', 4] : t > 0.35 ? ['gold', 3] : ['red', 3]
    case 'lamp':
    case 'stars':
    case 'life':
      return ['gold', Math.max(3, at(FLOSS.gold, t))]
    case 'sky':
    case 'water':
    case 'glass':
      return warm ? pickOf('red') : pickOf('denim')
    case 'cloud':
    case 'air':
    case 'beam':
      return ['cream', Math.max(2, at(FLOSS.cream, t))]
    case 'foliage':
    case 'grass':
      return pickOf('green')
    case 'bark':
      return pickOf('brown')
    case 'shadow':
      return ['denim', 0]
    default: {
      if (isGreen(color)) return pickOf('green')
      if (hue(color).s < 0.18) return pickOf('cream')
      if (warm) return brownish(color) && t < 0.6 ? pickOf('brown') : pickOf('red')
      return pickOf('denim')
    }
  }
}
function brownish(color: string): boolean {
  const { h, s } = hue(color)
  return s < 0.6 && h >= 15 && h <= 50
}

/** A floss as a plain tone: for lines, gradient stops and currentColor. */
const plain = (color: string, family: Family) => {
  const [f, i] = floss(color, family)
  return FLOSS[f][i]!
}

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** The twill of the denim, laid over the sky. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  return `<rect width="${n(sw)}" height="128" fill="url(#${night ? 'pt-skyn' : 'pt-sky'})"/><rect width="${n(sw)}" height="128" fill="url(#pt-twill)"/>`
}

/** Stars as gold cross-stitches, one stitch defined once, placed at each star's points. */
function stars(svg: string, c: Ctx): string {
  const place = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#pt-star" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      return `<g${kept}>${place(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** A round patch: the sun in gold, the moon in cream, a satin border and a running stitch inside it. */
function roundPatch(cx: number, cy: number, r: number, f: Floss, i: number): string {
  return (
    `<circle cx="${n(cx + 1)}" cy="${n(cy + 1.4)}" r="${n(r + 1.4)}" fill="#0a1428" opacity=".4"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#pt-${f}${i})" stroke="${FLOSS[f][Math.max(0, i - 2)]}" stroke-width="2.2" stroke-dasharray=".7 .5"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.72)}" fill="none" stroke="${FLOSS[f][Math.max(0, i - 2)]}" stroke-width=".6" stroke-dasharray="1.8 1.2"/>`
  )
}

const scenery = () => {
  night = false
  return painter(
    {
      // A fill is satin in its floss; a line, a stop or a currentColor takes the floss's plain tone.
      ink: (color, family, _depth, attr) => {
        if (attr !== 'fill') return plain(color, family)
        if (family === 'shadow') return '#0f1a33'
        const [f, i] = floss(color, family)
        return `url(#pt-${f}${i})`
      },
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient') return undefined
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr !== 'fill') return plain(mean.color, family)
        if (mean.opacity < 0.5) return 'none'
        const [f, i] = floss(mean.color, family)
        return `url(#pt-${f}${i})`
      },
      // A dark stem stitch round every nearer shape; air, light and the far distance have none.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'life' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'fire' || family === 'lamp' || depth < 0.25
          ? ''
          : `stroke="${DARK}" stroke-opacity="${n(0.5 + depth * 0.35)}" stroke-width="${n(0.4 + depth * 0.5)}" stroke-dasharray="2 .5" stroke-linejoin="round"`,
      opacity: (_f, v) => (v >= 0.4 ? 1 : 0),
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool of light: a gold organza ellipse on the cloth.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${FLOSS.gold[3]}" opacity=".28"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="none" stroke="${FLOSS.gold[4]}" stroke-width=".5" stroke-dasharray="1.6 1"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        body: (svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return ''
          if (c.role === 'space.earth') return `<g>${c.repaint(svg)}</g><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${FLOSS.gold[3]}" stroke-width=".7" stroke-dasharray="1.8 1.2"/>`
          return night || c.role === 'night.moon' ? roundPatch(cx, cy, r * 1.15, 'cream', 4) : roundPatch(cx, cy, r * 1.15, 'gold', 3)
        },
        // Mist and beams as sheer organza: a pale gauze, its edge picked out in a running stitch.
        air: (svg, c) =>
          `<g opacity=".32">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? '#a9c4e4' : LABEL}"`)}</g>`,
        beam: (svg, c) => `<g opacity=".25">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${LABEL}"`)}</g>`,
      },
    },
    'pt',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude's satin, dark to light: brick to coral. */
const BRICK = ['#7c2a20', '#93402a', '#a9472d', '#c95a38', '#e06a42', '#f4ae86']
/** The direction each face's satin is laid in, in degrees, as the gallery lays them. */
const FACE_ANG = { top: 9, front: 54, side: -32, leg: 84 } as const
/** The faces that share a direction share a satin: the sides and back, the top and bottom. */
const FACE_DIR: Record<string, keyof typeof FACE_ANG> = { top: 'top', bottom: 'top', front: 'front', left: 'side', right: 'side', back: 'side' }
const TONES = 4

/** Claude as the gallery's patch: shadow, merrowed border, satin faces each laid its own way, black satin eyes. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => {
      const k = Math.max(0, Math.min(TONES - 1, Math.round(f.light * (TONES - 1))))
      const dir = f.part === 'leg' ? 'leg' : (FACE_DIR[f.name] ?? 'front')
      return `<path fill="url(#pt-f-${dir}${k})" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${DARK}" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx - 0.2)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor - 0.2)}" r=".5" fill="#e8e2d6"/>`
        : `<path fill="none" stroke="${DARK}" stroke-width="1.2" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    // The patch stands proud of the denim on its shadow.
    `<path fill="#05102a" opacity=".45" transform="translate(1 1.4)" stroke="#05102a" stroke-width="4" stroke-linejoin="round" d="${hulls}"/>` +
    // The merrowed border: a fat satin edge stitched round the whole shape, its dark edge under it.
    `<path fill="#7c2a20" stroke="#5a1a12" stroke-width="4.2" stroke-linejoin="round" d="${hulls}"/>` +
    `<path fill="none" stroke="#b04a36" stroke-width="3" stroke-dasharray=".45 .4" stroke-linejoin="round" d="${hulls}"/>` +
    faces +
    eyes
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * One satin: close rows of thread in `base`, a darker gap between them, laid
 * at `deg`. Kept to two shapes, as every scene carries some sixty of them.
 */
const satin = (id: string, base: string, deg: number) =>
  `<pattern id="${id}" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(${deg})">` +
  `<path d="M0 0h2v2H0z" fill="${mix(base, '#000000', 0.2)}"/><path d="M0 0h2v1.3H0z" fill="${base}"/></pattern>`

function defs(): string {
  let out = ''
  for (const [f, ramp] of Object.entries(FLOSS) as [Floss, readonly string[]][]) ramp.forEach((c, i) => (out += satin(`pt-${f}${i}`, c, SLANT[f])))
  for (const [name, deg] of Object.entries(FACE_ANG)) for (let k = 0; k < TONES; k++) out += satin(`pt-f-${name}${k}`, BRICK[k + 1]!, deg)
  return (
    out +
    `<path id="pt-star" d="M-1.5 -1.5L1.5 1.5M1.5 -1.5L-1.5 1.5" stroke="${FLOSS.gold[3]}" stroke-width=".8" stroke-linecap="round"/>` +
    `<linearGradient id="pt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6aa3"/><stop offset=".7" stop-color="#6f95c6"/><stop offset="1" stop-color="#a9c4e4"/></linearGradient>` +
    `<linearGradient id="pt-skyn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101d3a"/><stop offset=".7" stop-color="#1c3260"/><stop offset="1" stop-color="#2f4f82"/></linearGradient>` +
    // The twill: a light and a dark diagonal, as the gallery hatches its denim.
    `<pattern id="pt-twill" width="5.2" height="5.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-60)">` +
    `<rect width="5.2" height=".8" fill="#6e96c8" opacity=".35"/><rect y="2.6" width="5.2" height=".9" fill="#0f2346" opacity=".35"/></pattern>`
  )
}

export const PATCH: Look = {
  name: 'patch',
  label: 'Patch',
  voice: 'an embroidered merch patch on a denim jacket, cheerful supply-co. copy',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 5.4,
  caption: { fill: LABEL, stroke: RED_INK, ink: '#3a1a12', radius: 1 },
  paper: { card: LABEL, ink: '#2a1a14', kinds: { code: '#1f3560', path: '#2f5a91', fn: '#7c2a20', num: '#a8701e', bad: '#b8352a', good: '#2a5a32', face: '#c95a38' } },
  inset: 5,
  titleColor: LABEL,
  art: {
    painter: scenery,
    hero,
    sky: '#4a78b0',
    ground: '#2a5a32',
    defs,
  },
  // Sewn round with a gold topstitch on a darker denim seam.
  frame: (sw, h) =>
    `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="#264c7c" stroke-width="3"/>` +
    `<rect x="3.2" y="3.2" width="${sw - 6.4}" height="${h - 6.4}" fill="none" stroke="${FLOSS.gold[2]}" stroke-width=".8" stroke-dasharray="3.5 2"/>`,
  // The chapter on a woven cream label, stitched down in red.
  tag: (text, inset) => {
    const x = inset + 6
    const y = inset + 4
    const w = text.length * 6.2 + 12
    return {
      svg:
        `<rect x="${x + 1}" y="${y + 1.4}" width="${n(w)}" height="15" fill="#05102a" opacity=".35"/>` +
        `<rect x="${x}" y="${y}" width="${n(w)}" height="15" fill="${LABEL}"/>` +
        `<rect x="${x + 2}" y="${y + 2}" width="${n(w - 4)}" height="11" fill="none" stroke="${RED_INK}" stroke-width=".6" stroke-dasharray="1.6 1.2"/>` +
        `<text x="${x + 6}" y="${y + 10.4}" font-family="${SANS}" font-weight="800" font-size="8" letter-spacing="1.2" fill="${RED_INK}">${escape(text.toUpperCase())}</text>`,
      w: x + w + 6,
      h: y + 18,
    }
  },
  bubble: {
    font: SANS,
    size: 9,
    charW: 5.4,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      `<rect x="${n(x + 1)}" y="${n(y + 1.4)}" width="${w}" height="${h}" fill="#05102a" opacity=".3"/>` +
      `<path fill="${LABEL}" stroke="${RED_INK}" stroke-width=".8" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${LABEL}"/>` +
      `<rect x="${n(x + 2)}" y="${n(y + 2)}" width="${w - 4}" height="${h - 4}" fill="none" stroke="${RED_INK}" stroke-width=".6" stroke-dasharray="1.6 1.2"/>`,
  },
}

/**
 * Media Player Skin, after the gallery's "Media Player Skin: player skin, 2001"
 * (henrik-styles.js, style 50, `sskin`), and the look's own sources: the
 * Winamp-era player skins, brushed silver and glossy plastic round a
 * visualiser screen, an LCD marquee and a spectrum analyser.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - The picture is the player's visualiser screen. Its sky is a glowing well:
 *   title-bar blue by day, deep navy into violet by night, with plasma blobs
 *   of blue, violet and cyan drifting through it and a green scope trace
 *   rippling across. Scanlines lie over everything, and a glass glare
 *   crosses the screen's top left corner.
 * - Every solid thing is skin plastic: brushed silver, lit with the hot band
 *   of gloss a molded button has near its top, keyed in navy. Plants are a
 *   green LCD plastic, bark a smoked graphite one; far things are a pale
 *   periwinkle. After dark the silver dims to gunmetal.
 * - Water and glass are the title bar's glossy blue, split by its highlight.
 *   Fire is the spectrum analyser: green at the root, yellow, red at the
 *   peak. Lamps and stars are lit LCD segments, green and amber.
 * - The sun, moon and Earth are the skin's round glossy buttons.
 * - Claude is glossy orange plastic, as the gallery molds him: each face a
 *   hot band of gloss near its top, darkened in steps as it turns from the
 *   light, contoured in near black, with a white glint in each eye.
 * - The screen sits in a brushed-silver bezel with four screws; the chapter
 *   is an LCD marquee in green segments with a spectrum that jumps beside it,
 *   and the caption a silver plate with a blue title strip.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family, Meta, Role } from '../art/roles'
import type { Look } from '../looks'

const SANS = "'Tahoma', 'Verdana', 'Trebuchet MS', Arial, sans-serif"
const MONO = "'Lucida Console', ui-monospace, Menlo, Consolas, monospace"
const KEY = '#1d2840'
const GREEN = '#5cff8c'
const LCDBG = '#07140c'
/** Plain tones, dark to light, for what cannot be a gradient: lines, gradient stops, currentColor. */
const RAMP = [KEY, '#3d4655', '#6a7486', '#929cab', '#cdd4de', '#f2f4f8']

/** A molded plastic gradient from one base color: a hot band of gloss near the top, darker at the foot. */
function plastic(id: string, base: string): string {
  const hot = mix(base, '#ffffff', 0.55)
  const lit = mix(base, '#ffffff', 0.12)
  const foot = mix(base, '#0a0c14', 0.3)
  return (
    `<linearGradient id="${id}" x1="0" y1="0" x2=".15" y2="1"><stop offset="0" stop-color="${lit}"/><stop offset=".16" stop-color="${hot}"/>` +
    `<stop offset=".45" stop-color="${base}"/><stop offset="1" stop-color="${foot}"/></linearGradient>`
  )
}

/** The plastics a surface can be, by what it is; each in three tones, dark to light, for the tone it was lit in. */
const PLASTICS = {
  day: ['#6a7486', '#a6b0be', '#dfe4ec'],
  night: ['#2b3240', '#4a5468', '#7c8696'],
  lcd: ['#0e6a32', '#22b85a', '#7af0a0'],
  lcdn: ['#0a4a26', '#16884a', '#3bd06e'],
  bark: ['#2b3240', '#4a4a5a', '#6a6476'],
  far: ['#8a9ad8', '#b0bef0', '#d8e0ff'],
  farn: ['#3a3a8a', '#5a5aa8', '#7a7ac8'],
} as const
type Kind = keyof typeof PLASTICS

/** Claude's plastic, by face, as the gallery molds him. */
const FACE = { top: '#ff9a4d', front: '#f06a14', left: '#d8580e', right: '#b8460a', back: '#e0600f', bottom: '#a83f08' } as const
/** How far a face darkens as it turns from the light, in steps baked into its gradient: one path a face. */
const SHADES = [0, 0.12, 0.24]

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** A lit color as a plastic of the family's kind, in the tone its lightness gives. */
function surface(color: string, family: Family, depth: number): string {
  const t = lum(color)
  const i = t < 0.3 ? 0 : t < 0.6 ? 1 : 2
  let kind: Kind = night ? 'night' : 'day'
  if (family === 'foliage' || family === 'grass' || (isGreen(color) && family !== 'body')) kind = night ? 'lcdn' : 'lcd'
  else if (family === 'bark') kind = 'bark'
  else if (depth < 0.25 && family !== 'body') kind = night ? 'farn' : 'far'
  return `url(#mp-${kind}${i})`
}

/** A plain tone in the style's colors, for lines and gradient stops. */
function tone(color: string, family: Family): string {
  const t = lum(color)
  switch (family) {
    case 'fire':
      return t > 0.6 ? '#ffd23b' : t > 0.35 ? '#ff7a2b' : '#ff3b3b'
    case 'lamp':
    case 'life':
      return isWarm(color) ? '#ffd23b' : GREEN
    case 'glass':
    case 'water':
      return step(['#173a8c', '#2456c4', '#3a6fd8', '#8cb8ff'], t)
    case 'foliage':
    case 'grass':
      return step(['#0a4a26', '#16884a', '#2bd96a', '#9affb8'], t)
    default:
      return isGreen(color) ? step(['#0a4a26', '#16884a', '#2bd96a'], t) : step(RAMP, t)
  }
}

/** The sky: the visualiser's well, with drifting plasma and a rippling scope trace. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  // Three blobs, each drifting on its own loop.
  const blobs = (
    [
      ['mp-blob-b', 0.2, 50, 0.25, 9],
      ['mp-blob-v', 0.55, 30, -0.2, 11],
      ['mp-blob-c', 0.85, 70, 0.18, 13],
    ] as [string, number, number, number, number][]
  )
    .map(
      ([id, x, y, dx, dur]) =>
        `<circle cx="${n(sw * x)}" cy="${y}" r="70" fill="url(#${id})"><animateTransform attributeName="transform" type="translate" values="0 0;${n(sw * dx)} 18;${n(-sw * dx * 0.6)} -10;0 0" dur="${dur}s" repeatCount="indefinite"/></circle>`,
    )
    .join('')
  // The scope trace: one wave twice the stage's width, sliding left by one period forever.
  const period = 48
  let d = `M${-period * 2} 0`
  for (let x = -period * 2; x <= sw + period * 2; x += period / 2) d += `Q${n(x + period / 4)} ${(x / (period / 2)) % 2 ? 4 : -4} ${n(x + period / 2)} 0`
  const trace =
    `<path d="${d}" fill="none" stroke="#78ffc8" stroke-opacity="${night ? 0.55 : 0.45}" stroke-width=".8" transform="translate(0 ${night ? 70 : 64})">` +
    `<animateTransform attributeName="transform" type="translate" values="0 ${night ? 70 : 64};${-period} ${night ? 70 : 64}" dur="1.6s" repeatCount="indefinite"/></path>`
  return `<rect width="${n(sw)}" height="128" fill="url(#${night ? 'mp-skyn' : 'mp-sky'})"/>${blobs}${trace}`
}

/** Stars as lit LCD dots: every shape becomes a group, keeping its own attributes and animation, of dots at its points. */
function stars(svg: string, c: Ctx): string {
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#mp-dot" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      return `<g${kept} fill="${GREEN}">${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** A round glossy skin button: the sun, the moon, the Earth. */
function button(cx: number, cy: number, r: number, fill: string): string {
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 2.4)}" fill="url(#mp-halo)"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#${fill})" stroke="${KEY}" stroke-width=".8"/>` +
    `<ellipse cx="${n(cx - r * 0.2)}" cy="${n(cy - r * 0.45)}" rx="${n(r * 0.55)}" ry="${n(r * 0.3)}" fill="#ffffff" opacity=".6"/>`
  )
}

const scenery = () => {
  night = false
  const p = painter(
    {
      // A gradient can fill, but not be a line, a stop or a currentColor: those take a plain tone.
      ink: (color, family, depth, attr) => {
        if (attr !== 'fill') return tone(color, family)
        switch (family) {
          case 'fire':
            return 'url(#mp-spec)'
          case 'lamp':
          case 'stars':
          case 'life':
            return tone(color, family === 'stars' ? 'lamp' : family)
          case 'glass':
          case 'water':
            return 'url(#mp-bar)'
          case 'shadow':
            return night ? '#05070d' : '#2b3240'
          default:
            return surface(color, family, depth)
        }
      },
      // A gradient of the lit scene becomes one plastic in its overall tone; a radial wash of light stays a soft falloff.
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient') return undefined
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return tone(mean.color, family)
        if (mean.opacity < 0.5) return 'none'
        return family === 'fire' ? 'url(#mp-spec)' : family === 'glass' || family === 'water' ? 'url(#mp-bar)' : surface(mean.color, family, 0.5)
      },
      // Every nearer shape keyed in navy, as a skin's parts are; air, light and the far distance have no line.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'life' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'fire' || family === 'lamp' || depth < 0.25
          ? ''
          : `stroke="${night ? '#05070d' : KEY}" stroke-opacity="${n(0.5 + depth * 0.4)}" stroke-width="${n(0.3 + depth * 0.4)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool of light is an LCD glow on the floor.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${GREEN}" opacity=".18"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="#ffd23b" opacity=".22"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return button(cx, cy, r, 'mp-earth')
          if (c.meta.part === 'halo') return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 5)}" fill="url(#mp-halo)"/>`
          return button(cx, cy, r, night ? 'mp-moon' : 'mp-sun')
        },
        // Clouds are frosted plastic: silver-white by day, smoked violet at night and in the volcano's ash.
        cloud: (svg, c) => {
          const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
          const fill = night || lum(lit) < 0.4 ? 'url(#mp-cloudn)' : 'url(#mp-cloud)'
          return `<g opacity=".92">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${fill}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`
        },
        air: (svg, c) => `<g opacity=".2">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? '#5a6aff' : '#c9d8f2'}"`)}</g>`,
        beam: (svg, c) => `<g opacity=".28">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#mp-beam)"')}</g>`,
      },
    },
    'mp',
  )
  // A faint key line the rules hide is left out altogether: hundreds of trunks' worth of size, never seen.
  return { ...p, el: (role: Role, svg: string, meta?: Meta) => p.el(role, svg, meta).replace(/<(use|path|rect|circle|ellipse|polygon)\b[^>]*visibility="hidden"\/>/g, '') }
}

// ---------------------------------------------------------------- Claude

/** Claude in glossy orange plastic: a band of gloss on each face, contoured in near black, a glint in each eye. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => {
      const shade = (1 - f.light) * 0.45
      const k = shade < 0.1 ? 0 : shade < 0.25 ? 1 : 2
      return `<path fill="url(#mp-f-${f.name}${k})" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="#140804" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx - 0.2)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor - 0.2)}" r=".6" fill="#fff"/>`
        : `<path fill="none" stroke="#140804" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="#000" opacity=".4" d="${poly(m.shadow, cx, floor)}"/>` +
    `<path fill="#1a0a02" stroke="#1a0a02" stroke-width="1.4" stroke-linejoin="round" d="${hulls}"/>` +
    faces +
    eyes
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const lin = (id: string, stops: [number, string, number?][], x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`
const rad = (id: string, c: string, a: number) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
const ball = (id: string, hi: string, lo: string) =>
  `<radialGradient id="${id}" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></radialGradient>`

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(): string {
  let out = ''
  for (const [kind, tones] of Object.entries(PLASTICS)) tones.forEach((c, i) => (out += plastic(`mp-${kind}${i}`, c)))
  for (const [face, c] of Object.entries(FACE)) SHADES.forEach((k, i) => (out += plastic(`mp-f-${face}${i}`, mix(c, '#2a0c02', k))))
  out += `<rect id="mp-dot" x="-.8" y="-.8" width="1.6" height="1.6"/>`
  return (
    out +
    lin('mp-sky', [[0, '#1b48a8'], [0.55, '#3a6fd8'], [1, '#8cb8ff']]) +
    lin('mp-skyn', [[0, '#05070d'], [0.5, '#141a4a'], [1, '#3a1a7a']]) +
    rad('mp-blob-b', '#3c5aff', 0.5) +
    rad('mp-blob-v', '#c828ff', 0.38) +
    rad('mp-blob-c', '#00dcff', 0.4) +
    rad('mp-halo', '#ffffff', 0.4) +
    ball('mp-sun', '#fffbe0', '#ffb82b') +
    ball('mp-moon', '#ffffff', '#9aa8c8') +
    ball('mp-earth', '#c9f0ff', '#2456c4') +
    lin('mp-cloud', [[0, '#ffffff'], [0.2, '#ffffff'], [0.35, '#e4e9f0'], [1, '#aab4c4']]) +
    lin('mp-cloudn', [[0, '#8a8ab8'], [0.25, '#a8a8d8'], [0.4, '#6a6aa0'], [1, '#3a3a6a']]) +
    lin('mp-beam', [[0, '#bfffd2'], [1, '#bfffd2', 0]]) +
    lin('mp-spec', [[0, '#ff3b3b'], [0.3, '#ffd23b'], [0.65, '#3bff6e'], [1, '#16884a']]) +
    lin('mp-bar', [[0, '#8cb8ff'], [0.48, '#3a6fd8'], [0.52, '#2456c4'], [1, '#1b48a8']]) +
    lin('mp-silver', [[0, '#f2f4f8'], [0.45, '#b7c0cc'], [0.55, '#cdd4de'], [1, '#929cab']]) +
    lin('mp-plate', [[0, '#fbfcfe'], [0.5, '#e4e8ee'], [1, '#c4ccd8']]) +
    lin('mp-glare', [[0, '#ffffff', 0.16], [0.5, '#ffffff', 0.04], [0.51, '#ffffff', 0]], 1, 1) +
    `<pattern id="mp-scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".12"/></pattern>`
  )
}

/** A screw head in the bezel. */
const screw = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="2.2" fill="url(#mp-plate)" stroke="#475162" stroke-width=".5"/><path d="M${x - 1.4} ${y - 0.6}L${x + 1.4} ${y + 0.6}" stroke="#475162" stroke-width=".5"/>`

export const SKIN: Look = {
  name: 'skin',
  label: 'Media Player Skin',
  voice: 'a 2001 media player skin, brushed silver and LCD readouts, all marquee and equalizer',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 5.2,
  caption: { fill: '#e4e8ee', stroke: '#475162', ink: KEY, radius: 5 },
  paper: { card: '#eef1f6', ink: KEY, kinds: { code: '#0a7a3a', path: '#2456c4', fn: '#8a2ad0', num: '#c0560a', bad: '#d0202a', good: '#138a3e', face: '#d0560a' } },
  inset: 5,
  titleColor: GREEN,
  art: {
    painter: scenery,
    hero,
    sky: '#3a6fd8',
    ground: '#6a7486',
    defs,
  },
  // Scanlines over the whole screen, and the glass glare across its top left corner.
  texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#mp-scan)"/><rect width="${n(sw * 0.45)}" height="${h}" fill="url(#mp-glare)"/>`,
  // The brushed-silver bezel: a navy key, the silver rim, a dark inner well, a screw at each corner.
  frame: (sw, h) =>
    `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" rx="6" fill="none" stroke="url(#mp-silver)" stroke-width="3"/>` +
    `<rect x=".4" y=".4" width="${sw - 0.8}" height="${h - 0.8}" rx="7" fill="none" stroke="#475162" stroke-width=".8"/>` +
    `<rect x="3.4" y="3.4" width="${sw - 6.8}" height="${h - 6.8}" rx="4.5" fill="none" stroke="#05070d" stroke-opacity=".7" stroke-width=".8"/>` +
    screw(5, 5) +
    screw(sw - 5, 5) +
    screw(5, h - 5) +
    screw(sw - 5, h - 5) +
    `<text x="${sw - 10}" y="13" text-anchor="end" font-family="${MONO}" font-size="5" font-weight="700" fill="#8cffc8" fill-opacity=".75">PRESET 07</text>`,
  // The chapter on an LCD marquee: green type in a dark bevelled well, a spectrum jumping beside it.
  tag: (text, inset) => {
    const x = inset + 3
    const y = inset + 3
    const w = text.length * 5.4 + 8
    let bars = ''
    for (let i = 0; i < 6; i++) {
      const hs = [3, 7, 5, 8, 4, 6].map(v => ((v + i * 3) % 8) + 1)
      const vals = hs.map(v => n(v)).join(';')
      const ys = hs.map(v => n(y + 11 - v)).join(';')
      bars +=
        `<rect x="${n(x + w + 3 + i * 2.6)}" y="${n(y + 7)}" width="1.8" height="4" fill="${i > 3 ? '#ffd23b' : GREEN}">` +
        `<animate attributeName="height" values="${vals}" dur="${n(1.1 + i * 0.13)}s" repeatCount="indefinite"/>` +
        `<animate attributeName="y" values="${ys}" dur="${n(1.1 + i * 0.13)}s" repeatCount="indefinite"/></rect>`
    }
    return {
      svg:
        `<rect x="${n(x - 1)}" y="${n(y - 1)}" width="${n(w + 20)}" height="15" rx="3.5" fill="#cdd4de" stroke="#475162" stroke-width=".5"/>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${n(w + 18)}" height="13" rx="3" fill="${LCDBG}"/>` +
        `<text x="${n(x + 4)}" y="${n(y + 9.4)}" font-family="${MONO}" font-size="8.5" font-weight="700" fill="${GREEN}">${escape(text)}</text>` +
        bars,
      w: x + w + 22,
      h: y + 15,
    }
  },
  bubble: {
    font: SANS,
    size: 9,
    charW: 5.2,
    line: 12,
    base: 15,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A brushed-silver plate with a blue title strip along its top, keyed in slate.
      `<path fill="#e4e8ee" stroke="#475162" stroke-width=".8" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="5" fill="url(#mp-plate)" stroke="#475162" stroke-width="1.4"/>` +
      `<rect x="${n(x + 1.2)}" y="${n(y + 1.2)}" width="${w - 2.4}" height="${h - 2.4}" rx="4" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width=".6"/>` +
      `<rect x="${n(x + 3)}" y="${n(y + 2.5)}" width="${w - 6}" height="3.5" rx="1.75" fill="url(#mp-bar)"/>`,
  },
}

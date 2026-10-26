/**
 * Holo Sticker, after the gallery's "Holo Sticker: foil sticker, 2000"
 * (henrik-styles.js, style 51, `sholo`), and the look's own sources: the
 * holographic foil stickers of the turn of the millennium, traded and stuck
 * on binders, lockers and pencil cases.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Every solid thing is a die-cut foil sticker: a rainbow of pink, gold,
 *   mint, cyan and lilac running across it on the slant, deeper where it was
 *   lit darker, and a white die-cut border round it. Plants are a mint-leaning
 *   foil, bark a lilac-and-rose one; far things are a pale pastel foil, as if
 *   the sticker had been rubbed. Night is the same foil under a violet light.
 * - The sky is candy-pink glitter plastic, edge to edge: hot pink to bubblegum,
 *   flecked with white and pale pink glitter, a gloss band on the slant, and
 *   little stickers stuck about it, hearts and stars, with sparkles that
 *   twinkle. Night is a deep violet glitter plastic going magenta low down.
 * - The ground is the same glitter plastic, a shade deeper, so the stickers
 *   on it stand out. Stars are sparkles. Sun and moon are round foil stickers;
 *   the Earth too. Fire and lamps are neon candy, lemon to hot pink.
 * - Claude is the star sticker: one rainbow across the whole figure, each face
 *   at its own place in it and darkened as it turns from the light, the rainbow
 *   sliding as the foil catches the light, a white die-cut border round him,
 *   a magenta shadow under him, and a gloss band sweeping across.
 * - The screen is a sticker sheet's white die-cut edge, the chapter a label
 *   sticker, the caption a white bubble sticker with a pink rim.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const SANS = "'Trebuchet MS', 'Verdana', 'Helvetica Neue', Arial, sans-serif"
const KEY = '#4a0a3a'
/** Plain tones, dark to light, for what cannot be a gradient: lines, gradient stops, currentColor. */
const RAMP = [KEY, '#8a1a6a', '#d0409a', '#ff7ac4', '#ffc8e8', '#fff4fb']

/** The foil's rainbow, as the gallery's: pink, gold, mint, cyan, lilac and back to pink. */
const RAINBOW = ['#ff8ad0', '#ffe27a', '#8af0b0', '#7ad8ff', '#c49aff', '#ff8ad0']
/** The foils a sticker can be, each a tint laid over the rainbow and how strongly. */
const FOILS = {
  day: ['#ffffff', 0.05],
  night: ['#5a2aa0', 0.35],
  leaf: ['#3ad09a', 0.35],
  bark: ['#a04a8a', 0.4],
  far: ['#fff0fa', 0.5],
} as const
type Kind = keyof typeof FOILS
/** How far each tone darkens its foil: a dark surface is a deep foil, a light one a bright one. */
const TONES = [0.42, 0.2, 0]
const SHADE = '#3a0a5a'

/** A foil's stops: the rainbow, tinted, darkened by `k`, started `phase` (0 to 1) along. */
function foilStops(tint: string, amount: number, k: number, phase = 0): string {
  const cs = RAINBOW.map(c => mix(mix(c, tint, amount), SHADE, k))
  return cs
    .map((_, i) => {
      const c = cs[(i + Math.round(phase * 5)) % 5]!
      return `<stop offset="${n(i / 5)}" stop-color="${c}"/>`
    })
    .join('')
}
const foil = (id: string, stops: string, extra = '') =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2=".6" spreadMethod="reflect">${stops}${extra}</linearGradient>`

/** Where each of Claude's faces sits in the rainbow, so the turn shows the foil shift between them. */
const FACE_PHASE = { top: 0.4, front: 0, left: 0.6, right: 0.2, back: 0.8, bottom: 0.6 } as const
const SHADES = [0, 0.3]

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

/** A lit color as a foil sticker of the family's kind, at the tone its lightness gives. */
function surface(color: string, family: Family, depth: number): string {
  const t = lum(color)
  const i = t < 0.3 ? 0 : t < 0.6 ? 1 : 2
  let kind: Kind = night ? 'night' : 'day'
  if (family === 'foliage' || family === 'grass') kind = 'leaf'
  else if (family === 'bark') kind = 'bark'
  else if (depth < 0.25 && family !== 'body' && !night) kind = 'far'
  return `url(#ho-${kind}${i})`
}

/** A plain tone in the style's colors, for lines and gradient stops. */
function tone(color: string, family: Family): string {
  const t = lum(color)
  switch (family) {
    case 'fire':
      return t > 0.6 ? '#fff5a0' : t > 0.35 ? '#ffa04a' : '#ff2a8a'
    case 'lamp':
      return isWarm(color) ? '#fff08a' : '#8af4ff'
    case 'glass':
    case 'water':
      return step(['#5a3ab0', '#5aa8ff', '#9ae8ff', '#e8fbff'], t)
    case 'foliage':
    case 'grass':
      return step(['#1a5a5a', '#2aa88a', '#7ae8b8', '#d0ffe8'], t)
    default:
      return isGreen(color) ? step(['#1a5a5a', '#2aa88a', '#7ae8b8'], t) : step(RAMP, t)
  }
}

/** A four-point sparkle centred on 0 0, `r` from its centre to a point. */
function sparklePath(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2
    const q = i % 2 ? r * 0.18 : r
    pts.push(`${n(Math.cos(a) * q)} ${n(Math.sin(a) * q)}`)
  }
  return `M${pts.join('L')}z`
}

/** A sparkle at x, y that twinkles, `dur` seconds, starting `begin` into it. */
const twinkle = (x: number, y: number, r: number, dur: number, begin: number) =>
  `<g transform="translate(${n(x)} ${n(y)}) scale(${n(r / 4)})"><use href="#ho-spark">` +
  `<animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.25;.5;1" dur="${n(dur)}s" begin="${n(-begin)}s" repeatCount="indefinite"/></use></g>`

/** A small seeded sequence, so the same stage always sparkles in the same places. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** The sky: candy-pink glitter plastic (violet by night), a gloss band, little stickers stuck about, twinkling sparkles. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  const rand = seeded(Math.round(sw) + 51)
  let decor = ''
  const count = Math.max(3, Math.min(9, Math.round(sw / 110)))
  for (let i = 0; i < count; i++) {
    const x = 10 + rand() * (sw - 20)
    const y = 8 + rand() * 60
    const s = 0.7 + rand() * 0.5
    const r = Math.round(rand() * 40 - 20)
    decor += `<use href="#${i % 2 ? 'ho-heart' : 'ho-star5'}" transform="translate(${n(x)} ${n(y)}) rotate(${r}) scale(${n(s)})" opacity="${night ? 0.75 : 0.9}"/>`
  }
  let sparkles = ''
  for (let i = 0; i < count + 3; i++) sparkles += twinkle(8 + rand() * (sw - 16), 6 + rand() * 80, 2.5 + rand() * 2.5, 2.2 + rand() * 1.8, rand() * 4)
  return (
    `<rect width="${n(sw)}" height="128" fill="url(#${night ? 'ho-skyn' : 'ho-sky'})"/>` +
    `<rect width="${n(sw)}" height="128" fill="url(#ho-glitter)"/>` +
    `<rect width="${n(sw)}" height="128" fill="url(#ho-gloss)"/>` +
    decor +
    sparkles
  )
}

/** Stars as sparkles: every shape becomes a group, keeping its own attributes and animation, of little sparkles at its points. */
function stars(svg: string, c: Ctx): string {
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#ho-star" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      return `<g${kept} fill="#ffffff">${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** A round foil sticker: the sun, the moon or the Earth, lifted on its shadow, in its white die-cut border. */
function disc(cx: number, cy: number, r: number, fill: string): string {
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 2.4)}" fill="url(#ho-halo)" opacity=".7"/>` +
    `<circle cx="${n(cx + 0.8)}" cy="${n(cy + 1.2)}" r="${n(r + 1.4)}" fill="${KEY}" opacity=".35"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" stroke="#ffffff" stroke-width="1.6"/>` +
    twinkle(cx - r * 0.4, cy - r * 0.45, Math.max(2, r * 0.45), 3, 0.5)
  )
}

const scenery = () => {
  night = false
  return painter(
    {
      // A gradient can fill, but not be a line, a stop or a currentColor: those take a plain tone.
      ink: (color, family, depth, attr) => {
        if (attr !== 'fill') return tone(color, family)
        switch (family) {
          case 'fire':
            return 'url(#ho-neon)'
          case 'lamp':
          case 'stars':
          case 'life':
            return tone(color, family === 'life' ? 'lamp' : family)
          case 'glass':
          case 'water':
            return 'url(#ho-glass)'
          case 'shadow':
            return night ? '#1a0630' : '#9a1a6a'
          case 'ground': {
            const t = lum(color)
            return `url(#ho-plastic${night ? 'n' : ''}${t < 0.3 ? 0 : t < 0.6 ? 1 : 2})`
          }
          default:
            return surface(color, family, depth)
        }
      },
      // A gradient of the lit scene becomes one foil in its overall tone; a faint wash of light is not drawn.
      // A radial wash of light stays a soft falloff, carried over in the style's colors.
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient') return undefined
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return tone(mean.color, family)
        if (mean.opacity < 0.5) return 'none'
        if (family === 'ground') return `url(#ho-plastic${night ? 'n' : ''}1)`
        return family === 'fire' ? 'url(#ho-neon)' : family === 'glass' || family === 'water' ? 'url(#ho-glass)' : surface(mean.color, family, 0.5)
      },
      // Every nearer sticker in its white die-cut border; air, light, the ground's plastic and the far distance have none.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'life' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'fire' || family === 'lamp' || family === 'ground' || depth < 0.25
          ? ''
          : `stroke="#ffffff" stroke-opacity="${n(0.6 + depth * 0.35)}" stroke-width="${n(0.5 + depth * 0.7)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool of light is a glitter of lemon and cyan on the plastic.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="#fff08a" opacity=".28"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="#8af4ff" opacity=".3"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 5)}" fill="url(#ho-halo)" opacity=".5"/>`
          if (c.role === 'space.earth') return disc(cx, cy, r, 'url(#ho-leaf2)')
          return disc(cx, cy, r, night ? 'url(#ho-moon)' : 'url(#ho-sun)')
        },
        // Clouds are puffy white stickers going pink underneath, or lilac at night and in the volcano's ash.
        cloud: (svg, c) => {
          const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
          const fill = night || lum(lit) < 0.4 ? 'url(#ho-cloudn)' : 'url(#ho-cloud)'
          return `<g>${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${fill}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`
        },
        air: (svg, c) => `<g opacity=".22">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? '#d08aff' : '#fff0fa'}"`)}</g>`,
        beam: (svg, c) => `<g opacity=".28">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#ho-beam)"')}</g>`,
      },
    },
    'ho',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude as a holo sticker: one sliding rainbow over his faces, a white die-cut border over a magenta shadow, a gloss sweeping across. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => {
      const k = f.light > 0.6 ? 0 : 1
      return `<path fill="url(#ho-f-${f.name}${k})" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="#2a1240" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx - 0.2)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor - 0.2)}" r=".6" fill="#fff"/>`
        : `<path fill="none" stroke="#2a1240" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="#c0207a" opacity=".4" d="${poly(m.shadow, cx, floor)}"/>` +
    // The die-cut border: the hulls in white, a little wider than the foil over them.
    `<path fill="#ffffff" stroke="#ffffff" stroke-width="4.2" stroke-linejoin="round" d="${hulls}"/>` +
    faces +
    // The gloss band, sweeping across the hulls as the foil turns in the light.
    `<path fill="url(#ho-sheen)" d="${hulls}"/>` +
    eyes
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A small seeded glitter tile: white and pale pink flecks on nothing. */
function glitterTile(): string {
  const rand = seeded(510)
  let out = ''
  for (let i = 0; i < 16; i++) {
    const c = rand() < 0.55 ? '#ffffff' : '#ffd0f0'
    const s = 0.4 + rand() * 0.7
    out += `<rect x="${n(rand() * 22)}" y="${n(rand() * 22)}" width="${n(s)}" height="${n(s)}" fill="${c}" opacity="${n(0.35 + rand() * 0.55)}"/>`
  }
  return out
}

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(_sw: number): string {
  let out = ''
  for (const [kind, [tint, amount]] of Object.entries(FOILS))
    TONES.forEach((k, i) => (out += foil(`ho-${kind}${i}`, foilStops(tint, amount, k, i * 0.2))))
  // Claude's foil slides: each face's rainbow drifts along and back, all in step.
  const slide = `<animateTransform attributeName="gradientTransform" type="translate" values="0;.5;0" dur="6s" repeatCount="indefinite"/>`
  for (const [face, ph] of Object.entries(FACE_PHASE))
    SHADES.forEach((k, i) => (out += foil(`ho-f-${face}${i}`, foilStops('#ffffff', 0, k, ph), slide)))
  // The glitter: one tile of flecks, on nothing for the sky, on a pink by tone for the ground's plastic, by day and by night.
  out += `<g id="ho-flecks">${glitterTile()}</g>`
  const tile = (id: string, base: string) =>
    `<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse">${base ? `<rect width="22" height="22" fill="${base}"/>` : ''}<use href="#ho-flecks"/></pattern>`
  out += tile('ho-glitter', '')
  ;[['ho-plastic', ['#b02a72', '#e8449f', '#ff7ac8']], ['ho-plasticn', ['#3a1060', '#6a2290', '#9440b0']]].forEach(([id, bases]) =>
    (bases as string[]).forEach((b, i) => (out += tile(`${id}${i}`, b))),
  )
  out += `<path id="ho-star" d="${sparklePath(1.6)}"/>`
  out += `<g id="ho-spark"><circle r="5" fill="url(#ho-halo)"/><path d="${sparklePath(4)}" fill="#ffffff"/></g>`
  out += `<path id="ho-heart" d="M0 3.2C-5 0-4.6-4 -2.2-4 -1-4 0-3 0-2 0-3 1-4 2.2-4 4.6-4 5 0 0 3.2z" fill="url(#ho-day2)" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="round"/>`
  const star5 = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const r = i % 2 ? 1.9 : 4.4
    return `${n(Math.cos(a) * r)} ${n(Math.sin(a) * r)}`
  }).join('L')
  out += `<path id="ho-star5" d="M${star5}z" fill="#fff59a" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="round"/>`
  return (
    out +
    `<linearGradient id="ho-sky" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#ff9ad6"/><stop offset=".55" stop-color="#ff6fc1"/><stop offset="1" stop-color="#ffb0dc"/></linearGradient>` +
    `<linearGradient id="ho-skyn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0a52"/><stop offset=".6" stop-color="#5a1a8a"/><stop offset="1" stop-color="#b0308a"/></linearGradient>` +
    `<linearGradient id="ho-gloss" x1="0" y1="0" x2="1" y2=".4"><stop offset=".18" stop-color="#ffffff" stop-opacity="0"/><stop offset=".26" stop-color="#ffffff" stop-opacity=".28"/><stop offset=".34" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="ho-sheen" x1="0" y1="0" x2="1" y2=".5"><stop offset=".3" stop-color="#ffffff" stop-opacity="0"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".6" stop-color="#ffffff" stop-opacity="0"/>` +
    `<animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1 0;1 0" keyTimes="0;.6;1" dur="4s" repeatCount="indefinite"/></linearGradient>` +
    `<radialGradient id="ho-halo"><stop offset="0" stop-color="#ffffff" stop-opacity=".6"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ho-sun" cx=".4" cy=".35"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffe27a"/><stop offset=".85" stop-color="#ffb06a"/><stop offset="1" stop-color="#ff8ad0"/></radialGradient>` +
    `<radialGradient id="ho-moon" cx=".4" cy=".35"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d8f4ff"/><stop offset=".85" stop-color="#c49aff"/><stop offset="1" stop-color="#ff8ad0"/></radialGradient>` +
    `<linearGradient id="ho-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fff0fa"/><stop offset="1" stop-color="#ffc0e4"/></linearGradient>` +
    `<linearGradient id="ho-cloudn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8c8ff"/><stop offset=".6" stop-color="#a87ad8"/><stop offset="1" stop-color="#6a3aa0"/></linearGradient>` +
    `<linearGradient id="ho-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="ho-neon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff5a0"/><stop offset=".4" stop-color="#ffa04a"/><stop offset="1" stop-color="#ff2a8a"/></linearGradient>` +
    `<linearGradient id="ho-glass" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset=".35" stop-color="#9ae8ff"/><stop offset=".6" stop-color="#c49aff"/><stop offset="1" stop-color="#5a3ab0"/></linearGradient>` +
    `<linearGradient id="ho-panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fff0fa"/></linearGradient>` +
    `<linearGradient id="ho-label" x1="0" y1="0" x2="1" y2=".5">${foilStops('#ffffff', 0.25, 0)}</linearGradient>` +
    `<linearGradient id="ho-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".2"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`
  )
}

export const HOLO: Look = {
  name: 'holo',
  label: 'Holo Sticker',
  voice: 'a holographic foil sticker from 2000, all glitter, hearts and sparkle',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 5.3,
  caption: { fill: '#ffffff', stroke: '#e8449f', ink: '#3a0a3a', radius: 9 },
  paper: { card: '#fff6fb', ink: '#3a0a3a', kinds: { code: '#0a6a8a', path: '#6a2ac0', fn: '#c0207a', num: '#c0560a', bad: '#d0203a', good: '#138a5e', face: '#c0207a' } },
  inset: 4,
  titleColor: '#ffffff',
  art: {
    painter: scenery,
    hero,
    sky: '#ff6fc1',
    ground: '#c8307e',
    defs,
  },
  // Now and then the light catches the sheet, and a shine sweeps across.
  texture: (sw, h) =>
    `<rect x="${n(-sw * 0.3)}" y="0" width="${n(sw * 0.3)}" height="${h}" fill="url(#ho-sweep)" transform="skewX(-20)">` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;${n(sw * 1.6)} 0;${n(sw * 1.6)} 0" keyTimes="0;.35;1" dur="8s" repeatCount="indefinite" additive="sum"/></rect>`,
  // The sticker sheet's edge: a white die-cut border, a pink line inside it.
  frame: (sw, h) =>
    `<rect x="1.8" y="1.8" width="${sw - 3.6}" height="${h - 3.6}" rx="8" fill="none" stroke="#ffffff" stroke-width="2.6"/>` +
    `<rect x="3.6" y="3.6" width="${sw - 7.2}" height="${h - 7.2}" rx="6.5" fill="none" stroke="#e8449f" stroke-opacity=".8" stroke-width=".6"/>`,
  // The chapter as a label sticker: a foil pill in a white die-cut border, lifted on its shadow, the word in plum.
  tag: (text, inset) => {
    const x = inset + 4
    const y = inset + 3
    const w = text.length * 5.4 + 12
    const h = 14
    return {
      svg:
        `<rect x="${n(x + 0.8)}" y="${n(y + 1.2)}" width="${n(w)}" height="${h}" rx="7" fill="${KEY}" opacity=".35"/>` +
        `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${h}" rx="7" fill="url(#ho-label)" stroke="#ffffff" stroke-width="1.6"/>` +
        `<text x="${n(x + w / 2)}" y="${n(y + 10)}" text-anchor="middle" font-family="${SANS}" font-size="9" font-style="italic" font-weight="900" fill="#3a0a3a">${escape(text)}</text>`,
      w: x + w + 4,
      h: y + h + 4,
    }
  },
  bubble: {
    font: SANS,
    size: 9,
    charW: 5.3,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A white bubble sticker with a hot pink rim, lifted on its shadow, its tail in white too.
      `<rect x="${n(x + 1)}" y="${n(y + 1.6)}" width="${w}" height="${h}" rx="9" fill="${KEY}" opacity=".3"/>` +
      `<path fill="#ffffff" stroke="#e8449f" stroke-width="1" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="9" fill="url(#ho-panel)" stroke="#e8449f" stroke-width="1.4"/>` +
      `<rect x="${n(x + 1.6)}" y="${n(y + 1.6)}" width="${w - 3.2}" height="${h - 3.2}" rx="7.5" fill="none" stroke="#ffd0ec" stroke-width=".6"/>`,
  },
}

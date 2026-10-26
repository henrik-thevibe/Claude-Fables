/**
 * Liquid Chrome, after the gallery's "Liquid Chrome: millennium chrome, 1999"
 * (henrik-styles.js, style 49, `schrome`), and the look's own sources: the
 * turn-of-the-millennium chrome posters, CD covers and screen savers.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - Every solid thing is liquid chrome. A chrome surface reflects a blue sky
 *   over an orange desert: deep blue above, pale cyan, a white-hot horizon,
 *   then a dark plum line and burnt orange to peach below. Where that
 *   horizon falls depends on which way the surface faces: up-facing surfaces
 *   show sky, down-facing ones the desert. Shapes are keyed in dark violet.
 *   Plants are a mint-tinted chrome, bark a plum one; far things are a pale
 *   lilac chrome, as the air between grows iridescent.
 * - The sky is iridescent: pink to lilac to cyan to near white at the
 *   horizon, with soft pools of color, and four-point sparkles that twinkle.
 *   Night is the same sky after dark: violet into magenta, pink at the horizon.
 * - The ground is a violet void with a neon grid running to the horizon:
 *   magenta lines converging on the vanishing point, cyan rungs crowding
 *   toward it, a white-hot horizon line.
 * - Stars are sparkles. The Earth is a turning wireframe globe; the sun and
 *   moon are chrome balls. Lava and lamps are neon, magenta and cyan.
 * - Claude is chrome: each face reflects the sky and the desert, its horizon
 *   set by the face's direction, darkened in steps as it turns from the light, keyed
 *   in dark violet with a magenta shadow and a sparkle of a glint.
 * - The screen is framed in a chrome bevel, the chapter is a bubbly chrome
 *   wordmark with a purple extrusion, and the caption a lilac pill in a
 *   chrome rim. A shine sweeps across the picture now and then.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const SANS = "'Trebuchet MS', 'Verdana', 'Helvetica Neue', Arial, sans-serif"
/** The ground's top on the stage (svg.ts), where the grid runs to: the horizon. */
const HORIZON = 104
const KEY = '#140829'
/** Plain tones, dark to light, for what cannot be a gradient: lines, gradient stops, currentColor. */
const RAMP = [KEY, '#3b136b', '#5a3ad0', '#5a8ae8', '#8fd2ff', '#eefaff']

/**
 * A chrome surface's gradient stops: a reflected sky above its horizon `h`
 * (0 at the top, 1 at the bottom), a reflected desert below. `sky` and `sand`
 * are the reflected colors, deep to light.
 */
function chromeStops(h: number, sky: readonly [string, string, string], sand: readonly [string, string, string]): string {
  const at = (v: number) => n(Math.min(1, Math.max(0, v)))
  return (
    `<stop offset="0" stop-color="${sky[0]}"/><stop offset="${at(h * 0.55)}" stop-color="${sky[1]}"/><stop offset="${at(h * 0.9)}" stop-color="${sky[2]}"/>` +
    `<stop offset="${at(h)}" stop-color="#ffffff"/><stop offset="${at(h + 0.015)}" stop-color="${sand[0]}"/><stop offset="${at(h + 0.1)}" stop-color="${sand[1]}"/><stop offset="1" stop-color="${sand[2]}"/>`
  )
}
const chrome = (id: string, h: number, sky: readonly [string, string, string], sand: readonly [string, string, string]) =>
  `<linearGradient id="${id}" x1=".2" y1="0" x2=".35" y2="1">${chromeStops(h, sky, sand)}</linearGradient>`

/** The chromes a surface can be, by what it is; each in three horizons, for the tone it was lit in. */
const CHROMES = {
  day: { sky: ['#2d5fc4', '#8fd2ff', '#eefaff'], sand: ['#3a1b2e', '#a9461c', '#ffc27a'] },
  night: { sky: ['#1a0a4a', '#7a4ad0', '#ffd0f8'], sand: ['#2a0a2a', '#c0307a', '#ff9a6a'] },
  mint: { sky: ['#0e5a6a', '#6ee8cc', '#effff8'], sand: ['#1b2e3a', '#2a7a5a', '#a8f0b0'] },
  plum: { sky: ['#3b136b', '#9a6ad8', '#f0dcff'], sand: ['#1a0820', '#6a2a4a', '#c86a5a'] },
  far: { sky: ['#9a8ae8', '#d8ccff', '#f6f0ff'], sand: ['#8a6aa8', '#d8a0c8', '#ffd8e8'] },
} as const
type Kind = keyof typeof CHROMES
/** Horizons by tone: a dark surface reflects mostly desert, a light one mostly sky. */
const HORIZONS = [0.35, 0.5, 0.68]

/** Where each of Claude's faces holds its horizon: the top shows sky, the bottom the desert. */
const FACE_H = { top: 0.84, front: 0.5, left: 0.42, right: 0.58, back: 0.5, bottom: 0.14 } as const
/**
 * How far a face darkens as it turns from the light, in three steps baked into
 * its gradient: one path a face, where an overlay would draw every face twice
 * in every pose Claude is baked in.
 */
const SHADES = [0, 0.2, 0.4]
const SHADE = '#140a3c'
const shaded = (cs: readonly [string, string, string], k: number) => cs.map(c => mix(c, SHADE, k)) as unknown as readonly [string, string, string]

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false
/** Each mask laid over a stretch of ground needs an id of its own. */
let masks = 0

/** A lit color as a chrome surface of the family's kind, at the horizon its lightness gives. */
function surface(color: string, family: Family, depth: number): string {
  const t = lum(color)
  const i = t < 0.33 ? 0 : t < 0.62 ? 1 : 2
  let kind: Kind = night ? 'night' : 'day'
  if (family === 'foliage' || (family === 'grass' && !night)) kind = 'mint'
  else if (family === 'bark') kind = 'plum'
  else if (depth < 0.25 && family !== 'body') kind = 'far'
  return `url(#ch-${kind}${i})`
}

/** A plain tone in the style's colors, for lines and gradient stops. */
function tone(color: string, family: Family): string {
  const t = lum(color)
  switch (family) {
    case 'fire':
      return t > 0.6 ? '#fff0a0' : t > 0.35 ? '#ff8a3a' : '#ff2a9a'
    case 'lamp':
      return isWarm(color) ? '#ff7ae8' : '#7af0ff'
    case 'glass':
    case 'water':
      return step(['#3a2a9a', '#3a8ae8', '#5ae0ff', '#c8f6ff'], t)
    case 'foliage':
    case 'grass':
      return step(['#0e3a4a', '#1a7a6a', '#4ad8b0', '#b8ffe0'], t)
    default:
      return isGreen(color) ? step(['#0e3a4a', '#1a7a6a', '#4ad8b0'], t) : step(RAMP, t)
  }
}

/** A four-point sparkle centred on 0 0, `r` from its centre to a point. */
function sparklePath(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2
    const q = i % 2 ? r * 0.16 : r
    pts.push(`${n(Math.cos(a) * q)} ${n(Math.sin(a) * q)}`)
  }
  return `M${pts.join('L')}z`
}

/** A sparkle at x, y that twinkles: grows from nothing and back, `dur` seconds, starting `begin` into it. */
const twinkle = (x: number, y: number, r: number, dur: number, begin: number) =>
  `<g transform="translate(${n(x)} ${n(y)})"><g><circle r="${n(r * 1.3)}" fill="url(#ch-halo)"/><path d="${sparklePath(r)}" fill="#ffffff"/>` +
  `<animateTransform attributeName="transform" type="scale" values="0;1;0;0" keyTimes="0;.25;.5;1" dur="${n(dur)}s" begin="${n(-begin)}s" repeatCount="indefinite"/></g></g>`

/** A small seeded sequence, so the same stage always sparkles in the same places. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** The sky: iridescent pink to cyan by day, violet into magenta by night, with pools of color and twinkling sparkles. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  const pools = (night
    ? [[0.15, 100, 90, 'ch-pool-m'], [0.8, 30, 110, 'ch-pool-c']]
    : [[0.15, 100, 90, 'ch-pool-p'], [0.82, 20, 110, 'ch-pool-c'], [0.52, 55, 80, 'ch-pool-w']]) as [number, number, number, string][]
  const rand = seeded(Math.round(sw))
  let sparkles = ''
  const count = Math.max(4, Math.min(14, Math.round(sw / 80)))
  for (let i = 0; i < count; i++) sparkles += twinkle(8 + rand() * (sw - 16), 6 + rand() * (HORIZON - 30), 2.2 + rand() * 2.6, 2.4 + rand() * 1.8, rand() * 4)
  return (
    `<rect width="${n(sw)}" height="128" fill="url(#${night ? 'ch-skyn' : 'ch-sky'})"/>` +
    pools.map(([x, y, r, id]) => `<circle cx="${n(sw * x)}" cy="${y}" r="${r}" fill="url(#${id})"/>`).join('') +
    sparkles
  )
}

/** Stars as sparkles: every shape becomes a group, keeping its own attributes and animation, of little stars at its points. */
function stars(svg: string, c: Ctx): string {
  // One sparkle, defined once, placed at every point: a starfield holds hundreds.
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#ch-star" x="${x}" y="${y}"/>`).join('')
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

/** The Earth as a turning wireframe globe: an outline, its latitudes, and meridians that sweep round. */
function globe(cx: number, cy: number, r: number): string {
  let out = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="#3a6ad0" fill-opacity=".22" stroke="#ffffff" stroke-opacity=".8" stroke-width=".6"/>`
  for (let k = -2; k <= 2; k++) {
    const la = (k * Math.PI) / 6
    const rr = Math.cos(la) * r
    out += `<ellipse cx="${n(cx)}" cy="${n(cy - Math.sin(la) * r)}" rx="${n(rr)}" ry="${n(rr * 0.22)}" fill="none" stroke="#ffffff" stroke-opacity=".6" stroke-width=".4"/>`
  }
  // Each meridian's width follows |cos| of its turning angle; offset in time, they turn as one globe.
  const widths = Array.from({ length: 13 }, (_, i) => n(Math.abs(Math.cos((i * Math.PI) / 12)) * r)).join(';')
  for (let k = 0; k < 6; k++)
    out +=
      `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r)}" ry="${n(r)}" fill="none" stroke="#7af0ff" stroke-opacity=".7" stroke-width=".4">` +
      `<animate attributeName="rx" values="${widths}" dur="9s" begin="${n((-k * 9) / 6)}s" repeatCount="indefinite"/></ellipse>`
  return out
}

/** A chrome ball: the sun or the moon, reflecting sky over desert, with a white rim and a sparkle. */
function ball(cx: number, cy: number, r: number): string {
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 2.6)}" fill="url(#ch-halo)" opacity=".7"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 1.05)}" fill="url(#${night ? 'ch-night1' : 'ch-day1'})" stroke="${KEY}" stroke-width=".8"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.9)}" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width=".5"/>` +
    twinkle(cx - r * 0.45, cy - r * 0.5, Math.max(2, r * 0.45), 3.2, 0.6)
  )
}

/**
 * Lays the neon grid over a stretch of ground: the element as painted, then
 * the grid, masked to the element's own shapes so it lies on the ground alone.
 */
function gridded(out: string): string {
  const id = `ch-mask${++masks}`
  // The mask holds a copy of the shapes, its own definitions and ids left out, so no id is defined twice.
  const shapes = out.replace(/<defs>[\s\S]*?<\/defs>/g, '').replace(/\sid="[^"]*"/g, '')
  return `${out}<mask id="${id}" style="mask-type:alpha">${shapes}</mask><g mask="url(#${id})"><use href="#ch-grid"/></g>`
}

const scenery = () => {
  night = false
  masks = 0
  return painter(
    {
      // A gradient can fill, but not be a line, a stop or a currentColor: those take a plain tone.
      ink: (color, family, depth, attr) => {
        if (attr !== 'fill') return tone(color, family)
        switch (family) {
          case 'fire':
            return 'url(#ch-neon)'
          case 'lamp':
          case 'stars':
          case 'life':
            return tone(color, family === 'life' ? 'lamp' : family)
          case 'glass':
          case 'water':
            return 'url(#ch-glass)'
          case 'shadow':
            return '#3b136b'
          default:
            return surface(color, family, depth)
        }
      },
      // A gradient of the lit scene becomes one chrome surface in its overall tone; a faint wash of light is not drawn.
      // A radial wash of light stays a soft falloff, carried over in the style's colors.
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient') return undefined
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return tone(mean.color, family)
        if (mean.opacity < 0.5) return 'none'
        return family === 'fire' ? 'url(#ch-neon)' : family === 'glass' || family === 'water' ? 'url(#ch-glass)' : surface(mean.color, family, 0.5)
      },
      // Every nearer shape keyed in dark violet, as the gallery contours Claude; air, light and the far distance have no line.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'life' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'fire' || family === 'lamp' || depth < 0.25
          ? ''
          : `stroke="${KEY}" stroke-opacity="${n(0.55 + depth * 0.35)}" stroke-width="${n(0.3 + depth * 0.35)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool of light is neon on the floor: a magenta haze with a cyan heart.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="#ff5ae6" opacity=".22"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="#7af0ff" opacity=".3"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        // The floor: the ground and the open meadows are the violet void with the neon grid on them.
        ground: (svg, c) => gridded(c.repaint(svg)),
        'forest.meadow': (svg, c) => gridded(c.repaint(svg)),
        'night.meadow': (svg, c) => gridded(c.repaint(svg)),
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return globe(cx, cy, r)
          if (c.meta.part === 'halo') return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 5)}" fill="url(#ch-halo)" opacity=".5"/>`
          return ball(cx, cy, r)
        },
        // Clouds are iridescent: white over pink and lilac, or lilac over violet at night and in the volcano's ash.
        cloud: (svg, c) => {
          const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
          const fill = night || lum(lit) < 0.4 ? 'url(#ch-cloudn)' : 'url(#ch-cloud)'
          return `<g>${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${fill}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`
        },
        air: (svg, c) => `<g opacity=".22">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? '#c88aff' : '#ffe0fa'}"`)}</g>`,
        beam: (svg, c) => `<g opacity=".28">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#ch-beam)"')}</g>`,
      },
    },
    'ch',
  )
}

// ---------------------------------------------------------------- Claude

/** Claude in chrome: each face reflecting sky over desert at its own horizon, keyed in dark violet, a sparkle for a glint. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
    .map(f => {
      const shade = (1 - f.light) * 0.45
      const k = shade < 0.1 ? 0 : shade < 0.25 ? 1 : 2
      return `<path fill="url(#ch-f-${f.name}${k})" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="#0c0718" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx - 0.2)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor - 0.2)}" r=".6" fill="#fff"/>`
        : `<path fill="none" stroke="#0c0718" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  // The glint: a sparkle on the body's top left corner.
  const body = m.parts.find(p => p.name === 'body')
  let glint = ''
  if (body) {
    const top = body.hull.reduce((a, b) => (b[0] + b[1] < a[0] + a[1] ? b : a))
    glint = `<path transform="translate(${t1(top[0] + cx + 1)} ${t1(top[1] + floor + 1)})" d="${sparklePath(3)}" fill="#ffffff"/>`
  }
  return (
    `<path fill="#ff50e6" opacity=".45" d="${poly(m.shadow, cx, floor)}"/>` +
    // The key line: the hulls in dark violet, a little wider than the chrome over them.
    `<path fill="${KEY}" stroke="${KEY}" stroke-width="1.6" stroke-linejoin="round" d="${hulls}"/>` +
    faces +
    eyes +
    glint
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The definitions the whole style draws with, laid down once under the stage. */
function defs(sw: number): string {
  let out = ''
  for (const [kind, c] of Object.entries(CHROMES)) HORIZONS.forEach((h, i) => (out += chrome(`ch-${kind}${i}`, h, c.sky, c.sand)))
  for (const [face, h] of Object.entries(FACE_H))
    SHADES.forEach((k, i) => (out += chrome(`ch-f-${face}${i}`, h, shaded(CHROMES.day.sky, k), shaded(CHROMES.day.sand, k))))
  // The neon grid: magenta lines converging on the vanishing point, cyan rungs crowding toward the horizon, a white-hot line along it.
  const vx = sw / 2
  const depth = 128 - HORIZON
  let grid = `<rect x="0" y="${HORIZON - 4}" width="${n(sw)}" height="8" fill="url(#ch-horizon)"/>`
  const spread = 26
  const count = Math.ceil(vx / spread) + 1
  for (let i = -count; i <= count; i++) grid += `<path d="M${n(vx)} ${HORIZON}L${n(vx + i * spread * 1.6)} ${n(HORIZON + depth * 1.6)}"/>`
  let rungs = ''
  for (let z = 1; z < 24; z *= 1.32) rungs += `<path d="M0 ${n(HORIZON + depth / z)}H${n(sw)}" stroke-opacity="${n(0.85 / Math.sqrt(z))}"/>`
  out += `<path id="ch-star" d="${sparklePath(1.6)}"/>`
  out +=
    `<g id="ch-grid"><g stroke="#ff5ae6" stroke-opacity=".7" stroke-width=".55" fill="none">${grid}</g>` +
    `<g stroke="#6ee6ff" stroke-width=".55" fill="none">${rungs}</g></g>`
  return (
    out +
    `<linearGradient id="ch-sky" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#ffb8ec"/><stop offset=".35" stop-color="#cdb4ff"/><stop offset=".7" stop-color="#9eeaff"/><stop offset="1" stop-color="#f2fdff"/></linearGradient>` +
    `<linearGradient id="ch-skyn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120634"/><stop offset=".5" stop-color="#3a1270"/><stop offset=".85" stop-color="#a0287a"/><stop offset="1" stop-color="#ff7ac8"/></linearGradient>` +
    `<radialGradient id="ch-pool-p"><stop offset="0" stop-color="#ff8cdc" stop-opacity=".45"/><stop offset="1" stop-color="#ff8cdc" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ch-pool-c"><stop offset="0" stop-color="#78f0ff" stop-opacity=".45"/><stop offset="1" stop-color="#78f0ff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ch-pool-w"><stop offset="0" stop-color="#ffffff" stop-opacity=".45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ch-pool-m"><stop offset="0" stop-color="#ff3ab8" stop-opacity=".35"/><stop offset="1" stop-color="#ff3ab8" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ch-halo"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="ch-horizon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#ff78f0" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="ch-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#ffe0f6"/><stop offset="1" stop-color="#cdb4ff"/></linearGradient>` +
    `<linearGradient id="ch-cloudn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b8ff"/><stop offset=".6" stop-color="#8a5ad0"/><stop offset="1" stop-color="#4a2a8a"/></linearGradient>` +
    `<linearGradient id="ch-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="ch-neon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".4" stop-color="#ff8a3a"/><stop offset="1" stop-color="#ff2a9a"/></linearGradient>` +
    `<linearGradient id="ch-glass" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#c8f6ff"/><stop offset=".45" stop-color="#5ae0ff"/><stop offset=".5" stop-color="#ffffff"/><stop offset=".55" stop-color="#7a5ad0"/><stop offset="1" stop-color="#3a2a9a"/></linearGradient>` +
    `<linearGradient id="ch-rim" x1="0" y1="0" x2="0" y2="1">${chromeStops(0.5, CHROMES.day.sky, CHROMES.day.sand)}</linearGradient>` +
    `<linearGradient id="ch-panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#f4ecff"/><stop offset="1" stop-color="#e2d4ff"/></linearGradient>` +
    `<linearGradient id="ch-word" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".42" stop-color="#a9dcff"/><stop offset=".5" stop-color="#24346e"/><stop offset=".58" stop-color="#c86a2c"/><stop offset=".85" stop-color="#ffd9a8"/><stop offset="1" stop-color="#ffffff"/></linearGradient>` +
    `<linearGradient id="ch-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`
  )
}

export const CHROME: Look = {
  name: 'chrome',
  label: 'Liquid Chrome',
  voice: 'a 1999 millennium chrome poster, all Y2K hype and sparkle',
  cell: 'solid',
  figure: '3d',
  font: SANS,
  charW: 5.3,
  caption: { fill: '#f6f0ff', stroke: '#7a2fd0', ink: '#1a0b3a', radius: 8 },
  paper: { card: '#f6f0ff', ink: '#1a0b3a', kinds: { code: '#0a7a9a', path: '#5a3ad0', fn: '#b0208a', num: '#d8561a', bad: '#d0204a', good: '#138a5e', face: '#b0208a' } },
  inset: 4,
  titleColor: '#ffffff',
  art: {
    painter: scenery,
    hero,
    sky: '#cdb4ff',
    ground: '#2a0f5c',
    defs,
  },
  // Now and then a shine sweeps across the picture, as over a poster's foil.
  texture: (sw, h) =>
    `<rect x="${n(-sw * 0.3)}" y="0" width="${n(sw * 0.3)}" height="${h}" fill="url(#ch-sweep)" transform="skewX(-20)">` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;${n(sw * 1.6)} 0;${n(sw * 1.6)} 0" keyTimes="0;.35;1" dur="7s" repeatCount="indefinite" additive="sum"/></rect>`,
  // A chrome bevel: the dark key, the chrome rim, a white inner line.
  frame: (sw, h) =>
    `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" rx="7" fill="none" stroke="${KEY}" stroke-width="1"/>` +
    `<rect x="2.6" y="2.6" width="${sw - 5.2}" height="${h - 5.2}" rx="6.5" fill="none" stroke="url(#ch-rim)" stroke-width="1.8"/>` +
    `<rect x="3.8" y="3.8" width="${sw - 7.6}" height="${h - 7.6}" rx="5.5" fill="none" stroke="#ffffff" stroke-opacity=".8" stroke-width=".5"/>`,
  // The chapter as a bubbly chrome wordmark: italic and heavy, a purple extrusion, a dark key, chrome in its letters.
  tag: (text, inset) => {
    const x = inset + 6
    const y = inset + 13
    const w = text.length * 5.6 + 6
    const t = escape(text)
    const at = (dx: number, dy: number, attrs: string) => `<text x="${n(x + dx)}" y="${n(y + dy)}" ${attrs}>${t}</text>`
    return {
      svg:
        `<g font-family="${SANS}" font-size="9.5" font-style="italic" font-weight="900">` +
        at(0.7, 0.9, `fill="#3b136b" stroke="#3b136b" stroke-width="1.6" stroke-linejoin="round"`) +
        at(0, 0, `fill="url(#ch-word)" stroke="${KEY}" stroke-width="1.2" stroke-linejoin="round" paint-order="stroke"`) +
        at(0, 0, 'fill="none" stroke="#ffffff" stroke-opacity=".8" stroke-width=".3"') +
        `</g>`,
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
      // A lilac pill in a chrome rim, its tail keyed too, and a gloss along its top.
      `<path fill="#f6f0ff" stroke="${KEY}" stroke-width=".8" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="8" fill="url(#ch-panel)" stroke="${KEY}" stroke-width="2.4"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="8" fill="none" stroke="url(#ch-rim)" stroke-width="1.3"/>` +
      `<rect x="${n(x + 2)}" y="${n(y + 1.6)}" width="${w - 4}" height="${n(h * 0.4)}" rx="6" fill="#fff" opacity=".65"/>`,
  },
}

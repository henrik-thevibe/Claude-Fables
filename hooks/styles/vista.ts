/**
 * Vista, after the gallery's "Vista: Aero glass, 2007" (henrik-styles.js,
 * style 52, `svista`), and the look's own sources: the Windows Vista desktop,
 * its Aurora wallpaper, Explorer windows, sidebar gadgets and 256px icons.
 *
 * The art bible, translated to the Fables' worlds:
 *
 * - The sky is the Aurora wallpaper: deep teal running to a sea green at the
 *   horizon, with soft swooshes of lime and white light sweeping across it.
 *   Night is the same wallpaper with the lights turned down: navy teal, the
 *   swooshes glowing lime and cyan, the stars little glossy orbs.
 * - Every solid thing is a 2007 icon: glossy plastic with the Vista split, a
 *   pale highlight over the top half breaking sharply to the deeper tone
 *   below, and a thin dark teal keyline round it. The palette is the desktop's:
 *   wallpaper teal and Aurora lime for the land and the leaves, Explorer
 *   slate and folder teal for what is built, glass a clear aqua. Only lava,
 *   lamps and Claude are warm, in the close button's coral.
 * - The sun and the moon are glossy orbs, like the Start button; the Earth a
 *   blue one. Clouds are frosted glass, white over pale teal.
 * - Claude is the selected Explorer icon: glossy orange plastic, each face
 *   lit top to bottom with the gloss baked into its gradient, a dark keyline,
 *   on the pale blue selection tile with its blue border.
 * - The screen is an Aero glass window, a teal glass frame with its minimize,
 *   maximize and coral close buttons; the chapter is the window title, dark
 *   text in a white glow; the caption is the Explorer details pane, and
 *   speech a Vista balloon tip.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedFaces } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, num as n, poly, step, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const UI = "'Segoe UI', 'Frutiger', 'Tahoma', 'Helvetica Neue', Arial, sans-serif"
/** The keyline round every icon and pane: the window border's dark teal. */
const KEY = '#0a2430'
/** The keyline as it reads on the scenery, a little softer than the frame's. */
const LINE = '#1c4652'

/** The desktop's ramps, dark to light. */
const R = {
  teal: ['#05252f', '#0d4a55', '#0f6f66', '#2a9a92', '#7accc4', '#d4f2ee'],
  lime: ['#0e3a1a', '#1a5e24', '#2e8a2a', '#5ab83a', '#96e63c', '#d8f8a8'],
  // The Aurora meadow after dark: deep sea greens.
  moss: ['#062a24', '#0a3e32', '#0f5a46', '#1a7a5a', '#3a9a72', '#7ac8a0'],
  // Explorer's command bar and panes: slate blue to the details pane's pale blue.
  slate: ['#0f2436', '#1d4a66', '#3c6f8e', '#6a98b4', '#a8c8dc', '#e4f0f8'],
  // The folder icon's teal, for what is built of wood or stone.
  folder: ['#1a4040', '#2a6060', '#3f8484', '#5fa8a8', '#9cd0cc', '#d8f0ec'],
  basalt: ['#0e1a26', '#1a2a3a', '#2a3e52', '#43586e', '#6a7e92', '#a0b0c0'],
  sand: ['#4a3418', '#7a5a2a', '#a8823e', '#d0aa62', '#ecd29a', '#fff2d4'],
  coral: ['#7a2208', '#a8360e', '#c0391f', '#d8573e', '#e8804f', '#f2a08c'],
  glass: ['#063a4a', '#0a5a70', '#1a7e96', '#3aa2b8', '#8cd2e0', '#d4f2f8'],
}

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false

function brownish(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  return parseInt(c.slice(0, 2), 16) > parseInt(c.slice(4, 6), 16) + 16
}

/** A lit color carried onto the desktop's ramps, at its own lightness. */
function tone(color: string, family: Family): string {
  let t = Math.min(0.99, Math.pow(lum(color), 0.9) * 1.1)
  const warm = isWarm(color)
  switch (family) {
    case 'fire':
      return step(R.coral, Math.min(0.99, Math.max(0.5, t)))
    case 'lamp':
      return isWarm(color) ? step(R.coral, Math.max(0.7, t)) : '#bff4ff'
    case 'foliage':
    case 'grass':
      return step(night ? R.moss : R.lime, Math.min(t, 0.84))
    case 'land':
      t = Math.min(t, night ? 0.5 : 0.66)
      if (warm && lum(color) < 0.4) return step(R.basalt, t)
      return warm ? step(R.sand, t) : isGreen(color) ? step(night ? R.moss : R.lime, t) : step(R.teal, t)
    case 'water':
    case 'glass':
      return step(R.glass, t)
    case 'bark':
      return step(R.sand, t * 0.6)
    case 'ground':
    case 'rock':
    case 'mark':
      t = Math.min(t, 0.66)
      if (!isGreen(color) && (warm || brownish(color)) && lum(color) < 0.4) return step(R.basalt, t)
      return isGreen(color) ? step(night ? R.moss : R.lime, t) : warm || brownish(color) ? step(R.sand, t) : step(R.slate, t)
    case 'built':
      return warm && lum(color) > 0.5 ? step(R.sand, t) : brownish(color) ? step(R.folder, t) : step(R.slate, Math.min(t, 0.84))
    default:
      return warm ? step(R.coral, t) : isGreen(color) ? step(R.lime, t) : step(R.teal, t)
  }
}

/**
 * A surface's gradient: the Vista gloss, a pale top half breaking sharply to
 * the deeper tone below. Each made once, handed out with the first element
 * that needs it.
 */
let made = new Set<string>()
let pending = ''
function glossy(color: string): string {
  const id = `vs-g${color.slice(1)}`
  if (!made.has(id)) {
    made.add(id)
    pending +=
      `<linearGradient id="${id}" x2="0" y2="1"><stop offset="0" stop-color="${mix(color, '#ffffff', 0.4)}"/>` +
      `<stop offset=".47" stop-color="${mix(color, '#ffffff', 0.16)}"/><stop offset=".5" stop-color="${color}"/></linearGradient>`
  }
  return `url(#${id})`
}

/** The Aurora wallpaper: teal to sea green, swooshes of lime and white light; navy teal by night. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  // Each swoosh is a broad faint stroke under a narrower brighter one, the wallpaper's soft blur without a filter.
  const swoosh = (y0: number, cy: number, y1: number, w: number, color: string, o: number) => {
    const d = `M-30 ${y0}Q${n(sw * 0.4)} ${cy} ${n(sw + 30)} ${y1}`
    return (
      `<path d="${d}" stroke="${color}" stroke-opacity="${n(o * 0.35)}" stroke-width="${n(w * 2.2)}" />` +
      `<path d="${d}" stroke="${color}" stroke-opacity="${n(o * 0.6)}" stroke-width="${n(w)}" />` +
      `<path d="${d}" stroke="#ffffff" stroke-opacity="${n(o * 0.5)}" stroke-width="${n(Math.max(0.6, w * 0.12))}" />`
    )
  }
  const lights = night
    ? swoosh(30, 70, 14, 12, '#7aff5a', 0.55) + swoosh(70, 30, 58, 7, '#3ce0e0', 0.5) + swoosh(8, 50, 40, 4, '#c8ffb0', 0.4)
    : swoosh(34, 78, 20, 14, '#b4ff6a', 0.45) + swoosh(74, 36, 62, 8, '#ffffff', 0.4) + swoosh(6, 46, 44, 5, '#aaf0ff', 0.4)
  return (
    `<rect width="${n(sw)}" height="128" fill="url(#${night ? 'vs-wall-n' : 'vs-wall'})"/>` +
    `<circle cx="${n(sw * 0.12)}" cy="110" r="120" fill="url(#vs-glow-l)"/><circle cx="${n(sw * 0.85)}" cy="10" r="110" fill="url(#vs-glow-c)"/>` +
    `<g fill="none" stroke-linecap="round">${lights}<animateTransform attributeName="transform" type="translate" values="0 0;0 3;0 0" dur="12s" repeatCount="indefinite"/></g>`
  )
}

/** Stars as glossy little orbs: every shape becomes a group, keeping its attributes and animation, of orbs at its points. */
function stars(svg: string, c: Ctx): string {
  const at = (pts: [string, string][]) => pts.map(([x, y]) => `<use href="#vs-star" x="${x}" y="${y}"/>`).join('')
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, '')
      return `<g${kept}>${at(pts)}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** A glossy orb, like the Start button: a radial body, a keyline, a white gloss cap over its top. */
function orb(cx: number, cy: number, r: number, fill: string, glow: string): string {
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 3)}" fill="url(#${glow})"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#${fill})" stroke="${KEY}" stroke-opacity=".6" stroke-width=".6"/>` +
    `<ellipse cx="${n(cx)}" cy="${n(cy - r * 0.42)}" rx="${n(r * 0.7)}" ry="${n(r * 0.45)}" fill="url(#vs-cap)"/>`
  )
}

const scenery = () => {
  night = false
  made = new Set()
  pending = ''
  const p = painter(
    {
      // A gradient can fill, but not be a line, a stop or a currentColor: those take the plain tone.
      ink: (color, family, _depth, attr) => {
        if (attr !== 'fill') return tone(color, family)
        if (family === 'stars' || family === 'life') return '#ffffff'
        if (family === 'lamp') return tone(color, family)
        if (family === 'shadow') return night ? '#021016' : '#0a3a40'
        return glossy(tone(color, family))
      },
      // A gradient of the lit scene becomes one glossy surface in its overall tone; a faint wash of light is not drawn.
      // A radial wash of light stays a soft falloff, carried over in the desktop's colors.
      url: (_id, family, attr, g) => {
        if (g?.tag === 'radialGradient') return undefined
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (attr === 'stroke') return tone(mean.color, family)
        if (mean.opacity < 0.5) return 'none'
        return glossy(tone(mean.color, family))
      },
      // The icon keyline: dark teal round every nearer shape; air, light and the far distance have none.
      line: (family, depth) =>
        family === 'sky' || family === 'stars' || family === 'life' || family === 'lens' || family === 'air' || family === 'beam' || family === 'glow' || family === 'fire' || family === 'lamp' || depth < 0.25
          ? ''
          : `stroke="${LINE}" stroke-width="${n(0.3 + depth * 0.3)}"`,
      lineless: 0.6,
      faint: 'hide',
      // A lamp's pool of light: the selection blue, soft on the floor.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="#bfe8ff" opacity=".25"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="#ffffff" opacity=".25"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.meta.part === 'halo') return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 5)}" fill="url(#vs-halo)"/>`
          if (c.role === 'space.earth') return orb(cx, cy, r, 'vs-earth', 'vs-halo-c')
          if (c.role === 'night.moon') return orb(cx, cy, r, 'vs-moon', 'vs-halo-c')
          return orb(cx, cy, r, night ? 'vs-moon' : 'vs-sun', 'vs-halo')
        },
        // Clouds are frosted glass: white over pale teal, or a dim teal glass at night and in the volcano's ash.
        cloud: (svg, c) => {
          const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? '#ffffff'
          const fill = night || lum(lit) < 0.4 ? 'url(#vs-cloudn)' : 'url(#vs-cloud)'
          return `<g>${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${fill}"`).replace(/\sopacity="[^"]*"/g, '')}</g>`
        },
        air: (svg, c) => `<g opacity=".22">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${night ? '#7ac8c0' : '#e4fff4'}"`)}</g>`,
        beam: (svg, c) => `<g opacity=".28">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#vs-beam)"')}</g>`,
      },
    },
    'vs',
  )
  // Hand the glossy gradients along with the element that first needs them.
  return {
    el: (role: Parameters<typeof p.el>[0], svg: string, meta?: Parameters<typeof p.el>[2]) => {
      const out = p.el(role, svg, meta)
      const defs = pending
      pending = ''
      return (defs ? `<defs>${defs}</defs>` : '') + out
    },
    defs: p.defs,
  }
}

// ---------------------------------------------------------------- Claude

/** Claude's plastic, dark to light, and how far each face darkens as it turns from the light. */
const ORANGE = '#ec8a5e'
const FACES = ['top', 'front', 'left', 'right', 'back', 'bottom'] as const
const SHADES = [0, 0.14, 0.28]

/** Claude as the selected Explorer icon: on the pale blue tile, glossy orange plastic, a dark keyline. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const xs = m.parts.flatMap(pt => pt.hull.map(q => q[0] + cx))
  const ys = m.parts.flatMap(pt => pt.hull.map(q => q[1] + floor))
  const x0 = Math.min(...xs) - 4
  const y0 = Math.min(...ys) - 4
  const tile = `<rect x="${t1(x0)}" y="${t1(y0)}" width="${t1(Math.max(...xs) + 4 - x0)}" height="${t1(floor + 3 - y0)}" rx="3" fill="url(#vs-select)" stroke="#78b4e1"/>`
  const faces = outlinedFaces(m)
    .map(f => {
      const shade = (1 - f.light) * 0.45
      const k = shade < 0.1 ? 0 : shade < 0.25 ? 1 : 2
      return `<path fill="url(#vs-f-${f.name}${k})" d="${poly(f.pts, cx, floor)}"/>`
    })
    .join('')
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="#1f1412" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx - 0.2)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor - 0.2)}" r=".6" fill="#fff"/>`
        : `<path fill="none" stroke="#1f1412" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    tile +
    `<path fill="#5a1e0a" stroke="#5a1e0a" stroke-width="1.4" stroke-linejoin="round" d="${hulls}"/>` +
    faces +
    eyes
  )
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** One face's plastic: the Vista gloss over its tone, the top face a shade lighter, darkened by step `k`. */
function face(name: string, k: number): string {
  const base = mix(name === 'top' ? mix(ORANGE, '#ffffff', 0.18) : ORANGE, '#3a0e04', k)
  return (
    `<linearGradient id="vs-f-${name}${SHADES.indexOf(k)}" x2="0" y2="1"><stop offset="0" stop-color="${mix(base, '#ffffff', 0.32)}"/>` +
    `<stop offset=".46" stop-color="${mix(base, '#ffffff', 0.1)}"/><stop offset=".52" stop-color="${base}"/><stop offset="1" stop-color="${mix(base, '#3a0e04', 0.2)}"/></linearGradient>`
  )
}

function defs(): string {
  let out = ''
  for (const f of FACES) for (const k of SHADES) out += face(f, k)
  const radial = (id: string, a: string, b: string, c: string) =>
    `<radialGradient id="${id}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`
  const fade = (id: string, color: string, o: number) =>
    `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${o}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`
  return (
    out +
    `<g id="vs-star"><circle r="1.6" fill="url(#vs-halo)"/><circle r=".75" fill="#ffffff"/></g>` +
    `<linearGradient id="vs-wall" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#0d5560"/><stop offset=".45" stop-color="#14837a"/><stop offset=".8" stop-color="#4cb8a0"/><stop offset="1" stop-color="#b8ecd0"/></linearGradient>` +
    `<linearGradient id="vs-wall-n" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#04161e"/><stop offset=".5" stop-color="#083240"/><stop offset=".85" stop-color="#0d5560"/><stop offset="1" stop-color="#1a7a70"/></linearGradient>` +
    fade('vs-glow-l', '#96e63c', 0.35) +
    fade('vs-glow-c', '#3cc8dc', 0.35) +
    fade('vs-halo', '#ffffff', 0.6) +
    fade('vs-halo-c', '#bff4ff', 0.45) +
    radial('vs-sun', '#ffffff', '#fff6c8', '#f2c060') +
    radial('vs-moon', '#ffffff', '#d4f2ee', '#7accc4') +
    radial('vs-earth', '#9fe0f2', '#2d7fd6', '#0d3f7a') +
    `<linearGradient id="vs-cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient>` +
    `<linearGradient id="vs-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".48" stop-color="#f0fbfa"/><stop offset=".52" stop-color="#d4eeec"/><stop offset="1" stop-color="#a8d8d4"/></linearGradient>` +
    `<linearGradient id="vs-cloudn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8d0d0"/><stop offset=".5" stop-color="#5a8a90"/><stop offset="1" stop-color="#2a5a66"/></linearGradient>` +
    `<linearGradient id="vs-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="vs-select" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e1f2fc" stop-opacity=".75"/><stop offset="1" stop-color="#c4e2f6" stop-opacity=".6"/></linearGradient>` +
    `<linearGradient id="vs-frame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ec" stop-opacity=".8"/><stop offset=".5" stop-color="#5aa0b0" stop-opacity=".7"/><stop offset="1" stop-color="#2a6a7a" stop-opacity=".8"/></linearGradient>` +
    `<linearGradient id="vs-btn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".48" stop-color="#d2ebf5" stop-opacity=".6"/><stop offset=".52" stop-color="#96bed2" stop-opacity=".55"/><stop offset="1" stop-color="#c8ebfa" stop-opacity=".65"/></linearGradient>` +
    `<linearGradient id="vs-close" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2a08c"/><stop offset=".48" stop-color="#d8573e"/><stop offset=".52" stop-color="#c0391f"/><stop offset="1" stop-color="#e8804f"/></linearGradient>` +
    `<linearGradient id="vs-tip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e4eef6"/></linearGradient>`
  )
}

/** The caption buttons, minimize, maximize and close, at the window's top right edge `x1`. */
function buttons(x1: number): string {
  const btn = (x: number, w: number, fill: string, glyph: string) =>
    `<rect x="${n(x)}" y="2" width="${w}" height="10" rx="2.5" fill="url(#${fill})" stroke="${KEY}" stroke-opacity=".6" stroke-width=".6"/>${glyph}`
  const c = x1 - 22
  const mx = c - 15
  const mn = mx - 15
  return (
    btn(mn, 15, 'vs-btn', `<path d="M${n(mn + 4.5)} 8.5h6" stroke="#fff" stroke-width="1.2"/>`) +
    btn(mx, 15, 'vs-btn', `<rect x="${n(mx + 5)}" y="4.6" width="5" height="4" fill="none" stroke="#fff" stroke-width="1"/>`) +
    btn(c, 20, 'vs-close', `<path d="M${n(c + 7)} 4.5l6 5M${n(c + 13)} 4.5l-6 5" stroke="#fff" stroke-width="1.3"/>`)
  )
}

export const VISTA: Look = {
  name: 'vista',
  label: 'Vista',
  voice: 'a 2007 Windows Vista desktop, all Aero glass, gadgets and gloss',
  cell: 'solid',
  figure: '3d',
  font: UI,
  charW: 5.2,
  caption: { fill: '#eaf4fa', stroke: '#7aa6c2', ink: '#1e2a33', radius: 3 },
  paper: { card: '#ffffff', ink: '#1e2a33', kinds: { code: '#0f6f66', path: '#1d5aa8', fn: '#6a3aa8', num: '#c0501a', bad: '#c0281c', good: '#2a8a2a', face: '#c0501a' } },
  inset: 5,
  titleColor: '#ffffff',
  art: {
    painter: scenery,
    hero,
    sky: '#14837a',
    ground: '#2e8a2a',
    defs,
  },
  // The Aero glass window: a dark keyline, the teal glass border, a white inner line, the caption buttons at the top right.
  frame: (sw, h) =>
    `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" rx="6" fill="none" stroke="url(#vs-frame)" stroke-width="3"/>` +
    `<rect x=".5" y=".5" width="${sw - 1}" height="${h - 1}" rx="7" fill="none" stroke="${KEY}" stroke-opacity=".75" stroke-width="1"/>` +
    `<rect x="3.2" y="3.2" width="${sw - 6.4}" height="${h - 6.4}" rx="4.5" fill="none" stroke="#ffffff" stroke-opacity=".6" stroke-width=".6"/>` +
    buttons(sw - 4),
  // The window title: dark text in Vista's white glow, a little folder before it.
  tag: (text, inset) => {
    const x = inset + 5
    const y = inset + 11
    const w = text.length * 5.3 + 18
    return {
      svg:
        `<g transform="translate(${x} ${y - 7})"><path d="M0 9V1h3.5l1 1.2H9V9z" fill="#5fa8a8" stroke="${KEY}" stroke-width=".4"/><path d="M0 9l1-5h9l-1 5z" fill="#bfe6e2" fill-opacity=".9" stroke="#fff" stroke-width=".3"/></g>` +
        `<text x="${x + 14}" y="${y}" font-family="${UI}" font-size="8.5" fill="#0d1a24" stroke="#ffffff" stroke-opacity=".75" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${escape(text)}</text>`,
      w: x + w + 4,
      h: y + 5,
    }
  },
  bubble: {
    font: UI,
    size: 9,
    charW: 5.2,
    line: 12,
    base: 13,
    // A Vista balloon tip: white to pale blue, a grey border round it and its tail.
    draw: ({ x, y, w, h }, { base, tip }) =>
      `<path fill="#f2f7fb" stroke="#767676" stroke-width=".8" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="4" fill="url(#vs-tip)" stroke="#767676" stroke-width=".8"/>` +
      `<path fill="#f2f7fb" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>`,
  },
}

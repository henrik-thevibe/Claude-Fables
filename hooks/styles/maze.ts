/**
 * Maze War, after the gallery's "Maze War" (henrik-styles.js, style 27,
 * `emaze`): the first-person corridor game on the Xerox Alto, 1974.
 *
 * The art bible, translated from the Alto's screen to the Fables' worlds:
 *
 * - The medium is the Alto's one-bit bitmap display: paper-white phosphor and
 *   black, nothing between. Every solid thing is a plane of the screen's own
 *   white, outlined in a black line one pixel wide; hidden lines are removed by
 *   painting order alone, the nearer plane knocking out whatever stands behind
 *   it, as the game draws its walls. No gradient, no shading, no color.
 * - Where a one-bit screen needs a tone, it dithers: an ordered pattern of
 *   pixels, a quarter or a half of them black. Shadows and pools of lamplight
 *   are dithered; nothing else is.
 * - The sky is the bare screen. Clouds are white planes, outlined, their lobes
 *   hiding each other's lines. Mist and beams of light have no edge, so they
 *   are dotted rules: a pixel on, three off.
 * - The sun and the moon are the game's other players: the floating eyeball of
 *   Maze War, a white ball with a black pupil that glances from side to side;
 *   the sun has a ring of pixel ticks. The Earth is a vector globe, its
 *   meridians turning. Stars, sparks and fireflies are single black pixels.
 * - Land, rock, buildings, bark, foliage and grass are wireframe: white planes
 *   with black outlines, the far ones in a finer line. Lit windows, lamps, lava
 *   and fire are solid ink: on a one-bit screen what glows is filled.
 * - The ground is the maze's floor: ruled in one-point perspective toward a
 *   vanishing point at the middle of the stage, the corridor's seams fanning
 *   out and its cells crowding toward the horizon. Glass is white with a glint;
 *   reflections and glows are not drawn.
 * - Night is the Alto in reverse video: the dark scenes (space, the volcano,
 *   the lab, the village) are drawn white on black, so lamps, lava and stars
 *   shine white, and every outline is a white line on the black screen.
 * - Claude is drawn as the plate draws him: each face a plane of the screen,
 *   outlined, hidden lines removed, a moat of screen round his figure so he
 *   stands clear of the lines behind; googly eyes, a white ball and a black
 *   pupil, as the game's players have.
 * - The stage is seen from inside the maze: the near corridor walls frame it at
 *   left and right, converging toward the vanishing point, and the Alto's
 *   status line runs along the bottom in reverse video, CLAWD, SCORE 0 and a
 *   step counter that ticks on. The chapter is a Smalltalk window label, a
 *   black tab lettered in white; the caption is a window with a one-bit drop
 *   shadow, set in a bitmap type.
 */
import type { HeroPainter } from '../hero3d'
import { type Model, outlinedOrder } from '../clawd3d'
import { lum, meanOf, num as n, poly, t1 } from '../art/ink'
import { painter, type Ctx } from '../art/painter'
import type { Family, Painter } from '../art/roles'
import type { Look, Paper } from '../looks'

const MONO = "Monocraft, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
/** The scenes the game plays in reverse video: the dark ones. */
const DARK = new Set(['space', 'volcano', 'lab', 'night'])
/** Where the maze's floor runs to: its vanishing point's height, and the status line's top. */
const VP_Y = 92
const BAND = 7
/** The near corridor walls' width at each side of the stage. */
const WALL = 13

/** Whether the scene being painted is in reverse video. Every element sets it by its scene. */
let night = false
/** The screen and its ink: white and black by day, swapped at night. */
const P = () => (night ? '#000' : '#fff')
const K = () => (night ? '#fff' : '#000')

/** Families with no outline: light, air, and what is drawn solid or not at all. */
const UNLINED: readonly Family[] = ['sky', 'stars', 'life', 'lens', 'fire', 'lamp', 'glow', 'beam', 'air', 'shadow', 'body', 'water']

/** How a lit color reads on the one-bit screen: the screen itself, solid ink, a dither or the floor. */
function fill(color: string, family: Family): string {
  switch (family) {
    case 'stars':
    case 'life':
    case 'fire':
    case 'lamp':
      return K()
    case 'shadow':
      return 'url(#mz-d50)'
    case 'ground':
      return 'url(#mz-floor)'
    case 'glass':
      // A lit screen or pane glows, and is filled; an unlit one is the screen with a glint.
      return lum(color) > 0.55 ? K() : 'url(#mz-glass)'
    default:
      return P()
  }
}

/** The line of the drawing: one pixel, finer for what is far or made of many small shapes. */
const lineFor = (family: Family, depth: number) => {
  const w = family === 'grass' || family === 'foliage' ? 0.32 + depth * 0.2 : 0.4 + depth * 0.3
  return `stroke="${K()}" stroke-width="${n(w)}" stroke-linejoin="round"`
}

/** Dotted rules: a pixel on, three off, for what has no edge. */
const dotted = (w = 0.5) => `fill="none" stroke="${K()}" stroke-width="${w}" stroke-dasharray=".7 2.1"`

/** The eyeball of Maze War: a white ball, its iris ring and a black pupil that glances side to side. */
function eyeball(cx: number, cy: number, r: number, rays: boolean, glance: number): string {
  const g = n(r * 0.28)
  let ticks = ''
  if (rays) {
    let d = ''
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      d += `M${t1(cx + Math.cos(a) * r * 1.35)} ${t1(cy + Math.sin(a) * r * 1.35)}L${t1(cx + Math.cos(a) * r * 1.7)} ${t1(cy + Math.sin(a) * r * 1.7)}`
    }
    ticks = `<path d="${d}"/>`
  }
  return (
    `<g fill="${P()}" stroke="${K()}" stroke-width=".7">${ticks}<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>` +
    `<g><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.52)}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.26)}" fill="${K()}"/>` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;${g} 0;${g} 0;-${g} 0;-${g} 0;0 0" keyTimes="0;.2;.45;.55;.8;1" calcMode="discrete" dur="${glance}s" repeatCount="indefinite"/></g></g>`
  )
}

/** The Earth as the Alto would plot it: an outline, its equator and a meridian turning. */
function globe(cx: number, cy: number, r: number): string {
  const widths = Array.from({ length: 13 }, (_, i) => n(Math.abs(Math.cos((i * Math.PI) / 12)) * r)).join(';')
  const at = `cx="${n(cx)}" cy="${n(cy)}"`
  let out = `<g fill="none" stroke="${K()}" stroke-width=".6"><circle ${at} r="${n(r)}" fill="${P()}"/><ellipse ${at} rx="${n(r)}" ry="${n(r * 0.3)}"/>`
  out += `<ellipse cx="${n(cx)}" cy="${n(cy - r * 0.55)}" rx="${n(r * 0.83)}" ry="${n(r * 0.22)}"/><ellipse cx="${n(cx)}" cy="${n(cy + r * 0.55)}" rx="${n(r * 0.83)}" ry="${n(r * 0.22)}"/>`
  for (let k = 0; k < 3; k++) out += `<ellipse ${at} rx="${n(r)}" ry="${n(r)}"><animate attributeName="rx" values="${widths}" dur="12s" begin="${n((-k * 12) / 3)}s" repeatCount="indefinite"/></ellipse>`
  return out + `</g>`
}

/** Stars, sparks and dust as single pixels of ink: every shape keeps its place and animation, filled solid. */
const pixels = (svg: string, c: Ctx) => c.repaint(svg).replace(/\sstroke="[^"]*"/g, ` stroke="${K()}"`)

/** Outlines only, dotted: the convention for things without an edge. */
const outlineDotted = (svg: string, c: Ctx) =>
  `<g ${dotted(0.45)}>` +
  c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="none"').replace(/\sstroke(-width)?="[^"]*"/g, '').replace(/\s(opacity|fill-opacity)="[^"]*"/g, '') +
  `</g>`

const rules = () =>
  painter(
    {
      ink: (color, family, _depth, attr) => (attr === 'stroke' ? K() : attr === 'fill' ? fill(color, family) : lum(color) > 0.5 ? P() : K()),
      // A gradient is one plane of the screen or another; a faint wash of light is not drawn at all.
      url: (_id, family, attr, g) => {
        if (attr === 'stroke') return K()
        const mean = g ? meanOf(g) : { color: '#808080', opacity: 1 }
        if (mean.opacity < 0.5 && family !== 'ground') return 'none'
        return fill(mean.color, family)
      },
      line: (family, depth) => (UNLINED.includes(family) ? '' : lineFor(family, depth)),
      lineless: 0.5,
      faint: 'hide',
      // One bit: what is drawn at all is drawn solid.
      opacity: (_f, v) => (v >= 0.3 ? 1 : v),
      // A pool of lamplight is dithered: a quarter of its pixels lit, ringed in dots.
      pool: e => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="url(#mz-d25)" stroke="${K()}" stroke-width=".4" stroke-dasharray=".7 2.1"/>`,
      templateFamily: 'foliage',
      redraw: {
        // The sky is the bare screen: the stage's own color shows.
        sky: () => '',
        lens: () => '',
        glow: () => '',
        water: () => '',
        stars: pixels,
        life: pixels,
        // The Milky Way's band is light, and is not drawn; its dust is pixels.
        'space.milkyway': (svg, c) => pixels(svg.replace(/<ellipse[^>]*\/>/, ''), c),
        body: (_svg, c) => {
          if (c.meta.part === 'halo') return ''
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return globe(cx, cy, r)
          // The sun is a player with a ring of ticks; the moon a player alone.
          return c.role === 'night.moon' ? eyeball(cx, cy, r * 1.25, false, 7) : eyeball(cx, cy, Math.max(7, r * 1.15), true, 6)
        },
        beam: outlineDotted,
        // Mist: two dotted rules across its band, drifting as the mist did.
        air: (svg, c) => {
          const y = c.meta.y ?? 80
          const h = c.meta.h ?? 12
          const w = c.meta.sw ?? 640
          return `<g ${dotted()}><path d="M-20 ${n(y + h * 0.4)}H${n(w + 20)}M-12 ${n(y + h * 0.75)}H${n(w + 20)}"/>${c.motion(svg)}</g>`
        },
      },
    },
    'mz',
  )

/** The scenery's painter: each element sets the screen's polarity by the scene it belongs to. */
const scenery = (_sw: number): Painter => {
  night = false
  const p = rules()
  return {
    el: (role, svg, meta) => {
      const scene = role.split('.')[0] ?? ''
      if (role.includes('.')) night = DARK.has(scene)
      return p.el(role, svg, meta)
    },
    defs: svg => p.defs(svg),
  }
}

// ---------------------------------------------------------------- Claude

/** Claude as the plate draws him: planes of the screen, outlined, hidden lines removed; googly eyes. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  // One path a part, in painting order: a box's shown faces never overlap, so its outlines can go together.
  const parts = outlinedOrder(m)
    .filter(pt => pt.faces.length)
    .map(pt => `<path d="${pt.faces.map(f => poly(f.pts, cx, floor)).join('')}"/>`)
    .join('')
  const eyes = m.eyes
    .map(e => {
      if (!e.poly) return `<path fill="none" stroke-width=".8" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`
      const xs = e.poly.map(q => q[0])
      const ys = e.poly.map(q => q[1])
      const ex = (Math.min(...xs) + Math.max(...xs)) / 2 + cx
      const ey = (Math.min(...ys) + Math.max(...ys)) / 2 + floor
      const r = Math.max(1.4, (Math.max(...ys) - Math.min(...ys)) * 0.55)
      return `<circle cx="${t1(ex)}" cy="${t1(ey)}" r="${t1(r)}"/><circle cx="${t1(ex)}" cy="${t1(ey + r * 0.1)}" r="${t1(r * 0.48)}" fill="${K()}"/>`
    })
    .join('')
  return (
    `<path fill="url(#mz-d50)" d="${poly(m.shadow, cx, floor)}"/>` +
    // A moat of screen round his figure, so the lines behind stop short of him.
    `<path fill="none" stroke="${P()}" stroke-width="2.2" stroke-linejoin="round" d="${hulls}"/>` +
    `<g fill="${P()}" stroke="${K()}" stroke-width=".75" stroke-linejoin="round">${parts}${eyes}</g>`
  )
}

// ---------------------------------------------------------------- the screen

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The definitions the whole style draws with, laid down once, in the scene's polarity. */
function defs(sw: number, h: number): string {
  const p = P()
  const k = K()
  // The maze's floor: seams fanning out from the vanishing point, cells crowding toward the horizon.
  const vx = sw / 2
  let seams = ''
  const spread = 34
  const count = Math.ceil(vx / spread) + 2
  for (let i = -count; i <= count; i++) seams += `M${n(vx)} ${VP_Y}L${n(vx + i * spread * 2.2)} ${n(h + 40)}`
  let rungs = ''
  for (let z = 1; z < 9; z *= 1.45) rungs += `M0 ${n(VP_Y + (h - VP_Y) / z)}H${n(sw)}`
  return (
    `<pattern id="mz-floor" width="${n(sw)}" height="${h}" patternUnits="userSpaceOnUse"><rect width="${n(sw)}" height="${h}" fill="${p}"/>` +
    `<path d="${seams}${rungs}" fill="none" stroke="${k}" stroke-width=".4"/></pattern>` +
    // Ordered dithers: a quarter and a half of the pixels in ink.
    `<pattern id="mz-d25" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0 0h1v1H0z" fill="${k}"/></pattern>` +
    `<pattern id="mz-d50" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0 0h1v1H0zM1 1h1v1H1z" fill="${k}"/></pattern>` +
    // Glass: the screen with a glint, two short diagonal strokes.
    `<pattern id="mz-glass" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${p}"/><path d="M1 4l3-3M2 6l4-4" stroke="${k}" stroke-width=".5"/></pattern>` +
    `<clipPath id="mz-odo"><rect x="0" y="${h - BAND}" width="${n(sw)}" height="${BAND}"/></clipPath>`
  )
}

/** The near corridor wall at one side of the stage, converging toward the vanishing point, a segment's seam on it. */
function wall(sw: number, h: number, side: -1 | 1): string {
  const x0 = side < 0 ? 0 : sw
  const x1 = x0 - side * WALL
  const xm = x0 - side * WALL * 0.5
  const bottom = h - BAND
  const slopeTop = VP_Y / (sw / 2)
  const slopeBot = (bottom - VP_Y) / (sw / 2)
  const top = (x: number) => n(Math.abs(x - x0) * slopeTop)
  const bot = (x: number) => n(bottom - Math.abs(x - x0) * slopeBot)
  return (
    `<path d="M${n(x0)} 0L${n(x1)} ${top(x1)}V${bot(x1)}L${n(x0)} ${bottom}z"/>` +
    `<path fill="none" d="M${n(xm)} ${top(xm)}V${bot(xm)}"/>`
  )
}

/** The status line's step counter: digits stacked in a clipped window, the stack stepping up every 2.6 seconds. */
function counter(x: number, y: number): string {
  const digits = Array.from({ length: 10 }, (_, i) => `<tspan x="${n(x)}" y="${n(y + i * 8)}">${i}</tspan>`).join('')
  const steps = Array.from({ length: 10 }, (_, i) => `0 ${-i * 8}`).join(';')
  return `<g clip-path="url(#mz-odo)"><text>${digits}<animateTransform attributeName="transform" type="translate" values="${steps}" calcMode="discrete" dur="26s" repeatCount="indefinite"/></text></g>`
}

const DAY_PAPER: Paper = { card: '#fff', ink: '#000', kinds: { code: '#000', path: '#000', fn: '#000', num: '#000', bad: '#000', good: '#000', face: '#000' } }
const NIGHT_PAPER: Paper = { card: '#000', ink: '#fff', kinds: { code: '#fff', path: '#fff', fn: '#fff', num: '#fff', bad: '#fff', good: '#fff', face: '#fff' } }

export const MAZE: Look = {
  name: 'maze',
  label: 'Maze War',
  voice: 'the terse status line of a 1974 Xerox Alto playing Maze War',
  cell: 'solid',
  figure: '3d',
  font: MONO,
  charW: 5.7,
  caption: { fill: '#fff', stroke: '#000', ink: '#000', radius: 0 },
  // The caption's window takes the screen's polarity: black on white, or white on black at night.
  get paper() {
    return night ? NIGHT_PAPER : DAY_PAPER
  },
  inset: WALL,
  titleColor: '#000',
  art: {
    painter: scenery,
    hero,
    get sky() {
      return P()
    },
    get ground() {
      return P()
    },
    defs,
  },
  frame: (sw, h) => {
    const y = h - BAND
    return (
      `<g fill="${P()}" stroke="${K()}" stroke-width=".7" stroke-linejoin="round">${wall(sw, h, -1)}${wall(sw, h, 1)}</g>` +
      // The Alto's status line, in reverse video, with a step counter ticking on.
      `<rect x="0" y="${y}" width="${n(sw)}" height="${BAND}" fill="${K()}"/>` +
      `<g font-family="${MONO}" font-size="5.4" font-weight="700" fill="${P()}"><text x="8" y="${n(y + 5.2)}" xml:space="preserve">CLAWD   SCORE 0   STEP 00</text>${counter(8 + 25 * 3.25, y + 5.2)}</g>` +
      `<rect x=".35" y=".35" width="${n(sw - 0.7)}" height="${n(h - 0.7)}" fill="none" stroke="${K()}" stroke-width=".7"/>`
    )
  },
  // The chapter as a Smalltalk window label: a tab in ink, lettered in the screen's color.
  tag: (text, inset) => {
    const x = inset + 3
    const y = 3
    const w = text.length * 4.9 + 8
    return {
      svg:
        `<rect x="${x}" y="${y}" width="${n(w)}" height="10" fill="${K()}"/>` +
        `<text x="${x + 4}" y="${y + 7.3}" font-family="${MONO}" font-size="7" font-weight="700" fill="${P()}">${escape(text)}</text>`,
      w: x + w + 3,
      h: y + 13,
    }
  },
  bubble: {
    font: MONO,
    size: 8.4,
    charW: 5.6,
    line: 11,
    base: 12,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A window with a one-bit drop shadow, its tail outlined and run under its edge.
      `<rect x="${n(x + 2)}" y="${n(y + 2)}" width="${w}" height="${h}" fill="${K()}"/>` +
      `<path fill="${P()}" stroke="${K()}" stroke-width=".8" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${P()}" stroke="${K()}" stroke-width=".9"/>`,
  },
}

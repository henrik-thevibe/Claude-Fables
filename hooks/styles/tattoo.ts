/**
 * Tattoo Flash, after the gallery's "Tattoo Flash: American traditional"
 * (index.html, style 14, `tattoo`).
 *
 * The art bible, translated from the gallery's flash sheet to the Fables' worlds:
 *
 * - Every scene is a sheet of flash: designs inked on aged, tea-stained paper,
 *   the price pencilled in the corner. Bold will hold: every shape carries a
 *   heavy black line, heavier toward the front, and is packed with one flat
 *   color from the shop's few inks: black, red, yellow, green, a tattoo blue,
 *   a brown, and the coral of Claude. There is no blend and no glow.
 * - Shade is black whip shading: the second-darkest tone of anything is its
 *   color flicked through with tapered black strokes; the darkest is solid black.
 * - The sky is the paper itself, colored the way a tattooer packs a
 *   background: a band of color along the top, whipped out into bare paper
 *   in a fringe of short, leaning whip flicks. Dawn is a clear blue band, dusk a navy one. Night is
 *   packed navy all the way down, black whipped in from the top, a paler blue
 *   (or the volcano's red) whipped up from the horizon.
 * - The sun is a flash sun: a yellow disc, its shadow side a darker yellow, a
 *   ring of red points, a white shine, and a sunburst of rays fanning across
 *   the paper behind it, yellow at dawn, red at sunset. The moon is a cream
 *   crescent; the Earth a blue globe with green continents and a whipped night side.
 * - Stars are flash stars: yellow, faceted, outlined. The bright ones are
 *   stars, the faint ones black dots on the paper (cream ones in a night
 *   sky), and the open paper is dotted with a few more, as a sheet is.
 * - Clouds and mist are flash clouds: scalloped cream banks under a black
 *   line, a second line echoing each lobe. Smoke and ash are a grey mass
 *   ringed by one black line, its puffs packed solid inside it.
 * - Land and rock: blue in the distance, green hills, brown earth, grey moon
 *   and stone, canyon red-browns in the desert, and a rust cinder cone with
 *   black gullies. Foliage and grass are the tattoo greens, packed a step
 *   darker under a night sky; a meadow's blades go black at their tips.
 * - Buildings are flat blues and greys, their lit windows yellow. Glass is
 *   tattoo blue, water and polished floors show no reflection.
 * - Fire is the plate's hot-rod flame: red tongues with yellow hearts under
 *   a black line, and the volcano's crater throws a crown of them that
 *   flicker. Lava runs packed red under a black line, an orange heart and a
 *   crawling yellow core down its middle. Lamps are yellow, their pools of light
 *   flat yellow on the ground; light falling through the air a faint yellow.
 * - Life and particles are small flat flicks of color.
 * - Claude is the plate's: a heavy black union outline, flat coral faces,
 *   black whip shading flicked in from each face's shadow edge, chunky white
 *   shines, black eyes with a white glint, and a crown of hot-rod flames
 *   along his back that flicker with time and turn with the body.
 * - The sheet: a black rule inside a paper margin, "#14" and "$40" pencilled
 *   on a slip of the paper in the corner, so the price reads over any sky;
 *   tea stains and a darkened rim over everything. The chapter is lettered
 *   in red on a cream banner with a rose at its end, fitted to the band; the
 *   caption is written on a cream scroll.
 */
import type { HeroPainter } from '../hero3d'
import { type Face, type Model, outlinedFaces, type P2 } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, num as n, poly, step, t1 } from '../art/ink'
import { mistBanks, tiled } from '../art/mist'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

/** The shop's inks, from the gallery's plate, with the blue, brown and grey the worlds need. */
const K = {
  ink: '#17110d',
  paper: '#efdcb2',
  pencil: '#5e5248',
  red: '#c62f1f',
  redD: '#8c1c11',
  orange: '#e2662a',
  yel: '#f2b52b',
  yelD: '#d38d14',
  yelL: '#f8d982',
  grn: '#3c7b33',
  grnD: '#25541f',
  grnL: '#79a64a',
  grnP: '#b7c57a',
  blu: '#2e6a9a',
  bluD: '#1d4166',
  bluL: '#6f9fc4',
  bluP: '#b4cbd2',
  navy: '#1f3657',
  navyD: '#141f36',
  brn: '#7a4a22',
  brnD: '#4b2c14',
  tan: '#b7834a',
  sand: '#ddb877',
  rust: '#a8452a',
  gry: '#5c5550',
  gryD: '#3d3834',
  gryL: '#8c847a',
  gryP: '#bdb3a2',
  cream: '#f8ecd1',
  creamD: '#dcc394',
  fold: '#b48f58',
  /** The faint brown crease along a banner's or scroll's lower edge. */
  crease: '#a06e32',
  white: '#fffaf0',
  coral: '#ea7b50',
  coralT: '#f5aa80',
  coralS: '#c95a36',
  coralB: '#a3452a',
  coralL: '#b9532f',
}
const SLAB = "Rockwell, 'Rockwell Nova', 'Roboto Slab', Clarendon, Georgia, serif"
const BLOCK = "Superclarendon, 'Rockwell Extra Bold', Rockwell, Clarendon, 'Big Caslon', Georgia, serif"

/** Whip shading: a color flicked through with black, defined once per color. */
const WHIPPED = [K.bluD, K.grnD, K.brnD, K.gryD, K.redD]
const W = (c: string) => `url(#tt-w-${c.slice(1)})`
/** The plain color under a whipped one, for what cannot be a pattern: lines, stops. */
const plain = (c: string) => (c.startsWith('url(#tt-w-') ? `#${c.slice(10, 16)}` : c)

/** The inks by what they color, dark to light; the second step of most is whip shaded. */
const RAMP = {
  blue: [K.ink, W(K.bluD), K.bluD, K.blu, K.bluL, K.bluP],
  green: [K.ink, W(K.grnD), K.grnD, K.grn, K.grnL, K.grnP],
  earth: [K.ink, W(K.brnD), K.brnD, K.brn, K.tan, K.sand],
  canyon: [K.ink, W(K.redD), K.redD, K.rust, K.tan, K.sand],
  /** The volcano's cone: rust and red-brown cinder, its gullies whipped black. */
  cinder: [K.ink, W(K.redD), K.redD, K.rust, K.rust, K.tan],
  stone: [K.ink, W(K.gryD), K.gry, K.gryL, K.gryP, K.creamD],
  warm: [K.ink, W(K.redD), K.redD, K.red, K.orange, K.yel, K.yelL],
  fire: [K.redD, K.red, K.orange, K.yel, K.yelL],
  lamp: [K.yelD, K.yel, K.yelL, K.cream],
  smoke: [K.gryD, K.gry, K.gryL, K.gryP, K.creamD],
  cloud: [K.gryL, K.gryP, K.creamD, K.cream],
}

/**
 * Which world is being painted, and whether under a night sky: the sky (or the
 * lab's wall) is painted first. Module state, reset for every stage by
 * `scenery()`; `world` is set by each element's role, `night` by the sky.
 */
let world = ''
let night = false

const brownish = (color: string) => {
  const c = color.replace('#', '')
  return c.length === 6 && parseInt(c.slice(0, 2), 16) > parseInt(c.slice(4, 6), 16) + 16
}

/** The ramp a lit color is packed from, by what it is and where. */
function rampFor(color: string, family: Family): readonly string[] {
  const warm = isWarm(color)
  const green = isGreen(color)
  switch (family) {
    case 'fire':
      return RAMP.fire
    case 'lamp':
      return warm || lum(color) > 0.55 ? RAMP.lamp : RAMP.blue
    case 'foliage':
    case 'grass':
      return RAMP.green
    case 'bark':
      return RAMP.earth
    case 'cloud':
    case 'air':
      return warm && lum(color) > 0.5 ? RAMP.lamp : world === 'volcano' ? RAMP.smoke : RAMP.cloud
    case 'land':
      if (world === 'night' || green) return RAMP.green
      if (world === 'space') return RAMP.stone
      if (world === 'volcano') return RAMP.canyon
      return warm || brownish(color) ? RAMP.earth : RAMP.blue
    case 'rock':
      if (world === 'desert') return RAMP.canyon
      if (world === 'volcano') return RAMP.cinder
      if (world === 'space') return RAMP.stone
      return warm || brownish(color) ? RAMP.earth : RAMP.stone
    case 'ground':
    case 'mark':
      if (world === 'desert' || world === 'volcano') return RAMP.earth
      if (world === 'space' || world === 'lab' || world === 'city') return RAMP.stone
      return green ? RAMP.green : warm || brownish(color) ? RAMP.earth : RAMP.stone
    case 'built':
      if (warm && lum(color) > 0.6) return RAMP.lamp
      if (green) return RAMP.green
      return warm || brownish(color) ? RAMP.earth : world === 'city' ? RAMP.blue : RAMP.stone
    case 'glass':
    case 'water':
      return warm ? RAMP.lamp : RAMP.blue
    case 'shadow':
      return [K.ink]
    case 'body':
    case 'beam':
    case 'glow':
      return RAMP.lamp
    case 'stars':
    case 'life':
      return warm ? RAMP.lamp : green ? RAMP.green : [K.cream]
    default:
      return warm ? RAMP.warm : green ? RAMP.green : RAMP.blue
  }
}

/** A lit color as the flash packs it: a flat ink, or its shade whipped through with black. */
function ink(color: string, family: Family, depth: number, attr: string): string {
  // Every line is the black of the outline, but the marks of light and sparks.
  if (attr === 'stroke' && family !== 'fire' && family !== 'lamp' && family !== 'stars' && family !== 'life') return K.ink
  const ramp = rampFor(color, family)
  // Lightness spread out, so the dim night scenes still use the whole of a ramp; far things one step paler.
  // Under the night sky the hills and grass are packed a step darker, so the meadow reads as night.
  const dim = night && world === 'night' && (family === 'land' || family === 'grass' || family === 'foliage') ? 0.82 : 1
  const t = Math.min(0.99, (Math.pow(lum(color), 0.75) * 1.12 + (depth < 0.25 ? 0.12 : 0)) * dim)
  const c = step(ramp, t)
  return attr === 'fill' ? c : plain(c)
}

const UNLINED: readonly Family[] = ['sky', 'air', 'beam', 'glow', 'stars', 'life', 'lens', 'water', 'lamp', 'shadow', 'cloud']

/** A small seeded sequence, so the same stage always comes out the same. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}
/** A fixed scatter in 0..1, for flicks drawn once. */
const hash = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
  return x - Math.floor(x)
}

// ---------------------------------------------------------------- sky

/** The fringe a packed band whips out into the paper, one tile of it, repeated across the stage. */
const FRINGE_W = 96
const fringe = (sw: number, y: number, color: string, up = false) => {
  let uses = ''
  for (let x = 0; x < sw; x += FRINGE_W) uses += `<use href="#tt-fringe" x="${x}"/>`
  return `<g fill="${color}" transform="translate(0 ${y})${up ? ' scale(1 -1)' : ''}">${uses}</g>`
}

/** Flash stars and black dots scattered over the open paper, as a sheet has between its designs. */
function decor(sw: number, top: number, bottom: number, dot: string): string {
  const rand = seeded(Math.round(sw) + 14)
  let stars = ''
  let dots = ''
  for (let i = 0; i < Math.round(sw / 110); i++) stars += `<use href="#tt-st${i % 3 ? '' : 'b'}" x="${t1(10 + rand() * (sw - 20))}" y="${t1(top + rand() * (bottom - top))}"/>`
  for (let i = 0; i < Math.round(sw / 55); i++) dots += `M${t1(6 + rand() * (sw - 12))} ${t1(top + rand() * (bottom - top))}h.01`
  return `<path d="${dots}" stroke="${dot}" stroke-width="1.5" stroke-linecap="round"/>${stars}`
}

/**
 * The sky: by day the paper, a band of color packed along the top and whipped
 * out into it; by night packed navy, black whipped in from the top and the
 * horizon's color whipped up from below.
 */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  const sw = c.meta.sw ?? 640
  night = lum(top) < 0.2 && lum(low) < 0.45
  if (night) {
    const deep = lum(low) < 0.12
    const horizon = isWarm(low) ? K.redD : deep ? '' : K.blu
    return (
      `<rect width="${sw}" height="128" fill="${deep || horizon === K.redD ? K.navyD : K.navy}"/>` +
      (horizon ? `<rect y="84" width="${sw}" height="44" fill="${horizon}"/>${fringe(sw, 84, horizon, true)}` : '') +
      `<rect width="${sw}" height="5" fill="${K.ink}"/>${fringe(sw, 5, K.ink)}`
    )
  }
  // Dawn packs a clear blue, dusk a navy deep enough to hold its stars.
  const dusk = world === 'city'
  const band = dusk ? 22 : 12
  return (
    `<rect width="${sw}" height="128" fill="${K.paper}"/>` +
    `<rect width="${sw}" height="${band}" fill="${dusk ? K.navy : K.blu}"/>${fringe(sw, band, dusk ? K.navy : K.blu)}` +
    decor(sw, band + 22, dusk ? 60 : 50, K.ink)
  )
}

/** Stars as flash stars: the faint ones dots, the bright ones stars, the twinkling ones larger stars that twinkle. */
function stars(svg: string, c: Ctx): string {
  const at = (attrs: string): [string, string][] =>
    [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1] ?? '0', m[2] ?? '0'])
  return svg
    .replace(/<ellipse\b[^>]*\/>/g, '')
    .replace(/\sfilter="[^"]*"/g, '')
    .replace(/<path\b([^>]*?)(\/?)>/g, (_all, attrs: string, close: string) => {
      const op = Number(/\sopacity="([\d.]+)"/.exec(attrs)?.[1] ?? 1)
      const pts = at(attrs)
      // The faint ones: dots, cream in the night sky.
      if (close && op < 0.5) {
        const d = pts.map(([x, y]) => `M${x} ${y}h.01`).join('')
        return `<path d="${d}" stroke="${night ? K.cream : K.ink}" stroke-opacity="${night ? 0.7 : 0.6}" stroke-width="1.3" stroke-linecap="round"/>`
      }
      const kept = attrs.replace(/\s(d|fill|stroke|stroke-width|opacity)="[^"]*"/g, '')
      const big = !close
      return `<g${kept}>${pts.map(([x, y]) => `<use href="#tt-st${big ? 'b' : ''}" x="${x}" y="${y}"/>`).join('')}${close ? '</g>' : ''}`
    })
    .replace(/<\/path>/g, '</g>')
}

// ---------------------------------------------------------------- sun, moon, earth

/** A star or ring of points round 0 0: `k` points from `r1` out to `r0`. */
function points(k: number, r0: number, r1: number, rot = -Math.PI / 2): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i < k * 2; i++) {
    const a = rot + (i * Math.PI) / k
    const r = i % 2 ? r1 : r0
    pts.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  return pts
}

/** The sunburst fanned across the paper behind the sun: alternate rays packed, red at sunset, yellow at dawn. */
function sunburst(cx: number, cy: number, sw: number, color: string): string {
  const R = sw * 1.2
  const k = 18
  let d = ''
  for (let i = 0; i < k; i++) {
    const a0 = (i * 2 * Math.PI) / k
    const a1 = a0 + Math.PI / k
    d += `M${n(cx)} ${n(cy)}L${n(cx + Math.cos(a0) * R)} ${n(cy + Math.sin(a0) * R)}L${n(cx + Math.cos(a1) * R)} ${n(cy + Math.sin(a1) * R)}z`
  }
  return `<path d="${d}" fill="${color}" opacity=".3" stroke="${K.ink}" stroke-opacity=".3" stroke-width=".5"/>`
}

/** The flash sun: a ring of red points, a yellow disc with its darker side, a white shine. */
function flashSun(cx: number, cy: number, r: number): string {
  const ring = poly(points(14, r * 1.5, r * 1.08), cx, cy)
  return (
    `<path d="${ring}" fill="${K.red}" stroke="${K.ink}" stroke-width=".9" stroke-linejoin="round"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${K.yelD}" stroke="${K.ink}" stroke-width="1.1"/>` +
    `<circle cx="${n(cx - r * 0.16)}" cy="${n(cy - r * 0.16)}" r="${n(r * 0.78)}" fill="${K.yel}"/>` +
    `<path d="M${n(cx - r * 0.62)} ${n(cy + r * 0.05)}A${n(r * 0.62)} ${n(r * 0.62)} 0 0 1 ${n(cx - r * 0.1)} ${n(cy - r * 0.6)}" fill="none" stroke="${K.white}" stroke-width="${n(Math.max(1, r * 0.13))}" stroke-linecap="round"/>`
  )
}

/** The moon as a cream crescent, outlined, its inner edge shaded and a shine on its back. */
function crescent(cx: number, cy: number, r: number): string {
  // The crescent is the moon's disc less a disc set over it to the upper right.
  const ox = r * 0.5
  const oy = -r * 0.22
  const r2 = r * 0.86
  const dd = Math.hypot(ox, oy)
  const a = (dd * dd + r * r - r2 * r2) / (2 * dd)
  const h = Math.sqrt(Math.max(0, r * r - a * a))
  const ux = ox / dd
  const uy = oy / dd
  const p1 = [cx + ux * a - uy * h, cy + uy * a + ux * h]
  const p2 = [cx + ux * a + uy * h, cy + uy * a - ux * h]
  const d = `M${n(p1[0]!)} ${n(p1[1]!)}A${n(r)} ${n(r)} 0 1 1 ${n(p2[0]!)} ${n(p2[1]!)}A${n(r2)} ${n(r2)} 0 0 0 ${n(p1[0]!)} ${n(p1[1]!)}z`
  return (
    `<path d="${d}" fill="${K.cream}" stroke="${K.ink}" stroke-width="1" stroke-linejoin="round"/>` +
    `<path d="M${n(cx - r * 0.72)} ${n(cy - r * 0.2)}A${n(r * 0.75)} ${n(r * 0.75)} 0 0 0 ${n(cx - r * 0.05)} ${n(cy + r * 0.72)}" fill="none" stroke="${K.white}" stroke-width="1.2" stroke-linecap="round"/>`
  )
}

/** The Earth as a flash globe: blue, green continents, its night side whipped, a white shine. */
function globe(cx: number, cy: number, r: number): string {
  const p = (x: number, y: number) => `${n(cx + x * r)} ${n(cy + y * r)}`
  const land =
    `M${p(-0.62, -0.42)}C${p(-0.4, -0.7)} ${p(-0.05, -0.62)} ${p(-0.12, -0.38)}C${p(-0.18, -0.15)} ${p(0.12, -0.08)} ${p(0.02, 0.18)}C${p(-0.1, 0.42)} ${p(-0.42, 0.3)} ${p(-0.48, 0.05)}C${p(-0.55, -0.12)} ${p(-0.8, -0.2)} ${p(-0.62, -0.42)}z` +
    `M${p(0.25, -0.72)}C${p(0.5, -0.78)} ${p(0.75, -0.5)} ${p(0.6, -0.3)}C${p(0.45, -0.12)} ${p(0.28, -0.35)} ${p(0.25, -0.72)}z` +
    `M${p(0.3, 0.3)}C${p(0.55, 0.2)} ${p(0.7, 0.45)} ${p(0.5, 0.62)}C${p(0.32, 0.72)} ${p(0.18, 0.5)} ${p(0.3, 0.3)}z`
  return (
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${K.blu}"/>` +
    `<path d="${land}" fill="${K.grn}" stroke="${K.ink}" stroke-width=".8" stroke-linejoin="round"/>` +
    `<path d="M${p(0.15, -0.99)}A${n(r)} ${n(r)} 0 0 1 ${p(0.15, 0.99)}A${n(r * 0.78)} ${n(r)} 0 0 0 ${p(0.15, -0.99)}z" fill="${W(K.bluD)}"/>` +
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${K.ink}" stroke-width="1.4"/>` +
    `<path d="M${p(-0.78, -0.2)}A${n(r * 0.8)} ${n(r * 0.8)} 0 0 1 ${p(-0.3, -0.72)}" fill="none" stroke="${K.white}" stroke-width="2" stroke-linecap="round"/>`
  )
}

// ---------------------------------------------------------------- clouds and mist

/** The rough extent of a path: its first point and how far it reaches either way. */
function extent(d: string): { x0: number; x1: number; y: number } | undefined {
  let x = 0
  let y = 0
  let x0 = Infinity
  let x1 = -Infinity
  let yb = -Infinity
  const re = /([MmLlQqCcHhVvZz])([^MmLlQqCcHhVvZz]*)/g
  for (const m of d.matchAll(re)) {
    const cmd = m[1] ?? ''
    const v = (m[2] ?? '').trim().split(/[\s,]+|(?=-)/).filter(Boolean).map(Number)
    const rel = cmd === cmd.toLowerCase()
    const per = /[mlMlL]/.test(cmd) ? 2 : /[qQ]/.test(cmd) ? 4 : /[cC]/.test(cmd) ? 6 : 1
    for (let i = 0; i + per <= v.length; i += per) {
      if (/[hH]/.test(cmd)) x = rel ? x + v[i]! : v[i]!
      else if (/[vV]/.test(cmd)) y = rel ? y + v[i]! : v[i]!
      else if (!/[zZ]/.test(cmd)) {
        const ex = v[i + per - 2]!
        const ey = v[i + per - 1]!
        x = rel ? x + ex : ex
        y = rel ? y + ey : ey
      }
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
      yb = Math.max(yb, y)
    }
  }
  return Number.isFinite(x0) ? { x0, x1, y: yb } : undefined
}

/** A flash cloud: a bank of scalloped lobes, rising toward its middle, on a flat underside. */
function puff(x: number, y: number, w: number): { d: string; echo: string } {
  const h = Math.max(4, Math.min(9, w * 0.08))
  const lobes = Math.max(3, Math.round(w / (h * 2.2)))
  const span = w / lobes
  let d = `M${t1(x)} ${t1(y)}`
  let echo = ''
  for (let k = 0; k < lobes; k++) {
    const mid = 1 - Math.abs((k + 0.5) / lobes - 0.5) * 1.3
    const rise = h * (0.5 + mid * 0.6)
    d += `a${t1(span / 2)} ${t1(rise)} 0 0 1 ${t1(span)} 0`
    const ex = x + k * span + span * 0.25
    echo += `M${t1(ex)} ${t1(y - rise * 0.35)}a${t1(span * 0.28)} ${t1(rise * 0.5)} 0 0 1 ${t1(span * 0.5)} ${t1(rise * 0.1)}`
  }
  d += `q${t1(-w / 2)} ${t1(h * 0.25)} ${t1(-w)} 0z`
  return { d, echo }
}

/** Clouds redrawn as flash clouds where the lit painting drew streaks: each streak's body becomes a bank. */
function clouds(svg: string, c: Ctx): string {
  const bodies = svg.split(/<g\b/).slice(1)
  let d = ''
  let echo = ''
  for (const g of bodies) {
    const first = /\sd="([^"]+)"/.exec(g)?.[1]
    const e = first ? extent(first) : undefined
    if (!e || e.x1 - e.x0 < 8) continue
    const p = puff(e.x0, e.y, e.x1 - e.x0)
    d += p.d
    echo += p.echo
  }
  if (!d) return c.repaint(svg)
  return (
    `<path d="${d}" fill="${night ? K.bluP : K.cream}" stroke="${K.ink}" stroke-width=".7" stroke-linejoin="round"/>` +
    `<path d="${echo}" fill="none" stroke="${K.ink}" stroke-width=".45" stroke-linecap="round"/>`
  )
}

/** Mist as banks of flash cloud lying across the scene, drifting as the mist they replace did. */
function mist(svg: string, c: Ctx): string {
  const y = c.meta.y ?? 80
  const h = c.meta.h ?? 12
  const sw = c.meta.sw ?? 640
  const banks = mistBanks({ w: Math.min(640, sw), y, h, seed: 14, rows: h < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true })
  const fill = night ? K.bluP : c.meta.veil ? K.creamD : K.cream
  const art =
    `<path fill="${fill}" stroke="${K.ink}" stroke-width=".55" stroke-linejoin="round" d="${banks.map(b => b.d).join('')}"/>` +
    `<path fill="none" stroke="${K.ink}" stroke-width=".35" d="${banks.map(b => b.echo).join('')}"/>`
  return `<g>${tiled(`tt-mist-${Math.round(y)}-${Math.round(h)}`, art, sw)}${c.motion(svg)}</g>`
}

/** Smoke as one outlined mass: the puffs in black, stroked wide, under the puffs themselves. */
function smoke(svg: string, c: Ctx): string {
  const art = c.repaint(svg)
  const under = art.replace(/\s(fill|stroke)="[^"]*"/g, '').replace(/\sopacity="[^"]*"/g, '')
  return `<g fill="${K.ink}" stroke="${K.ink}" stroke-width="1.6">${under}</g>${art}`
}

// ---------------------------------------------------------------- flames

/**
 * The plate's hot-rod flames, as a crown of tongues rooted along a line from
 * x = -6 to 6 (the body's width in model units), rising up (negative y) and
 * sweeping back toward -x. Each tongue flickers about its root.
 * r: root, d: direction, L: length, w: half-width, cu: the tip's curl.
 */
const FL = [
  { r: [-5.6, 2.2], d: [-1, -0.3], L: 10.4, w: 1.6, cu: 1.6 },
  { r: [-4.2, 0.6], d: [-0.86, -0.56], L: 13.2, w: 1.85, cu: 1.9 },
  { r: [-1.9, 0.1], d: [-0.7, -0.74], L: 14.4, w: 1.95, cu: 1.7 },
  { r: [0.8, 0], d: [-0.56, -0.84], L: 13, w: 1.85, cu: -1.5 },
  { r: [3.2, 0.1], d: [-0.42, -0.92], L: 10.6, w: 1.6, cu: -1.6 },
  { r: [5.1, 0.4], d: [-0.28, -0.96], L: 7.8, w: 1.3, cu: -1.3 },
] as const

/** One tongue, as a closed smooth path relative to its root: `sc` scales its length, `wk` its width. */
function tongue(i: number, sc: number, wk: number): string {
  const F = FL[i]!
  const N = 7
  const [dx, dy] = F.d
  const L = F.L * 0.5 * sc
  const ll = Math.hypot(dx, dy) || 1
  // The side the curl pushes toward: across the tongue's direction.
  const lx = -dy / ll
  const ly = dx / ll
  const sk: [number, number][] = []
  for (let k = 0; k <= N; k++) {
    const s = k / N
    const lat = Math.sin(s * Math.PI * 1.25 + i * 1.9) * s * 0.6 + F.cu * 0.7 * Math.pow(s, 2.2)
    sk.push([dx * L * s + lx * lat, dy * L * s + ly * lat])
  }
  const left: [number, number][] = []
  const right: [number, number][] = []
  for (let k = 0; k <= N; k++) {
    const a = sk[Math.max(0, k - 1)]!
    const b = sk[Math.min(N, k + 1)]!
    const tx = b[0] - a[0]
    const ty = b[1] - a[1]
    const tl = Math.hypot(tx, ty) || 1
    const s = k / N
    const hw = F.w * 0.62 * wk * Math.pow(1 - s, 1.05) * (0.8 + 0.6 * Math.sin(Math.PI * Math.min(1, s * 1.8)))
    const p = sk[k]!
    left.push([p[0] - (ty / tl) * hw, p[1] + (tx / tl) * hw])
    right.push([p[0] + (ty / tl) * hw, p[1] - (tx / tl) * hw])
  }
  return smooth(left.concat(right.reverse()))
}

/** A closed shape through points, rounded: quadratic curves between their midpoints. */
function smooth(pts: readonly [number, number][]): string {
  const m = (a: [number, number], b: [number, number]) => `${t1((a[0] + b[0]) / 2)} ${t1((a[1] + b[1]) / 2)}`
  const last = pts[pts.length - 1]!
  let d = `M${m(last, pts[0]!)}`
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!
    d += `Q${t1(p[0])} ${t1(p[1])} ${m(p, pts[(i + 1) % pts.length]!)}`
  }
  return d + 'z'
}

/** The crown of flames, defined once: red tongues with yellow hearts under a black line, each flickering about its root. */
function flameDefs(): string {
  let out = ''
  for (let i = FL.length - 1; i >= 0; i--) {
    const F = FL[i]!
    const dur = 0.7 + i * 0.11
    out +=
      `<g transform="translate(${F.r[0]} ${F.r[1]})"><g>` +
      `<path d="${tongue(i, 1, 1)}" fill="${K.red}"/><path d="${tongue(i, 0.74, 0.62)}" fill="${K.yel}" stroke="none"/>` +
      `<animateTransform attributeName="transform" type="skewX" values="0;${-6 - i};${3 + i * 0.5};0" dur="${n(dur)}s" begin="${n(-i * 0.37)}s" repeatCount="indefinite"/>` +
      (i % 2 ? '' : `<animateTransform attributeName="transform" type="scale" values="1;1.1;.92;1" dur="${n(dur * 1.3)}s" begin="${n(-i * 0.21)}s" repeatCount="indefinite" additive="sum"/>`) +
      `</g></g>`
  }
  return `<g id="tt-fire" stroke="${K.ink}" stroke-width=".28" stroke-linejoin="round">${out}</g>`
}

// ---------------------------------------------------------------- the scenery

/**
 * A run of flash lava along a course: a black line, packed red, an orange
 * heart and a yellow core whose dashes crawl down it. `w` 0 draws the heart alone.
 */
function lava(d: string, w: number, core = w * 0.45): string {
  if (!d) return ''
  const at = (width: number, color: string, more = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${n(width)}" stroke-linecap="round"${more}/>`
  return (
    (w ? at(w + 1.2, K.ink) + at(w, K.red) : '') +
    at(core, K.orange) +
    at(core * 0.45, K.yel, ` stroke-dasharray="5 3"><animate attributeName="stroke-dashoffset" values="0;-16" dur="2.4s" repeatCount="indefinite"/></path`)
  )
}

const scenery = (sw: number) => {
  world = ''
  night = false
  const p = painter(
    {
      ink,
      // A gradient packs as one flat ink at its overall color; a wash of light is not inked at all.
      url: (_id, family, attr, g) =>
        (g && meanOf(g).opacity < 0.5) || family === 'lamp' ? 'none' : ink(g ? meanOf(g).color : '#808080', family, 0.5, attr === 'stroke' ? 'stroke' : 'fill'),
      line: (family, depth) =>
        UNLINED.includes(family) ? '' : `stroke="${K.ink}" stroke-width="${n(family === 'fire' ? 0.35 : 0.3 + depth * 0.85)}" stroke-linejoin="round"`,
      // Flash is packed solid: what the lit painting half shows is inked whole, and its faint washes left out.
      opacity: (family, v) => (family === 'stars' || family === 'life' || family === 'beam' ? v : v >= 0.45 ? 1 : v),
      lineless: 0.6,
      faint: 'hide',
      // A pool of lamplight is flat yellow on the ground, a brighter heart within.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${K.yelL}" opacity=".4"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.55)}" ry="${n(e.ry * 0.55)}" fill="${K.yel}" opacity=".45"/>`,
      redraw: {
        sky,
        stars,
        lens: () => '',
        glow: () => '',
        water: () => '',
        'night.crest': () => '',
        air: mist,
        'forest.clouds': clouds,
        'city.clouds': clouds,
        'desert.clouds': clouds,
        'night.clouds': clouds,
        beam: (svg, c) => `<g opacity=".25">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${K.yelL}"`)}</g>`,
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return globe(cx, cy, r)
          if (c.role === 'night.moon') return crescent(cx, cy, r * 1.25)
          if (c.meta.part === 'halo') return sunburst(cx, cy, sw, world === 'desert' ? K.red : K.yel)
          return flashSun(cx, cy, r * (world === 'desert' ? 1.25 : 1.5))
        },
        // Smoke is one flash cloud: its puffs drawn once in black and stroked wide beneath, so one line rings the mass.
        'volcano.puffs': smoke,
        'volcano.ash': smoke,
        // The crater throws a crown of hot-rod flames.
        'volcano.crater': (svg, c) =>
          `<use href="#tt-fire" transform="matrix(2.4 0 0 2.4 ${n((c.meta.cx ?? 0) + 3)} ${n((c.meta.cy ?? 0) + 1)})"/>` + c.repaint(svg),
        // Lava is packed red under a black line, a yellow heart running down it.
        'volcano.lava': (_svg, c) => lava(String(c.meta.d ?? ''), 3.4),
        'volcano.stream': (_svg, c) =>
          `<path d="${String(c.meta.ribbon ?? '')}" fill="${K.red}" stroke="${K.ink}" stroke-width="1.1" stroke-linejoin="round"/>` + lava(String(c.meta.d ?? ''), 0, 2.6),
      },
    },
    'tt',
  )
  return {
    el: (role: Parameters<typeof p.el>[0], svg: string, meta?: Parameters<typeof p.el>[2]) => {
      world = role.split('.')[0] ?? ''
      return p.el(role, svg, meta)
    },
    defs: p.defs,
  }
}

// ---------------------------------------------------------------- Claude

/** A point on a face, `u` across from its first corner, `v` up from its first edge. */
function at(f: Face, u: number, v: number): P2 {
  const [a, b, c, d] = f.pts as [P2, P2, P2, P2]
  const lo: P2 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
  const hi: P2 = [d[0] + (c[0] - d[0]) * u, d[1] + (c[1] - d[1]) * u]
  return [lo[0] + (hi[0] - lo[0]) * v, lo[1] + (hi[1] - lo[1]) * v]
}

/**
 * Each face's ink and its whip shading, after the gallery's `whip`: a pattern
 * stretched over the face's box, a solid band along its shadow edge breaking
 * into tapered black flicks. One path a face, the flicks drawn once.
 * `len` is how far into the face the shading reaches (1 = across it, the band
 * itself 18% of that), `n` how many flicks span the edge, `seed` their scatter.
 */
type Edge = 'b' | 't' | 'l' | 'r'
function whip(id: string, base: string, edges: { e: Edge; len: number; n: number; seed: number }[]): string {
  let d = ''
  for (const { e, len, n: count, seed } of edges) {
    const band = len * 18
    const step = 100 / count
    const w = step * 0.8
    // The band, then each flick from inside the band out to its own length.
    const along = (q: number, depth: number): [number, number] => {
      switch (e) {
        case 'b':
          return [q, 100 - depth]
        case 't':
          return [q, depth]
        case 'l':
          return [depth, q]
        case 'r':
          return [100 - depth, q]
      }
    }
    const rect = [along(0, 0), along(100, 0), along(100, band), along(0, band)]
    d += `M${rect.map(p => `${t1(p[0])} ${t1(p[1])}`).join('L')}z`
    for (let i = 0; i < count; i++) {
      const q = (i + 0.5) * step
      const l = len * 100 * (0.18 + 0.82 * (0.25 + 0.75 * hash(i, seed)))
      const s0 = along(q - w / 2, band * 0.6)
      const s1 = along(q + w / 2, band * 0.6)
      const tip = along(q + (hash(i, seed + 3) - 0.5) * w, l)
      d += `M${t1(s0[0])} ${t1(s0[1])}L${t1(tip[0])} ${t1(tip[1])}L${t1(s1[0])} ${t1(s1[1])}z`
    }
  }
  return `<pattern id="${id}" viewBox="0 0 100 100" preserveAspectRatio="none" width="1" height="1"><rect width="100" height="100" fill="${base}"/><path d="${d}" fill="${K.ink}"/></pattern>`
}

/*
 * Calibrated against the model's faces as drawn at stage scale: the body's
 * front is about 12 model units wide, so 18 flicks along its bottom keep each
 * flick under a stage unit wide, and its sides (narrower in view) take 8; an
 * arm's or leg's face is 2 to 3 units across, so 3 to 5 flicks. The sides and
 * legs whip nearly across (.85 to 1) as the gallery's dark sides do; the lit
 * front only a short fringe (.2) along its foot.
 */
const FACE_PATTERNS =
  whip('tt-bF', K.coral, [{ e: 'b', len: 0.2, n: 18, seed: 1 }]) +
  whip('tt-bL', K.coralS, [{ e: 'l', len: 0.85, n: 8, seed: 3 }, { e: 'b', len: 0.3, n: 7, seed: 4 }]) +
  whip('tt-bR', K.coralS, [{ e: 'r', len: 0.85, n: 8, seed: 5 }, { e: 'b', len: 0.3, n: 7, seed: 6 }]) +
  whip('tt-bB', K.coralB, [{ e: 't', len: 0.9, n: 12, seed: 7 }]) +
  whip('tt-aF', K.coral, [{ e: 'b', len: 0.5, n: 5, seed: 8 }]) +
  whip('tt-aS', K.coralS, [{ e: 'b', len: 0.7, n: 5, seed: 9 }]) +
  whip('tt-lF', K.coral, [{ e: 'b', len: 0.55, n: 3, seed: 10 }]) +
  whip('tt-lL', K.coralL, [{ e: 'l', len: 1, n: 4, seed: 11 }]) +
  whip('tt-lR', K.coralL, [{ e: 'r', len: 1, n: 4, seed: 12 }])

function faceFill(f: Face): string {
  const side = f.name === 'left' ? 'L' : 'R'
  if (f.part === 'leg') return f.name === 'front' || f.name === 'back' ? 'url(#tt-lF)' : f.name === 'bottom' ? K.ink : `url(#tt-l${side})`
  if (f.part === 'arm') return f.name === 'top' ? K.coralT : f.name === 'front' || f.name === 'back' ? 'url(#tt-aF)' : f.name === 'bottom' ? 'url(#tt-bB)' : 'url(#tt-aS)'
  return f.name === 'top' ? K.coralT : f.name === 'front' || f.name === 'back' ? 'url(#tt-bF)' : f.name === 'bottom' ? 'url(#tt-bB)' : `url(#tt-b${side})`
}

/**
 * The crown of flames along Claude's back: the shared crown, mapped onto the
 * body's top back edge (x across it, up along the body's height), and
 * mirrored when he faces left, so the flames always stream behind him.
 */
function crown(m: Model, cx: number, floor: number): string {
  const body = m.parts.find(p => p.name === 'body')
  if (!body) return ''
  const face = (name: string) => body.faces.find(f => f.name === name)
  const top = face('top')
  const back = face('back')
  const front = face('front')
  const left = face('left')
  const right = face('right')
  const edge = top ? [top.pts[3], top.pts[2]] : back ? [back.pts[2], back.pts[3]] : front ? [front.pts[3], front.pts[2]] : undefined
  const a = edge?.[0]
  const b = edge?.[1]
  if (!a || !b) return ''
  const v = (p?: P2, q?: P2): P2 | undefined => (p && q ? [q[0] - p[0], q[1] - p[1]] : undefined)
  const up =
    (front && v(front.pts[0], front.pts[3])) ?? (back && v(back.pts[1], back.pts[2])) ?? (left && v(left.pts[0], left.pts[3])) ?? (right && v(right.pts[1], right.pts[2])) ?? [0, -27]
  // Facing left the body shows its right side: the crown is mirrored to stream the other way.
  const k = right && !left ? -1 : 1
  // The crown's x runs -6..6 across the body's 12-unit width, so the back edge over 12 maps it;
  // its tongues stand about 7.4 units tall at full flicker, so the body's height over 7.4 makes
  // the flames as tall as the body, as on the plate.
  const ex = ((b[0] - a[0]) / 12) * k
  const ey = ((b[1] - a[1]) / 12) * k
  const ux = up[0] / 7.4
  const uy = up[1] / 7.4
  return `<use href="#tt-fire" transform="matrix(${n(ex)} ${n(ey)} ${n(-ux)} ${n(-uy)} ${n((a[0] + b[0]) / 2 + cx)} ${n((a[1] + b[1]) / 2 + floor)})"/>`
}

/** Claude as the gallery's flash: flames behind, a heavy union outline, whipped coral faces, white shines. */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  const faces = outlinedFaces(m)
  let paths = ''
  let shine = ''
  const line = (f: Face, pts: [number, number][]) =>
    pts.map(([u, v], i) => {
      const q = at(f, u, v)
      return `${i ? 'L' : 'M'}${t1(q[0] + cx)} ${t1(q[1] + floor)}`
    }).join('')
  for (const f of faces) {
    paths += `<path fill="${faceFill(f)}" d="${poly(f.pts, cx, floor)}"/>`
    // Chunky white shines: a stroke and a dot on the lit faces.
    const faceOn = f.name === 'front' || f.name === 'back'
    if (f.part === 'body' && faceOn) shine += line(f, [[0.075, 0.83], [0.075, 0.56]]) + line(f, [[0.075, 0.42], [0.076, 0.42]])
    else if (f.part === 'body' && f.name === 'top') shine += line(f, [[0.1, 0.3], [0.34, 0.3]])
    else if (f.part === 'arm' && faceOn) shine += line(f, [[0.32, 0.68], [0.33, 0.68]])
  }
  // The eyes: one black path for both, their glints dots in the shine's own stroke.
  let pupils = ''
  let closed = ''
  for (const e of m.eyes) {
    if (e.poly) {
      pupils += poly(e.poly, cx, floor)
      shine += `M${t1((e.poly[3]?.[0] ?? 0) + cx - 0.2)} ${t1((e.poly[3]?.[1] ?? 0) + floor + 0.7)}h.01`
    } else closed += poly(e.line ?? [], cx, floor, false)
  }
  const eyes =
    (pupils ? `<path fill="${K.ink}" d="${pupils}"/>` : '') +
    (closed ? `<path fill="none" stroke="${K.ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="${closed}"/>` : '')
  return (
    `<path fill="${K.ink}" opacity=".3" d="${poly(m.shadow, cx, floor)}"/>` +
    crown(m, cx, floor) +
    // The union outline: every part's hull stroked wide in black under the faces, one group's line for both.
    `<g stroke="${K.ink}" stroke-linejoin="round"><path fill="${K.ink}" stroke-width="2.4" d="${hulls}"/>` +
    `<g stroke-width=".6">${paths}</g></g>` +
    eyes +
    (shine ? `<path d="${shine}" fill="none" stroke="${K.white}" stroke-width="1.1" stroke-linecap="round"/>` : '')
  )
}

// ---------------------------------------------------------------- the sheet

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The pencilled marks in the corner, as pen strokes after the gallery's glyphs. */
const ell = (cx: number, cy: number, rx: number, ry: number, a0: number, turns: number, k: number): [number, number][] =>
  Array.from({ length: k + 1 }, (_, i) => {
    const a = a0 + (turns * 2 * Math.PI * i) / k
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as [number, number]
  })
const GL: Record<string, { w: number; s: [number, number][][] }> = {
  '#': { w: 1, s: [[[0.4, 0.06], [0.27, 1.34]], [[0.84, 0.06], [0.71, 1.34]], [[0.05, 0.47], [1.03, 0.47]], [[0, 0.93], [0.97, 0.93]]] },
  '1': { w: 0.6, s: [[[0.06, 0.36], [0.45, 0.04], [0.45, 1.38]]] },
  '4': { w: 0.96, s: [[[0.72, 1.38], [0.72, 0.04], [0.03, 0.98], [0.99, 0.98]]] },
  '0': { w: 0.9, s: [ell(0.45, 0.71, 0.41, 0.66, -Math.PI / 2 - 0.3, 1.07, 16)] },
  $: {
    w: 0.9,
    s: [
      [[0.84, 0.3], [0.68, 0.14], [0.44, 0.1], [0.2, 0.18], [0.13, 0.38], [0.3, 0.57], [0.56, 0.68], [0.8, 0.82], [0.86, 1.04], [0.72, 1.22], [0.46, 1.27], [0.2, 1.2], [0.07, 1.03]],
      [[0.47, -0.12], [0.47, 1.5]],
    ],
  },
}
function pencil(text: string, x: number, y: number, sc: number): string {
  let d = ''
  let cx = x
  for (const ch of text) {
    const g = GL[ch]
    if (!g) {
      cx += 0.6 * sc
      continue
    }
    for (const st of g.s) d += st.map((p, i) => `${i ? 'L' : 'M'}${t1(cx + p[0] * sc)} ${t1(y + p[1] * sc)}`).join('')
    cx += (g.w + 0.3) * sc
  }
  return d
}
const pencilWidth = (text: string, sc: number) => [...text].reduce((w, ch) => w + ((GL[ch]?.w ?? 0.3) + 0.3) * sc, -0.3 * sc)

/** A leaf of the rose: green, its far half darker, a midrib, all outlined. */
function leaf(x: number, y: number, L: number, ang: number, flip: boolean): string {
  const ux = Math.cos(ang)
  const uy = Math.sin(ang)
  const w = L * 0.4
  const tx = x + ux * L
  const ty = y + uy * L
  const A = [x + ux * L * 0.45 - uy * w, y + uy * L * 0.45 + ux * w]
  const B = [x + ux * L * 0.55 + uy * w, y + uy * L * 0.55 - ux * w]
  const S = flip ? A : B
  return (
    `<path d="M${n(x)} ${n(y)}Q${n(A[0]!)} ${n(A[1]!)} ${n(tx)} ${n(ty)}Q${n(B[0]!)} ${n(B[1]!)} ${n(x)} ${n(y)}z" fill="${K.grn}"/>` +
    `<path d="M${n(x)} ${n(y)}L${n(tx)} ${n(ty)}Q${n((S[0]! + tx) / 2)} ${n((S[1]! + ty) / 2)} ${n(S[0]!)} ${n(S[1]!)}z" fill="${K.grnD}" stroke="none"/>` +
    `<path d="M${n(x)} ${n(y)}Q${n(A[0]!)} ${n(A[1]!)} ${n(tx)} ${n(ty)}Q${n(B[0]!)} ${n(B[1]!)} ${n(x)} ${n(y)}zM${n(x + ux * L * 0.1)} ${n(y + uy * L * 0.1)}L${n(x + ux * L * 0.85)} ${n(y + uy * L * 0.85)}" fill="none"/>`
  )
}

/** The plate's rose: two leaves, a red bloom darker on its shadow side, a spiral heart, petal edges and a shine. */
function rose(x: number, y: number, r: number): string {
  const bloom: [number, number][] = []
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    const k = 0.88 + 0.12 * Math.abs(Math.cos(a * 2.5 + 0.5))
    bloom.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.93])
  }
  let spiral = ''
  for (let i = 0; i <= 16; i++) {
    const k = i / 16
    const a = -Math.PI * 0.2 + k * Math.PI * 2 * 1.3
    const rr = r * (0.1 + 0.42 * k)
    spiral += `${i ? 'L' : 'M'}${n(x + Math.cos(a) * rr)} ${n(y - r * 0.08 + Math.sin(a) * rr * 0.8)}`
  }
  const arc = (a0: number, a1: number, rr: number) =>
    `M${n(x + Math.cos(a0) * r * rr)} ${n(y + Math.sin(a0) * r * rr)}A${n(r * rr)} ${n(r * rr)} 0 0 1 ${n(x + Math.cos(a1) * r * rr)} ${n(y + Math.sin(a1) * r * rr)}`
  const petals = arc(Math.PI * 0.15, Math.PI * 0.75, 0.72) + arc(Math.PI * 0.85, Math.PI * 1.35, 0.7) + arc(Math.PI * 1.5, Math.PI * 1.95, 0.74)
  return (
    `<g stroke="${K.ink}" stroke-width=".7" stroke-linejoin="round" stroke-linecap="round">` +
    leaf(x - r * 0.5, y + r * 0.55, r * 1.25, Math.PI * 0.8, true) +
    leaf(x + r * 0.55, y + r * 0.5, r * 1.15, Math.PI * 0.17, false) +
    `<path d="${smooth(bloom)}" fill="${K.redD}" stroke-width=".9"/>` +
    `<circle cx="${n(x - r * 0.14)}" cy="${n(y - r * 0.16)}" r="${n(r * 0.74)}" fill="${K.red}" stroke="none"/>` +
    `<path d="${spiral}${petals}" fill="none" stroke-width=".55"/>` +
    `<path d="${arc(Math.PI * 1.12, Math.PI * 1.38, 0.55)}" fill="none" stroke="${K.white}" stroke-width=".7"/>` +
    `</g>`
  )
}

/**
 * A banner of the plate's kind: a cream band, its two ends folded behind with
 * swallowtail notches, the fold shadowed, all under a black line. `endsOnly`
 * draws just the folded ends, for a scroll that draws its own band.
 */
function banner(x: number, y: number, w: number, h: number, drop: number, reach: number, endsOnly = false): string {
  const end = (sg: 1 | -1) => {
    const ex = sg < 0 ? x : x + w
    const o = sg * reach
    const tail = [[ex - sg * 5, y + drop], [ex + o, y + drop], [ex + o - sg * 3.5, y + drop + h / 2], [ex + o, y + h + drop], [ex - sg * 5, y + h + drop]]
    const fold = [[ex, y + h], [ex - sg * 5, y + h], [ex - sg * 5, y + h + drop]]
    return (
      `<path d="M${tail.map(p => `${n(p[0]!)} ${n(p[1]!)}`).join('L')}z" fill="${K.creamD}"/>` +
      `<path d="M${fold.map(p => `${n(p[0]!)} ${n(p[1]!)}`).join('L')}z" fill="${K.fold}"/>`
    )
  }
  const ends = `<g stroke="${K.ink}" stroke-width="1" stroke-linejoin="round">${end(-1)}${end(1)}`
  if (endsOnly) return `${ends}</g>`
  return (
    ends +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${K.cream}"/></g>` +
    `<path d="M${n(x + 1.5)} ${n(y + h - 1.5)}H${n(x + w - 1.5)}" stroke="${K.crease}" stroke-opacity=".3" stroke-width="2.4"/>`
  )
}

export const TATTOO: Look = {
  name: 'tattoo',
  label: 'Tattoo Flash',
  voice: 'an old-school American traditional tattoo flash sheet, bold and brash',
  cell: 'solid',
  figure: '3d',
  font: SLAB,
  charW: 5.1,
  caption: { fill: K.cream, stroke: K.ink, ink: K.ink, radius: 2 },
  paper: { card: K.cream, ink: K.ink, kinds: { code: '#1d4f86', path: '#1d4f86', fn: '#7a3a12', num: '#b3261b', bad: '#b3261b', good: '#2f6a28', face: '#b3261b' } },
  inset: 4,
  titleColor: K.ink,
  art: {
    painter: scenery,
    hero,
    sky: K.paper,
    ground: K.brn,
    defs: () => {
      // The fringe a packed band whips out into the paper: a strip, and flicks of many lengths below it.
      let fr = `M0 -3h${FRINGE_W}v3.2H0z`
      for (let i = 0; i < FRINGE_W / 3.5; i++) {
        const x = i * 3.5 + (hash(i, 21) - 0.5) * 1.4
        const L = 2 + 5 * Math.pow(hash(i, 22), 1.8)
        const w = 1.1 + hash(i, 23) * 0.6
        const lean = L * 0.35
        // A whip flick: struck from the band, curving one way as the needle is whipped out, tapering to a hair.
        fr += `M${t1(x)} 0q.2 ${t1(L * 0.6)} ${t1(lean)} ${t1(L)}q${t1(w - lean)} ${t1(-L * 0.5)} ${t1(w - lean)} ${t1(-L)}z`
      }
      // A flash star: yellow, its facets darker on alternate sides, outlined.
      const P = points(5, 2.3, 1.08)
      let facets = ''
      for (let i = 0; i < 10; i += 2) facets += `M0 0L${t1(P[i]![0])} ${t1(P[i]![1])}L${t1(P[i + 1]![0])} ${t1(P[i + 1]![1])}z`
      return (
        `<path id="tt-fringe" d="${fr}"/>` +
        `<g id="tt-st"><path d="${poly(P)}" fill="${K.yel}"/><path d="${facets}" fill="${K.yelD}"/><path d="${poly(P)}" fill="none" stroke="${K.ink}" stroke-width=".55" stroke-linejoin="round"/></g>` +
        `<use id="tt-stb" href="#tt-st" transform="scale(1.55)"/>` +
        WHIPPED.map(
          c =>
            `<pattern id="tt-w-${c.slice(1)}" width="3.2" height="5.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">` +
            `<rect width="3.2" height="5.6" fill="${c}"/><path d="M0 0h1.2L.6 4.4zM1.6 2.8h1.1l-.55 2.8zM1.6 0h1.1l-.55 1.2z" fill="${K.ink}"/></pattern>`,
        ).join('') +
        FACE_PATTERNS +
        flameDefs() +
        // Tea stains, their rims darker; the paper's fibres; the sheet's rim darkened.
        `<filter id="tt-tea" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .03" numOctaves="3" seed="14"/>` +
        `<feColorMatrix values="0 0 0 0 .36  0 0 0 0 .22  0 0 0 0 .07  0 0 0 1 0"/>` +
        `<feComponentTransfer><feFuncA type="table" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 .08 .3 .16 .14 .14 .14 .14 .14 .14 .14 .14 .14 .14"/></feComponentTransfer></filter>` +
        `<filter id="tt-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/>` +
        `<feColorMatrix values="0 0 0 0 .38  0 0 0 0 .25  0 0 0 0 .1  -1.5 0 0 0 .9"/></filter>` +
        `<radialGradient id="tt-rim" cx=".5" cy=".5" r=".72"><stop offset=".6" stop-color="#6e4619" stop-opacity="0"/><stop offset="1" stop-color="#6e4619" stop-opacity=".32"/></radialGradient>`
      )
    },
    under: (sw, h) => `<rect width="${sw}" height="${h}" fill="${K.paper}"/>`,
  },
  texture: (sw, h) =>
    `<rect width="${sw}" height="${h}" filter="url(#tt-tea)" opacity=".55"/>` +
    `<rect width="${sw}" height="${h}" filter="url(#tt-grain)" opacity=".16"/>` +
    `<rect width="${sw}" height="${h}" fill="url(#tt-rim)"/>`,
  // The sheet: a paper margin, a black rule, and the number and price pencilled in the corner.
  frame: (sw, h) => {
    const price = `#14  $40`
    const px = sw - 10 - pencilWidth(price, 5.2)
    return (
      `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${K.paper}" stroke-width="3"/>` +
      `<rect x="3.6" y="3.6" width="${sw - 7.2}" height="${h - 7.2}" fill="none" stroke="${K.ink}" stroke-width="1.3"/>` +
      // A slip of the sheet's paper under the price, so it reads over any sky or foliage.
      `<rect x="${n(px - 3)}" y="6" width="${n(pencilWidth(price, 5.2) + 6)}" height="12" fill="${K.paper}" stroke="${K.ink}" stroke-width=".6"/>` +
      `<path d="${pencil(price, px, 8.5, 5.2)}" fill="none" stroke="${K.pencil}" stroke-width=".85" stroke-linecap="round" stroke-linejoin="round"/>`
    )
  },
  // The chapter lettered in red on a cream banner, a black keyline and a hard drop shadow, with the plate's rose at its end.
  tag: (text, inset) => {
    const t = escape(text.toUpperCase())
    const x = inset + 4
    const y = inset + 3
    const bx = x + 15
    // The 8px block letters at weight 900 run about 7.2 units a capital; the lettering is
    // then fitted to the band exactly, so whatever face the reader has, it ends inside it.
    const bw = text.length * 7.2 + 14
    const by = y + 3
    const word = (dx: number, dy: number, attrs: string) =>
      `<text x="${n(bx + 7 + dx)}" y="${n(by + 9.2 + dy)}" font-family="${BLOCK}" font-size="8" font-weight="900" letter-spacing=".5" textLength="${n(bw - 14)}" lengthAdjust="spacingAndGlyphs" ${attrs}>${t}</text>`
    return {
      svg:
        banner(bx, by, bw, 12, 3.5, 6) +
        word(0.6, 0.7, `fill="${K.ink}" stroke="${K.ink}" stroke-width="1"`) +
        word(0, 0, `fill="${K.red}" stroke="${K.ink}" stroke-width=".9" paint-order="stroke"`) +
        `<circle cx="${n(bx + 3.4)}" cy="${n(by + 6)}" r=".8" fill="${K.ink}"/><circle cx="${n(bx + bw - 3.4)}" cy="${n(by + 6)}" r=".8" fill="${K.ink}"/>` +
        rose(x + 8, y + 9, 6.5),
      w: bx + bw + 10,
      h: by + 19,
    }
  },
  bubble: {
    font: SLAB,
    size: 9,
    charW: 5.1,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A cream scroll: its ends folded behind at the top, a hard black shadow, a black line, and a pointer to Claude.
      banner(x, y - 3, w, 10, 6, 6, true) +
      `<rect x="${n(x + 1.4)}" y="${n(y + 1.6)}" width="${w}" height="${h}" fill="${K.ink}"/>` +
      `<path fill="${K.cream}" stroke="${K.ink}" stroke-width="1.2" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${K.cream}" stroke="${K.ink}" stroke-width="1.3"/>` +
      `<path d="M${n(x + 2)} ${n(y + h - 1.6)}H${n(x + w - 2)}" stroke="${K.crease}" stroke-opacity=".25" stroke-width="2"/>`,
  },
}

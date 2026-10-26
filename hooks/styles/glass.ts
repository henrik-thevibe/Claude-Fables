/**
 * Stained Glass, after the gallery's "Stained Glass: Gothic lancet, c. 1220"
 * (henrik-styles.js, style 32, `sglass`).
 *
 * The art bible, translated from the gallery's lancet to the Fables' worlds:
 *
 * - The whole scene is a window of pot-metal glass: every shape is a piece of
 *   one colored glass, cut and set in lead. The lead is a near-black line
 *   round every piece, wider on the nearer pieces; nothing is drawn as light,
 *   since the light is what shines through. A lit gradient is the glazier's
 *   choice of a paler or a deeper sheet, not a blend.
 * - The glass is the thirteenth century's: cobalt blue, ruby, a silver-stain
 *   gold, an emerald and an olive green, murrey purple, an amber for earth and
 *   wood, and a greenish white glass for stone and cloud. The lit scenes are
 *   dim; glass is luminous, so every piece is cut a sheet lighter and fuller.
 * - Skies are the gallery's: a field of small irregular panes, each its own
 *   shade of the sky's glass, all leaded, with here and there a ruby or a gold
 *   jewel, as in the lancet's blue ground. Ground, hills and meadows are cut
 *   into panes the same way, without the jewels. Distance is murrey and pale.
 * - The sun is a gold disc in a crown of ruby and gold rays, turning slowly;
 *   the moon a disc of white glass with a crescent cut in grey; the Earth a
 *   blue roundel with a green land and a white cloud. Stars are gold
 *   quatrefoils and white glass pearls, each leaded.
 * - Clouds are pale white glass, leaded. Mist lies in banks of opalescent
 *   white glass, their scalloped tops leaded. Light falling through the air is
 *   a few rays of pale gold glass; a glow is a sheet of gold or ruby laid thin.
 * - Foliage and grass are greens, bark and wood amber, rock and buildings the
 *   white and murrey glasses, fire and lava ruby and gold, lamps and lit
 *   windows gold. Water and wet floors show no reflection: glass is set flat.
 *   Fine marks (ruts, ripples, pits) are grisaille, the glass painter's brown.
 * - Night is the same window after dusk: deep cobalt and murrey, the panes
 *   still lit from behind, the stars gold.
 * - Claude is the gallery's: coral glass, each face cut into pieces of its own
 *   shade (the front in four, the sides and top in two) and leaded, his
 *   outline a broad lead came, his eyes deep violet glass with a pale glint.
 * - The window is set in an ashlar wall: grey stones round the stage, a ruby
 *   fillet strung with white pearls, an iron saddle bar across the glass. The
 *   light through it swells at the middle, and now and then a passing cloud
 *   dims it. The chapter is the lancet's inscription band, murrey glass with
 *   cream capitals; the caption is a banderole of white glass, leaded.
 */
import type { HeroPainter } from '../hero3d'
import { type Face, type Model, outlinedFaces, type P2 } from '../clawd3d'
import { isGreen, isWarm, lum, meanOf, mix, num as n, poly, step, t1 } from '../art/ink'
import { MIST_TILE, mistBanks, tiled } from '../art/mist'
import { painter, type Ctx } from '../art/painter'
import type { Family } from '../art/roles'
import type { Look } from '../looks'

const LEAD = '#151317'
const P = {
  cream: '#f4e7c8',
  murrey: '#4c2a6c',
  ruby: '#a8202e',
  frame: '#7c1a26',
  gold: '#f4c542',
  pearl: '#efeadb',
  white: '#f2eedc',
  eye: '#1d1236',
  grisaille: '#2e1c14',
}
/** Claude's glass, the gallery's. */
const GL = { top: '#f3a15e', front: '#e0632f', side: '#a63422', leg: '#c9532a', legDark: '#8e2c1d' }
const SERIF = "'Big Caslon', 'Libre Caslon Text', 'Adobe Caslon Pro', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif"

/** The glazier's sheets, dark to light, by color. */
const G = {
  blue: ['#101c52', '#1a2f80', '#2546a6', '#3a64c6', '#6a92da', '#a6c2ec'],
  nightBlue: ['#0e1640', '#16225e', '#1f3080', '#2c44a0', '#4a64bc', '#7e96d6'],
  ruby: ['#4a0c16', '#7c1a26', P.ruby, '#cc3434', '#e46a52', '#f2a07a'],
  gold: ['#8a5410', '#b8801c', '#dca42a', P.gold, '#f8dc80', '#fbf0c4'],
  dawn: ['#7c1a26', '#b8402e', '#dc7a3e', '#eea85a', '#f6d08a', '#fbeccc'],
  green: ['#102e1c', '#1a4826', '#276a30', '#3e8a38', '#72a84a', '#aac878'],
  murrey: ['#22123a', '#3a1f5a', P.murrey, '#6e4892', '#9a78bc', '#c8b0dc'],
  white: ['#3e4650', '#5e6a72', '#8a9a9e', '#b4c4c0', '#d8e2d8', P.white],
  amber: ['#3a1e0c', '#5e3214', '#8a5020', '#b4783a', '#d6a464', '#ecd09c'],
  slate: ['#1a1a40', '#28295a', '#3a3c7a', '#575a9a', '#8586bc', '#bcbade'],
  fire: ['#5a0c12', P.frame, P.ruby, '#dc4a2a', '#f08a2a', P.gold, '#fbe8a0'],
}

/** Glass is luminous: the dim lit scenes are cut a sheet lighter. */
const lift = (l: number) => Math.min(1, Math.pow(l, 0.7) * 1.15)

/** Whether the scene being painted is under a night sky: its sky is painted first, and says so. */
let night = false
/** Each band of mist drawn needs an id of its own. */
let mists = 0

function brownish(color: string): boolean {
  const c = color.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return r > b + 18 && r >= g
}

/** A lit color as the sheet of glass its element is cut from. */
function glass(color: string, family: Family, depth: number): string {
  const l = lift(lum(color))
  const warm = isWarm(color)
  const green = isGreen(color)
  const far = depth < 0.25
  switch (family) {
    case 'sky':
      return warm ? step(G.dawn, l) : step(night ? G.nightBlue : G.blue, l)
    case 'cloud':
    case 'air':
      return warm ? step(G.dawn, Math.max(0.6, l)) : step(G.white, Math.max(0.45, l))
    case 'stars':
    case 'life':
      return warm ? step(G.gold, Math.max(0.5, l)) : green ? step(G.green, Math.max(0.5, l)) : step(G.white, Math.max(0.7, l))
    case 'body':
    case 'beam':
    case 'glow':
      return warm ? step(G.gold, Math.max(0.5, l)) : step(G.white, Math.max(0.6, l))
    case 'fire':
      return step(G.fire, l)
    case 'lamp':
      return warm || l > 0.55 ? step(G.gold, Math.max(0.5, l)) : step(G.blue, l)
    case 'foliage':
    case 'grass':
      return step(G.green, warm ? Math.max(0.5, l) : l)
    case 'bark':
      return step(G.amber, l * 0.85)
    case 'land':
      return green ? step(G.green, l) : far ? step(G.murrey, l + 0.1) : warm || brownish(color) ? step(G.amber, l) : step(G.slate, l)
    case 'ground':
      return green ? step(G.green, l) : warm || brownish(color) ? step(G.amber, l) : step(G.white, l)
    case 'mark':
      return P.grisaille
    case 'rock':
      return far ? step(G.murrey, l + 0.1) : warm || brownish(color) ? step(G.amber, l) : step(G.white, l)
    case 'built':
      return warm ? (l > 0.6 ? step(G.gold, l) : step(G.amber, l)) : far ? step(G.murrey, l + 0.1) : step(G.slate, l)
    case 'glass':
    case 'water':
      return step(G.blue, l)
    case 'shadow':
      return LEAD
    default:
      return step(G.blue, l)
  }
}

/** Families set without lead: the sky's own field, light, air, sparks. */
const UNLEADED: readonly Family[] = ['sky', 'stars', 'life', 'lens', 'air', 'beam', 'glow', 'shadow']

// ---------------------------------------------------------------- the panes

/** A small seeded sequence, so the same window is always cut the same way. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** Keeps the part of a polygon nearer to a than to b (the gallery's clipHalf). */
function clipHalf(pts: P2[], a: P2, b: P2): P2[] {
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const nx = b[0] - a[0]
  const ny = b[1] - a[1]
  const side = (q: P2) => (q[0] - mx) * nx + (q[1] - my) * ny
  const out: P2[] = []
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i]!
    const p1 = pts[(i + 1) % pts.length]!
    const s0 = side(p0)
    const s1 = side(p1)
    if (s0 <= 0) out.push(p0)
    if (s0 <= 0 !== s1 <= 0) {
      const k = s0 / (s0 - s1)
      out.push([p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k])
    }
  }
  return out
}

/** The tile the panes are cut on, and how many to a row and a column. */
const TILE = { w: 128, h: 72, cols: 11, rows: 7 }

/**
 * The panes of one tile, cut as the gallery cuts its lancet (a Voronoi of
 * jittered seeds), but wrapped, so the tile repeats without a seam. Each pane
 * is placed again across any edge it overhangs.
 */
const PANES: { d: string; k: number }[] = (() => {
  const r = seeded(32)
  const { w, h, cols, rows } = TILE
  const seeds: P2[] = []
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) seeds.push([((i + 0.5 + (r() - 0.5) * 0.8) * w) / cols, ((j + 0.5 + (r() - 0.5) * 0.8) * h) / rows])
  const all: P2[] = []
  for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) for (const s of seeds) all.push([s[0] + dx, s[1] + dy])
  const out: { d: string; k: number }[] = []
  for (const s of seeds) {
    let cell: P2[] = [[s[0] - 40, s[1] - 40], [s[0] + 40, s[1] - 40], [s[0] + 40, s[1] + 40], [s[0] - 40, s[1] + 40]]
    for (const o of all) if (o !== s && Math.hypot(o[0] - s[0], o[1] - s[1]) < 40) cell = clipHalf(cell, s, o)
    if (cell.length < 3) continue
    const k = r()
    const xs = cell.map(q => q[0])
    const ys = cell.map(q => q[1])
    for (const dx of [-w, 0, w])
      for (const dy of [-h, 0, h]) {
        if (Math.max(...xs) + dx < 0 || Math.min(...xs) + dx > w || Math.max(...ys) + dy < 0 || Math.min(...ys) + dy > h) continue
        out.push({ d: poly(cell, dx, dy), k })
      }
  }
  return out
})()

/** Panes in a band of the shade they take: lighter, as cut, deeper, deepest; and the sky's jewels. */
const paneClass = (lo: number, hi: number) => PANES.filter(p => p.k >= lo && p.k < hi).map(p => p.d).join('')

/** The panes' definitions: one tile, every pane its own shade and leaded; the sky's tile adds ruby and gold jewels. */
function paneDefs(): string {
  const { w, h } = TILE
  const cells =
    `<g id="sg-cells" stroke="${LEAD}" stroke-width=".7" stroke-linejoin="round">` +
    `<path fill="#fff" fill-opacity=".17" d="${paneClass(0, 0.3)}"/>` +
    `<path fill="none" d="${paneClass(0.3, 0.58)}"/>` +
    `<path fill="#000" fill-opacity=".18" d="${paneClass(0.58, 0.84)}"/>` +
    `<path fill="#000" fill-opacity=".32" d="${paneClass(0.84, 0.91)}"/>` +
    `<path fill="#fff" fill-opacity=".3" d="${paneClass(0.91, 1.01)}"/></g>`
  // The sky's jewels: a few panes of ruby and of gold among the blue.
  const jewels = (lo: number, hi: number) => PANES.filter(p => (p.k * 97) % 1 >= lo && (p.k * 97) % 1 < hi).map(p => p.d).join('')
  return (
    `<pattern id="sg-panes" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${cells}</pattern>` +
    `<pattern id="sg-sky" width="${w}" height="${h}" patternUnits="userSpaceOnUse"><use href="#sg-cells"/>` +
    `<g stroke="${LEAD}" stroke-width=".7" stroke-linejoin="round"><path fill="${P.ruby}" fill-opacity=".8" d="${jewels(0, 0.05)}"/><path fill="${P.gold}" fill-opacity=".75" d="${jewels(0.05, 0.09)}"/></g></pattern>`
  )
}

/**
 * Cuts an element into panes: the element as glazed, then its broad shapes
 * again, filled with the leaded panes. A shape inside a moved group, or a
 * thin wash, is left whole.
 */
function paned(out: string, id = 'sg-panes'): string {
  if (/<g\b[^>]*\stransform=/.test(out)) return out
  const shapes = (out.match(/<(rect|path|ellipse|circle|polygon)\b[^>]*\/>/g) ?? [])
    .filter(s => !/\sfill="none"/.test(s) && !/visibility="hidden"/.test(s) && Number(/\sopacity="([\d.]+)"/.exec(s)?.[1] ?? 1) >= 0.6)
    .map(s => s.replace(/\s(fill|stroke|stroke-width|stroke-opacity|opacity|fill-opacity|filter|style|id|mask|clip-path)="[^"]*"/g, ''))
  return shapes.length ? `${out}<g fill="url(#${id})" stroke="none">${shapes.join('')}</g>` : out
}

// ---------------------------------------------------------------- the redraws

/** The sky: the lit sky in sheets of blue (or of dawn), cut into the gallery's field of leaded panes. */
function sky(svg: string, c: Ctx): string {
  const stops = c.gradient(svg)?.stops ?? []
  const top = stops[0]?.color ?? '#3060a0'
  const low = stops[stops.length - 1]?.color ?? '#80a0c0'
  night = lum(top) < 0.2 && lum(low) < 0.45
  const sw = c.meta.sw ?? 640
  return `${c.repaint(svg)}<rect width="${n(sw)}" height="128" fill="url(#sg-sky)"/>`
}

/** Stars as glass: the bright ones gold quatrefoils, the faint ones white pearls, each leaded. */
function stars(svg: string, c: Ctx): string {
  return c
    .repaint(svg)
    .replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag: string, attrs: string, close: string) => {
      const pts: [string, string][] =
        tag === 'path'
          ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? '').matchAll(/M([\d.-]+) ([\d.-]+)/g)].map(m => [m[1]!, m[2]!])
          : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? '0', /\sy="([^"]*)"/.exec(attrs)?.[1] ?? '0']]
      const op = Number(/\sopacity="([\d.]+)"/.exec(attrs)?.[1] ?? 1)
      const href = op < 0.5 ? '#sg-pearl' : '#sg-star'
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap|opacity)="[^"]*"/g, '')
      return `<g${kept}>${pts.map(([x, y]) => `<use href="${href}" x="${x}" y="${y}"/>`).join('')}${close ? '</g>' : ''}`
    })
    .replace(/<\/(path|rect)>/g, '</g>')
}

/** The sun: a gold disc in a crown of ruby and gold rays, turning slowly, all leaded. */
function sun(cx: number, cy: number, r: number): string {
  let gold = ''
  let ruby = ''
  const rays = 16
  for (let i = 0; i < rays; i++) {
    const a = (i * 2 * Math.PI) / rays
    const b = Math.PI / rays
    const p = (ang: number, rr: number) => `${n(Math.cos(ang) * rr)} ${n(Math.sin(ang) * rr)}`
    const tri = `M${p(a - b * 0.8, r * 1.18)}L${p(a, r * (i % 2 ? 1.75 : 2.15))}L${p(a + b * 0.8, r * 1.18)}z`
    if (i % 2) ruby += tri
    else gold += tri
  }
  return (
    `<g transform="translate(${n(cx)} ${n(cy)})" stroke="${LEAD}" stroke-width=".6" stroke-linejoin="round"><g>` +
    `<path fill="${P.gold}" d="${gold}"/><path fill="${P.ruby}" d="${ruby}"/>` +
    `<animateTransform attributeName="transform" type="rotate" values="0;360" dur="90s" repeatCount="indefinite"/></g>` +
    `<circle r="${n(r * 1.12)}" fill="#f8dc80"/><circle r="${n(r * 0.62)}" fill="#fbf0c4" stroke-width=".4"/></g>`
  )
}

/** The moon: a disc of white glass, its shadowed crescent cut in grey glass. */
function moon(cx: number, cy: number, r: number): string {
  return (
    `<g stroke="${LEAD}" stroke-width=".6"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="#efeedc"/>` +
    `<path fill="#a6b2bc" d="M${n(cx + r * 0.2)} ${n(cy - r * 0.98)}a${n(r)} ${n(r)} 0 0 1 0 ${n(r * 1.96)}a${n(r * 0.7)} ${n(r)} 0 0 0 0 ${n(-r * 1.96)}z"/></g>`
  )
}

/** The Earth: a roundel of blue glass, a green land and a white cloud, leaded. */
function earth(cx: number, cy: number, r: number): string {
  const at = (x: number, y: number) => `${n(cx + x * r)} ${n(cy + y * r)}`
  return (
    `<g stroke="${LEAD}" stroke-width=".7" stroke-linejoin="round"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${G.blue[3]}"/>` +
    `<path fill="${G.green[3]}" d="M${at(-0.6, -0.55)}Q${at(-0.1, -0.75)} ${at(0.15, -0.35)}Q${at(0.3, 0)} ${at(-0.05, 0.25)}Q${at(-0.35, 0.5)} ${at(-0.55, 0.15)}Q${at(-0.85, -0.1)} ${at(-0.6, -0.55)}z"/>` +
    `<path fill="${G.green[4]}" d="M${at(0.35, 0.3)}Q${at(0.7, 0.2)} ${at(0.75, 0.5)}Q${at(0.5, 0.75)} ${at(0.3, 0.55)}z"/>` +
    `<path fill="${P.white}" d="M${at(-0.95, 0.05)}Q${at(-0.4, -0.1)} ${at(0.2, 0.1)}Q${at(0.6, 0.2)} ${at(0.97, 0.05)}L${at(0.92, 0.3)}Q${at(0.2, 0.38)} ${at(-0.9, 0.32)}z"/>` +
    `<path fill="#000" fill-opacity=".28" stroke="none" d="M${at(0.15, -0.99)}A${n(r)} ${n(r)} 0 0 1 ${at(0.15, 0.99)}A${n(r * 0.75)} ${n(r)} 0 0 0 ${at(0.15, -0.99)}z"/></g>`
  )
}

/** Mist in banks of opalescent white glass, their scalloped tops leaded, drifting as the mist did. */
function mist(svg: string, c: Ctx): string {
  const w = Math.min(MIST_TILE, c.meta.sw ?? 640)
  const banks = mistBanks({ w, y: c.meta.y ?? 80, h: c.meta.h ?? 12, seed: 32, rows: (c.meta.h ?? 12) < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true })
  const fill = night ? '#8a96c8' : c.meta.veil ? '#dcdcd0' : '#ece8dc'
  const art = `<path fill="${fill}" fill-opacity=".62" stroke="${LEAD}" stroke-width=".55" stroke-linejoin="round" d="${banks.map(b => b.d).join('')}"/>`
  return `<g>${tiled(`sg-mist${++mists}`, art, c.meta.sw ?? 640)}${c.motion(svg)}</g>`
}

const scenery = () => {
  night = false
  mists = 0
  return painter(
    {
      // A line in the lit painting is lead or grisaille; a fill is a sheet of glass.
      ink: (color, family, depth, attr) => (attr === 'stroke' && family !== 'fire' && family !== 'lamp' && family !== 'stars' && family !== 'life' ? (family === 'mark' ? P.grisaille : LEAD) : glass(color, family, depth)),
      // A gradient is a sheet of one glass in its overall tone; a faint wash of light is not glazed. The sky keeps its graded sheets.
      url: (_id, family, attr, g) => {
        if (family === 'sky' || !g) return undefined
        const mean = meanOf(g)
        if (attr === 'stroke') return LEAD
        if (mean.opacity < 0.5) return g.tag === 'radialGradient' && (family === 'glow' || family === 'body') ? undefined : 'none'
        return glass(mean.color, family, 0.5)
      },
      // Every piece is set in lead: a fine came far off, a broad one near.
      line: (family, depth) =>
        UNLEADED.includes(family) ? '' : `stroke="${LEAD}" stroke-width="${n(0.35 + depth * 0.55)}" stroke-linejoin="round"`,
      // Glass is a sheet or nothing: washes firm up, light stays thin.
      opacity: (family, v) => (family === 'glow' || family === 'beam' ? Math.min(0.35, v) : v >= 0.3 ? Math.min(1, v * 1.4) : v),
      lineless: 0.55,
      // A lamp's pool of light is a pane of gold glass laid thin on the floor, a paler heart in it.
      pool: e =>
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${P.gold}" opacity=".3"/>` +
        `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="#fbf0c4" opacity=".35"/>`,
      redraw: {
        sky,
        stars,
        'space.milkyway': (svg, c) => stars(svg.replace(/<ellipse[^>]*\/>/, ''), c),
        body: (_svg, c) => {
          const cx = c.meta.cx ?? 0
          const cy = c.meta.cy ?? 0
          const r = c.meta.r ?? 8
          if (c.role === 'space.earth') return earth(cx, cy, r)
          if (c.role === 'night.moon') return moon(cx, cy, r * 1.15)
          if (c.meta.part === 'halo') return ''
          return sun(cx, cy, r * (c.role === 'desert.sun' ? 1.05 : 1.45))
        },
        air: mist,
        // Light falling through the air: rays of pale gold glass laid thin.
        beam: (svg, c) => `<g opacity=".3">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="#f8dc80"`).replace(/\sopacity="[^"]*"/g, '')}</g>`,
        // Glass is set flat: no reflections.
        water: () => '',
        lens: () => '',
        // The broad ground, hills and meadows are cut into leaded panes.
        ground: (svg, c) => (c.meta.part === 'close' ? c.repaint(svg) : paned(c.repaint(svg))),
        land: (svg, c) => paned(c.repaint(svg)),
        'forest.meadow': (svg, c) => paned(c.repaint(svg)),
        'night.meadow': (svg, c) => paned(c.repaint(svg)),
        'desert.mesas': (svg, c) => paned(c.repaint(svg)),
        'volcano.cone': (svg, c) => paned(c.repaint(svg)),
        'lab.wall': (svg, c) => paned(c.repaint(svg)),
      },
    },
    'sg',
  )
}

// ---------------------------------------------------------------- Claude

/** A glass's shade as the face turns from the light, in three steps (the gallery's .8 + .32 light). */
const SHADES = [0.84, 0.98, 1.1]
const shade = (c: string, k: number) => (k <= 1 ? mix('#000000', c, k) : mix(c, '#ffffff', k - 1))
const lightStep = (light: number) => (light < 0.33 ? 0 : light < 0.66 ? 1 : 2)

/** A point on a face: `u` along its first edge, `w` along its second. */
function at(pts: readonly P2[], u: number, w: number): P2 {
  const [a, b, c, d] = [pts[0]!, pts[1]!, pts[2]!, pts[3]!]
  return [
    (1 - u) * (1 - w) * a[0] + u * (1 - w) * b[0] + u * w * c[0] + (1 - u) * w * d[0],
    (1 - u) * (1 - w) * a[1] + u * (1 - w) * b[1] + u * w * c[1] + (1 - u) * w * d[1],
  ]
}

/** The glass a face is cut from: two-piece faces take a gradient with a hard step, shared by every pose. */
function faceFill(f: Face): string {
  const k = lightStep(f.light)
  if (f.part === 'leg') return shade(f.name === 'front' ? GL.leg : GL.legDark, SHADES[k]!)
  if (f.part === 'body' && (f.name === 'front' || f.name === 'left' || f.name === 'right')) return `url(#sg-${f.name === 'front' ? 'fr' : 'sd'}${k})`
  return shade(f.name === 'top' ? GL.top : f.name === 'front' ? GL.front : GL.side, SHADES[k]!)
}

/**
 * Claude in coral glass: each face its own sheet, the body's faces cut into
 * pieces of differing shade, every piece leaded, a broad came round him.
 */
const hero = (): HeroPainter => (m: Model, cx: number, floor: number) => {
  const hulls = m.parts.map(pt => poly(pt.hull, cx, floor)).join('')
  let faces = ''
  let fill = ''
  let d = ''
  let cuts = ''
  const seg = (a: P2, b: P2) => `M${t1(a[0] + cx)} ${t1(a[1] + floor)}L${t1(b[0] + cx)} ${t1(b[1] + floor)}`
  for (const f of outlinedFaces(m)) {
    const t = faceFill(f)
    if (t !== fill && d) {
      faces += `<path fill="${fill}" d="${d}"/>`
      d = ''
    }
    fill = t
    d += poly(f.pts, cx, floor)
    // The leads that cut the body's faces into pieces: the front in four, the sides and top in two.
    if (f.part === 'body' && f.pts.length === 4 && f.name !== 'bottom' && f.name !== 'back') {
      cuts += seg(at(f.pts, 0.5, 0), at(f.pts, 0.5, 1))
      if (f.name === 'front') cuts += seg(at(f.pts, 0, 0.5), at(f.pts, 1, 0.5))
    }
  }
  if (d) faces += `<path fill="${fill}" d="${d}"/>`
  const eyes = m.eyes
    .map(e =>
      e.poly
        ? `<path fill="${P.eye}" stroke="${LEAD}" stroke-width=".45" d="${poly(e.poly, cx, floor)}"/>` +
          `<circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor)}" r=".55" fill="#d2e1ff"/>`
        : `<path fill="none" stroke="${LEAD}" stroke-width="1.1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`,
    )
    .join('')
  return (
    `<path fill="${LEAD}" opacity=".35" d="${poly(m.shadow, cx, floor)}"/>` +
    // The came round the whole figure: every part's hull, stroked broad in lead under the glass.
    `<path fill="${LEAD}" stroke="${LEAD}" stroke-width="1.5" stroke-linejoin="round" d="${hulls}"/>` +
    `<g stroke="${LEAD}" stroke-width=".55" stroke-linejoin="round">${faces}<path fill="none" stroke-width=".45" d="${cuts}"/></g>` +
    eyes
  )
}

// ---------------------------------------------------------------- the window

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A gradient with a hard step at its middle: one sheet of glass beside a second, cut a little lighter. */
const twoPiece = (id: string, a: string, b: string) =>
  `<linearGradient id="${id}" x2="1"><stop offset=".5" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/></linearGradient>`

/** The quatrefoil a bright star is cut as, centred on 0 0. */
const QUATREFOIL = 'M0 -1.9L.55 -.55L1.9 0L.55 .55L0 1.9L-.55 .55L-1.9 0L-.55 -.55z'

function defs(): string {
  let out = paneDefs()
  SHADES.forEach((k, i) => {
    out += twoPiece(`sg-fr${i}`, shade(GL.front, k), shade(GL.front, k * 1.07))
    out += twoPiece(`sg-sd${i}`, shade(GL.side, k * 1.06), shade(GL.side, k))
  })
  return (
    out +
    `<path id="sg-star" d="${QUATREFOIL}" fill="${P.gold}" stroke="${LEAD}" stroke-width=".35" stroke-linejoin="round"/>` +
    `<circle id="sg-pearl" r=".75" fill="${P.pearl}" stroke="${LEAD}" stroke-width=".3"/>` +
    `<radialGradient id="sg-light" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fffaeb" stop-opacity=".2"/><stop offset="1" stop-color="#fffaeb" stop-opacity="0"/></radialGradient>` +
    // The ashlar wall the window is set in: grey stones of differing shade in dark mortar.
    `<pattern id="sg-ashlar" width="28" height="10" patternUnits="userSpaceOnUse"><rect width="28" height="10" fill="#1e1d21"/>` +
    `<path fill="#3d3c43" d="M.5 .5h13v4h-13zM21.5 5.5h6.5v4h-6.5z"/><path fill="#47464d" d="M14.5 .5h13v4h-13zM.5 5.5h6v4h-6z"/><path fill="#34333a" d="M7.5 5.5h13v4h-13z"/></pattern>`
  )
}

/** How far the stone and the fillet reach in from the stage's edge. */
const STONE = 4.5
const FILLET = 2.6

export const GLASS: Look = {
  name: 'glass',
  label: 'Stained Glass',
  voice: 'a Gothic cathedral window, its legend told in solemn Latin-flavoured lines',
  cell: 'solid',
  figure: '3d',
  font: SERIF,
  charW: 5.1,
  caption: { fill: P.white, stroke: LEAD, ink: P.eye, radius: 0 },
  paper: { card: '#f4eedb', ink: '#1d1430', kinds: { code: '#1f3a9a', path: '#1f3a9a', fn: '#5a2a7c', num: '#9a4a0e', bad: '#a8202e', good: '#276a30', face: '#a8202e' } },
  inset: STONE + FILLET + 2,
  titleColor: P.cream,
  art: {
    painter: scenery,
    hero,
    sky: G.blue[2]!,
    ground: '#2e2238',
    defs,
  },
  // The light through the window, fullest at its middle; now and then a passing cloud dims it.
  texture: (sw, h) =>
    `<rect width="${sw}" height="${h}" fill="url(#sg-light)"/>` +
    `<rect width="${sw}" height="${h}" fill="#0a0814" opacity="0"><animate attributeName="opacity" values="0;0;.16;.22;.1;0;0" keyTimes="0;.45;.55;.65;.75;.85;1" dur="19s" repeatCount="indefinite"/></rect>`,
  // The ashlar reveal, a ruby fillet strung with pearls between two leads, and an iron saddle bar across the glass.
  frame: (sw, h) => {
    const s = STONE
    const f = s + FILLET / 2
    const i = s + FILLET
    return (
      `<path fill="url(#sg-ashlar)" fill-rule="evenodd" d="M0 0h${sw}v${h}H0zM${s} ${s}v${h - 2 * s}h${sw - 2 * s}V${s}z"/>` +
      `<path fill="none" stroke="${LEAD}" stroke-width="1.6" d="M${n(i)} 42H${n(sw - i)}"/>` +
      `<path fill="none" stroke="#5a5660" stroke-width=".4" d="M${n(i)} 41.5H${n(sw - i)}"/>` +
      `<rect x="${f}" y="${f}" width="${n(sw - 2 * f)}" height="${n(h - 2 * f)}" fill="none" stroke="${P.frame}" stroke-width="${FILLET}"/>` +
      `<rect x="${f}" y="${f}" width="${n(sw - 2 * f)}" height="${n(h - 2 * f)}" fill="none" stroke="${P.pearl}" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="0 6"/>` +
      `<rect x="${s}" y="${s}" width="${sw - 2 * s}" height="${h - 2 * s}" fill="none" stroke="${LEAD}" stroke-width=".9"/>` +
      `<rect x="${i}" y="${i}" width="${n(sw - 2 * i)}" height="${n(h - 2 * i)}" fill="none" stroke="${LEAD}" stroke-width=".9"/>`
    )
  },
  // The inscription band: murrey glass, leaded, the chapter in cream capitals, a gold jewel at each end.
  tag: (text, inset) => {
    const t = text.toUpperCase().replace(/U/g, 'V').split(/\s+/).join(' · ')
    const x = inset + 4
    const y = inset + 3
    const w = t.length * 6.3 + 22
    return {
      svg:
        `<g stroke="${LEAD}" stroke-width="1.3" stroke-linejoin="round"><rect x="${x}" y="${y}" width="${n(w)}" height="14" fill="${P.murrey}"/>` +
        `<path stroke-width=".7" fill="${P.gold}" d="M${x + 5.5} ${y + 3.5}l3 3.5-3 3.5-3-3.5zM${n(x + w - 5.5)} ${y + 3.5}l3 3.5-3 3.5-3-3.5z"/></g>` +
        `<text x="${n(x + w / 2)}" y="${y + 10.2}" text-anchor="middle" font-family="${SERIF}" font-size="8.4" font-weight="600" letter-spacing="1.3" fill="${P.cream}">${escape(t)}</text>`,
      w: x + w + 4,
      h: y + 18,
    }
  },
  bubble: {
    font: SERIF,
    size: 9,
    charW: 5.1,
    line: 12,
    base: 13,
    draw: ({ x, y, w, h }, { base, tip }) =>
      // A banderole of white glass: leaded broad, a fine gold-stained border inside, its tail a leaded point.
      `<path fill="#f4eedb" stroke="${LEAD}" stroke-width="1.4" stroke-linejoin="round" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/>` +
      `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#f4eedb" stroke="${LEAD}" stroke-width="2"/>` +
      `<rect x="${n(x + 2.2)}" y="${n(y + 2.2)}" width="${w - 4.4}" height="${h - 4.4}" fill="none" stroke="#c8962a" stroke-width=".6"/>`,
  },
}

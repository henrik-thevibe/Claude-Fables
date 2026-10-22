/**
 * Graphic styles ("looks") a scene can be drawn in: the original look, its
 * pixel art, and the art styles of the Claude Mascot Style Gallery
 * (github.com/henrik-thevibe/Claude-Mascot-Style-Gallery).
 *
 * A look never changes what a scene is, only how it is drawn. The original
 * look is the lit scenery as authored; its pixel art pixelizes the whole stage.
 * Each gallery style is an artwork of its own (styles/*.ts): every element of
 * the scenery and Claude himself redrawn in its medium, with its own texture,
 * frame, chapter tag and caption bubble. A style made on a grid (tesserae,
 * a loom) also names that grid as its medium.
 */

import type { Painter } from './art/roles'
import type { HeroPainter } from './hero3d'
import { AERO } from './styles/aero'
import { ATLAS } from './styles/atlas'
import { BLACKFIGURE } from './styles/blackfigure'
import { BLUEPRINT } from './styles/blueprint'
import { CAVE } from './styles/cave'
import { CHROME } from './styles/chrome'
import { CHRONO } from './styles/chrono'
import { DELFT } from './styles/delft'
import { ENGRAVING } from './styles/engraving'
import { GOLDEN } from './styles/golden'
import { HERALDRY } from './styles/heraldry'
import { KAMON } from './styles/kamon'
import { MOSAIC } from './styles/mosaic'
import { TAPESTRY } from './styles/tapestry'
import { UKIYOE } from './styles/ukiyoe'

/** How one art pixel of a sprite is drawn. */
export type Cell = 'solid'

export type CaptionStyle = { fill: string; stroke: string; ink: string; radius: number }

/** The kinds of words a caption sets apart (svg.ts). */
export type WordKind = 'code' | 'path' | 'fn' | 'num' | 'bad' | 'good' | 'face'

/** The caption's cartoon paper in a look: the card, its ink, and the color of each kind of word. */
export type Paper = { card: string; ink: string; kinds: Record<WordKind, string> }

/** The chapter tag as a look draws it, at the top left, and the room it takes. */
export type Tag = { svg: string; w: number; h: number }

type Pt = [number, number]
/**
 * The caption's bubble as a style draws it: its type, and its frame and tail
 * under the text. `tail` runs from two points on the frame to a tip by Claude.
 */
export type Bubble = {
  font: string
  size: number
  /** The type's average advance, in stage units, to fit the bubble to its lines. */
  charW: number
  line: number
  /** The first line's baseline below the bubble's top. */
  base: number
  /** Set the caption in capitals, as a drafting hand would. */
  upper?: boolean
  draw: (box: { x: number; y: number; w: number; h: number }, tail: { base: [Pt, Pt]; tip: Pt }) => string
}

/**
 * A style drawn as an artwork of its own: every element of the scenery and
 * Claude himself repainted in its medium, rather than the finished picture graded.
 */
export type Art = {
  /** Paints the scenery's elements, for a stage `sw` wide. */
  painter: (sw: number) => Painter
  /** Paints Claude. */
  hero: () => HeroPainter
  /** The sky and ground colors past the stage's edges. */
  sky: string
  ground: string
  /** Definitions the painters refer to (patterns, gradients), laid down once under the stage. */
  defs?: (sw: number, h: number) => string
  /** The ground everything is drawn on (a wall, a floor of stones), under the scenery. */
  under?: (sw: number, h: number) => string
}

export type Look = {
  name: string
  /** What the look is called, after the gallery's style it comes from. */
  label: string
  /** A few words for the narrator, so the caption's voice can suit the look. */
  voice: string
  cell: Cell
  /** How the hero is drawn here unless the person says otherwise: the pixel sprite or the 3D model. */
  figure: 'pixel' | '3d'
  font: string
  /** The font's average advance at the caption's size, in stage units, to fit the bubble. */
  charW: number
  /** The caption on the flat stage. */
  caption: CaptionStyle
  /** The caption's cartoon paper on the rich stage; absent, the default paper. */
  paper?: Paper
  /** How far a frame the look draws reaches in, so the chapter tag clears it. */
  inset?: number
  /** The chapter tag's color; absent, the scene's accent. */
  titleColor?: string
  /**
   * The medium a style is made on, as filter primitives from SourceGraphic over
   * the drawn stage: the grid of tesserae or weave its elements
   * are set into, or the wavering of daubed pigment.
   */
  grade?: (sw: number, h: number, pixel: boolean) => string
  /** The color past the stage's edges, where a box wider than the stage shows. */
  edge?: string
  /** Over the drawn stage: paper, weave, grout. Static, so it costs nothing per frame. */
  texture?: (sw: number, h: number, ground: number, pixel: boolean) => string
  /** A frame round the stage, over the texture. */
  frame?: (sw: number, h: number, ground: number) => string
  /** The chapter tag, drawn in the look; absent, the plain tag. */
  tag?: (text: string, inset: number) => Tag
  /** Draw the stage as pixel art: only the original look's own pixel style does. */
  pixel?: boolean
  /** Set when the look is an artwork in its own right (see Art). */
  art?: Art
  /** The caption's bubble, when the style draws its own. */
  bubble?: Bubble
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

/** The default caption paper (svg.ts draws it unchanged when a look names none). */
export const PAPER: Paper = {
  card: '#f6f1e7',
  ink: '#2b2420',
  kinds: { code: '#186a5a', path: '#2b5f9e', fn: '#7b3fa0', num: '#b5541a', bad: '#b3261e', good: '#2e7d32', face: '#c4613f' },
}

// ---------------------------------------------------------------- the looks

/** The original look: the authored scenes as they are lit, drawn smooth. */
const ORIGINAL: Look = {
  name: 'original',
  label: 'Original',
  voice: '',
  cell: 'solid',
  figure: 'pixel',
  font: MONO,
  charW: 5.7,
  caption: { fill: '#2b1c1a', stroke: '#cfc8b8', ink: '#ece9df', radius: 2 },
}

/** The original look in pixel art: the whole stage pixelized, Claude a sprite with an outline. The default. */
const PIXEL: Look = { ...ORIGINAL, name: 'pixel', label: 'Pixel Art', pixel: true }

export const LOOKS: Record<string, Look> = {
  pixel: PIXEL,
  original: ORIGINAL,

  cave: CAVE,

  blueprint: BLUEPRINT,

  mosaic: MOSAIC,

  aero: AERO,

  engraving: ENGRAVING,

  tapestry: TAPESTRY,

  golden: GOLDEN,

  ukiyoe: UKIYOE,

  kamon: KAMON,

  chrome: CHROME,

  blackfigure: BLACKFIGURE,

  heraldry: HERALDRY,

  delft: DELFT,

  atlas: ATLAS,

  chrono: CHRONO,
}

export const LOOK_NAMES = Object.keys(LOOKS)
export const DEFAULT_LOOK = 'pixel'
/** The styles from the gallery: every look but the original and its pixel art. */
export const STYLE_NAMES = LOOK_NAMES.filter(name => name !== 'pixel' && name !== 'original')

/** The look by name; an unknown name draws the default. */
export const lookFor = (name: string | undefined): Look => LOOKS[name ?? DEFAULT_LOOK] ?? PIXEL

const squash = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '')

/** The look a person means, leniently: "Ukiyo-e", "golden age", "frutiger aero" and "Copperplate" all find theirs. */
export function findLook(text: string): Look | undefined {
  const want = squash(text)
  if (!want) return undefined
  return Object.values(LOOKS).find(look => squash(look.name) === want || squash(look.label) === want || squash(look.label).includes(want) || squash(look.name).startsWith(want))
}

/**
 * The terminal's hi-res cartoon. Where the terminal draws pictures (kitty,
 * Ghostty, WezTerm), the scene's own SVG, the one the desktop shows, is played
 * in headless Chrome by `renderer/chrome.mjs` and its frames shown in an Image:
 * every style exactly as drawn, at the terminal's pixels. Inside tmux, where
 * Claude Code draws no Image, the band is left blank and the helper lays the
 * frames over it from outside (renderer/tmux.mjs). Anywhere else, or if the
 * helper cannot start, the band keeps its half-block Raster (terminal.ts).
 *
 * The helper runs for the session's life and takes its scenes as a file, so a
 * new scene costs a page load, not a browser.
 */
import type { EngineInterface } from 'claude-code'

import type { FablesScene } from '../types'
import { H, sceneToSvg } from './svg'

/** The stage's height in CSS pixels, as the desktop's band: the art and caption keep its size. */
const HEIGHT = Math.round(H * 1.5)
/** A terminal cell's width over its height; FABLES_CELL_ASPECT overrides it for an unusual font. */
const CELL_ASPECT = 0.48
/**
 * Device pixels per CSS pixel the frames are shot at; FABLES_SCALE overrides it.
 * Each frame is a PNG Chrome encodes, so this (and FABLES_FPS, frames a second)
 * trades sharpness against the helper's CPU.
 */
const SCALE = 1.5

export type Frame = { seq: number; path: string; generation: number }

/** How the frames reach the screen: an Image Claude Code draws, or laid over a blank band from outside, inside tmux. */
export type PictureMode = 'image' | 'overlay'

export type Hires = {
  state: 'off' | 'starting' | 'ready' | 'failed'
  mode: PictureMode
  dir?: string
  /** The scene last sent, as `seq` and what it was drawn from. */
  seq: number
  sent?: string
  /** The newest frame of the scene last sent; the one before shows until it comes. */
  frame?: Frame
  /** The site and size of the Image last drawn, while it is mounted. */
  site?: { requestId: string; columns: number; rows: number }
  aspect: number
  scale: number
}

export function newHires(): Hires {
  return { state: 'off', mode: 'image', seq: 0, aspect: CELL_ASPECT, scale: SCALE }
}

/**
 * How this terminal can show pictures, if it can: kitty's graphics, drawn by
 * Claude Code as an Image; or, inside tmux with Ghostty or kitty beneath, laid
 * over the band through tmux's passthrough by the helper. Not in screen, which
 * passes nothing through.
 */
export async function pictureMode($: EngineInterface): Promise<PictureMode | undefined> {
  if (await $.env.get('STY')) return undefined
  const outer = !!(await $.env.get('GHOSTTY_RESOURCES_DIR')) || !!(await $.env.get('KITTY_WINDOW_ID'))
  if (await $.env.get('TMUX')) return outer && (await $.env.get('TMUX_PANE')) ? 'overlay' : undefined
  const program = ((await $.env.get('TERM_PROGRAM')) ?? '').toLowerCase()
  const term = ((await $.env.get('TERM')) ?? '').toLowerCase()
  return outer || /ghostty|wezterm/.test(program) || /kitty|ghostty/.test(term) ? 'image' : undefined
}

/**
 * Starts the helper, once. `onFrame` hears each frame of the scene up, and
 * `onChange` hears it come up or go down, so the band can draw again.
 */
export async function startHires(
  $: EngineInterface,
  hires: Hires,
  mode: PictureMode,
  onFrame: (frame: Frame) => void,
  onChange: () => void,
) {
  if (hires.state !== 'off') return
  hires.state = 'starting'
  hires.mode = mode
  const aspect = Number(await $.env.get('FABLES_CELL_ASPECT'))
  if (aspect > 0.2 && aspect < 2) hires.aspect = aspect
  const scale = Number(await $.env.get('FABLES_SCALE'))
  if (scale >= 0.5 && scale <= 3) hires.scale = scale
  void (async () => {
    let tail = ''
    try {
      const helper = $.process.spawn({ argv: ['node', `${$.plugin.root}/renderer/chrome.mjs`] })
      for await (const { stream, text } of helper) {
        if (stream !== 'stdout') continue
        tail += text
        let at: number
        while ((at = tail.indexOf('\n')) >= 0) {
          const line = tail.slice(0, at)
          tail = tail.slice(at + 1)
          const [kind, ...rest] = line.split(' ')
          if (kind === 'ready') {
            hires.dir = rest.join(' ')
            hires.state = 'ready'
            onChange()
          } else if (kind === 'frame') {
            const [seq, path, generation] = [Number(rest[0]), rest.slice(1, -1).join(' '), Number(rest.at(-1))]
            if (seq !== hires.seq) continue
            hires.frame = { seq, path, generation }
            onFrame(hires.frame)
          } else if (kind === 'error') $.ui.log(`fables: hi-res renderer: ${rest.join(' ')}`, { to: 'debug' })
        }
      }
    } catch (e) {
      $.ui.log(`fables: hi-res renderer did not start: ${String(e)}`, { to: 'debug' })
    }
    hires.state = 'failed'
    hires.site = undefined
    onChange()
  })()
}

/** The stage's box in CSS pixels for a band of `columns` by `rows` cells: their shape, the desktop's height. */
function pictureBox(hires: Hires, columns: number, rows: number) {
  return { width: Math.max(1, Math.round((HEIGHT * columns * hires.aspect) / rows)), height: HEIGHT }
}

/** Sends the helper `scene` for a band of `columns` by `rows` cells, unless it is what it plays already. */
export async function sendScene(
  $: EngineInterface,
  hires: Hires,
  scene: FablesScene,
  look: string,
  columns: number,
  rows: number,
  at: number,
) {
  if (hires.state !== 'ready' || !hires.dir) return
  const box = pictureBox(hires, columns, rows)
  const sent = `${JSON.stringify(scene)}|${look}|${columns}x${rows}|${at}`
  if (sent === hires.sent) return
  hires.sent = sent
  hires.seq++
  const svg = sceneToSvg(scene, { ...box, look, figure: '3d' })
  const overlay = hires.mode === 'overlay' ? { columns, rows } : undefined
  await $.fs.write(`${hires.dir}/scene.json`, JSON.stringify({ seq: hires.seq, svg, ...box, scale: hires.scale, at, overlay }))
}

/** A band of blank braille, `columns` by `rows`: what the picture is laid over inside tmux, and how the helper finds it. */
export function blankCells(columns: number, rows: number): string {
  const cells = new Uint32Array(columns * rows * 3)
  for (let i = 0; i < columns * rows; i++) cells.set([0x2800, 0x01000000, 0x01000000], i * 3)
  // The engine's runtime has Uint8Array's base64 methods; es2023's lib does not name them yet.
  return (new Uint8Array(cells.buffer) as Uint8Array & { toBase64(): string }).toBase64()
}

/** Tells the helper to rest while the band is empty. */
export async function idle($: EngineInterface, hires: Hires) {
  if (hires.state !== 'ready' || !hires.dir || hires.sent === 'idle') return
  hires.sent = 'idle'
  hires.seq++
  hires.frame = undefined
  await $.fs.write(`${hires.dir}/scene.json`, JSON.stringify({ seq: hires.seq, idle: true }))
}

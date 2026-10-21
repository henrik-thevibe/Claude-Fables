import type { ModelCompleteResult, On } from 'claude-code'
import { describe, expect, mock, test, type TestBody } from 'claude-code/testing'

import { bandIn, placeOf } from '../renderer/place.mjs'

// The test runtime has timers; the mod's type library leaves them out.
declare const setTimeout: (run: () => void, ms: number) => unknown

const SCENE = {
  backdrop: 'forest',
  hero: { action: 'walk', from: 5, to: 35 },
  props: [],
  caption: 'And here we see the rare parseHex bug in its natural habitat.',
}
const USAGE = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
const answer = (text: string): { value: ModelCompleteResult } => ({ value: { isAnswered: true, text, usage: USAGE } })
const GHOSTTY = { TERM: 'xterm-ghostty', TERM_PROGRAM: 'ghostty', GHOSTTY_RESOURCES_DIR: '/Applications/Ghostty.app/Contents/Resources/ghostty' }
const HIRES = { options: { terminalArt: 'hires' } }

const BAND = {
  plugin: 'fables',
  component: 'AbovePrompt',
  surface: 'terminal',
  props: { hasSurvey: false, isWorking: true, maxRows: 12, bodyColumns: 100, scroll: { offset: 0, bodyRows: 12 }, view: {} },
} as const

/**
 * What the engine would answer beneath the plugin in a terminal session, the
 * helper included: it says it is ready, and sends one frame once a scene is
 * written to it. `scenes` holds what the band wrote; `spawned`, what it ran.
 */
function world(on: On, env: Record<string, string>, helper: 'works' | 'missing' = 'works') {
  const clock = mock.clock(on)
  mock.store(on)
  mock.env(on, env)
  const spawned: string[][] = []
  const scenes: Record<string, unknown>[] = []
  let written: () => void = () => {}
  const wrote = new Promise<void>(resolve => (written = resolve))
  let finish: () => void = () => {}
  const finished = new Promise<void>(resolve => (finish = resolve))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('ui.blit', () => ({ value: {} }))
  on('ui.render', ($, e) => $.ui.resolve(e).Text({ children: 'engine band' }))
  on('model.complete', () => answer(JSON.stringify(SCENE)))
  on('fs.write', (_, e) => {
    if (e.path.endsWith('/scene.json')) {
      scenes.push(JSON.parse(e.text))
      written()
    }
    return { value: undefined }
  })
  on('process.spawn', async function* (_, e) {
    spawned.push([...e.argv])
    if (helper === 'missing') throw new Error('spawn node ENOENT')
    yield { stream: 'stdout' as const, text: 'ready /tmp/fables-test\n' }
    await wrote
    yield { stream: 'stdout' as const, text: 'frame 1 /tmp/fables-test/frame-1.png 1\n' }
    await finished
    return { value: { code: 0, signal: null } }
  })
  return { clock, spawned, scenes, finish }
}

/** The person asks something, and the model's turn starts on it. */
async function ask($: Parameters<TestBody>[0], text: string) {
  await $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
  await $.turn.start({ text, turnId: `turn ${text}` })
}

/** What the band draws now: its element's type and props. */
async function band($: Parameters<TestBody>[0]) {
  const mounted = await $.ui.mount(BAND)
  const found = (await mounted.find({ type: 'Image' })) ?? (await mounted.find({ type: 'Raster' }))
  await mounted.unmount()
  return { type: found?.type, props: found?.props as Record<string, unknown> | undefined }
}

/** The band again, until `ok` says it is what is waited for, or a second has passed. */
async function bandUntil($: Parameters<TestBody>[0], ok: (drawn: Awaited<ReturnType<typeof band>>) => boolean) {
  let drawn = await band($)
  for (let i = 0; i < 100 && !ok(drawn); i++) {
    await new Promise<void>(resolve => setTimeout(resolve, 10))
    drawn = await band($)
  }
  return drawn
}

/** Waits until `ok` holds, or a second has passed: the helper starts in the background. */
async function until(ok: () => boolean) {
  for (let i = 0; i < 100 && !ok(); i++) await new Promise<void>(resolve => setTimeout(resolve, 10))
}

/** The first cell's code point in a Raster's cells. */
const firstGlyph = (cells: unknown) =>
  new Uint32Array((Uint8Array as unknown as { fromBase64(text: string): Uint8Array }).fromBase64(String(cells)).buffer)[0]

test('by default the terminal draws in cells, and no browser is started', async ($, on) => {
  const { clock, spawned } = world(on, GHOSTTY)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await ask($, 'look for bugs')
  await clock.advance(1000)
  const drawn = await band($)
  expect(drawn.type).toBe('Raster')
  expect(firstGlyph(drawn.props?.cells)).not.toBe(0x2800)
  expect(spawned).toEqual([])
})

test('hi-res in Ghostty plays the scene in the helper and shows its frames as an Image', HIRES, async ($, on) => {
  const { clock, spawned, scenes, finish } = world(on, GHOSTTY)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await until(() => spawned.length > 0)
  expect(spawned.length).toBe(1)
  expect(spawned[0]?.[0]).toBe('node')
  expect(spawned[0]?.[1]).toEndWith('/renderer/chrome.mjs')

  await ask($, 'look for bugs')
  await clock.advance(1000)
  const drawn = await bandUntil($, d => d.type === 'Image')
  expect(drawn.type).toBe('Image')
  expect(drawn.props?.source).toEqual({ file: '/tmp/fables-test/frame-1.png', format: 'png', generation: 1 })
  expect(drawn.props?.columns).toBe(100)
  expect(drawn.props?.rows).toBe(10)

  // The helper gets the desktop's own SVG, the band's shape in pixels, and no overlay outside tmux.
  const sent = scenes[0] as { seq: number; svg: string; width: number; height: number; overlay?: unknown }
  expect(sent.seq).toBe(1)
  expect(sent.svg).toStartWith('<svg')
  expect(sent.height).toBe(192)
  expect(sent.width).toBe(Math.round((192 * 100 * 0.48) / 10))
  expect(sent.overlay).toBe(undefined)
  finish()
})

test('hi-res inside tmux leaves the band blank braille for the helper to lay its frames over', HIRES, async ($, on) => {
  const { clock, spawned, scenes, finish } = world(on, { ...GHOSTTY, TERM: 'tmux-256color', TERM_PROGRAM: 'tmux', TMUX: '/tmp/tmux-501/default,1,0', TMUX_PANE: '%7' })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await until(() => spawned.length > 0)
  expect(spawned.length).toBe(1)
  await ask($, 'look for bugs')
  await clock.advance(1000)
  const drawn = await bandUntil($, d => d.type === 'Raster' && firstGlyph(d.props?.cells) === 0x2800)
  expect(drawn.type).toBe('Raster')
  expect(firstGlyph(drawn.props?.cells)).toBe(0x2800)
  expect((scenes[0] as { overlay?: unknown }).overlay).toEqual({ columns: 100, rows: 10 })
  finish()
})

test('hi-res keeps the cells where no picture can be shown: tmux over another terminal, or no helper', HIRES, async ($, on) => {
  const { clock, spawned } = world(on, { TERM: 'tmux-256color', TERM_PROGRAM: 'tmux', TMUX: '/tmp/tmux-501/default,1,0', TMUX_PANE: '%7' })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await ask($, 'look for bugs')
  await clock.advance(1000)
  expect(spawned).toEqual([])
  expect((await band($)).type).toBe('Raster')
})

test('hi-res falls back to cells when the helper cannot start', HIRES, async ($, on) => {
  const { clock, spawned } = world(on, GHOSTTY, 'missing')
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await ask($, 'look for bugs')
  await clock.advance(1000)
  await until(() => spawned.length > 0)
  expect(spawned.length).toBe(1)
  const drawn = await band($)
  expect(drawn.type).toBe('Raster')
  expect(firstGlyph(drawn.props?.cells)).not.toBe(0x2800)
})

describe('the tmux overlay', () => {
  test('finds the band: the first row of blank braille, its column and how many rows run on', () => {
    const blank = '⠀'.repeat(40)
    expect(bandIn(`transcript\n> prompt\n${blank}\n${blank}\n${blank}\nbelow`, 40)).toEqual({ x: 0, y: 2, rows: 3 })
    expect(bandIn(`  ${blank}\n  ${blank}`, 40)).toEqual({ x: 2, y: 0, rows: 2 })
    expect(bandIn('no band here\n⠀ one blank is not a band', 40)).toBe(undefined)
  })

  test('places the pane on the terminal: below a status line on top, shown only where a client looks at its window', () => {
    const pane = (status: string, position: string, zoomed = '0', active = '1') =>
      `/dev/ttys006\t3\t40\t@52\t${status}\t${position}\t${zoomed}\t${active}\n`
    const looking = '/dev/ttys001\t@52\n'
    expect(placeOf(pane('on', 'top'), looking)).toEqual({ tty: '/dev/ttys006', top: 4, left: 40, shown: true, clients: ['/dev/ttys001'] })
    expect(placeOf(pane('on', 'bottom'), looking).top).toBe(3)
    expect(placeOf(pane('2', 'top'), looking).top).toBe(5)
    expect(placeOf(pane('off', 'top'), looking).top).toBe(3)
    expect(placeOf(pane('on', 'top'), '/dev/ttys001\t@9\n').shown).toBe(false)
    expect(placeOf(pane('on', 'top'), '').shown).toBe(false)
    // A zoomed window shows only its active pane.
    expect(placeOf(pane('on', 'top', '1', '0'), looking).shown).toBe(false)
  })
})

import type { ModelCompleteResult, On } from 'claude-code'
import { expect, mock, test, type TestBody } from 'claude-code/testing'

import { resumeAt } from '../hooks/svg'

const SCENE = {
  backdrop: 'forest',
  hero: { action: 'walk', from: 5, to: 35 },
  props: [{ sprite: 'bug', x: 60, y: 'ground', motion: 'shake', label: 'parseHex' }],
  caption: 'And here we see the rare parseHex bug in its natural habitat.',
}
const USAGE = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
const answer = (text: string): { value: ModelCompleteResult } => ({ value: { isAnswered: true, text, usage: USAGE } })

/** What the engine would answer beneath the plugin in a session. */
function world(on: On) {
  const clock = mock.clock(on)
  mock.store(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('ui.blit', () => ({ value: {} }))
  on('ui.render', ($, e) => $.ui.resolve(e).Text({ children: 'engine band' }))
  return clock
}

/** The person asks something, and the model's turn starts on it. */
async function ask($: Parameters<TestBody>[0], text: string) {
  await $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
  await $.turn.start({ text, turnId: `turn ${text}` })
}

const BAND = {
  plugin: 'fables',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 12, bodyColumns: 100, scroll: { offset: 0, bodyRows: 12 }, view: {} },
} as const

test('activity becomes a scene drawn above the prompt: an Svg on the desktop, a Raster in the terminal', async ($, on) => {
  const clock = world(on)
  const asked: string[] = []
  on('model.complete', (_, e) => {
    asked.push(e.prompt)
    return answer('```json\n' + JSON.stringify(SCENE) + '\n```')
  })

  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  await ask($, 'look for bugs in effects.ts')
  await clock.advance(1000)

  expect(asked.length).toBe(1)
  expect(asked[0]).toContain('look for bugs in effects.ts')

  const desktop = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = await desktop.find({ type: 'Svg' })
  expect(svg).toBeDefined()
  expect(String((svg?.props as { source?: unknown } | undefined)?.source)).toContain('parseHex')
  await desktop.unmount()

  const terminal = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await terminal.find({ type: 'Svg' })).toBe(undefined)
  const raster = await terminal.find({ type: 'Raster' })
  const props = raster?.props as { columns: number; rows: number; cells: string } | undefined
  expect(props?.columns).toBe(100)
  expect(props?.rows).toBe(10)
  // Every cell is three u32s: a glyph, a foreground and a background.
  // The engine's runtime has Uint8Array's base64 methods; es2023's lib does not name them yet.
  const fromBase64 = (Uint8Array as unknown as { fromBase64(text: string): Uint8Array }).fromBase64
  expect(fromBase64(props?.cells ?? '').length).toBe(100 * 10 * 12)
  await terminal.unmount()
})

test('a garbage reply is skipped and the narrator backs off', async ($, on) => {
  const clock = world(on)
  let calls = 0
  on('model.complete', () => {
    calls++
    return answer('I would love to draw that! Here is a scene: {{{')
  })

  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  await ask($, 'fix it')
  await clock.advance(1000)
  expect(calls).toBe(1)

  // More activity arrives, but the narrator waits out its backoff (10s after one failure).
  await ask($, 'and again')
  await clock.advance(5000)
  expect(calls).toBe(1)
  await clock.advance(6000)
  expect(calls).toBe(2)

  const desktop = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await desktop.find({ type: 'Svg' })).toBe(undefined)
  await desktop.unmount()
})

test('/fables off clears the stage and stops asking', async ($, on) => {
  const clock = world(on)
  let calls = 0
  on('model.complete', () => {
    calls++
    return answer(JSON.stringify(SCENE))
  })

  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  await ask($, 'go')
  await clock.advance(1000)
  expect(calls).toBe(1)

  const ran = await $.command.run({ command: 'fables', args: 'off', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })
  expect(ran.text).toContain('off')
  await ask($, 'more')
  await clock.advance(20000)
  expect(calls).toBe(1)

  const desktop = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await desktop.find({ type: 'Svg' })).toBe(undefined)
  await desktop.unmount()
})

test('a style is chosen by name and draws the band, until it is turned off', async ($, on) => {
  const clock = world(on)
  const asked: string[] = []
  on('model.complete', (_, e) => {
    asked.push(e.prompt)
    return answer(JSON.stringify(SCENE))
  })
  const run = (args: string) => $.command.run({ command: 'fables', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })
  const band = async () => {
    const desktop = await $.ui.mount({ ...BAND, surface: 'desktop' })
    const svg = await desktop.find({ type: 'Svg' })
    await desktop.unmount()
    return String((svg?.props as { source?: unknown } | undefined)?.source)
  }

  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  expect((await run('style')).text).toContain('ukiyoe')
  expect((await run('style Ukiyo-e')).text).toContain('Ukiyo-e')
  expect((await run('style nonsense')).text).toContain('No style')

  await ask($, 'tidy the README')
  await clock.advance(1000)
  expect(asked[0]).toContain('woodblock')
  expect(await band()).toContain('data-look="ukiyoe"')

  expect((await run('style off')).text).toContain('Pixel Art')
  // The old pixel switch picks between the original look's two styles.
  expect((await run('pixel off')).text).toContain('Original')
  expect(await band()).not.toContain('sc-pixelize')
  expect((await run('pixel')).text).toContain('Pixel Art')
  expect(await band()).toContain('sc-pixelize')
  expect(await band()).not.toContain('data-look')
})

test('/fables model switches the storyteller between Sonnet and Haiku, and remembers it', async ($, on) => {
  const clock = world(on)
  const models: string[] = []
  on('model.complete', (_, e) => {
    models.push(String(e.model))
    return answer(JSON.stringify(SCENE))
  })
  const run = (args: string) => $.command.run({ command: 'fables', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })

  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  expect((await run('model')).text).toContain('Sonnet writes the story')
  await ask($, 'one')
  await clock.advance(1000)

  expect((await run('model haiku')).text).toContain('Haiku now writes the story')
  expect((await run('model gpt')).text).toContain('No narrator')
  await ask($, 'two')
  await clock.advance(6000)
  expect(models).toEqual(['sonnet', 'haiku'])

  // A new session starts with the model last chosen.
  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  expect((await run('model')).text).toContain('Haiku writes the story')
})

test('the band drawn again as the turn ends carries the scene on from where it was, instead of starting it over', async ($, on) => {
  const clock = world(on)
  on('model.complete', () => answer(JSON.stringify(SCENE)))
  on('turn.complete', () => ({ text: 'done' }))
  const source = async (props: Partial<typeof BAND.props>) => {
    const desktop = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, ...props } })
    const svg = await desktop.find({ type: 'Svg' })
    await desktop.unmount()
    return String((svg?.props as { source?: unknown } | undefined)?.source)
  }
  // When the caption's first line starts typing, in the drawing's own seconds.
  const typingFrom = (svg: string) => Number(/<clipPath[^>]*><rect[^>]*><animate[^>]*begin="(-?[\d.]+)s"/.exec(svg)?.[1])
  const typingFor = (svg: string) => Number(/<clipPath[^>]*><rect[^>]*><animate[^>]*dur="([\d.]+)s"/.exec(svg)?.[1])

  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  await ask($, 'look for bugs')
  await clock.advance(1000)
  const first = await source({ isWorking: true })
  expect(typingFrom(first)).toBe(0.2)
  // Drawn again in the same moment, it draws the same, so the desktop plays on.
  expect(await source({ isWorking: true })).toBe(first)

  // Two seconds on, the turn ends: the band is drawn again (isWorking flips, and the box may change).
  await clock.advance(2000)
  for (const props of [{ isWorking: false }, { isWorking: false, bodyColumns: 140 }]) {
    const again = await source(props)
    // Carried on, not started over: typed as far as it was (the first line is done by now),
    // and still ending after the drawing starts, or it would never be drawn at all.
    expect(typingFrom(again)).toBeLessThan(0)
    expect(typingFrom(again) + typingFor(again)).toBeGreaterThan(0)
    expect(again).not.toBe(first)
  }
})

test('resumeAt moves every animation back by the time already played', () => {
  const svg = '<svg><animate attributeName="x" dur="1s" begin="0.5s"/><animateTransform dur="2s" begin="-1s" repeatCount="indefinite"/><set to="1"/></svg>'
  expect(resumeAt(svg, 2)).toBe('<svg><animate attributeName="x" dur="1s" begin="-1.5s"/><animateTransform dur="2s" begin="-3s" repeatCount="indefinite"/><set to="1" begin="-2s"/></svg>')
  expect(resumeAt(svg, 0)).toBe(svg)
})

test('resumed long after, a frozen animation still ends just after the start, so the caption is not lost', () => {
  // SMIL never plays an interval that ends before the drawing begins, frozen last frame and all.
  const svg = '<svg><animate attributeName="width" from="0" to="90" dur="1.2s" begin="0.2s" fill="freeze"/><animateTransform values="0 0;9 0" dur="2s" repeatCount="2" fill="freeze"/></svg>'
  expect(resumeAt(svg, 30)).toBe('<svg><animate attributeName="width" from="0" to="90" dur="1.2s" begin="-1.19s" fill="freeze"/><animateTransform values="0 0;9 0" dur="2s" repeatCount="2" fill="freeze" begin="-3.99s"/></svg>')
})

test('/fables demo plays every style in turn without asking the model, then gives the person their style back', async ($, on) => {
  const clock = world(on)
  let asked = 0
  on('model.complete', () => {
    asked++
    return answer(JSON.stringify(SCENE))
  })
  const run = (args: string) => $.command.run({ command: 'fables', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })
  const caption = async (surface: 'desktop' | 'terminal') => {
    const band = await $.ui.mount({ ...BAND, surface })
    const found = await band.find({ type: surface === 'desktop' ? 'Svg' : 'Raster' })
    await band.unmount()
    return found ? String((found.props as { source?: unknown; alt?: unknown }).alt ?? 'raster') : undefined
  }

  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  await run('style kamon')
  expect((await run('demo')).text).toContain('every style')
  expect(await caption('desktop')).toContain('1/11 Pixel Art')
  expect(await caption('terminal')).toBe('raster')

  await clock.advance(8000)
  expect(await caption('desktop')).toContain('2/11 Original')
  await clock.advance(8000 * 9)
  expect(await caption('desktop')).toContain('11/11 Kamon')
  await clock.advance(8000)
  expect(await caption('desktop')).toBe(undefined)
  expect(asked).toBe(0)
  expect((await run('style')).text).toContain('drawn in Kamon')

  await run('demo')
  expect((await run('demo stop')).text).toContain('Kamon')
  expect(await caption('desktop')).toBe(undefined)
  expect((await run('demo stop')).text).toContain('No demo')
})

test('/fables style shuffle draws each new scene in a style picked at random, never the one just drawn', async ($, on) => {
  const clock = world(on)
  let asked = 0
  on('model.complete', () => answer(JSON.stringify({ ...SCENE, caption: `Scene number ${++asked}.` })))
  const run = (args: string) => $.command.run({ command: 'fables', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })
  const drawn = async () => {
    const desktop = await $.ui.mount({ ...BAND, surface: 'desktop' })
    const svg = await desktop.find({ type: 'Svg' })
    await desktop.unmount()
    const props = svg?.props as { source?: unknown; alt?: unknown } | undefined
    return { look: /data-look="([^"]+)"/.exec(String(props?.source))?.[1], caption: String(props?.alt) }
  }

  await $.session.start({ cwd: '/work', surface: 'desktop', isInteractive: true })
  await run('style kamon')
  expect((await run('style shuffle')).text).toContain('random')
  expect((await run('style')).text).toContain('▸ shuffle')

  await ask($, 'tidy the README')
  await clock.advance(1000)
  const seen = [await drawn()]
  for (let i = 0; i < 60 && seen.length < 4; i++) {
    await ask($, `step ${i}`)
    await clock.advance(1000)
    const now = await drawn()
    if (now.caption !== seen[seen.length - 1]?.caption) seen.push(now)
  }
  expect(seen.length).toBe(4)
  for (let i = 1; i < seen.length; i++) expect(seen[i]?.look).not.toBe(seen[i - 1]?.look)

  // Picking a style by name ends the shuffle.
  expect((await run('style ukiyoe')).text).toContain('Ukiyo-e')
  expect((await run('style')).text).toContain('▸ ukiyoe')
})

test('the band clears soon after the turn ends, with no closing scene, slash commands or not', async ($, on) => {
  const clock = world(on)
  let asked = 0
  on('model.complete', () => {
    asked++
    return answer(JSON.stringify(SCENE))
  })
  on('turn.complete', () => ({ text: 'done' }))
  const run = (args: string) => $.command.run({ command: 'fables', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })
  const isUp = async () => {
    const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
    const raster = await band.find({ type: 'Raster' })
    await band.unmount()
    return raster !== undefined
  }

  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await ask($, 'look for bugs in effects.ts')
  await clock.advance(1000)
  expect(await isUp()).toBe(true)
  await $.turn.complete({ reason: 'answer', answer: 'done', durationMs: 1000, isAborted: false, turnId: 't1' })
  // A local command is submitted as a prompt too, but it starts no model turn.
  await $.prompt.submit({ text: '/fables style', command: { name: 'fables', args: 'style' }, wait: false, origin: { kind: 'composer' } } as never)
  await run('style')
  // The scene up is read through (its caption typed and glanced at), then the band goes.
  await clock.advance(2000)
  expect(await isUp()).toBe(true)
  await clock.advance(10_000)
  expect(await isUp()).toBe(false)
  expect(asked).toBe(1)
})

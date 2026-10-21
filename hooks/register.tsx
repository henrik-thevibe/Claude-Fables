import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { DEFAULT_MODEL, Director, findModel, type Host, MODEL_LABELS, NARRATOR_MODELS, type NarratorModel } from './director'
import { DEFAULT_LOOK, findLook, LOOK_NAMES, LOOKS, lookFor } from './looks'
import type { FablesScene } from '../types'

import { blankCells, type Frame, idle, newHires, pictureMode, sendScene, startHires } from './hires'
import { H, MAX_SVG, resumeAt, sceneToSvg, speaksAfter, W } from './svg'
import { termBox, terminalFrame } from './terminal'

const scene = atom({ plugin: 'fables', key: 'scene' } as const, null)
const enabled = atom({ plugin: 'fables', key: 'enabled' } as const, true)
const style = atom({ plugin: 'fables', key: 'style' } as const, DEFAULT_LOOK)

const STORE_ENABLED = 'enabled'
const STORE_PIXEL = 'pixelArt'
const STORE_STYLE = 'style'
/** Saved as the style to draw each new scene in a look picked at random. */
const SHUFFLE = 'shuffle'
const STORE_MODEL = 'model'
/** Every scene is drawn with the 3D Claude, in the style the person chose (looks.ts). */
const FIGURE = '3d'
/** This plugin's own tools, if it ever registers any, are not part of the story. */
const OWN_TOOLS = 'mcp__fables__'

/**
 * The band's code font advance in CSS pixels: the desktop measures the band in
 * cells of it, and the Svg wants pixels.
 */
const PX_PER_COLUMN = 8
/** CSS pixels per stage unit: the stage's H units come out this many times taller. */
const SCALE = 1.5

/**
 * The band's box in CSS pixels: its whole width, at a fixed height so the art and
 * the caption keep one size whatever the window; the stage widens to fill it.
 */
function bandBox(columns: number): { width: number; height: number } {
  const width = Number.isFinite(columns) && columns > 0 ? Math.round(columns * PX_PER_COLUMN) : W * SCALE
  return { width, height: Math.round(H * SCALE) }
}

/** The narrator's host in a session: Claude Code's clock, its model, the band, and how the band draws a scene. */
function host($: EngineInterface, band: Band, showing: Showing): Host {
  return {
    now: () => $.clock.now(),
    complete: ask => $.model.complete(ask),
    show: async drawn => {
      if (drawn && showing.shuffle) await update($, style, last => shuffled(last))
      await update($, scene, () => drawn)
    },
    // The terminal's bubble shows from the start; only the desktop's can wait for Claude.
    speaksAfter: async next => {
      const surfaces = await $.session.surfaces().catch(() => undefined)
      if (surfaces?.length && surfaces.every(s => s === 'terminal')) return 0
      return speaksAfter((await draw($, band, next)).base) * 1000
    },
  }
}

/** A look picked at random, never the one just drawn. */
function shuffled(last: string): string {
  const others = LOOK_NAMES.filter(name => name !== last)
  return others[Math.floor(Math.random() * others.length)] ?? DEFAULT_LOOK
}

async function chooseShuffle($: EngineInterface, n: Director, showing: Showing) {
  showing.shuffle = true
  // The narrator writes before the look is picked, so it keeps the plain voice.
  n.look = DEFAULT_LOOK
  await $.store.set(STORE_STYLE, SHUFFLE)
  await update($, style, last => shuffled(last))
  return { text: 'Each new scene is now drawn in a style picked at random.' }
}

async function chooseLook($: EngineInterface, n: Director, showing: Showing, name: string) {
  const look = lookFor(name)
  showing.shuffle = false
  n.look = look.name
  await $.store.set(STORE_STYLE, look.name)
  await update($, style, () => look.name)
  return { text: `Scenes are now drawn as ${look.label}.` }
}

async function chooseModel($: EngineInterface, n: Director, model: NarratorModel) {
  n.model = model
  await $.store.set(STORE_MODEL, model)
  return { text: `${MODEL_LABELS[model]} now writes the story.` }
}

async function setOn($: EngineInterface, n: Director, at: Host, value: boolean) {
  await n.setOn(at, value)
  await $.store.set(STORE_ENABLED, value)
  await update($, enabled, () => value)
}

/**
 * The scene up now, when it went up, and its drawing in the box and style last
 * asked for. The band is drawn again whenever its props change (the turn
 * ending flips isWorking, the window is resized) and the desktop may start the
 * frame over then; so every drawing after the first is set to the scene's own
 * clock, and it carries on where it was instead of typing its caption again.
 */
type Drawn = { scene: string; at: number; key: string; base: string }
/** The drawing kept, and the band's box as last drawn, so a scene can be drawn the moment it goes up. */
type Band = { drawn?: Drawn; box: { width: number; height: number } }

/** The terminal's band as last drawn: its site, its size, and the scene up and when it went up. */
type Term = { requestId?: string; columns: number; rows: number; scene?: FablesScene; key?: string; at: number; look: string }
const RASTER_KEY = 'fables'
const IMAGE_KEY = 'fables-picture'
const BLANK_KEY = 'fables-blank'
/** Frames a second the terminal's cartoon plays at. */
const TERM_FRAME_MS = 125

/** The scene, `t` seconds in, at the terminal band's size. */
function termCells(term: Term, current: FablesScene, now: number) {
  return terminalFrame(current, term.columns, term.rows, Math.max(0, (now - term.at) / 1000), term.look)
}

/** The demo: every look in turn, each on a scene of its own, then the person's look again. */
type Demo = { step: number; until: number; restore: string }
const DEMO_STEP_MS = 8000
const DEMO_SCENES: readonly FablesScene[] = [
  { backdrop: 'forest', palette: {}, hero: { action: 'walk', from: 8, to: 30, then: 'wave' }, props: [], particles: { kind: 'leaves', density: 0.3 }, caption: '' },
  { backdrop: 'city', palette: {}, hero: { action: 'run', from: 70, to: 25, then: 'point' }, props: [], caption: '' },
  { backdrop: 'night', palette: {}, hero: { action: 'sneak', from: 10, to: 40, then: 'peek' }, props: [], caption: '' },
  { backdrop: 'volcano', palette: {}, hero: { action: 'tumble', from: 60, to: 45, then: 'panic' }, props: [], particles: { kind: 'sparks', density: 0.5 }, caption: '' },
  { backdrop: 'desert', palette: {}, hero: { action: 'carry', from: 10, to: 40, then: 'think' }, props: [], caption: '' },
  { backdrop: 'space', palette: {}, hero: { action: 'fly', from: 15, to: 45, then: 'celebrate' }, props: [], particles: { kind: 'stars', density: 0.3 }, caption: '' },
  { backdrop: 'lab', palette: {}, hero: { action: 'inspect', from: 30, to: 30 }, props: [], particles: { kind: 'rain', density: 0.2 }, caption: '' },
]

/** The demo's scene for `step`: a setting of its own, captioned with the look and the command that picks it. */
function demoScene(step: number): FablesScene {
  const name = LOOK_NAMES[step] ?? DEFAULT_LOOK
  const base = DEMO_SCENES[step % DEMO_SCENES.length] ?? DEMO_SCENES[0]!
  return { ...base, tone: step === LOOK_NAMES.length - 1 ? 'milestone' : 'work', caption: `${step + 1}/${LOOK_NAMES.length} ${lookFor(name).label}: \`/fables style ${name}\`` }
}

/** The scene in the band's box and style, drawn once and kept: a scene going up starts its clock. */
async function draw($: EngineInterface, band: Band, next: FablesScene): Promise<Drawn> {
  const look = await read($, style)
  const key = `${band.box.width}x${band.box.height}|${look}`
  const same = JSON.stringify(next)
  const kept = band.drawn
  if (kept?.scene === same && kept.key === key) return kept
  const at = kept?.scene === same ? kept.at : await $.clock.now()
  band.drawn = { scene: same, at, key, base: sceneToSvg(next, { ...band.box, look, figure: FIGURE }) }
  return band.drawn
}

/** The demo while it plays, held where the hooks and the helpers below both reach it. */
type Showing = { demo?: Demo; shuffle?: boolean }

/** Puts the demo's `step` up: its look (for this session only) and its scene. */
async function demoShow($: EngineInterface, showing: Showing, step: number) {
  const { demo } = showing
  if (!demo) return
  demo.step = step
  demo.until = (await $.clock.now()) + DEMO_STEP_MS
  await update($, style, () => LOOK_NAMES[step] ?? DEFAULT_LOOK)
  await update($, scene, () => demoScene(step))
}

/** Ends the demo and gives the person's own look back. */
async function demoEnd($: EngineInterface, showing: Showing) {
  const { demo } = showing
  if (!demo) return
  showing.demo = undefined
  await update($, style, () => demo.restore)
  await update($, scene, () => null)
}

export const register: Register = (on, options) => {
  const n = new Director()
  const band: Band = { box: bandBox(NaN) }
  const term: Term = { columns: 0, rows: 0, at: 0, look: DEFAULT_LOOK }
  const showing: Showing = {}
  const hires = newHires()
  // The config menu's choice is the default; /fables model overrides it.
  const configured = findModel(options.model) ?? DEFAULT_MODEL
  // The config menu's terminal art: half-block cells unless hi-res is asked for.
  const hiresWanted = options.terminalArt === 'hires'
  n.model = configured
  n.look = DEFAULT_LOOK
  // The band goes when the work does: no closing scene, and the last scene clears once it has been read.
  n.closes = false
  n.lingerMs = 0

  on('session.start', async ($, e, next) => {
    n.isOn = (await $.store.get(STORE_ENABLED)) !== false
    n.model = findModel(await $.store.get(STORE_MODEL)) ?? configured
    await update($, enabled, () => n.isOn)
    const saved = await $.store.get(STORE_STYLE)
    // Pixel art was once a switch of its own: someone who turned it off keeps the original look, drawn smooth.
    const smooth = (await $.store.get(STORE_PIXEL)) === false
    showing.shuffle = saved === SHUFFLE
    n.look = typeof saved === 'string' && LOOKS[saved] ? saved : smooth ? 'original' : DEFAULT_LOOK
    await update($, style, () => (showing.shuffle ? shuffled(n.look) : n.look))
    await $.command.register({
      name: 'fables',
      description: 'Claude Fables: turn the cartoons above the prompt on or off, pick a style, or pick the model that writes them',
      argumentHint: '[on|off|demo [stop]|style [name|shuffle|off]|model [sonnet|haiku]]',
    })
    $.clock.every(1000, async () => {
      // While the demo plays, the narrator waits; what Claude does meanwhile is still told after.
      const { demo } = showing
      if (!demo) return void n.tick(host($, band, showing))
      if ((await $.clock.now()) < demo.until) return
      if (demo.step + 1 < LOOK_NAMES.length) await demoShow($, showing, demo.step + 1)
      else await demoEnd($, showing)
    })
    // Hi-res, where the terminal draws pictures: the cartoon is the desktop's own, played in headless Chrome.
    const surfaces: readonly string[] = await $.session.surfaces().catch(() => [])
    const mode = hiresWanted && surfaces.includes('terminal') ? await pictureMode($) : undefined
    if (mode) {
      const showFrame = async (frame: Frame) => {
        // Inside tmux the helper lays its frames over the band itself.
        if (hires.mode === 'overlay') return
        const { site } = hires
        // The half-block band is up until the first frame: draw the band again to put the picture in.
        if (!site) return $.ui.invalidate('ui.render')
        const done = await $.ui
          .blit({ ...site, key: IMAGE_KEY, source: { file: frame.path, format: 'png', generation: frame.generation } })
          .catch((err: unknown) => ({ deny: String(err) }))
        if (!('deny' in done) || done.deny === undefined) return
        hires.site = undefined
        // A terminal that shows the alt instead, or cannot read the file, keeps the half-block band.
        if (/alt|placeholder|read/i.test(done.deny)) {
          $.ui.log(`fables: hi-res frames refused (${done.deny}); drawing in cells`, { to: 'debug' })
          hires.state = 'failed'
          $.ui.invalidate('ui.render')
        }
      }
      await startHires($, hires, mode, frame => void showFrame(frame), () => $.ui.invalidate('ui.render'))
    }
    // The terminal's cartoon plays by repainting its Raster in place.
    $.clock.every(TERM_FRAME_MS, async () => {
      const { requestId, scene: current } = term
      if (!requestId || !current) return
      const done = await $.ui
        .blit({ requestId, key: RASTER_KEY, cells: termCells(term, current, await $.clock.now()) })
        .catch(() => ({ deny: 'failed' }))
      // Gone (unmounted, cleared, resized): stop until the band is drawn again.
      if ('deny' in done && done.deny !== undefined) term.requestId = undefined
    })
    return next(e)
  })

  on('command.run', { command: 'fables' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const dm = /^demo\b\s*(.*)$/.exec(arg)
    if (dm) {
      if (/^(stop|off|end|quit)$/.test((dm[1] ?? '').trim())) {
        if (!showing.demo) return { text: 'No demo is playing.' }
        await demoEnd($, showing)
        return { text: `Demo stopped; scenes are drawn in ${showing.shuffle ? 'shuffled styles' : lookFor(n.look).label} again.` }
      }
      showing.demo = { step: 0, until: 0, restore: showing.demo?.restore ?? (await read($, style)) }
      await demoShow($, showing, 0)
      const seconds = (LOOK_NAMES.length * DEMO_STEP_MS) / 1000
      return { text: `Playing every style, ${DEMO_STEP_MS / 1000}s each (about ${seconds}s). /fables demo stop ends it; your style comes back after.` }
    }
    const md = /^(?:model|models|narrator)\b\s*(.*)$/.exec(arg)
    if (md) {
      const want = (md[1] ?? '').trim()
      if (!want) {
        const list = NARRATOR_MODELS.map(m => `${m === n.model ? '▸' : ' '} ${m} · ${MODEL_LABELS[m]}`).join('\n')
        return { text: `${MODEL_LABELS[n.model]} writes the story. Pick another with /fables model <name>:\n${list}` }
      }
      const model = findModel(want)
      if (!model) return { text: `No narrator called "${want}". Try /fables model sonnet or /fables model haiku.` }
      return chooseModel($, n, model)
    }
    const st = /^(?:style|styles|look)\b\s*(.*)$/.exec(arg)
    if (st) {
      const want = (st[1] ?? '').trim()
      if (!want) {
        const list = [
          ...LOOK_NAMES.map(name => `${!showing.shuffle && name === n.look ? '▸' : ' '} ${name} · ${lookFor(name).label}`),
          `${showing.shuffle ? '▸' : ' '} ${SHUFFLE} · a random style for each new scene`,
        ].join('\n')
        const now = showing.shuffle ? 'a style picked at random for each scene' : lookFor(n.look).label
        return { text: `Scenes are drawn in ${now}. Pick a style with /fables style <name>, or /fables style off for the default:\n${list}` }
      }
      if (/^(shuffle|random|surprise)( me)?$/.test(want)) return chooseShuffle($, n, showing)
      const look = /^(off|none|default|plain)$/.test(want) ? lookFor(DEFAULT_LOOK) : findLook(want)
      if (!look) return { text: `No style called "${want}". /fables style lists them.` }
      return chooseLook($, n, showing, look.name)
    }
    // Pixel art is a style now; the old switch still works, as a way to pick it or the smooth original.
    const px = /^pixel(?:\s+(on|off))?$/.exec(arg)
    if (px) return chooseLook($, n, showing, px[1] === 'off' || (!px[1] && n.look === 'pixel') ? 'original' : 'pixel')
    const value = arg === 'on' ? true : arg === 'off' ? false : !n.isOn
    await setOn($, n, host($, band, showing), value)
    return {
      text: value
        ? `Claude Fables is on: cartoons written by ${MODEL_LABELS[n.model]} play above the prompt while Claude works.`
        : 'Claude Fables is off.',
    }
  })

  // A turn starts with the model, not the prompt: a local slash command is
  // submitted as a prompt too but never completes a turn, and would leave the
  // band up for good. A continued turn has no text of its own, and keeps the ask.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) n.submit(e.text || n.ask)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const tool = String(e.tool)
    const isTold = e.agentId === undefined && !tool.startsWith(OWN_TOOLS)
    if (isTold) n.tool(tool, e)
    const ran = await next(e)
    if (isTold && (ran.deny !== undefined || ran.isError === true)) n.failed(tool, e)
    return ran
  })

  on('session.append', async ($, e, next) => {
    if (e.door === 'response' && e.agentId === undefined && Array.isArray(e.message.content)) {
      const said = e.message.content
        .map(block => (block.type === 'text' ? block.text : ''))
        .join(' ')
        .trim()
      n.said(said)
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) n.complete(e.reason)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (e.surface !== 'desktop' && e.surface !== 'terminal')) return next(e)
    const current = await read($, scene)
    if (!current || (!showing.demo && !(await read($, enabled)))) {
      if (e.surface === 'terminal') {
        term.requestId = undefined
        hires.site = undefined
        await idle($, hires)
      }
      return next(e)
    }
    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      const { columns, rows } = termBox(e.props.bodyColumns, e.props.maxRows)
      const now = await $.clock.now()
      const key = JSON.stringify(current)
      // A redraw of the scene that is up carries on from where it was.
      if (key !== term.key) Object.assign(term, { key, at: now })
      Object.assign(term, { requestId: e.requestId, columns, rows, scene: current, look: await read($, style) })
      if (hires.state === 'ready') {
        await sendScene($, hires, current, term.look, columns, rows, term.at)
        if (hires.mode === 'overlay') {
          term.requestId = undefined
          return <Raster key={BLANK_KEY} columns={columns} rows={rows} cells={blankCells(columns, rows)} />
        }
        // Until the scene's first frame comes, the last one shows, or the cells for the very first.
        const { frame } = hires
        if (frame) {
          const { Image } = $.ui.resolve(e)
          term.requestId = undefined
          hires.site = { requestId: e.requestId, columns, rows }
          return (
            <Image
              key={IMAGE_KEY}
              source={{ file: frame.path, format: 'png', generation: frame.generation }}
              columns={columns}
              rows={rows}
              alt={current.caption || ' '}
            />
          )
        }
      }
      hires.site = undefined
      return <Raster key={RASTER_KEY} columns={columns} rows={rows} cells={termCells(term, current, now)} />
    }
    const { Svg } = $.ui.resolve(e)
    // The interactive frame does not size itself from the markup (left alone it
    // is a 300x150 box), so give it the band's box; a new width draws anew.
    band.box = bandBox(e.props.bodyColumns)
    const { width, height } = band.box
    const { base, at } = await draw($, band, current)
    // To a tenth of a second, so drawings in the same moment stay the same.
    const along = Math.floor(((await $.clock.now()) - at) / 100) / 10
    const resumed = resumeAt(base, along)
    return (
      <Svg
        source={resumed.length <= MAX_SVG ? resumed : base}
        alt={current.caption}
        width={width}
        height={height}
        isInteractive
      />
    )
  })
}

/**
 * Renders the README's animations to assets/: the hero (every style in turn,
 * each with an action and a line of its own), a scene for each section, and a
 * still of every style. Each is the mod's own drawing at the band's size,
 * stepped frame by frame in headless Chromium and encoded with ffmpeg.
 *
 *   bun scripts/readme-gifs.ts            # every image
 *   bun scripts/readme-gifs.ts use hero   # only these
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import { lookFor } from '../hooks/looks'
import { parseScene } from '../hooks/scene'
import { sceneToSvg } from '../hooks/svg'

const PLAYWRIGHT = process.env.PLAYWRIGHT_MODULE ?? '/opt/node22/lib/node_modules/playwright/index.mjs'
const ROOT = join(import.meta.dir, '..')
const ASSETS = join(ROOT, 'assets')
const WORK = join(ROOT, 'video', 'out', 'gifs')
/** The band as the app shows it: the default stage, 192 px tall. */
const BOX = { width: 960, height: 192 }
const FPS = 15

type Raw = Record<string, unknown>
/** One scene of a GIF: `skip` seconds into its own clock when it cuts in, shown for `dur` seconds. */
type Shot = { look: string; raw: Raw; dur: number; skip?: number }

/** A small seeded shuffle, so a re-render makes the same pictures. */
function shuffled<T>(list: readonly T[], seed: number): T[] {
  const out = [...list]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

// ── the hero: every style, each with a move and a line from the pool ──
const MOVES: Raw[] = [
  { backdrop: 'city', hero: { action: 'run', from: 10, to: 46 } },
  { backdrop: 'forest', hero: { action: 'dance', from: 44, to: 44 } },
  { backdrop: 'space', hero: { action: 'fly', from: 18, to: 46 } },
  { backdrop: 'desert', hero: { action: 'jump', from: 30, to: 50 } },
  { backdrop: 'night', hero: { action: 'spin', from: 44, to: 44 } },
  { backdrop: 'volcano', hero: { action: 'dig', from: 42, to: 42 } },
  { backdrop: 'lab', hero: { action: 'inspect', from: 40, to: 40 } },
  { backdrop: 'city', hero: { action: 'celebrate', from: 44, to: 44 } },
  { backdrop: 'forest', hero: { action: 'sneak', from: 30, to: 46 } },
  { backdrop: 'desert', hero: { action: 'carry', from: 28, to: 48 } },
  { backdrop: 'night', hero: { action: 'wave', from: 46, to: 46 } },
  { backdrop: 'city', hero: { action: 'spin', from: 44, to: 44 } },
]
const LINES = [
  'Off to fix the build. Hold my coffee!',
  'Refactoring utils.ts. It had it coming.',
  'Grep found 12 matches. Suspicious.',
  'All 42 tests pass. \\o/',
  'A wild TypeError appears! >_<',
  'Reading parseHex(). Slowly. Lovingly.',
  'Renaming things is the hard part.',
  'One more `npm test`, for luck.',
  'This regex is fine. Probably. ^_^',
  'Moving 3 files into src/lib/',
  'Lint is clean. Time for a snack.',
  'Shipping v2.0. Party like it is 1999.',
]
const LOOK_ORDER = ['pixel', 'original', 'cave', 'blueprint', 'mosaic', 'aero', 'engraving', 'tapestry', 'golden', 'ukiyoe', 'kamon', 'chrome', 'blackfigure', 'heraldry', 'delft', 'atlas', 'chrono', 'nouveau', 'cubism', 'bauhaus', 'tattoo', 'midcentury', 'opart', 'popart', 'contour', 'pin', 'glyphs', 'blob', 'phosphor', 'density', 'field', 'teletext', 'maze', 'poem', 'tomb', 'glass', 'initial']
const HERO: Shot[] = LOOK_ORDER.map((look, i) => ({
  look,
  // More looks than moves or lines: each list comes round again.
  raw: { ...shuffled(MOVES, 5)[i % MOVES.length]!, caption: shuffled(LINES, 11)[i % LINES.length]!, title: lookFor(look).label },
  dur: 2.2,
  skip: 0.15,
}))

// ── a scene for each section ──
const solo = (raw: Raw, dur = 4.5): Shot[] => [{ look: 'pixel', raw, dur }]
const GIFS: Record<string, Shot[]> = {
  hero: HERO,
  'how-it-works': solo({ backdrop: 'lab', hero: { action: 'inspect', from: 38, to: 38 }, caption: 'Reading the activity log. 14 lines, all suspicious.', title: 'how it works' }),
  install: solo({ backdrop: 'desert', hero: { action: 'carry', from: 12, to: 44 }, caption: 'Moving into ~/code/Claude-Fables...', title: 'install' }),
  use: solo({ backdrop: 'forest', hero: { action: 'wave', from: 44, to: 44 }, particles: { kind: 'leaves', density: 0.4 }, caption: '`/fables on`, and hello! ^_^', title: 'use' }),
  scenes: [
    { backdrop: 'forest', hero: { action: 'sneak', from: 30, to: 44 }, particles: { kind: 'leaves', density: 0.3 }, caption: 'Dawn in an old forest.' },
    { backdrop: 'space', hero: { action: 'fly', from: 26, to: 44 }, particles: { kind: 'stars', density: 0.6 }, caption: 'Earthrise over the outpost.' },
    { backdrop: 'city', hero: { action: 'run', from: 18, to: 46 }, particles: { kind: 'rain', density: 0.4 }, caption: 'Blue hour after rain.' },
    { backdrop: 'desert', hero: { action: 'walk', from: 34, to: 46 }, caption: 'Mesa sunset.' },
    { backdrop: 'volcano', hero: { action: 'panic', from: 42, to: 42 }, particles: { kind: 'sparks', density: 0.5 }, caption: 'A night eruption!' },
    { backdrop: 'lab', hero: { action: 'think', from: 40, to: 40 }, caption: 'Working late.' },
    { backdrop: 'night', hero: { action: 'sleep', from: 44, to: 44 }, particles: { kind: 'stars', density: 0.5 }, caption: 'A sleeping village. zzz' },
  ].map(raw => ({ look: 'pixel', raw: { ...raw, title: 'the scenes' }, dur: 2.2, skip: 0.15 })),
  captions: solo({ backdrop: 'city', hero: { action: 'point', from: 36, to: 36 }, caption: '`npm test` on dates.ts: 42/42 passed, 0 failed \\o/', tone: 'milestone', title: 'captions' }),
  develop: solo({ backdrop: 'volcano', hero: { action: 'dig', from: 40, to: 40 }, particles: { kind: 'sparks', density: 0.4 }, caption: 'Digging through scripts/rehearse.ts', title: 'develop' }),
  cloud: solo({ backdrop: 'space', hero: { action: 'fly', from: 14, to: 44 }, particles: { kind: 'stars', density: 0.7 }, caption: 'Built entirely in the cloud. Bugs may lurk.', title: 'heads up' }),
}

function svgFor(shot: Shot, box = BOX): string {
  const scene = parseScene(shot.raw)
  if (!scene) throw new Error(`parseScene rejected: ${JSON.stringify(shot.raw)}`)
  if (scene.caption !== shot.raw.caption) throw new Error(`caption would be cut to "${scene.caption}"`)
  if (shot.raw.title && scene.title !== shot.raw.title) throw new Error(`title would be cut to "${scene.title}"`)
  return sceneToSvg(scene, { ...box, look: shot.look, figure: '3d' })
}

const ffmpeg = (args: string[]) => {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`ffmpeg ${args.join(' ')}`)
}

async function main() {
  const wanted = process.argv.slice(2)
  mkdirSync(ASSETS, { recursive: true })
  const { chromium } = await import(PLAYWRIGHT)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: BOX, deviceScaleFactor: 1 })

  for (const [name, shots] of Object.entries(GIFS)) {
    if (wanted.length && !wanted.includes(name) && !(name === 'hero' && wanted.includes('styles'))) continue
    const dir = join(WORK, name)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    let frame = 0
    for (const shot of shots) {
      await page.setContent(`<body style="margin:0;overflow:hidden;background:#0b0b10">${svgFor(shot)}</body>`)
      await page.evaluate(() => document.querySelector('svg')!.pauseAnimations())
      for (let i = 0; i < Math.round(shot.dur * FPS); i++) {
        await page.evaluate((t: number) => document.querySelector('svg')!.setCurrentTime(t), (shot.skip ?? 0) + i / FPS)
        await page.screenshot({ path: join(dir, `${String(frame++).padStart(4, '0')}.png`) })
      }
    }
    const out = join(ASSETS, name === 'hero' ? 'styles.gif' : `${name}.gif`)
    const input = ['-framerate', String(FPS), '-i', join(dir, '%04d.png')]
    ffmpeg([...input, '-vf', 'palettegen=stats_mode=diff:max_colors=192', join(dir, 'palette.png')])
    ffmpeg([...input, '-i', join(dir, 'palette.png'), '-lavfi', 'paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', out])
    console.log(`${out} (${frame} frames)`)
  }

  // Every style, still: one tile each, labelled, two to a row.
  if (!wanted.length || wanted.includes('grid')) {
    const tile = { width: 640, height: 128 }
    const tiles = HERO.map(
      shot =>
        `<figure><iframe width="${tile.width}" height="${tile.height}" srcdoc="${svgFor(shot, tile).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></iframe><figcaption>${lookFor(shot.look).label}<code>/fables style ${shot.look}</code></figcaption></figure>`,
    )
    const grid = await browser.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 1 })
    await grid.setContent(`<style>
body{margin:0;padding:12px;background:#151413;font:600 15px/1.2 'DejaVu Sans',sans-serif;color:#ece7da;display:grid;grid-template-columns:repeat(2,640px);gap:14px 16px}
figure{margin:0}iframe{border:0;display:block;border-radius:6px}
figcaption{margin-top:6px;display:flex;justify-content:space-between}code{color:#d97757;font:500 13px 'DejaVu Sans Mono',monospace}
</style>${tiles.join('')}`)
    await grid.waitForLoadState('load')
    await grid.evaluate(async () => {
      for (const f of document.querySelectorAll('iframe')) {
        const svg = f.contentDocument!.querySelector('svg')!
        svg.pauseAnimations()
        svg.setCurrentTime(1.6)
      }
    })
    const out = join(ASSETS, 'styles-grid.png')
    await grid.screenshot({ path: out, fullPage: true })
    console.log(out)
  }
  await browser.close()
}

await main()

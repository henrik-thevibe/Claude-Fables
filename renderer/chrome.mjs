/**
 * The terminal's hi-res renderer. The terminal has no Svg, but kitty and Ghostty
 * draw pictures, so this helper plays each scene's own SVG in headless Chrome
 * (SMIL and all) and streams its frames as PNG files the band shows in an Image.
 *
 *   node renderer/chrome.mjs
 *
 * No dependencies: Chrome is driven over its DevTools protocol, on a pipe of
 * its own. It talks to the mod through files and lines:
 *
 *   stdout  `ready <dir>`                     once Chrome is up; scenes go in <dir>
 *           `frame <seq> <path> <generation>` each new frame, a whole PNG at <path>
 *           `error <message>`                 then it exits
 *   <dir>/scene.json  { seq, svg, width, height, scale, at } plays a scene, `at`
 *                     the epoch ms its clock started; { seq, idle: true } stops.
 *                     With `overlay: { columns, rows }`, inside tmux, each frame
 *                     is also laid over the band on screen (tmux.mjs)
 *
 * It exits with the mod (its parent) and takes Chrome with it.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, watch, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

import * as overlay from './tmux.mjs'

/** Frames a second at most. */
const FPS = Number(process.env.FABLES_FPS) || 8

const CHROMES = [
  process.env.FABLES_CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

const say = line => process.stdout.write(line + '\n')
const dir = mkdtempSync(join(tmpdir(), 'fables-'))
let chrome

function quit(code = 0) {
  overlay.clearNow()
  try {
    chrome?.kill('SIGKILL')
  } catch {}
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {}
  process.exit(code)
}
function fail(message) {
  say(`error ${String(message).replace(/\s+/g, ' ')}`)
  quit(1)
}
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(sig, () => quit(0))
process.on('uncaughtException', e => fail(e?.message ?? e))
// The mod's loop is our life: when its process goes, so do we.
const parent = process.ppid
setInterval(() => {
  try {
    process.kill(parent, 0)
  } catch {
    quit(0)
  }
}, 2000).unref()

// ---------------------------------------------------------------- Chrome

const exe = CHROMES.find(p => existsSync(p))
if (!exe) fail('no Chrome found; set FABLES_CHROME to its executable')

const profile = join(dir, 'profile')
// Driven over a pipe of its own (fds 3 and 4), not a debugging port: nothing
// else on the machine can reach this browser.
chrome = spawn(
  exe,
  [
    '--headless=new',
    '--remote-debugging-pipe',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--mute-audio',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] },
)
chrome.on('exit', () => fail('Chrome exited'))

const [toChrome, fromChrome] = [chrome.stdio[3], chrome.stdio[4]]
let nextId = 0
let session
const pending = new Map()
const listeners = new Map()
// Messages each end with a NUL byte.
let inbox = ''
fromChrome.setEncoding('utf8')
fromChrome.on('data', chunk => {
  inbox += chunk
  let end
  while ((end = inbox.indexOf('\0')) >= 0) {
    const msg = JSON.parse(inbox.slice(0, end))
    inbox = inbox.slice(end + 1)
    if (msg.id !== undefined) {
      const p = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) p?.reject(new Error(msg.error.message))
      else p?.resolve(msg.result)
    } else if (msg.sessionId === session) listeners.get(msg.method)?.(msg.params)
  }
})
fromChrome.on('close', () => fail('lost Chrome'))
/** A command to the page, or with `{ browser: true }` to the browser itself. */
const send = (method, params = {}, { browser = false } = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    toChrome.write(JSON.stringify({ id, method, params, ...(browser ? {} : { sessionId: session }) }) + '\0')
  })

const { targetInfos } = await send('Target.getTargets', {}, { browser: true })
const page = targetInfos.find(t => t.type === 'page')
const targetId = page ? page.targetId : (await send('Target.createTarget', { url: 'about:blank' }, { browser: true })).targetId
session = (await send('Target.attachToTarget', { targetId, flatten: true }, { browser: true })).sessionId

await send('Page.enable')
await send('Runtime.enable')
// Transparent where the scene leaves the box bare, though every backdrop fills it.
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })

// ---------------------------------------------------------------- scenes

let playing = { seq: -1 }
let generation = 0

/** Shoots the page while `scene` plays, at most FPS a second; a new scene ends the loop. */
async function shoot(scene) {
  while (playing === scene) {
    const started = Date.now()
    // The timeline is paused, so Chrome draws only the frames shot: each one set to the scene's own clock first.
    await seek(scene)
    const shot = await send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true }).catch(() => undefined)
    if (playing !== scene) return
    if (shot?.data) {
      generation++
      // Two paths in turn, each written whole then renamed in: the terminal never reads half a PNG.
      const path = join(dir, `frame-${generation % 2}.png`)
      writeFileSync(`${path}.tmp`, Buffer.from(shot.data, 'base64'))
      renameSync(`${path}.tmp`, path)
      say(`frame ${scene.seq} ${path} ${generation}`)
      if (scene.overlay && overlay.inTmux()) await overlay.show(path, scene.overlay.columns, scene.overlay.rows)
    }
    await sleep(Math.max(5, 1000 / FPS - (Date.now() - started)))
  }
}

/** Sets the scene to its own clock: it went up `at`, and carries on from there. */
function seek(scene) {
  const along = Math.max(0, (Date.now() - (scene.at || Date.now())) / 1000)
  return send('Runtime.evaluate', { expression: `document.querySelector('svg')?.setCurrentTime?.(${along})` }).catch(() => {})
}

async function play(scene) {
  if (scene.seq === playing.seq) return
  playing = { seq: scene.seq }
  if (scene.idle) {
    await overlay.clear()
    await send('Page.navigate', { url: 'about:blank' }).catch(() => {})
    return
  }
  const { width, height } = scene
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scene.scale || 2, mobile: false })
  const html = join(dir, 'scene.html')
  writeFileSync(
    html,
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden;background:transparent}svg{display:block}</style>${scene.svg}`,
  )
  const loaded = new Promise(resolve => listeners.set('Page.loadEventFired', resolve))
  await send('Page.navigate', { url: `file://${html}` })
  await loaded
  await send('Runtime.evaluate', { expression: `document.querySelector('svg')?.pauseAnimations?.()` })
  if (playing.seq !== scene.seq) return
  playing = scene
  void shoot(scene)
}

const sceneFile = join(dir, 'scene.json')
let busy = false
let again = false
async function check() {
  if (busy) return void (again = true)
  busy = true
  try {
    do {
      again = false
      let scene
      try {
        scene = JSON.parse(readFileSync(sceneFile, 'utf8'))
      } catch {
        continue // not there yet, or half written: the next change reads it
      }
      await play(scene)
    } while (again)
  } finally {
    busy = false
  }
}
watch(dir, (_, name) => {
  if (name === 'scene.json') void check()
})
// A watch can miss a change on some file systems; a slow look-in catches it.
setInterval(() => void check(), 500)

if (overlay.inTmux()) overlay.watchShown()
say(`ready ${dir}`)

/**
 * The picture inside tmux. Claude Code draws no Image there, and refuses the
 * private-use character kitty's placeholders need, so this lays each frame
 * over the band from outside: the band is a block of blank braille cells
 * (U+2800, which the mod draws and nothing else does), found with
 * `tmux capture-pane`, and the frame is placed on top of it at the terminal's
 * own coordinates, through tmux's passthrough, by kitty's graphics protocol.
 *
 * tmux knows nothing of the picture, so it is placed again with every frame
 * (which also follows the band when the transcript scrolls under it) and
 * deleted the moment the pane leaves the screen, straight on the terminal's
 * tty, since tmux passes nothing through from a pane it is not showing.
 */
import { execFile, execFileSync } from 'node:child_process'
import { openSync, closeSync, writeSync } from 'node:fs'

import { bandIn, CLIENTS_FORMAT, PANE_FORMAT, placeOf } from './place.mjs'

const ESC = '\x1b'
const PANE = process.env.TMUX_PANE
/** Ours alone among the terminal's pictures: snacks and the rest pick small ids. */
const ID = 0x40000000 + Math.floor(Math.random() * 0x3fffffff)

export const inTmux = () => !!(process.env.TMUX && PANE)

const tmux = (...args) =>
  new Promise(resolve =>
    execFile('tmux', args, { timeout: 2000 }, (err, stdout) => resolve(err ? undefined : stdout.toString())),
  )

function write(tty, text) {
  let fd
  try {
    fd = openSync(tty, 'w')
    writeSync(fd, text)
  } catch {
    // gone (a pane closed, a client detached): nothing to draw on
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
}

const graphics = (keys, payload = '') => `${ESC}_G${keys}${payload ? `;${payload}` : ''}${ESC}\\`
/** Wrapped for tmux: it hands the inside to the terminal untouched. */
const passthrough = text => `${ESC}Ptmux;${text.replaceAll(ESC, ESC + ESC)}${ESC}\\`

async function where() {
  const pane = await tmux('display', '-p', '-t', PANE, PANE_FORMAT)
  return pane ? placeOf(pane, (await tmux('list-clients', '-F', CLIENTS_FORMAT)) ?? '') : undefined
}

async function findBand(columns) {
  const text = await tmux('capture-pane', '-p', '-t', PANE)
  return text ? bandIn(text, columns) : undefined
}

/**
 * The pane's own allow-passthrough, as it was before the first picture: put
 * back when the helper goes. Undefined until then; '' when the pane had none.
 */
let before

/** Lets the pane pass the pictures through to the terminal, the first time one is drawn. */
function enablePassthrough() {
  if (before !== undefined) return
  try {
    before = execFileSync('tmux', ['show', '-p', '-v', '-t', PANE, 'allow-passthrough'], { timeout: 2000 }).toString().trim()
    // `on` or `all` already lets the pictures through; anything else, or nothing set on the pane, is turned on.
    if (before !== 'on' && before !== 'all') execFileSync('tmux', ['set', '-p', '-t', PANE, 'allow-passthrough', 'on'], { timeout: 2000 })
  } catch {
    before = ''
  }
}

/** Gives the pane its own allow-passthrough back. */
function restorePassthrough() {
  if (before === undefined || before === 'on' || before === 'all') return
  try {
    execFileSync('tmux', before ? ['set', '-p', '-t', PANE, 'allow-passthrough', before] : ['set', '-p', '-u', '-t', PANE, 'allow-passthrough'], { timeout: 2000 })
  } catch {
    // the pane is gone, and its options with it
  }
  before = undefined
}

let placed // the ttys the picture is up on, while it is
let serial = Promise.resolve()

/** Lays `png` over the band, `columns` by `rows` cells, or takes it down if the band is not on screen. */
export function show(png, columns, rows) {
  serial = serial.then(async () => {
    const at = await where()
    const band = at?.shown ? await findBand(columns) : undefined
    if (!at || !band) return hide(at)
    enablePassthrough()
    const cmd =
      `${ESC}7${ESC}[${at.top + band.y + 1};${at.left + band.x + 1}H` +
      graphics(`a=T,f=100,t=f,i=${ID},p=1,c=${columns},r=${Math.min(rows, band.rows)},C=1,q=2`, Buffer.from(png).toString('base64')) +
      `${ESC}8`
    write(at.tty, passthrough(cmd))
    placed = at.clients
  })
  return serial
}

/** Takes the picture down wherever it is up: straight on each terminal, which tmux may no longer pass to. */
function hide(at) {
  if (!placed) return
  for (const tty of at?.clients ?? placed) write(tty, graphics(`a=d,d=I,i=${ID},q=2`))
  placed = undefined
}

export function clear() {
  serial = serial.then(async () => hide(await where()))
  return serial
}

/** At exit, synchronously: the picture must not outlive the helper, nor the pane's passthrough. */
export function clearNow() {
  if (placed) for (const tty of placed) write(tty, graphics(`a=d,d=I,i=${ID},q=2`))
  placed = undefined
  restorePassthrough()
}

/** Watches for the pane leaving the screen between frames: a window switch, a detach, a zoom. */
export function watchShown() {
  setInterval(() => {
    if (!placed) return
    void where().then(at => {
      if (!at?.shown) serial = serial.then(() => hide(at))
    })
  }, 200).unref()
}

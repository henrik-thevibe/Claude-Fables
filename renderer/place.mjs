/**
 * The tmux overlay's arithmetic, apart from tmux itself so it can be tested:
 * where a pane sits on the terminal, and where the band sits in the pane.
 */

/** Blank braille: what the band is drawn in while a picture is laid over it, and what nothing else draws. */
export const BLANK = '\u2800'

export const PANE_FORMAT =
  '#{pane_tty}\t#{pane_top}\t#{pane_left}\t#{window_id}\t#{status}\t#{status-position}\t#{window_zoomed_flag}\t#{pane_active}'
export const CLIENTS_FORMAT = '#{client_tty}\t#{window_id}'

/**
 * Where the pane is on the terminal, whether a client shows it, and on which
 * ttys, from tmux's answers to PANE_FORMAT and CLIENTS_FORMAT.
 */
export function placeOf(paneLine, clientLines) {
  const [tty, top, left, window, status, position, zoomed, active] = paneLine.trim().split('\t')
  const clients = clientLines
    .split('\n')
    .filter(Boolean)
    .map(line => line.split('\t'))
  const lines = status === 'off' ? 0 : /^\d+$/.test(status) ? Number(status) : 1
  return {
    tty,
    // The pane's first row on the terminal: the status line above it, when it sits on top.
    top: Number(top) + (position === 'top' ? lines : 0),
    left: Number(left),
    // A zoomed window shows its active pane alone.
    shown: clients.some(([, w]) => w === window) && (zoomed !== '1' || active === '1'),
    clients: clients.map(([t]) => t),
  }
}

/** The band in a capture of the pane: the first row of blank braille `columns` long, and the rows of it below. */
export function bandIn(text, columns) {
  const lines = text.split('\n')
  const run = BLANK.repeat(Math.min(columns, 12))
  const y = lines.findIndex(line => line.includes(run))
  if (y < 0) return undefined
  const x = [...lines[y].slice(0, lines[y].indexOf(BLANK))].length
  let rows = 0
  while (y + rows < lines.length && lines[y + rows].includes(run)) rows++
  return { x, y, rows }
}

/** Types for place.mjs, which the helper runs as plain JavaScript. */

export declare const BLANK: string
export declare const PANE_FORMAT: string
export declare const CLIENTS_FORMAT: string

/** Where the pane is on the terminal, whether a client shows it, and on which ttys. */
export declare function placeOf(
  paneLine: string,
  clientLines: string,
): { tty: string; top: number; left: number; shown: boolean; clients: string[] }

/** The band in a capture of the pane, if it is there. */
export declare function bandIn(text: string, columns: number): { x: number; y: number; rows: number } | undefined

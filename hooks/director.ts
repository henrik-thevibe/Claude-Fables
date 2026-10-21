/**
 * The narrator's loop, free of any host: what it remembers, when it asks the
 * model for the next scene, what it does with the reply. The plugin runs it on
 * Claude Code's clock and model (register.tsx); the viewer runs the very same
 * loop on a scripted clock and scripted replies, so a session rehearsed there
 * plays out as it would live.
 */
import type { FablesScene } from '../types'

import { type Activity, pushActivity, summarizeSpeech, summarizeTool } from './activity'
import { backoffMs, buildPrompt, readMs, remember, sceneFromReply, type StoryBeat, SYSTEM } from './narrator'
import { lookFor } from './looks'

/** The models that can write the story: Sonnet by default, Haiku for quicker, cheaper scenes. */
export const NARRATOR_MODELS = ['sonnet', 'haiku'] as const
export type NarratorModel = (typeof NARRATOR_MODELS)[number]
export const DEFAULT_MODEL: NarratorModel = 'sonnet'
export const MODEL_LABELS: Record<NarratorModel, string> = { sonnet: 'Sonnet', haiku: 'Haiku' }

/** A model name as a person might type it, or as an older config holds it, to one of the narrators. */
export function findModel(name: unknown): NarratorModel | undefined {
  const s = typeof name === 'string' ? name.trim().toLowerCase() : ''
  return NARRATOR_MODELS.find(m => s === m || s.startsWith(`claude-${m}`) || s.includes(m))
}

/** How long the last scene of a turn stays up once the turn is over (and at least until it is read). */
export const LINGER_MS = 30000
/** What the model is expected to take to answer until it has been timed, and the bounds of that guess. */
export const FIRST_LATENCY_MS = 3000
const LATENCY_BOUNDS = [1000, 10000] as const

export type Ending = 'answer' | 'aborted' | 'error' | 'refusal'

/** What the narrator asks of the model, as the host's model call takes it. */
export type Ask = { model: NarratorModel; system: string; prompt: string; maxTokens: number; effort: 'low'; timeoutMs: number }
export type Answer = { isAnswered: boolean; text: string }

/** What happens inside the loop, for whoever wants to watch it (the viewer does). */
export type Trace =
  | { kind: 'ask'; at: number; model: NarratorModel; prompt: string; closing?: Ending }
  | { kind: 'reply'; at: number; model: NarratorModel; text: string; isAnswered: boolean; scene: FablesScene | null; isStale: boolean }
  | { kind: 'failed'; at: number; error: string }
  | { kind: 'wait'; at: number; until: number; failures: number }
  | { kind: 'hold'; at: number; until: number }
  | { kind: 'clear'; at: number }

/** The host's side: its clock, its model, and the band the scene goes to. */
export type Host = {
  now(): number | Promise<number>
  complete(ask: Ask): Promise<Answer>
  show(scene: FablesScene | null): void | Promise<void>
  /** How long the scene's bubble waits for Claude to walk into reach before it appears, in ms, as the band draws it. */
  speaksAfter?(scene: FablesScene): number | Promise<number>
  trace?(event: Trace): void
}

/** A scene come back from the model, waiting for its turn on the band. */
type Queued = { scene: FablesScene; closing: Ending | undefined; turn: number }

/** The most scenes that wait at once: the next one, and the turn's closing scene behind it. */
export const MAX_QUEUE = 2

/**
 * The band plays scenes from a queue, one at a time, and each one stays up
 * until its caption has typed out and been read, however the work runs on:
 * nothing cuts in, not a failure, not the turn's end, not the next prompt.
 * The narrator asks for the next scene so it comes back as the one on the
 * band is read through; news (a failure, the turn ending) is asked for at
 * once and waits its turn in the queue.
 */
export class Director {
  model: NarratorModel = DEFAULT_MODEL
  isOn = true
  /** The style scenes are drawn in, so the narrator can write in its voice. */
  look = 'pixel'
  /** Whether a turn's end gets a closing scene; without one, the band clears once the scene up is read. */
  closes = true
  /** How long the turn's last scene stays up once the turn is over and it has been read. */
  lingerMs = LINGER_MS
  ask = ''
  log: Activity[] = []
  story: StoryBeat[] = []
  isTurnRunning = false
  isDirty = false
  isAsking = false
  ending: Ending | undefined = undefined
  nextAt = 0
  failures = 0
  turn = 0
  /** The scene on the band, if any, and when it went up. */
  shown: FablesScene | undefined = undefined
  shownAt = 0
  /** Until then the scene on the band is still being typed out and read: nothing replaces it. */
  readUntil = 0
  /** Scenes come back while the one on the band is still being read, oldest first. */
  queue: Queued[] = []
  /** Something failed since the last ask: the next scene is asked for at once. */
  isUrgent = false
  /** How long the model takes to answer, smoothed, so the next scene is asked for in time to follow on. */
  latency = FIRST_LATENCY_MS

  private note(entry: Activity) {
    this.log = pushActivity(this.log, entry)
    this.isDirty = true
  }

  /**
   * The person asked something: a new turn, a fresh log. The scene on the band
   * is still read through, and a closing scene still waiting plays first; the
   * old turn's other scenes are behind the story now and are dropped.
   */
  submit(text: string) {
    this.turn++
    this.ask = text.replace(/\s+/g, ' ').trim().slice(0, 300)
    this.log = []
    this.ending = undefined
    this.isTurnRunning = true
    this.isDirty = true
    this.isUrgent = false
    this.queue = this.queue.filter(q => q.closing !== undefined)
  }

  /** The agent called a tool. */
  tool(tool: string, input: Readonly<Record<string, unknown>>) {
    this.note({ kind: 'tool', text: summarizeTool(tool, input) })
  }

  /** A tool call was denied or came back an error. */
  failed(tool: string, input: Readonly<Record<string, unknown>>) {
    this.note({ kind: 'failed', text: summarizeTool(tool, input) })
    this.isUrgent = true
  }

  /** The agent said something between its tool calls. */
  said(text: string) {
    const flat = text.trim()
    if (flat) this.note({ kind: 'said', text: summarizeSpeech(flat) })
  }

  /** The turn ended; if anything happened, a closing scene follows. */
  complete(reason: Ending) {
    if (!this.isTurnRunning) return
    this.isTurnRunning = false
    // No closing scene: what is still waiting is behind the story now; the scene up is read through.
    if (!this.closes) this.queue = []
    else if (this.isOn && this.log.length > 0) this.ending = reason
  }

  /**
   * Called once a second, with the host to ask through. Puts the next scene in
   * the queue up once the one on the band has been read, clears the band once
   * the turn is over and its last scene has lingered, and asks for the next
   * scene when there is news.
   */
  async tick(host: Host) {
    if (!this.isOn) return
    const now = await host.now()
    const next = this.queue[0]
    if (next && now >= this.readUntil) await this.present(host, next, now)
    else if (this.isIdle && this.shown && now >= this.readUntil && now >= this.shownAt + this.lingerMs) {
      this.shown = undefined
      await host.show(null)
      host.trace?.({ kind: 'clear', at: now })
    }
    if (this.isAsking) return
    // The closing scene is asked for at once, and may wait behind one other scene.
    if (this.ending) return this.queue.length < MAX_QUEUE ? this.narrate(host, now) : undefined
    if (!this.isTurnRunning || !this.isDirty || this.queue.length > 0) return
    if (now < this.nextAt) return
    if (!this.isUrgent && now < this.readUntil - this.latency) return
    return this.narrate(host, now)
  }

  /** Nothing more to come: the turn is over, and no scene is asked for or waiting. */
  private get isIdle() {
    return !this.isTurnRunning && !this.isAsking && !this.ending && this.queue.length === 0
  }

  private async narrate(host: Host, startedAt: number) {
    this.isAsking = true
    this.isDirty = false
    const forTurn = this.turn
    const closing = this.ending
    this.ending = undefined
    const isUrgent = this.isUrgent || closing !== undefined
    this.isUrgent = false
    // The line the hero will still be saying when this scene comes back: news breaks in on it, in the story.
    const before = this.queue.at(-1)?.scene ?? this.shown
    const isMidLine = this.queue.length > 0 || startedAt + this.latency < this.readUntil
    const interrupts = isUrgent && before && isMidLine ? { why: closing ? ('ended' as const) : ('failed' as const), line: before.caption } : undefined
    const look = lookFor(this.look)
    const prompt = buildPrompt({ ask: this.ask, log: this.log, story: this.story, ending: closing, look: look.voice ? look : undefined, interrupts })
    host.trace?.({ kind: 'ask', at: startedAt, model: this.model, prompt, closing })
    try {
      const reply = await host.complete({ model: this.model, system: SYSTEM, prompt, maxTokens: 2000, effort: 'low', timeoutMs: 30000 })
      const now = await host.now()
      if (reply.isAnswered) {
        const [lo, hi] = LATENCY_BOUNDS
        this.latency = Math.round(Math.min(hi, Math.max(lo, this.latency * 0.6 + (now - startedAt) * 0.4)))
      }
      const drawn = reply.isAnswered ? sceneFromReply(reply.text) : null
      // A scene that lands after a newer turn began belongs to a story nobody is following, unless it closes that story.
      const isStale = forTurn !== this.turn && !closing
      host.trace?.({ kind: 'reply', at: now, model: this.model, text: reply.text, isAnswered: reply.isAnswered, scene: drawn, isStale })
      if (!drawn) {
        this.failures++
        return
      }
      this.failures = 0
      // Without closing scenes, a scene that lands after the turn ended comes too late to tell.
      if (isStale || !this.isOn || (!this.closes && !this.isTurnRunning)) return
      const queued: Queued = { scene: drawn, closing, turn: forTurn }
      // A closing scene goes ahead of any scene of a newer turn already waiting.
      const at = closing ? this.queue.findIndex(q => q.turn > forTurn) : -1
      if (at >= 0) this.queue.splice(at, 0, queued)
      else this.queue.push(queued)
      if (this.queue[0] === queued && now >= this.readUntil) await this.present(host, queued, now)
      else host.trace?.({ kind: 'hold', at: now, until: this.readUntil })
    } catch (err) {
      this.failures++
      host.trace?.({ kind: 'failed', at: await host.now(), error: err instanceof Error ? err.message : String(err) })
    } finally {
      this.isAsking = false
      const now = await host.now()
      this.nextAt = now + backoffMs(this.failures)
      host.trace?.({ kind: 'wait', at: now, until: this.nextAt, failures: this.failures })
    }
  }

  /** Puts the next scene on the band, and holds it there until it has been read. */
  private async present(host: Host, next: Queued, now: number) {
    this.queue = this.queue.filter(q => q !== next)
    // A new setting fades in from the last; the same one carries straight on.
    const scene: FablesScene = this.shown && this.shown.backdrop !== next.scene.backdrop ? { ...next.scene, enter: 'fade' } : next.scene
    this.story = remember(this.story, next.scene)
    this.shown = scene
    this.shownAt = now
    this.readUntil = now + readMs(scene) + ((await host.speaksAfter?.(scene)) ?? 0)
    await host.show(scene)
  }

  /** Turned off: no more asking, and the band is cleared. */
  async setOn(host: Host, value: boolean) {
    this.isOn = value
    if (value) return
    this.queue = []
    this.shown = undefined
    this.readUntil = 0
    await host.show(null)
  }
}

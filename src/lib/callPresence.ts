/**
 * Call-presence rules for the web call (jk_r9_silent_r1 FIX 2).
 *
 * Pure functions + a small timer helper so the decisions are unit-testable
 * (scripts/test_call_presence.mjs) without LiveKit or React.
 *
 * Background: on a pipeline hand-off the AI agent leaves the room BEFORE the IVR
 * audio service joins (it may translate first, ~2 s for non-English). The old rule
 * hung up 1.5 s after the agent left unless the IVR flag was set, and the flag was
 * cleared when the IVR service handed back to a returning agent (R9) — so the next
 * hand-off ended the call before the IVR audio arrived.
 */

/** Grace window after the agent leaves before the browser hangs up. */
export const HANDOFF_GRACE_MS = 8000

/** Participants whose arrival means the call continues (IVR audio or an AI agent). */
export function isHandoffParticipant(identity: string): boolean {
  return identity.startsWith('service-d-audio') || identity.startsWith('agent-')
}

/**
 * IVR-mode flag after the IVR audio service leaves.
 * - Agent present (R9 hand-back): keep the current flag — the hybrid session stays
 *   armed for the next hand-off; only an explicit `ivr_mode:false` resets it.
 * - No agent: the IVR leg is over → false.
 */
export function ivrModeAfterServiceDLeft(current: boolean, agentPresent: boolean): boolean {
  return agentPresent ? current : false
}

export type AgentLeftAction = 'stay' | 'grace'

/**
 * What to do when an `agent-*` participant leaves.
 * - IVR mode armed, or the IVR audio / another agent is already in the room → stay.
 * - Otherwise start the grace window (hang up only if nobody joins in time).
 */
export function onAgentLeft(ivrMode: boolean, remoteIdentities: string[]): AgentLeftAction {
  if (ivrMode) return 'stay'
  if (remoteIdentities.some(isHandoffParticipant)) return 'stay'
  return 'grace'
}

type TimerFns = {
  setTimeoutFn?: (fn: () => void, ms: number) => unknown
  clearTimeoutFn?: (h: unknown) => void
}

/** One-shot cancellable grace timer. `onTimeout` runs at most once per arm(). */
export function createGraceTimer(onTimeout: () => void, ms: number = HANDOFF_GRACE_MS, fns: TimerFns = {}) {
  const setT = fns.setTimeoutFn ?? ((fn: () => void, t: number) => setTimeout(fn, t))
  const clearT = fns.clearTimeoutFn ?? ((h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>))
  let handle: unknown = null
  return {
    arm() {
      if (handle !== null) clearT(handle)
      handle = setT(() => { handle = null; onTimeout() }, ms)
    },
    cancel(): boolean {
      if (handle === null) return false
      clearT(handle)
      handle = null
      return true
    },
    get armed() { return handle !== null },
  }
}

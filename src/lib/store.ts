import { create } from 'zustand'
import type { ExpLevel, RoutingMode, Currency, CallStatus, IntentEvent, CallSession, CumulativeStats, InfraLevel, DeployModel, IntentKey } from '@/types'
import { INTENTS, MODE_RATES } from './data'
import { resolveExp, genSessionId, simLatency } from './utils'

interface Store {
  // settings
  currency: Currency
  baseExp: ExpLevel
  mode: RoutingMode
  // call
  callStatus: CallStatus
  session: CallSession | null
  elapsed: number
  liveCost: number
  // cumulative
  cum: CumulativeStats
  // context bar
  infraLevel: InfraLevel
  deployModel: DeployModel
  // reveal
  revealed: Set<string>
  // ticker
  tickerIdx: number
  // actions
  setCurrency: (c: Currency) => void
  setBaseExp: (e: ExpLevel) => void
  setMode: (m: RoutingMode) => void
  startCall: () => void
  endCall: () => void
  fireIntent: (key: IntentKey) => IntentEvent
  tick: () => void
  reveal: (step: string) => void
  setInfra: (l: InfraLevel) => void
  setDeploy: (m: DeployModel) => void
  nextTicker: () => void
}

export const useStore = create<Store>((set, get) => ({
  currency: 'inr',
  baseExp: 5,
  mode: 'premium',
  callStatus: 'idle',
  session: null,
  elapsed: 0,
  liveCost: 0,
  cum: { calls: 0, intents: 0, totalCost: 0, avgCostPerIntent: 0, avgDurationSec: 0 },
  infraLevel: 'shared',
  deployModel: 'cloud',
  revealed: new Set(),
  tickerIdx: 0,

  setCurrency: (currency) => set({ currency }),
  setBaseExp: (baseExp) => set({ baseExp }),
  setMode: (mode) => set({ mode }),

  startCall: () => {
    const { baseExp, mode } = get()
    set({
      callStatus: 'active',
      elapsed: 0,
      liveCost: 0,
      session: { id: genSessionId(), startedAt: Date.now(), mode, baseExp, events: [], totalCost: 0 },
    })
  },

  endCall: () => {
    const { session, cum, elapsed } = get()
    if (!session) return
    const totalIntents = cum.intents + session.events.length
    const totalCost = cum.totalCost + session.totalCost
    set({
      callStatus: 'ended',
      session: null,
      cum: {
        calls: cum.calls + 1,
        intents: totalIntents,
        totalCost,
        avgCostPerIntent: totalIntents > 0 ? totalCost / totalIntents : 0,
        avgDurationSec: Math.round((cum.avgDurationSec * cum.calls + elapsed) / (cum.calls + 1)),
      },
    })
  },

  fireIntent: (key) => {
    const { session, baseExp, mode } = get()
    const resolvedExp = resolveExp(key, baseExp, mode)
    const cost = MODE_RATES[mode][resolvedExp]
    const latencyMs = simLatency(resolvedExp)
    const event: IntentEvent = {
      key, text: INTENTS[key].text, resolvedExp, cost, latencyMs,
      wasPromoted: resolvedExp < baseExp, timestamp: Date.now(),
    }
    if (session) {
      const updated = { ...session, events: [...session.events, event], totalCost: session.totalCost + cost }
      set({ session: updated, liveCost: updated.totalCost })
    }
    return event
  },

  tick: () => {
    const { session, baseExp, elapsed } = get()
    if (!session) return
    set({ elapsed: elapsed + 1, liveCost: session.totalCost + (MODE_RATES['premium'][baseExp] / 30) * (elapsed + 1) })
  },

  reveal: (step) => set(s => ({ revealed: new Set([...s.revealed, step]) })),
  setInfra: (infraLevel) => set({ infraLevel }),
  setDeploy: (deployModel) => set({ deployModel }),
  nextTicker: () => set(s => ({ tickerIdx: (s.tickerIdx + 1) % 6 })),
}))

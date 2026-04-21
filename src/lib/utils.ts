import type { ExpLevel, RoutingMode, Currency, IntentKey } from '@/types'
import { INTENTS, MODE_RATES, CURRENCY_CONFIG } from './data'

export function formatCost(val: number, currency: Currency, decimals?: number): string {
  const cc = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG[currency.toLowerCase() as Currency] ?? CURRENCY_CONFIG['inr']
  const d = decimals ?? (currency === 'jpy' ? 0 : 2)
  return `${cc.symbol}${(val * cc.rate).toFixed(d)}`
}

export function formatDuration(sec: number): string {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

export function resolveExp(key: IntentKey, base: ExpLevel, mode: RoutingMode): ExpLevel {
  const intent = INTENTS[key]
  if (mode === 'premium')    return base
  if (mode === 'complexity') return Math.min(base, intent.compExp) as ExpLevel
  if (mode === 'sales')      return Math.min(base, intent.salesExp) as ExpLevel
  return Math.min(base, intent.compExp, intent.salesExp) as ExpLevel
}

export function getRate(exp: ExpLevel, mode: RoutingMode): number {
  return MODE_RATES[mode][exp]
}

export function rnd(a: number, b: number): number {
  return Math.round(a + Math.random() * (b - a))
}

export function simLatency(exp: ExpLevel): number {
  const ranges: Record<ExpLevel, [number, number]> = {
    6: [280, 420], 5: [550, 850], 4: [440, 720],
    3: [620, 980], 2: [470, 750], 1: [1050, 1680],
  }
  const [a, b] = ranges[exp]
  return rnd(a, b)
}

export function genSessionId(): string {
  return `hdfc__retail__${Date.now()}`
}

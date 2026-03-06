'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '@/lib/store'
import {
  EXPERIENCES, INTENTS, INTENT_KEYS, MODE_LABELS, MODE_RATES, MODE_COLOR, EXP_COLOR,
  REVEAL_TIMINGS, DEMO_SCENARIOS, JOURNEY_STAGES, CURRENCY_CONFIG, INFRA_CONFIG, DEPLOY_CONFIG,
} from '@/lib/data'
import { formatCost, formatDuration, resolveExp } from '@/lib/utils'
import LiveCallPanel from '@/components/call/LiveCallPanel'
import DemoTimeline from '@/components/demo/DemoTimeline'
import PostCallCelebration from '@/components/demo/PostCallCelebration'
import ConversionCTA from '@/components/demo/ConversionCTA'
import InfraMigrationDemo from '@/components/demo/InfraMigrationDemo'
import { useLiveKitCall } from '@/hooks/useLiveKitCall'
import type { IntentKey, Currency, JourneyStageKey } from '@/types'

interface TxLine { who: 'user' | 'ai' | 'sys'; text: string; meta?: string; ts?: number }

// ── Config ─────────────────────────────────────────────────────────────────
const SERVICE_B_URL = 'http://127.0.0.1:9000'
const TENANT_KEY    = 'hdfc'
const IVR_KEY       = 'retail'

export default function Home() {
  const currency    = useStore(s => s.currency)
  const setCurrency = useStore(s => s.setCurrency)
  const baseExp     = useStore(s => s.baseExp)
  const setBaseExp  = useStore(s => s.setBaseExp)
  const mode        = useStore(s => s.mode)
  const setMode     = useStore(s => s.setMode)
  const callStatus  = useStore(s => s.callStatus)
  const startCall   = useStore(s => s.startCall)
  const endCall     = useStore(s => s.endCall)
  const elapsed     = useStore(s => s.elapsed)
  const tick        = useStore(s => s.tick)
  const reveal      = useStore(s => s.reveal)
  const revealed    = useStore(s => s.revealed)
  const tickerIdx   = useStore(s => s.tickerIdx)
  const nextTicker  = useStore(s => s.nextTicker)
  const cum         = useStore(s => s.cum)

  // ── Demo journey ─────────────────────────────────────────────────────────
  const [demoStep, setDemoStep]                 = useState(0)
  const [scenarioTimes, setScenarioTimes]       = useState<(number|null)[]>(Array(6).fill(null))
  const [demoStartTime, setDemoStartTime]       = useState<number|null>(null)
  const [totalDemoElapsed, setTotalDemoElapsed] = useState(0)
  const [callStartTime, setCallStartTime]       = useState<number|null>(null)
  const [showCelebration, setShowCelebration]   = useState(false)
  const [callEndDuration, setCallEndDuration]   = useState(0)
  const [currencyDropdown, setCurrencyDropdown] = useState(false)
  const [scenarioTransition, setScenarioTransition] = useState(false)
  const [everStarted, setEverStarted]           = useState(false)
  const [transcript, setTranscript]             = useState<TxLine[]>([])
  const [toast, setToast]                       = useState('')
  const [toastOn, setToastOn]                   = useState(false)
  const txRef = useRef<HTMLDivElement>(null)

  // ── LiveKit ───────────────────────────────────────────────────────────────
  const liveCall = useLiveKitCall()

  const scenario        = DEMO_SCENARIOS[demoStep]
  const isInfraDemo     = scenario?.isInfraDemo
  const isLastScenario  = demoStep >= DEMO_SCENARIOS.length - 1
  const showConversion  = demoStep >= DEMO_SCENARIOS.length
  const mc              = MODE_COLOR[mode]
  const callActive      = callStatus === 'active'
  const callEnded       = callStatus === 'ended'

  // ── Timers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== 'active') return
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [callStatus, tick])

  useEffect(() => {
    if (!demoStartTime) return
    const iv = setInterval(() => setTotalDemoElapsed(Math.floor((Date.now() - demoStartTime) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [demoStartTime])

  useEffect(() => {
    if (callStatus === 'active') return
    const iv = setInterval(nextTicker, 2800)
    return () => clearInterval(iv)
  }, [callStatus, nextTicker])

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (txRef.current) txRef.current.scrollTop = txRef.current.scrollHeight
  }, [transcript])

  // ── Bridge LiveKit → local transcript ─────────────────────────────────────
  const lastSyncedIdx = useRef(0)
  useEffect(() => {
    if (liveCall.liveTranscript.length > lastSyncedIdx.current) {
      const newLines = liveCall.liveTranscript.slice(lastSyncedIdx.current)
      lastSyncedIdx.current = liveCall.liveTranscript.length
      newLines.forEach(line => {
        setTranscript(t => {
          const last = t[t.length - 1]
          if (last && last.who === line.who && last.text === line.text && line.who === 'ai') return t
          return [...t, { ...line, ts: line.ts ?? Date.now() }]
        })
      })
    }
  }, [liveCall.liveTranscript])

  const showToast = useCallback((msg: string, dur = 4500) => {
    setToast(msg); setToastOn(true)
    setTimeout(() => setToastOn(false), dur)
  }, [])

  const addTx = useCallback((line: TxLine) =>
    setTranscript(t => [...t, { ...line, ts: line.ts ?? Date.now() }]), [])

  // ── Auto-stop when agent disconnects ──────────────────────────────────────
  const prevLiveStatus = useRef(liveCall.state.status)
  useEffect(() => {
    if (prevLiveStatus.current === 'connected' && liveCall.state.status === 'disconnected') {
      if (callStatus === 'active') {
        endCall()
        const dur = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : elapsed
        setCallEndDuration(dur)
        setScenarioTimes(prev => { const n=[...prev]; n[demoStep]=dur; return n })
        addTx({ who: 'sys', text: `Call ended · ${formatDuration(dur)} · ${liveCall.liveIntents.length} intent(s) · ₹${liveCall.liveCost.toFixed(2)}` })
        setShowCelebration(true)
      }
    }
    prevLiveStatus.current = liveCall.state.status
  }, [liveCall.state.status, callStatus, endCall, addTx, elapsed, liveCall.liveIntents.length, liveCall.liveCost, callStartTime, demoStep])

  // ── Auto-switch exp + mode on demoStep change ─────────────────────────────
  useEffect(() => {
    if (!scenario) return
    setBaseExp(scenario.exp)
    setMode(scenario.mode)
    setScenarioTransition(true)
    const t = setTimeout(() => setScenarioTransition(false), 600)
    return () => clearTimeout(t)
  }, [demoStep]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start call ────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (isInfraDemo) return
    setEverStarted(true)
    setShowCelebration(false)
    startCall()
    lastSyncedIdx.current = 0
    setTranscript([])
    setCallStartTime(Date.now())
    if (!demoStartTime) setDemoStartTime(Date.now())
    addTx({ who: 'sys', text: 'Connecting to Converse AI…' })
    liveCall.connect(TENANT_KEY, IVR_KEY, SERVICE_B_URL)

    if (!revealed.has('cards')) {
      setTimeout(() => reveal('cards'),      REVEAL_TIMINGS.cards)
      setTimeout(() => reveal('industry'),   REVEAL_TIMINGS.industry)
      setTimeout(() => reveal('journey'),    REVEAL_TIMINGS.journey)
      setTimeout(() => reveal('security'),   REVEAL_TIMINGS.security)
      setTimeout(() => reveal('deployment'), REVEAL_TIMINGS.deployment)
    }
  }, [startCall, addTx, reveal, liveCall, demoStartTime, revealed, isInfraDemo])

  // ── Toggle call ───────────────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (callStatus === 'active') {
      endCall()
      liveCall.disconnect()
      const dur = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : elapsed
      setCallEndDuration(dur)
      setScenarioTimes(prev => { const n=[...prev]; n[demoStep]=dur; return n })
      addTx({ who: 'sys', text: `Call ended · ${formatDuration(dur)} · ${liveCall.liveIntents.length} intent(s) · ₹${liveCall.liveCost.toFixed(2)}` })
      setShowCelebration(true)
    } else {
      handleStart()
    }
  }, [callStatus, endCall, addTx, elapsed, liveCall, callStartTime, demoStep, handleStart])

  // ── Try next scenario ─────────────────────────────────────────────────────
  const handleTryNext = useCallback(() => {
    if (demoStep < DEMO_SCENARIOS.length) {
      setDemoStep(prev => prev + 1)
      setShowCelebration(false)
      setTranscript([])
    }
  }, [demoStep])

  // ── Infra demo complete ───────────────────────────────────────────────────
  const handleInfraComplete = useCallback(() => {
    setScenarioTimes(prev => {
      const n=[...prev]
      n[5] = Math.floor((Date.now() - (demoStartTime||Date.now())) / 1000) - totalDemoElapsed
      return n
    })
    setShowCelebration(true)
  }, [demoStartTime, totalDemoElapsed])

  // ── Derived ───────────────────────────────────────────────────────────────
  const ic = scenario ? INFRA_CONFIG[scenario.infra]   : INFRA_CONFIG.shared
  const dc = scenario ? DEPLOY_CONFIG[scenario.deploy] : DEPLOY_CONFIG.cloud
  const activeJourneyStage: JourneyStageKey = scenario?.journeyStage || 'explore'

  // ── Infra strip data for current scenario ─────────────────────────────────
  const infraItems = scenario ? [
    { label: 'Data', icon: scenario.infraIcon,   text: ic.label,  color: ic.color },
    { label: 'Deploy', icon: scenario.deployIcon, text: dc.label,  color: dc.color },
  ] : []

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      onClick={() => currencyDropdown && setCurrencyDropdown(false)}>

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse       { 0%,100% { opacity:1; } 50% { opacity:.5; } }
        @keyframes micPulse    { 0%,100% { box-shadow:0 0 0 0 rgba(24,196,138,.3); } 50% { box-shadow:0 0 18px 4px rgba(24,196,138,.2); } }
        @keyframes wave        { 0% { transform:scale(1); opacity:.35; } 100% { transform:scale(1.4); opacity:0; } }
        @keyframes switchGlow  { 0% { box-shadow:0 0 0 0 rgba(245,158,11,.4); } 50% { box-shadow:0 0 16px 4px rgba(245,158,11,.2); } 100% { box-shadow:0 0 0 0 transparent; } }
      `}</style>

      {/* ══ NAV ══ */}
      <nav
        className="flex items-center justify-between px-3 sm:px-5 h-10 sm:h-11 border-b flex-shrink-0 sticky top-0 z-50"
        style={{ borderColor: 'var(--b1)', background: 'rgba(7,13,26,.96)' }}>

        {/* Logo */}
        <div className="flex items-center gap-1.5 font-extrabold text-[12px] sm:text-[14px] tracking-tight"
          style={{ color: 'var(--bright)' }}>
          <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center text-[11px]"
            style={{ background: 'linear-gradient(135deg,#3370e8,#0ea8b8)' }}>🎙</div>
          Converse AI
        </div>

        {/* Scenario tabs — shown once demo has started */}
        {everStarted && !showConversion && (
          <div className="hidden md:flex items-center gap-1">
            {DEMO_SCENARIOS.filter(s => !s.isInfraDemo).map((s, i) => {
              const done   = i < demoStep
              const active = i === demoStep
              return (
                <button
                  key={s.id}
                  onClick={() => { if (done) { setDemoStep(i); setShowCelebration(false); setTranscript([]) } }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold transition-all"
                  style={{
                    background: active ? 'rgba(99,102,241,.15)' : done ? 'rgba(34,197,94,.08)' : 'transparent',
                    color: active ? '#a5b4fc' : done ? '#6ee7b7' : 'var(--dim)',
                    border: active ? '1px solid rgba(99,102,241,.3)' : '1px solid transparent',
                    cursor: done ? 'pointer' : 'default',
                  }}>
                  {done && <span className="text-[8px]">✓</span>}
                  {s.icon} {s.title}
                </button>
              )
            })}
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Currency switcher */}
          <div className="flex rounded overflow-hidden border relative"
            style={{ background: 'var(--card)', borderColor: 'var(--b1)' }}>
            {(['inr','usd'] as const).map(c => (
              <button key={c} onClick={() => setCurrency(c)}
                className="px-1.5 sm:px-2.5 py-[3px] text-[9px] sm:text-[10px] font-bold font-mono transition-all"
                style={{
                  background: currency === c ? 'var(--blue)' : 'transparent',
                  color: currency === c ? '#fff' : 'var(--dim)',
                }}>
                {CURRENCY_CONFIG[c].flag} {CURRENCY_CONFIG[c].label}
              </button>
            ))}
            <button
              onClick={(e) => { e.stopPropagation(); setCurrencyDropdown(!currencyDropdown) }}
              className="px-1 py-[3px] text-[9px] font-bold border-l transition-all"
              style={{ borderColor: 'var(--b1)', color: 'var(--dim)' }}>▾</button>
            {currencyDropdown && (
              <div className="absolute top-full right-0 mt-1 rounded-lg border shadow-xl z-50 min-w-[110px]"
                style={{ background: 'var(--card)', borderColor: 'var(--b2)' }}
                onClick={e => e.stopPropagation()}>
                {(['eur','gbp','aed','sgd','jpy','aud'] as Currency[]).map(c => (
                  <button key={c} onClick={() => { setCurrency(c); setCurrencyDropdown(false) }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[9px] font-mono hover:bg-white/5"
                    style={{ color: currency === c ? 'var(--blue)' : 'var(--text)' }}>
                    {CURRENCY_CONFIG[c].flag} <span className="font-bold">{CURRENCY_CONFIG[c].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="hidden sm:block px-3 py-1 text-[11px] font-semibold rounded border"
            style={{ borderColor: 'var(--b2)', color: 'var(--text)', background: 'transparent' }}>Sign In</button>
          <button className="px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold rounded"
            style={{ background: 'var(--blue)', color: '#fff' }}>Get Started</button>
        </div>
      </nav>

      {/* ══ DEMO TIMELINE ══ */}
      {everStarted && (
        <DemoTimeline
          demoStep={demoStep}
          scenarioTimes={scenarioTimes}
          totalElapsed={totalDemoElapsed}
          isCallActive={callActive}
        />
      )}

      {/* ══ CONTEXT BAR ══ */}
      {everStarted && scenario && (
        <div className="flex items-center justify-between px-3 sm:px-5 py-1 border-b flex-shrink-0"
          style={{
            borderColor: 'var(--b1)',
            background: 'var(--surf)',
            animation: scenarioTransition ? 'switchGlow 0.6s ease-out' : 'none',
          }}>
          {/* Journey stages */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {JOURNEY_STAGES.map((stage, i) => {
              const isActive = stage.key === activeJourneyStage
              const isDone   = JOURNEY_STAGES.findIndex(s => s.key === activeJourneyStage) > i
              return (
                <div key={stage.key} className="flex items-center gap-0.5 sm:gap-1">
                  <div className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-bold transition-all duration-500"
                    style={{
                      background: isActive ? 'rgba(34,197,94,.15)' : 'transparent',
                      color: isActive ? '#22c55e' : isDone ? '#22c55e' : 'var(--dim)',
                      border: isActive ? '1px solid rgba(34,197,94,.3)' : '1px solid transparent',
                    }}>
                    {isDone  && <span className="text-[7px]">✓</span>}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                    {stage.label}
                    {stage.isFree && !isActive && !isDone && (
                      <span className="text-[5px] px-0.5 rounded" style={{ background: '#f59e0b', color: '#000' }}>FREE</span>
                    )}
                  </div>
                  {i < JOURNEY_STAGES.length - 1 && (
                    <span className="text-[7px]" style={{ color: 'var(--b2)' }}>→</span>
                  )}
                </div>
              )
            })}
          </div>
          {/* Infra + deploy badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 transition-all duration-500">
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${ic.color}15`, color: ic.color, border: `1px solid ${ic.color}33` }}>
              {scenario.infraIcon} {ic.label}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${dc.color}15`, color: dc.color, border: `1px solid ${dc.color}33` }}>
              {scenario.deployIcon} {dc.label}
            </span>
            <span className="hidden sm:inline text-[7px]" style={{ color: 'var(--dim)' }}>
              {scenario.dataResides}
            </span>
          </div>
        </div>
      )}

      {/* ══ MAIN: 2 columns ══ */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── CENTER ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 border-r"
          style={{ borderColor: 'var(--b1)' }}>

          {/* ══ CONVERSION CTA — after all scenarios ══ */}
          {showConversion ? (
            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              <ConversionCTA />
            </div>

          /* ══ INFRA DEMO — scenario 6 ══ */
          ) : isInfraDemo ? (
            showCelebration ? (
              <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                <PostCallCelebration
                  demoStep={demoStep} intents={[]} totalCost={0}
                  currency={currency} onTryNext={handleTryNext} callDuration={0} />
              </div>
            ) : (
              <InfraMigrationDemo onComplete={handleInfraComplete} />
            )

          /* ══ PRE-CALL PITCH ══ */
          ) : !callActive && !showCelebration ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-5 sm:p-8 overflow-y-auto">
              {/* Industry First badge */}
              <div className="text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded"
                style={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.25)' }}>
                {scenario?.industryFirst}
              </div>

              {/* Title */}
              <div className="text-[28px] sm:text-[36px] font-extrabold text-center leading-tight"
                style={{ color: 'var(--bright)' }}>
                {scenario?.icon} {scenario?.title}
              </div>

              {/* AI IVR Mode description */}
              <div className="max-w-lg text-center text-[12px] sm:text-[13px] leading-relaxed px-4 py-3 rounded-xl border"
                style={{
                  color: 'var(--text)',
                  borderColor: 'var(--b1)',
                  background: 'rgba(255,255,255,.02)',
                }}>
                {MODE_LABELS[mode].desc}
              </div>

              {/* Say this */}
              <div className="w-full max-w-lg rounded-xl border px-5 py-4"
                style={{
                  borderColor: 'rgba(6,182,212,.25)',
                  background: 'linear-gradient(135deg, rgba(6,182,212,.06), rgba(99,102,241,.03))',
                }}>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--dim)' }}>📣 Start the call and say</div>
                <div className="text-[16px] sm:text-[18px] font-bold" style={{ color: '#06b6d4' }}>
                  "{scenario?.suggestedPhrase}"
                </div>
              </div>

              {/* Start Call button */}
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-extrabold text-[15px] tracking-tight transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: mc.start, color: mc.startText, boxShadow: `0 4px 24px ${mc.bg}` }}>
                📞 Start Call
              </button>

              <div className="text-[9px]" style={{ color: 'var(--dim)' }}>
                Free · No sign-up · {scenario?.infraFootnote}
              </div>
            </div>

          /* ══ ACTIVE CALL + POST-CALL ══ */
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden min-h-0">

              {/* Call header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b flex-shrink-0"
                style={{ borderColor: 'var(--b1)', background: 'rgba(255,255,255,.02)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[18px] flex-shrink-0">{scenario?.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[7px] font-bold uppercase tracking-[.15em] px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>
                        {scenario?.industryFirst}
                      </span>
                      <span className="font-bold text-[12px] sm:text-[13px] truncate"
                        style={{ color: 'var(--bright)' }}>{scenario?.title}</span>
                    </div>
                    <div className="text-[8px] mt-0.5 flex items-center gap-1.5"
                      style={{ color: 'var(--dim)' }}>
                      <span style={{ color: EXP_COLOR[baseExp] }}>Exp {baseExp}</span>
                      <span>·</span>
                      <span>{MODE_LABELS[mode].label}</span>
                      <span>·</span>
                      <span>AI IVR Mode</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 items-center flex-shrink-0">
                  <div className="text-right">
                    <div className="text-[7px] uppercase tracking-wide" style={{ color: 'var(--dim)' }}>Rate</div>
                    <div className="font-mono text-[13px] font-bold" style={{ color: EXP_COLOR[baseExp] }}>
                      {formatCost(MODE_RATES[mode][baseExp], currency)}<span className="text-[9px] font-normal">/int</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[7px] uppercase tracking-wide" style={{ color: 'var(--dim)' }}>Session</div>
                    <div className="font-mono text-[13px] font-bold" style={{ color: 'var(--bright)' }}>
                      {formatCost(liveCall.liveCost, currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transcript + celebration */}
              <div ref={txRef} className="flex-1 overflow-y-auto p-2 sm:p-3 flex flex-col gap-1.5">
                {transcript.length === 0 && !showCelebration && (
                  <div className="flex flex-col items-center justify-center h-full gap-2"
                    style={{ color: 'var(--dim)' }}>
                    <div className="text-[28px] opacity-25">💬</div>
                    <div className="text-[11px]">Transcript will appear here</div>
                  </div>
                )}

                {transcript.map((tx, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="text-[7px] font-mono w-10 flex-shrink-0 mt-1 text-right"
                      style={{ color: 'var(--dim)' }}>
                      {tx.ts ? new Date(tx.ts).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                    </div>
                    <div className="text-[7px] font-bold w-6 flex-shrink-0 mt-1 px-1 py-px rounded text-center"
                      style={{
                        background: tx.who === 'user' ? 'rgba(51,112,232,.15)' : tx.who === 'ai' ? 'rgba(24,196,138,.12)' : 'rgba(255,255,255,.05)',
                        color:      tx.who === 'user' ? '#80aaf4'                : tx.who === 'ai' ? 'var(--green)'         : 'var(--dim)',
                      }}>
                      {tx.who === 'user' ? 'YOU' : tx.who === 'ai' ? 'AI' : '···'}
                    </div>
                    <div className="flex-1 rounded-md border p-1.5"
                      style={{
                        background:  tx.who === 'user' ? 'rgba(51,112,232,.07)' : 'var(--card2)',
                        borderColor: tx.who === 'user' ? 'rgba(51,112,232,.15)' : 'var(--b1)',
                      }}>
                      <div className="text-[11px] sm:text-[12px] leading-snug" style={{ color: 'var(--text)' }}>{tx.text}</div>
                      {tx.meta && <div className="font-mono text-[8px] mt-0.5" style={{ color: 'var(--amber)' }}>{tx.meta}</div>}
                    </div>
                  </div>
                ))}

                {/* POST-CALL CELEBRATION */}
                {showCelebration && !showConversion && (
                  liveCall.liveIntents.length > 0 ? (
                    <PostCallCelebration
                      demoStep={demoStep}
                      intents={liveCall.liveIntents}
                      totalCost={liveCall.liveCost}
                      currency={currency}
                      onTryNext={handleTryNext}
                      callDuration={callEndDuration}
                    />
                  ) : (
                    <div className="rounded-xl border p-3 mt-2 text-center"
                      style={{ borderColor: 'var(--b1)', background: 'rgba(255,255,255,.02)', animation: 'fadeSlideIn 0.6s ease-out' }}>
                      <div className="text-[13px] mb-2" style={{ color: 'var(--text)' }}>No business intents detected.</div>
                      <div className="text-[10px] mb-3" style={{ color: 'var(--dim)' }}>Try: "{scenario?.suggestedPhrase}"</div>
                      <div className="flex items-center justify-center gap-3 flex-wrap">
                        <button onClick={handleToggle}
                          className="px-6 py-2 rounded-lg font-bold text-[12px]"
                          style={{ background: mc.start, color: mc.startText }}>
                          📞 Try Again
                        </button>
                        {!isLastScenario && (
                          <button onClick={handleTryNext}
                            className="px-6 py-2 rounded-lg font-bold text-[12px] border"
                            style={{ borderColor: 'var(--b2)', color: 'var(--text)', background: 'transparent' }}>
                            Skip →
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Meters */}
              <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--b1)' }}>
                <div className="flex">
                  {[
                    { label: '⏱ Duration', val: formatDuration(elapsed),                 sub: callActive ? 'Running…' : 'Ended', color: 'var(--bright)' },
                    { label: '💰 Cost',     val: formatCost(liveCall.liveCost, currency), sub: 'This call',                       color: 'var(--green)' },
                    { label: '🎯 Intents',  val: String(liveCall.liveIntents.length),     sub: 'Business',                        color: '#8a4ee8' },
                  ].map((m, i) => (
                    <div key={i} className="flex-1 p-2 border-r last:border-r-0"
                      style={{ borderColor: 'var(--b1)' }}>
                      <div className="text-[7px] font-bold tracking-wide uppercase mb-0.5" style={{ color: 'var(--dim)' }}>{m.label}</div>
                      <div className="font-mono text-[18px] sm:text-[22px] font-semibold leading-none" style={{ color: m.color }}>{m.val}</div>
                      <div className="text-[7px] mt-0.5" style={{ color: 'var(--dim)' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* End call + engage strip */}
                <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--b1)' }}>
                  <button
                    onClick={handleToggle}
                    className="w-full py-2.5 rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-all hover:opacity-85"
                    style={callActive
                      ? { background: '#d44444', color: '#fff' }
                      : { background: mc.start, color: mc.startText }}>
                    {callActive ? '📵 End Call' : '📞 Start Again'}
                  </button>

                  {/* Engage inline strip — always visible */}
                  <div className="flex items-center justify-center gap-2 mt-2 text-[9px]"
                    style={{ color: 'var(--dim)' }}>
                    <span>Like what you hear?</span>
                    <button
                      onClick={() => alert('Opening calendar...')}
                      className="font-bold transition-colors hover:underline"
                      style={{ background: 'none', border: 'none', color: '#18c48a', cursor: 'pointer', fontSize: '9px' }}>
                      📅 Book a call →
                    </button>
                    <span style={{ color: 'var(--b2)' }}>|</span>
                    <button
                      onClick={() => alert('IVR import coming soon')}
                      className="font-bold transition-colors hover:underline"
                      style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '9px' }}>
                      Give us your IVR #
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Promo strip */}
          <div className="flex items-center gap-1.5 px-3 py-1 border-t flex-shrink-0"
            style={{ borderColor: 'rgba(51,112,232,.18)', background: 'linear-gradient(90deg,#0f2050,#0c3040)' }}>
            <span className="text-[7px] font-extrabold px-1 py-px rounded"
              style={{ background: 'var(--amber)', color: '#080d18' }}>FREE</span>
            <span className="text-[8px]" style={{ color: '#6090b0' }}>
              Real AI · No credit card · Import your IVR in 30 minutes
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="w-[260px] xl:w-[280px] flex-shrink-0 flex flex-col overflow-hidden">
          <LiveCallPanel
            state={liveCall.state}
            onDTMF={liveCall.pressDTMF}
            liveTranscript={liveCall.liveTranscript}
            liveIntents={liveCall.liveIntents}
            liveCost={liveCall.liveCost}
            currentExp={liveCall.currentExp}
            crmName={liveCall.crmName}
            callActive={callActive}
            callEnded={callEnded}
            scenarioSteps={scenario?.steps ?? []}
          />
        </div>

      </div>

      {/* ══ TOAST ══ */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2.5 z-50 max-w-[90vw] sm:max-w-md text-center text-[10px] leading-relaxed shadow-2xl pointer-events-none transition-all duration-300"
        style={{
          background: 'rgba(11,19,32,.97)', border: '1px solid var(--b2)',
          opacity: toastOn ? 1 : 0, transform: `translateX(-50%) translateY(${toastOn ? 0 : 8}px)`,
        }}
        dangerouslySetInnerHTML={{ __html: toast }} />
    </div>
  )
}

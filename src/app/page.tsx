'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import {
  EXPERIENCES, INTENTS, INTENT_KEYS, MODE_LABELS, MODE_RATES, MODE_COLOR, EXP_COLOR,
  REVEAL_TIMINGS, DEMO_SCENARIOS, JOURNEY_STAGES, CURRENCY_CONFIG, INFRA_CONFIG, DEPLOY_CONFIG,
} from '@/lib/data'
import { JOURNEY_CONFIGS, JOURNEY_STEPS, SENTENCES } from '@/lib/journeyData'
import { formatCost, formatDuration, resolveExp } from '@/lib/utils'
import IvrDialpad from '@/components/call/IvrDialpad'
import NudgeSystem from '@/components/call/NudgeSystem'
import PostCallBoxes from '@/components/demo/PostCallBoxes'
import ConversionCTA from '@/components/demo/ConversionCTA'
import InfraMigrationDemo from '@/components/demo/InfraMigrationDemo'
import HomepageSections from '@/components/homepage/HomepageSections'
import FloatingIVRBar from '@/components/homepage/FloatingIVRBar'
import { useLiveKitCall } from '@/hooks/useLiveKitCall'
import type { IntentKey, Currency, JourneyStageKey } from '@/types'
import SignUpModal from '@/components/auth/SignUpModal'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import { getUser, clearAuth, type CxUser } from '@/lib/auth'

interface TxLine { who: 'user' | 'ai' | 'sys'; text: string; meta?: string; ts?: number }

// ── Config ─────────────────────────────────────────────────────────────────
import { getEnv } from '@/lib/env'
const SERVICE_B_URL = getEnv().serviceB
const TENANT_KEY    = 'experience_shop'
const DEFAULT_IVR_KEY = 'global_banking'

function HomeInner() {
  const searchParams = useSearchParams()
  const qTenantRaw = searchParams.get("tenant_key")
  const qIvrRaw = searchParams.get("ivr_key")
  const qRoutingModeRaw = searchParams.get("routing_mode")

  // Persist tenant context from URL → sessionStorage so it survives navigation
  useEffect(() => {
    if (qTenantRaw) sessionStorage.setItem('cx_tenant_key', qTenantRaw)
    if (qIvrRaw) sessionStorage.setItem('cx_ivr_key', qIvrRaw)
    if (qRoutingModeRaw) sessionStorage.setItem('cx_routing_mode', qRoutingModeRaw)
  }, [qTenantRaw, qIvrRaw, qRoutingModeRaw])

  const qTenant = qTenantRaw || (typeof window !== 'undefined' ? sessionStorage.getItem('cx_tenant_key') : null)
  const qIvr = qIvrRaw || (typeof window !== 'undefined' ? sessionStorage.getItem('cx_ivr_key') : null)
  const qRoutingMode = qRoutingModeRaw || (typeof window !== 'undefined' ? sessionStorage.getItem('cx_routing_mode') : null)
  const currency    = useStore(s => s.currency)
  useEffect(() => { if (qIvr && qIvr !== selectedIvrRef.current) updateSelectedIvr(qIvr) }, [qIvr])
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

  // ── Auth state ──────────────────────────────────────────────────────────
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CxUser | null>(null)
  useEffect(() => { setCurrentUser(getUser()) }, [])
  const handleSignOut = useCallback(() => {
    clearAuth()
    setCurrentUser(null)
  }, [])

  // ── Industry switcher ──────────────────────────────────────────────────
  const INDUSTRY_OPTIONS = [
    { key: 'global_banking',    label: 'Banking',     icon: '🏦' },
    { key: 'global_insurance',  label: 'Insurance',   icon: '🛡️' },
    { key: 'global_healthcare', label: 'Healthcare',  icon: '🏥' },
    { key: 'global_telecom',    label: 'Telecom',     icon: '📱' },
    { key: 'global_ecommerce',  label: 'E-Commerce',  icon: '🛒' },
    { key: 'global_hospitality', label: 'Hospitality', icon: '🏨' },
  ] as const
  const [selectedIvr, setSelectedIvr] = useState(DEFAULT_IVR_KEY)
  const selectedIvrRef = useRef(DEFAULT_IVR_KEY)
  const updateSelectedIvr = useCallback((key: string) => {
    setSelectedIvr(key)
    selectedIvrRef.current = key
  }, [])

  // ── Demo journey ─────────────────────────────────────────────────────────
  const [demoStep, setDemoStep]                 = useState(0)
  const [scenarioTimes, setScenarioTimes]       = useState<(number|null)[]>(Array(6).fill(null))
  const [demoStartTime, setDemoStartTime]       = useState<number|null>(null)
  const [totalDemoElapsed, setTotalDemoElapsed] = useState(0)
  const [callStartTime, setCallStartTime]       = useState<number|null>(null)
  const [callEndDuration, setCallEndDuration]   = useState(0)
  const [showCelebration, setShowCelebration]   = useState(false)
  const [currencyDropdown, setCurrencyDropdown] = useState(false)
  const [scenarioTransition, setScenarioTransition] = useState(false)
  const [everStarted, setEverStarted]           = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('autostart') === 'true'
    }
    return false
  })
  const [transcript, setTranscript]             = useState<TxLine[]>([])
  const [toast, setToast]                       = useState('')
  const [toastOn, setToastOn]                   = useState(false)
  const [showIVRBar, setShowIVRBar]             = useState(false)
  const [txCollapsed, setTxCollapsed]           = useState(false)
  const [finalIntents, setFinalIntents]         = useState<any[]>([])
  const [finalCost, setFinalCost]               = useState(0)
  const [sessionDisplayId, setSessionDisplayId] = useState('')
  const [showSignUp, setShowSignUp] = useState(false)
  const [signUpSource, setSignUpSource] = useState('homepage')
  const [signUpRedirect, setSignUpRedirect] = useState<string | undefined>(undefined)
  const txRef = useRef<HTMLDivElement>(null)

  // ── CRM Demo Profile (Journey 4 — sales) ──────────────────────────────────
  const [demoProfile, setDemoProfile] = useState<{
    name: string; mobile: string; classification: string;
    account_summary: string; story_hook: string; recommended_action: string;
    preferred_language: string; country_code: string; country_name: string;
  } | null>(null)
  const [demoProfileLoading, setDemoProfileLoading] = useState(false)

  // ── R157: Value Tier selection (Journey 4 — Route by Value) ────────────────
  const [valueTier, setValueTier] = useState<'gold' | 'silver' | 'bronze'>('silver')
  const [callerCountry, setCallerCountry] = useState('India')

  useEffect(() => {
    fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) })
      .then(r => r.ok ? r.json() : null)
      .then(geo => {
        if (geo?.country_name) setCallerCountry(geo.country_name)
        if (geo?.currency === 'INR') setCurrency('INR' as Currency)
      })
      .catch(() => {})
  }, [])

  const openSignUp = useCallback((src: string, redirect?: string) => {
    setSignUpSource(src)
    setSignUpRedirect(redirect)
    setShowSignUp(true)
  }, [])

  /** Navigate to /migrate if logged in, or open signup with redirect to /migrate */
  const handleMigrate = useCallback((src: string) => {
    if (currentUser) {
      router.push('/migrate')
    } else {
      openSignUp(src, '/migrate')
    }
  }, [currentUser, router, openSignUp])

  // ── LiveKit ───────────────────────────────────────────────────────────────
  const liveCall = useLiveKitCall()

  const scenario        = DEMO_SCENARIOS[demoStep]
  const isInfraDemo     = scenario?.isInfraDemo
  const isLastScenario  = demoStep >= DEMO_SCENARIOS.length - 1
  const showConversion  = demoStep >= DEMO_SCENARIOS.length
  const mc              = MODE_COLOR[mode]
  const callActive      = callStatus === 'active'
  const callEnded       = callStatus === 'ended'
  const jConfig         = JOURNEY_CONFIGS[demoStep]
  const jNum            = demoStep + 1
  const hasIntents      = liveCall.liveIntents.length > 0

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

  // ── Autostart from /migrate redirect ──────────────────────────────────────
  useEffect(() => {
    if (searchParams.get("autostart") === "true" && !everStarted) {
      setEverStarted(true)
    }
  }, [searchParams, everStarted])

  // ── Deep-link to specific journey from /pricing ───────────────────────────
  useEffect(() => {
    const j = searchParams.get("journey")
    if (j !== null && !everStarted) {
      const step = parseInt(j, 10)
      if (!isNaN(step) && step >= 0 && step <= 3) {
        setDemoStep(step)
        setEverStarted(true)
      }
    }
  }, [searchParams, everStarted])
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

  // ── Store session data for read-only dashboard ────────────────────────────
  const storeSessionData = useCallback((dur: number) => {
    const roomName = liveCall.state.roomName
    // Extract timestamp from room name (e.g. hdfc__retail__1772979291191 → 1772979291191)
    const parts = roomName.split('__')
    const ts = parts[parts.length - 1] || String(Date.now())
    const displayId = `CVS-${ts}`
    setSessionDisplayId(displayId)

    const data = {
      sessionId: roomName,
      displayId,
      createdAt: parseInt(ts) || Date.now(),
      demoStep,
      duration: dur,
      intents: [...liveCall.liveIntents],
      totalCost: liveCall.liveCost,
      transcript: [...transcript],
      journeyName: jConfig?.name || 'Demo Call',
      journeyExp: jConfig?.exp || 'Exp 5',
      stack: jConfig?.stack || [],
    }

    try {
      sessionStorage.setItem(`cvs_session_${displayId}`, JSON.stringify(data))
    } catch { /* storage full, ignore */ }

    return displayId
  }, [liveCall, demoStep, transcript, jConfig])

  // ── Advance to next journey ───────────────────────────────────────────────
  const advanceToNextJourney = useCallback(() => {
    if (demoStep < DEMO_SCENARIOS.length - 1) {
      setDemoStep(prev => prev + 1)
      setTranscript([])
    } else {
      // Last scenario → show conversion
      setDemoStep(DEMO_SCENARIOS.length)
    }
  }, [demoStep])

  // ── Auto-stop when agent disconnects ────────────────────────────────────
  const prevLiveStatus = useRef(liveCall.state.status)
  useEffect(() => {
    if (prevLiveStatus.current === 'connected' && liveCall.state.status === 'disconnected') {
      if (callStatus === 'active') {
        // Snapshot live data before endCall
        setFinalIntents([...liveCall.liveIntents])
        setFinalCost(liveCall.liveCost)
        const dur = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : elapsed
        setCallEndDuration(dur)
        setScenarioTimes(prev => { const n=[...prev]; n[demoStep]=dur; return n })
        // Store session data for read-only dashboard
        storeSessionData(dur)
        // Always show post-call boxes
        setShowCelebration(true)
        endCall()
      }
    }
    prevLiveStatus.current = liveCall.state.status
  }, [liveCall.state.status, callStatus, endCall, elapsed, callStartTime, demoStep, liveCall.liveIntents, liveCall.liveCost, storeSessionData])

  // ── Auto-switch exp + mode on demoStep change ─────────────────────────────
  useEffect(() => {
    if (!scenario) return
    setBaseExp(scenario.exp)
    setMode(scenario.mode)
    setScenarioTransition(true)
    const t = setTimeout(() => setScenarioTransition(false), 600)
    return () => clearTimeout(t)
  }, [demoStep]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch CRM demo profile when entering sales or value-routing journey ───
  useEffect(() => {
    if (!scenario || (scenario.mode !== 'sales' && demoStep !== 3)) {
      setDemoProfile(null)
      return
    }
    let cancelled = false
    setDemoProfileLoading(true)
    const industry = (selectedIvrRef.current || 'global_banking').replace('global_', '')
    // R157: For value routing (demoStep 3), fetch profile matching the selected value tier
    const classificationFilter = demoStep === 3
      ? `&classification=${valueTier === 'silver' ? 'AT_RISK' : valueTier === 'bronze' ? 'STANDARD' : 'HIGH_VALUE'}`
      : ''
    fetch(`${SERVICE_B_URL.replace(':9000', ':9700')}/crm/demo-profile?country=${encodeURIComponent(callerCountry)}&industry=${industry}${classificationFilter}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data?.mobile) setDemoProfile(data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDemoProfileLoading(false) })
    return () => { cancelled = true }
  }, [demoStep, scenario, selectedIvr, callerCountry, valueTier])

  // ── Start call ────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (isInfraDemo) return
    setEverStarted(true)
    setShowCelebration(false)
    setFinalIntents([])
    setFinalCost(0)
    startCall()
    lastSyncedIdx.current = 0
    setTranscript([])
    setTxCollapsed(false)
    setCallStartTime(Date.now())
    if (!demoStartTime) setDemoStartTime(Date.now())
    addTx({ who: 'sys', text: 'Connecting to AiIVRs…' })
    liveCall.connect(qTenant || (currentUser?.tenant_key ?? TENANT_KEY), qIvr || (currentUser?.ivr_keys?.[0] ?? selectedIvrRef.current), SERVICE_B_URL, {
      routingMode: qRoutingMode || scenario?.mode,
      ...(scenario?.experienceLevel ? { experienceLevel: scenario.experienceLevel } : {}),
      ...((scenario?.mode === 'sales' || demoStep === 3) ? { callerMobile: demoProfile?.mobile || '+919876543210' } : {}),
      ...(demoStep === 3 ? { crmTier: valueTier } : {}),
    })

    if (!revealed.has('cards')) {
      setTimeout(() => reveal('cards'),      REVEAL_TIMINGS.cards)
      setTimeout(() => reveal('industry'),   REVEAL_TIMINGS.industry)
      setTimeout(() => reveal('journey'),    REVEAL_TIMINGS.journey)
      setTimeout(() => reveal('security'),   REVEAL_TIMINGS.security)
      setTimeout(() => reveal('deployment'), REVEAL_TIMINGS.deployment)
    }
  }, [startCall, addTx, reveal, liveCall, demoStartTime, revealed, isInfraDemo, currentUser])

  // ── End call ────────────────────────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    if (callStatus === 'active') {
      // Snapshot live data BEFORE disconnect wipes it
      setFinalIntents([...liveCall.liveIntents])
      setFinalCost(liveCall.liveCost)
      const dur = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : elapsed
      setCallEndDuration(dur)
      setScenarioTimes(prev => { const n=[...prev]; n[demoStep]=dur; return n })
      // Store session data for read-only dashboard
      storeSessionData(dur)
      // Always show post-call boxes
      setShowCelebration(true)
      // THEN end call and disconnect
      endCall()
      liveCall.disconnect()
    }
  }, [callStatus, endCall, elapsed, liveCall, callStartTime, demoStep, storeSessionData])

  // ── Try next (from PostCallBoxes) ─────────────────────────────────────────
  const handleTryNext = useCallback(() => {
    setShowCelebration(false)
    advanceToNextJourney()
  }, [advanceToNextJourney])

  // ── Navigate to specific journey (from billing panel "Try →") ─────────────
  const handleNavigateJourney = useCallback((step: number) => {
    setShowCelebration(false)
    setDemoStep(step)
    setTranscript([])
  }, [])

  // ── Infra demo complete ───────────────────────────────────────────────────
  const handleInfraComplete = useCallback(() => {
    setScenarioTimes(prev => {
      const n=[...prev]
      n[5] = Math.floor((Date.now() - (demoStartTime||Date.now())) / 1000) - totalDemoElapsed
      return n
    })
    setShowCelebration(true)
  }, [demoStartTime, totalDemoElapsed])

  // ── Homepage start (from hero) ────────────────────────────────────────────
  const handleHomepageStart = useCallback(() => {
    setEverStarted(true)
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────
  const ic = scenario ? INFRA_CONFIG[scenario.infra]   : INFRA_CONFIG.shared
  const dc = scenario ? DEPLOY_CONFIG[scenario.deploy] : DEPLOY_CONFIG.cloud
  const nextJourneyConfig = jConfig ? JOURNEY_CONFIGS[jConfig.next] : null

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
        @keyframes demoPulse   { 0% { transform:scale(1); opacity:1; } 14% { transform:scale(1.18); opacity:1; } 28% { transform:scale(1); opacity:.85; } 42% { transform:scale(1.12); opacity:1; } 70% { transform:scale(1); opacity:.75; } 100% { transform:scale(1); opacity:1; } }
        @keyframes switchGlow  { 0% { box-shadow:0 0 0 0 rgba(245,158,11,.4); } 50% { box-shadow:0 0 16px 4px rgba(245,158,11,.2); } 100% { box-shadow:0 0 0 0 transparent; } }
        @keyframes blink       { 0%,100% { opacity:1; } 50% { opacity:.3; } }
      `}</style>

      {/* ══ NAV (Unified Header) ══ */}
      <UnifiedHeader
        variant={everStarted ? 'journey' : 'homepage'}
        user={currentUser}
        onSignIn={() => router.push('/login')}
        onSignOut={handleSignOut}
        onLogoClick={() => { window.location.href = '/' }}
        onGetStarted={handleHomepageStart}
        onMigrateClick={() => handleMigrate('header_nav_migrate')}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      {/* ══ JOURNEY BAR ══ */}
      {everStarted && !showConversion && (
        <div className="flex items-center px-4 sm:px-8 py-2.5 border-b flex-shrink-0"
          style={{
            borderColor: 'var(--b1)',
            background: 'var(--surf)',
            animation: scenarioTransition ? 'switchGlow 0.6s ease-out' : 'none',
          }}>
          <div className="flex items-center flex-1">
            {JOURNEY_STEPS.map((step, i) => {
              const isCurrent = demoStep === i
              const isDone = demoStep > i
              return (
                <div key={step.num} className={`flex items-center ${i < JOURNEY_STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <div
                    onClick={() => {
                      if (isCurrent && showCelebration) {
                        setShowCelebration(false); setTranscript([])
                      } else if (!isCurrent) {
                        setDemoStep(i); setShowCelebration(false); setTranscript([])
                      }
                    }}
                    className="flex items-center gap-1.5 flex-shrink-0 transition-all"
                    style={{ cursor: (isCurrent && !showCelebration) ? 'default' : 'pointer' }}>
                    <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-bold transition-all"
                      style={{
                        background: isDone ? '#00c9b1' : 'transparent',
                        border: isCurrent ? '2px solid #f5a623' : isDone ? '2px solid #00c9b1' : '2px solid var(--b2)',
                        color: isDone ? '#000' : isCurrent ? '#f5a623' : 'var(--dim)',
                        boxShadow: isCurrent ? '0 0 0 3px rgba(245,166,35,.1)' : 'none',
                      }}>
                      {step.num}
                    </div>
                    <span className="text-[10px] hidden sm:inline"
                      style={{
                        color: isDone ? '#00c9b1' : isCurrent ? '#f5a623' : 'var(--dim)',
                        fontWeight: isCurrent ? 600 : 400,
                      }}>
                      {step.icon} {step.label}
                    </span>
                  </div>
                  {i < JOURNEY_STEPS.length - 1 && (
                    <div className="h-[2px] mx-2 sm:mx-3 flex-1"
                      style={{ background: isDone ? '#00c9b1' : 'var(--b1)' }} />
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {callActive && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px]"
                style={{ background: 'var(--card2)', border: '1px solid var(--b1)' }}>
                <span style={{ color: 'var(--dim)' }}>⏱ Demo time:</span>
                <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--bright)' }}>
                  {Math.floor(totalDemoElapsed / 60)}:{String(totalDemoElapsed % 60).padStart(2, '0')}
                </span>
              </span>
            )}
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded hidden sm:inline-flex"
              style={{ background: `${ic.color}15`, color: ic.color, border: `1px solid ${ic.color}33` }}>
              {scenario?.infraIcon} {ic.label}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded hidden sm:inline-flex"
              style={{ background: `${dc.color}15`, color: dc.color, border: `1px solid ${dc.color}33` }}>
              {scenario?.deployIcon} {dc.label}
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          HOMEPAGE
          ═══════════════════════════════════════════════════════════════════════ */}
      {!everStarted ? (
        <HomepageSections
          onStartCall={handleHomepageStart}
          onNavigateJourney={handleNavigateJourney}
          onToggleIVRBar={() => setShowIVRBar(v => !v)}
          onSignUp={() => handleMigrate('homepage_migrate')}
        />

      /* ═══════════════════════════════════════════════════════════════════════
         DEMO FLOW
         ═══════════════════════════════════════════════════════════════════════ */
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── CENTER PANEL ── */}
          <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${callActive ? 'border-r' : ''}`}
            style={{ borderColor: 'var(--b1)' }}>

            {/* CONVERSION CTA */}
            {showConversion ? (
              <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                <ConversionCTA />
              </div>

            /* INFRA DEMO */
            ) : isInfraDemo ? (
              showCelebration ? (
                <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                  <PostCallBoxes
                    demoStep={demoStep} intents={[]} totalCost={0}
                    currency={currency} callDuration={0}
                    onTryNext={handleTryNext} onStartCall={handleStart} onNavigateJourney={handleNavigateJourney} sessionDisplayId={sessionDisplayId} onSignUp={() => openSignUp('post_call_infra')}
                    onSelectIndustry={updateSelectedIvr} selectedIvr={selectedIvr} />
                </div>
              ) : (
                <InfraMigrationDemo onComplete={handleInfraComplete} />
              )

            /* JOURNEY INTRO — full width, no right panel */
            ) : !callActive && !showCelebration ? (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-[700px] mx-auto px-6 py-8 text-center">
                  <div className="inline-flex px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide mb-3.5"
                    style={{ background: jConfig?.bg, color: jConfig?.color }}>
                    {jConfig?.icon} Industry First #{jNum} of 4
                  </div>

                  <h2 className="text-[28px] font-bold mb-2" style={{ color: 'var(--bright)' }}>
                    {jConfig?.name}
                  </h2>

                  <p className="text-[14px] leading-relaxed mb-5 mx-auto" style={{ color: 'var(--text)', maxWidth: 520 }}
                    dangerouslySetInnerHTML={{ __html: jConfig?.desc || '' }} />

                  {jConfig && (
                    <div className="flex gap-3 justify-center mb-5 flex-wrap">
                      {jConfig.prices.map((p, i) => (
                        <div key={i} className="px-5 py-3.5 rounded-[10px] border text-center min-w-[120px]"
                          style={{ background: 'var(--card)', borderColor: 'var(--b1)' }}>
                          <div className="text-[8px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--dim)' }}>{p.l}</div>
                          <div className="font-mono text-[22px] font-bold my-0.5" style={{ color: p.c }}>{p.v}</div>
                          <div className="text-[9px]" style={{ color: 'var(--dim)' }}>{p.s}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── R157: Value Tier Selector (Route by Value journey only) ── */}
                  {demoStep === 3 && (
                    <div className="flex gap-3 justify-center mb-5">
                      {([
                        { tier: 'gold' as const, label: '🥇 Gold', color: '#f5a623', desc: 'Coming Soon', disabled: true },
                        { tier: 'silver' as const, label: '🥈 Silver', color: '#c0c0c0', desc: 'Gemini S2S · Exp 3', disabled: false },
                        { tier: 'bronze' as const, label: '🥉 Bronze', color: '#cd7f32', desc: 'Pipeline · Exp 4/5', disabled: false },
                      ]).map(t => (
                        <button key={t.tier}
                          onClick={() => !t.disabled && setValueTier(t.tier)}
                          className="px-5 py-3 rounded-xl border text-center min-w-[120px] transition-all"
                          style={{
                            background: valueTier === t.tier ? `${t.color}15` : 'var(--card)',
                            borderColor: valueTier === t.tier ? t.color : 'var(--b1)',
                            opacity: t.disabled ? 0.4 : 1,
                            cursor: t.disabled ? 'not-allowed' : 'pointer',
                            transform: valueTier === t.tier ? 'scale(1.05)' : 'scale(1)',
                          }}>
                          <div className="text-[14px] font-bold mb-0.5" style={{ color: t.color }}>{t.label}</div>
                          <div className="text-[9px]" style={{ color: t.disabled ? 'var(--dim)' : 'var(--text)' }}>{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── CRM Demo Profile Card (sales + value routing journeys) ── */}
                  {(scenario?.mode === 'sales' || demoStep === 3) && demoProfile && (
                    <div className="mx-auto mb-5 px-5 py-4 rounded-xl border text-left"
                      style={{ maxWidth: 440, background: 'rgba(51,112,232,.06)', borderColor: 'rgba(51,112,232,.18)' }}>
                      <div className="text-[9px] uppercase tracking-wide font-bold mb-2" style={{ color: '#3370E8' }}>
                        You are calling as
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold"
                          style={{ background: 'rgba(51,112,232,.15)', color: '#3370E8' }}>
                          {demoProfile.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[15px] font-bold" style={{ color: 'var(--bright)' }}>{demoProfile.name}</div>
                          <div className="text-[10px]" style={{ color: 'var(--dim)' }}>{demoProfile.country_name}</div>
                        </div>
                        <div className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                          style={{
                            background: demoProfile.classification === 'HIGH_VALUE' ? 'rgba(0,222,122,.1)'
                              : demoProfile.classification === 'AT_RISK' ? 'rgba(240,48,96,.1)'
                              : demoProfile.classification === 'SALES_READY' ? 'rgba(245,166,35,.1)'
                              : 'rgba(122,144,181,.1)',
                            color: demoProfile.classification === 'HIGH_VALUE' ? '#00DE7A'
                              : demoProfile.classification === 'AT_RISK' ? '#F03060'
                              : demoProfile.classification === 'SALES_READY' ? '#F5A623'
                              : '#7A90B5',
                          }}>
                          {demoProfile.classification?.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text)' }}>
                        {demoProfile.story_hook}
                      </div>
                      <div className="text-[10px] mt-1.5" style={{ color: 'var(--dim)' }}>
                        {demoProfile.account_summary}
                      </div>
                      {demoProfile.recommended_action && (
                        <div className="mt-2 px-2.5 py-1 rounded-md inline-block text-[9px] font-semibold"
                          style={{ background: 'rgba(0,201,177,.08)', color: '#00C9B1' }}>
                          Recommended: {demoProfile.recommended_action.replace(/_/g, ' ')}
                        </div>
                      )}
                      <div className="mt-2 text-[9px]" style={{ color: '#3370E8', cursor: 'pointer' }}
                        onClick={() => {
                          setDemoProfileLoading(true)
                          const ind = (selectedIvrRef.current || 'global_banking').replace('global_', '')
                          const classFilter = demoStep === 3
                            ? `&classification=${valueTier === 'silver' ? 'AT_RISK' : valueTier === 'bronze' ? 'STANDARD' : 'HIGH_VALUE'}`
                            : ''
                          fetch(`${SERVICE_B_URL.replace(':9000', ':9700')}/crm/demo-profile?country=${encodeURIComponent(callerCountry)}&industry=${ind}${classFilter}`)
                            .then(r => r.json())
                            .then(data => { if (data?.mobile) setDemoProfile(data) })
                            .catch(() => {})
                            .finally(() => setDemoProfileLoading(false))
                        }}>
                        {demoProfileLoading ? '↻ Loading...' : '↻ Different customer'}
                      </div>
                    </div>
                  )}
                  {(scenario?.mode === 'sales' || demoStep === 3) && !demoProfile && demoProfileLoading && (
                    <div className="mx-auto mb-5 text-[11px]" style={{ color: 'var(--dim)' }}>
                      Loading customer profile…
                    </div>
                  )}

                  <button onClick={handleStart}
                    disabled={demoStep === 3 && valueTier === 'gold'}
                    className="inline-flex items-center gap-2 px-12 py-4 rounded-xl text-[17px] font-bold cursor-pointer transition-all hover:-translate-y-0.5 mb-1 border-none"
                    style={{
                      background: (demoStep === 3 && valueTier === 'gold') ? 'var(--b1)' : jConfig?.color,
                      color: (demoStep === 3 && valueTier === 'gold') ? 'var(--dim)' : (jConfig?.color === '#f03060' ? '#fff' : '#000'),
                      boxShadow: '0 4px 20px rgba(0,0,0,.3)',
                      cursor: (demoStep === 3 && valueTier === 'gold') ? 'not-allowed' : 'pointer',
                    }}>
                    ▶ {demoStep === 0 ? 'Try routine intent demo' : demoStep === 1 ? 'Try revenue discovery demo' : demoStep === 2 ? 'Try frustration escalation demo' : (demoStep === 3 && valueTier === 'gold') ? '🥇 Gold — Coming Soon' : `Try ${valueTier || 'value-based'} routing demo`}
                  </button>
                  <div className="text-[9px] mb-2" style={{ color: 'var(--dim)' }}>Zero integration · Zero cost · In 17 minutes</div>

                  <div className="text-[11px] mb-3" style={{ color: 'var(--dim)' }}>{jConfig?.hint}</div>

                  <div className="mb-3">
                    <div onClick={() => handleMigrate('journey_migrate')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all hover:opacity-90"
                      style={{ background: 'rgba(0,201,177,.08)', border: '1px solid rgba(0,201,177,.12)' }}>
                      <span className="text-[10px] font-semibold" style={{ color: '#00c9b1' }}>📱 Migrate Your IVR</span>
                      <span className="text-[9px]" style={{ color: '#4a5f80' }}>·</span>
                      <span className="text-[9px]" style={{ color: '#7a90b5' }}>Zero integration · Zero cost · In 17 minutes</span>
                      <span className="text-[10px]" style={{ color: '#00c9b1' }}>→</span>
                    </div>
                  </div>

                  {qTenant && qTenant !== 'experience_shop' ? (
                    <div className="flex justify-center">
                      <span className="px-4 py-2 rounded-md border text-[11px] font-semibold"
                        style={{ background: 'rgba(0,201,177,.12)', borderColor: '#00c9b1', color: '#00c9b1' }}>
                        {qTenant.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-center flex-wrap">
                      {INDUSTRY_OPTIONS.map(ind => (
                        <span key={ind.key}
                          onClick={() => {
                            if (callActive) return
                            updateSelectedIvr(ind.key)
                          }}
                          className="px-3 py-1.5 rounded-md border text-[10px] transition-all"
                          style={{
                            cursor: callActive ? 'not-allowed' : 'pointer',
                            opacity: callActive && selectedIvr !== ind.key ? 0.35 : 1,
                            background: selectedIvr === ind.key ? 'rgba(0,201,177,.12)' : 'var(--card2)',
                            borderColor: selectedIvr === ind.key ? '#00c9b1' : 'var(--b1)',
                            color: selectedIvr === ind.key ? '#00c9b1' : 'var(--dim)',
                            boxShadow: selectedIvr === ind.key ? '0 0 0 1px rgba(0,201,177,.2)' : 'none',
                          }}>
                          {ind.icon} {ind.label}
                          {callActive && selectedIvr === ind.key && <span className="ml-1 text-[7px]">●</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            /* ══ POST-CALL — 3 boxes with real billing ══ */
            ) : showCelebration && !callActive ? (
              <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                <PostCallBoxes
                  demoStep={demoStep}
                  intents={finalIntents}
                  totalCost={finalCost}
                  currency={currency}
                  callDuration={callEndDuration}
                  onTryNext={handleTryNext}
                  onStartCall={handleStart}
                  onNavigateJourney={handleNavigateJourney}
                  sessionDisplayId={sessionDisplayId}
                  onSignUp={() => openSignUp('post_call')}
                  onSelectIndustry={updateSelectedIvr}
                  selectedIvr={selectedIvr}
                />
              </div>

            /* ══ ACTIVE CALL ══ */
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden min-h-0">

                {/* Status bar */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 mx-3 mt-2 rounded-md flex-shrink-0"
                  style={{ background: 'rgba(0,201,177,.05)', border: '1px solid rgba(0,201,177,.1)' }}>
                  <div className="w-[7px] h-[7px] rounded-full"
                    style={{ background: '#00c9b1', animation: 'blink 1.2s infinite' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text)' }}>
                    {elapsed < 3 ? 'Connecting you...' : qTenant && qTenant !== 'experience_shop' ? `Live · ${qTenant.replace(/_/g, ' ')} · ${jConfig?.exp}` : `Live · ${INDUSTRY_OPTIONS.find(i => i.key === selectedIvr)?.icon || '🏦'} ${INDUSTRY_OPTIONS.find(i => i.key === selectedIvr)?.label || 'Banking'} · ${jConfig?.exp}`}
                  </span>
                  <span className="ml-auto">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold"
                      style={{
                        background: 'rgba(240,48,96,.15)', color: '#f03060',
                        animation: 'demoPulse 1.5s ease-in-out infinite',
                      }}>
                      🔴 DEMO CALL
                    </span>
                  </span>
                </div>

                {/* Nudge system — fades when intent detected */}
                <div className="px-3 pt-2">
                  <NudgeSystem
                    demoStep={demoStep}
                    callActive={callActive}
                    intentDetected={hasIntents}
                    callerCountry={callerCountry}
                    initialIndustry={(selectedIvr || "").replace("global_", "") as any}
                    isUploadedTenant={!!qTenant && qTenant !== 'experience_shop'}
                    tenantDisplayName={qTenant ? qTenant.replace(/_/g, ' ') : undefined}
                  />
                </div>

                {/* CRM caller identity — compact bar during active sales call */}
                {scenario?.mode === 'sales' && demoProfile && callActive && (
                  <div className="mx-3 mt-1.5 px-3 py-2 rounded-lg flex items-center gap-2"
                    style={{ background: 'rgba(51,112,232,.06)', border: '1px solid rgba(51,112,232,.12)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: 'rgba(51,112,232,.15)', color: '#3370E8' }}>
                      {demoProfile.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--bright)' }}>{demoProfile.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                      style={{
                        background: demoProfile.classification === 'HIGH_VALUE' ? 'rgba(0,222,122,.1)' : 'rgba(245,166,35,.1)',
                        color: demoProfile.classification === 'HIGH_VALUE' ? '#00DE7A' : '#F5A623',
                      }}>
                      {demoProfile.classification?.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] ml-auto" style={{ color: 'var(--dim)' }}>{demoProfile.story_hook}</span>
                  </div>
                )}

                {/* Transcription header */}
                <div className="mx-3 mt-1.5 mb-0">
                  <div className="flex items-center justify-between px-2 py-1 cursor-pointer"
                    onClick={() => setTxCollapsed(!txCollapsed)}>
                    <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>
                      📝 Live Transcription
                    </span>
                    <span className="text-[10px] transition-transform duration-200"
                      style={{ color: 'var(--dim)', transform: txCollapsed ? 'rotate(-90deg)' : 'none' }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Transcript */}
                {!txCollapsed && (
                  <div ref={txRef} className="flex-1 overflow-y-auto px-3 pb-2 flex flex-col gap-1.5"
                    style={{ borderTop: '1px solid var(--b1)' }}>

                    {transcript.length === 0 && (
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
                  </div>
                )}

                {/* Meters */}
                <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--b1)' }}>
                  <div className="flex">
                    {[
                      { label: '⏱ Duration', val: formatDuration(elapsed),                 sub: 'Running…', color: 'var(--bright)' },
                      { label: '💰 Cost',     val: formatCost(liveCall.liveCost, currency), sub: 'This call', color: 'var(--green)' },
                      { label: '🎯 Intents',  val: String(liveCall.liveIntents.length),     sub: 'Business',  color: '#8a4ee8' },
                    ].map((m, i) => (
                      <div key={i} className="flex-1 p-2 border-r last:border-r-0"
                        style={{ borderColor: 'var(--b1)' }}>
                        <div className="text-[7px] font-bold tracking-wide uppercase mb-0.5" style={{ color: 'var(--dim)' }}>{m.label}</div>
                        <div className="font-mono text-[18px] sm:text-[22px] font-semibold leading-none" style={{ color: m.color }}>{m.val}</div>
                        <div className="text-[7px] mt-0.5" style={{ color: 'var(--dim)' }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* End call button */}
                  <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--b1)' }}>
                    <button
                      onClick={handleEndCall}
                      className="w-full py-2.5 rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-all hover:opacity-85"
                      style={hasIntents && nextJourneyConfig
                        ? { background: 'linear-gradient(90deg, #d44444, #e09820)', color: '#fff', fontSize: '12px' }
                        : { background: '#d44444', color: '#fff' }}>
                      {hasIntents && nextJourneyConfig
                        ? `🔴 End Call & Try ${nextJourneyConfig.icon} ${nextJourneyConfig.name} Journey →`
                        : '📵 End Call'}
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-2 text-[9px]"
                      style={{ color: 'var(--dim)' }}>
                      <span>Like what you hear?</span>
                      <button
                        onClick={() => openSignUp('active_call_book')}
                        className="font-bold transition-colors hover:underline"
                        style={{ background: 'none', border: 'none', color: '#18c48a', cursor: 'pointer', fontSize: '9px' }}>
                        📅 Book a call →
                      </button>
                      <span style={{ color: 'var(--b2)' }}>|</span>
                      <button
                        onClick={() => setShowIVRBar(true)}
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
                Real AI · No credit card · Migrate your IVR in 17 minutes
              </span>
            </div>
          </div>

          {/* ── RIGHT PANEL — only during active call, dial pad only ── */}
          {callActive && (
            <div className="w-[260px] xl:w-[280px] flex-shrink-0 flex-col overflow-hidden hidden lg:flex"
              style={{ borderLeft: '1px solid var(--b1)', background: 'var(--card)' }}>

              {/* Dial pad */}
              <div className="px-3 pt-4 pb-2">
                <div className="text-[7.5px] font-bold uppercase tracking-widest mb-2 text-center" style={{ color: 'var(--dim)' }}>
                  📟 IVR Dial Pad
                </div>
                <IvrDialpad
                  visible={true}
                  onPress={liveCall.pressDTMF}
                  lastDigit={liveCall.state.lastDigit}
                  trigger="data_channel_signal"
                />
                <div className="text-center mt-2 text-[7px]" style={{ color: 'var(--dim)' }}>
                  Press ✱ for phone menu
                </div>
              </div>

              {/* Connection status strip */}
              <div className="mt-auto px-3 py-1.5 border-t flex items-center gap-1.5 flex-shrink-0"
                style={{ borderColor: 'var(--b1)', background: 'rgba(0,0,0,.12)' }}>
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background:
                      liveCall.state.status === 'connected'
                        ? '#22c55e'
                        : liveCall.state.status === 'connecting'
                        ? '#3b82f6'
                        : '#6b7280',
                    animation: liveCall.state.status === 'connected' ? 'pulse 2s infinite' : 'none',
                  }}
                />
                <span className="text-[8px]" style={{ color: 'var(--dim)' }}>
                  {liveCall.state.status === 'connected'
                    ? liveCall.state.micEnabled
                      ? 'Mic active — AI is listening'
                      : 'Connected — mic off'
                    : liveCall.state.status === 'connecting'
                    ? 'Connecting…'
                    : 'Idle'}
                </span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══ FLOATING IVR BAR ══ */}
      <FloatingIVRBar visible={showIVRBar} onClose={() => setShowIVRBar(false)} />

      {/* ══ SIGN UP MODAL ══ */}
      <SignUpModal
        open={showSignUp}
        onClose={() => setShowSignUp(false)}
        source={signUpSource}
        redirectTo={signUpRedirect}
        onSuccess={() => {
          // User signed up — refresh header to show avatar
          setCurrentUser(getUser())
        }}
      />

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

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  )
}

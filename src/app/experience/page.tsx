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
import { useLiveKitCall, micPreflight, type MicPreflight } from '@/hooks/useLiveKitCall'
import type { IntentKey, Currency, JourneyStageKey } from '@/types'
import SignUpModal from '@/components/auth/SignUpModal'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import { getUser, signOut, type CxUser } from '@/lib/auth'

interface TxLine { who: 'user' | 'ai' | 'sys'; text: string; meta?: string; ts?: number }

// ── Config ─────────────────────────────────────────────────────────────────
import { getEnv } from '@/lib/env'
import { resolveCrmIndustry, demoProfileUrl } from '@/lib/crmIndustry'
import { tenantLabel, usePartnerConfig } from '@/lib/partner'
import { useBranding } from '@/components/branding/BrandingProvider'
import { brandCopy } from '@/lib/branding'
import { T, alpha, tint } from '@/lib/theme'
const SERVICE_B_URL = getEnv().serviceB
const TENANT_KEY    = 'experience_shop'
const DEFAULT_IVR_KEY = 'global_banking'

function HomeInner() {
  const partnerCfg = usePartnerConfig() // null on non-partner hosts → today's labels
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

  // R174 fix: only restore tenant from sessionStorage when autostart=true (i.e. redirected from /migrate)
  // Plain homepage should always default to experience_shop, not sticky SIB
  const isAutostart = searchParams.get("autostart") === "true"
  const qTenant = qTenantRaw || (isAutostart && typeof window !== 'undefined' ? sessionStorage.getItem('cx_tenant_key') : null)
  const qIvr = qIvrRaw || (isAutostart && typeof window !== 'undefined' ? sessionStorage.getItem('cx_ivr_key') : null)
  const qRoutingMode = qRoutingModeRaw || (isAutostart && typeof window !== 'undefined' ? sessionStorage.getItem('cx_routing_mode') : null)
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
  const brandCtx = useBranding()
  const orgName = brandCtx.displayName
  // Partner tenants (logged in) see their own name in the system line; everyone else: unchanged.
  const connectingText = brandCopy('Connecting to AiIVRs…', brandCtx.partnerName, orgName)
  // Own tenant: branding display_name → partner demo name → company_name (never the raw key).
  const ivrLabel = (tk: string) => tk === currentUser?.tenant_key ? (orgName || 'Your IVR') : tenantLabel(tk, partnerCfg)
  useEffect(() => { setCurrentUser(getUser()) }, [])
  const handleSignOut = useCallback(() => signOut(), [])

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
  // Fix: when autostart=true, the journey param must select the scenario from the
  // first render. everStarted is also URL-initialized (true on autostart), which
  // makes the journey->demoStep effects' `!everStarted` guard skip them — so
  // demoStep stayed 0 (scenario 'premium') for every journey and sales/value-tier
  // gating never sent caller_mobile/crm_tier. Initialize demoStep from the URL here.
  const [demoStep, setDemoStep]                 = useState(() => {
    if (typeof window === 'undefined') return 0
    const p = new URLSearchParams(window.location.search)
    if (p.get('autostart') === 'true') {
      const j = parseInt(p.get('journey') || '', 10)
      if (!isNaN(j) && j >= 0 && j <= 3) return j
    }
    return 0
  })
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
        const geoCurrency = (geo?.currency || '').toLowerCase()
        if (['inr','usd','eur','gbp','aed','sgd','jpy','aud'].includes(geoCurrency)) setCurrency(geoCurrency as Currency)
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
  // Mic gate: pre-call preflight failure (policy / permission denied). When set, the
  // call is NOT started and a blocking overlay explains how to allow the microphone.
  const [micGate, setMicGate] = useState<MicPreflight | null>(null)

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
  // Experience level Service A actually reports (intent_cost.exp / exp_change);
  // falls back to the journey's nominal label until the first report arrives.
  const reportedExp     = liveCall.currentExp as unknown
  const liveExpLabel    = typeof reportedExp === 'number' && reportedExp > 0
    ? `Exp ${reportedExp}`
    : typeof reportedExp === 'string' && reportedExp
      ? (reportedExp === 'realtime' ? 'Realtime' : reportedExp)
      : (jConfig?.exp || '')

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
      const j = searchParams.get("journey")
      if (j !== null) { const step = parseInt(j, 10); if (!isNaN(step) && step >= 0 && step <= 3) setDemoStep(step) }
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
    // R157: For value routing (demoStep 3), fetch profile matching the selected value tier
    const classification = demoStep === 3
      ? (valueTier === 'silver' ? 'AT_RISK' : valueTier === 'bronze' ? 'STANDARD' : 'HIGH_VALUE')
      : undefined
    // jk_j2j4_r1: industry from Service B (not the IVR key); unresolved → no profile, no pitch
    resolveCrmIndustry(SERVICE_B_URL, qTenant || TENANT_KEY, selectedIvrRef.current || 'global_banking')
      .then(industry => {
        if (!industry) {
          console.info('[CRM] INDUSTRY_UNRESOLVED — no demo profile, no pitch')
          if (!cancelled) setDemoProfile(null)
          return null
        }
        return fetch(demoProfileUrl(SERVICE_B_URL.replace(':9000', ':9700'), callerCountry, industry, classification))
          .then(r => r.json())
          .then(data => { if (!cancelled && data?.mobile) setDemoProfile(data) })
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDemoProfileLoading(false) })
    return () => { cancelled = true }
  }, [demoStep, scenario, selectedIvr, callerCountry, valueTier, qTenant])

  // ── Start call ────────────────────────────────────────────────────────────
  const startCallNow = useCallback(() => {
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
    addTx({ who: 'sys', text: connectingText })
    liveCall.connect(qTenant || TENANT_KEY, qIvr || selectedIvrRef.current, SERVICE_B_URL, {
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
    // Include demoStep/scenario/demoProfile/valueTier so the connect payload uses the
    // current scenario (sales caller_mobile, value-tier crm_tier), not stale initials.
  }, [startCall, addTx, reveal, liveCall, demoStartTime, revealed, isInfraDemo, currentUser, connectingText,
      demoStep, scenario, demoProfile, valueTier])

  // Mic preflight (no prompt, no getUserMedia) before starting — never connect
  // knowing the mic cannot work; show the mic overlay instead.
  const handleStart = useCallback(async () => {
    if (isInfraDemo) return
    const pf = await micPreflight()
    if (!pf.ok) { setMicGate(pf); return }
    setMicGate(null)
    startCallNow()
  }, [isInfraDemo, startCallNow])

  const micBlockedInCall = callActive && liveCall.state.status === 'connected' && !!liveCall.state.micError
  const handleMicRetry = useCallback(async () => {
    if (micBlockedInCall) {
      const ok = await liveCall.retryMic()
      if (!ok) {
        const pf = await micPreflight()
        if (!pf.ok) showToast(pf.message || 'Microphone is still blocked.')
      }
      return
    }
    handleStart()
  }, [micBlockedInCall, liveCall, handleStart, showToast])

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
        @keyframes micPulse    { 0%,100% { box-shadow:0 0 0 0 ${tint('xGreen','.3')}; } 50% { box-shadow:0 0 18px 4px ${tint('xGreen','.2')}; } }
        @keyframes wave        { 0% { transform:scale(1); opacity:.35; } 100% { transform:scale(1.4); opacity:0; } }
        @keyframes demoPulse   { 0% { transform:scale(1); opacity:1; } 14% { transform:scale(1.18); opacity:1; } 28% { transform:scale(1); opacity:.85; } 42% { transform:scale(1.12); opacity:1; } 70% { transform:scale(1); opacity:.75; } 100% { transform:scale(1); opacity:1; } }
        @keyframes switchGlow  { 0% { box-shadow:0 0 0 0 ${tint('warn','.4')}; } 50% { box-shadow:0 0 16px 4px ${tint('warn','.2')}; } 100% { box-shadow:0 0 0 0 transparent; } }
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
                        background: isDone ? T.teal : 'transparent',
                        border: isCurrent ? `2px solid ${T.amber}` : isDone ? `2px solid ${T.teal}` : '2px solid var(--b2)',
                        color: isDone ? T.onTeal : isCurrent ? T.amber : 'var(--dim)',
                        boxShadow: isCurrent ? `0 0 0 3px ${tint('amber','.1')}` : 'none',
                      }}>
                      {step.num}
                    </div>
                    <span className="text-[10px] hidden sm:inline"
                      style={{
                        color: isDone ? T.teal : isCurrent ? T.amber : 'var(--dim)',
                        fontWeight: isCurrent ? 600 : 400,
                      }}>
                      {step.icon} {step.label}
                    </span>
                  </div>
                  {i < JOURNEY_STEPS.length - 1 && (
                    <div className="h-[2px] mx-2 sm:mx-3 flex-1"
                      style={{ background: isDone ? T.teal : 'var(--b1)' }} />
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
              style={{ background: alpha(ic.color, '15'), color: ic.color, border: `1px solid ${alpha(ic.color, '33')}` }}>
              {scenario?.infraIcon} {ic.label}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded hidden sm:inline-flex"
              style={{ background: alpha(dc.color, '15'), color: dc.color, border: `1px solid ${alpha(dc.color, '33')}` }}>
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
                        { tier: 'gold' as const, label: '🥇 Gold', color: T.amber, desc: 'GPT-4o Realtime · Exp 2', disabled: false },
                        { tier: 'silver' as const, label: '🥈 Silver', color: T.silver, desc: 'Gemini S2S · Exp 3', disabled: false },
                        { tier: 'bronze' as const, label: '🥉 Bronze', color: T.bronze, desc: 'Pipeline · Exp 4/5', disabled: false },
                      ]).map(t => (
                        <button key={t.tier}
                          onClick={() => !t.disabled && setValueTier(t.tier)}
                          className="px-5 py-3 rounded-xl border text-center min-w-[120px] transition-all"
                          style={{
                            background: valueTier === t.tier ? alpha(t.color, '15') : 'var(--card)',
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
                      style={{ maxWidth: 440, background: tint('blue','.06'), borderColor: tint('blue','.18') }}>
                      <div className="text-[9px] uppercase tracking-wide font-bold mb-2" style={{ color: T.blue }}>
                        You are calling as
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold"
                          style={{ background: tint('blue','.15'), color: T.blue }}>
                          {demoProfile.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[15px] font-bold" style={{ color: 'var(--bright)' }}>{demoProfile.name}</div>
                          <div className="text-[10px]" style={{ color: 'var(--dim)' }}>{demoProfile.country_name}</div>
                        </div>
                        <div className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                          style={{
                            background: demoProfile.classification === 'HIGH_VALUE' ? tint('green','.1')
                              : demoProfile.classification === 'AT_RISK' ? tint('red','.1')
                              : demoProfile.classification === 'SALES_READY' ? tint('amber','.1')
                              : tint('tx2','.1'),
                            color: demoProfile.classification === 'HIGH_VALUE' ? T.green
                              : demoProfile.classification === 'AT_RISK' ? T.red
                              : demoProfile.classification === 'SALES_READY' ? T.amber
                              : T.tx2,
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
                          style={{ background: tint('teal','.08'), color: T.teal }}>
                          Recommended: {demoProfile.recommended_action.replace(/_/g, ' ')}
                        </div>
                      )}
                      <div className="mt-2 text-[9px]" style={{ color: T.blue, cursor: 'pointer' }}
                        onClick={() => {
                          setDemoProfileLoading(true)
                          const cls = demoStep === 3
                            ? (valueTier === 'silver' ? 'AT_RISK' : valueTier === 'bronze' ? 'STANDARD' : 'HIGH_VALUE')
                            : undefined
                          // jk_j2j4_r1: same industry source as the journey fetch
                          resolveCrmIndustry(SERVICE_B_URL, qTenant || TENANT_KEY, selectedIvrRef.current || 'global_banking')
                            .then(ind => ind
                              ? fetch(demoProfileUrl(SERVICE_B_URL.replace(':9000', ':9700'), callerCountry, ind, cls))
                                  .then(r => r.json())
                                  .then(data => { if (data?.mobile) setDemoProfile(data) })
                              : null)
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

                  {/* R157→r5: Gold re-enabled (Azure GA gpt-realtime-mini stable) */}
                  <button onClick={handleStart}
                    className="inline-flex items-center gap-2 px-12 py-4 rounded-xl text-[17px] font-bold cursor-pointer transition-all hover:-translate-y-0.5 mb-1 border-none"
                    style={{
                      background: jConfig?.color,
                      color: (jConfig?.color === '#f03060' ? '#fff' : '#000'),
                      boxShadow: `0 4px 20px ${tint('shade','.3')}`,
                      cursor: 'pointer',
                    }}>
                    ▶ {demoStep === 0 ? 'Try routine intent demo' : demoStep === 1 ? 'Try revenue discovery demo' : demoStep === 2 ? 'Try frustration escalation demo' : `Try ${valueTier || 'value-based'} routing demo`}
                  </button>
                  <div className="text-[9px] mb-2" style={{ color: 'var(--dim)' }}>Zero integration · Zero cost · In 17 minutes</div>

                  <div className="text-[11px] mb-3" style={{ color: 'var(--dim)' }}>{jConfig?.hint}</div>

                  <div className="mb-3">
                    <div onClick={() => handleMigrate('journey_migrate')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all hover:opacity-90"
                      style={{ background: tint('teal','.08'), border: `1px solid ${tint('teal','.12')}` }}>
                      <span className="text-[10px] font-semibold" style={{ color: T.teal }}>📱 Migrate Your IVR</span>
                      <span className="text-[9px]" style={{ color: T.tx3 }}>·</span>
                      <span className="text-[9px]" style={{ color: T.tx2 }}>Zero integration · Zero cost · In 17 minutes</span>
                      <span className="text-[10px]" style={{ color: T.teal }}>→</span>
                    </div>
                  </div>

                  {qTenant && qTenant !== 'experience_shop' ? (
                    <div className="flex justify-center">
                      <span className="px-4 py-2 rounded-md border text-[11px] font-semibold"
                        style={{ background: tint('teal','.12'), borderColor: T.teal, color: T.teal }}>
                        {ivrLabel(qTenant)}
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
                            background: selectedIvr === ind.key ? tint('teal','.12') : 'var(--card2)',
                            borderColor: selectedIvr === ind.key ? T.teal : 'var(--b1)',
                            color: selectedIvr === ind.key ? T.teal : 'var(--dim)',
                            boxShadow: selectedIvr === ind.key ? `0 0 0 1px ${tint('teal','.2')}` : 'none',
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
                  style={{ background: tint('teal','.05'), border: `1px solid ${tint('teal','.1')}` }}>
                  <div className="w-[7px] h-[7px] rounded-full"
                    style={{ background: T.teal, animation: 'blink 1.2s infinite' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text)' }}>
                    {elapsed < 3 ? 'Connecting you...' : qTenant && qTenant !== 'experience_shop' ? `Live · ${ivrLabel(qTenant)} · ${liveExpLabel}` : `Live · ${INDUSTRY_OPTIONS.find(i => i.key === selectedIvr)?.icon || '🏦'} ${INDUSTRY_OPTIONS.find(i => i.key === selectedIvr)?.label || 'Banking'} · ${liveExpLabel}`}
                  </span>
                  <span className="ml-auto">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold"
                      style={{
                        background: tint('red','.15'), color: T.red,
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
                    initialIndustry={(qTenant && qTenant !== 'experience_shop' ? 'banking' : (selectedIvr || "").replace("global_", "")) as any}
                    isUploadedTenant={!!qTenant && qTenant !== 'experience_shop'}
                    tenantDisplayName={qTenant ? ivrLabel(qTenant) : undefined}
                  />
                </div>

                {/* CRM caller identity — compact bar during active sales call */}
                {scenario?.mode === 'sales' && demoProfile && callActive && (
                  <div className="mx-3 mt-1.5 px-3 py-2 rounded-lg flex items-center gap-2"
                    style={{ background: tint('blue','.06'), border: `1px solid ${tint('blue','.12')}` }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: tint('blue','.15'), color: T.blue }}>
                      {demoProfile.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--bright)' }}>{demoProfile.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                      style={{
                        background: demoProfile.classification === 'HIGH_VALUE' ? tint('green','.1') : tint('amber','.1'),
                        color: demoProfile.classification === 'HIGH_VALUE' ? T.green : T.amber,
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
                            background: tx.who === 'user' ? tint('blue','.15') : tx.who === 'ai' ? tint('xGreen','.12') : tint('veil','.05'),
                            color:      tx.who === 'user' ? T.sky                : tx.who === 'ai' ? 'var(--green)'         : 'var(--dim)',
                          }}>
                          {tx.who === 'user' ? 'YOU' : tx.who === 'ai' ? 'AI' : '···'}
                        </div>
                        <div className="flex-1 rounded-md border p-1.5"
                          style={{
                            background:  tx.who === 'user' ? tint('blue','.07') : 'var(--card2)',
                            borderColor: tx.who === 'user' ? tint('blue','.15') : 'var(--b1)',
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
                      { label: '🎯 Intents',  val: String(liveCall.liveIntents.length),     sub: 'Business',  color: T.xPurple },
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
                        ? { background: `linear-gradient(90deg, ${T.alarm}, ${T.xAmber})`, color: T.white, fontSize: '12px' }
                        : { background: T.alarm, color: T.white }}>
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
                        style={{ background: 'none', border: 'none', color: T.xGreen, cursor: 'pointer', fontSize: '9px' }}>
                        📅 Book a call →
                      </button>
                      <span style={{ color: 'var(--b2)' }}>|</span>
                      <button
                        onClick={() => setShowIVRBar(true)}
                        className="font-bold transition-colors hover:underline"
                        style={{ background: 'none', border: 'none', color: T.cyan, cursor: 'pointer', fontSize: '9px' }}>
                        Give us your IVR #
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Promo strip */}
            <div className="flex items-center gap-1.5 px-3 py-1 border-t flex-shrink-0"
              style={{ borderColor: tint('blue','.18'), background: `linear-gradient(90deg,${T.promoA},${T.promoB})` }}>
              <span className="text-[7px] font-extrabold px-1 py-px rounded"
                style={{ background: 'var(--amber)', color: T.onAmber }}>FREE</span>
              <span className="text-[8px]" style={{ color: T.steel }}>
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
                style={{ borderColor: 'var(--b1)', background: tint('shade','.12') }}>
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background:
                      liveCall.state.status === 'connected'
                        ? T.ok
                        : liveCall.state.status === 'connecting'
                        ? T.azure
                        : T.muted,
                    animation: liveCall.state.status === 'connected' ? 'pulse 2s infinite' : 'none',
                  }}
                />
                <span className="text-[8px]" style={{ color: 'var(--dim)' }}>
                  {liveCall.state.status === 'connected'
                    ? liveCall.state.micEnabled
                      ? 'Mic active — AI is listening'
                      : liveCall.state.micError
                        ? 'Mic blocked — tap to allow'
                        : 'Connected — enabling mic…'
                    : liveCall.state.status === 'connecting'
                    ? 'Connecting…'
                    : 'Idle'}
                </span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══ MIC GATE OVERLAY — never leave the caller silently connected with mic off ══ */}
      {(micGate || micBlockedInCall) && (
        <div data-testid="mic-gate" className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: T.scrim, backdropFilter: 'blur(3px)' }}>
          <div className="w-full max-w-sm rounded-xl p-5 text-center shadow-2xl"
            style={{ background: 'var(--card, #0e1826)', border: '1px solid var(--b2, #22364f)' }}>
            <div className="text-[34px] mb-2">🎙️</div>
            <div className="text-[15px] font-bold mb-1.5" style={{ color: 'var(--text, #e6eefb)' }}>
              Microphone needed for this call
            </div>
            <div className="text-[11px] leading-relaxed mb-4" style={{ color: 'var(--dim, #7a90b5)' }}>
              {micGate?.message
                || (liveCall.state.micError?.startsWith('NotAllowedError')
                  ? 'Your browser did not allow the microphone. Tap below and choose “Allow”. If no prompt appears, click the lock icon in the address bar → Microphone → Allow.'
                  : liveCall.state.micError?.startsWith('NotFoundError')
                    ? 'No microphone was found. Connect a microphone and tap below.'
                    : 'The AI can’t hear you yet. Tap below to allow the microphone.')}
            </div>
            <button data-testid="mic-gate-allow" onClick={handleMicRetry}
              className="w-full px-5 py-3 rounded-lg text-[14px] font-bold border-none cursor-pointer mb-2"
              style={{ background: T.teal, color: T.onTeal }}>
              {micBlockedInCall ? 'Tap to allow microphone' : 'Try again'}
            </button>
            <button onClick={() => { setMicGate(null); if (micBlockedInCall) handleEndCall() }}
              className="w-full px-5 py-2 rounded-lg text-[11px] border cursor-pointer"
              style={{ background: 'transparent', borderColor: 'var(--b1, #1a2b40)', color: 'var(--dim, #7a90b5)' }}>
              {micBlockedInCall ? 'End call' : 'Cancel'}
            </button>
          </div>
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
          background: T.panel, border: '1px solid var(--b2)',
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

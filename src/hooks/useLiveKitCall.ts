'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Room,
  RoomEvent,
  ConnectionState,
  type RemoteTrack,
} from 'livekit-client'

/* ── Types ────────────────────────────────────────────────────────────────── */

export type CallMode = 'ai' | 'ivr'
export type LiveCallStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'

export interface TxLine {
  who: 'user' | 'ai' | 'sys'
  text: string
  meta?: string
  ts?: number
}

export interface LiveIntent {
  key: string
  exp: number
  cost: number
  latencyMs: number
  wasPromoted: boolean
  ts: number
}

export interface LiveCallState {
  status: LiveCallStatus
  mode: CallMode
  roomName: string
  error: string | null
  lastDigit: string | null
  micEnabled: boolean
}

export interface UseLiveKitCallReturn {
  state: LiveCallState
  connect: (tenantKey: string, ivrKey: string, serviceBUrl: string) => Promise<void>
  disconnect: () => Promise<void>
  pressDTMF: (digit: string) => void
  /* ── Live data from Service A data channel ── */
  liveTranscript: TxLine[]
  liveLog: string[]
  liveIntents: LiveIntent[]
  liveCost: number
  currentExp: number | null
  crmName: string | null
}

/* ── Initial state ────────────────────────────────────────────────────────── */

const INITIAL_STATE: LiveCallState = {
  status: 'idle',
  mode: 'ai',
  roomName: '',
  error: null,
  lastDigit: null,
  micEnabled: false,
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useLiveKitCall(): UseLiveKitCallReturn {
  const [state, setState] = useState<LiveCallState>(INITIAL_STATE)
  const roomRef = useRef<Room | null>(null)

  /* Live data from Service A */
  const [liveTranscript, setLiveTranscript] = useState<TxLine[]>([])
  const [liveLog, setLiveLog]               = useState<string[]>([])
  const [liveIntents, setLiveIntents]       = useState<LiveIntent[]>([])
  const [liveCost, setLiveCost]             = useState(0)
  const [currentExp, setCurrentExp]         = useState<number | null>(null)
  const [crmName, setCrmName]               = useState<string | null>(null)

  const patch = useCallback((p: Partial<LiveCallState>) =>
    setState(s => ({ ...s, ...p })), [])

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false })
    setLiveLog(prev => [...prev.slice(-80), `${ts} ${msg}`])
  }, [])

  const addTx = useCallback((line: TxLine) => {
    setLiveTranscript(prev => [...prev, { ...line, ts: line.ts || Date.now() }])
  }, [])

  // Keyboard listener — active only when in IVR mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (state.mode !== 'ivr') return
      if ('0123456789*#'.includes(e.key)) pressDTMF(e.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.mode]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Connect ────────────────────────────────────────────────────────────── */

  const connect = useCallback(async (tenantKey: string, ivrKey: string, serviceBUrl: string) => {
    const base = serviceBUrl.replace(/\/$/, '')

    // Generate unique room name: {tenant}__{ivr}__{timestamp}
    const roomName = `${tenantKey}__${ivrKey}__${Date.now()}`

    // Reset live data
    setLiveTranscript([])
    setLiveLog([])
    setLiveIntents([])
    setLiveCost(0)
    setCurrentExp(null)
    setCrmName(null)

    patch({ status: 'connecting', error: null, roomName })
    addLog(`Connecting: room=${roomName}`)

    try {
      // ── Step 1: Create session in Service B ──
      // This registers the call, creates the DB record, and triggers agent dispatch
      addLog('Creating session via Service B...')
      const sessResp = await fetch(`${base}/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Key': tenantKey,
          'X-IVR-Key': ivrKey,
        },
        body: JSON.stringify({
          session_id: roomName,
          ivr_key: ivrKey,
          channel: 'web',
        }),
      })
      if (!sessResp.ok) {
        const errText = await sessResp.text().catch(() => '')
        throw new Error(`Session create failed (${sessResp.status}): ${errText}`)
      }
      const sessData = await sessResp.json()
      addLog(`Session created: ${sessData.session_id || roomName}`)

      // ── Step 2: Get LiveKit token from Service B ──
      addLog('Fetching LiveKit token...')
      const tokenResp = await fetch(`${base}/livekit/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Key': tenantKey,
          'X-IVR-Key': ivrKey,
        },
        body: JSON.stringify({
          tenant_key: tenantKey,
          ivr_key: ivrKey,
          room_name: roomName,
          identity: `web_user_${Date.now()}`,
        }),
      })
      if (!tokenResp.ok) throw new Error(`Token fetch failed: ${tokenResp.status}`)
      const { token, ws_url } = await tokenResp.json()
      if (!token || !ws_url) throw new Error('Missing token or ws_url from Service B')
      addLog(`Token OK → ${ws_url.substring(0, 45)}...`)

      // ── Step 3: Create + connect LiveKit room ──
      const room = new Room({ adaptiveStream: true, dynacast: true })
      roomRef.current = room

      // ── Audio: subscribe + attach ──
      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, participant) => {
        if (track.kind === 'audio') {
          const el = track.attach()
          el.style.display = 'none'
          document.body.appendChild(el)
          addLog(`Audio track subscribed: ${participant?.identity || 'unknown'}`)
        }
      })

      // ── Data channel: ALL events from Service A ──
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload))
          handleDataMessage(msg)
        } catch { /* ignore malformed */ }
      })

      // ── Room metadata (backup IVR signal) ──
      room.on(RoomEvent.RoomMetadataChanged, (metadata: string) => {
        try {
          const data = JSON.parse(metadata)
          if (data.ivr_mode === true && data.show_dialpad === true) patch({ mode: 'ivr' })
          if (data.ivr_mode === false) patch({ mode: 'ai' })
        } catch { /* ignore */ }
      })

      // ── Participant events ──
      room.on(RoomEvent.ParticipantConnected, (p) => {
        addLog(`Joined: ${p.identity}`)
        if (p.identity.startsWith('agent-')) {
          addTx({ who: 'sys', text: `Agent joined` })
        }
      })
      room.on(RoomEvent.ParticipantDisconnected, (p) => {
        addLog(`Left: ${p.identity}`)
        if (p.identity.startsWith('agent-')) {
          addTx({ who: 'sys', text: `Agent disconnected — call ended` })
          addLog('Agent left room — auto-disconnecting')
          // Small delay to let any final data channel messages arrive
          setTimeout(() => {
            if (roomRef.current) {
              roomRef.current.disconnect()
              roomRef.current = null
            }
            setState(prev => ({ ...prev, status: 'disconnected', mode: 'ai', micEnabled: false }))
          }, 1500)
        }
      })

      // ── Connection state ──
      room.on(RoomEvent.Connected, async () => {
        addLog('Connected to LiveKit room')
        try {
          await room.localParticipant.setMicrophoneEnabled(true)
          patch({ status: 'connected', micEnabled: true })
          addLog('Mic enabled — AI can hear you')
        } catch {
          patch({ status: 'connected', micEnabled: false })
          addLog('Mic failed — check browser permissions')
        }
      })

      room.on(RoomEvent.Disconnected, () => {
        patch({ status: 'disconnected', mode: 'ai', micEnabled: false })
        addLog('Disconnected from room')
        document.querySelectorAll('audio').forEach(el => el.remove())
      })

      room.on(RoomEvent.ConnectionStateChanged, (cs: ConnectionState) => {
        if (cs === ConnectionState.Reconnecting) {
          patch({ status: 'connecting' })
          addLog('Reconnecting...')
        }
      })

      await room.connect(ws_url, token)

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      patch({ status: 'error', error: msg })
      addLog(`Error: ${msg}`)
    }
  }, [patch, addLog]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Handle data channel messages from Service A ────────────────────────── */

  const handleDataMessage = useCallback((msg: Record<string, unknown>) => {
    const type = msg.type as string

    switch (type) {
      // ── Transcript lines (user speech + AI responses) ──
      case 'transcript': {
        const who = (msg.who as string) === 'user' ? 'user' : (msg.who as string) === 'ai' ? 'ai' : 'sys'
        addTx({ who, text: msg.text as string, meta: msg.meta as string | undefined })
        break
      }

      // ── Intent detected (informational — intent_cost is authoritative for counting) ──
      case 'intent': {
        addTx({
          who: 'sys',
          text: `Intent detected: ${msg.key}`,
          meta: `Exp ${msg.exp} · ₹${(msg.cost as number || 0).toFixed(2)} · ${msg.latency_ms || 0}ms${msg.was_promoted ? ' · PROMOTED' : ''}`,
        })
        addLog(`Intent detected: ${msg.key} → Exp ${msg.exp}`)
        break
      }

      // ── Experience level change ──
      case 'exp_change': {
        setCurrentExp(msg.to as number)
        addTx({
          who: 'sys',
          text: `Experience: ${msg.from} → ${msg.to}`,
          meta: msg.reason as string || '',
        })
        addLog(`Exp changed: ${msg.from} → ${msg.to} (${msg.reason})`)
        break
      }

      // ── Per-intent cost (finalized after each intent cycle) ──
      case 'intent_cost': {
        const intentNum = msg.intent_num as number
        const exp = msg.exp as number
        const ourCost = msg.our_cost_inr as number || 0
        const custPrice = msg.customer_price_inr as number || 0
        const sessionTotal = msg.session_total_customer_inr as number || 0
        const reason = (msg.reason as string || '').toLowerCase()

        // Always update session total cost
        setLiveCost(sessionTotal)

        // Determine if business intent vs system intent
        const SYSTEM_REASONS = ['feedback', 'rating', 'voice_feedback', 'score', 'idle', 'idle_disconnect', 'greeting', 'farewell', 'disconnect', 'call_end', 'nudge', 'dtmf', 'ivr', 'running_estimate']
        const isBusiness = !SYSTEM_REASONS.some(r => reason.includes(r))

        if (isBusiness) {
          const intent: LiveIntent = {
            key: `intent_${intentNum}`,
            exp,
            cost: custPrice,
            latencyMs: msg.wall_ms as number || 0,
            wasPromoted: false,
            ts: Date.now(),
          }
          setLiveIntents(prev => [...prev, intent])
        }

        // Skip transcript noise for running estimates — just update the cost meter silently
        if (reason !== 'running_estimate') {
          addTx({
            who: 'sys',
            text: isBusiness
              ? `Intent ${intentNum} cost: ₹${custPrice.toFixed(2)}`
              : `▸ ${reason || 'system'} cost: ₹${custPrice.toFixed(2)}`,
            meta: `STT ₹${(msg.stt_inr as number || 0).toFixed(3)} · LLM ₹${(msg.llm_inr as number || 0).toFixed(3)} · TTS ₹${(msg.tts_inr as number || 0).toFixed(3)} · Compute ₹${msg.compute_inr} · Session ₹${sessionTotal.toFixed(2)}`,
          })
          addLog(`Intent ${intentNum}: ₹${custPrice.toFixed(2)} (${isBusiness ? 'BUSINESS' : reason}) session ₹${sessionTotal.toFixed(2)}`)
        }
        break
      }

      // ── Cost pause/resume (DTMF handoff) ──
      case 'cost_update': {
        const paused = msg.paused as boolean
        const reason = msg.reason as string || ''
        if (paused) {
          addTx({ who: 'sys', text: '⏸ AI cost paused — IVR/DTMF active', meta: reason })
          addLog(`Cost paused: ${reason}`)
        } else {
          addTx({ who: 'sys', text: '▶ AI cost resumed', meta: `Intent ${msg.intent_num}` })
          addLog(`Cost resumed: intent ${msg.intent_num}`)
        }
        break
      }

      // ── Session final cost ──
      case 'session_cost_final': {
        const total = msg.session_total_customer_inr as number || 0
        setLiveCost(total)
        addTx({
          who: 'sys',
          text: `📊 Session total: ₹${total.toFixed(2)}`,
          meta: `${msg.intents} intent(s) · Our cost ₹${(msg.session_total_our_inr as number || 0).toFixed(2)}`,
        })
        addLog(`Session final: ₹${total.toFixed(2)} (${msg.intents} intents)`)
        break
      }

      // ── CRM profile loaded ──
      case 'crm': {
        const name = msg.name as string
        if (name) setCrmName(name)
        addLog(`CRM: ${name || 'no match'} (${msg.classification || 'unknown'})`)
        break
      }

      // ── IVR mode toggle (existing protocol) ──
      case 'ivr_mode': {
        if (msg.ivr_mode === true && msg.show_dialpad === true) {
          patch({ mode: 'ivr' })
          addLog('IVR mode activated — dialpad ready')
        }
        if (msg.ivr_mode === false) {
          patch({ mode: 'ai' })
          addLog('AI mode restored')
        }
        break
      }

      // ── Call ended signal ──
      case 'call_ended': {
        addTx({ who: 'sys', text: 'Call ended by agent' })
        addLog('Call ended signal received')
        disconnect()
        break
      }

      // ── Generic status/log from Service A ──
      case 'status': {
        addLog(msg.msg as string || 'status update')
        break
      }

      default:
        addLog(`Data: ${JSON.stringify(msg).substring(0, 100)}`)
    }
  }, [addTx, addLog, patch]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Disconnect ─────────────────────────────────────────────────────────── */

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect()
      roomRef.current = null
    }
    setState(INITIAL_STATE)
  }, [])

  /* ── DTMF ───────────────────────────────────────────────────────────────── */

  const pressDTMF = useCallback((digit: string) => {
    const room = roomRef.current
    if (!room || state.status !== 'connected') return
    const msg = JSON.stringify({ type: 'dtmf', digit })
    room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true })
    patch({ lastDigit: digit })
    addLog(`DTMF sent: ${digit}`)
    setTimeout(() => patch({ lastDigit: null }), 1800)
  }, [state.status, patch, addLog])

  return {
    state,
    connect,
    disconnect,
    pressDTMF,
    liveTranscript,
    liveLog,
    liveIntents,
    liveCost,
    currentExp,
    crmName,
  }
}

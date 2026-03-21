'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSentences, CHIP_DATA, SENTENCES, JOURNEY_CONFIGS } from '@/lib/journeyData'
import type { IndustryKey } from '@/lib/journeyData'

interface Props {
  demoStep: number
  callActive: boolean
  intentDetected: boolean // true once first intent fires
  onIndustryChange?: (industry: IndustryKey | null) => void
}

type NudgePhase = 'connecting' | 'live' | 'resolved'

export default function NudgeSystem({ demoStep, callActive, intentDetected, onIndustryChange }: Props) {
  const [phase, setPhase] = useState<NudgePhase>('connecting')
  const [connectText, setConnectText] = useState('Connecting you...')
  const [connectColor, setConnectColor] = useState('#f5a623')
  const [sentence, setSentence] = useState('')
  const [sentenceOpacity, setSentenceOpacity] = useState(0)
  const [sentenceIsOr, setSentenceIsOr] = useState(false)
  const [industry, setIndustry] = useState<IndustryKey | null>(null)
  const [suggestionsVisible, setSuggestionsVisible] = useState(false)
  const [suggestionsOpacity, setSuggestionsOpacity] = useState(1)

  const nudgeIdxRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const jConfig = JOURNEY_CONFIGS[demoStep]
  const jNum = demoStep + 1
  const isDirect = SENTENCES[jNum] === 'direct'

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Reset on new call
  useEffect(() => {
    if (!callActive) return
    setPhase('connecting')
    setConnectText('Connecting you...')
    setConnectColor('#f5a623')
    setSuggestionsVisible(false)
    setSuggestionsOpacity(1)
    setIndustry(null)
    nudgeIdxRef.current = 0

    // Step 1: After 3s, switch to "Connected"
    const t1 = setTimeout(() => {
      if (!mountedRef.current) return
      setConnectText('Connected')
      setConnectColor('#00de7a')
    }, 3000)

    // Step 2: After 3.8s, show suggestions + transcription
    const t2 = setTimeout(() => {
      if (!mountedRef.current) return
      if (isDirect) {
        // J4 Sales: skip straight to resolved
        setPhase('live')
      } else {
        setPhase('live')
        setSuggestionsVisible(true)
      }
    }, 3800)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [callActive, isDirect])

  // When intent detected, fade out suggestions
  useEffect(() => {
    if (intentDetected && phase === 'live' && !isDirect) {
      setSuggestionsOpacity(0)
      const t = setTimeout(() => {
        if (!mountedRef.current) return
        setSuggestionsVisible(false)
        setPhase('resolved')
      }, 500)
      return () => clearTimeout(t)
    }
  }, [intentDetected, phase, isDirect])

  // Sentence rotation loop
  const loopSentence = useCallback(() => {
    if (!mountedRef.current) return
    const sentences = getSentences(demoStep, industry)
    if (!sentences.length) return

    const text = sentences[nudgeIdxRef.current % sentences.length]

    // Fade in sentence
    setSentenceIsOr(false)
    setSentenceOpacity(0)
    const t1 = setTimeout(() => {
      if (!mountedRef.current) return
      setSentence(`"${text}"`)
      setSentenceOpacity(1)
    }, 400)

    // Hold 3s, then fade out
    const t2 = setTimeout(() => {
      if (!mountedRef.current) return
      setSentenceOpacity(0)
      nudgeIdxRef.current++

      // Show "or" briefly
      const t3 = setTimeout(() => {
        if (!mountedRef.current) return
        setSentenceIsOr(true)
        setSentence('or')
        setSentenceOpacity(1)
      }, 400)

      // Fade out "or" and loop
      const t4 = setTimeout(() => {
        if (!mountedRef.current) return
        setSentenceOpacity(0)
        const t5 = setTimeout(() => loopSentence(), 400)
        timerRef.current = t5
      }, 1600)

      timerRef.current = t3
      // Store cleanup refs
      setTimeout(() => { timerRef.current = t4 }, 400)
    }, 3400)

    timerRef.current = t2
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [demoStep, industry])

  // Start/restart sentence loop when suggestions become visible
  useEffect(() => {
    if (suggestionsVisible && phase === 'live' && !isDirect) {
      if (timerRef.current) clearTimeout(timerRef.current)
      loopSentence()
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [suggestionsVisible, phase, isDirect, loopSentence])

  // Industry chip click
  const handleIndustrySwitch = (ind: IndustryKey) => {
    setIndustry(ind)
    nudgeIdxRef.current = 0
    if (timerRef.current) clearTimeout(timerRef.current)
    onIndustryChange?.(ind)
    // Restart loop
    setTimeout(() => loopSentence(), 100)
  }

  if (!callActive) return null

  return (
    <div className="flex-shrink-0">
      {/* ═══ CONNECTING MESSAGE ═══ */}
      {phase === 'connecting' && (
        <div className="text-center py-5">
          <div className="text-[18px] font-semibold transition-all duration-500"
            style={{ color: connectColor }}>
            {connectText}
          </div>
        </div>
      )}

      {/* ═══ SUGGESTIONS LAYER (persistent, fades on intent) ═══ */}
      {suggestionsVisible && !isDirect && (
        <div className="mb-1.5 transition-opacity duration-500" style={{ opacity: suggestionsOpacity }}>
          {/* Header */}
          <div className="text-center mb-1">
            <div className="text-[13px] font-semibold" style={{ color: 'var(--bright, #d8ecff)' }}>
              Ask anything — just like you would with your IVR
            </div>
          </div>

          {/* Rotating sentence */}
          <div className="flex items-center justify-center min-h-[40px]">
            <div className="text-center leading-snug px-1 py-1 transition-opacity duration-[600ms]"
              style={{
                opacity: sentenceOpacity,
                fontSize: sentenceIsOr ? '14px' : '18px',
                fontWeight: 600,
                color: sentenceIsOr ? 'var(--dim, #3d5570)' : '#00c9b1',
                maxWidth: 460,
              }}>
              {sentence}
            </div>
          </div>

          {/* Industry prompt */}
          <div className="text-center mt-1.5 mb-1.5">
            <div className="text-[14px] font-semibold" style={{ color: 'var(--bright, #d8ecff)' }}>
              Pick an industry for specific IVR intents:
            </div>
          </div>

          {/* Industry chips */}
          <div className="flex gap-1.5 justify-center flex-wrap">
            {CHIP_DATA.map(([key, label]) => (
              <button key={key}
                onClick={() => handleIndustrySwitch(key)}
                className="px-3 py-1.5 rounded-md text-[10px] cursor-pointer transition-all border"
                style={{
                  background: industry === key ? 'rgba(0,201,177,.1)' : 'var(--card2, #121e2d)',
                  borderColor: industry === key ? '#00c9b1' : 'var(--b1, #1a2b40)',
                  color: industry === key ? '#00c9b1' : 'var(--dim, #3d5570)',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { getEnv } from '@/lib/env'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CURRENCY_CONFIG } from '@/lib/data'
import { JOURNEY_CONFIGS } from '@/lib/journeyData'
import type { Currency } from '@/types'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import SignUpModal from '@/components/auth/SignUpModal'

interface StoredIntent { key: string; exp: number; cost: number; latencyMs: number; wasPromoted: boolean; ts: number }
interface StoredSession {
  sessionId: string; displayId: string; createdAt: number; demoStep: number; duration: number;
  intents: StoredIntent[]; totalCost: number;
  transcript: { who: string; text: string; meta?: string; ts?: number }[];
  journeyName: string; journeyExp: string; stack: string[];
}

const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000

const T = {
  teal:'#00c9b1',teal2:'rgba(0,201,177,.12)',amber:'#f5a623',amber2:'rgba(245,166,35,.12)',
  red:'#f03060',red2:'rgba(240,48,96,.12)',green:'#00de7a',green2:'rgba(0,222,122,.12)',
  blue:'#3d85e0',blue2:'rgba(61,133,224,.12)',purple:'#8b5cf6',purple2:'rgba(139,92,246,.12)',
  tx:'#dde6f5',tx2:'#7a90b5',tx3:'#4a5f80',
  bg:'#080d18',s1:'#0d1526',s2:'#111d30',s3:'#16243a',b1:'#1c2d45',b2:'#243558',
}

function Kpi({label,value,sub,color=T.tx}:{label:string;value:string;sub?:string;color?:string}){
  return(<div className="rounded-xl border p-4" style={{background:T.s1,borderColor:T.b1}}>
    <div className="text-[9px] font-bold uppercase tracking-wide mb-1" style={{color:T.tx3}}>{label}</div>
    <div className="font-mono text-[22px] font-bold leading-none" style={{color}}>{value}</div>
    {sub&&<div className="text-[9px] mt-1" style={{color:T.tx3}}>{sub}</div>}
  </div>)
}

function Card({children,className=''}:{children:React.ReactNode;className?:string}){
  return <div className={`rounded-xl border p-4 ${className}`} style={{background:T.s1,borderColor:T.b1}}>{children}</div>
}

function CT({children}:{children:React.ReactNode}){
  return <div className="flex items-center gap-2 text-[11px] font-semibold mb-3" style={{color:T.tx2}}>{children}</div>
}

function Sttl({children}:{children:React.ReactNode}){
  return <div className="text-[10px] font-semibold uppercase tracking-widest mt-5 mb-3 first:mt-0" style={{color:T.tx3}}>{children}</div>
}

function HBar({label,count,pct,color}:{label:string;count:number;pct:number;color:string}){
  return(<div className="flex items-center gap-2 mb-2 last:mb-0">
    <div className="text-right text-[10px] w-28 truncate" style={{color:T.tx2}}>{label}</div>
    <div className="flex-1 h-[7px] rounded" style={{background:T.s2}}><div className="h-full rounded" style={{width:`${pct}%`,background:color}}/></div>
    <div className="font-mono text-[10px] w-8" style={{color:T.tx2}}>{count}</div>
    <div className="font-mono text-[10px] w-8" style={{color:T.tx3}}>{pct}%</div>
  </div>)
}

function Gauge({pct,value,label,color}:{pct:number;value:string;label:string;color:string}){
  const r=58,cx=90,cy=80,startAngle=Math.PI,endAngle=Math.PI+pct*Math.PI
  const x1=cx+Math.cos(startAngle)*r,y1=cy+Math.sin(startAngle)*r
  const x2=cx+Math.cos(endAngle)*r,y2=cy+Math.sin(endAngle)*r
  const la=pct>0.5?1:0
  return(
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={T.b1} strokeWidth="12" strokeLinecap="round"/>
        {pct>0&&<path d={`M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"/>}
        <text x={cx} y={cy-8} textAnchor="middle" fill={color} fontSize="22" fontWeight="700">{value}</text>
        <text x={cx} y={cy+8} textAnchor="middle" fill={T.tx3} fontSize="9">{label}</text>
      </svg>
    </div>
  )
}

function UpgradeBanner({message,onMigrate}:{message:string;onMigrate?:()=>void}){
  return(
    <div className="rounded-xl border p-6 text-center" style={{background:'linear-gradient(135deg, rgba(0,201,177,.04), rgba(59,130,246,.04))',borderColor:`${T.teal}20`}}>
      <div className="text-[13px] mb-1 font-semibold">{message}</div>
      <div className="text-[11px] mb-3" style={{color:T.tx3}}>Migrate your IVR to access aggregate analytics across all your calls.</div>
      <button onClick={()=>onMigrate?.()} className="px-5 py-2 rounded-lg text-[11px] font-bold border-none cursor-pointer"
        style={{background:T.teal,color:'#000'}}>📱 Migrate Your IVR</button>
      <div className="text-[9px] mt-1.5" style={{color:T.tx3}}>Zero integration · Zero cost · In 17 minutes</div>
    </div>
  )
}

export default function SessionDashboard() {
  const params = useParams()
  const router = useRouter()
  const sessionDisplayId = params.id as string

  const [session, setSession] = useState<StoredSession | null>(null)
  const [expired, setExpired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('inr')
  const [tab, setTab] = useState('overview')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState('')
  const [showSignUp, setShowSignUp] = useState(false)

  const cc = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG[currency.toLowerCase() as Currency] ?? CURRENCY_CONFIG["inr"]
  const fmt = (inr: number, d=2) => `${cc.symbol}${(inr * cc.rate).toFixed(d)}`

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`cvs_session_${sessionDisplayId}`)
      if (!raw) { setLoading(false); return }
      const data: StoredSession = JSON.parse(raw)
      if (Date.now() - data.createdAt > SESSION_EXPIRY_MS) {
        setExpired(true); sessionStorage.removeItem(`cvs_session_${sessionDisplayId}`); setLoading(false); return
      }
      setSession(data)
    } catch {}
    setLoading(false)
  }, [sessionDisplayId])

  // ── Expired / Not found ────────────────────────────────────────────────
  if (expired) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:T.bg,color:T.tx}}>
      <div className="text-center max-w-md px-6">
        <div className="text-[48px] mb-4">⏱</div>
        <h1 className="text-[24px] font-bold mb-2">Session Expired</h1>
        <p className="text-[14px] mb-6" style={{color:T.tx2}}>Demo sessions are available for 8 hours. Migrate your IVR for permanent access.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={()=>router.push('/')} className="px-6 py-2.5 rounded-lg text-[13px] font-semibold border cursor-pointer" style={{borderColor:T.b2,color:T.tx,background:'transparent'}}>← Back to Home</button>
          <button onClick={()=>setShowSignUp(true)} className="px-6 py-2.5 rounded-lg text-[13px] font-bold border-none cursor-pointer" style={{background:T.teal,color:'#000'}}>📱 Migrate Your IVR</button>
        </div>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:T.bg,color:T.tx}}>
      <div className="text-[14px] animate-pulse" style={{color:T.tx3}}>Loading session...</div>
    </div>
  )

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:T.bg,color:T.tx}}>
      <div className="text-center max-w-md px-6">
        <div className="text-[48px] mb-4">🔍</div>
        <h1 className="text-[24px] font-bold mb-2">Session Not Found</h1>
        <p className="text-[14px] mb-6" style={{color:T.tx2}}>This session may have expired or the link is invalid.</p>
        <button onClick={()=>router.push('/')} className="px-6 py-2.5 rounded-lg text-[13px] font-bold border-none cursor-pointer" style={{background:T.teal,color:'#000'}}>📞 Try a Demo Call</button>
      </div>
    </div>
  )

  // ── Derived ────────────────────────────────────────────────────────────
  const jConfig = JOURNEY_CONFIGS[session.demoStep]
  const durStr = `${Math.floor(session.duration/60)}:${String(session.duration%60).padStart(2,'0')}`
  const avgCost = session.intents.length > 0 ? session.totalCost / session.intents.length : 0
  const hoursLeft = Math.max(0, Math.ceil((session.createdAt + SESSION_EXPIRY_MS - Date.now()) / (60*60*1000)))
  const resPct = session.intents.length > 0 ? 100 : 0
  const userLines = session.transcript.filter(t=>t.who==='user').length
  const aiLines = session.transcript.filter(t=>t.who==='ai').length
  const sysLines = session.transcript.filter(t=>t.who==='sys').length

  const TABS = [
    {key:'overview',label:'Overview'},{key:'sessions',label:'Session Detail'},{key:'recordings',label:'Recordings'},
    {key:'intel',label:'Intelligence'},{key:'costs',label:'Cost'},{key:'quality',label:'QC'}
  ]

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{background:T.bg,color:T.tx}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:${T.b2};border-radius:3px}
      `}</style>

      {/* ══ NAV (Unified Header) ══ */}
      <UnifiedHeader
        variant="session"
        tabs={TABS}
        activeTab={tab}
        onTabChange={t => setTab(t)}
        sessionLabel={'Demo Session · ' + session.displayId}
        currency={currency}
        onCurrencyChange={setCurrency}
        onSignIn={() => setShowSignUp(true)}
      />
      {/* ── Sub-nav ── */}
      <div className="flex items-center justify-between px-5 py-1.5 flex-shrink-0" style={{background:T.s2,borderBottom:`1px solid ${T.b1}`}}>
        <div className="text-[10px]" style={{color:T.tx3}}>{jConfig?.icon} {session.journeyName} · {session.journeyExp} · {session.displayId}</div>
        <div className="flex items-center gap-2 text-[10px]" style={{color:T.tx3}}>
          <span>⏱ Expires in {hoursLeft}h</span>
          <span style={{color:T.amber,fontWeight:600}}>Demo session — migrate your IVR for permanent access</span>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* ═══ OVERVIEW ═══ */}
        {tab==='overview'&&(
          <div>
            <Sttl>Key Metrics — This Session</Sttl>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-4">
              <Kpi label="Total Calls" value="1" sub="This session"/>
              <Kpi label="Resolved" value={String(session.intents.length)} color={T.green} sub={`${resPct}% rate`}/>
              <Kpi label="Handoff" value="0" color={T.amber} sub="To agent"/>
              <Kpi label="Abandoned" value="0" color={T.red} sub="Drop-offs"/>
              <Kpi label="Duration" value={durStr} sub="This call"/>
              <Kpi label="Total Cost" value={fmt(session.totalCost)} color={T.green} sub="Per-intent"/>
              <Kpi label="Avg / Intent" value={fmt(avgCost)} color={T.purple} sub="Unit cost"/>
            </div>

            <Sttl>Performance Gauges</Sttl>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <Card className="flex flex-col items-center"><CT>⭐ CSAT Score</CT><Gauge pct={0} value="—" label="/ 5.0" color={T.amber}/><div className="text-[11px] mt-1" style={{color:T.tx3}}>Collected post-call · Target 4.0</div></Card>
              <Card className="flex flex-col items-center"><CT>✅ Resolution Rate</CT><Gauge pct={resPct/100} value={`${resPct}%`} label="resolved" color={T.green}/><div className="text-[11px] mt-1" style={{color:T.tx3}}>Target 75%</div></Card>
              <Card className="flex flex-col items-center"><CT>🎙 IVR Containment</CT><Gauge pct={1} value="100%" label="contained" color={T.teal}/><div className="text-[11px] mt-1" style={{color:T.tx3}}>No handoff · Target 80%</div></Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Card><CT>🧠 Multi-Modal LLM Stack</CT>
                <div className="flex gap-2 flex-wrap mb-3">
                  {session.stack.map(s=>(<span key={s} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border" style={{background:'rgba(0,201,177,.08)',color:T.teal,borderColor:T.b1}}>{s}</span>))}
                </div>
                <div className="flex flex-col gap-1">
                  {[{l:'Journey',v:session.journeyName},{l:'Experience',v:session.journeyExp},{l:'Duration',v:`${session.duration}s (${durStr})`},{l:'Session ID',v:session.displayId}].map((r,i)=>(
                    <div key={i} className="flex justify-between py-1.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}`}}>
                      <span style={{color:T.tx3}}>{r.l}</span><span className="font-mono">{r.v}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card><CT>🎯 Intent Breakdown</CT>
                {session.intents.length===0?(
                  <div className="text-[12px] py-4 text-center" style={{color:T.tx3}}>No business intents detected.</div>
                ):(
                  session.intents.map((intent,i)=>(
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg mb-1.5" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{background:T.purple2,color:T.purple}}>#{i+1}</span>
                        <span className="text-[12px] font-semibold">{intent.key}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="font-mono px-1.5 py-0.5 rounded" style={{background:T.amber2,color:T.amber}}>Exp {intent.exp}</span>
                        <span className="font-mono font-bold" style={{color:T.green}}>{fmt(intent.cost)}</span>
                        {intent.latencyMs>0&&<span className="font-mono" style={{color:T.tx3}}>{(intent.latencyMs/1000).toFixed(1)}s</span>}
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>

            <UpgradeBanner message="Want aggregate metrics across hundreds of calls?" onMigrate={()=>setShowSignUp(true)} />
          </div>
        )}

        {/* ═══ SESSION DETAIL ═══ */}
        {tab==='sessions'&&(
          <div>
            <Sttl>Session Detail</Sttl>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[{label:'Status',val:session.intents.length>0?'resolved':'no_intent',color:session.intents.length>0?T.green:T.tx3},
                {label:'Duration',val:durStr,color:T.tx},
                {label:'Experience',val:session.journeyExp,color:T.teal},
                {label:'Cost',val:fmt(session.totalCost),color:T.green}].map((f,i)=>(
                <Card key={i}><div className="text-[9px] uppercase tracking-wider mb-1" style={{color:T.tx3}}>{f.label}</div><div className="font-semibold text-[13px]" style={{color:f.color}}>{f.val}</div></Card>
              ))}
            </div>

            <Card>
              <CT>💬 Transcript ({session.transcript.length} entries)</CT>
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                {session.transcript.map((tx,i)=>(
                  <div key={i} className={`flex gap-2 items-start ${tx.who==='user'?'flex-row-reverse':''}`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                      style={{background:tx.who==='user'?T.teal2:tx.who==='ai'?T.blue2:'rgba(255,255,255,.05)',
                        color:tx.who==='user'?T.teal:tx.who==='ai'?T.blue:T.tx3}}>
                      {tx.who==='user'?'U':tx.who==='ai'?'AI':'S'}
                    </div>
                    <div className="max-w-[70%]">
                      <div className="px-3 py-2 rounded-xl text-[11px] leading-relaxed inline-block"
                        style={{background:tx.who==='user'?T.teal2:T.s2,border:`1px solid ${tx.who==='user'?T.teal+'33':T.b1}`,color:T.tx}}>
                        {tx.text}
                      </div>
                      {tx.meta&&<div className="text-[8px] mt-0.5 px-1 font-mono" style={{color:T.amber}}>{tx.meta}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-4"><UpgradeBanner message="View all sessions, filter by status, language, and experience tier." /></div>
          </div>
        )}

        {/* ═══ RECORDINGS ═══ */}
        {tab==='recordings'&&(
          <div>
            <Sttl>Recording Coverage — This Session</Sttl>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Kpi label="Total Recordings" value="1" color={T.teal}/>
              <Kpi label="With Audio" value="1" color={T.green} sub="ready to play"/>
              <Kpi label="Transcript Lines" value={String(session.transcript.length)} color={T.amber}/>
            </div>

            <Sttl>Session Recording</Sttl>
            <div className="rounded-xl border mb-2.5 p-4" style={{background:T.s2,borderColor:T.b1}}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[16px] flex-shrink-0" style={{background:T.teal2}}>🎤</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[12px] mb-0.5">{session.displayId}</div>
                  <div className="text-[11px]" style={{color:T.tx2}}>{session.journeyName} · {session.journeyExp} · {durStr}</div>
                  <div className="text-[10px] mt-0.5" style={{color:T.tx3}}>
                    {new Date(session.createdAt).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · {new Date(session.createdAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}
                  </div>
                </div>
                {!audioUrl && (
                  <button
                    onClick={async () => {
                      setAudioLoading(true); setAudioError('')
                      try {
                        // Fetch recording list for this session from Service B
                        const listResp = await fetch(`${getEnv().serviceB}/recordings/session/${encodeURIComponent(session.sessionId)}`, {
                          headers: { 'X-Tenant-Key': session.sessionId.split('__')[0] || 'hdfc' }
                        })
                        if (listResp.ok) {
                          const data = await listResp.json()
                          // Response: { session_id, count, recordings: [...] }
                          const recordings = data.recordings || data || []
                          const recsArray = Array.isArray(recordings) ? recordings : []
                          // Find a recording with audio blob (not just transcript)
                          const audioRec = recsArray.find((r: any) => r.blob_path || r.recording_url || r.file_format !== 'text') || recsArray[0]
                          const recId = audioRec?.id || audioRec?.recording_id
                          if (recId) {
                            // Try /stream first, then /play
                            let streamResp = await fetch(`${getEnv().serviceB}/recordings/${recId}/stream`, {
                              headers: { 'X-Tenant-Key': session.sessionId.split('__')[0] || 'hdfc' }
                            })
                            if (!streamResp.ok) {
                              streamResp = await fetch(`${getEnv().serviceB}/recordings/${recId}/play`, {
                                headers: { 'X-Tenant-Key': session.sessionId.split('__')[0] || 'hdfc' }
                              })
                            }
                            if (streamResp.ok) {
                              const contentType = streamResp.headers.get('content-type') || ''
                              if (contentType.includes('audio') || contentType.includes('octet')) {
                                const blob = await streamResp.blob()
                                setAudioUrl(URL.createObjectURL(blob))
                              } else {
                                setAudioError('Recording is transcript-only. Audio will be available once the full recording pipeline is active.')
                              }
                            } else {
                              setAudioError('Recording audio not yet available. The recording may still be processing.')
                            }
                          } else {
                            setAudioError('No recordings found for this session yet. Try again in a moment.')
                          }
                        } else {
                          setAudioError('Could not fetch recordings. Service B returned ' + listResp.status)
                        }
                      } catch (e) { setAudioError('Could not load recording. Could not load recording.') }
                      setAudioLoading(false)
                    }}
                    disabled={audioLoading}
                    className="px-4 py-2 text-[11px] font-bold rounded-lg transition-all hover:opacity-90 cursor-pointer"
                    style={{background:T.teal,color:'#000'}}>
                    {audioLoading ? '⏳ Loading...' : '▶ Play Recording'}
                  </button>
                )}
              </div>

              {/* Audio player */}
              {audioUrl && (
                <div className="rounded-lg p-3 mb-3" style={{background:T.s3,border:`1px solid ${T.teal}33`}}>
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:T.teal}}>🎧 Listen to your call</div>
                  <audio controls style={{width:'100%'}} autoPlay>
                    <source src={audioUrl} type="audio/ogg" />
                    <source src={audioUrl} type="audio/webm" />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {audioError && (
                <div className="rounded-lg p-3 mb-3 text-[11px]" style={{background:T.amber2,color:T.amber,border:`1px solid ${T.amber}33`}}>
                  {audioError}
                </div>
              )}

              {/* Transcript */}
              <div className="rounded-lg p-3 text-[11px] leading-relaxed" style={{background:T.s3,border:`1px solid ${T.b1}`,color:T.tx2}}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{color:T.tx3}}>Full Transcript</div>
                {session.transcript.map((tx,i)=>(
                  <div key={i} className="mb-1"><span className="font-bold text-[9px] mr-1.5" style={{color:tx.who==='user'?T.teal:tx.who==='ai'?T.blue:T.tx3}}>{tx.who.toUpperCase()}</span>{tx.text}</div>
                ))}
              </div>
            </div>

            <UpgradeBanner message="Sign up to access all recordings, bulk download, and advanced transcript search." />
          </div>
        )}

        {/* ═══ INTELLIGENCE ═══ */}
        {tab==='intel'&&(
          <div>
            <Sttl>Intent Analytics — This Session</Sttl>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
              {session.intents.length>0?session.intents.map((intent,i)=>{
                const colors=[T.teal,T.blue,T.purple,T.green,T.amber,T.red]
                return(
                  <div key={i} className="rounded-xl border p-4 text-center" style={{background:T.s2,borderColor:T.b1}}>
                    <div className="text-[28px] font-bold leading-none" style={{color:colors[i]||T.tx}}>1</div>
                    <div className="text-[11px] mt-1 font-mono" style={{color:T.tx2}}>{intent.key}</div>
                    <div className="text-[10px] mt-0.5" style={{color:T.tx3}}>Exp {intent.exp} · {fmt(intent.cost)}</div>
                  </div>
                )
              }):(
                <div className="col-span-3 text-center py-6 text-[12px]" style={{color:T.tx3}}>No intents detected in this session.</div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Card><CT>⚡ Intent Resolution</CT>
                {session.intents.map((intent,i)=>(
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <div className="text-right text-[10px] w-32 truncate font-mono" style={{color:T.tx2}}>{intent.key}</div>
                    <div className="flex-1 h-[7px] rounded" style={{background:T.s2}}><div className="h-full rounded" style={{width:'100%',background:T.teal}}/></div>
                    <div className="font-mono text-[10px] w-8 text-right" style={{color:T.tx2}}>1</div>
                  </div>
                ))}
                {session.intents.length===0&&<div className="text-[11px]" style={{color:T.tx3}}>No data</div>}
              </Card>
              <Card><CT>📊 Session Stats</CT>
                <div className="grid grid-cols-2 gap-2">
                  {[{label:'Transcript Entries',val:session.transcript.length,color:T.blue},
                    {label:'User Messages',val:userLines,color:T.teal},
                    {label:'AI Responses',val:aiLines,color:T.green},
                    {label:'System Events',val:sysLines,color:T.tx3}].map((m,i)=>(
                    <div key={i} className="rounded-lg p-2.5 text-center" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
                      <div className="text-[18px] font-bold" style={{color:m.color}}>{m.val}</div>
                      <div className="text-[9px] mt-0.5" style={{color:T.tx3}}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <UpgradeBanner message="Unlock intent hit rates, language analytics, and multi-session intelligence." />
          </div>
        )}

        {/* ═══ COST ═══ */}
        {tab==='costs'&&(
          <div>
            <Sttl>Cost Intelligence — This Session</Sttl>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Kpi label="Total Calls" value="1"/>
              <Kpi label="Total Cost" value={fmt(session.totalCost)} color={T.purple} sub="This session"/>
              <Kpi label="Avg / Intent" value={fmt(avgCost)} color={T.teal} sub="Unit cost"/>
              <Kpi label="Cost / Min" value={fmt(session.duration>0?session.totalCost/(session.duration/60):0)} color={T.amber} sub="Effective rate"/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Card><CT>💰 Billing Summary</CT>
                <div className="text-center py-3 mb-3">
                  <div className="text-[32px] font-bold font-mono" style={{color:T.green}}>{fmt(session.totalCost)}</div>
                  <div className="text-[11px] mt-1" style={{color:T.tx3}}>{session.intents.length} intent(s) · {durStr}</div>
                </div>
                <table className="w-full" style={{borderCollapse:'collapse'}}>
                  <thead><tr>
                    {['Journey','Status','Int','Amount'].map(h=>(
                      <th key={h} className="text-left text-[9px] font-semibold uppercase tracking-wide py-2" style={{color:T.tx3,borderBottom:`1px solid ${T.b1}`}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[{n:'⚡ Per-Intent',j:0},{n:'🎯 Value Routing',j:1},{n:'🔥 Escalation',j:2},{n:'💰 Sales',j:3}].map(row=>{
                      const cur=row.j===session.demoStep
                      return(<tr key={row.j} style={{color:cur?T.teal:T.tx3}}>
                        <td className="py-2 text-[12px]" style={{borderBottom:`1px solid ${T.b1}30`}}>{row.n}</td>
                        <td className="py-2 text-[10px]" style={{borderBottom:`1px solid ${T.b1}30`}}>{cur?'✅ Tested':'—'}</td>
                        <td className="py-2 text-[12px] font-mono" style={{borderBottom:`1px solid ${T.b1}30`}}>{cur?session.intents.length:0}</td>
                        <td className="py-2 text-[12px] font-mono font-bold" style={{borderBottom:`1px solid ${T.b1}30`}}>{cur?fmt(session.totalCost):'₹0.00'}</td>
                      </tr>)
                    })}
                    <tr className="font-bold"><td className="py-2" style={{borderTop:`2px solid ${T.b2}`}} colSpan={2}>Total</td>
                      <td className="py-2 font-mono" style={{borderTop:`2px solid ${T.b2}`}}>{session.intents.length}</td>
                      <td className="py-2 font-mono" style={{borderTop:`2px solid ${T.b2}`,color:T.teal}}>{fmt(session.totalCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </Card>

              <Card><CT>💎 Resolution & Net Billable</CT>
                <div className="flex justify-between py-2 text-[13px]" style={{color:T.green}}><span>Resolved ✅</span><span className="font-mono font-bold">{session.intents.length} = {fmt(session.totalCost)}</span></div>
                <div className="flex justify-between py-2 text-[13px]" style={{color:T.red}}><span>Not Resolved ❌</span><span className="font-mono font-bold">0 = -₹0.00</span></div>
                <div className="flex justify-between py-2 text-[13px] font-bold mt-1" style={{borderTop:`1px solid ${T.b1}`}}><span>Net Billable</span><span className="font-mono" style={{color:T.teal}}>{fmt(session.totalCost)}</span></div>

                <div className="mt-4 pt-3" style={{borderTop:`1px solid ${T.b1}`}}>
                  <div className="text-[9px] font-bold uppercase tracking-wide mb-2" style={{color:T.tx3}}>Sales <span className="px-1.5 py-0.5 rounded text-[7px]" style={{background:T.s2,color:T.tx3}}>Coming Soon</span></div>
                  <div className="flex justify-between py-1 text-[12px] opacity-40" style={{color:T.tx3}}><span>Sales Intents</span><span className="font-mono">₹0.00</span></div>
                  <div className="flex justify-between py-1 text-[12px] opacity-40" style={{color:T.tx3}}><span>Commission</span><span className="font-mono">₹0.00</span></div>
                </div>

                <div className="flex justify-between py-3 text-[18px] font-bold mt-2" style={{borderTop:`3px solid ${T.teal}`,color:T.teal}}><span>TOTAL</span><span className="font-mono">{fmt(session.totalCost)}</span></div>
                <div className="text-[9px] mt-2 pt-2" style={{color:T.tx3,borderTop:`1px dashed ${T.b1}`}}>Demo · Shared infra · No charge</div>
              </Card>
            </div>

            <UpgradeBanner message="Unlock cost trends, experience-tier breakdown, and daily cost charts." onMigrate={()=>setShowSignUp(true)} />
          </div>
        )}

        {/* ═══ QC ═══ */}
        {tab==='quality'&&(
          <div>
            <Sttl>QC Overview — This Session</Sttl>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Kpi label="Avg CSAT" value="—" color={T.amber} sub="Collected post-call"/>
              <Kpi label="Resolution" value={session.intents.length>0?'✅':'—'} color={T.green} sub={session.intents.length>0?'Intent resolved':'No intent'}/>
              <Kpi label="Escalations" value="0" color={T.red} sub="No mid-call escalation"/>
              <Kpi label="Handoffs" value="0" color={T.amber} sub="Fully contained"/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Card><CT>⭐ CSAT (Post-Call Survey)</CT>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[{label:'Overall',val:'—'},{label:'Clarity',val:'—'},{label:'Resolution',val:'—'},{label:'Speed',val:'—'}].map((r,i)=>(
                    <div key={i} className="rounded-lg p-3 text-center" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
                      <div className="text-[9px] uppercase tracking-wider mb-1" style={{color:T.tx3}}>{r.label}</div>
                      <div className="text-[20px] font-bold" style={{color:T.tx3}}>{r.val}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] mt-3 p-2.5 rounded-lg" style={{background:T.s2,color:T.tx3,border:`1px dashed ${T.b2}`}}>
                  CSAT ratings are collected when callers complete the post-call survey. Demo calls may not trigger the survey.
                </div>
              </Card>
              <Card><CT>⚡ Call Quality Indicators</CT>
                <div className="flex flex-col gap-2">
                  {[{label:'AI Containment',val:'100%',desc:'No handoff to agent',color:T.green},
                    {label:'Intent Detection',val:session.intents.length>0?'Success':'No intent',desc:session.intents.length>0?`${session.intents.length} intent(s) detected`:'Try a specific query',color:session.intents.length>0?T.green:T.tx3},
                    {label:'Response Time',val:session.intents[0]?`${(session.intents[0].latencyMs/1000).toFixed(1)}s`:'—',desc:'First intent latency',color:T.teal},
                    {label:'Cost Efficiency',val:fmt(avgCost),desc:'Per resolved intent',color:T.purple}].map((q,i)=>(
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
                      <div><div className="text-[12px] font-semibold">{q.label}</div><div className="text-[9px]" style={{color:T.tx3}}>{q.desc}</div></div>
                      <div className="font-mono text-[14px] font-bold" style={{color:q.color}}>{q.val}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <UpgradeBanner message="Unlock CSAT trends, escalation patterns, agent handoff analytics, and QC comments." onMigrate={()=>setShowSignUp(true)} />
          </div>
        )}

      </div>
      <SignUpModal open={showSignUp} onClose={()=>setShowSignUp(false)} source="session_dashboard" />
    </div>
  )
}

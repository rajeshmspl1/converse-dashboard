'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, clearAuth, fetchI, isLoggedIn, type CxUser } from '@/lib/auth'

const T = {
  teal:'#00c9b1',teal2:'rgba(0,201,177,.12)',amber:'#f5a623',amber2:'rgba(245,166,35,.12)',
  red:'#f03060',red2:'rgba(240,48,96,.12)',green:'#00de7a',green2:'rgba(0,222,122,.12)',
  blue:'#3d85e0',blue2:'rgba(61,133,224,.12)',purple:'#8b5cf6',purple2:'rgba(139,92,246,.12)',
  tx:'#dde6f5',tx2:'#7a90b5',tx3:'#364d6a',
  bg:'#080d18',s1:'#0d1526',s2:'#111d30',s3:'#16243a',b1:'#1c2d45',b2:'#243558',
}

const fmt=(n:number|null|undefined,d=0)=>n==null?'—':Number(n).toLocaleString('en-IN',{maximumFractionDigits:d})
const fmtDur=(s:number|null)=>{if(!s)return'—';const m=Math.floor(s/60),sec=Math.round(s%60);return m?`${m}m ${sec}s`:`${sec}s`}
const STATUS:Record<string,{color:string}>={resolved:{color:'#00de7a'},abandoned:{color:'#f5a623'},handoff_to_agent:{color:'#3d85e0'},error:{color:'#f03060'}}

function Gauge({pct,value,label,color}:{pct:number;value:string;label:string;color:string}){
  const r=58,cx=90,cy=80,startAngle=Math.PI,endAngle=Math.PI+pct*Math.PI
  const x1=cx+Math.cos(startAngle)*r,y1=cy+Math.sin(startAngle)*r
  const x2=cx+Math.cos(endAngle)*r,y2=cy+Math.sin(endAngle)*r
  const la=pct>0.5?1:0
  return(
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={T.b1} strokeWidth="12" strokeLinecap="round"/>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2}`} fill="none" stroke={color+'40'} strokeWidth="20" strokeLinecap="round"/>
        {pct>0&&<path d={`M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"/>}
        {Array.from({length:11},(_,i)=>{const a=Math.PI+i/10*Math.PI;return(<line key={i} x1={cx+Math.cos(a)*(r-7)} y1={cy+Math.sin(a)*(r-7)} x2={cx+Math.cos(a)*(r+5)} y2={cy+Math.sin(a)*(r+5)} stroke={i%5===0?T.b2:T.b1} strokeWidth={i%5===0?2:1}/>)})}
        <line x1={cx} y1={cy} x2={cx+Math.cos(endAngle)*(r-16)} y2={cy+Math.sin(endAngle)*(r-16)} stroke={T.tx} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="4" fill={T.tx}/>
        <text x={cx} y={cy-8} textAnchor="middle" fill={color} fontSize="22" fontWeight="700">{value}</text>
        <text x={cx} y={cy+8} textAnchor="middle" fill={T.tx3} fontSize="9">{label}</text>
      </svg>
    </div>
  )
}

function Donut({data,colors,size=110,thick=20,center}:{data:number[];colors:string[];size?:number;thick?:number;center?:{val:string;sub:string}}){
  const cx=size/2,cy=size/2,r=size/2-4;let angle=-Math.PI/2
  const total=data.reduce((a,b)=>a+b,0)
  const paths=data.map((v,i)=>{
    const sweep=(v/total)*Math.PI*2
    const x1=cx+Math.cos(angle)*r,y1=cy+Math.sin(angle)*r
    const x2=cx+Math.cos(angle+sweep)*r,y2=cy+Math.sin(angle+sweep)*r
    const xi1=cx+Math.cos(angle)*(r-thick),yi1=cy+Math.sin(angle)*(r-thick)
    const xi2=cx+Math.cos(angle+sweep)*(r-thick),yi2=cy+Math.sin(angle+sweep)*(r-thick)
    const la=sweep>Math.PI?1:0
    const d=`M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r-thick} ${r-thick} 0 ${la} 0 ${xi1} ${yi1} Z`
    angle+=sweep;return <path key={i} d={d} fill={colors[i]}/>
  })
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}
      {center&&<><text x={cx} y={cy-4} textAnchor="middle" fill={T.amber} fontSize="16" fontWeight="700">{center.val}</text><text x={cx} y={cy+12} textAnchor="middle" fill={T.tx3} fontSize="9">{center.sub}</text></>}
    </svg>
  )
}

function Kpi({label,value,sub,color=T.tx}:{label:string;value:string;sub?:string;color?:string}){
  return(
    <div className="rounded-xl border p-3" style={{background:T.s1,borderColor:T.b1}}>
      <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{color:T.tx3}}>{label}</div>
      <div className="font-mono text-[22px] font-bold leading-none mb-1" style={{color}}>{value}</div>
      {sub&&<div className="text-[10px]" style={{color:T.tx2}}>{sub}</div>}
    </div>
  )
}

function HBar({label,count,pct,color}:{label:string;count:number;pct:number;color:string}){
  return(
    <div className="flex items-center gap-2 mb-2 last:mb-0">
      <div className="text-right text-[10px] w-28 truncate" style={{color:T.tx2}}>{label}</div>
      <div className="flex-1 h-[7px] rounded" style={{background:T.s2}}><div className="h-full rounded" style={{width:`${pct}%`,background:color}}/></div>
      <div className="font-mono text-[10px] w-8" style={{color:T.tx2}}>{count}</div>
      <div className="font-mono text-[10px] w-8" style={{color:T.tx3}}>{pct}%</div>
    </div>
  )
}

function Sttl({children}:{children:React.ReactNode}){return <div className="text-[10px] font-semibold uppercase tracking-widest mt-5 mb-3 first:mt-0" style={{color:T.tx3}}>{children}</div>}
function Card({children,className=''}:{children:React.ReactNode;className?:string}){return <div className={`rounded-xl border p-4 ${className}`} style={{background:T.s1,borderColor:T.b1}}>{children}</div>}
function CT({children}:{children:React.ReactNode}){return <div className="flex items-center gap-2 text-[11px] font-semibold mb-3" style={{color:T.tx2}}>{children}</div>}

function Nav({user,tab,onTab,onLogout}:{user:CxUser;tab:string;onTab:(t:string)=>void;onLogout:()=>void}){
  const TABS=[{key:'overview',label:'Overview'},{key:'sessions',label:'Sessions'},{key:'recordings',label:'Recordings'},{key:'intel',label:'Intelligence'},{key:'costs',label:'Cost'},{key:'quality',label:'QC'}]
  return(
    <div className="flex-shrink-0" style={{background:T.s1,borderBottom:`1px solid ${T.b1}`}}>
      <div className="flex items-center gap-3 px-5 h-12">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[13px]" style={{background:`linear-gradient(135deg,${T.teal},#0058c8)`}}>C</div>
          <span className="font-bold text-[14px] tracking-tight" style={{color:T.tx}}>Converse AI</span>
          <span className="hidden sm:block w-px h-5" style={{background:T.b1}}/>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded" style={{background:T.s2,border:`1px solid ${T.b1}`,color:T.tx2}}>
            <span className="w-1.5 h-1.5 rounded-full" style={{background:T.teal}}/>{user.tenant_key.toUpperCase()} · Retail IVR
          </span>
        </div>
        <div className="flex items-center gap-0.5 flex-1">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>onTab(t.key)} className="px-3 py-1.5 rounded text-[11px] font-medium transition-all"
              style={{background:tab===t.key?T.teal2:'transparent',color:tab===t.key?T.teal:T.tx2,border:tab===t.key?`1px solid ${T.teal}40`:'1px solid transparent'}}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-semibold" style={{color:T.tx}}>{user.full_name||user.email}</div>
            <div className="text-[9px]" style={{color:T.tx3}}>{user.role.replace(/_/g,' ')}</div>
          </div>
          <button onClick={onLogout} className="text-[10px] px-2.5 py-1 rounded border hover:opacity-80" style={{borderColor:T.b2,color:T.tx2,background:'transparent'}}>Sign out</button>
        </div>
      </div>
    </div>
  )
}

function OverviewTab({data}:{data:any}){
  if(!data)return null
  const{kpis,csat,experience_mix,languages,intents}=data
  const res=kpis.total_calls>0?Math.round((kpis.resolved/kpis.total_calls)*100):0
  const cont=kpis.total_calls>0?Math.round(((kpis.total_calls-kpis.handoff-kpis.ivr_passthrough)/kpis.total_calls)*100):0
  return(
    <div>
      <Sttl>Key Metrics — Last {data.days} days</Sttl>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-4">
        <Kpi label="Total Calls"   value={fmt(kpis.total_calls)} sub="All sessions"/>
        <Kpi label="Resolved"      value={fmt(kpis.resolved)}    color={T.green}  sub={`${res}% rate`}/>
        <Kpi label="Handoff"       value={fmt(kpis.handoff)}     color={T.amber}  sub="To agent"/>
        <Kpi label="Abandoned"     value={fmt(kpis.abandoned)}   color={T.red}    sub="Drop-offs"/>
        <Kpi label="Avg Duration"  value={fmtDur(kpis.avg_duration_sec)} sub="Per call"/>
        <Kpi label="Escalated"     value={fmt(kpis.escalated)}   color={T.red}    sub="Mid-call"/>
        <Kpi label="Lang Switches" value={fmt(kpis.lang_switch_calls)} color={T.purple} sub="Multilingual"/>
      </div>
      <Sttl>Performance Gauges</Sttl>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="flex flex-col items-center"><CT>⭐ CSAT Score</CT><Gauge pct={(csat.avg_csat||0)/5} value={String(csat.avg_csat??'—')} label="/ 5.0" color={T.amber}/><div className="text-[11px] mt-1" style={{color:T.tx2}}>Target 4.0</div></Card>
        <Card className="flex flex-col items-center"><CT>✅ Resolution Rate</CT><Gauge pct={res/100} value={`${res}%`} label="resolved" color={T.green}/><div className="text-[11px] mt-1" style={{color:T.tx2}}>Target 75%</div></Card>
        <Card className="flex flex-col items-center"><CT>🎙 IVR Containment</CT><Gauge pct={cont/100} value={`${cont}%`} label="contained" color={T.teal}/><div className="text-[11px] mt-1" style={{color:T.tx2}}>Target 80%</div></Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Card className="flex items-center gap-4">
          <Donut data={[csat.five_star||0.01,csat.four_star||0.01,csat.three_star||0.01,csat.low_star||0.01]} colors={[T.green,'#50c878',T.amber,T.red]} size={120} thick={22} center={{val:String(csat.avg_csat??'—'),sub:'avg CSAT'}}/>
          <div className="flex-1"><CT>⭐ CSAT Distribution</CT>
            {[{label:'5★ Excellent',val:csat.five_star,color:T.green},{label:'4★ Good',val:csat.four_star,color:'#50c878'},{label:'3★ Neutral',val:csat.three_star,color:T.amber},{label:'1-2★ Poor',val:csat.low_star,color:T.red}].map((r,i)=>(
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{background:r.color}}/>
                <div className="flex-1 text-[11px]" style={{color:T.tx2}}>{r.label}</div>
                <div className="font-mono text-[11px] font-semibold" style={{color:T.tx}}>{r.val??0}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Donut data={experience_mix.filter((e:any)=>e.experience).map((e:any)=>e.total)} colors={[T.teal,T.blue,T.purple,T.amber]} size={120} thick={22} center={{val:fmt(kpis.total_calls),sub:'calls'}}/>
          </div>
          <div className="flex-1"><CT>🎛 Experience Mix</CT>
            {experience_mix.filter((e:any)=>e.experience).map((e:any,i:number)=>{
              const colors=[T.teal,T.blue,T.purple,T.amber]
              const pct=kpis.total_calls?Math.round((e.total/kpis.total_calls)*100):0
              const expLabel=(e.experience||'').match(/^\d+$/)? `Exp ${e.experience}` : (e.experience||'—'); return(<div key={i} className="flex items-center gap-2 mb-1.5"><div className="w-2 h-2 rounded-sm flex-shrink-0" style={{background:colors[i]||T.tx3}}/><div className="flex-1 text-[11px] truncate" style={{color:T.tx2}}>{expLabel}</div><div className="font-mono text-[11px] font-semibold" style={{color:T.tx}}>{e.total}</div><div className="text-[10px] w-8" style={{color:T.tx3}}>{pct}%</div></div>)
            })}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card><CT>🌐 Language Distribution</CT>
          {languages.filter((l:any)=>l.language).map((l:any,i:number)=>{const pct=kpis.total_calls?Math.round((l.total/kpis.total_calls)*100):0;return <HBar key={i} label={l.language} count={l.total} pct={pct} color={`linear-gradient(90deg,${T.teal},${T.blue})`}/>})}
        </Card>
        <Card><CT>🎯 Top Intents</CT>
          {intents.slice(0,8).map((intent:any,i:number)=>{const max=intents[0]?.total||1;const pct=Math.round((intent.total/max)*100);const colors=[T.teal,T.blue,T.purple,T.green,T.amber,T.red,T.teal,T.blue];return <HBar key={i} label={intent.intent_key} count={intent.total} pct={pct} color={colors[i]||T.tx3}/>})}
        </Card>
      </div>
    </div>
  )
}

function SessionsTab({sessions,total,page,onPage,onOpen,selected,onBack}:any){
  if(selected){
    const s=selected.session
    return(
      <div>
        <button onClick={onBack} className="text-[11px] mb-3 hover:opacity-80 flex items-center gap-1" style={{color:T.teal}}>← Back to sessions</button>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[{label:'Status',val:s?.final_status||'—',color:STATUS[s?.final_status]?.color||T.tx3},{label:'Duration',val:fmtDur(s?.duration_sec),color:T.tx},{label:'Language',val:s?.session_language||'—',color:T.blue},{label:'Experience',val:s?.experience_level_final||'—',color:T.teal}].map((f,i)=>(
            <Card key={i}><div className="text-[9px] uppercase tracking-wider mb-1" style={{color:T.tx3}}>{f.label}</div><div className="font-semibold text-[13px]" style={{color:f.color}}>{f.val}</div></Card>
          ))}
        </div>
        {selected.flows?.length>0&&(
          <Card><CT>💬 Transcript ({selected.flows.length} turns)</CT>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
              {selected.flows.map((f:any,i:number)=>(
                <div key={i} className={`flex gap-2 items-start ${f.speaker==='user'?'flex-row-reverse':''}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0" style={{background:f.speaker==='user'?T.teal2:T.blue2,color:f.speaker==='user'?T.teal:T.blue}}>{f.speaker==='user'?'U':'AI'}</div>
                  <div className="max-w-[70%]"><div className="px-3 py-2 rounded-xl text-[11px] leading-relaxed inline-block" style={{background:f.speaker==='user'?T.teal2:T.s2,border:`1px solid ${f.speaker==='user'?T.teal+'33':T.b1}`,color:T.tx}}>{f.text_input||f.text_output||'—'}</div></div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {selected.feedback&&(
          <Card className="mt-3"><CT>⭐ Customer Feedback</CT>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{label:'Overall',val:selected.feedback.rating_overall},{label:'Clarity',val:selected.feedback.rating_clarity},{label:'Resolution',val:selected.feedback.rating_resolution},{label:'Speed',val:selected.feedback.rating_speed}].map((r,i)=>(
                <div key={i} className="rounded-lg p-3 text-center" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
                  <div className="text-[9px] uppercase tracking-wider mb-1" style={{color:T.tx3}}>{r.label}</div>
                  <div className="text-[20px] font-bold" style={{color:r.val>=4?T.green:r.val>=3?T.amber:r.val?T.red:T.tx3}}>{r.val??'—'}{r.val?'/5':''}</div>
                </div>
              ))}
            </div>
            {selected.feedback.free_text_feedback&&<div className="mt-3 p-3 rounded-lg italic text-[12px]" style={{background:T.s2,color:T.tx,border:`1px solid ${T.b1}`}}>"{selected.feedback.free_text_feedback}"</div>}
          </Card>
        )}
      </div>
    )
  }
  return(
    <div>
      <div className="text-[10px] mb-3" style={{color:T.tx3}}>{total} sessions · page {page+1} of {Math.ceil(total/20)||1}</div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full" style={{borderCollapse:'collapse'}}>
          <thead><tr style={{background:T.s2,borderBottom:`1px solid ${T.b1}`}}>
            {['Session ID','Started','Duration','Status','Language','Experience','Intents'].map(h=>(
              <th key={h} className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider" style={{color:T.tx3}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {sessions.map((s:any,i:number)=>(
              <tr key={i} onClick={()=>onOpen(s.session_id)} className="cursor-pointer" style={{borderBottom:`1px solid ${T.b1}`,background:i%2?T.s1:T.bg}}
                onMouseEnter={e=>(e.currentTarget.style.background=T.s2)} onMouseLeave={e=>(e.currentTarget.style.background=i%2?T.s1:T.bg)}>
                <td className="px-3 py-2 font-mono text-[10px]" style={{color:T.teal}}>{s.session_id.slice(-16)}</td>
                <td className="px-3 py-2 text-[10px]" style={{color:T.tx2}}>{new Date(s.started_at).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</td>
                <td className="px-3 py-2 font-mono text-[10px]" style={{color:T.tx2}}>{fmtDur(s.duration_sec)}</td>
                <td className="px-3 py-2"><span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{background:`${STATUS[s.final_status||'']?.color||T.b2}22`,color:STATUS[s.final_status||'']?.color||T.tx3}}>{s.final_status||'in progress'}</span></td>
                <td className="px-3 py-2 text-[10px]" style={{color:T.tx2}}>{s.session_language||'—'}</td>
                <td className="px-3 py-2 text-[10px]" style={{color:T.tx3}}>{s.experience_level_final||'—'}</td>
                <td className="px-3 py-2 font-bold text-[11px] text-center" style={{color:T.tx}}>{s.intents_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="flex items-center gap-2 mt-3">
        <button onClick={()=>onPage(page-1)} disabled={page===0} className="px-3 py-1 rounded text-[10px] border disabled:opacity-30" style={{borderColor:T.b2,color:T.tx2,background:'transparent'}}>← Prev</button>
        <button onClick={()=>onPage(page+1)} disabled={(page+1)*20>=total} className="px-3 py-1 rounded text-[10px] border disabled:opacity-30" style={{borderColor:T.b2,color:T.tx2,background:'transparent'}}>Next →</button>
      </div>
    </div>
  )
}

function RecordingsTab({data}:{data:any}){
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const handlePlayClick = async (recordingId: number, sessionId: string) => {
    try {
      const token = localStorage.getItem('access_token')
      const tenant = localStorage.getItem('tenant_key') || 'hdfc'
      
      const response = await fetch(`http://localhost:9000/recordings/${recordingId}/stream`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Key': tenant,
        },
      })
      
      if (!response.ok) throw new Error('Failed to fetch recording')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setPlayingId(recordingId)
    } catch (error) {
      console.error('Playback error:', error)
      alert('Failed to play recording')
    }
  }

  if(!data)return null
  return(
    <div>
      <Sttl>Recording Coverage — {data.total} recordings</Sttl>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Kpi label="Total Recordings" value={fmt(data.total)} color={T.teal}/>
        <Kpi label="With Audio" value={fmt(data.recordings?.filter((r:any)=>r.recording_url).length)} color={T.green} sub="ready to play"/>
        <Kpi label="Transcript Only" value={fmt(data.recordings?.filter((r:any)=>!r.recording_url).length)} color={T.amber} sub="no audio"/>
      </div>
      
      <Sttl>Recordings List</Sttl>
      {data.recordings?.map((r:any,i:number)=>(
        <div key={i} className="rounded-xl border mb-2.5 p-4" style={{background:T.s2,borderColor:T.b1}}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[16px] flex-shrink-0" style={{background:T.teal2}}>🎤</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[12px] mb-0.5" style={{color:T.tx}}>{r.session_id.slice(-20)}</div>
              <div className="text-[11px]" style={{color:T.tx2}}>{r.recording_type} · {r.session_language||'—'} · {r.experience_level_final||'—'}</div>
            </div>
            {r.recording_url && (
              <button
                onClick={() => handlePlayClick(r.id, r.session_id)}
                className="px-3 py-1.5 text-[9px] font-bold rounded transition-all hover:opacity-80"
                style={{background:T.teal,color:'#000'}}>
                ▶ Play
              </button>
            )}
          </div>

          {playingId === r.id && audioUrl && (
            <div className="rounded-lg p-3 mb-3" style={{background:T.s3,border:`1px solid ${T.teal}33`}}>
              <audio controls style={{width:'100%'}} autoPlay>
                <source src={audioUrl} type="audio/ogg" />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {r.transcript_text?(
            <div className="rounded-lg p-3 text-[11px] leading-relaxed" style={{background:T.s3,border:`1px solid ${T.b1}`,color:T.tx2}}>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{color:T.tx3}}>Transcript</div>
              {r.transcript_text}
            </div>
          ):(
            <div className="rounded-lg p-2.5 text-[10px]" style={{background:T.s3,color:T.tx3,border:`1px dashed ${T.b2}`}}>— No transcript available</div>
          )}
        </div>
      ))}
    </div>
  )
}

function IntelTab({data}:{data:any}){
  if(!data)return null
  const intents=data.intents||[],languages=data.languages||[],total=data.kpis?.total_calls||1
  const icolors=[T.teal,T.blue,T.purple,T.green,T.amber,T.red]
  return(
    <div>
      <Sttl>Intent Analytics</Sttl>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        {intents.slice(0,6).map((intent:any,i:number)=>(
          <div key={i} className="rounded-xl border p-4 text-center" style={{background:T.s2,borderColor:T.b1}}>
            <div className="text-[28px] font-bold leading-none" style={{color:icolors[i]||T.tx}}>{intent.total}</div>
            <div className="text-[11px] mt-1 font-mono" style={{color:T.tx2}}>{intent.intent_key}</div>
            <div className="text-[10px] mt-0.5" style={{color:T.tx3}}>{total>0?Math.round((intent.total/total)*100):0}% of calls</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card><CT>⚡ Intent Hit Rate</CT>
          {intents.slice(0,8).map((intent:any,i:number)=>{
            const pct=total>0?Math.round((intent.total/total)*100):0
            return(<div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
              <div className="text-right text-[10px] w-32 truncate font-mono" style={{color:T.tx2}}>{intent.intent_key}</div>
              <div className="flex-1 h-[7px] rounded" style={{background:T.s2}}><div className="h-full rounded" style={{width:`${pct}%`,background:`linear-gradient(90deg,${icolors[i]||T.teal},${icolors[i]||T.teal}88)`}}/></div>
              <div className="font-mono text-[10px] w-8 text-right" style={{color:T.tx2}}>{intent.total}</div>
            </div>)
          })}
        </Card>
        <Card><CT>🌐 Language Distribution</CT>
          {languages.filter((l:any)=>l.language).map((l:any,i:number)=>{
            const pct=total>0?Math.round((l.total/total)*100):0
            const colors=[T.teal,T.blue,T.purple,T.amber]
            return(<div key={i} className="mb-2 last:mb-0"><div className="flex justify-between text-[10px] mb-1"><span className="font-mono" style={{color:T.tx2}}>{l.language}</span><span style={{color:T.tx3}}>{l.total} · {pct}%</span></div><div className="h-[7px] rounded" style={{background:T.s2}}><div className="h-full rounded" style={{width:`${pct}%`,background:colors[i]||T.teal}}/></div></div>)
          })}
          <div className="mt-4 pt-3 grid grid-cols-2 gap-2" style={{borderTop:`1px solid ${T.b1}`}}>
            {[{label:'Multi-Intent Calls',val:data.kpis?.multi_intent_calls,color:T.blue},{label:'Lang Switch Calls',val:data.kpis?.lang_switch_calls,color:T.purple}].map((m,i)=>(
              <div key={i} className="rounded-lg p-2.5 text-center" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
                <div className="text-[18px] font-bold" style={{color:m.color}}>{fmt(m.val)}</div>
                <div className="text-[9px] mt-0.5" style={{color:T.tx3}}>{m.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function CostsTab({data}:{data:any}){
  if(!data||!data.summary)return null
  const s=data.summary,byDay=data.by_day||[],byExp=data.by_experience||[]
  const max=byDay.length>0?Math.max(...byDay.map((d:any)=>d.total_calls)):1
  return(
    <div>
      <Sttl>Cost Intelligence</Sttl>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Kpi label="Total Calls"    value={fmt(s.total_calls)}/>
        <Kpi label="Total Cost (₹)" value={fmt(s.total_cost_inr,2)} color={T.purple} sub="All sessions"/>
        <Kpi label="Avg Cost (₹)"   value={fmt(s.avg_cost_inr,4)}   color={T.teal}   sub="Per call"/>
        <Kpi label="No Cost Data"   value={fmt(s.calls_without_cost)} color={T.amber} sub="Missing"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Card><CT>💰 Cost Summary</CT>
          <div className="text-center py-3 mb-3">
            <div className="text-[32px] font-bold font-mono" style={{color:T.purple}}>₹{fmt(s.total_cost_inr,2)}</div>
            <div className="text-[11px] mt-1" style={{color:T.tx3}}>{s.total_calls} calls · ₹{fmt(s.avg_cost_inr,4)} avg</div>
          </div>
          {[{label:'Min cost call',val:`₹${fmt(s.min_cost_inr,4)}`,color:T.green},{label:'Max cost call',val:`₹${fmt(s.max_cost_inr,4)}`,color:T.red},{label:'Avg cost/call',val:`₹${fmt(s.avg_cost_inr,4)}`,color:T.teal}].map((m,i)=>(
            <div key={i} className="flex justify-between py-2" style={{borderBottom:`1px solid ${T.b1}`}}>
              <span className="text-[11px]" style={{color:T.tx2}}>{m.label}</span>
              <span className="font-mono text-[11px] font-semibold" style={{color:m.color}}>{m.val}</span>
            </div>
          ))}
        </Card>
        <Card><CT>⚠️ Cost Tracking Status</CT>
          <div className="p-3 rounded-lg text-[11px]" style={{background:T.s2,border:`1px dashed ${T.b2}`,color:T.tx2}}>
            Cost tracking not yet wired in Service A. All sessions show <span className="font-mono px-1 rounded" style={{background:T.s3}}>cost_estimate_inr = NULL</span>. Will be populated once cost calculation is added to the session finalization handler.
          </div>
          {byExp.length>0&&<div className="mt-3">{byExp.map((e:any,i:number)=>{const colors=[T.teal,T.blue,T.purple,T.amber];return(<div key={i} className="flex items-center justify-between py-2" style={{borderBottom:`1px solid ${T.b1}`}}><span className="text-[11px]" style={{color:T.tx2}}>{e.experience||'—'}</span><div className="flex items-center gap-3"><span className="text-[10px]" style={{color:T.tx3}}>{e.total_calls} calls</span><span className="font-mono text-[11px] font-semibold" style={{color:colors[i]||T.tx}}>₹{fmt(e.total_cost_inr,2)}</span></div></div>)})}</div>}
        </Card>
      </div>
      {byDay.length>0&&(
        <Card><CT>📈 Calls by Day</CT>
          <div className="flex items-end gap-1" style={{height:'80px'}}>
            {byDay.map((d:any,i:number)=>{const h=max>0?Math.max(4,(d.total_calls/max)*60):4;return(
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[7px]" style={{color:T.tx3}}>{d.total_calls}</div>
                <div className="w-full rounded-t" style={{height:`${h}px`,background:`linear-gradient(to top,${T.teal},${T.blue})`,minHeight:'4px'}}/>
                <div className="text-[7px]" style={{color:T.tx3}}>{new Date(d.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
              </div>
            )})}
          </div>
        </Card>
      )}
    </div>
  )
}

function QualityTab({data}:{data:any}){
  if(!data)return null
  const{csat,escalations,comments}=data
  return(
    <div>
      <Sttl>QC Overview</Sttl>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Kpi label="Avg CSAT"       value={String(csat?.avg_csat??'—')} color={T.amber}/>
        <Kpi label="5★ Reviews"     value={fmt(csat?.five_star)}  color={T.green}/>
        <Kpi label="Low Reviews"    value={fmt(csat?.low_star)}   color={T.red}/>
        <Kpi label="Total Feedback" value={fmt(csat?.total_feedback)}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Card><CT>⭐ CSAT Breakdown</CT>
          {[{label:'5★ Excellent',val:csat?.five_star,color:T.green},{label:'4★ Good',val:csat?.four_star,color:'#50c878'},{label:'3★ Neutral',val:csat?.three_star,color:T.amber},{label:'1-2★ Poor',val:csat?.low_star,color:T.red}].map((r,i)=>{
            const pct=Math.round(((r.val||0)/(csat?.total_feedback||1))*100)
            return <HBar key={i} label={r.label} count={r.val??0} pct={pct} color={r.color}/>
          })}
          <div className="mt-3 pt-3 grid grid-cols-2 gap-2" style={{borderTop:`1px solid ${T.b1}`}}>
            <div className="rounded-lg p-2.5 text-center" style={{background:T.s2}}><div className="text-[16px] font-bold" style={{color:T.green}}>{csat?.would_use_again??0}</div><div className="text-[9px]" style={{color:T.tx3}}>Would Use Again</div></div>
            <div className="rounded-lg p-2.5 text-center" style={{background:T.s2}}><div className="text-[16px] font-bold" style={{color:T.green}}>{csat?.would_recommend??0}</div><div className="text-[9px]" style={{color:T.tx3}}>Would Recommend</div></div>
          </div>
        </Card>
        <Card><CT>⚡ Escalation Patterns</CT>
          {escalations.length===0?<div className="text-[11px]" style={{color:T.tx3}}>No escalations in period.</div>:escalations.map((e:any,i:number)=>(
            <div key={i} className="flex items-center justify-between py-2.5" style={{borderBottom:`1px solid ${T.b1}`}}>
              <div><div className="flex items-center gap-1.5 text-[11px]"><span style={{color:T.tx2}}>{e.from_experience}</span><span style={{color:T.tx3}}>→</span><span style={{color:T.tx2}}>{e.to_experience||'(agent)'}</span></div><span className="inline-block text-[9px] px-1.5 py-0.5 rounded mt-1 font-medium" style={{background:T.amber2,color:T.amber}}>{e.trigger_reason}</span></div>
              <div className="font-bold text-[14px]" style={{color:T.tx}}>{e.total}×</div>
            </div>
          ))}
        </Card>
      </div>
      {comments?.length>0&&(
        <Card><CT>💬 Session Comments</CT>
          {comments.map((c:any,i:number)=>(
            <div key={i} className="py-2.5" style={{borderBottom:i<comments.length-1?`1px solid ${T.b1}`:'none'}}>
              <div className="flex items-center gap-2 mb-1"><span className="text-[9px] px-1.5 py-0.5 rounded" style={{background:T.teal2,color:T.teal}}>{c.comment_type}</span><span className="text-[9px]" style={{color:T.tx3}}>{new Date(c.created_at).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</span></div>
              <div className="text-[12px]" style={{color:T.tx}}>{c.comment_text}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

export default function DashboardPage(){
  const router=useRouter()
  const[user,setUser]=useState<CxUser|null>(null)
  const[days,setDays]=useState(7)
  const[tab,setTab]=useState('overview')
  const[loading,setLoading]=useState(true)
  const[error,setError]=useState('')
  const[overviewData,setOverviewData]=useState<any>(null)
  const[sessionsData,setSessionsData]=useState<any[]>([])
  const[sessionsTotal,setSessionsTotal]=useState(0)
  const[sessionsPage,setSessionsPage]=useState(0)
  const[costsData,setCostsData]=useState<any>(null)
  const[qualityData,setQualityData]=useState<any>(null)
  const[recordingsData,setRecordingsData]=useState<any>(null)
  const[selectedSession,setSelectedSession]=useState<any>(null)

  useEffect(()=>{if(!isLoggedIn()){router.replace('/login');return}setUser(getUser())},[router])

  const load=useCallback(async(t=tab,d=days,page=0)=>{
    setLoading(true);setError('');setSelectedSession(null)
    try{
      if(t==='overview'||t==='intel'){const data=await fetchI('/api/i/overview',{days:d});setOverviewData(data)}
      else if(t==='sessions'){const data=await fetchI('/api/i/sessions',{days:d,limit:20,offset:page*20});setSessionsData(data.sessions||[]);setSessionsTotal(data.total||0);setSessionsPage(page)}
      else if(t==='costs'){const data=await fetchI('/api/i/costs',{days:d});setCostsData(data)}
      else if(t==='quality'){const data=await fetchI('/api/i/quality',{days:d});setQualityData(data)}
      else if(t==='recordings'){const data=await fetchI('/api/i/recordings',{days:d});setRecordingsData(data)}
    }catch(e:any){setError(e.message)}
    finally{setLoading(false)}
  },[tab,days])

  useEffect(()=>{if(user)load(tab,days,0)},[tab,days,user])

  async function openSession(id:string){
    try{const data=await fetchI(`/api/i/sessions/${id}`);setSelectedSession(data)}
    catch(e:any){setError(e.message)}
  }

  if(!user)return null

  return(
    <div className="flex flex-col h-screen overflow-hidden" style={{background:T.bg,color:T.tx,fontFamily:'Inter,sans-serif',fontSize:'13px'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:${T.b2};border-radius:3px}
      `}</style>
      <Nav user={user} tab={tab} onTab={t=>{setTab(t)}} onLogout={()=>{clearAuth();router.replace('/login')}}/>
      <div className="flex items-center justify-between px-5 py-1.5 flex-shrink-0" style={{background:T.s2,borderBottom:`1px solid ${T.b1}`}}>
        <div className="text-[10px]" style={{color:T.tx3}}>HDFC Bank · Retail IVR · {tab.charAt(0).toUpperCase()+tab.slice(1)}</div>
        <div className="flex rounded-lg overflow-hidden border" style={{borderColor:T.b2,background:T.s1}}>
          {[1,7,30].map(d=>(
            <button key={d} onClick={()=>setDays(d)} className="px-3 py-1 text-[10px] font-bold transition-all"
              style={{background:days===d?T.teal:'transparent',color:days===d?'#000':T.tx3}}>
              {d===1?'Today':`${d}d`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {error&&<div className="mb-4 px-4 py-2.5 rounded-lg text-[11px]" style={{background:T.red2,color:T.red,border:`1px solid ${T.red}33`}}>{error}</div>}
        {loading?(
          <div className="flex items-center justify-center h-32"><div className="text-[11px] animate-pulse" style={{color:T.tx3}}>Loading…</div></div>
        ):(
          <>
            {tab==='overview'   &&<OverviewTab data={overviewData}/>}
            {tab==='intel'      &&<IntelTab data={overviewData}/>}
            {tab==='sessions'   &&<SessionsTab sessions={sessionsData} total={sessionsTotal} page={sessionsPage} onPage={(p: number)=>load('sessions',days,p)} onOpen={openSession} selected={selectedSession} onBack={()=>setSelectedSession(null)}/>}
            {tab==='costs'      &&<CostsTab data={costsData}/>}
            {tab==='quality'    &&<QualityTab data={qualityData}/>}
            {tab==='recordings' &&<RecordingsTab data={recordingsData}/>}
          </>
        )}
      </div>
    </div>
  )
}

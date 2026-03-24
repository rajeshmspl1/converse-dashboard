'use client'
import { getEnv } from '@/lib/env'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, clearAuth, fetchI, isLoggedIn, type CxUser } from '@/lib/auth'
import UnifiedHeader from '@/components/layout/UnifiedHeader'
import TelephonyTab from '@/components/dashboard/TelephonyTab'

/** Call Service B provisioning proxy (JWT auth — admin key stays server-side). */
async function fetchB(path: string, method: string = 'POST', body?: any): Promise<any> {
  const token = (await import('@/lib/auth')).getAccessToken()
  if (!token) throw new Error('Not authenticated')
  const SERVICE_B = typeof window !== "undefined" ? getEnv().serviceB : "http://localhost:9000"
  const res = await fetch(`${SERVICE_B}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ? (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)) : `HTTP ${res.status}`)
  }
  return res.json()
}

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


function OverviewTab({data,billing,user}:{data:any;billing?:any;user?:CxUser|null}){
  if(!data)return null
  const{kpis,csat,experience_mix,languages,intents}=data
  const res=kpis.total_calls>0?Math.round((kpis.resolved/kpis.total_calls)*100):0
  const cont=kpis.total_calls>0?Math.round(((kpis.total_calls-kpis.handoff-kpis.ivr_passthrough)/kpis.total_calls)*100):0
  const bt=billing?.totals||(typeof billing==='object'&&billing!==null&&!billing.totals?null:null)
  // For super admin, billing is a Record<tenant_key, billingObj>. For customer admin, it's a single billingObj.
  const isSuperBilling=billing&&!billing.totals&&typeof billing==='object'
  const singleBt=billing?.totals
  const allTenantBillings=isSuperBilling?Object.entries(billing as Record<string,any>).filter(([_,v])=>v?.totals?.cost_inr>0):[]
  const aggTotals=isSuperBilling?{
    cost_inr:allTenantBillings.reduce((a,[_,v])=>a+(v.totals?.cost_inr||0),0),
    cost_usd:allTenantBillings.reduce((a,[_,v])=>a+(v.totals?.cost_usd||0),0),
    sessions:allTenantBillings.reduce((a,[_,v])=>a+(v.totals?.sessions||0),0),
    intents:allTenantBillings.reduce((a,[_,v])=>a+(v.totals?.intents||0),0),
    resolved:allTenantBillings.reduce((a,[_,v])=>a+(v.totals?.resolved||0),0),
    duration_sec:allTenantBillings.reduce((a,[_,v])=>a+(v.totals?.duration_sec||0),0),
    net_billable_inr:allTenantBillings.reduce((a,[_,v])=>a+(v.totals?.net_billable_inr||0),0),
    net_billable_usd:allTenantBillings.reduce((a,[_,v])=>a+(v.totals?.net_billable_usd||0),0),
  }:null
  // Extract exchange rate info from billing response
  const xrInfo=isSuperBilling
    ?(allTenantBillings.length>0?(allTenantBillings[0][1] as any)?.exchange_rate:null)
    :billing?.exchange_rate
  const displayTotals=singleBt||aggTotals
  const[billingExpanded,setBillingExpanded]=useState(false)
  return(
    <div>
      {displayTotals&&(
        <>
          <Sttl>AI Billing Summary{isSuperBilling?` · ${allTenantBillings.length} tenant${allTenantBillings.length!==1?'s':''} with usage`:''}</Sttl>
          <Card className="mb-4">
            <div className="flex items-center gap-6 flex-wrap cursor-pointer" onClick={()=>setBillingExpanded(!billingExpanded)}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 rounded" style={{background:T.green}}/>
                <div>
                  <div className="font-mono text-[24px] font-bold" style={{color:T.green}}>₹{fmt(displayTotals.net_billable_inr||displayTotals.cost_inr,2)}</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{color:T.tx3}}>Net Billable{displayTotals.net_billable_usd||displayTotals.cost_usd?<span className="font-mono ml-2" style={{color:T.tx2}}>(${fmt(displayTotals.net_billable_usd||displayTotals.cost_usd,2)} USD)</span>:null}</div>
                </div>
              </div>
              <div className="h-8 w-px" style={{background:T.b1}}/>
              <div className="flex gap-4">
                {[
                  {label:'Sessions',value:String(displayTotals.sessions),color:T.teal},
                  {label:'Intents',value:String(displayTotals.intents),color:T.blue},
                  {label:'Resolved',value:`${displayTotals.sessions>0?Math.round((displayTotals.resolved/displayTotals.sessions)*100):0}%`,color:T.green},
                  {label:'Duration',value:fmtDur(displayTotals.duration_sec),color:T.amber},
                ].map((m,i)=>(
                  <div key={i} className="text-center">
                    <div className="font-mono text-[16px] font-bold" style={{color:m.color}}>{m.value}</div>
                    <div className="text-[8px] uppercase tracking-wider" style={{color:T.tx3}}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="ml-auto flex-shrink-0">
                <span className="text-[10px] font-semibold px-2 py-1 rounded" style={{background:`${T.teal}11`,color:T.teal}}>
                  {billingExpanded?'▲ Collapse':'▼ Details'}
                </span>
              </div>
            </div>
            {billingExpanded&&(
              <div className="mt-4 pt-3" style={{borderTop:`1px solid ${T.b1}`}}>
                {isSuperBilling?(
                  <>
                    <div className="text-[9px] font-semibold uppercase tracking-wider mb-3" style={{color:T.tx3}}>Billing by Tenant</div>
                    {allTenantBillings.map(([tk,b]:any,i:number)=>{
                      const tt=b.totals
                      const pct=displayTotals.cost_inr>0?Math.round((tt.cost_inr/displayTotals.cost_inr)*100):0
                      return(
                        <div key={tk} className="rounded-lg p-3 mb-2 last:mb-0" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-6 rounded" style={{background:[T.teal,T.blue,T.purple,T.amber,T.green][i]||T.tx3}}/>
                              <span className="text-[12px] font-bold" style={{color:T.tx}}>{(b.tenant_key||tk).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[14px] font-bold" style={{color:T.green}}>₹{fmt(tt.net_billable_inr,2)}</span>
                              {tt.net_billable_usd?<span className="font-mono text-[10px]" style={{color:T.tx3}}>(${fmt(tt.net_billable_usd,2)})</span>:null}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-[10px]" style={{color:T.tx2}}>
                            <span>{tt.sessions} sessions</span>
                            <span>{tt.intents} intents</span>
                            <span>{tt.sessions>0?Math.round((tt.resolved/tt.sessions)*100):0}% resolved</span>
                            <span>{fmtDur(tt.duration_sec)}</span>
                            <span className="font-mono" style={{color:T.tx3}}>{pct}% of total</span>
                          </div>
                          <div className="mt-1.5 h-[4px] rounded" style={{background:T.s1}}>
                            <div className="h-full rounded" style={{width:`${pct}%`,background:[T.teal,T.blue,T.purple,T.amber,T.green][i]||T.tx3}}/>
                          </div>
                          {(b.by_experience||[]).length>0&&(
                            <div className="mt-2 flex flex-wrap gap-3">
                              {b.by_experience.filter((e:any)=>e.total_cost_inr>0).map((e:any,j:number)=>(
                                <span key={j} className="text-[9px]" style={{color:T.tx3}}>
                                  {e.experience_level_final||'Other'}: <span className="font-mono" style={{color:T.green}}>₹{fmt(parseFloat(e.total_cost_inr),2)}</span> ({e.sessions} calls)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                ):(
                  <>
                    <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:T.tx3}}>By Experience</div>
                    {(billing?.by_experience||[]).filter((e:any)=>e.total_cost_inr>0).map((e:any,i:number)=>(
                      <div key={i} className="flex items-center justify-between py-2" style={{borderBottom:i<(billing?.by_experience||[]).length-1?`1px solid ${T.b1}`:'none'}}>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{background:[T.teal,T.blue,T.purple][i]||T.tx3}}/>
                          <span className="text-[11px]" style={{color:T.tx}}>{e.experience_level_final||'Other'}</span>
                          <span className="text-[9px]" style={{color:T.tx3}}>{e.sessions} sessions · {e.total_intents} intents · {e.resolved} resolved</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold" style={{color:T.green}}>₹{fmt(parseFloat(e.total_cost_inr),2)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </Card>
          {xrInfo&&<div className="text-[9px] mt-1 mb-1 text-right" style={{color:T.tx3}}>USD/INR: <span className="font-mono">{xrInfo.usd_inr}</span> · {xrInfo.source} · {xrInfo.fetched_at?new Date(xrInfo.fetched_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</div>}
        </>
      )}
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
      const tenant = JSON.parse(localStorage.getItem('cx_user')||'{}').tenant_key || 'experience_shop'
      
      const response = await fetch(`${getEnv().serviceB}/recordings/${recordingId}/stream`, {
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
              <div className="text-[11px]" style={{color:T.tx2}}>{r.recording_type} · {r.session_language||'—'} · {r.experience_level_final||'—'}{r.caller_country ? ' · ' + r.caller_country + (r.caller_city ? ' · ' + r.caller_city : '') : ''}</div>
              <div className="text-[10px] mt-0.5" style={{color:T.tx3}}>
                {r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' · ' + new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'shortGeneric' }) : '—'}
                {r.duration_sec ? ' · Duration: ' + (Math.floor(r.duration_sec/60) > 0 ? Math.floor(r.duration_sec/60) + 'm ' : '') + Math.round(r.duration_sec%60) + 's' : ''}
              </div>
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

/* ═══════════════════════════════════════════════════════════════
   PROVISIONING TAB — Role-aware: super_admin vs tenant_admin
   ═══════════════════════════════════════════════════════════════ */

const STAGES=['try','pre_uat','post_uat','pilot','production'] as const
const STAGE_LABEL:Record<string,string>={try:'Try',pre_uat:'Pre-UAT',post_uat:'Post-UAT',pilot:'Pilot',production:'Production'}
const TIER_LABEL:Record<string,string>={tier4:'Tier 4 — Free',tier3:'Tier 3 — Starter',tier2:'Tier 2 — Growth',tier1:'Tier 1 — Enterprise'}
const TIER_COLOR:Record<string,string>={tier4:T.tx3,tier3:T.teal,tier2:T.blue,tier1:T.purple}
const PROV_STATUS_COLOR:Record<string,string>={active:T.green,none:T.tx3,pending:T.amber,deprovision_requested:T.red,deprovisioned:T.red}
const APPROVAL_LABEL:Record<string,{label:string;color:string}>={auto_approved:{label:'Auto',color:T.teal},approved:{label:'Approved',color:T.green},pending:{label:'Pending',color:T.amber},rejected:{label:'Rejected',color:T.red}}
const TIER_INFRA:Record<string,{db:string;services:string;compute:string;blob:string;isolation:string;color:string}>={
  tier4:{db:'Shared DB (schema-level)',services:'Shared pods',compute:'Shared VM',blob:'Shared container',isolation:'Logical only',color:T.tx3},
  tier3:{db:'Dedicated DB',services:'Shared pods',compute:'Shared VM',blob:'Shared container',isolation:'DB-level isolation',color:T.teal},
  tier2:{db:'Dedicated DB',services:'Dedicated pods',compute:'Shared VM',blob:'Dedicated container',isolation:'Namespace + RBAC',color:T.blue},
  tier1:{db:'Dedicated DB + replica',services:'Dedicated pods',compute:'Dedicated node pool',blob:'Dedicated storage account',isolation:'Full network isolation',color:T.purple},
}
const TIER_COST_PLATFORM:Record<string,number>={tier4:0,tier3:0,tier2:0,tier1:0}  // real costs come from sessions
const TIER_ORDER:Record<string,number>={tier4:0,tier3:1,tier2:2,tier1:3}
const REGION_OPTIONS:{code:string;azure:string;label:string;flag:string}[]=[
  {code:'in',azure:'Central India',label:'India (Mumbai)',flag:'🇮🇳'},
  {code:'us',azure:'East US',label:'United States (Virginia)',flag:'🇺🇸'},
  {code:'eu',azure:'West Europe',label:'Europe (Netherlands)',flag:'🇪🇺'},
  {code:'ae',azure:'UAE North',label:'Middle East (Dubai)',flag:'🇦🇪'},
  {code:'sg',azure:'Southeast Asia',label:'Singapore',flag:'🇸🇬'},
  {code:'gb',azure:'UK South',label:'United Kingdom (London)',flag:'🇬🇧'},
]
function regionLabel(code:string|null|undefined):string{
  if(!code)return '—'
  const r=REGION_OPTIONS.find(o=>o.code===code)
  return r?`${r.flag} ${r.label}`:code
}

function JourneyBar({current}:{current:string}){
  const idx=STAGES.indexOf(current as any)
  return(
    <div className="flex items-center gap-0 w-full">
      {STAGES.map((s,i)=>{
        const done=i<idx,active=i===idx,future=i>idx
        return(
          <div key={s} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all"
                style={{
                  background:done?T.teal:active?T.blue:'transparent',
                  borderColor:done?T.teal:active?T.blue:T.b2,
                  color:done||active?'#000':T.tx3,
                  boxShadow:active?`0 0 12px ${T.blue}44`:'none',
                }}>
                {done?'✓':i+1}
              </div>
              <div className="text-[9px] font-semibold mt-1.5 text-center truncate w-full" style={{color:done?T.teal:active?T.blue:T.tx3}}>
                {STAGE_LABEL[s]||s}
              </div>
            </div>
            {i<STAGES.length-1&&(
              <div className="h-[2px] flex-1 mx-1 rounded" style={{background:done?T.teal:T.b2,minWidth:'12px'}}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PendingActionBtn({label,color,loading,onClick}:{label:string;color:string;loading?:boolean;onClick:()=>void}){
  return(
    <button onClick={onClick} disabled={loading}
      className="px-3 py-1.5 text-[9px] font-bold rounded transition-all hover:opacity-80 disabled:opacity-40"
      style={{background:color,color:'#000'}}>
      {loading?'…':label}
    </button>
  )
}

function BillingPanel({billing,title}:{billing:any;title?:string}){
  if(!billing||!billing.totals)return null
  const t=billing.totals
  const byExp=billing.by_experience||[]
  const resPct=t.sessions>0?Math.round((t.resolved/t.sessions)*100):0
  return(
    <Card className="mb-4">
      <CT>{title||'📋 AI Billing Statement'}</CT>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="rounded-lg p-2.5 text-center" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
          <div className="font-mono text-[18px] font-bold" style={{color:T.teal}}>{t.sessions}</div>
          <div className="text-[9px]" style={{color:T.tx3}}>Sessions</div>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
          <div className="font-mono text-[18px] font-bold" style={{color:T.blue}}>{t.intents}</div>
          <div className="text-[9px]" style={{color:T.tx3}}>Intents</div>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
          <div className="font-mono text-[18px] font-bold" style={{color:T.green}}>{resPct}%</div>
          <div className="text-[9px]" style={{color:T.tx3}}>Resolved</div>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
          <div className="font-mono text-[18px] font-bold" style={{color:T.amber}}>{fmtDur(t.duration_sec)}</div>
          <div className="text-[9px]" style={{color:T.tx3}}>Total Duration</div>
        </div>
      </div>
      <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:T.tx3}}>By Experience</div>
      {byExp.map((e:any,i:number)=>{
        const expLabel=e.experience_level_final||'Unknown'
        const pct=t.cost_inr>0?Math.round((parseFloat(e.total_cost_inr)/t.cost_inr)*100):0
        return(
          <div key={i} className="flex items-center gap-3 py-2" style={{borderBottom:i<byExp.length-1?`1px solid ${T.b1}`:'none'}}>
            <div className="w-2 h-8 rounded flex-shrink-0" style={{background:[T.teal,T.blue,T.purple,T.amber][i]||T.tx3}}/>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold" style={{color:T.tx}}>{expLabel}</span>
                <span className="font-mono text-[11px] font-bold" style={{color:T.green}}>₹{fmt(parseFloat(e.total_cost_inr),2)}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[9px]" style={{color:T.tx3}}>{e.sessions} sessions · {e.total_intents} intents · {e.resolved} resolved</span>
                <span className="text-[9px] font-mono" style={{color:T.tx3}}>{pct}%</span>
              </div>
            </div>
          </div>
        )
      })}
      <div className="mt-3 pt-3 flex items-center justify-between" style={{borderTop:`2px solid ${T.b1}`}}>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{color:T.tx3}}>Resolution</div>
          <div className="text-[10px] mt-1" style={{color:T.tx2}}>
            <span style={{color:T.green}}>✅ {t.resolved} resolved = ₹{fmt(t.sessions>0?(t.cost_inr*t.resolved/t.sessions):0,2)}</span>
            <span className="mx-2" style={{color:T.b2}}>|</span>
            <span style={{color:T.red}}>✕ {t.not_resolved} unresolved = -₹{fmt(t.sessions>0?(t.cost_inr*t.not_resolved/t.sessions):0,2)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{color:T.teal}}>NET BILLABLE</div>
          <div className="font-mono text-[22px] font-bold" style={{color:T.green}}>₹{fmt(t.net_billable_inr,2)}</div>
        </div>
      </div>
    </Card>
  )
}

function ProvisioningTab({user,data,pending,timeline,actionLoading,onAction,billing}:{
  user:CxUser;data:any;pending:any;timeline:any;actionLoading:string|null;
  onAction:(action:string,tenantKey:string,body?:any)=>void;billing:any
}){
  const isSuperAdmin=user.role==='super_admin'
  const[managingTenant,setManagingTenant]=useState<string|null>(null)
  const[changeTier,setChangeTier]=useState<string>('')
  const[selectedRegion,setSelectedRegion]=useState<string>('')
  const[azureResult,setAzureResult]=useState<any>(null)
  const[verifyResult,setVerifyResult]=useState<any>(null)

  if(!data)return <div className="text-[11px]" style={{color:T.tx3}}>No provisioning data.</div>

  // ── CUSTOMER ADMIN VIEW ──
  if(!isSuperAdmin){
    const d=data
    return(
      <div>
        <Sttl>Journey Progress</Sttl>
        <Card className="mb-4">
          <JourneyBar current={d.journey_stage||'try'}/>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg p-3" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{color:T.tx3}}>Current Tier</div>
              <div className="font-mono text-[16px] font-bold" style={{color:TIER_COLOR[d.tier]||T.tx}}>{TIER_LABEL[d.tier]||d.tier||'—'}</div>
            </div>
            <div className="rounded-lg p-3" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{color:T.tx3}}>Status</div>
              <div className="font-semibold text-[14px]" style={{color:PROV_STATUS_COLOR[d.provision_status]||T.tx3}}>{(d.provision_status||'none').replace(/_/g,' ')}</div>
            </div>
            <div className="rounded-lg p-3" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{color:T.tx3}}>Stage</div>
              <div className="font-semibold text-[14px]" style={{color:T.blue}}>{STAGE_LABEL[d.journey_stage]||d.journey_stage||'—'}</div>
            </div>
            <div className="rounded-lg p-3" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{color:T.tx3}}>Provisioned</div>
              <div className="font-mono text-[11px]" style={{color:T.tx2}}>{d.provisioned_at?new Date(d.provisioned_at).toLocaleDateString('en-IN',{dateStyle:'medium'}):'Not yet'}</div>
            </div>
          </div>
        </Card>

        {d.pending_change&&(
          <>
            <Sttl>Pending Change</Sttl>
            <Card className="mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded" style={{background:T.amber}}/>
                <div className="flex-1">
                  <div className="text-[12px] font-semibold" style={{color:T.tx}}>
                    {d.pending_change.direction==='upgrade'?'⬆':'⬇'} {d.pending_change.direction?.charAt(0).toUpperCase()+(d.pending_change.direction||'').slice(1)} to <span style={{color:TIER_COLOR[d.pending_change.requested_tier]||T.tx}}>{TIER_LABEL[d.pending_change.requested_tier]||d.pending_change.requested_tier}</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{color:T.tx3}}>
                    Requested {d.pending_change.requested_at?new Date(d.pending_change.requested_at).toLocaleDateString('en-IN',{dateStyle:'medium'}):''} by {d.pending_change.requested_by||'—'} · Awaiting super admin approval
                  </div>
                </div>
                <span className="px-2 py-1 text-[9px] font-bold rounded" style={{background:T.amber2,color:T.amber}}>PENDING</span>
              </div>
            </Card>
          </>
        )}

        {d.pending_deprovision&&(
          <>
            <Sttl>Deprovision Request</Sttl>
            <Card className="mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded" style={{background:T.red}}/>
                <div className="flex-1">
                  <div className="text-[12px] font-semibold" style={{color:T.red}}>Deprovision Requested</div>
                  <div className="text-[10px] mt-0.5" style={{color:T.tx3}}>
                    {d.pending_deprovision.reason||'No reason provided'} · {d.pending_deprovision.requested_at?new Date(d.pending_deprovision.requested_at).toLocaleDateString('en-IN',{dateStyle:'medium'}):''}
                  </div>
                </div>
                <span className="px-2 py-1 text-[9px] font-bold rounded" style={{background:T.red2,color:T.red}}>PENDING</span>
              </div>
            </Card>
          </>
        )}

        {billing&&billing.totals&&<BillingPanel billing={billing} title={`📋 AI Billing — ${d.name||d.tenant_key}`}/>}

        {d.next_stage&&d.next_stage.next_stage&&(
          <>
            <Sttl>Next: {STAGE_LABEL[d.next_stage.next_stage]||d.next_stage.next_stage}</Sttl>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold" style={{color:T.tx}}>
                  Upgrade to {TIER_LABEL[d.next_stage.next_tier]||d.next_stage.next_tier}
                </span>
                <span className="px-1.5 py-0.5 text-[8px] rounded font-bold"
                  style={{background:d.next_stage.approval_mode==='auto'?T.green+'22':T.amber2,color:d.next_stage.approval_mode==='auto'?T.green:T.amber}}>
                  {d.next_stage.approval_mode==='auto'?'AUTO-APPROVE':'MANUAL REVIEW'}
                </span>
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:T.tx3}}>Requirements</div>
              {(d.next_stage.requirements||[]).map((r:string,i:number)=>(
                <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{background:T.blue}}/>
                  <div className="text-[11px] leading-relaxed" style={{color:T.tx2}}>{r}</div>
                </div>
              ))}
            </Card>
          </>
        )}

        {timeline?.events?.length>0&&(
          <>
            <Sttl>Timeline</Sttl>
            <Card>
              {timeline.events.slice(0,10).map((ev:any,i:number)=>(
                <div key={i} className="flex items-start gap-3 py-2.5" style={{borderBottom:i<Math.min(timeline.events.length,10)-1?`1px solid ${T.b1}`:'none'}}>
                  <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{background:
                    ev.event.includes('approved')?T.green:ev.event.includes('rejected')?T.red:ev.event.includes('deprovision')?T.red:T.amber
                  }}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold" style={{color:T.tx}}>{ev.event.replace(/_/g,' ')}</div>
                    <div className="text-[10px]" style={{color:T.tx3}}>{ev.tier} · {ev.at?new Date(ev.at).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}):''}{ev.by?` · by ${ev.by}`:''}</div>
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}
      </div>
    )
  }

  // ── SUPER ADMIN VIEW ──
  const allTenants=data?.tenants||[]
  const tierChanges=pending?.tier_changes||[]
  const tierRecs=pending?.tier_recommendations||[]
  const deprovs=pending?.deprovisions||[]
  const totalPending=(pending?.total_pending)||0

  return(
    <div>
      <Sttl>Provisioning Overview</Sttl>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
        <Kpi label="Total Tenants" value={String(allTenants.length)} color={T.tx}/>
        <Kpi label="Active" value={String(allTenants.filter((t:any)=>t.provision_status==='active').length)} color={T.green}/>
        <Kpi label="Pending Approvals" value={String(totalPending)} color={totalPending>0?T.amber:T.tx3}/>
        <Kpi label="Deprovisioned" value={String(allTenants.filter((t:any)=>t.provision_status==='deprovisioned').length)} color={T.red}/>
        <Kpi label="Est. Monthly (₹)" value={fmt(allTenants.reduce((a:number,t:any)=>a+(t.est_monthly_cost_inr||0),0))} color={T.green} sub="all tenants"/>
      </div>

      {/* ── PENDING QUEUE ── */}
      {totalPending>0&&(
        <>
          <Sttl>🔔 Pending Approvals ({totalPending})</Sttl>

          {tierRecs.length>0&&(
            <Card className="mb-3">
              <CT>📋 Tier Recommendations</CT>
              {tierRecs.map((t:any,i:number)=>(
                <div key={i} className="flex items-center gap-3 py-3" style={{borderBottom:i<tierRecs.length-1?`1px solid ${T.b1}`:'none'}}>
                  <div className="w-2 h-10 rounded" style={{background:T.amber}}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold" style={{color:T.tx}}>{t.name||t.tenant_key} <span className="font-mono text-[10px]" style={{color:T.tx3}}>({t.tenant_key})</span></div>
                    <div className="text-[10px] mt-0.5" style={{color:T.tx2}}>
                      {t.current_tier||'—'} → <span style={{color:TIER_COLOR[t.recommended_tier]||T.tx}}>{t.recommended_tier}</span>
                      {t.recommended_reason&&<span style={{color:T.tx3}}> · {t.recommended_reason}</span>}
                      {t.recommended_points!=null&&<span className="font-mono ml-1" style={{color:T.amber}}>{t.recommended_points} pts</span>}
                    </div>
                    <div className="text-[9px] mt-0.5" style={{color:T.tx3}}>{STAGE_LABEL[t.journey_stage]||t.journey_stage||'—'} stage</div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <PendingActionBtn label="Approve" color={T.green}
                      loading={actionLoading===`approve_tier:${t.tenant_key}`}
                      onClick={()=>onAction('approve_tier',t.tenant_key,{tier:t.recommended_tier})}/>
                    <PendingActionBtn label="Reject" color={T.red}
                      loading={actionLoading===`reject_tier:${t.tenant_key}`}
                      onClick={()=>onAction('reject_tier',t.tenant_key)}/>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {tierChanges.length>0&&(
            <Card className="mb-3">
              <CT>🔄 Tier Change Requests</CT>
              {tierChanges.map((t:any,i:number)=>(
                <div key={i} className="flex items-center gap-3 py-3" style={{borderBottom:i<tierChanges.length-1?`1px solid ${T.b1}`:'none'}}>
                  <div className="w-2 h-10 rounded" style={{background:t.direction==='upgrade'?T.blue:T.amber}}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold" style={{color:T.tx}}>{t.name||t.tenant_key} <span className="font-mono text-[10px]" style={{color:T.tx3}}>({t.tenant_key})</span></div>
                    <div className="text-[10px] mt-0.5" style={{color:T.tx2}}>
                      {t.direction==='upgrade'?'⬆':'⬇'} {t.current_tier} → <span style={{color:TIER_COLOR[t.requested_tier]||T.tx}}>{t.requested_tier}</span>
                      <span className="ml-2 px-1 py-0.5 rounded text-[8px] font-bold" style={{background:t.direction==='upgrade'?T.blue2:T.amber2,color:t.direction==='upgrade'?T.blue:T.amber}}>{t.direction}</span>
                    </div>
                    <div className="text-[9px] mt-0.5" style={{color:T.tx3}}>
                      by {t.tier_change_requested_by||'—'} · {t.tier_change_requested_at?new Date(t.tier_change_requested_at).toLocaleDateString('en-IN',{dateStyle:'medium'}):''}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <PendingActionBtn label="Approve" color={T.green}
                      loading={actionLoading===`approve_change:${t.tenant_key}`}
                      onClick={()=>onAction('approve_change',t.tenant_key)}/>
                    <PendingActionBtn label="Reject" color={T.red}
                      loading={actionLoading===`reject_change:${t.tenant_key}`}
                      onClick={()=>onAction('reject_change',t.tenant_key)}/>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {deprovs.length>0&&(
            <Card className="mb-3">
              <CT>🗑️ Deprovision Requests</CT>
              {deprovs.map((t:any,i:number)=>{
                const guardActive=t.min_valid_until&&new Date(t.min_valid_until)>new Date()&&!t.provision_lock_override
                return(
                  <div key={i} className="flex items-center gap-3 py-3" style={{borderBottom:i<deprovs.length-1?`1px solid ${T.b1}`:'none'}}>
                    <div className="w-2 h-10 rounded" style={{background:T.red}}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold" style={{color:T.tx}}>{t.name||t.tenant_key} <span className="font-mono text-[10px]" style={{color:T.tx3}}>({t.tenant_key})</span></div>
                      <div className="text-[10px] mt-0.5" style={{color:T.tx2}}>
                        {t.tier} · {t.deprovision_reason||'No reason'}
                      </div>
                      <div className="text-[9px] mt-0.5" style={{color:T.tx3}}>
                        by {t.deprovision_requested_by||'—'} · {t.deprovision_requested_at?new Date(t.deprovision_requested_at).toLocaleDateString('en-IN',{dateStyle:'medium'}):''}
                        {guardActive&&<span className="ml-1 font-bold" style={{color:T.red}}>⚠ 5-day guard active until {new Date(t.min_valid_until).toLocaleDateString('en-IN',{dateStyle:'medium'})}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <PendingActionBtn label={guardActive?'Override & Approve':'Approve'} color={guardActive?T.amber:T.green}
                        loading={actionLoading===`approve_deprov:${t.tenant_key}`}
                        onClick={()=>onAction('approve_deprov',t.tenant_key,{override:!!guardActive})}/>
                    </div>
                  </div>
                )
              })}
            </Card>
          )}
        </>
      )}

      {/* ── INFRASTRUCTURE & COST BREAKDOWN ── */}
      <Sttl>Infrastructure, Cost & Data Residency</Sttl>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card>
          <CT>💰 Platform Cost by Tenant</CT>
          <div className="text-[9px] mb-2 px-1 py-1 rounded" style={{background:T.s2,color:T.tx3}}>
            Real usage costs from session data. Cost is calculated per call by Service A (customer price, margin included).
          </div>
          {allTenants.filter((t:any)=>t.is_active!==false).map((t:any,i:number)=>{
            const cost=TIER_COST_PLATFORM[t.tier]||0
            const totalActive=allTenants.filter((x:any)=>x.is_active!==false).reduce((a:number,x:any)=>a+(TIER_COST_PLATFORM[x.tier]||0),0)
            const pct=totalActive>0?Math.round((cost/totalActive)*100):0
            const usageCost=t.usage_cost_inr||0
            return(
              <div key={i} className="flex items-center gap-2 mb-2.5 last:mb-0">
                <div className="w-2 h-8 rounded flex-shrink-0" style={{background:TIER_COLOR[t.tier]||T.tx3}}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold truncate" style={{color:T.tx}}>{t.name||t.tenant_key}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="font-mono text-[10px]" style={{color:T.green}}>₹{fmt(cost)}/mo</span>
                      {usageCost>0&&<span className="font-mono text-[10px]" style={{color:T.purple}}>+₹{fmt(usageCost,2)} usage</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-[5px] rounded" style={{background:T.s2}}><div className="h-full rounded" style={{width:`${pct}%`,background:TIER_COLOR[t.tier]||T.tx3}}/></div>
                    <span className="text-[9px] w-8" style={{color:T.tx3}}>{pct}%</span>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="mt-3 pt-3 flex justify-between items-center" style={{borderTop:`1px solid ${T.b1}`}}>
            <span className="text-[10px] font-semibold uppercase" style={{color:T.tx3}}>Total Platform</span>
            <span className="font-mono text-[16px] font-bold" style={{color:T.green}}>₹{fmt(allTenants.filter((x:any)=>x.is_active!==false).reduce((a:number,x:any)=>a+(TIER_COST_PLATFORM[x.tier]||0),0))}/mo</span>
          </div>
        </Card>
        <Card>
          <CT>🖥 Infrastructure by Tier</CT>
          {(['tier1','tier2','tier3','tier4'] as const).map(tier=>{
            const inf=TIER_INFRA[tier]
            const count=allTenants.filter((t:any)=>t.tier===tier&&t.is_active!==false).length
            if(!count)return null
            return(
              <div key={tier} className="mb-3 last:mb-0 rounded-lg p-3" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-bold" style={{color:inf.color}}>{TIER_LABEL[tier]}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{background:`${inf.color}22`,color:inf.color}}>{count} tenant{count>1?'s':''}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {[{k:'Database',v:inf.db},{k:'Services',v:inf.services},{k:'Compute',v:inf.compute},{k:'Storage',v:inf.blob},{k:'Isolation',v:inf.isolation}].map(r=>(
                    <div key={r.k} className="flex items-start gap-1.5">
                      <span className="text-[9px] font-semibold w-14 flex-shrink-0" style={{color:T.tx3}}>{r.k}</span>
                      <span className="text-[10px]" style={{color:T.tx2}}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </Card>
        <Card>
          <CT>🌍 Data Residency</CT>
          <div className="text-[9px] mb-2 px-1 py-1 rounded" style={{background:T.s2,color:T.tx3}}>
            Azure region per tenant. Auto-suggested from user's country. Editable via Manage panel. Ensures data sovereignty compliance.
          </div>
          {allTenants.filter((t:any)=>t.is_active!==false).map((t:any,i:number)=>{
            const region=t.data_region||t.region_code||null
            return(
              <div key={i} className="flex items-center justify-between py-2" style={{borderBottom:i<allTenants.filter((x:any)=>x.is_active!==false).length-1?`1px solid ${T.b1}`:'none'}}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-5 rounded flex-shrink-0" style={{background:TIER_COLOR[t.tier]||T.tx3}}/>
                  <span className="text-[11px] font-semibold" style={{color:T.tx}}>{t.name||t.tenant_key}</span>
                </div>
                <span className="text-[10px]" style={{color:region?T.teal:T.amber}}>
                  {region?regionLabel(region):'⚠ Not set'}
                </span>
              </div>
            )
          })}
          <div className="mt-3 pt-3 rounded-lg p-2" style={{borderTop:`1px solid ${T.b1}`,background:T.s2}}>
            <div className="text-[9px] font-semibold mb-1" style={{color:T.tx3}}>Available Regions</div>
            <div className="flex flex-wrap gap-1">
              {REGION_OPTIONS.map(r=>(
                <span key={r.code} className="text-[9px] px-1.5 py-0.5 rounded" style={{background:`${T.teal}11`,color:T.tx2}}>{r.flag} {r.azure}</span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── ALL TENANTS TABLE ── */}
      <Sttl>All Tenants ({allTenants.length})</Sttl>
      <Card className="p-0 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full" style={{borderCollapse:'collapse'}}>
            <thead><tr style={{background:T.s2,borderBottom:`1px solid ${T.b1}`}}>
              {['Tenant','Tier','Stage','Status','Approval','Region','Infra','Est. ₹/mo','Guard Until','Actions'].map(h=>(
                <th key={h} className="px-3 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{color:T.tx3}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {allTenants.map((t:any,i:number)=>{
                const inf=TIER_INFRA[t.tier]||TIER_INFRA.tier4
                const appr=APPROVAL_LABEL[t.approval_status]||{label:t.approval_status||'—',color:T.tx3}
                const isManaging=managingTenant===t.tenant_key
                return(
                  <tr key={i} style={{borderBottom:`1px solid ${T.b1}`,background:isManaging?T.s2:i%2?T.s1:T.bg}}
                    onMouseEnter={e=>{if(!isManaging)e.currentTarget.style.background=T.s2}} onMouseLeave={e=>{if(!isManaging)e.currentTarget.style.background=i%2?T.s1:T.bg}}>
                    <td className="px-3 py-2">
                      <div className="text-[11px] font-semibold" style={{color:T.tx}}>{t.name||t.tenant_key}</div>
                      <div className="font-mono text-[9px]" style={{color:T.tx3}}>{t.tenant_key}</div>
                    </td>
                    <td className="px-3 py-2"><span className="font-mono text-[10px] font-bold" style={{color:TIER_COLOR[t.tier]||T.tx3}}>{t.tier||'—'}</span></td>
                    <td className="px-3 py-2"><span className="text-[10px]" style={{color:T.tx2}}>{STAGE_LABEL[t.journey_stage]||t.journey_stage||'—'}</span></td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{background:`${PROV_STATUS_COLOR[t.provision_status]||T.tx3}22`,color:PROV_STATUS_COLOR[t.provision_status]||T.tx3}}>
                        {(t.provision_status||'none').replace(/_/g,' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                        style={{background:`${appr.color}22`,color:appr.color}}>
                        {appr.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px]" style={{color:(t.data_region||t.region_code)?T.teal:T.tx3}}>
                        {regionLabel(t.data_region||t.region_code)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-[9px]" style={{color:T.tx2}}>{inf.db}</div>
                      <div className="text-[8px]" style={{color:T.tx3}}>{inf.services}</div>
                      {t.db_url&&(t.db_url.includes('azure')||t.db_url.includes('postgres.database.azure.com'))&&(
                        <div className="text-[7px] font-bold mt-0.5 px-1 py-0.5 rounded inline-block" style={{background:`${T.teal}11`,color:T.teal}}>☁ AZURE</div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px]" style={{color:T.green}}>₹{fmt(t.est_monthly_cost_inr)}</td>
                    <td className="px-3 py-2 text-[10px]" style={{color:t.min_valid_until&&new Date(t.min_valid_until)>new Date()?T.amber:T.tx3}}>
                      {t.min_valid_until?new Date(t.min_valid_until).toLocaleDateString('en-IN',{dateStyle:'short'}):'—'}
                    </td>
                    <td className="px-3 py-2 relative">
                      <button onClick={()=>{setManagingTenant(isManaging?null:t.tenant_key);setAzureResult(null);setVerifyResult(null)}}
                        className="px-2 py-1 text-[9px] font-bold rounded border transition-all hover:opacity-80"
                        style={{borderColor:T.b2,color:isManaging?T.teal:T.tx3,background:isManaging?`${T.teal}11`:'transparent'}}>
                        {isManaging?'✕ Close':'⚙ Manage'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* ── MANAGE PANEL (inline below table) ── */}
        {managingTenant&&(()=>{
          const mt=allTenants.find((x:any)=>x.tenant_key===managingTenant)
          if(!mt)return null
          const inf=TIER_INFRA[mt.tier]||TIER_INFRA.tier4
          const tiers=['tier4','tier3','tier2','tier1'].filter(x=>x!==mt.tier)
          return(
            <div className="px-4 py-4" style={{background:T.s2,borderTop:`1px solid ${T.teal}33`}}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-6 rounded" style={{background:T.teal}}/>
                <span className="text-[12px] font-bold" style={{color:T.tx}}>Managing: {mt.name||mt.tenant_key}</span>
                <span className="font-mono text-[10px]" style={{color:T.tx3}}>({mt.tenant_key})</span>
                <span className="font-mono text-[10px] ml-2" style={{color:TIER_COLOR[mt.tier]||T.tx3}}>Currently {mt.tier}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Change Tier */}
                <div className="rounded-lg p-3" style={{background:T.s1,border:`1px solid ${T.b1}`}}>
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:T.tx3}}>Change Tier</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tiers.map(tier=>{
                      const dir=TIER_ORDER[tier]>TIER_ORDER[mt.tier]?'upgrade':'downgrade'
                      const selected=changeTier===tier
                      return(
                        <button key={tier} onClick={()=>setChangeTier(selected?'':tier)}
                          className="px-2 py-1 text-[9px] font-bold rounded border transition-all"
                          style={{
                            borderColor:selected?TIER_COLOR[tier]||T.b2:T.b2,
                            background:selected?`${TIER_COLOR[tier]||T.tx3}22`:'transparent',
                            color:TIER_COLOR[tier]||T.tx3,
                          }}>
                          {dir==='upgrade'?'⬆':'⬇'} {tier}
                        </button>
                      )
                    })}
                  </div>
                  {changeTier&&(
                    <div className="flex items-center gap-2">
                      <span className="text-[9px]" style={{color:T.tx3}}>
                        {TIER_ORDER[changeTier]>TIER_ORDER[mt.tier]?'Upgrade':'Downgrade'} {mt.tier} → {changeTier}
                        {changeTier==='tier4'||changeTier==='tier3'?' (auto-approve)':' (manual review)'}
                      </span>
                      <PendingActionBtn
                        label={`${TIER_ORDER[changeTier]>TIER_ORDER[mt.tier]?'Upgrade':'Downgrade'}`}
                        color={TIER_ORDER[changeTier]>TIER_ORDER[mt.tier]?T.blue:T.amber}
                        loading={actionLoading===`tier_change:${mt.tenant_key}`}
                        onClick={()=>{onAction('tier_change',mt.tenant_key,{target_tier:changeTier});setChangeTier('')}}/>
                    </div>
                  )}
                </div>

                {/* Infrastructure */}
                <div className="rounded-lg p-3" style={{background:T.s1,border:`1px solid ${T.b1}`}}>
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:T.tx3}}>Infrastructure ({mt.tier})</div>
                  {[{k:'DB',v:inf.db},{k:'Services',v:inf.services},{k:'Compute',v:inf.compute},{k:'Storage',v:inf.blob},{k:'Isolation',v:inf.isolation}].map(r=>(
                    <div key={r.k} className="flex gap-2 mb-1 last:mb-0">
                      <span className="text-[9px] font-semibold w-14" style={{color:T.tx3}}>{r.k}</span>
                      <span className="text-[10px]" style={{color:T.tx2}}>{r.v}</span>
                    </div>
                  ))}
                </div>

                {/* Data Residency + Deprovision */}
                <div className="rounded-lg p-3" style={{background:T.s1,border:`1px solid ${T.b1}`}}>
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:T.tx3}}>Data Residency</div>
                  <div className="text-[10px] mb-2" style={{color:T.tx2}}>
                    Current: <span style={{color:(mt.data_region||mt.region_code)?T.teal:T.amber}}>{regionLabel(mt.data_region||mt.region_code)}</span>
                  </div>
                  <select
                    value={selectedRegion||mt.data_region||mt.region_code||''}
                    onChange={e=>setSelectedRegion(e.target.value)}
                    className="w-full px-2 py-1.5 rounded text-[10px] mb-2"
                    style={{background:T.s2,border:`1px solid ${T.b2}`,color:T.tx,outline:'none'}}>
                    <option value="">Select region…</option>
                    {REGION_OPTIONS.map(r=>(
                      <option key={r.code} value={r.code}>{r.flag} {r.label} ({r.azure})</option>
                    ))}
                  </select>
                  {selectedRegion&&selectedRegion!==(mt.data_region||mt.region_code||'')&&(
                    <PendingActionBtn label="Set Region" color={T.teal}
                      loading={actionLoading===`set_region:${mt.tenant_key}`}
                      onClick={()=>{onAction('set_region',mt.tenant_key,{region:selectedRegion});setSelectedRegion('')}}/>
                  )}
                  <div className="mt-3 pt-3" style={{borderTop:`1px solid ${T.b1}`}}>
                    <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{color:T.tx3}}>Deprovision</div>
                    {mt.provision_status==='active'?(
                      <PendingActionBtn label="Request Deprovision" color={T.red}
                        loading={actionLoading===`deprovision_request:${mt.tenant_key}`}
                        onClick={()=>onAction('deprovision_request',mt.tenant_key)}/>
                    ):mt.provision_status==='deprovisioned'?(
                      <span className="text-[10px]" style={{color:T.red}}>Already deprovisioned</span>
                    ):mt.provision_status==='deprovision_requested'?(
                      <span className="text-[10px]" style={{color:T.amber}}>Deprovision pending approval</span>
                    ):(
                      <span className="text-[10px]" style={{color:T.tx3}}>Not provisioned</span>
                    )}
                    {mt.min_valid_until&&new Date(mt.min_valid_until)>new Date()&&(
                      <div className="text-[9px] mt-2" style={{color:T.amber}}>⚠ 5-day guard until {new Date(mt.min_valid_until).toLocaleDateString('en-IN',{dateStyle:'medium'})}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── AZURE PROVISIONING ── */}
              <div className="mt-3 rounded-lg p-3" style={{background:T.s1,border:`1px solid ${T.b1}`}}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{color:T.tx3}}>☁️ Azure Database</div>
                  {mt.db_url&&(mt.db_url.includes('azure')||mt.db_url.includes('postgres.database.azure.com'))?(
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{background:`${T.teal}22`,color:T.teal}}>ON AZURE</span>
                  ):(
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{background:`${T.amber}22`,color:T.amber}}>LOCAL</span>
                  )}
                </div>
                <div className="text-[10px] mb-2" style={{color:T.tx2}}>
                  DB: <span className="font-mono text-[9px]" style={{color:T.tx3}}>{mt.db_url?(mt.db_url.length>50?mt.db_url.slice(0,50)+'…':mt.db_url):'Not set'}</span>
                </div>
                {mt.db_url&&(mt.db_url.includes('azure')||mt.db_url.includes('postgres.database.azure.com'))?(
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <PendingActionBtn label="Verify Connection" color={T.teal}
                        loading={actionLoading===`verify_azure:${mt.tenant_key}`}
                        onClick={()=>{setVerifyResult(null);onAction('verify_azure',mt.tenant_key,{onResult:(r:any)=>setVerifyResult(r)})}}/>
                      <span className="text-[9px]" style={{color:T.tx3}}>Check connectivity + tables</span>
                    </div>
                    {verifyResult&&(
                      <div className="rounded-lg p-2 mt-1" style={{background:T.s2,border:`1px solid ${verifyResult.ok?T.teal:T.red}33`}}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold" style={{color:verifyResult.ok?T.teal:T.red}}>{verifyResult.ok?'✓ Connected':'✕ Failed'}</span>
                          {verifyResult.is_azure&&<span className="text-[8px] px-1 py-0.5 rounded" style={{background:`${T.teal}11`,color:T.teal}}>Azure</span>}
                        </div>
                        <div className="flex gap-3 text-[9px]" style={{color:T.tx3}}>
                          <span>Tables: <span className="font-mono" style={{color:verifyResult.has_tables?T.green:T.red}}>{verifyResult.has_tables?'✓':'✕'}</span></span>
                          <span>Sessions: <span className="font-mono" style={{color:T.tx2}}>{verifyResult.session_count??'—'}</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                ):(
                  <div className="flex flex-col gap-2">
                    {!(mt.data_region||mt.region_code)&&(
                      <div className="text-[9px] px-2 py-1.5 rounded" style={{background:`${T.amber}11`,color:T.amber}}>
                        ⚠ Set a data region above before provisioning on Azure
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <PendingActionBtn label="Provision on Azure" color={T.blue}
                        loading={actionLoading===`provision_azure:${mt.tenant_key}`}
                        onClick={()=>{setAzureResult(null);onAction('provision_azure',mt.tenant_key,{onResult:(r:any)=>setAzureResult(r)})}}/>
                      <span className="text-[9px]" style={{color:T.tx3}}>Create DB + copy schema + bootstrap</span>
                    </div>
                    {azureResult&&(
                      <div className="rounded-lg p-2 mt-1" style={{background:T.s2,border:`1px solid ${azureResult.ok?T.green:T.red}33`}}>
                        <div className="text-[10px] font-bold mb-1" style={{color:azureResult.ok?T.green:T.red}}>
                          {azureResult.ok?'✓ Provisioned on Azure':'✕ Failed'}
                        </div>
                        {azureResult.ok&&(
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]" style={{color:T.tx3}}>
                            <span>DB: <span className="font-mono" style={{color:T.tx2}}>{azureResult.db_name}</span></span>
                            <span>Host: <span className="font-mono" style={{color:T.tx2}}>{azureResult.azure_host?.split('.')[0]}</span></span>
                            <span>Region: <span style={{color:T.teal}}>{azureResult.azure_region}</span></span>
                            <span>Schema: <span style={{color:azureResult.schema_copied?T.green:T.amber}}>{azureResult.schema_copied?'Copied':'Existed'}</span></span>
                            <span>Bootstrap: <span style={{color:azureResult.rows_bootstrapped?T.green:T.amber}}>{azureResult.rows_bootstrapped?'Done':'Existed'}</span></span>
                            <span>Was existing: <span style={{color:T.tx2}}>{azureResult.was_existing?'Yes':'No (new)'}</span></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Billing for this tenant */}
              {billing&&billing[mt.tenant_key]&&<div className="mt-3"><BillingPanel billing={billing[mt.tenant_key]} title={`📋 AI Billing — ${mt.name||mt.tenant_key}`}/></div>}
            </div>
          )
        })()}
      </Card>

      {/* ── TIMELINE ── */}
      {timeline?.events?.length>0&&(
        <>
          <Sttl>Recent Activity</Sttl>
          <Card>
            {timeline.events.slice(0,15).map((ev:any,i:number)=>(
              <div key={i} className="flex items-start gap-3 py-2.5" style={{borderBottom:i<Math.min(timeline.events.length,15)-1?`1px solid ${T.b1}`:'none'}}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{background:
                  ev.event.includes('approved')?T.green:ev.event.includes('rejected')?T.red:ev.event.includes('deprovision')?T.red:ev.event.includes('auto')?T.teal:T.amber
                }}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold" style={{color:T.tx}}>{ev.event.replace(/_/g,' ')}</span>
                    <span className="font-mono text-[9px]" style={{color:T.tx3}}>{ev.tenant_key}</span>
                  </div>
                  <div className="text-[10px]" style={{color:T.tx3}}>
                    {ev.tier} · {ev.stage?STAGE_LABEL[ev.stage]||ev.stage:''} · {ev.at?new Date(ev.at).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}):''}
                    {ev.by?` · by ${ev.by}`:''}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </>
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
  const[xRates,setXRates]=useState<any>({rates:{USD:1,INR:84},symbols:{USD:'$',INR:'₹'}})
  const[dispCurrency,setDispCurrency]=useState<string>('INR')
  const[qualityData,setQualityData]=useState<any>(null)
  const[recordingsData,setRecordingsData]=useState<any>(null)
  const[selectedSession,setSelectedSession]=useState<any>(null)
  const[provData,setProvData]=useState<any>(null)
  const[provPending,setProvPending]=useState<any>(null)
  const[provTimeline,setProvTimeline]=useState<any>(null)
  const[provActionLoading,setProvActionLoading]=useState<string|null>(null)
  const[billingData,setBillingData]=useState<any>(null)

  useEffect(()=>{if(!isLoggedIn()){router.replace('/login');return}setUser(getUser())},[router])

  const load=useCallback(async(t=tab,d=days,page=0)=>{
    setLoading(true);setError('');setSelectedSession(null)
    try{
      if(t==='overview'||t==='intel'){
        const data=await fetchI('/api/i/overview',{days:d});setOverviewData(data)
        try{
          if(user?.role==='super_admin'){
            const allT=await fetchI('/api/i/provisioning/all-tenants')
            const billingByTenant:Record<string,any>={}
            for(const tenant of (allT.tenants||[])){
              if(tenant.usage_sessions>0){
                try{const b=await fetchI('/api/i/provisioning/billing',{tenant_key:tenant.tenant_key,days:d});billingByTenant[tenant.tenant_key]=b}catch(_){}
              }
            }
            setBillingData(billingByTenant)
          }else{
            const b=await fetchI('/api/i/provisioning/billing',{days:d});setBillingData(b)
          }
        }catch(_){}
      }
      else if(t==='sessions'){const data=await fetchI('/api/i/sessions',{days:d,limit:20,offset:page*20});setSessionsData(data.sessions||[]);setSessionsTotal(data.total||0);setSessionsPage(page)}
      else if(t==='costs'){const data=await fetchI('/api/i/costs',{days:d});setCostsData(data)}
      if(!xRates.live){try{const xr=await fetchI('/api/i/recordings/exchange-rates',{});if(xr?.rates){setXRates(xr)}}catch(_){}}
      if(t==='quality'){const data=await fetchI('/api/i/quality',{days:d});setQualityData(data)}
      else if(t==='recordings'){const data=await fetchI('/api/i/recordings',{days:d});setRecordingsData(data)}
      else if(t==='provisioning'){
        if(user?.role==='super_admin'){
          const[all,pend,tl]=await Promise.all([
            fetchI('/api/i/provisioning/all-tenants'),
            fetchI('/api/i/provisioning/pending'),
            fetchI('/api/i/provisioning/timeline',{limit:30}),
          ])
          setProvData(all);setProvPending(pend);setProvTimeline(tl)
          // Load billing for each active tenant with sessions
          try{
            const billingByTenant:Record<string,any>={}
            for(const t of all.tenants||[]){
              if(t.usage_sessions>0){
                try{const b=await fetchI('/api/i/provisioning/billing',{tenant_key:t.tenant_key,days:d});billingByTenant[t.tenant_key]=b}catch(_){}
              }
            }
            setBillingData(billingByTenant)
          }catch(_){}
        }else{
          const[status,tl]=await Promise.all([
            fetchI('/api/i/provisioning/my-status'),
            fetchI('/api/i/provisioning/timeline',{limit:20}),
          ])
          setProvData(status);setProvTimeline(tl)
          try{const b=await fetchI('/api/i/provisioning/billing',{days:d});setBillingData(b)}catch(_){}
        }
      }
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
      <UnifiedHeader
        variant="dashboard"
        user={user}
        tabs={[
          {key:'overview',label:'Overview'},{key:'sessions',label:'Sessions'},
          {key:'recordings',label:'Recordings'},{key:'intel',label:'Intelligence'},
          {key:'costs',label:'Cost'},{key:'quality',label:'QC'},
          {key:'provisioning',label:'Provisioning'},{key:'telephony',label:'Telephony'}
        ]}
        activeTab={tab}
        onTabChange={t => setTab(t)}
        tenantLabel={user.role === 'super_admin' ? 'All Tenants · Platform Admin' : user.tenant_key ? user.tenant_key.toUpperCase() + ' · Retail IVR' : 'Demo Mode'}
        onSignOut={() => { clearAuth(); router.replace('/login') }}
      />
      <div className="flex items-center justify-between px-5 py-1.5 flex-shrink-0" style={{background:T.s2,borderBottom:`1px solid ${T.b1}`}}>
        <div className="text-[10px]" style={{color:T.tx3}}>{user.role==='super_admin'?'AiIVRs · All Tenants':`${(user.tenant_key||'').toUpperCase()} · Retail IVR`} · {tab.charAt(0).toUpperCase()+tab.slice(1)}</div>
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
            {tab==='overview'   &&<OverviewTab data={overviewData} billing={billingData} user={user}/>}
            {tab==='intel'      &&<IntelTab data={overviewData}/>}
            {tab==='sessions'   &&<SessionsTab sessions={sessionsData} total={sessionsTotal} page={sessionsPage} onPage={(p: number)=>load('sessions',days,p)} onOpen={openSession} selected={selectedSession} onBack={()=>setSelectedSession(null)}/>}
            {tab==='costs'      &&<CostsTab data={costsData}/>}
            {tab==='quality'    &&<QualityTab data={qualityData}/>}
            {tab==='recordings' &&<RecordingsTab data={recordingsData}/>}
            {tab==='telephony'&&<TelephonyTab user={user}/>}
            {tab==='provisioning'&&<ProvisioningTab user={user} data={provData} pending={provPending} timeline={provTimeline} actionLoading={provActionLoading} billing={billingData} onAction={async(action:string,tenantKey:string,body?:any)=>{
              setProvActionLoading(`${action}:${tenantKey}`)
              try{
                if(action==='approve_tier') await fetchB(`/provisioning/tenants/${tenantKey}/approve`,'POST',{approve_tier:body?.tier||'tier4'})
                else if(action==='reject_tier') await fetchB(`/provisioning/tenants/${tenantKey}/reject`,'POST',{reason:body?.reason||'Rejected from dashboard'})
                else if(action==='approve_change') await fetchB(`/provisioning/tenants/${tenantKey}/change/approve`,'POST',{})
                else if(action==='reject_change') await fetchB(`/provisioning/tenants/${tenantKey}/change/reject`,'POST',{reason:body?.reason||'Rejected'})
                else if(action==='approve_deprov') await fetchB(`/provisioning/tenants/${tenantKey}/deprovision/approve`,'POST',{override_validity_guard:body?.override||false})
                else if(action==='tier_change') await fetchB(`/provisioning/tenants/${tenantKey}/change`,'POST',{target_tier:body?.target_tier})
                else if(action==='deprovision_request') await fetchB(`/provisioning/tenants/${tenantKey}/deprovision`,'POST',{reason:'Requested from dashboard'})
                else if(action==='set_region'){
                  await fetchB(`/provisioning/tenants/${tenantKey}/region`,'POST',{data_region:body?.region})
                }
                else if(action==='provision_azure'){
                  const result=await fetchB(`/provisioning/tenants/${tenantKey}/azure`,'POST',{template_db:body?.template_db||null})
                  if(body?.onResult)body.onResult(result)
                  // No reload — keep manage panel open to show result
                  return
                }
                else if(action==='verify_azure'){
                  const result=await fetchB(`/provisioning/tenants/${tenantKey}/verify`,'POST',{})
                  if(body?.onResult)body.onResult(result)
                  // No reload — verify is read-only, keep manage panel open
                  return
                }
                load('provisioning',days,0)
              }catch(e:any){setError(e.message)}
              finally{setProvActionLoading(null)}
            }}/>}
          </>
        )}
      </div>
    </div>
  )
}

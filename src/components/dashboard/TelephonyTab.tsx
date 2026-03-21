'use client'
import { useState, useEffect, useCallback } from 'react'
import type { CxUser } from '@/lib/auth'

// ── Reuse dashboard color tokens ─────────────────────────────────────────────
const T = {
  teal:'#00c9b1',teal2:'rgba(0,201,177,.12)',amber:'#f5a623',amber2:'rgba(245,166,35,.12)',
  red:'#f03060',red2:'rgba(240,48,96,.12)',green:'#00de7a',green2:'rgba(0,222,122,.12)',
  blue:'#3d85e0',blue2:'rgba(61,133,224,.12)',purple:'#8b5cf6',purple2:'rgba(139,92,246,.12)',
  tx:'#dde6f5',tx2:'#7a90b5',tx3:'#364d6a',
  bg:'#080d18',s1:'#0d1526',s2:'#111d30',s3:'#16243a',b1:'#1c2d45',b2:'#243558',
}

// ── Reuse dashboard primitives ───────────────────────────────────────────────
function Kpi({label,value,sub,color=T.tx}:{label:string;value:string;sub?:string;color?:string}){
  return(
    <div className="rounded-xl border p-3" style={{background:T.s1,borderColor:T.b1}}>
      <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{color:T.tx3}}>{label}</div>
      <div className="font-mono text-[22px] font-bold leading-none mb-1" style={{color}}>{value}</div>
      {sub&&<div className="text-[10px]" style={{color:T.tx2}}>{sub}</div>}
    </div>
  )
}
function Sttl({children}:{children:React.ReactNode}){return <div className="text-[10px] font-semibold uppercase tracking-widest mt-5 mb-3 first:mt-0" style={{color:T.tx3}}>{children}</div>}
function Card({children,className='',noPad=false}:{children:React.ReactNode;className?:string;noPad?:boolean}){return <div className={`rounded-xl border ${noPad?'':'p-4'} ${className}`} style={{background:T.s1,borderColor:T.b1}}>{children}</div>}

// ── Role badge colors ────────────────────────────────────────────────────────
const ROLE_STYLE: Record<string,{bg:string;color:string;border:string;label:string}> = {
  service_a: { bg:T.blue2, color:T.blue, border:'rgba(61,133,224,.2)', label:'SERVICE A' },
  service_c: { bg:T.amber2, color:T.amber, border:'rgba(245,166,35,.2)', label:'SERVICE C' },
  service_d: { bg:T.purple2, color:T.purple, border:'rgba(139,92,246,.2)', label:'SERVICE D' },
}

// ── Types ────────────────────────────────────────────────────────────────────
interface DIDRecord {
  number: string
  country: string
  country_flag: string
  role: 'service_a' | 'service_c' | 'service_d'
  tenant_key: string
  ivr_key: string
  routing_target: string
  sip_trunk: string
  status: 'active' | 'pending' | 'unassigned'
}

interface CountryPool {
  country: string
  flag: string
  available: number
  carrier: string
  status: 'active' | 'pending' | 'not_purchased'
}

// ── Static demo data (will be replaced by Service B API calls) ───────────────
const DEMO_DIDS: DIDRecord[] = [
  { number: '+1-833-457-2629', country: 'US', country_flag: '🇺🇸', role: 'service_a', tenant_key: 'experience_shop', ivr_key: 'global_banking', routing_target: 'Inbound → LiveKit SIP', sip_trunk: 'ST_K3ijuYWAAYwk', status: 'active' },
  { number: '+1-833-555-0142', country: 'US', country_flag: '🇺🇸', role: 'service_c', tenant_key: 'experience_shop', ivr_key: 'global_banking', routing_target: 'Outbound caller ID', sip_trunk: 'N/A', status: 'active' },
  { number: '+1-833-555-0198', country: 'US', country_flag: '🇺🇸', role: 'service_d', tenant_key: 'experience_shop', ivr_key: 'global_banking', routing_target: 'FreeSWITCH :5060 / ext 9201', sip_trunk: 'Local', status: 'active' },
]

const DEMO_POOLS: CountryPool[] = [
  { country: 'United States', flag: '🇺🇸', available: 3, carrier: 'Vonage · Toll-free', status: 'active' },
  { country: 'India', flag: '🇮🇳', available: 0, carrier: 'Vonage · Applied Mar 9', status: 'pending' },
  { country: 'Singapore', flag: '🇸🇬', available: 0, carrier: 'Vonage · Available', status: 'not_purchased' },
]

// ═════════════════════════════════════════════════════════════════════════════
// TelephonyTab
// ═════════════════════════════════════════════════════════════════════════════

interface Props {
  user: CxUser | null
  onAction?: (action: string, body?: any) => Promise<void>
}

export default function TelephonyTab({ user }: Props) {
  const [dids, setDids] = useState<DIDRecord[]>(DEMO_DIDS)
  const [pools, setPools] = useState<CountryPool[]>(DEMO_POOLS)
  const [routingMode, setRoutingMode] = useState<'pre' | 'post'>('pre')

  // ── Provision form state ─────────────────────────────────────────────────
  const [provTenant, setProvTenant] = useState('experience_shop')
  const [provIvr, setProvIvr] = useState('global_banking')
  const [provCountry, setProvCountry] = useState('us')
  const [provPurpose, setProvPurpose] = useState('pre_uat')

  // ── Routing target state ─────────────────────────────────────────────────
  const [targetType, setTargetType] = useState('freeswitch')
  const [targetValue, setTargetValue] = useState('9201')
  const [postTargetType, setPostTargetType] = useState('sip_uri')
  const [postTargetValue, setPostTargetValue] = useState('sip:ivr@hdfc-pbx.banknet.in:5060')
  const [postAuth, setPostAuth] = useState('digest')
  const [postUsername, setPostUsername] = useState('')
  const [sipHeaders, setSipHeaders] = useState({
    from: '{{caller_number}}',
    session_id: '{{session_id}}',
    tenant_key: '{{tenant_key}}',
    ivr_key: '{{ivr_key}}',
    firewall_token: '',
    custom: '',
  })

  const isSuperAdmin = user?.role === 'super_admin'
  const assigned = dids.filter(d => d.status === 'active').length
  const unassigned = dids.filter(d => d.status === 'unassigned').length
  const totalMonthly = dids.filter(d => d.status === 'active').length * 4.99

  return (
    <div>
      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
        <Kpi label="Total DIDs" value={String(dids.length)} sub={`across ${pools.filter(p=>p.status==='active').length} country`} color={T.teal} />
        <Kpi label="Assigned" value={String(assigned)} sub="experience_shop" color={T.green} />
        <Kpi label="Unassigned" value={String(unassigned)} sub="in pool" color={T.tx3} />
        <Kpi label="Countries" value={String(pools.filter(p=>p.status==='active').length)} sub={`${pools.filter(p=>p.status==='pending').length} pending`} color={T.amber} />
        <Kpi label="Monthly Cost" value={`$${totalMonthly.toFixed(2)}`} sub={`${assigned} × $4.99/mo`} color={T.amber} />
      </div>

      {/* ── COUNTRY POOL ── */}
      <Sttl>Country Pool</Sttl>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {pools.map(p => (
          <div key={p.country} className="rounded-xl border p-3.5 text-center transition-all hover:border-[#243558]" style={{background:T.s1,borderColor:T.b1}}>
            <div className="text-[24px] mb-1">{p.flag}</div>
            <div className="text-[12px] font-bold mb-0.5">{p.country}</div>
            <div className="font-mono text-[18px] font-bold my-1.5" style={{color: p.status==='active'?T.green : p.status==='pending'?T.amber : T.tx3}}>{p.available}</div>
            <div className="text-[9px] mb-2" style={{color:T.tx3}}>{p.carrier}</div>
            {p.status === 'active' && <button className="px-3 py-1 rounded-md border text-[9px] font-semibold transition-all hover:border-[#3d85e0]" style={{background:'transparent',borderColor:T.b2,color:T.tx2,cursor:'pointer'}}>+ Buy More</button>}
            {p.status === 'pending' && <span className="text-[9px] font-semibold" style={{color:T.amber}}>Awaiting approval</span>}
            {p.status === 'not_purchased' && <button className="px-3 py-1 rounded-md text-[9px] font-semibold border-none cursor-pointer" style={{background:T.blue,color:'#fff'}}>Buy 3 DIDs</button>}
          </div>
        ))}
        <div className="rounded-xl border p-3.5 text-center" style={{background:'transparent',borderColor:T.b2,borderStyle:'dashed'}}>
          <div className="text-[24px] mb-1">🌍</div>
          <div className="text-[12px] font-bold mb-0.5" style={{color:T.tx3}}>Add Country</div>
          <button className="px-3 py-1 rounded-md border text-[9px] font-semibold mt-4 cursor-pointer" style={{background:'transparent',borderColor:T.b2,color:T.tx2}}>+ Add</button>
        </div>
      </div>

      {/* ── ACTIVE ASSIGNMENTS TABLE ── */}
      <Sttl>Active DID Assignments</Sttl>
      <Card noPad className="mb-4 overflow-hidden">
        <table className="w-full" style={{borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['Number','Country','Role','Tenant','IVR Flow','Routing Target','Status',''].map((h,i) => (
                <th key={i} className={`px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-left`} style={{color:T.tx3,borderBottom:`1px solid ${T.b1}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dids.map((d,i) => {
              const rs = ROLE_STYLE[d.role]
              return (
                <tr key={i} className="hover:bg-white/[.01]">
                  <td className="px-3 py-2.5 font-mono text-[12px] font-semibold" style={{color:T.teal,borderBottom:`1px solid ${T.b1}30`}}>{d.number}</td>
                  <td className="px-3 py-2.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}30`}}>{d.country_flag} {d.country}</td>
                  <td className="px-3 py-2.5" style={{borderBottom:`1px solid ${T.b1}30`}}>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold" style={{background:rs.bg,color:rs.color,border:`1px solid ${rs.border}`}}>{rs.label}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}30`}}>{d.tenant_key}</td>
                  <td className="px-3 py-2.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}30`}}>{d.ivr_key}</td>
                  <td className="px-3 py-2.5 text-[10px]" style={{color:T.tx2,borderBottom:`1px solid ${T.b1}30`}}>{d.routing_target}</td>
                  <td className="px-3 py-2.5" style={{borderBottom:`1px solid ${T.b1}30`}}>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold" style={{
                      background: d.status==='active'?T.green2:d.status==='pending'?T.amber2:'rgba(122,144,181,.06)',
                      color: d.status==='active'?T.green:d.status==='pending'?T.amber:T.tx3,
                      border: `1px solid ${d.status==='active'?'rgba(0,222,122,.2)':d.status==='pending'?'rgba(245,166,35,.2)':'rgba(122,144,181,.12)'}`,
                    }}>
                      {d.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5" style={{borderBottom:`1px solid ${T.b1}30`}}>
                    <button className="px-2 py-1 rounded border text-[9px] font-semibold cursor-pointer" style={{background:'transparent',borderColor:T.b2,color:T.tx2}}>Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* ── PROVISION NEW FLOW ── */}
      <Sttl>Provision New Flow</Sttl>
      <Card className="mb-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold mb-3" style={{color:T.tx2}}>Assign DIDs to Tenant + Flow</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>Tenant</label>
            <select value={provTenant} onChange={e=>setProvTenant(e.target.value)} className="px-2.5 py-2 rounded-lg border text-[11px] outline-none" style={{background:T.s2,borderColor:T.b1,color:T.tx}}>
              <option value="experience_shop">experience_shop (Demo)</option>
              <option value="hdfc">hdfc (South Indian Bank)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>IVR Flow</label>
            <select value={provIvr} onChange={e=>setProvIvr(e.target.value)} className="px-2.5 py-2 rounded-lg border text-[11px] outline-none" style={{background:T.s2,borderColor:T.b1,color:T.tx}}>
              <option value="global_banking">global_banking (1,800)</option>
              <option value="global_insurance">global_insurance (2,301)</option>
              <option value="global_healthcare">global_healthcare</option>
              <option value="global_telecom">global_telecom</option>
              <option value="global_ecommerce">global_ecommerce</option>
              <option value="global_hospitality">global_hospitality</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>Country</label>
            <select value={provCountry} onChange={e=>setProvCountry(e.target.value)} className="px-2.5 py-2 rounded-lg border text-[11px] outline-none" style={{background:T.s2,borderColor:T.b1,color:T.tx}}>
              <option value="us">🇺🇸 US (3 available)</option>
              <option value="in" disabled>🇮🇳 India (pending)</option>
              <option value="sg" disabled>🇸🇬 Singapore (0)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>Purpose</label>
            <select value={provPurpose} onChange={e=>setProvPurpose(e.target.value)} className="px-2.5 py-2 rounded-lg border text-[11px] outline-none" style={{background:T.s2,borderColor:T.b1,color:T.tx}}>
              <option value="pre_uat">Pre-UAT</option>
              <option value="uat">UAT</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>
        <button className="px-4 py-2 rounded-lg text-[11px] font-bold border-none cursor-pointer" style={{background:T.teal,color:'#000'}}>
          Auto-Assign 3 DIDs from Pool →
        </button>
      </Card>

      {/* ── OUTBOUND ROUTING TARGET ── */}
      <Sttl>Service C → Outbound Routing Target</Sttl>
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-semibold" style={{color:T.tx2}}>Where does Service C dial when it needs to navigate the IVR?</div>
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
            <button onClick={()=>setRoutingMode('pre')} className="px-3 py-1.5 rounded-md text-[10px] font-semibold border-none cursor-pointer transition-all"
              style={{background:routingMode==='pre'?T.purple:'transparent',color:routingMode==='pre'?'#fff':T.tx3}}>
              🏛️ Pre-UAT
            </button>
            <button onClick={()=>setRoutingMode('post')} className="px-3 py-1.5 rounded-md text-[10px] font-semibold border-none cursor-pointer transition-all"
              style={{background:routingMode==='post'?T.green:'transparent',color:routingMode==='post'?'#000':T.tx3}}>
              🏦 Post-UAT
            </button>
          </div>
        </div>

        {/* ── PRE-UAT ── */}
        {routingMode === 'pre' && (
          <>
            <div className="rounded-xl p-4 mb-3" style={{background:T.purple2,border:`1px solid rgba(139,92,246,.15)`}}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-[16px]">🏛️</span>
                <div className="flex-1">
                  <div className="text-[12px] font-bold">Service D — Internal IVR Simulator</div>
                  <div className="text-[10px]" style={{color:T.tx3}}>Customer has not shared SIP or call forwarding. We simulate their IVR.</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold" style={{background:T.green2,color:T.green,border:'1px solid rgba(0,222,122,.2)'}}>ACTIVE</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>Target Type</label>
                  <select value={targetType} onChange={e=>setTargetType(e.target.value)} className="px-2.5 py-2 rounded-lg border text-[11px] outline-none" style={{background:T.s2,borderColor:T.b1,color:T.purple}}>
                    <option value="freeswitch">FreeSWITCH Extension (local)</option>
                    <option value="did">DID Number (Service D on PSTN)</option>
                    <option value="sip_uri">SIP URI (Service D remote)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>
                    {targetType==='freeswitch'?'FreeSWITCH Extension':targetType==='did'?'DID Number':'SIP URI'}
                  </label>
                  <input value={targetValue} onChange={e=>setTargetValue(e.target.value)} className="px-2.5 py-2 rounded-lg border text-[11px] outline-none font-mono" style={{background:T.s2,borderColor:T.b1,color:T.purple}} />
                </div>
              </div>

              {/* SIP Headers */}
              <div className="mt-3 p-3 rounded-lg" style={{background:T.bg,border:`1px solid ${T.b1}`}}>
                <div className="text-[9px] font-bold uppercase tracking-wide mb-2" style={{color:T.tx3}}>SIP Headers (C → D)</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {k:'from',l:'From (Caller ID)'},
                    {k:'session_id',l:'X-Session-ID'},
                    {k:'tenant_key',l:'X-Tenant-Key'},
                    {k:'ivr_key',l:'X-IVR-Key'},
                  ].map(h=>(
                    <div key={h.k} className="flex flex-col gap-0.5">
                      <label className="text-[8px] font-semibold uppercase" style={{color:T.tx3}}>{h.l}</label>
                      <input value={(sipHeaders as any)[h.k]} onChange={e=>setSipHeaders(p=>({...p,[h.k]:e.target.value}))} className="px-2 py-1.5 rounded border text-[10px] outline-none font-mono" style={{background:T.s2,borderColor:T.b1,color:T.amber}} />
                    </div>
                  ))}
                </div>
                <div className="text-[9px] mt-2" style={{color:T.tx3}}>
                  <span style={{color:T.amber}}>{'{{variables}}'}</span> are auto-replaced at runtime from session metadata
                </div>
              </div>
            </div>

            {/* Flow diagram */}
            <div className="p-3 rounded-lg" style={{background:T.s2,border:`1px solid ${T.b1}`}}>
              <div className="text-[9px] font-bold uppercase tracking-wide mb-1.5" style={{color:T.tx3}}>Pre-UAT Call Flow</div>
              <div className="font-mono text-[10px] leading-[1.7]" style={{color:T.tx3}}>
                <span style={{color:T.tx}}>Caller</span> → <span style={{color:T.teal}}>+1-833-457-2629</span> → LiveKit SIP → Service B → <span style={{color:T.blue}}>Service A</span><br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:T.blue}}>A</span> detects intent → <span style={{color:T.amber}}>Service C</span> (from +1-833-555-0142)<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:T.amber}}>C</span> dials → <span style={{color:T.purple}}>ext {targetValue}</span> → FreeSWITCH → <span style={{color:T.purple}}>Service D</span> (IVR sim)<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:T.purple}}>D</span> responds → <span style={{color:T.amber}}>C</span> captures → <span style={{color:T.blue}}>A</span> speaks to caller
              </div>
            </div>
          </>
        )}

        {/* ── POST-UAT ── */}
        {routingMode === 'post' && (
          <>
            <div className="rounded-xl p-4 mb-3" style={{background:T.green2,border:`1px solid rgba(0,222,122,.15)`}}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-[16px]">🏦</span>
                <div className="flex-1">
                  <div className="text-[12px] font-bold">Customer&apos;s Real IVR</div>
                  <div className="text-[10px]" style={{color:T.tx3}}>Customer shared SIP trunk or call forwarding. Service C calls the real IVR.</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold" style={{background:T.green2,color:T.green,border:'1px solid rgba(0,222,122,.2)'}}>PRODUCTION</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>Target Type</label>
                  <select value={postTargetType} onChange={e=>setPostTargetType(e.target.value)} className="px-2.5 py-2 rounded-lg border text-[11px] outline-none" style={{background:T.s2,borderColor:T.b1,color:T.green}}>
                    <option value="pstn">PSTN Number (Vonage outbound)</option>
                    <option value="sip_uri">SIP URI (customer PBX)</option>
                    <option value="sip_trunk">SIP Trunk (dedicated)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>Customer IVR Number / SIP URI</label>
                  <input value={postTargetValue} onChange={e=>setPostTargetValue(e.target.value)} className="px-2.5 py-2 rounded-lg border text-[10px] outline-none font-mono" style={{background:T.s2,borderColor:T.b1,color:T.green}} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>Authentication</label>
                  <select value={postAuth} onChange={e=>setPostAuth(e.target.value)} className="px-2.5 py-2 rounded-lg border text-[11px] outline-none" style={{background:T.s2,borderColor:T.b1,color:T.tx}}>
                    <option value="none">None (IP whitelist)</option>
                    <option value="digest">Digest Auth</option>
                    <option value="tls">TLS Mutual Auth</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold uppercase tracking-wide" style={{color:T.tx3}}>SIP Username</label>
                  <input type="password" value={postUsername} onChange={e=>setPostUsername(e.target.value)} placeholder="converse_hdfc_svc" className="px-2.5 py-2 rounded-lg border text-[11px] outline-none font-mono" style={{background:T.s2,borderColor:T.b1,color:T.tx}} />
                </div>
              </div>

              {/* SIP Headers (post-UAT) */}
              <div className="mt-3 p-3 rounded-lg" style={{background:T.bg,border:`1px solid ${T.b1}`}}>
                <div className="text-[9px] font-bold uppercase tracking-wide mb-2" style={{color:T.tx3}}>SIP Headers (C → Customer IVR)</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    {k:'from',l:'From (Caller ID)'},
                    {k:'session_id',l:'X-Session-ID'},
                    {k:'tenant_key',l:'X-Tenant-Key'},
                    {k:'ivr_key',l:'X-IVR-Key'},
                    {k:'firewall_token',l:'X-Firewall-Token'},
                    {k:'custom',l:'Custom Header'},
                  ].map(h=>(
                    <div key={h.k} className="flex flex-col gap-0.5">
                      <label className="text-[8px] font-semibold uppercase" style={{color:T.tx3}}>{h.l}</label>
                      <input
                        type={h.k==='firewall_token'?'password':'text'}
                        value={(sipHeaders as any)[h.k]}
                        onChange={e=>setSipHeaders(p=>({...p,[h.k]:e.target.value}))}
                        placeholder={h.k==='custom'?'X-Custom: value':''}
                        className="px-2 py-1.5 rounded border text-[10px] outline-none font-mono"
                        style={{background:T.s2,borderColor:T.b1,color:T.green}} />
                    </div>
                  ))}
                </div>
                <div className="text-[9px] mt-2" style={{color:T.tx3}}>
                  <span style={{color:T.green}}>{'{{variables}}'}</span> auto-replaced &nbsp;|&nbsp; Static values sent as-is &nbsp;|&nbsp; Bank firewall validates these
                </div>
              </div>
            </div>

            {/* Flow diagram (post-UAT) */}
            <div className="p-3 rounded-lg mb-2" style={{background:T.s2,border:`1px solid rgba(0,222,122,.15)`}}>
              <div className="text-[9px] font-bold uppercase tracking-wide mb-1.5" style={{color:T.green}}>Post-UAT Call Flow</div>
              <div className="font-mono text-[10px] leading-[1.7]" style={{color:T.tx3}}>
                <span style={{color:T.tx}}>Caller</span> → <span style={{color:T.teal}}>+1-833-457-2629</span> → LiveKit SIP → Service B → <span style={{color:T.blue}}>Service A</span><br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:T.blue}}>A</span> detects intent → <span style={{color:T.amber}}>Service C</span> (from +1-833-555-0142)<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:T.amber}}>C</span> dials → <span style={{color:T.green}}>{postTargetValue}</span><br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:T.green}}>Bank IVR</span> answers → real menu → DTMF → real data<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:T.amber}}>C</span> captures → <span style={{color:T.blue}}>A</span> speaks to caller
              </div>
            </div>

            <div className="px-3 py-2 rounded-lg" style={{background:T.red2,border:`1px solid rgba(240,48,96,.12)`}}>
              <span className="text-[10px] font-semibold" style={{color:T.red}}>⚠️ Production Mode</span>
              <span className="text-[10px] ml-2" style={{color:T.tx3}}>Real outbound calls. Carrier minutes billed. Ensure customer approved call forwarding + firewall.</span>
            </div>
          </>
        )}

        <div className="flex gap-2 mt-4">
          <button className="px-4 py-2 rounded-lg text-[11px] font-bold border-none cursor-pointer" style={{background:T.teal,color:'#000'}}>Save & Provision</button>
          <button className="px-4 py-2 rounded-lg text-[11px] font-semibold cursor-pointer" style={{background:'transparent',border:`1px solid ${T.b2}`,color:T.tx2}}>Test Connection</button>
        </div>
      </Card>

      {/* ── SIP TRUNKS ── */}
      <Sttl>SIP Trunk Config</Sttl>
      <Card noPad className="mb-4 overflow-hidden">
        <table className="w-full" style={{borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['Trunk','Purpose','Endpoint','Carrier','Status'].map((h,i) => (
                <th key={i} className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-left" style={{color:T.tx3,borderBottom:`1px solid ${T.b1}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2.5 font-mono text-[10px] font-semibold" style={{color:T.blue,borderBottom:`1px solid ${T.b1}30`}}>ST_K3ijuYWAAYwk</td>
              <td className="px-3 py-2.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}30`}}>Inbound (Service A)</td>
              <td className="px-3 py-2.5 text-[10px]" style={{color:T.tx2,borderBottom:`1px solid ${T.b1}30`}}>LiveKit SIP → Service B webhook</td>
              <td className="px-3 py-2.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}30`}}>Vonage</td>
              <td className="px-3 py-2.5" style={{borderBottom:`1px solid ${T.b1}30`}}>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold" style={{background:T.green2,color:T.green,border:'1px solid rgba(0,222,122,.2)'}}>ACTIVE</span>
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2.5 font-mono text-[10px] font-semibold" style={{color:T.purple,borderBottom:`1px solid ${T.b1}30`}}>FreeSWITCH :5060</td>
              <td className="px-3 py-2.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}30`}}>IVR Bridge (Service D)</td>
              <td className="px-3 py-2.5 text-[10px]" style={{color:T.tx2,borderBottom:`1px solid ${T.b1}30`}}>ext 9201 / ext 9202</td>
              <td className="px-3 py-2.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}30`}}>Local</td>
              <td className="px-3 py-2.5" style={{borderBottom:`1px solid ${T.b1}30`}}>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold" style={{background:T.green2,color:T.green,border:'1px solid rgba(0,222,122,.2)'}}>ACTIVE</span>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* ── CARRIER ADAPTERS ── */}
      <Sttl>Carrier Adapters</Sttl>
      <Card noPad className="overflow-hidden">
        <table className="w-full" style={{borderCollapse:'collapse'}}>
          <thead>
            <tr>
              {['Carrier','Countries','API','Status',''].map((h,i) => (
                <th key={i} className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide text-left" style={{color:T.tx3,borderBottom:`1px solid ${T.b1}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2.5 text-[11px] font-semibold" style={{borderBottom:`1px solid ${T.b1}30`}}>Vonage</td>
              <td className="px-3 py-2.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}30`}}>US, IN (pending), SG, UAE</td>
              <td className="px-3 py-2.5 font-mono text-[10px]" style={{borderBottom:`1px solid ${T.b1}30`}}>REST v2</td>
              <td className="px-3 py-2.5" style={{borderBottom:`1px solid ${T.b1}30`}}>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold" style={{background:T.green2,color:T.green,border:'1px solid rgba(0,222,122,.2)'}}>CONNECTED</span>
              </td>
              <td className="px-3 py-2.5" style={{borderBottom:`1px solid ${T.b1}30`}}>
                <button className="px-2 py-1 rounded border text-[9px] font-semibold cursor-pointer" style={{background:'transparent',borderColor:T.b2,color:T.tx2}}>Config</button>
              </td>
            </tr>
            {[
              {name:'Airtel (India)',countries:'IN',api:'Manual SIP'},
              {name:'Twilio',countries:'Global',api:'REST'},
            ].map(c=>(
              <tr key={c.name} style={{opacity:.4}}>
                <td className="px-3 py-2.5 text-[11px] font-semibold" style={{borderBottom:`1px solid ${T.b1}30`}}>{c.name}</td>
                <td className="px-3 py-2.5 text-[11px]" style={{borderBottom:`1px solid ${T.b1}30`}}>{c.countries}</td>
                <td className="px-3 py-2.5 text-[10px]" style={{color:T.tx3,borderBottom:`1px solid ${T.b1}30`}}>{c.api}</td>
                <td className="px-3 py-2.5" style={{borderBottom:`1px solid ${T.b1}30`}}>
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold" style={{background:'rgba(122,144,181,.06)',color:T.tx3,border:'1px solid rgba(122,144,181,.12)'}}>NOT SET</span>
                </td>
                <td className="px-3 py-2.5" style={{borderBottom:`1px solid ${T.b1}30`}}>
                  <button className="px-2 py-1 rounded text-[9px] font-semibold border-none cursor-pointer" style={{background:T.blue,color:'#fff'}}>+ Add</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

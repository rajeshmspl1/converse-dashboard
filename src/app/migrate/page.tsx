'use client'
import { getEnv } from '@/lib/env';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MigrationLeads from '@/components/dashboard/MigrationLeads';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import { clearAuth } from '@/lib/auth';
import type { Currency } from '@/types';

/* ────────────────────────────────────────────────────────────
   /migrate page — R100 flow + v3 post-completion sidebar layout

   Pre-completion (R100 unchanged):
     Card A: IVR Number   → POST /migrate/ivr-number  (tier 4, ~24 hrs)
     Card B: Upload Files  → POST /migrate/upload       (tier 3, ~4 min)
     Processing screen with step polling
     IVR submitted confirmation

   Post-completion (v3 new):
     5-stage collapsible sidebar + Start Call hero + mode cards
   ──────────────────────────────────────────────────────────── */

const SERVICE_B_URL = typeof window !== "undefined" ? getEnv().serviceB : "http://localhost:9000";

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cx_access_token');
}
function getUser(): any {
  if (typeof window === 'undefined') return null;
  try { const raw = localStorage.getItem('cx_user'); if (!raw) return null; return JSON.parse(raw); } catch { return null; }
}
async function fetchB(path: string, opts: RequestInit = {}): Promise<any> {
  const token = getAccessToken();
  const headers: any = { ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${SERVICE_B_URL}${path}`, { ...opts, headers });
  if (!res.ok) { const text = await res.text(); throw new Error(`${res.status}: ${text}`); }
  return res.json();
}

const colors = {
  bg:'#080D18', s1:'#0D1526', s2:'#111D30', s3:'#16243A',
  b1:'#1C2D45', b2:'#243558', tx:'#DDE6F5', tx2:'#7A90B5', tx3:'#4A5F80',
  blue:'#3370E8', teal:'#00C9B1', amber:'#F5A623', red:'#F03060', green:'#00DE7A', purple:'#8B5CF6',
};

const ALLOWED_EXTENSIONS = ['.vxml','.xml','.grxml','.docx','.pdf','.json','.yaml','.csv','.xlsx'];

const STAGES = [
  { key:'explore', label:'Explore', icon:'✓', subs:[{label:'Experience shop demo',done:true}] },
  { key:'try', label:'Try', icon:'2', subs:[{label:'Pre-firewall',active:true},{label:'Post-firewall'}] },
  { key:'test', label:'Test', icon:'3', subs:[{label:'Post-UAT environment'}], contactTitle:'Test with your production environment', contactDesc:'Our team sets up your post-UAT environment and validates every intent end-to-end.' },
  { key:'pilot', label:'Pilot', icon:'4', subs:[{label:'Production pilot'}], contactTitle:'Pilot with real traffic', contactDesc:'Limited live traffic with full monitoring, analytics, and AI containment tracking.' },
  { key:'launch', label:'Launch', icon:'5', subs:[{label:'Production live'}], contactTitle:'Go live in production', contactDesc:'Full traffic, SLA tracking, CSAT monitoring, per-intent billing — all active.' },
];
const MODES = [
  { key:'premium', label:'Premium', color:colors.blue, price:'₹3.53', unit:'/ intent', desc:'Top-tier AI for every caller.' },
  { key:'complexity', label:'Complexity', color:colors.purple, price:'₹1.15', unit:'/ intent avg', desc:'AI tier matches intent difficulty.' },
  { key:'sales', label:'Sales', color:colors.amber, price:'₹4.48', unit:'/ intent', desc:'CRM-driven upsell detection.' },
  { key:'hybrid', label:'Hybrid', color:colors.red, price:'₹2.80', unit:'/ intent avg', desc:'Best tier per call, auto.' },
];
const JOURNEYS = [
  {label:'J1 Per-Intent', routing_mode:'', desc:'Standard voice call — pay per resolved intent'},
  {label:'J2 Value Routing', routing_mode:'premium', desc:'CRM tier drives experience — Gold/Silver/Bronze'},
  {label:'J3 Escalation', routing_mode:'complexity', desc:'Frustrated caller? AI upgrades experience mid-call'},
  {label:'J4 Sales', routing_mode:'sales', desc:'AI detects upsell moments — commission per conversion'},
];


export default function MigratePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currency, setCurrency] = useState<Currency>('inr');
  const handleSignOut = () => { clearAuth(); window.location.href = '/'; };

  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [view, setView] = useState<'cards'|'processing'|'ivr_submitted'|'complete'>('cards');

  const [ivrPhone, setIvrPhone] = useState('');
  const [ivrSubmitting, setIvrSubmitting] = useState(false);
  const [ivrSuccess, setIvrSuccess] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [optionalPhone, setOptionalPhone] = useState('');
  const [ivrName, setIvrName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const pollRef = useRef<NodeJS.Timeout|null>(null);

  // Multi-IVR state
  const [completedIvrs, setCompletedIvrs] = useState<any[]>([]);
  const [selectedIvrTenant, setSelectedIvrTenant] = useState<string>('');

  // Journey selection (maps to homepage DEMO_SCENARIOS)
  const [selectedJourney, setSelectedJourney] = useState(0);

  // IVR source toggle: 'my' = uploaded tenant, 'shop' = experience_shop
  const [ivrSource, setIvrSource] = useState<'my'|'shop'>('my');

  // v3 sidebar state
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set([1]));
  const [activeMode, setActiveMode] = useState('premium');
  const [selectedStage, setSelectedStage] = useState(1); // 0=explore, 1=try, 2=test, 3=pilot, 4=launch
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (u && getAccessToken()) { setUser(u); setIsLoggedIn(true); checkStatus(); }
    else { window.location.href = '/?action=migrate'; }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const data = await fetchB('/migrate/status');
      const ivrs = data.completed_ivrs || [];
      setCompletedIvrs(ivrs);
      if (ivrs.length > 0 && !selectedIvrTenant) {
        setSelectedIvrTenant(ivrs[0].tenant_key);
      }
      if (data.status && data.status !== 'none') {
        setMigrationStatus(data);
        if (data.status === 'complete') setView('complete');
        else if (data.status === 'lead' && data.path === 'ivr_number') setView('ivr_submitted');
        else if (['processing','provisioning','compiling','publishing'].includes(data.status)) { setView('processing'); startPolling(); }
      } else if (ivrs.length > 0) {
        setView('complete');
      }
    } catch {}
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchB('/migrate/status');
        setMigrationStatus(data);
        setCompletedIvrs(data.completed_ivrs || []);
        if (data.status === 'complete') {
          if (pollRef.current) clearInterval(pollRef.current);
          if (data.tenant_key) setSelectedIvrTenant(data.tenant_key);
          setView('complete');
        }
        else if (data.status === 'failed') { if (pollRef.current) clearInterval(pollRef.current); setError(data.error_detail || 'Something went wrong.'); setView('cards'); }
      } catch {}
    }, 3000);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleIvrSubmit = async () => {
    if (!ivrPhone.trim()) return;
    setIvrSubmitting(true); setError('');
    try { const data = await fetchB('/migrate/ivr-number', { method:'POST', body:JSON.stringify({ivr_phone:ivrPhone.trim()}) }); setIvrSuccess(true); setMigrationStatus(data); setView('ivr_submitted'); }
    catch (e:any) { setError(e.message||'Failed to submit IVR number'); }
    finally { setIvrSubmitting(false); }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('files', f));
      if (optionalPhone.trim()) formData.append('ivr_phone', optionalPhone.trim());
      if (ivrName.trim()) formData.append('ivr_name', ivrName.trim());
      const data = await fetchB('/migrate/upload', { method:'POST', body:formData });
      setMigrationStatus(data); setView('processing'); startPolling();
    } catch (e:any) { setError(e.message||'Failed to upload files'); }
    finally { setUploading(false); }
  };

  const handleDrop = (e:React.DragEvent) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); };
  const addFiles = (newFiles:File[]) => {
    const valid = newFiles.filter(f => { const ext = '.'+(f.name.split('.').pop()||'').toLowerCase(); return ALLOWED_EXTENSIONS.includes(ext); });
    if (valid.length < newFiles.length) { setError(`Some files skipped. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`); setTimeout(()=>setError(''),4000); }
    setSelectedFiles(prev => [...prev,...valid].slice(0,10));
  };
  const removeFile = (idx:number) => setSelectedFiles(prev => prev.filter((_,i)=>i!==idx));
  const formatBytes = (bytes:number) => { if(bytes<1024) return `${bytes} B`; if(bytes<1024*1024) return `${(bytes/1024).toFixed(1)} KB`; return `${(bytes/(1024*1024)).toFixed(1)} MB`; };

  const toggleStage = (idx:number) => {
    setSelectedStage(idx);
    setExpandedStages(prev => { const n=new Set(prev); if(n.has(idx)) n.delete(idx); else n.add(idx); return n; });
    setContactSubmitted(false); // reset form on stage switch
  };
  const stageStatus = (idx:number):'completed'|'active'|'locked' => { if(idx===0) return 'completed'; if(idx===1) return 'active'; return 'locked'; };
  const currentMode = MODES.find(m=>m.key===activeMode)||MODES[0];
  const selectedStageData = STAGES[selectedStage];

  const handleReset = async () => {
    if (!confirm('Reset this migration? You can upload again after.')) return;
    try {
      await fetchB('/migrate/reset', { method: 'POST' });
      setMigrationStatus(null); setView('cards'); setSelectedFiles([]); setError('');
      if (pollRef.current) clearInterval(pollRef.current);
    } catch (e: any) { setError(e.message || 'Reset failed'); }
  };


  // ══════════════════════════════════════════════════════════
  // SUPER ADMIN → Leads table (R100 unchanged)
  // ══════════════════════════════════════════════════════════
  if (user && user.role === 'super_admin') {
    return (
      <div style={{minHeight:'100vh',background:colors.bg,color:colors.tx}}>
        <UnifiedHeader variant="journey" user={user} onSignIn={()=>router.push('/login')} onSignOut={handleSignOut} onLogoClick={()=>router.push('/')} currency={currency} onCurrencyChange={setCurrency} />
        <div style={{maxWidth:1200,margin:'0 auto',padding:'48px 24px 80px'}}>
          <div style={{marginBottom:28}}>
            <h1 style={{fontSize:28,fontWeight:800,letterSpacing:-0.5,marginBottom:6,fontFamily:"'DM Sans','Inter',sans-serif"}}>IVR Migration Leads</h1>
            <p style={{fontSize:14,color:colors.tx2}}>Incoming migration requests from tenants — IVR numbers and file uploads.</p>
          </div>
          <MigrationLeads />
        </div>
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════
  // TENANT: complete → v3 sidebar layout
  // ══════════════════════════════════════════════════════════
  if (view === 'complete') {
    return (
      <div style={{height:'100vh',display:'flex',flexDirection:'column',background:colors.bg,color:colors.tx,overflow:'hidden'}}>
        <style>{`
          @keyframes mic-pulse { 0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(0,201,177,.15)} 50%{transform:scale(1.04);box-shadow:0 0 18px rgba(0,201,177,.1)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
          .f1{animation:fadeUp .3s ease .05s both} .f2{animation:fadeUp .3s ease .1s both} .f3{animation:fadeUp .3s ease .15s both} .f4{animation:fadeUp .3s ease .2s both} .f5{animation:fadeUp .3s ease .25s both}
        `}</style>
        <UnifiedHeader variant="journey" user={user} onSignIn={()=>router.push('/login')} onSignOut={handleSignOut} onLogoClick={()=>router.push('/')} currency={currency} onCurrencyChange={setCurrency} />
        <div style={{display:'flex',flex:1,overflow:'hidden'}}>

          {/* SIDEBAR */}
          <aside style={{width:200,flexShrink:0,background:colors.s1,borderRight:`1px solid ${colors.b1}`,display:'flex',flexDirection:'column',padding:'16px 0',overflowY:'auto'}}>
            <div style={{fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:1.2,color:colors.tx3,padding:'0 14px',marginBottom:10}}>Journey</div>
            <div style={{display:'flex',flexDirection:'column',padding:'0 8px'}}>
              {STAGES.map((stage,idx) => {
                const status = stageStatus(idx); const isExp = expandedStages.has(idx); const isSel = selectedStage === idx;
                return (<React.Fragment key={stage.key}>
                  <div onClick={()=>toggleStage(idx)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 8px',borderRadius:7,cursor:'pointer',transition:'all .15s',background:isSel?'rgba(0,201,177,.06)':'transparent',opacity:status==='locked'?.7:1,position:'relative',outline:isSel&&status==='locked'?'1px solid rgba(0,201,177,.2)':'none',outlineOffset:'-1px'}}>
                    {idx<STAGES.length-1 && <div style={{position:'absolute',left:20,top:36,width:2,height:'calc(100% - 22px)',background:status==='completed'?colors.teal:status==='active'?`linear-gradient(to bottom,${colors.teal} 40%,${colors.b1})`:colors.b1,zIndex:0}} />}
                    <div style={{width:26,height:26,borderRadius:7,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,position:'relative',zIndex:2,...(status==='completed'?{background:'rgba(0,201,177,.12)',border:'1.5px solid rgba(0,201,177,.3)',color:colors.teal}:status==='active'||isSel?{background:'rgba(0,201,177,.15)',border:`1.5px solid ${colors.teal}`,boxShadow:'0 0 12px rgba(0,201,177,.2)',color:colors.teal}:{background:colors.s2,border:`1.5px solid ${colors.b2}`,color:colors.tx2})}}>{status==='completed'?'✓':stage.icon}</div>
                    <span style={{fontSize:12,fontWeight:700,flex:1,color:isSel?colors.teal:status==='active'?colors.teal:status==='locked'?colors.tx2:colors.tx}}>{stage.label}</span>
                    <span style={{fontSize:9,color:colors.tx3,flexShrink:0,transition:'transform .2s',transform:isExp?'rotate(90deg)':'rotate(0deg)'}}>›</span>
                  </div>
                  <div style={{maxHeight:isExp?200:0,overflow:'hidden',transition:'max-height .25s ease',paddingLeft:44}}>
                    {stage.subs.map((sub:any,si:number)=>(<div key={si} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:5,background:sub.active?'rgba(0,201,177,.05)':'transparent'}}>
                      <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:sub.done?colors.teal:sub.active?colors.teal:colors.tx3,boxShadow:sub.active?'0 0 6px rgba(0,201,177,.4)':'none'}} />
                      <span style={{fontSize:10,color:sub.active?colors.teal:sub.done?colors.teal:colors.tx2,fontWeight:sub.active?600:400}}>{sub.label}</span>
                    </div>))}
                  </div>
                </React.Fragment>);
              })}
            </div>
            <div style={{margin:'auto 8px 0',padding:12,background:colors.s2,border:`1px solid ${colors.b1}`,borderRadius:8}}>
              <div style={{fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:colors.tx3,marginBottom:8}}>Infrastructure</div>
              {[{label:'Tier',value:'3 · Ded. DB',color:colors.purple},{label:'Compute',value:'Shared VM',color:colors.tx},{label:'Region',value:'IN Central',color:colors.amber}].map((row,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',borderBottom:i<2?'1px solid rgba(28,45,69,.3)':'none'}}>
                  <span style={{fontSize:9,color:colors.tx3}}>{row.label}</span>
                  <span style={{fontSize:9,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:row.color}}>{row.value}</span>
                </div>
              ))}
            </div>
            <button onClick={handleReset} style={{margin:'8px 8px 0',padding:'8px 0',borderRadius:6,border:`1px solid ${colors.b1}`,background:'transparent',color:colors.tx3,fontSize:10,fontWeight:600,cursor:'pointer',transition:'all .15s',width:'calc(100% - 16px)'}}>↩ Reset Migration</button>
          </aside>

          {/* MAIN */}
          <main style={{flex:1,overflowY:'auto'}}>
            <div style={{maxWidth:900,width:'100%',margin:'0 auto',padding:'22px 32px 60px'}}>

              {/* ── EXPLORE (completed) ── */}
              {selectedStage === 0 && (
                <div className="f1">
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                    <div style={{width:30,height:30,borderRadius:7,background:'rgba(0,201,177,.1)',border:'1px solid rgba(0,201,177,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>✅</div>
                    <div><h2 style={{fontSize:17,fontWeight:800,letterSpacing:-0.3}}>Explore — Completed</h2><p style={{fontSize:11,color:colors.tx2,marginTop:1}}>You've experienced the AI demo. Move to Try to test with your own IVR.</p></div>
                  </div>
                  <div style={{background:colors.s1,border:`1px solid ${colors.b1}`,borderRadius:12,padding:24,textAlign:'center'}}>
                    <div style={{fontSize:32,marginBottom:8}}>🎉</div>
                    <h3 style={{fontSize:16,fontWeight:700,color:colors.teal,marginBottom:4}}>Stage complete</h3>
                    <p style={{fontSize:12,color:colors.tx2}}>Click <strong style={{color:colors.teal}}>Try</strong> in the sidebar to test with your own IVR flow.</p>
                  </div>
                </div>
              )}

              {/* ── TRY (active — Start Call hero) ── */}
              {selectedStage === 1 && (<>
                <div className="f1" style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <div style={{width:30,height:30,borderRadius:7,background:'rgba(0,201,177,.1)',border:'1px solid rgba(0,201,177,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>🔬</div>
                  <div><h2 style={{fontSize:17,fontWeight:800,letterSpacing:-0.3}}>Try — Test with your IVR</h2><p style={{fontSize:11,color:colors.tx2,marginTop:1}}>Pre-UAT · Pre-firewall mode · Your flow is compiled and live.</p></div>
                </div>

                {/* ── My IVR / Experience Shop toggle ── */}
                <div className="f1" style={{display:'flex',alignItems:'center',gap:0,marginBottom:14,borderRadius:9,overflow:'hidden',border:`1px solid ${colors.b1}`}}>
                  <button onClick={()=>setIvrSource('my')} style={{flex:1,padding:'10px 16px',fontSize:12,fontWeight:700,cursor:'pointer',border:'none',transition:'all .15s',background:ivrSource==='my'?'rgba(0,201,177,.12)':colors.s1,color:ivrSource==='my'?colors.teal:colors.tx3,borderRight:`1px solid ${colors.b1}`}}>
                    My IVR {selectedIvrTenant && ivrSource==='my' ? `· ${selectedIvrTenant.replace(/_/g,' ')}` : ''}
                  </button>
                  <button onClick={()=>setIvrSource('shop')} style={{flex:1,padding:'10px 16px',fontSize:12,fontWeight:700,cursor:'pointer',border:'none',transition:'all .15s',background:ivrSource==='shop'?'rgba(51,112,232,.12)':colors.s1,color:ivrSource==='shop'?colors.blue:colors.tx3}}>
                    Experience shop
                  </button>
                </div>

                {/* ── IVR picker (only when My IVR + multiple uploads) ── */}
                {ivrSource==='my' && completedIvrs.length > 1 && (
                  <div className="f1" style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,padding:'10px 14px',background:colors.s1,border:`1px solid ${colors.b1}`,borderRadius:9}}>
                    <span style={{fontSize:10,fontWeight:700,color:colors.tx3,textTransform:'uppercase',letterSpacing:0.5,flexShrink:0}}>IVR</span>
                    <select value={selectedIvrTenant} onChange={e=>setSelectedIvrTenant(e.target.value)} style={{flex:1,padding:'6px 10px',borderRadius:6,background:colors.s2,border:`1px solid ${colors.b1}`,color:colors.tx,fontSize:12,fontWeight:600,fontFamily:"'DM Sans','Inter',sans-serif",outline:'none',cursor:'pointer',appearance:'auto' as any}}>
                      {completedIvrs.map(ivr=>(<option key={ivr.tenant_key} value={ivr.tenant_key}>{ivr.ivr_name}</option>))}
                    </select>
                    <button onClick={()=>{setView('cards');setSelectedFiles([]);setIvrName('');setError('');}} style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${colors.b1}`,background:'transparent',color:colors.purple,fontSize:10,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>+ Add IVR</button>
                  </div>
                )}
                {ivrSource==='my' && completedIvrs.length === 1 && (
                  <div className="f1" style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
                    <button onClick={()=>{setView('cards');setSelectedFiles([]);setIvrName('');setError('');}} style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${colors.b1}`,background:'transparent',color:colors.purple,fontSize:10,fontWeight:700,cursor:'pointer'}}>+ Add Another IVR</button>
                  </div>
                )}

                <div className="f1" style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,color:colors.tx3,marginBottom:8}}>Journeys</div>
                <div className="f2" style={{display:'flex',alignItems:'center',padding:'10px 14px',marginBottom:14,background:colors.s1,border:`1px solid ${colors.b1}`,borderRadius:9}}>
                  {JOURNEYS.map((j,i)=>(<React.Fragment key={i}>
                    <div onClick={()=>setSelectedJourney(i)} style={{display:'flex',alignItems:'center',gap:6,flex:1,cursor:'pointer',padding:'4px 6px',borderRadius:6,transition:'all .15s',background:selectedJourney===i?'rgba(0,201,177,.08)':'transparent'}}>
                      <div style={{width:20,height:20,borderRadius:5,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,...(selectedJourney===i?{background:'rgba(0,201,177,.15)',border:'1.5px solid rgba(0,201,177,.4)',color:colors.teal}:{background:colors.s2,color:colors.tx3})}}>{selectedJourney===i?'✓':i+1}</div>
                      <span style={{fontSize:9,fontWeight:600,whiteSpace:'nowrap',color:selectedJourney===i?colors.teal:colors.tx3}}>{j.label}</span>
                    </div>
                    {i<JOURNEYS.length-1 && <div style={{flex:1,height:1,margin:'0 6px',background:selectedJourney>i?colors.teal:colors.b1}} />}
                  </React.Fragment>))}
                </div>

                <div className="f2" style={{background:colors.s1,border:`1px solid ${colors.b1}`,borderRadius:14,padding:22,display:'flex',alignItems:'center',gap:20,marginBottom:14,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 25% 50%,rgba(0,201,177,.04) 0%,transparent 60%)',pointerEvents:'none'}} />
                  <div style={{width:74,height:74,borderRadius:'50%',flexShrink:0,background:'radial-gradient(circle,rgba(0,201,177,.1),transparent 70%)',border:'2px solid rgba(0,201,177,.15)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1}}>
                    <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,rgba(0,201,177,.18),rgba(51,112,232,.12))',border:'1.5px solid rgba(0,201,177,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,animation:'mic-pulse 2.5s ease-in-out infinite'}}>🎙</div>
                  </div>
                  <div style={{flex:1,position:'relative',zIndex:1}}>
                    <h3 style={{fontSize:16,fontWeight:800,marginBottom:3,letterSpacing:-0.3}}>Start a call. <span style={{color:ivrSource==='my'?colors.teal:colors.blue}}>{ivrSource==='my'?'Hear your AI IVR.':'Experience shop demo.'}</span></h3>
                    <p style={{fontSize:11,color:colors.tx2,lineHeight:1.5,marginBottom:10}}>{ivrSource==='my'?'Your uploaded flow is running':'Demo with 6 industries'} — <strong style={{color:colors.teal}}>{JOURNEYS[selectedJourney].label}</strong> ({JOURNEYS[selectedJourney].desc}).</p>
                    <button onClick={()=>{
                      const tk = ivrSource==='my' ? (selectedIvrTenant || migrationStatus?.tenant_key || 'experience_shop') : 'experience_shop';
                      const ik = ivrSource==='my' ? 'retail' : 'global_banking';
                      const rm = JOURNEYS[selectedJourney].routing_mode;
                      window.location.href=`/?autostart=true&tenant_key=${tk}&ivr_key=${ik}${rm?'&routing_mode='+rm:''}`;
                    }} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 24px',borderRadius:9,border:'none',background:ivrSource==='my'?colors.teal:colors.blue,color:'#000',fontSize:13,fontWeight:800,fontFamily:"'DM Sans','Inter',sans-serif",cursor:'pointer',transition:'all .2s',boxShadow:ivrSource==='my'?'0 4px 16px rgba(0,201,177,.2)':'0 4px 16px rgba(51,112,232,.2)'}}>📞 Start {JOURNEYS[selectedJourney].label} Call</button>
                    <div style={{display:'flex',gap:12,marginTop:7}}>
                      {['136 intents','3-level DTMF','Pre-firewall'].map((m,i)=>(<span key={i} style={{fontSize:9,color:colors.tx3,display:'flex',alignItems:'center',gap:4}}><span style={{width:4,height:4,borderRadius:'50%',background:colors.teal}} />{m}</span>))}
                    </div>
                  </div>
                </div>

                <div className="f3" style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',borderRadius:6,background:colors.s2,border:`1px solid ${colors.b1}`,marginBottom:12}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:currentMode.color}} />
                  <span style={{fontSize:10,color:colors.tx2}}>Active: <span style={{color:colors.tx,fontWeight:700}}>{currentMode.label}</span></span>
                  <span style={{marginLeft:'auto',fontSize:9,color:colors.tx3}}>tap a card to switch</span>
                </div>

                <div className="f3" style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:0.8,color:colors.tx3,marginBottom:8}}>Routing Modes</div>
                <div className="f4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                  {MODES.map(m=>(<div key={m.key} onClick={()=>setActiveMode(m.key)} style={{padding:12,borderRadius:9,background:colors.s1,border:`1px solid ${activeMode===m.key?'rgba(0,201,177,.25)':colors.b1}`,cursor:'pointer',transition:'all .15s',position:'relative'}}>
                    {activeMode===m.key && <div style={{position:'absolute',top:6,right:6,padding:'1px 5px',borderRadius:3,fontSize:7,fontWeight:800,letterSpacing:0.4,background:'rgba(0,201,177,.1)',color:colors.teal,border:'1px solid rgba(0,201,177,.15)'}}>ACTIVE</div>}
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><div style={{width:8,height:8,borderRadius:3,background:m.color}} /><span style={{fontSize:11,fontWeight:700}}>{m.label}</span></div>
                    <div style={{fontSize:9,color:colors.tx3,lineHeight:1.4}}>{m.desc}</div>
                    <div style={{display:'flex',alignItems:'baseline',gap:3,marginTop:6,paddingTop:6,borderTop:'1px solid rgba(28,45,69,.3)'}}>
                      <span style={{fontSize:12,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:m.color}}>{m.price}</span>
                      <span style={{fontSize:8,color:colors.tx3}}>{m.unit}</span>
                    </div>
                  </div>))}
                </div>

                <div className="f5" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                  {[{label:'Cost',val:'₹0.00',color:colors.green,sub:'this call'},{label:'Intents',val:'0',color:colors.blue,sub:'resolved'},{label:'Duration',val:'0:00',color:colors.amber,sub:'elapsed'},{label:'Experience',val:'Exp 3',color:colors.purple,sub:'active tier'}].map((meter,i)=>(
                    <div key={i} style={{padding:10,borderRadius:8,textAlign:'center',background:colors.s1,border:`1px solid ${colors.b1}`}}>
                      <div style={{fontSize:8,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,color:colors.tx3,marginBottom:3}}>{meter.label}</div>
                      <div style={{fontSize:15,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:meter.color}}>{meter.val}</div>
                      <div style={{fontSize:8,color:colors.tx3,marginTop:1}}>{meter.sub}</div>
                    </div>
                  ))}
                </div>
              </>)}

              {/* ── TEST / PILOT / LAUNCH — Contact form ── */}
              {selectedStage >= 2 && (
                <div className="f1">
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                    <div style={{width:30,height:30,borderRadius:7,background:'rgba(0,201,177,.1)',border:'1px solid rgba(0,201,177,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
                      {selectedStage===2?'🔬':selectedStage===3?'🚀':'✅'}
                    </div>
                    <div>
                      <h2 style={{fontSize:17,fontWeight:800,letterSpacing:-0.3}}>{(selectedStageData as any)?.contactTitle || selectedStageData?.label}</h2>
                      <p style={{fontSize:11,color:colors.tx2,marginTop:1}}>{(selectedStageData as any)?.contactDesc}</p>
                    </div>
                  </div>

                  {!contactSubmitted ? (
                    <div style={{background:colors.s1,border:`1px solid ${colors.b1}`,borderRadius:14,padding:32,maxWidth:480}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                        <div style={{width:40,height:40,borderRadius:10,background:'rgba(0,201,177,.08)',border:'1px solid rgba(0,201,177,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📞</div>
                        <div>
                          <h3 style={{fontSize:15,fontWeight:700}}>Connect with our team</h3>
                          <p style={{fontSize:11,color:colors.tx2}}>5-minute setup · We'll get you running</p>
                        </div>
                      </div>

                      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:18}}>
                        <div>
                          <label style={{fontSize:10,fontWeight:600,color:colors.tx3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>Full Name</label>
                          <input type="text" placeholder="Your name" value={contactName} onChange={e=>setContactName(e.target.value)}
                            style={{width:'100%',padding:'10px 14px',borderRadius:8,background:colors.s2,border:`1px solid ${colors.b1}`,color:colors.tx,fontSize:13,fontFamily:"'DM Sans','Inter',sans-serif",outline:'none'}} />
                        </div>
                        <div>
                          <label style={{fontSize:10,fontWeight:600,color:colors.tx3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>Phone Number</label>
                          <input type="tel" placeholder="+91 800 123 4567" value={contactPhone} onChange={e=>setContactPhone(e.target.value)}
                            style={{width:'100%',padding:'10px 14px',borderRadius:8,background:colors.s2,border:`1px solid ${colors.b1}`,color:colors.tx,fontSize:13,fontFamily:"'JetBrains Mono',monospace",outline:'none'}} />
                        </div>
                        <div>
                          <label style={{fontSize:10,fontWeight:600,color:colors.tx3,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>Email</label>
                          <input type="email" placeholder="you@company.com" value={contactEmail} onChange={e=>setContactEmail(e.target.value)}
                            style={{width:'100%',padding:'10px 14px',borderRadius:8,background:colors.s2,border:`1px solid ${colors.b1}`,color:colors.tx,fontSize:13,fontFamily:"'DM Sans','Inter',sans-serif",outline:'none'}} />
                        </div>
                      </div>

                      <button
                        onClick={()=>{ if(contactName.trim()&&contactEmail.trim()) setContactSubmitted(true); }}
                        disabled={!contactName.trim()||!contactEmail.trim()}
                        style={{
                          width:'100%',padding:'12px 0',borderRadius:9,border:'none',
                          background:contactName.trim()&&contactEmail.trim()?colors.teal:colors.b2,
                          color:contactName.trim()&&contactEmail.trim()?'#000':colors.tx3,
                          fontSize:14,fontWeight:800,fontFamily:"'DM Sans','Inter',sans-serif",
                          cursor:contactName.trim()&&contactEmail.trim()?'pointer':'default',
                          transition:'all .2s',
                        }}
                      >Contact Us</button>

                      <p style={{fontSize:10,color:colors.tx3,textAlign:'center',marginTop:10}}>
                        Our team will reach out within 24 hours to set up your {selectedStageData?.label?.toLowerCase()} environment.
                      </p>
                    </div>
                  ) : (
                    <div style={{background:'rgba(0,222,122,.04)',border:'1px solid rgba(0,222,122,.15)',borderRadius:14,padding:32,textAlign:'center',maxWidth:480}}>
                      <div style={{fontSize:40,marginBottom:12}}>🎉</div>
                      <h3 style={{fontSize:18,fontWeight:700,color:colors.green,marginBottom:6}}>We'll be in touch</h3>
                      <p style={{fontSize:13,color:colors.tx2,lineHeight:1.6,marginBottom:16}}>
                        Thanks, <strong style={{color:colors.tx}}>{contactName}</strong>. Our team will contact you at <span style={{fontFamily:"'JetBrains Mono',monospace",color:colors.teal,fontWeight:600}}>{contactEmail}</span> to set up your {selectedStageData?.label?.toLowerCase()} environment.
                      </p>
                      <div style={{display:'inline-flex',padding:'8px 20px',borderRadius:8,background:'rgba(0,201,177,.08)',border:'1px solid rgba(0,201,177,.12)',fontSize:12,fontWeight:600,color:colors.teal,fontFamily:"'JetBrains Mono',monospace"}}>
                        Typically within 24 hours
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════
  // TENANT: Pre-completion (R100 unchanged)
  // cards / processing / ivr_submitted
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:'100vh',background:colors.bg,color:colors.tx}}>
      <UnifiedHeader variant="journey" user={user} onSignIn={()=>router.push('/login')} onSignOut={handleSignOut} onLogoClick={()=>router.push('/')} currency={currency} onCurrencyChange={setCurrency} />
      <style>{`@keyframes migrate-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{maxWidth:760,margin:'0 auto',padding:'48px 20px 80px'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <h1 style={{fontSize:32,fontWeight:800,letterSpacing:-0.5,marginBottom:6,fontFamily:"'DM Sans','Inter',sans-serif"}}>Migrate your IVR to AI</h1>
          <p style={{fontSize:15,color:colors.tx2,marginBottom:14}}>Go live in under 17 minutes. Here's exactly what happens.</p>
          <span style={{display:'inline-flex',padding:'6px 18px',borderRadius:20,fontSize:12,fontWeight:600,background:'rgba(0,222,122,.06)',border:'1px solid rgba(0,222,122,.12)',color:colors.green,fontFamily:"'JetBrains Mono',monospace"}}>Test free for up to 3 months — at any stage or all stages</span>
        </div>

        {error && (<div style={{padding:'12px 16px',borderRadius:10,marginBottom:20,background:'rgba(240,48,96,.08)',border:'1px solid rgba(240,48,96,.15)',color:colors.red,fontSize:13}}>{error}<span style={{float:'right',display:'flex',gap:10,alignItems:'center'}}><button onClick={handleReset} style={{padding:'3px 10px',borderRadius:5,border:`1px solid rgba(240,48,96,.2)`,background:'transparent',color:colors.red,fontSize:11,fontWeight:600,cursor:'pointer'}}>↩ Reset</button><span onClick={()=>setError('')} style={{cursor:'pointer',fontWeight:700}}>✕</span></span></div>)}

        <div style={{position:'relative',paddingLeft:52}}>
          <div style={{position:'absolute',left:19,top:0,bottom:0,width:3,background:colors.b1,borderRadius:2}} />
          <div style={{position:'absolute',left:19,top:0,width:3,borderRadius:2,zIndex:1,background:colors.teal,height:view==='processing'?'45%':'35%',transition:'height 0.6s ease'}} />

          {/* STAGE 1: Explore & Try */}
          <div style={{position:'relative',paddingBottom:40}}>
            <div style={{position:'absolute',left:-52,top:0,width:40,height:40,borderRadius:'50%',background:colors.teal,boxShadow:'0 0 20px rgba(0,201,177,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,zIndex:2}}>🔍</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <h2 style={{fontSize:20,fontWeight:700}}>Explore & Try</h2>
              <span style={{padding:'3px 10px',borderRadius:5,fontSize:12,fontWeight:600,background:'rgba(0,201,177,.08)',color:colors.teal,fontFamily:"'JetBrains Mono',monospace"}}>5 min</span>
            </div>
            <p style={{fontSize:13,color:colors.tx3,marginBottom:16,lineHeight:1.5}}>Start by connecting your IVR. Choose the method that works for you.</p>

            {/* Cards view */}
            {view === 'cards' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {/* Card A: IVR Number */}
                <div style={{background:colors.s1,border:`1px solid ${colors.b1}`,borderRadius:14,padding:24,position:'relative'}}>
                  <div style={{position:'absolute',top:12,right:12,padding:'3px 8px',borderRadius:4,fontSize:9,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:0.4,background:'rgba(0,201,177,.08)',color:colors.teal}}>Hands-off</div>
                  <div style={{fontSize:28,marginBottom:10}}>📞</div>
                  <h3 style={{fontSize:16,fontWeight:700,marginBottom:6}}>IVR Number</h3>
                  <p style={{fontSize:12,color:colors.tx2,lineHeight:1.5,marginBottom:14}}>Give us the number your customers dial. We call it, map every menu branch, and connect AI.</p>
                  <div style={{display:'flex',gap:6,marginBottom:14}}>
                    <input type="tel" placeholder="+91 800 123 4567" value={ivrPhone} onChange={e=>setIvrPhone(e.target.value)} style={{flex:1,padding:'10px 14px',borderRadius:9,background:colors.s2,border:`1px solid ${colors.b1}`,color:colors.tx,fontSize:13,fontFamily:"'JetBrains Mono',monospace",outline:'none'}} />
                    <button onClick={handleIvrSubmit} disabled={!ivrPhone.trim()||ivrSubmitting} style={{padding:'10px 18px',borderRadius:9,border:'none',background:ivrPhone.trim()?colors.teal:colors.b2,color:ivrPhone.trim()?'#000':colors.tx3,fontSize:12,fontWeight:700,cursor:ivrPhone.trim()?'pointer':'default',flexShrink:0,transition:'all .2s'}}>{ivrSubmitting?'...':'Submit'}</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
                    <div style={{background:colors.s2,borderRadius:7,padding:'8px 10px'}}><div style={{fontSize:9,color:colors.tx3,textTransform:'uppercase' as const,fontWeight:600}}>Timeline</div><div style={{fontSize:14,fontWeight:700,color:colors.teal,fontFamily:"'JetBrains Mono',monospace"}}>~24 hrs</div></div>
                    <div style={{background:colors.s2,borderRadius:7,padding:'8px 10px'}}><div style={{fontSize:9,color:colors.tx3,textTransform:'uppercase' as const,fontWeight:600}}>Your effort</div><div style={{fontSize:14,fontWeight:700,color:colors.teal,fontFamily:"'JetBrains Mono',monospace"}}>0 min</div></div>
                  </div>
                  <div style={{paddingTop:8,borderTop:`1px solid ${colors.b1}`,fontSize:10,color:colors.tx3}}>No NDA needed · Public number · Zero IT work</div>
                </div>

                {/* Card B: Upload IVR Flow */}
                <div style={{background:colors.s1,border:'1px solid rgba(139,92,246,.2)',borderRadius:14,padding:24,position:'relative'}}>
                  <div style={{position:'absolute',top:12,right:12,padding:'3px 8px',borderRadius:4,fontSize:9,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:0.4,background:colors.green,color:'#000'}}>Fastest</div>
                  <div style={{fontSize:28,marginBottom:10}}>📄</div>
                  <h3 style={{fontSize:16,fontWeight:700,marginBottom:6}}>Upload IVR Flow</h3>
                  <p style={{fontSize:12,color:colors.tx2,lineHeight:1.5,marginBottom:14}}>Upload your IVR config file. AI parses every branch and intent, generates flows automatically.</p>
                  <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop} onClick={()=>fileInputRef.current?.click()} style={{border:`2px dashed ${dragOver?colors.purple:colors.b2}`,borderRadius:12,padding:selectedFiles.length>0?'12px':'22px',textAlign:'center',cursor:'pointer',background:dragOver?'rgba(139,92,246,.06)':colors.s2,transition:'all .2s',marginBottom:8}}>
                    <input ref={fileInputRef} type="file" multiple accept={ALLOWED_EXTENSIONS.join(',')} onChange={e=>{if(e.target.files)addFiles(Array.from(e.target.files))}} style={{display:'none'}} />
                    {selectedFiles.length===0 ? (<><div style={{fontSize:22,marginBottom:4}}>📁</div><div style={{fontSize:12,fontWeight:600}}>Drop files here or click</div><div style={{fontSize:9,color:colors.tx3,marginTop:2}}>Max 10 files, 50MB each</div></>) : (
                      <div style={{textAlign:'left'}}>
                        {selectedFiles.map((f,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:i<selectedFiles.length-1?`1px solid ${colors.b1}`:'none'}}>
                          <span style={{fontSize:14}}>📄</span><span style={{flex:1,fontSize:11,fontWeight:600}}>{f.name}</span>
                          <span style={{fontSize:10,color:colors.tx3,fontFamily:"'JetBrains Mono',monospace"}}>{formatBytes(f.size)}</span>
                          <span onClick={e=>{e.stopPropagation();removeFile(i)}} style={{fontSize:12,color:colors.red,cursor:'pointer',padding:'0 4px'}}>✕</span>
                        </div>))}
                        <div style={{fontSize:9,color:colors.tx3,marginTop:6,textAlign:'center'}}>Click to add more (max 10)</div>
                      </div>
                    )}
                  </div>
                  {selectedFiles.length===0 && (<div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:10}}>{ALLOWED_EXTENSIONS.map(ext=>(<span key={ext} style={{padding:'2px 6px',borderRadius:3,fontSize:9,fontWeight:600,background:'rgba(139,92,246,.1)',color:colors.purple,fontFamily:"'JetBrains Mono',monospace"}}>{ext}</span>))}</div>)}
                  <input type="text" placeholder="IVR name (e.g. Retail Banking)" value={ivrName} onChange={e=>setIvrName(e.target.value)} style={{width:'100%',padding:'8px 12px',borderRadius:7,background:colors.s2,border:`1px solid ${ivrName.trim()?'rgba(0,201,177,.3)':colors.b1}`,color:colors.tx,fontSize:11,marginBottom:10,fontFamily:"'DM Sans','Inter',sans-serif",outline:'none'}} />
                  <input type="tel" placeholder="IVR number (optional)" value={optionalPhone} onChange={e=>setOptionalPhone(e.target.value)} style={{width:'100%',padding:'8px 12px',borderRadius:7,background:colors.s2,border:`1px solid ${colors.b1}`,color:colors.tx,fontSize:11,marginBottom:10,fontFamily:"'JetBrains Mono',monospace",outline:'none'}} />
                  {selectedFiles.length>0 && (<button onClick={handleFileUpload} disabled={uploading} style={{width:'100%',padding:'10px 0',borderRadius:9,border:'none',background:uploading?colors.b2:colors.purple,color:'#fff',fontSize:13,fontWeight:700,cursor:uploading?'default':'pointer',marginBottom:10,transition:'all .2s'}}>{uploading?'Uploading...':`Upload ${selectedFiles.length} file${selectedFiles.length>1?'s':''}`}</button>)}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                    <div style={{background:colors.s2,borderRadius:7,padding:'8px 10px'}}><div style={{fontSize:9,color:colors.tx3,textTransform:'uppercase' as const,fontWeight:600}}>AI Parsing</div><div style={{fontSize:14,fontWeight:700,color:colors.purple,fontFamily:"'JetBrains Mono',monospace"}}>~4 min</div></div>
                    <div style={{background:colors.s2,borderRadius:7,padding:'8px 10px'}}><div style={{fontSize:9,color:colors.tx3,textTransform:'uppercase' as const,fontWeight:600}}>Data Residency</div><div style={{fontSize:14,fontWeight:700,color:colors.purple,fontFamily:"'JetBrains Mono',monospace"}}>India 🇮🇳</div></div>
                  </div>
                </div>
              </div>
            )}

            {/* IVR submitted */}
            {view === 'ivr_submitted' && (
              <div style={{background:colors.s1,border:`1px solid ${colors.b1}`,borderRadius:14,padding:32,textAlign:'center'}}>
                <div style={{fontSize:40,marginBottom:12}}>📞</div>
                <h3 style={{fontSize:18,fontWeight:700,marginBottom:6}}>We've got your number</h3>
                <p style={{fontSize:13,color:colors.tx2,lineHeight:1.6,marginBottom:16}}>Our team will call <span style={{fontFamily:"'JetBrains Mono',monospace",color:colors.teal,fontWeight:600}}>{migrationStatus?.ivr_phone||ivrPhone}</span>, map every menu branch, and set up your AI IVR.</p>
                <div style={{display:'inline-flex',padding:'8px 20px',borderRadius:8,background:'rgba(0,201,177,.08)',border:'1px solid rgba(0,201,177,.12)',fontSize:12,fontWeight:600,color:colors.teal,fontFamily:"'JetBrains Mono',monospace"}}>We'll email you when it's ready — typically ~24 hours</div>
              </div>
            )}

            {/* Processing */}
            {view === 'processing' && migrationStatus && (
              <div style={{background:colors.s1,border:`1px solid ${colors.b1}`,borderRadius:18,padding:'36px 28px',maxWidth:440,margin:'0 auto'}}>
                <div style={{textAlign:'center',marginBottom:20}}>
                  <div style={{width:40,height:40,margin:'0 auto 12px',border:`3px solid ${colors.b2}`,borderTopColor:colors.teal,borderRadius:'50%',animation:'migrate-spin 1s linear infinite'}} />
                  <h3 style={{fontSize:18,fontWeight:800,marginBottom:4}}>Setting up your IVR…</h3>
                  <p style={{fontSize:12,color:colors.tx2}}>This usually takes about 4 minutes.</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:0}}>
                  <ProcessingStep label="Files received" sublabel="Stored securely" done={migrationStatus.step_files_received} active={!migrationStatus.step_files_received && migrationStatus.status==='processing'} number={1} />
                  <ProcessingStep label="Environment provisioned" sublabel="Database + config created" done={migrationStatus.step_tenant_provisioned} active={migrationStatus.step_files_received && !migrationStatus.step_tenant_provisioned} number={2} />
                  <ProcessingStep label="Compiling artifacts" sublabel="AI parsing your IVR flow" done={migrationStatus.step_artifacts_compiled} active={migrationStatus.step_tenant_provisioned && !migrationStatus.step_artifacts_compiled} number={3} />
                  <ProcessingStep label="Publishing & activating" sublabel="Your AI IVR is going live" done={migrationStatus.step_published} active={migrationStatus.step_artifacts_compiled && !migrationStatus.step_published} number={4} />
                </div>
              </div>
            )}
          </div>

          {/* STAGE 2: Pilot Live */}
          <div style={{position:'relative',paddingBottom:36}}>
            <div style={{position:'absolute',left:-52,top:0,width:40,height:40,borderRadius:'50%',background:colors.s2,border:`2px solid ${colors.b2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,zIndex:2}}>🚀</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}><h2 style={{fontSize:20,fontWeight:700}}>Pilot Live</h2><span style={{padding:'3px 10px',borderRadius:5,fontSize:12,fontWeight:600,background:colors.s2,color:colors.tx3,fontFamily:"'JetBrains Mono',monospace"}}>5 min</span></div>
            <p style={{fontSize:13,color:colors.tx3,marginBottom:14,lineHeight:1.5}}>Run real calls at limited volume. Full monitoring, analytics, and AI containment tracking.</p>
            <StageCard icon="🚀" title="Ready to pilot?" desc="Our team configures live call routing, sets volume limits, and turns on full monitoring." buttonLabel="Contact Us" />
          </div>

          {/* STAGE 3: Production Test */}
          <div style={{position:'relative',paddingBottom:36}}>
            <div style={{position:'absolute',left:-52,top:0,width:40,height:40,borderRadius:'50%',background:colors.s2,border:`2px solid ${colors.b2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,zIndex:2}}>🔬</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}><h2 style={{fontSize:20,fontWeight:700}}>Production Test</h2><span style={{padding:'3px 10px',borderRadius:5,fontSize:12,fontWeight:600,background:colors.s2,color:colors.tx3,fontFamily:"'JetBrains Mono',monospace"}}>5 min</span></div>
            <p style={{fontSize:13,color:colors.tx3,marginBottom:14,lineHeight:1.5}}>Validate every customer journey end-to-end. Compliance, QA, agent handoff tests.</p>
            <StageCard icon="🔬" title="Ready for production test?" desc="Full validation — compliance, multilingual, escalation, and handoff paths." buttonLabel="Contact Us" />
          </div>

          {/* STAGE 4: Production Live */}
          <div style={{position:'relative'}}>
            <div style={{position:'absolute',left:-52,top:0,width:40,height:40,borderRadius:'50%',background:colors.s2,border:`2px solid ${colors.b2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,zIndex:2}}>✅</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}><h2 style={{fontSize:20,fontWeight:700}}>Production Live</h2><span style={{padding:'3px 10px',borderRadius:5,fontSize:12,fontWeight:600,background:colors.s2,color:colors.tx3,fontFamily:"'JetBrains Mono',monospace"}}>2 min</span></div>
            <p style={{fontSize:13,color:colors.tx3,marginBottom:14,lineHeight:1.5}}>Dashboards, compliance, multilingual, agent handoff — all running. Fully AI-powered.</p>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderRadius:12,background:'rgba(0,222,122,.03)',border:'1px solid rgba(0,222,122,.15)'}}>
              <div style={{width:40,height:40,borderRadius:9,flexShrink:0,background:'rgba(0,222,122,.08)',border:'1px solid rgba(0,222,122,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>✅</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:colors.green}}>Go fully live</div><div style={{fontSize:11,color:colors.tx3}}>Final switch. Full volume. CSAT tracking + per-intent billing active.</div></div>
              <button style={{padding:'8px 16px',borderRadius:7,border:'none',background:colors.green,color:'#000',fontSize:11,fontWeight:700,cursor:'pointer'}}>Contact Us</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Sub-components (R100 unchanged) ──

function ProcessingStep({label,sublabel,done,active,number}:{label:string;sublabel:string;done:boolean;active:boolean;number:number}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:number<4?'1px solid rgba(28,45,69,.4)':'none'}}>
      <div style={{width:28,height:28,borderRadius:7,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:done?'rgba(0,222,122,.12)':active?'rgba(0,201,177,.12)':colors.s2}}>
        {done?<span style={{fontSize:12,color:colors.green}}>✓</span>:active?<div style={{width:14,height:14,border:`2px solid ${colors.b2}`,borderTopColor:colors.teal,borderRadius:'50%',animation:'migrate-spin 1s linear infinite'}} />:<span style={{fontSize:11,color:colors.tx3}}>{number}</span>}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:700,color:done?colors.tx:active?colors.tx:colors.tx3}}>{label}</div>
        <div style={{fontSize:10,color:colors.tx3}}>{sublabel}</div>
      </div>
    </div>
  );
}

function StageCard({icon,title,desc,buttonLabel}:{icon:string;title:string;desc:string;buttonLabel:string}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderRadius:12,background:colors.s1,border:`1px solid ${colors.b1}`}}>
      <div style={{width:40,height:40,borderRadius:9,flexShrink:0,background:colors.s2,border:`1px solid ${colors.b2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{icon}</div>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{title}</div><div style={{fontSize:11,color:colors.tx3}}>{desc}</div></div>
      <button style={{padding:'8px 16px',borderRadius:7,border:`1px solid ${colors.b1}`,background:'transparent',color:colors.tx2,fontSize:11,fontWeight:600,cursor:'pointer'}}>{buttonLabel}</button>
    </div>
  );
}

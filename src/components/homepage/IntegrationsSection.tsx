'use client'
import { useState } from 'react'

interface Props {
  onSignUp?: () => void
}

// ── Inline SVG logos ───────────────────────────────────────────────────────
const L: Record<string, string> = {
  salesforce: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#00A1E0"/><path d="M23.5 17c-2.8 0-5.2 1.6-6.3 4a7.2 7.2 0 00-6.2 7.2c0 4 3.2 7.2 7.2 7.2.7 0 1.3-.1 1.9-.3a6.5 6.5 0 005.9 3.9 6.4 6.4 0 005.5-3.1 5.4 5.4 0 002-.4c3 0 5.5-2.5 5.5-5.5 0-.7-.1-1.3-.4-1.9a5.8 5.8 0 00-3.1-10.7c-.5 0-1 .1-1.5.2A7.3 7.3 0 0023.5 17z" fill="white"/></svg>`,
  hubspot: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#FF7A59"/><circle cx="33" cy="23" r="3" fill="white"/><path d="M33 26v6.5a4 4 0 11-3.2-1.5" stroke="white" stroke-width="2.5" fill="none"/><circle cx="24" cy="33" r="4" stroke="white" stroke-width="2.5" fill="none"/><line x1="21" y1="18" x2="21" y2="28" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="21" cy="16.5" r="2.5" fill="white"/></svg>`,
  zoho: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#C8202B"/><text x="28" y="36" text-anchor="middle" font-family="Arial" font-size="18" font-weight="900" fill="white">zoho</text></svg>`,
  dynamics: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#0078D4"/><rect x="14" y="14" width="12" height="12" rx="1" fill="#FFB900"/><rect x="30" y="14" width="12" height="12" rx="1" fill="#00A4EF"/><rect x="14" y="30" width="12" height="12" rx="1" fill="#7FBA00"/><rect x="30" y="30" width="12" height="12" rx="1" fill="#F25022"/></svg>`,
  freshworks: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#05BD7B"/><path d="M20 16h16a2 2 0 012 2v4H18v-4a2 2 0 012-2z" fill="white" opacity=".9"/><rect x="18" y="24" width="20" height="3" rx="1" fill="white" opacity=".7"/><rect x="18" y="29" width="14" height="3" rx="1" fill="white" opacity=".5"/><circle cx="36" cy="38" r="4" fill="white"/></svg>`,
  servicenow: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#62D84E"/><circle cx="28" cy="28" r="12" fill="white"/><circle cx="28" cy="28" r="6" fill="#62D84E"/></svg>`,
  zendesk: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#03363D"/><path d="M26 20H16l10-7v7z" fill="white"/><circle cx="21" cy="35" r="5" fill="white"/><path d="M30 36h10l-10 7v-7z" fill="white"/><circle cx="35" cy="21" r="5" fill="white"/></svg>`,
  pipedrive: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#017737"/><circle cx="28" cy="24" r="8" stroke="white" stroke-width="3" fill="none"/><line x1="28" y1="32" x2="28" y2="43" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`,
  genesys: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#FF4F1F"/><path d="M28 14a14 14 0 100 28 14 14 0 000-28zm0 4a10 10 0 010 20v-7a3 3 0 100-6v-7z" fill="white"/></svg>`,
  nice: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#0055A6"/><text x="28" y="35" text-anchor="middle" font-family="Arial" font-size="16" font-weight="900" fill="white">NICE</text></svg>`,
  five9: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#F58220"/><text x="28" y="36" text-anchor="middle" font-family="Arial" font-size="20" font-weight="900" fill="white">Five9</text></svg>`,
  talkdesk: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#7B2FBE"/><circle cx="28" cy="28" r="10" fill="white" opacity=".2"/><path d="M22 24h12v2H26v3h7v2h-7v5h-4V24z" fill="white"/></svg>`,
  eight8: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#0F4C81"/><text x="28" y="37" text-anchor="middle" font-family="Arial" font-size="22" font-weight="900" fill="white">8×8</text></svg>`,
  avaya: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#DA291C"/><text x="28" y="37" text-anchor="middle" font-family="Arial" font-size="14" font-weight="900" fill="white">avaya</text></svg>`,
  webex: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#049FD9"/><circle cx="28" cy="28" r="11" fill="none" stroke="white" stroke-width="2.5"/><path d="M28 17a11 11 0 010 22" fill="white"/><circle cx="28" cy="28" r="4" fill="#049FD9"/></svg>`,
  amazon_connect: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#232F3E"/><path d="M16 32c4 3 8 4.5 12 4.5s8-1.5 12-4.5" stroke="#FF9900" stroke-width="2.5" stroke-linecap="round"/><text x="28" y="28" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="white">amazon</text></svg>`,
  vonage: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#6E1FFF"/><path d="M18 18h8l-8 20H10L18 18z" fill="white"/><path d="M28 18h8l-8 20h-8l8-20z" fill="white" opacity=".6"/></svg>`,
  twilio: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#F22F46"/><circle cx="28" cy="28" r="12" fill="none" stroke="white" stroke-width="2.5"/><circle cx="23" cy="23" r="2.5" fill="white"/><circle cx="33" cy="23" r="2.5" fill="white"/><circle cx="23" cy="33" r="2.5" fill="white"/><circle cx="33" cy="33" r="2.5" fill="white"/></svg>`,
  airtel: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#ED1C24"/><path d="M28 16c-8 0-14 6-14 14h4c0-5.5 4.5-10 10-10s10 4.5 10 10h4c0-8-6-14-14-14z" fill="white"/><path d="M28 24c-3.3 0-6 2.7-6 6h4a2 2 0 014 0h4c0-3.3-2.7-6-6-6z" fill="white"/></svg>`,
  tata: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#003C71"/><text x="28" y="32" text-anchor="middle" font-family="Arial" font-size="11" font-weight="900" fill="white">TATA</text><text x="28" y="41" text-anchor="middle" font-family="Arial" font-size="5.5" font-weight="600" fill="#60A5FA">COMMUNICATIONS</text></svg>`,
  bandwidth: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#00B386"/><rect x="14" y="30" width="4" height="10" rx="1" fill="white"/><rect x="20" y="26" width="4" height="14" rx="1" fill="white"/><rect x="26" y="22" width="4" height="18" rx="1" fill="white"/><rect x="32" y="18" width="4" height="22" rx="1" fill="white"/><rect x="38" y="14" width="4" height="26" rx="1" fill="white"/></svg>`,
  plivo: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#46C281"/><circle cx="22" cy="28" r="6" fill="white"/><circle cx="34" cy="28" r="6" fill="white" opacity=".6"/></svg>`,
  sinch: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#FF6B35"/><path d="M18 34c2-8 6-12 10-12s8 4 10 12" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="28" cy="22" r="3" fill="white"/></svg>`,
  exotel: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#2563EB"/><rect x="20" y="20" width="16" height="16" rx="2" fill="none" stroke="white" stroke-width="2"/><circle cx="28" cy="28" r="4" fill="white"/></svg>`,
  openai: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#000"/><path d="M39.2 25.8a7.4 7.4 0 00-.6-6.1 7.5 7.5 0 00-8.1-3.6 7.4 7.4 0 00-5.6-2.5 7.5 7.5 0 00-7.2 5.3 7.4 7.4 0 00-5 3.6 7.5 7.5 0 00.9 8.8 7.4 7.4 0 00.6 6.1 7.5 7.5 0 008.1 3.6 7.4 7.4 0 005.6 2.5 7.5 7.5 0 007.2-5.3 7.4 7.4 0 005-3.6 7.5 7.5 0 00-.9-8.8z" fill="none" stroke="white" stroke-width="1.8"/><path d="M26 19v10l8 4.6" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  azure_openai: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#0078D4"/><path d="M16 38l10-24h4l10 24h-4.5l-2.2-6H22.7l-2.2 6H16zm8.8-10h6.4L28 21l-3.2 7z" fill="white"/></svg>`,
  anthropic: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#D4A574"/><path d="M30.5 16h-4L16 40h4.2l2.3-5.8h10.8L35.8 40H40L30.5 16zm-6 14.2L28 21.5l3.6 8.7h-7.1z" fill="white"/></svg>`,
  gemini: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#1A73E8"/><circle cx="28" cy="28" r="10" fill="#4285F4"/><circle cx="28" cy="28" r="6" fill="#9B72CB"/><circle cx="28" cy="28" r="3" fill="#D96570"/></svg>`,
  bedrock: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#232F3E"/><path d="M16 32c4 3 8 4.5 12 4.5s8-1.5 12-4.5" stroke="#FF9900" stroke-width="2.5" stroke-linecap="round"/><text x="28" y="27" text-anchor="middle" font-family="Arial" font-size="7" font-weight="800" fill="white">AWS</text></svg>`,
  meta_llama: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#0081FB"/><path d="M15 35c0-8 5.5-19 9.5-19 2.5 0 3 4.5 3.5 7.5.5-3 1-7.5 3.5-7.5 4 0 9.5 11 9.5 19 0 3-1.5 5-4 5s-4-3-5.5-3-3 3-5.5 3-4-2-4-5z" fill="white"/></svg>`,
  mistral: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#000"/><rect x="14" y="14" width="6" height="6" fill="#F7D046"/><rect x="25" y="14" width="6" height="6" fill="#F7D046"/><rect x="36" y="14" width="6" height="6" fill="#F7D046"/><rect x="14" y="22" width="6" height="6" fill="#F2A73B"/><rect x="36" y="22" width="6" height="6" fill="#F2A73B"/><rect x="14" y="30" width="28" height="6" fill="#EF8530"/><rect x="14" y="38" width="6" height="6" fill="#EB5C25"/><rect x="25" y="38" width="6" height="6" fill="#EB5C25"/><rect x="36" y="38" width="6" height="6" fill="#EB5C25"/></svg>`,
  cohere: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#39594D"/><circle cx="24" cy="28" r="8" fill="#D18EE2"/><ellipse cx="33" cy="28" rx="6" ry="10" fill="#FF7759" opacity=".8"/></svg>`,
  deepseek: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#4D6BFE"/><circle cx="28" cy="26" r="10" fill="white"/><circle cx="32" cy="24" r="2" fill="#4D6BFE"/><path d="M22 30c2 3 5 5 10 4" stroke="#4D6BFE" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
  aws: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#232F3E"/><text x="28" y="27" text-anchor="middle" font-family="Arial" font-size="14" font-weight="900" fill="white">aws</text><path d="M16 32c4 3 8 4.5 12 4.5s8-1.5 12-4.5" stroke="#FF9900" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  azure: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#0078D4"/><path d="M18 38l8-24h3l-5 14 12-3-18 13z" fill="white" opacity=".8"/><path d="M27 14h10L25 38h13" fill="white"/></svg>`,
  gcloud: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#4285F4"/><path d="M28 18a10 10 0 110 20 10 10 0 010-20z" fill="none" stroke="white" stroke-width="2.5"/><path d="M24 28l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  kubernetes: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#326CE5"/><path d="M28 14l12.5 7v14L28 42l-12.5-7V21L28 14z" fill="white" opacity=".15" stroke="white" stroke-width="1.5"/><circle cx="28" cy="28" r="2.5" fill="white"/></svg>`,
  hybrid: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#0D1526"/><rect x="12" y="18" width="14" height="10" rx="3" fill="#00C9B1" opacity=".3" stroke="#00C9B1" stroke-width="1.5"/><rect x="30" y="28" width="14" height="10" rx="3" fill="#3370E8" opacity=".3" stroke="#3370E8" stroke-width="1.5"/><line x1="26" y1="24" x2="30" y2="32" stroke="white" stroke-width="1.5" stroke-dasharray="2 2"/></svg>`,
  onprem: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#0D1526"/><rect x="16" y="22" width="24" height="18" rx="2" fill="none" stroke="#64748B" stroke-width="1.5"/><rect x="20" y="26" width="16" height="3" rx="1" fill="#64748B"/><circle cx="33" cy="27.5" r="1" fill="#00DE7A"/><rect x="20" y="31" width="16" height="3" rx="1" fill="#64748B"/><circle cx="33" cy="32.5" r="1" fill="#00DE7A"/></svg>`,
  docker: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#2496ED"/><rect x="24" y="20" width="5" height="4.5" rx=".5" fill="white"/><rect x="18" y="20" width="5" height="4.5" rx=".5" fill="white"/><rect x="12" y="20" width="5" height="4.5" rx=".5" fill="white"/><rect x="24" y="14.5" width="5" height="4.5" rx=".5" fill="white"/><rect x="18" y="14.5" width="5" height="4.5" rx=".5" fill="white"/></svg>`,
  terraform: `<svg viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="14" fill="#7B42BC"/><path d="M23.5 15v11l9.5 5.5V20L23.5 15z" fill="white"/><path d="M34 20v11l9.5 5.5V25.5L34 20z" fill="white" opacity=".7"/><path d="M13 19.5V31l9.5 5.5v-11L13 19.5z" fill="white" opacity=".4"/></svg>`,
}

// ── Categories (matching J1-J4 card style) ─────────────────────────────────
const CATS = [
  { icon: '🗂', name: 'CRM', tag: '8 platforms', tagColor: '#3b82f6', desc: 'Customer context from turn 1. Pre-seeded into every call.', items: [
    { key: 'salesforce', name: 'Salesforce' }, { key: 'hubspot', name: 'HubSpot' }, { key: 'zoho', name: 'Zoho' }, { key: 'dynamics', name: 'Dynamics 365' },
    { key: 'freshworks', name: 'Freshworks' }, { key: 'servicenow', name: 'ServiceNow' }, { key: 'zendesk', name: 'Zendesk' }, { key: 'pipedrive', name: 'Pipedrive' },
  ]},
  { icon: '📞', name: 'CCaaS', tag: '8 platforms', tagColor: '#8b5cf6', desc: 'Sits alongside or replaces your existing IVR layer.', items: [
    { key: 'genesys', name: 'Genesys' }, { key: 'nice', name: 'NICE CXone' }, { key: 'five9', name: 'Five9' }, { key: 'talkdesk', name: 'Talkdesk' },
    { key: 'eight8', name: '8x8' }, { key: 'avaya', name: 'Avaya' }, { key: 'webex', name: 'Cisco Webex' }, { key: 'amazon_connect', name: 'Amazon Connect' },
  ]},
  { icon: '📡', name: 'Carrier & Telephony', tag: '8 carriers', tagColor: '#00c9b1', desc: 'BYO carrier. Give us your IVR number, we handle SIP.', items: [
    { key: 'vonage', name: 'Vonage' }, { key: 'twilio', name: 'Twilio' }, { key: 'airtel', name: 'Airtel' }, { key: 'tata', name: 'Tata Comm' },
    { key: 'bandwidth', name: 'Bandwidth' }, { key: 'plivo', name: 'Plivo' }, { key: 'sinch', name: 'Sinch' }, { key: 'exotel', name: 'Exotel' },
  ]},
  { icon: '🧠', name: 'LLMs', tag: '9 models', tagColor: '#f5a623', desc: 'Swap providers per tenant, per journey, per intent tier.', items: [
    { key: 'openai', name: 'OpenAI' }, { key: 'azure_openai', name: 'Azure OpenAI' }, { key: 'anthropic', name: 'Anthropic' }, { key: 'gemini', name: 'Gemini' },
    { key: 'bedrock', name: 'AWS Bedrock' }, { key: 'meta_llama', name: 'Meta LLaMA' }, { key: 'mistral', name: 'Mistral' }, { key: 'cohere', name: 'Cohere' }, { key: 'deepseek', name: 'DeepSeek' },
  ]},
  { icon: '☁️', name: 'Cloud & Deploy', tag: '8 options', tagColor: '#00de7a', desc: 'Cloud, hybrid, or on-prem. Your data stays where you choose.', items: [
    { key: 'aws', name: 'AWS' }, { key: 'azure', name: 'Azure' }, { key: 'gcloud', name: 'Google Cloud' }, { key: 'kubernetes', name: 'Kubernetes' },
    { key: 'hybrid', name: 'Hybrid' }, { key: 'onprem', name: 'On-Premises' }, { key: 'docker', name: 'Docker' }, { key: 'terraform', name: 'Terraform' },
  ]},
]

export default function IntegrationsSection({ onSignUp }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <section id="integrations" className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: 1040 }}>

      {/* ── Section label ── */}
      <div className="text-center mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.3)' }}>
        Zero Integration Ecosystem
      </div>
      <div className="text-center mb-8">
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,.35)' }}>
          40+ platforms supported out of the box. Click to explore.
        </p>
      </div>

      {/* ── Category cards (J1-J4 style) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {CATS.map((cat, i) => (
          <div key={cat.name}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 rounded-2xl border"
            style={{
              background: expanded === i ? 'var(--s2, #111D30)' : 'var(--s1, #0d1526)',
              borderColor: expanded === i ? 'rgba(255,255,255,.1)' : 'var(--b1, #1c2d45)',
            }}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-[22px] sm:text-[26px] mx-auto mb-3"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
              {cat.icon}
            </div>
            <div className="text-[12px] sm:text-[13px] font-bold mb-1">{cat.name}</div>
            <div className="text-[10px] sm:text-[11px] font-bold mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: cat.tagColor }}>
              {cat.tag}
            </div>
            <div className="text-[8px] sm:text-[9px] leading-tight mb-2" style={{ color: 'rgba(255,255,255,.3)' }}>{cat.desc}</div>
            <div className="text-[9px] font-bold transition-opacity hover:opacity-100" style={{ color: cat.tagColor, opacity: expanded === i ? 1 : 0.5 }}>
              {expanded === i ? 'Collapse ↑' : 'View all →'}
            </div>
          </div>
        ))}
      </div>

      {/* ── Expanded logos panel ── */}
      {expanded !== null && (
        <div className="mt-4 p-5 sm:p-6 rounded-2xl border" style={{ background: 'var(--s1, #0d1526)', borderColor: 'var(--b1, #1c2d45)', animation: 'fadeIn .2s ease' }}>
          <div className="text-[11px] font-bold mb-4 uppercase tracking-wider" style={{ color: CATS[expanded].tagColor }}>
            {CATS[expanded].icon} {CATS[expanded].name} — {CATS[expanded].tag}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {CATS[expanded].items.map(item => (
              <div key={item.key} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)' }}>
                <div className="w-9 h-9 sm:w-10 sm:h-10" dangerouslySetInnerHTML={{ __html: L[item.key] || '' }} />
                <div className="text-[9px] sm:text-[10px] font-semibold text-center leading-tight">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── API Banner ── */}
      <div className="mt-6 p-5 sm:p-6 rounded-2xl border flex items-center justify-between gap-6 flex-wrap"
        style={{ background: 'linear-gradient(135deg, var(--s1, #0d1526), var(--s2, #111D30))', borderColor: 'var(--b1, #1c2d45)' }}>
        <div>
          <div className="text-[14px] sm:text-[15px] font-bold mb-1">Zero Integration. Open APIs.</div>
          <div className="text-[11px]" style={{ color: 'rgba(255,255,255,.35)' }}>Pre-built adapters for all platforms. Or use our SDK.</div>
        </div>
        <button onClick={() => onSignUp?.()}
          className="px-5 py-2.5 rounded-[10px] text-[12px] font-bold border-none cursor-pointer whitespace-nowrap transition-all hover:-translate-y-0.5"
          style={{ background: '#00c9b1', color: '#000', fontFamily: 'inherit' }}>
          View API Docs →
        </button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </section>
  )
}

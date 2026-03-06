import type { Experience, Intent, IntentKey, RoutingMode, ExpLevel, DemoScenario, RotatingCTA, JourneyStage, Currency } from '@/types'

export const EXPERIENCES: Experience[] = [
  {
    level: 6, badge: '6 · Sarvam', name: 'India Sovereign',
    persona: 'Prepaid mobile · Free-tier SaaS · Basic support',
    stack: 'Sarvam STT + LLM + TTS',
    script: '"मेरा बैलेंस बताइए" → "आपका बैलेंस ₹1,42,500 है"',
    idealFor: 'Prepaid users · Low-balance savings · Basic enquiries',
    modes: ['premium', 'complexity', 'sales', 'hybrid'],
  },
  {
    level: 5, badge: '5 · Basic', name: 'Functional IVR Replace',
    persona: 'Standard banking · Entry loan · Savings account',
    stack: 'Azure STT → GPT-4o-mini → Azure TTS',
    script: '"Check my balance" → "Your balance is ₹1,42,500"',
    idealFor: 'Savings account holders · Entry-level loan customers · Routine banking',
    modes: ['premium', 'complexity'],
  },
  {
    level: 4, badge: '4 · Enhanced', name: 'Native Accent Voice',
    persona: 'NRI customer · Regional language · Fixed deposit',
    stack: 'Sarvam STT → GPT-4o-mini → Sarvam TTS',
    script: '"What\'s my FD rate?" → Sarvam picks up accent, GPT replies',
    idealFor: 'Regional language speakers · NRI customers · Fixed deposit holders',
    modes: ['premium', 'complexity'],
  },
  {
    level: 3, badge: '3 · Native', name: 'Sovereign AI',
    persona: 'Silver tier · Mutual fund investor · Car loan active',
    stack: 'Gemini Live S2S',
    script: '"I want a personal loan" → Gemini responds, zero turn latency',
    idealFor: 'Silver-tier customers · Mutual fund investors · Active loan holders',
    modes: ['premium', 'complexity', 'sales', 'hybrid'],
  },
  {
    level: 2, badge: '2 · Advanced', name: 'Emotional Voice AI',
    persona: 'Gold tier · Wealth management · Premium credit card',
    stack: 'GPT-4o Realtime (Azure)',
    script: '"Tell me about Regalia card" → warm, persuasive, live upsell',
    idealFor: 'Gold-tier customers · Wealth management · Premium card holders',
    modes: ['premium', 'complexity', 'sales', 'hybrid'],
  },
  {
    level: 1, badge: '1 · Ultra', name: 'Concierge AI',
    persona: 'Platinum · HNI · Relationship manager tier',
    stack: 'Deepgram → GPT-4o → ElevenLabs',
    script: 'Coming soon — HNI concierge experience',
    idealFor: 'Platinum HNI · Private banking · Relationship manager accounts',
    modes: [],
    comingSoon: true,
  },
]

export const MODE_LABELS: Record<RoutingMode, { icon: string; label: string; sub: string; desc: string }> = {
  premium:    { icon: '🎯', label: 'Premium',    sub: 'CRM tier',        desc: 'CRM tier → Gold: Exp 2 · Silver: Exp 3 · Bronze: Exp 5' },
  complexity: { icon: '⚡', label: 'Complexity', sub: 'Intent-driven',   desc: 'Simple intents stay base. Loan/dispute auto-escalate to Exp 3 or 2' },
  sales:      { icon: '💰', label: 'Sales',      sub: 'Revenue trigger', desc: 'Salesforce triggers upsell — eligible customers escalate to Exp 2' },
  hybrid:     { icon: '🔀', label: 'Hybrid',     sub: 'Max of all',      desc: 'max(Premium, Complexity, Sales) — best decision per intent' },
}

export const MODE_RATES: Record<RoutingMode, Record<ExpLevel, number>> = {
  premium:    { 6: 0.38, 5: 0.42, 4: 0.42, 3: 1.48, 2: 1.06, 1: 7.00 },
  complexity: { 6: 0.55, 5: 0.72, 4: 0.68, 3: 1.48, 2: 1.06, 1: 7.00 },
  sales:      { 6: 0.65, 5: 0.86, 4: 0.82, 3: 1.48, 2: 1.06, 1: 7.00 },
  hybrid:     { 6: 0.72, 5: 0.95, 4: 0.90, 3: 1.48, 2: 1.06, 1: 7.00 },
}

export const INTENTS: Record<IntentKey, Intent> = {
  balance:   { key: 'balance',   text: 'I want to check my account balance',    response: 'Your account balance is ₹1,42,500. Savings account ending 4521.', compExp: 5, salesExp: 5 },
  statement: { key: 'statement', text: 'Can you show me my last transactions',  response: 'Last 5: ₹4,500 Amazon · ₹1,200 Swiggy · ₹25,000 salary. Send to email?', compExp: 5, salesExp: 5 },
  block:     { key: 'block',     text: 'I need to block my debit card',         response: 'Card ending 4521 blocked. Confirmation SMS sent to registered number.', compExp: 5, salesExp: 5 },
  cheque:    { key: 'cheque',    text: 'Please order a new cheque book',        response: 'Cheque book requested. Expected delivery: 5–7 working days.', compExp: 5, salesExp: 5 },
  loan:      { key: 'loan',      text: "I'd like to apply for a personal loan", response: 'Eligible for personal loan up to ₹8,00,000 at 10.5% p.a. Proceed?', compExp: 3, salesExp: 3 },
  credit:    { key: 'credit',    text: 'Tell me about credit card offers',      response: 'Pre-approved: HDFC Regalia · ₹5L limit · 5x reward points. Initiate?', compExp: 3, salesExp: 2 },
}

export const INTENT_KEYS: IntentKey[] = ['balance', 'statement', 'block', 'cheque', 'loan', 'credit']

export const EXP_COLOR: Record<ExpLevel, string> = {
  6: '#0ea5e9', 5: '#6366f1', 4: '#8b5cf6', 3: '#06b6d4', 2: '#f59e0b', 1: '#ec4899',
}

export const MODE_COLOR: Record<RoutingMode, { border: string; text: string; bg: string; start: string; startText: string }> = {
  premium:    { border: '#3370e8', text: '#80aaf4', bg: 'rgba(51,112,232,.12)',  start: '#18c48a', startText: '#050e1a' },
  complexity: { border: '#8a4ee8', text: '#b094f8', bg: 'rgba(138,78,232,.12)', start: '#8a4ee8', startText: '#fff' },
  sales:      { border: '#e06828', text: '#f4a060', bg: 'rgba(224,104,40,.12)', start: '#e06828', startText: '#fff' },
  hybrid:     { border: '#e03868', text: '#f47898', bg: 'rgba(224,56,104,.12)', start: '#e03868', startText: '#fff' },
}

export const REVEAL_TIMINGS = {
  cards: 800, industry: 5500, journey: 10500, security: 15500, deployment: 20500,
}

export const USD_RATE = 0.012

// ── Simplified Journey Stages ──────────────────────────────────────────────

export const JOURNEY_STAGES: JourneyStage[] = [
  { key: 'explore', label: 'Explore',  sublabel: 'You are here',   infra: 'shared',  deploy: 'cloud', isFree: true },
  { key: 'try',     label: 'Try',      sublabel: 'FREE · 30 min',  infra: 'secure',  deploy: 'hybrid', isFree: true },
  { key: 'pilot',   label: 'Pilot',    sublabel: 'Your SIP',       infra: 'premium', deploy: 'cloud' },
  { key: 'launch',  label: 'Launch',   sublabel: 'Go Live',        infra: 'owned',   deploy: 'onprem' },
]

// ── Infra display config ───────────────────────────────────────────────────

export const INFRA_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  shared:  { icon: '🔒', label: 'Shared',       color: '#6366f1' },
  secure:  { icon: '🔒', label: 'Secure',       color: '#06b6d4' },
  premium: { icon: '🛡', label: 'Premium',      color: '#f59e0b' },
  owned:   { icon: '🏛', label: 'Fully Owned',  color: '#22c55e' },
}

export const DEPLOY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  cloud:  { icon: '☁',  label: 'Cloud',    color: '#6366f1' },
  hybrid: { icon: '🔄', label: 'Hybrid',   color: '#06b6d4' },
  onprem: { icon: '🏢', label: 'On-Prem',  color: '#f59e0b' },
}

// ── Currency Rates (relative to INR) ───────────────────────────────────────

export const CURRENCY_CONFIG: Record<Currency, { symbol: string; label: string; rate: number; flag: string }> = {
  inr: { symbol: '₹',  label: 'INR', rate: 1,       flag: '🇮🇳' },
  usd: { symbol: '$',  label: 'USD', rate: 0.012,   flag: '🇺🇸' },
  eur: { symbol: '€',  label: 'EUR', rate: 0.011,   flag: '🇪🇺' },
  gbp: { symbol: '£',  label: 'GBP', rate: 0.0095,  flag: '🇬🇧' },
  aed: { symbol: 'د.إ', label: 'AED', rate: 0.044,  flag: '🇦🇪' },
  sgd: { symbol: 'S$', label: 'SGD', rate: 0.016,   flag: '🇸🇬' },
  jpy: { symbol: '¥',  label: 'JPY', rate: 1.79,    flag: '🇯🇵' },
  aud: { symbol: 'A$', label: 'AUD', rate: 0.019,   flag: '🇦🇺' },
}

// ══════════════════════════════════════════════════════════════════════════════
// 6 Demo Scenarios — voice AI is the star, infra is a footnote
// ══════════════════════════════════════════════════════════════════════════════

export const DEMO_SCENARIOS: DemoScenario[] = [
  // ── SCENARIO 1: Per-Intent Pricing ── Explore stage · Shared · Cloud ──
  {
    id: 0,
    icon: '⚡',
    title: 'Per-Intent Pricing',
    industryFirst: 'INDUSTRY FIRST #1',
    pitch: [
      'Your IVR charges per minute. Every second costs you — even hold time, even silence.',
      'Converse AI charges per intent resolved. One question answered = one intent = one price.',
    ],
    suggestedPhrase: 'I want to check my account balance',
    steps: [
      'Ask: "I want to check my account balance"',
      'Ask: "Show me my last 3 transactions"',
      'Ask: "What is my savings rate?"',
    ],
    exp: 5,
    mode: 'premium',
    journeyStage: 'explore',
    infra: 'shared',
    infraIcon: '🔒',
    infraLabel: 'Shared services, DB, and VM',
    deploy: 'cloud',
    deployIcon: '☁',
    deployLabel: 'Cloud hosted by Converse',
    dataResides: 'Converse shared DB',
    infraFootnote: 'Explore stage · Shared infrastructure · Cloud hosted',
    postBadgeTitle: 'Per-Intent Pricing',
    postBadgeBody: 'You paid for one resolved intent. Not per minute. Not per call. Per intent.',
    tradCostComparison: 'Traditional IVR: ~₹2.50/min × 35s = ₹1.46',
    nextPrompt: [
      'That was a standard savings account customer. But what happens when a Gold-tier wealth management customer calls? Should they get the same basic agent?',
      'In your Try stage, you\'d have your own dedicated database with CRM data isolated — let\'s see what that experience looks like.',
    ],
    nextButtonLabel: 'Try Customer Value Routing →',
  },
  // ── SCENARIO 2: Customer Value Routing ── Try stage · Secure · Hybrid ──
  {
    id: 1,
    icon: '🎯',
    title: 'Customer Value Routing',
    industryFirst: 'INDUSTRY FIRST #2',
    pitch: [
      'Not every customer deserves the same AI. A prepaid user checking balance doesn\'t need the same agent as a Gold-tier customer managing ₹50L in investments.',
      'Watch the system detect the customer\'s CRM value and switch to a premium voice agent — live, mid-call.',
    ],
    suggestedPhrase: 'I want to check my account balance',
    steps: [
      'Ask: "I am a Gold member, check my account balance"',
      'Ask: "Tell me about my wealth management portfolio"',
      'Ask: "Send me a detailed statement by email"',
    ],
    exp: 5,
    mode: 'premium',
    journeyStage: 'try',
    infra: 'secure',
    infraIcon: '🔒',
    infraLabel: 'Your own dedicated DB · Shared services and VM',
    deploy: 'hybrid',
    deployIcon: '🔄',
    deployLabel: 'Cloud AI + On-prem data',
    dataResides: 'Your own DB — CRM data on your network',
    infraFootnote: 'Try stage · Secure (dedicated DB) · Hybrid deployment',
    postBadgeTitle: 'Customer Value Routing',
    postBadgeBody: 'Your HNI customer gets 3x better experience for only 2.5x the cost. Automatic. Every call.',
    tradCostComparison: 'Basic ₹0.42 vs Premium ₹1.06 — 3x better for 2.5x cost',
    nextPrompt: [
      'That routing was based on who the customer is. But what about what they ask?',
      'What if a basic customer starts simple — then suddenly asks about a personal loan? Should the cheap agent struggle with it?',
      'In your Pilot stage, you\'d have dedicated services and dedicated database — your own compute handling real SIP traffic. Let\'s see the AI escalate mid-call.',
    ],
    nextButtonLabel: 'Try In-Call Escalation →',
  },
  // ── SCENARIO 3: In-Call Escalation ── Pilot stage · Premium · Cloud ──
  {
    id: 2,
    icon: '🔥',
    title: 'In-Call Escalation',
    industryFirst: 'INDUSTRY FIRST #3',
    pitch: [
      'Start with the cheapest agent — ₹0.38/intent. Ask something simple like "check my balance."',
      'Then ask something complex: "I want to apply for a personal loan." Watch the system detect the complexity spike and upgrade the agent — live, in the same call. No transfer. No hold music.',
    ],
    suggestedPhrase: 'Check my balance — then ask about a personal loan',
    steps: [
      'Ask: "Check my account balance"',
      'Ask: "I want to apply for a personal loan, I have called many times and I am very upset"',
      'Ask: "What is the EMI for ₹45 lakh over 20 years?"',
    ],
    exp: 6,
    mode: 'complexity',
    journeyStage: 'pilot',
    infra: 'premium',
    infraIcon: '🛡',
    infraLabel: 'Dedicated services + dedicated DB',
    deploy: 'cloud',
    deployIcon: '☁',
    deployLabel: 'Your own compute and storage on the cloud',
    dataResides: 'Your own compute + storage',
    infraFootnote: 'Pilot stage · Premium (dedicated svc + DB) · Cloud',
    postBadgeTitle: 'In-Call Escalation',
    postBadgeBody: 'Simple queries stay cheap. Complex queries get the best AI. Per intent. Automatic.',
    tradCostComparison: 'Both on premium = ₹2.96 → Adaptive = ₹1.86 → 37% savings',
    nextPrompt: [
      'So far you\'ve seen routing by customer value and by query complexity. But what about revenue?',
      'What if the AI could detect that a customer is eligible for a credit card upgrade — and switch to a persuasive upsell agent, right there in the call?',
      'In your Launch stage, you\'d have fully owned infrastructure on-premises — complete data sovereignty. Let\'s see sales discovery on production-grade infra.',
    ],
    nextButtonLabel: 'Try Sales Discovery →',
  },
  // ── SCENARIO 4: Sales Discovery ── Launch stage · Owned · On-Prem ──
  {
    id: 3,
    icon: '💰',
    title: 'Sales Discovery',
    industryFirst: 'INDUSTRY FIRST #4',
    pitch: [
      'Your customer calls about their balance. Routine query. But your CRM knows they\'re pre-approved for a Regalia credit card.',
      'Watch the AI detect the sales opportunity and switch to a warm, persuasive agent that handles the upsell — without the customer ever knowing they were routed.',
    ],
    suggestedPhrase: 'Tell me about credit card offers',
    steps: [
      'Ask: "What is my account balance?"',
      'Ask: "Tell me about credit card offers available for me"',
      'Ask: "Yes, go ahead and apply for the card"',
    ],
    exp: 5,
    mode: 'sales',
    journeyStage: 'launch',
    infra: 'owned',
    infraIcon: '🏛',
    infraLabel: 'Full isolation · Your data center, your hardware',
    deploy: 'onprem',
    deployIcon: '🏢',
    deployLabel: 'On-premises — complete data sovereignty',
    dataResides: 'Your data center — your hardware, your network',
    infraFootnote: 'Launch stage · Fully owned · On-premises',
    postBadgeTitle: 'Sales Discovery',
    postBadgeBody: 'Every service call is a revenue opportunity. AI finds it for you.',
    tradCostComparison: '1 intent resolved + 1 upsell = revenue opportunity captured',
    nextPrompt: [
      'You\'ve seen 4 Industry Firsts — all in English. And you\'ve moved through every journey stage: Explore → Try → Pilot → Launch.',
      'But India has 22 official languages. What happens when a customer calls in Hindi, Tamil, or Kannada? See the complete sovereign Indian language stack — at the lowest cost in the industry.',
    ],
    nextButtonLabel: 'Try Indian Language AI →',
    isSimulated: true,
  },
  // ── SCENARIO 5: Indian Language Stack ── Explore stage · Shared · Cloud ──
  {
    id: 4,
    icon: '🇮🇳',
    title: 'Indian Language Stack',
    industryFirst: 'INDUSTRY FIRST #5',
    pitch: [
      'Complete sovereign AI stack. No translation layer. No English intermediary.',
      'Sarvam STT hears your customer. Sarvam LLM understands. Sarvam TTS responds — in the same language, with a natural Indian voice. All at ₹0.38/intent.',
    ],
    suggestedPhrase: 'मेरा बैलेंस बताइए (or speak in any Indian language)',
    steps: [
      'Ask: "Mera balance kya hai?" (Hindi)',
      'Ask: "Mujhe cheque book chahiye" (Hindi)',
      'Ask: "Thank you, that is all" (English — see it switch back)',
    ],
    exp: 6,
    mode: 'premium',
    journeyStage: 'explore',
    infra: 'shared',
    infraIcon: '🔒',
    infraLabel: 'Shared · Sarvam sovereign stack',
    deploy: 'cloud',
    deployIcon: '☁',
    deployLabel: 'Cloud — sovereign AI at base-tier cost',
    dataResides: 'Converse Azure India West — sovereign Indian AI',
    infraFootnote: 'Explore stage · Shared infrastructure · Cloud',
    postBadgeTitle: 'Indian Language Stack',
    postBadgeBody: 'Sovereign. Native. ₹0.38/intent. No translation layer. Same quality as English — same cost.',
    tradCostComparison: '₹0.38/intent — the lowest cost tier in the industry',
    nextPrompt: [
      'You\'ve experienced 5 voice AI Industry Firsts. You also saw your infrastructure change across 4 tiers and 3 deployment models — almost without noticing.',
      'Shared → Secure → Premium → Owned. Cloud → Hybrid → On-Prem. But how fast can you actually switch between them? Most vendors need weeks.',
    ],
    nextButtonLabel: 'Try Live Infrastructure Migration →',
  },
  // ── SCENARIO 6: Infra Migration ── Visual demo (no voice call) ──
  {
    id: 5,
    icon: '🏗',
    title: 'Infra Migration',
    industryFirst: 'INDUSTRY FIRST #6',
    pitch: [
      'You just experienced 4 infrastructure tiers across 5 calls — and you probably didn\'t even notice the switches. That\'s the point.',
      'Data infrastructure upgrade: 15 minutes. Deployment model switch: under 2 hours. Zero downtime. Zero re-integration. Zero tech team.',
      'Try it yourself — click any upgrade below.',
    ],
    suggestedPhrase: '',
    steps: [],
    exp: 5,
    mode: 'premium',
    journeyStage: 'explore',
    infra: 'shared',
    infraIcon: '🏗',
    infraLabel: 'Live migration demo',
    deploy: 'cloud',
    deployIcon: '🏗',
    deployLabel: 'Watch your setup change in real-time',
    dataResides: 'Watch your data move between tiers — live',
    infraFootnote: 'All stages · All tiers · All deployment models',
    postBadgeTitle: 'On-the-Fly Infrastructure Migration',
    postBadgeBody: '15 minutes for data infrastructure. 2 hours for deployment. Zero downtime. No other IVR vendor offers this.',
    tradCostComparison: 'Traditional migration: weeks + dedicated team. Converse: minutes.',
    nextPrompt: [],
    nextButtonLabel: '',
    isSimulated: true,
    isInfraDemo: true,
  },
]

// ── Rotating Conversion CTAs ───────────────────────────────────────────────

export const ROTATING_CTAS: RotatingCTA[] = [
  { message: '6 Industry Firsts. 4 infrastructure tiers. 3 deployment models. Under 5 minutes. Now try with YOUR IVR. Free.' },
  { message: 'Zero integration. In 30 minutes, experience YOUR IVR with AI voice agents. Free.' },
  { message: 'Migrate your IVR in under 30 minutes. Zero tech team. Experience it → then UAT → then production.' },
  { message: 'Create a demo for your next meeting — with YOUR OWN IVR tree. Under 30 minutes. Zero cost.' },
  { message: 'Upload your VoiceXML or give us your IVR number. Your AI-first IVR demo in minutes. Free.' },
]

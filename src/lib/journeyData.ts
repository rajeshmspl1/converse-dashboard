// ══════════════════════════════════════════════════════════════════════════════
// Journey Data — Nudge sentences, industry chips, journey configs
// Source: converse_final.html mockup
// ══════════════════════════════════════════════════════════════════════════════

export type IndustryKey = 'banking' | 'insurance' | 'healthcare' | 'telecom' | 'ecommerce' | 'hospitality'

export interface JourneyConfig {
  name: string
  icon: string
  color: string
  bg: string
  exp: string
  stack: string[]
  price: string
  next: number
  nextName: string
  nextIcon: string
  desc: string
  hint: string
  prices: { l: string; v: string; s: string; c: string }[]
}

// ── Nudge sentences per journey, per industry ────────────────────────────────
// Journey 4 = 'direct' (no suggestions — straight to transcription)
export const SENTENCES: Record<number, Record<string, string[]> | 'direct'> = {
  1: {
    _default: [
      'Give me a mini statement',
      'Where is my order?',
      'I want to upgrade my prepaid plan',
      'I need to book an appointment',
      'What is my claim status?',
      'I want to extend my checkout',
      'Check my account balance',
      'I need a SIM replacement',
      'When will I get my refund?',
      'I want to renew my policy',
      'Where are my lab results?',
      'What is my loan EMI?',
      'I want to return this item',
      'Can I book a spa appointment?',
      'How much data have I used?',
      'How much is my premium?',
    ],
    banking: ['Give me a mini statement', 'Block my credit card', 'What is my loan EMI?', 'Check my account balance', 'Order a cheque book'],
    insurance: ['What is my claim status?', 'I want to renew my policy', 'How much is my premium?', 'I need a new policy'],
    healthcare: ['I need to book an appointment', 'Where are my lab results?', 'Is Dr. Sharma available?', 'I need a prescription refill'],
    telecom: ['I want to upgrade my prepaid plan', 'How much data have I used?', 'I need a new SIM card', 'Activate international roaming'],
    ecommerce: ['Where is my order?', 'I want to return this item', 'When will I get my refund?', 'I need to change my delivery address'],
    hospitality: ['I want to extend my checkout', 'Can I book a spa appointment?', 'I need room service', 'Is late checkout available?'],
  },
  2: 'direct',
  3: {
    _default: [
      'I have called so many times but nothing happens',
      'I visited the branch three times already!',
      'This is so frustrating, nobody ever helps',
      'I have been waiting for two weeks now',
      'I tried calling for my order but it never came',
      'I checked my balance but nobody gave it to me',
      'My claim has been pending for months!',
      'I called five times about my bill, still wrong!',
      'My appointment keeps getting cancelled!',
      'I requested room service twice, nothing happened!',
    ],
    banking: ['I called about my loan three times, no response!', 'I visited the branch twice for my card, still nothing'],
    insurance: ['My claim has been pending for months!', 'Nobody processes my renewal on time'],
    healthcare: ['I have been trying to get an appointment for weeks!', 'My lab results are never ready on time'],
    telecom: ['I called five times about my bill, still wrong!', 'My SIM replacement has taken forever'],
    ecommerce: ['I have been waiting for my refund for three weeks!', 'My order never arrived and nobody helps'],
    hospitality: ['I requested room service twice, nothing happened!', 'My checkout extension was ignored'],
  },
  4: {
    _default: ['Check my account balance', 'What is my claim status?', 'I need to book an appointment', 'I want to upgrade my plan', 'Where is my order?', 'I want to extend my checkout'],
    banking: ['Check my account balance', 'What is my loan EMI?', 'I want a mini statement'],
    insurance: ['What is my claim status?', 'I want to renew my policy'],
    healthcare: ['I need to book an appointment', 'Where are my lab results?'],
    telecom: ['I want to upgrade my plan', 'How much data have I used?'],
    ecommerce: ['Where is my order?', 'I want to return this item'],
    hospitality: ['I want to extend my checkout', 'Book a room for tomorrow'],
  },
}

export const CHIP_DATA: [IndustryKey, string][] = [
  ['banking', '🏦 Banking'],
  ['insurance', '🛡️ Insurance'],
  ['healthcare', '🏥 Healthcare'],
  ['telecom', '📱 Telecom'],
  ['ecommerce', '🛒 E-Commerce'],
  ['hospitality', '🏨 Hospitality'],
]

// ── Journey configs (maps demoStep 0-3 → journey 1-4) ───────────────────────
export const JOURNEY_CONFIGS: Record<number, JourneyConfig> = {
  0: {
    name: 'Lower Cost Per Resolution', icon: '⚡', color: '#00c9b1', bg: 'rgba(0,201,177,.1)',
    exp: 'Exp 5', stack: ['Azure STT', 'GPT-4o-mini', 'Azure TTS'], price: '₹0.42',
    next: 1, nextName: 'Service → Revenue', nextIcon: '💰',
    desc: 'Resolve routine intents in seconds. Pay only when the intent is resolved — not per minute, not per call. Under 40s resolution vs 2.5 min IVR average.',
    hint: 'Say anything — "check my balance", "block my card", "mini statement"',
    prices: [
      { l: 'Resolution', v: '<40s', s: 'vs 2.5 min IVR avg', c: '#00c9b1' },
      { l: 'Per Intent', v: '₹0.42', s: 'pay per resolved', c: '#f5a623' },
      { l: 'Containment', v: '80%+', s: 'vs 25-30% industry', c: '#00de7a' },
    ],
  },
  1: {
    name: 'Turn Service Calls Into Revenue', icon: '💰', color: '#00de7a', bg: 'rgba(0,222,122,.1)',
    exp: 'Exp 5 + CRM', stack: ['Azure STT', 'GPT-4o-mini', 'Azure TTS', 'CRM Agent'], price: 'commission',
    next: 2, nextName: 'Recover Frustrated', nextIcon: '🔥',
    desc: 'Turn service calls into revenue opportunities. Use live CRM context during the call to identify churn-risk, save offers, and cross-sell — without changing your IVR stack. McKinsey: 25–60% of new revenues come from inbound.',
    hint: 'Say "I\'m traveling next week" or "I need a new credit card"',
    prices: [
      { l: 'Detection', v: 'CRM', s: 'Real-time analysis', c: '#00de7a' },
      { l: 'Per Lead', v: 'Flat fee', s: 'Pay per detection', c: '#f5a623' },
      { l: 'Conversion', v: 'Commission', s: 'Pay when converts', c: '#8b5cf6' },
    ],
  },
  2: {
    name: 'Recover Frustrated Calls Live', icon: '🔥', color: '#f03060', bg: 'rgba(240,48,96,.1)',
    exp: 'Exp 5→2', stack: ['Azure STT', 'GPT-4o-mini→Realtime', 'Azure TTS'], price: '₹0.42→₹1.47',
    next: 3, nextName: 'Route by Value', nextIcon: '🎯',
    desc: 'When frustration rises, switch the caller to a more empathetic AI instantly — not to a human, not to hold music. Better AI, not a transfer. CSAT gap: 73% industry → 85%+ with Converse.',
    hint: 'Say "this is taking too long" or "I\'m frustrated" mid-call',
    prices: [
      { l: 'Start', v: 'Exp 5', s: '₹0.47/intent', c: '#3d85e0' },
      { l: 'Detects', v: '😤', s: 'frustration', c: '#f03060' },
      { l: 'Upgrades', v: 'Exp 2', s: '₹1.47 instantly', c: '#f5a623' },
    ],
  },
  3: {
    name: 'Route AI by Customer Value', icon: '🎯', color: '#f5a623', bg: 'rgba(245,166,35,.1)',
    exp: 'Exp 2 (Gold)', stack: ['Azure STT', 'GPT-4o Realtime', 'Azure TTS'], price: '₹1.47',
    next: 0, nextName: 'Lower Cost', nextIcon: '⚡',
    desc: 'Give every caller the right level of AI — based on customer value. Premium customers get richer, more empathetic AI. Lower-value intents stay fast and cost-efficient — automatically.',
    hint: 'Experience premium AI — then try Silver and Bronze',
    prices: [
      { l: '🥇 Gold (Exp 2)', v: '₹1.47', s: '$0.018 · Emotional', c: '#f5a623' },
      { l: '🥈 Silver (Exp 3)', v: '₹1.05', s: '$0.013 · Smart', c: '#c0c0c0' },
      { l: '🥉 Bronze (Exp 5)', v: '₹0.47', s: '$0.006 · Fast', c: '#cd7f32' },
    ],
  },
}

// ── Helper: get sentences for a journey + optional industry filter ────────────
export function getSentences(journeyIdx: number, industry: string | null): string[] {
  const jNum = journeyIdx + 1 // demoStep 0 → journey 1
  const data = SENTENCES[jNum]
  if (data === 'direct') return []
  if (typeof data === 'object') {
    const ind = industry || '_default'
    return data[ind] || data._default || []
  }
  return []
}

// ── Industries list ──────────────────────────────────────────────────────────
export const INDUSTRIES = ['🏦 Banking', '🛡️ Insurance', '🏥 Healthcare', '📱 Telecom', '🛒 E-Commerce', '🏨 Hospitality']

// ── Rotating CTA texts for the hero secondary button ─────────────────────────
export const HERO_ROTATING_TEXTS = [
  '📱 Test Your IVR',
  '📱 Convert Your IVR',
  '📱 Upgrade in 75 Min',
  '📱 Upgrade Your IVR',
]

// ── Journey 4 steps for the journey bar ──────────────────────────────────────
export const JOURNEY_STEPS = [
  { num: 1, icon: '⚡', label: 'Lower Cost' },
  { num: 2, icon: '💰', label: 'Service → Revenue' },
  { num: 3, icon: '🔥', label: 'Recover Frustrated' },
  { num: 4, icon: '🎯', label: 'Route by Value' },
]

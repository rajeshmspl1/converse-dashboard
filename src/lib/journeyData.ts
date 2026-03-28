// ══════════════════════════════════════════════════════════════════════════════
// Journey Data — Nudge sentences, industry chips, journey configs
// Source: converse_final.html mockup + R158 country variants
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
// J1 & J2 share the same neutral intent sentences
// J3 = frustrated sentences
// J4 = neutral for CRM discovery
export const SENTENCES: Record<number, Record<string, string[]>> = {
  1: {
    _default: [
      'Give me a mini statement', 'Where is my order?', 'I want to upgrade my prepaid plan',
      'I need to book an appointment', 'What is my claim status?', 'I want to extend my checkout',
      'Check my account balance', 'I need a SIM replacement', 'When will I get my refund?',
      'I want to renew my policy', 'Where are my lab results?', 'What is my loan EMI?',
      'I want to return this item', 'Can I book a spa appointment?', 'How much data have I used?',
    ],
    banking: ['Give me a mini statement', 'Block my credit card', 'What is my loan EMI?', 'Check my account balance', 'Order a cheque book'],
    insurance: ['What is my claim status?', 'I want to renew my policy', 'How much is my premium?', 'I need a new policy'],
    healthcare: ['I need to book an appointment', 'Where are my lab results?', 'Is Dr. Sharma available?', 'I need a prescription refill'],
    telecom: ['I want to upgrade my prepaid plan', 'How much data have I used?', 'I need a new SIM card', 'Activate international roaming'],
    ecommerce: ['Where is my order?', 'I want to return this item', 'When will I get my refund?', 'I need to change my delivery address'],
    hospitality: ['I want to extend my checkout', 'Can I book a spa appointment?', 'I need room service', 'Is late checkout available?'],
  },
  2: {
    _default: [
      'Give me a mini statement', 'Where is my order?', 'I want to upgrade my prepaid plan',
      'I need to book an appointment', 'What is my claim status?', 'I want to extend my checkout',
      'Check my account balance', 'I need a SIM replacement', 'When will I get my refund?',
    ],
    banking: ['Check my account balance', 'What is my loan EMI?', 'Give me a mini statement', 'Block my credit card'],
    insurance: ['What is my claim status?', 'I want to renew my policy', 'How much is my premium?'],
    healthcare: ['I need to book an appointment', 'Where are my lab results?', 'I need a prescription refill'],
    telecom: ['I want to upgrade my plan', 'How much data have I used?', 'I need a new SIM card'],
    ecommerce: ['Where is my order?', 'I want to return this item', 'When will I get my refund?'],
    hospitality: ['I want to extend my checkout', 'Can I book a spa appointment?', 'I need room service'],
  },
  3: {
    _default: [
      'I have called so many times but nothing happens', 'I visited the branch three times already!',
      'This is so frustrating, nobody ever helps', 'I have been waiting for two weeks now',
      'I tried calling for my order but it never came', 'My claim has been pending for months!',
      'I called five times about my bill, still wrong!', 'My appointment keeps getting cancelled!',
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

// ── Country-specific sentence overrides ──────────────────────────────────────
// Key: country name (from geo detection) → journey → industry → sentences
// Falls back to SENTENCES (India/default) if country not found
type CountrySentences = Record<string, Record<number, Record<string, string[]>>>

export const COUNTRY_SENTENCES: CountrySentences = {
  'United States': {
    1: {
      banking: ['Check my checking account balance', 'What is my mortgage payment?', 'I need to dispute a charge', 'Transfer funds to my savings', 'What are my CD rates?'],
      insurance: ['What is my deductible?', 'I need to file a claim', 'When does my policy renew?', 'Can I add a driver to my auto policy?'],
      healthcare: ['I need to schedule an appointment', 'Can I get my test results?', 'Is Dr. Johnson available this week?', 'I need to refill my prescription'],
      telecom: ['I want to upgrade my phone plan', 'How much data have I used?', 'I need a replacement phone', 'Can I add a line to my family plan?'],
      ecommerce: ['Where is my package?', 'I want to return this item', 'When will I get my refund?', 'I need to update my shipping address'],
      hospitality: ['I need to extend my stay', 'Can I book a spa treatment?', 'I need valet parking', 'Is early check-in available?'],
    },
    2: {
      banking: ['Check my checking account balance', 'What is my mortgage payment?', 'I need to dispute a charge', 'Show me my recent transactions'],
      insurance: ['What is my deductible?', 'I need to file a claim', 'When does my policy renew?'],
      healthcare: ['I need to schedule an appointment', 'Can I get my test results?', 'I need to refill my prescription'],
      telecom: ['I want to upgrade my phone plan', 'How much data have I used?', 'I need a replacement phone'],
      ecommerce: ['Where is my package?', 'I want to return this item', 'When will I get my refund?'],
      hospitality: ['I need to extend my stay', 'Can I book a spa treatment?', 'I need room service'],
    },
    3: {
      banking: ['I have been on hold for 30 minutes about my mortgage!', 'Your app keeps showing the wrong balance!'],
      insurance: ['My claim has been denied twice with no explanation!', 'I have been waiting for my adjuster for weeks!'],
      healthcare: ['I cannot get through to schedule a simple appointment!', 'My insurance pre-auth has been stuck for a month!'],
      telecom: ['You overcharged me again this month!', 'I have been transferred five times already!'],
      ecommerce: ['My package was supposed to arrive three days ago!', 'Your return process is impossible!'],
      hospitality: ['I complained about the noise and nothing was done!', 'I have been waiting for maintenance for hours!'],
    },
    4: {
      banking: ['Check my checking account balance', 'What is my mortgage payment?', 'Show me my 401k balance'],
      insurance: ['What is my deductible?', 'I need to update my beneficiary'],
      healthcare: ['I need to schedule an appointment', 'What is my copay?'],
      telecom: ['I want to upgrade my plan', 'How much data have I used?'],
      ecommerce: ['Where is my package?', 'I want to return this item'],
      hospitality: ['I need to extend my stay', 'Book a room for this weekend'],
    },
  },
  'United Kingdom': {
    1: {
      banking: ['Check my current account balance', 'What is my mortgage repayment?', 'I need to order a new debit card', 'Transfer to my ISA', 'What are your savings rates?'],
      insurance: ['What is my excess?', 'I need to make a claim', 'When does my cover renew?', 'Can I add breakdown cover?'],
      healthcare: ['I need to book a GP appointment', 'Can I get my blood test results?', 'Is Dr. Patel available?', 'I need to renew my prescription'],
      telecom: ['I want to upgrade my contract', 'How much data have I got left?', 'I need a PAC code to switch', 'Can I add roaming to my plan?'],
      ecommerce: ['Where is my parcel?', 'I want to return this item', 'When will I get my refund?', 'I need to change my delivery slot'],
      hospitality: ['I need to extend my stay', 'Can I book afternoon tea?', 'I need a taxi to the airport', 'Is late checkout available?'],
    },
    2: {
      banking: ['Check my current account balance', 'What is my mortgage repayment?', 'I need to order a new debit card'],
      insurance: ['What is my excess?', 'I need to make a claim', 'When does my cover renew?'],
      healthcare: ['I need to book a GP appointment', 'Can I get my blood test results?', 'I need to renew my prescription'],
      telecom: ['I want to upgrade my contract', 'How much data have I got left?', 'I need a PAC code'],
      ecommerce: ['Where is my parcel?', 'I want to return this item', 'When will I get my refund?'],
      hospitality: ['I need to extend my stay', 'Can I book afternoon tea?', 'I need a taxi to the airport'],
    },
    3: {
      banking: ['I rang three times about my mortgage, nobody called back!', 'Your online banking has been down all week!'],
      insurance: ['My claim has been pending for two months now!', 'Nobody responds to my emails about my policy!'],
      healthcare: ['I have been waiting three weeks for a GP appointment!', 'My referral letter never arrived!'],
      telecom: ['You charged me for roaming I never used!', 'My broadband has been down for a week!'],
      ecommerce: ['My parcel has been lost and nobody is helping!', 'Your returns process is absolutely rubbish!'],
      hospitality: ['The room was filthy and nobody cared!', 'I complained about the noise twice, nothing happened!'],
    },
    4: {
      banking: ['Check my current account balance', 'What is my mortgage repayment?', 'Show me my ISA balance'],
      insurance: ['What is my excess?', 'I want to update my no-claims bonus'],
      healthcare: ['I need to book a GP appointment', 'Where are my test results?'],
      telecom: ['I want to upgrade my contract', 'How much data have I got left?'],
      ecommerce: ['Where is my parcel?', 'I want to return this item'],
      hospitality: ['I need to extend my stay', 'Book a room for the weekend'],
    },
  },
  'United Arab Emirates': {
    1: {
      banking: ['Check my account balance', 'What is my personal loan EMI?', 'I want to block my card', 'Transfer to another Emirates NBD account', 'What are your fixed deposit rates?'],
      insurance: ['What is my claim status?', 'I want to renew my car insurance', 'How much is my health insurance premium?', 'I need travel insurance'],
      healthcare: ['I need to book with Dr. Ahmed', 'Where are my lab results?', 'Does my insurance cover this procedure?', 'I need to refill my medication'],
      telecom: ['I want to upgrade my Etisalat plan', 'How much data have I used?', 'I need a new SIM card', 'Activate roaming for my trip'],
      ecommerce: ['Where is my Noon order?', 'I want to return this item', 'When will I get my refund?', 'Change my delivery to my office'],
      hospitality: ['I need to extend my checkout', 'Can I book a desert safari?', 'I need airport transfer', 'Is pool access included?'],
    },
    2: {
      banking: ['Check my account balance', 'What is my personal loan EMI?', 'I want to block my card'],
      insurance: ['What is my claim status?', 'I want to renew my car insurance', 'How much is my premium?'],
      healthcare: ['I need to book with Dr. Ahmed', 'Where are my lab results?', 'Does my insurance cover this?'],
      telecom: ['I want to upgrade my plan', 'How much data have I used?', 'I need a new SIM card'],
      ecommerce: ['Where is my order?', 'I want to return this item', 'When will I get my refund?'],
      hospitality: ['I need to extend my checkout', 'Can I book a desert safari?', 'I need airport transfer'],
    },
    3: {
      banking: ['I have visited the branch three times for my card replacement!', 'Your mobile app keeps crashing during transfers!'],
      insurance: ['My motor claim has been pending for two months!', 'Nobody answers at your call centre!'],
      healthcare: ['I have been trying to book with a specialist for weeks!', 'My insurance approval is taking forever!'],
      telecom: ['You keep charging me for services I cancelled!', 'My internet has been slow for a week!'],
      ecommerce: ['My delivery was supposed to arrive yesterday!', 'I have been waiting for my refund for three weeks!'],
      hospitality: ['I requested a room change and nothing happened!', 'The AC in my room has not been fixed!'],
    },
    4: {
      banking: ['Check my account balance', 'What is my personal loan EMI?', 'Show me my credit card statement'],
      insurance: ['What is my claim status?', 'I want to add a family member'],
      healthcare: ['I need to book an appointment', 'Where are my lab results?'],
      telecom: ['I want to upgrade my plan', 'How much data have I used?'],
      ecommerce: ['Where is my order?', 'I want to return this item'],
      hospitality: ['I need to extend my checkout', 'Book a room for the weekend'],
    },
  },
  'Singapore': {
    1: {
      banking: ['Check my savings account balance', 'What is my home loan instalment?', 'I need to replace my ATM card', 'Transfer to my DBS account', 'What are your time deposit rates?'],
      insurance: ['What is my claim status?', 'I want to renew my policy', 'How much is my Medishield premium?', 'I need to update my NRIC details'],
      healthcare: ['I need to book a polyclinic appointment', 'Where are my lab results?', 'Is Dr. Tan available?', 'I need to refill my prescription at the pharmacy'],
      telecom: ['I want to upgrade my Singtel plan', 'How much data have I used?', 'I need to port my number', 'Can I add a family line?'],
      ecommerce: ['Where is my Shopee order?', 'I want to return this item', 'When will I get my refund?', 'Change delivery to a locker'],
      hospitality: ['I need to extend my stay', 'Can I book the infinity pool?', 'I need a transfer to MBS', 'Is late checkout available?'],
    },
    2: {
      banking: ['Check my savings account balance', 'What is my home loan instalment?', 'I need to replace my ATM card'],
      insurance: ['What is my claim status?', 'I want to renew my policy', 'How much is my premium?'],
      healthcare: ['I need to book a polyclinic appointment', 'Where are my lab results?', 'I need to refill my prescription'],
      telecom: ['I want to upgrade my plan', 'How much data have I used?', 'I need to port my number'],
      ecommerce: ['Where is my order?', 'I want to return this item', 'When will I get my refund?'],
      hospitality: ['I need to extend my stay', 'Can I book the infinity pool?', 'I need a transfer to the airport'],
    },
    3: {
      banking: ['I have called three times about my credit card dispute!', 'Your iBanking has been down since morning!'],
      insurance: ['My hospitalisation claim has been pending for weeks!', 'Nobody replies to my enquiry!'],
      healthcare: ['I cannot get a polyclinic slot for weeks!', 'My specialist referral letter is still not ready!'],
      telecom: ['You overcharged me on my bill again!', 'My fibre broadband has been down for days!'],
      ecommerce: ['My parcel has been stuck in delivery for a week!', 'Your return process is so troublesome!'],
      hospitality: ['I complained about the noise and nobody came!', 'Room service took over an hour!'],
    },
    4: {
      banking: ['Check my savings account balance', 'What is my home loan instalment?', 'Show me my CPF contribution'],
      insurance: ['What is my claim status?', 'I want to update my beneficiary'],
      healthcare: ['I need to book a polyclinic appointment', 'Where are my test results?'],
      telecom: ['I want to upgrade my plan', 'How much data have I used?'],
      ecommerce: ['Where is my order?', 'I want to return this item'],
      hospitality: ['I need to extend my stay', 'Book a room for the weekend'],
    },
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

// ── Helper: get sentences for a journey + optional industry + country ─────────
export function getSentences(journeyIdx: number, industry: string | null, country?: string | null): string[] {
  const jNum = journeyIdx + 1
  const ind = industry || '_default'

  // India → use base SENTENCES (already India-centric)
  if (country === 'India') {
    const data = SENTENCES[jNum]
    if (typeof data === 'object') return data[ind] || data._default || []
    return []
  }

  // Known country → use country-specific sentences
  if (country && COUNTRY_SENTENCES[country]) {
    const countryData = COUNTRY_SENTENCES[country][jNum]
    if (countryData) {
      const sentences = countryData[ind] || countryData['banking']
      if (sentences?.length) return sentences
    }
  }

  // Unknown/no country → default to US
  const usData = COUNTRY_SENTENCES['United States']?.[jNum]
  if (usData) {
    const sentences = usData[ind] || usData['banking']
    if (sentences?.length) return sentences
  }

  // Final fallback to base SENTENCES
  const data = SENTENCES[jNum]
  if (typeof data === 'object') return data[ind] || data._default || []
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

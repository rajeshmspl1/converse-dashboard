export type ExpLevel = 1 | 2 | 3 | 4 | 5 | 6
export type RoutingMode = 'premium' | 'complexity' | 'sales' | 'hybrid'
export type Currency = 'inr' | 'usd' | 'eur' | 'gbp' | 'aed' | 'sgd' | 'jpy' | 'aud'
export type CallStatus = 'idle' | 'active' | 'ended'
export type IntentKey = 'balance' | 'statement' | 'block' | 'cheque' | 'loan' | 'credit'
export type InfraLevel = 'shared' | 'secure' | 'premium' | 'owned'
export type DeployModel = 'cloud' | 'hybrid' | 'onprem'
export type JourneyStageKey = 'explore' | 'try' | 'pilot' | 'launch'

export interface Experience {
  level: ExpLevel
  badge: string
  name: string
  persona: string
  stack: string
  script: string
  idealFor?: string
  modes: RoutingMode[]
  comingSoon?: boolean
}

export interface Intent {
  key: IntentKey
  text: string
  response: string
  compExp: ExpLevel
  salesExp: ExpLevel
}

export interface IntentEvent {
  key: IntentKey
  text: string
  resolvedExp: ExpLevel
  cost: number
  latencyMs: number
  wasPromoted: boolean
  timestamp: number
}

export interface CallSession {
  id: string
  startedAt: number
  endedAt?: number
  mode: RoutingMode
  baseExp: ExpLevel
  events: IntentEvent[]
  totalCost: number
}

export interface CumulativeStats {
  calls: number
  intents: number
  totalCost: number
  avgCostPerIntent: number
  avgDurationSec: number
}

export type RevealStep = 'focus' | 'cards' | 'industry' | 'journey' | 'security' | 'deployment'

export interface DemoScenario {
  id: number
  icon: string
  title: string
  industryFirst: string
  pitch: string[]
  suggestedPhrase: string
  steps: string[]           // ← guided prompts shown in right panel during call
  exp: ExpLevel
  mode: RoutingMode
  journeyStage: JourneyStageKey
  infra: InfraLevel
  infraIcon: string
  infraLabel: string
  deploy: DeployModel
  deployIcon: string
  deployLabel: string
  dataResides: string
  infraFootnote: string
  postBadgeTitle: string
  postBadgeBody: string
  tradCostComparison: string
  nextPrompt: string[]
  nextButtonLabel: string
  isSimulated?: boolean
  isInfraDemo?: boolean
}

export interface RotatingCTA {
  message: string
}

export interface JourneyStage {
  key: JourneyStageKey
  label: string
  sublabel: string
  infra: InfraLevel
  deploy: DeployModel
  isFree?: boolean
}

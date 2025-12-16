export interface DataPoint {
  time: string;
  price: number;
  volume: number;
  ma7?: number;
  ma25?: number;
}

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD'
}

export enum TrendDirection {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  NEUTRAL = 'NEUTRAL'
}

export interface AIAnalysisResult {
  id: string; // Unique ID for tracking
  symbol: string;
  currentPrice: number;
  signal: SignalType;
  confidence: number; // 0-100
  trend: TrendDirection;
  patternsDetected: string[];
  keySupport: number;
  keyResistance: number;
  reasoning: string;
  timestamp: string;
}

export interface Asset {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
}

export type TradeOutcome = 'WIN' | 'LOSS';

export interface HistoryItem extends AIAnalysisResult {
  outcome: TradeOutcome;
  closedAt: string;
}

// --- TYPES FOR AUTH & SUBSCRIPTION ---

export type UserPlan = 'FREE' | 'PREMIUM';

export interface UserProfile {
  email: string;
  plan: UserPlan;
  premiumExpiry: string | null; // ISO Date string
  credits: number;
  lastCreditReset: string; // ISO Date string
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}
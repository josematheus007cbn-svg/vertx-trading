import React from 'react';
import { AIAnalysisResult, SignalType, TrendDirection, TradeOutcome } from '../types';
import { TEXTS } from '../constants';
import { ArrowUpRight, ArrowDownRight, Minus, Target, ShieldAlert, ThumbsUp, ThumbsDown, CheckCircle, Clock, Activity } from 'lucide-react';

interface SignalPanelProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
  onRegisterResult: (outcome: TradeOutcome) => void;
  hasVoted: boolean;
  cooldown: number;
  progress?: number;
  status?: string;
}

const SignalPanel: React.FC<SignalPanelProps> = ({ analysis, loading, onAnalyze, onRegisterResult, hasVoted, cooldown, progress = 0, status = '' }) => {
  const t = TEXTS;
  const isButtonDisabled = loading || cooldown > 0;

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-bg-card rounded-lg border border-border text-center min-h-[350px] animate-in fade-in duration-300">
         <div className="relative mb-6">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary relative z-10 animate-float">
                <path d="M2 12h3l3-8 4 16 3-8h7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
         </div>
         
         <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Análise em Andamento</h3>
         <p className="text-xs text-text-muted mb-6 max-w-[200px] leading-relaxed min-h-[40px]">
             {status || t.generating}
         </p>

         {/* Progress Bar */}
         <div className="w-full max-w-[200px] h-1.5 bg-bg-subtle rounded-full overflow-hidden mb-2">
             <div 
                className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${progress}%` }}
             ></div>
         </div>
         <span className="text-[10px] font-mono text-primary font-bold">{Math.round(progress)}%</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-bg-card rounded-lg border border-border text-center min-h-[250px] md:min-h-[300px]">
        <Activity className="w-10 h-10 md:w-12 md:h-12 text-primary mb-4 opacity-50" />
        <p className="text-text-muted text-sm mb-6">{t.select_asset}</p>
        <button
          onClick={onAnalyze}
          disabled={isButtonDisabled}
          className={`w-full md:w-auto px-6 py-3 bg-primary text-black text-sm font-bold rounded-md hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 active:shadow-inner ${isButtonDisabled ? 'opacity-50' : ''}`}
        >
          {cooldown > 0 ? `${t.wait} ${cooldown}s` : t.generate_btn}
        </button>
      </div>
    );
  }

  const getSignalColor = (signal: SignalType) => {
    switch (signal) {
      case SignalType.BUY: return 'text-primary border-primary/20 bg-primary-dim';
      case SignalType.SELL: return 'text-red-500 border-red-500/20 bg-red-500/10';
      default: return 'text-text-muted border-border bg-bg-subtle';
    }
  };

  const getSignalTranslation = (signal: SignalType) => {
    switch (signal) {
      case SignalType.BUY: return t.buy;
      case SignalType.SELL: return t.sell;
      default: return t.hold;
    }
  };

  const getTrendIcon = (trend: TrendDirection) => {
    switch (trend) {
      case TrendDirection.BULLISH: return <ArrowUpRight className="w-5 h-5" />;
      case TrendDirection.BEARISH: return <ArrowDownRight className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getTrendTranslation = (trend: TrendDirection) => {
      switch(trend) {
          case TrendDirection.BULLISH: return t.trend_high;
          case TrendDirection.BEARISH: return t.trend_low;
          default: return t.trend_neutral;
      }
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Main Signal Card */}
      <div className={`p-4 md:p-6 rounded-lg border relative overflow-hidden ${getSignalColor(analysis.signal)}`}>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="text-[9px] md:text-[10px] font-mono opacity-80 uppercase tracking-widest">{t.recommendation}</span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter mt-1">{getSignalTranslation(analysis.signal)}</h2>
          </div>
          <div className="text-right">
            <span className="text-[9px] md:text-[10px] font-mono opacity-80 uppercase tracking-widest">{t.confidence}</span>
            <div className="text-2xl md:text-3xl font-black tracking-tighter mt-1">{analysis.confidence}%</div>
          </div>
        </div>

        <div className="mt-4 md:mt-6 flex items-center gap-2 md:gap-3 relative z-10 border-t border-white/10 pt-3 md:pt-4">
           {getTrendIcon(analysis.trend)}
           <span className="font-mono text-[10px] md:text-xs uppercase tracking-wider font-bold">
               {t.trend} {getTrendTranslation(analysis.trend)}
           </span>
        </div>
      </div>

      {/* Vote Buttons */}
      {!hasVoted && analysis.signal !== SignalType.HOLD && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onRegisterResult('WIN')}
            className="py-3 md:py-2.5 bg-bg-card border border-primary/30 text-primary hover:bg-primary-dim rounded-md flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all active:scale-95"
          >
            <ThumbsUp size={14} />
            {t.win}
          </button>
          <button
            onClick={() => onRegisterResult('LOSS')}
            className="py-3 md:py-2.5 bg-bg-card border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-md flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all active:scale-95"
          >
            <ThumbsDown size={14} />
            {t.loss}
          </button>
        </div>
      )}

      {hasVoted && (
         <div className="py-2.5 bg-bg-card border border-border text-primary text-xs rounded-md flex items-center justify-center gap-2 font-medium">
            <CheckCircle size={14} />
            {t.registered}
         </div>
      )}

      {/* Analysis Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-card p-3 md:p-4 rounded-lg border border-border">
             <div className="flex items-center gap-2 mb-1 md:mb-2 text-text-muted">
                <Target size={14} />
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold">{t.resistance}</span>
             </div>
             <p className="text-red-400 font-mono font-medium text-sm md:text-base">${analysis.keyResistance}</p>
        </div>
        <div className="bg-bg-card p-3 md:p-4 rounded-lg border border-border">
             <div className="flex items-center gap-2 mb-1 md:mb-2 text-text-muted">
                <ShieldAlert size={14} />
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold">{t.support}</span>
             </div>
             <p className="text-primary font-mono font-medium text-sm md:text-base">${analysis.keySupport}</p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Activity size={14} />
            <span className="text-[10px] uppercase tracking-wider font-bold">{t.analysis_title}</span>
          </div>
          <p className="text-text-muted text-xs leading-relaxed">
            {analysis.reasoning}
          </p>
          
          <div className="mt-3 flex flex-wrap gap-1.5">
            {analysis.patternsDetected.map((pattern, i) => (
                <span key={i} className="px-2 py-0.5 bg-bg-subtle text-text-muted text-[9px] md:text-[10px] rounded border border-border">
                    {pattern}
                </span>
            ))}
          </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={isButtonDisabled}
        className={`w-full py-3.5 bg-white text-black font-bold text-sm rounded-md shadow-lg shadow-white/10 hover:shadow-white/25 hover:bg-gray-50 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 active:shadow-inner flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-1 ${isButtonDisabled ? 'opacity-50' : ''}`}
      >
        {cooldown > 0 ? (
            <>
                <Clock size={16} />
                {t.wait} {cooldown}s
            </>
        ) : (
            t.generate_btn
        )}
      </button>
    </div>
  );
};

export default React.memo(SignalPanel);
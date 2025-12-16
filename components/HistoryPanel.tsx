import React, { useState, useMemo } from 'react';
import { HistoryItem, SignalType } from '../types';
import { TEXTS } from '../constants';
import { History, TrendingUp, TrendingDown, Target, Trash2, X, Filter, Zap, Trophy, BarChart3, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryPanelProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClearHistory, onDeleteItem }) => {
  const t = TEXTS;
  
  // Local Filter State
  const [filterAsset, setFilterAsset] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');

  // Derive unique assets for filter
  const uniqueAssets = useMemo(() => Array.from(new Set(history.map(item => item.symbol))), [history]);

  // Apply filters
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
        if (filterAsset !== 'all' && item.symbol !== filterAsset) return false;
        if (filterOutcome !== 'all' && item.outcome !== filterOutcome.toUpperCase()) return false;
        return true;
    }).slice().reverse(); // Show newest first
  }, [history, filterAsset, filterOutcome]);

  // Calculate Advanced Statistics based on FULL history (not filtered, usually metrics are global)
  const stats = useMemo(() => {
      const totalTrades = history.length;
      if (totalTrades === 0) return { wins: 0, winRate: 0, streak: 0, bestAsset: '-', avgConfWins: 0 };

      const wins = history.filter(h => h.outcome === 'WIN');
      const winRate = Math.round((wins.length / totalTrades) * 100);
      
      // Calculate Streak (Current Streak)
      let streak = 0;
      let streakType = '';
      if (history.length > 0) {
          const reversed = [...history].reverse(); // Newest first
          streakType = reversed[0].outcome;
          for (const item of reversed) {
              if (item.outcome === streakType) streak++;
              else break;
          }
      }

      // Calculate Best Asset (Highest Win Rate with at least 2 trades)
      const assetPerformance: {[key: string]: {wins: number, total: number}} = {};
      history.forEach(h => {
          if (!assetPerformance[h.symbol]) assetPerformance[h.symbol] = {wins: 0, total: 0};
          assetPerformance[h.symbol].total++;
          if (h.outcome === 'WIN') assetPerformance[h.symbol].wins++;
      });
      
      let bestAsset = '-';
      let bestRate = -1;
      
      Object.keys(assetPerformance).forEach(symbol => {
          const perf = assetPerformance[symbol];
          if (perf.total >= 1) { // Simple logic, can require more trades
              const rate = perf.wins / perf.total;
              if (rate > bestRate) {
                  bestRate = rate;
                  bestAsset = symbol;
              }
          }
      });

      // Avg Confidence on Wins
      const totalWinConf = wins.reduce((sum, item) => sum + item.confidence, 0);
      const avgConfWins = wins.length > 0 ? Math.round(totalWinConf / wins.length) : 0;

      return { wins: wins.length, winRate, streak, streakType, bestAsset, avgConfWins };
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted bg-bg-card rounded-lg border border-border">
        <History className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">{t.empty_history}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="text-primary" size={20} />
            {t.history}
        </h3>
        <div className="flex items-center gap-2">
            <button
                onClick={onClearHistory}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-md transition-colors"
            >
                <Trash2 size={14} />
                {t.clear_all}
            </button>
        </div>
      </div>

      {/* Advanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {/* Total / Win Rate */}
        <div className="bg-bg-card border border-border p-3 md:p-4 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><BarChart3 size={40} /></div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">{t.win_rate}</div>
            <div className={`text-xl md:text-2xl font-mono font-bold ${stats.winRate >= 50 ? 'text-primary' : 'text-red-500'}`}>
                {stats.winRate}%
            </div>
            <div className="text-[10px] text-text-muted mt-1">{stats.wins} / {history.length} Wins</div>
        </div>

        {/* Streak */}
        <div className="bg-bg-card border border-border p-3 md:p-4 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={40} /></div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">{t.streak}</div>
            <div className={`text-xl md:text-2xl font-mono font-bold flex items-center gap-2 ${stats.streakType === 'WIN' ? 'text-primary' : 'text-red-500'}`}>
                {stats.streak} <span className="text-xs">{stats.streakType === 'WIN' ? 'W' : 'L'}</span>
            </div>
            <div className="text-[10px] text-text-muted mt-1">{t.status}</div>
        </div>

        {/* Best Asset */}
        <div className="bg-bg-card border border-border p-3 md:p-4 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy size={40} /></div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">{t.best_asset}</div>
            <div className="text-lg md:text-xl font-mono font-bold text-white truncate">
                {stats.bestAsset}
            </div>
            <div className="text-[10px] text-text-muted mt-1">Alta Precisão</div>
        </div>

        {/* Avg Confidence */}
        <div className="bg-bg-card border border-border p-3 md:p-4 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={40} /></div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">{t.avg_conf}</div>
            <div className="text-xl md:text-2xl font-mono font-bold text-primary">
                {stats.avgConfWins}%
            </div>
            <div className="text-[10px] text-text-muted mt-1">Em Vitórias</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-bg-card/50 p-3 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase font-bold px-1">
              <Filter size={14} />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
              {/* Asset Filter */}
              <div className="relative">
                  <select 
                    value={filterAsset}
                    onChange={(e) => setFilterAsset(e.target.value)}
                    className="w-full bg-bg-card text-text-main text-xs font-medium border border-border rounded-md px-3 py-2 appearance-none focus:outline-none focus:border-primary/50"
                  >
                      <option value="all">{t.all} Ativos</option>
                      {uniqueAssets.map(asset => (
                          <option key={asset} value={asset}>{asset}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-text-muted pointer-events-none" size={14} />
              </div>

              {/* Outcome Filter */}
              <div className="relative">
                  <select 
                    value={filterOutcome}
                    onChange={(e) => setFilterOutcome(e.target.value)}
                    className="w-full bg-bg-card text-text-main text-xs font-medium border border-border rounded-md px-3 py-2 appearance-none focus:outline-none focus:border-primary/50"
                  >
                      <option value="all">{t.all} Resultados</option>
                      <option value="win">{t.win}</option>
                      <option value="loss">{t.loss}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-text-muted pointer-events-none" size={14} />
              </div>
          </div>
      </div>

      {/* Filtered List */}
      <div className="bg-bg-card border border-border rounded-lg overflow-hidden min-h-[200px]">
        {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
                <Filter size={24} className="mb-2 opacity-50" />
                <p className="text-xs">{t.no_data_filter}</p>
            </div>
        ) : (
            <>
                {/* Mobile View: Cards */}
                <div className="md:hidden divide-y divide-border">
                    {filteredHistory.map((item) => (
                        <div key={item.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-bg-subtle/50 active:bg-bg-subtle transition-colors group relative">
                            <div className="flex items-start gap-3">
                                <div className={`w-1 h-10 rounded-full ${item.signal === SignalType.BUY ? 'bg-primary' : 'bg-red-500'}`}></div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white">{item.symbol}</span>
                                        <span className="text-[10px] text-text-muted font-mono">{format(new Date(item.timestamp), 'dd/MM HH:mm')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold ${item.signal === SignalType.BUY ? 'text-primary' : 'text-red-500'}`}>
                                            {item.signal === SignalType.BUY ? t.buy : t.sell}
                                        </span>
                                        <span className="text-[10px] text-text-muted">{t.conf}: {item.confidence}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className={`px-2 py-1 rounded text-xs font-black flex items-center gap-1 ${
                                    item.outcome === 'WIN' 
                                        ? 'bg-primary-dim text-primary border border-primary/20' 
                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}>
                                    {item.outcome === 'WIN' ? t.win : t.loss}
                                    {item.outcome === 'WIN' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                                    className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-bg-subtle text-text-muted border-b border-border">
                            <tr>
                                <th className="px-6 py-3 font-medium uppercase tracking-wider">{t.time}</th>
                                <th className="px-6 py-3 font-medium uppercase tracking-wider">{t.asset}</th>
                                <th className="px-6 py-3 font-medium uppercase tracking-wider">{t.signal}</th>
                                <th className="px-6 py-3 font-medium uppercase tracking-wider">{t.conf}</th>
                                <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">{t.result}</th>
                                <th className="px-4 py-3 font-medium uppercase tracking-wider text-right w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-bg-subtle transition-colors group">
                                    <td className="px-6 py-3 text-text-muted font-mono">
                                        {format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm')}
                                    </td>
                                    <td className="px-6 py-3 font-bold text-white">
                                        {item.symbol}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                            item.signal === SignalType.BUY ? 'border-primary/30 text-primary bg-primary-dim' : 
                                            item.signal === SignalType.SELL ? 'border-red-500/30 text-red-500 bg-red-500/10' : 'border-border text-text-muted'
                                        }`}>
                                            {item.signal === SignalType.BUY ? t.buy : item.signal === SignalType.SELL ? t.sell : t.hold}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-text-muted font-mono">
                                        {item.confidence}%
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className={`inline-flex items-center gap-1 font-bold ${
                                            item.outcome === 'WIN' ? 'text-primary' : 'text-red-500'
                                        }`}>
                                            {item.outcome === 'WIN' ? (
                                                <>{t.win} <TrendingUp size={12} className="ml-1" /></>
                                            ) : (
                                                <>{t.loss} <TrendingDown size={12} className="ml-1" /></>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => onDeleteItem(item.id)}
                                            className="p-1 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remover item"
                                        >
                                            <X size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default React.memo(HistoryPanel);
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DataPoint, Asset, AIAnalysisResult, HistoryItem, TradeOutcome, SignalType, UserProfile, AuthState } from './types';
import { ASSETS, generateInitialData, TEXTS } from './constants';
import { analyzeMarketData } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { checkTimeIntegrity } from './services/antiFraudService';
import MarketChart from './components/MarketChart';
import SignalPanel from './components/SignalPanel';
import HistoryPanel from './components/HistoryPanel';
import AuthScreen from './components/AuthScreen';
import PremiumPanel from './components/PremiumPanel';
import { TrendingUp, History as HistoryIcon, CheckCircle, Activity, X, ArrowUpRight, ArrowDownRight, Minus, Sun, Moon, Volume2, VolumeX, AlertTriangle, Crown, Lock, ShieldAlert, Clock, Info, Settings, LogOut } from 'lucide-react';

// --- COMPONENTS ---

// Optimized Asset Selector with Locking Logic
const AssetSelector = React.memo(({ assets, currentAsset, onSelect, isPremium }: { assets: Asset[], currentAsset: Asset, onSelect: (a: Asset) => void, isPremium: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
        const selectedBtn = containerRef.current.querySelector(`[data-active="true"]`);
        if (selectedBtn) {
            selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [currentAsset]);

  return (
    <div className="relative w-full">
        {/* Gradients to indicate scrollability */}
        <div className="absolute left-0 top-0 bottom-0 w-6 md:w-8 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 md:w-8 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
        
        <div 
            ref={containerRef}
            className="flex gap-2 overflow-x-auto pb-2 md:pb-4 pt-1 px-3 md:px-4 scrollbar-none snap-x snap-mandatory touch-pan-x"
            style={{ scrollPaddingLeft: '50%', scrollPaddingRight: '50%' }} // Helps centering
        >
        {assets.map(asset => {
            const isActive = currentAsset.symbol === asset.symbol;
            // FREE TIER LOCK: Lock everything except BTC/USD if not premium
            const isLocked = !isPremium && asset.symbol !== 'BTC/USD';

            return (
                <button
                key={asset.symbol}
                data-active={isActive}
                onClick={() => !isLocked && onSelect(asset)}
                disabled={isLocked}
                className={`
                    flex-shrink-0 snap-center 
                    px-4 md:px-5 py-2 rounded-full 
                    text-xs font-mono font-bold tracking-tight
                    transition-all duration-300 border select-none 
                    flex items-center gap-2 relative overflow-hidden
                    ${isActive
                    ? 'bg-bg-card border-primary text-primary shadow-[0_0_15px_-4px_rgba(16,185,129,0.3)] scale-105 transform'
                    : isLocked 
                        ? 'bg-bg-subtle/20 border-border/50 text-text-muted opacity-60 cursor-not-allowed'
                        : 'bg-bg-card/40 border-white/5 text-text-muted hover:border-primary/30 hover:text-primary/80 active:scale-95'
                    }
                `}
                >
                <span className={isActive ? 'opacity-100' : 'opacity-70'}>{asset.symbol}</span>
                {isLocked && <Lock size={10} className="text-text-muted" />}
                {isActive && !isLocked && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                </button>
            )
        })}
        </div>
    </div>
  );
});

const StatCard = React.memo(({ label, value }: { label: string, value: string }) => (
    <div className="bg-bg-card border border-border p-2 md:p-3 rounded-lg transition-colors hover:border-primary/20 flex flex-col justify-center h-full">
        <p className="text-[9px] md:text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-1">{label}</p>
        <p className="text-sm md:text-base font-mono font-medium text-text-main truncate">{value}</p>
    </div>
));

const App: React.FC = () => {
  // --- AUTH STATE (Supabase) ---
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [authLoading, setAuthLoading] = useState(true);

  // --- ANTI-FRAUD STATE ---
  const [isTimeTampered, setIsTimeTampered] = useState(false);
  const [timeDiffData, setTimeDiffData] = useState<{device?: Date, server?: Date} | null>(null);

  const [currentAsset, setCurrentAsset] = useState<Asset>(ASSETS[0]);
  const [data, setData] = useState<DataPoint[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');

  const [cooldown, setCooldown] = useState(0); 
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [timeUntilReset, setTimeUntilReset] = useState<string>(''); // For countdown
  
  const t = TEXTS;

  // Sound State
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('vertx_sound_enabled');
        return saved !== 'false';
    }
    return true;
  });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('vertx_trade_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    return [];
  });
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State for settings menu
  const settingsMenuRef = useRef<HTMLDivElement>(null); // Ref for click outside

  const [activeTab, setActiveTab] = useState<'market' | 'history' | 'premium'>('market');
  const [hasVotedCurrent, setHasVotedCurrent] = useState(false);
  
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'buy' | 'sell' | 'neutral';
  }>({ show: false, title: '', message: '', type: 'neutral' });

  const dataIntervalRef = useRef<number | null>(null);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- ANTI-FRAUD CHECKER ---
  useEffect(() => {
    const runSecurityCheck = async () => {
        const result = await checkTimeIntegrity();
        if (result.tampered) {
            setIsTimeTampered(true);
            setTimeDiffData({ device: result.deviceTime, server: result.serverTime });
            // Força parada de intervalos críticos
            if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);
        } else {
            // Se estava bloqueado e normalizou (ex: corrigiu a hora), desbloqueia
            setIsTimeTampered(false);
        }
    };

    // Check on mount
    runSecurityCheck();

    // Check every 30 seconds
    const interval = setInterval(runSecurityCheck, 30000);

    // Check on visibility change (user comes back to app)
    const handleVisibilityChange = () => {
        if (!document.hidden) runSecurityCheck();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  // --- SUPABASE AUTH LISTENER ---
  useEffect(() => {
    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        handleSessionUpdate(session);
      })
      .catch((err) => {
        console.error("Session check failed", err);
        setAuthLoading(false);
      });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionUpdate(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSessionUpdate = async (session: any) => {
    if (session) {
        const metadata = session.user.user_metadata || {};
        
        let plan = metadata.plan || 'FREE';
        let premiumExpiry = metadata.premiumExpiry || null;
        const credits = metadata.credits !== undefined ? metadata.credits : 15;
        const lastCreditReset = metadata.lastCreditReset || new Date().toISOString();

        // --- VERIFICAÇÃO CRÍTICA DE EXPIRAÇÃO NO LOGIN/RESTAURAÇÃO ---
        if (plan === 'PREMIUM' && premiumExpiry) {
            const expiryDate = new Date(premiumExpiry);
            const now = new Date();

            if (now > expiryDate) {
                console.log("Detectada expiração durante o carregamento. Rebaixando usuário.");
                plan = 'FREE';
                premiumExpiry = null;
                await supabase.auth.updateUser({
                    data: { plan: 'FREE', premiumExpiry: null }
                });
            }
        }

        if (!metadata.plan || metadata.credits === undefined) {
             const updates = { plan, credits, lastCreditReset };
             supabase.auth.updateUser({ data: updates });
        }

        setAuth({
            isAuthenticated: true,
            user: {
                email: session.user.email!,
                plan: plan as any,
                premiumExpiry: premiumExpiry,
                credits: credits,
                lastCreditReset: lastCreditReset
            }
        });
    } else {
        setAuth({ isAuthenticated: false, user: null });
    }
    setAuthLoading(false);
  };

  // --- SYNC CREDITS (4h Reset) ---
  useEffect(() => {
      if (!auth.isAuthenticated || !auth.user || isTimeTampered) return;

      const checkReset = async () => {
          const now = new Date();
          const lastReset = new Date(auth.user!.lastCreditReset);
          const diffMs = now.getTime() - lastReset.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          // RESET TIME CHANGED TO 4 HOURS
          if (diffHours >= 4) {
              const newCredits = 15; // INCREASED TO 15
              const newReset = now.toISOString();

              const { error } = await supabase.auth.updateUser({
                  data: { credits: newCredits, lastCreditReset: newReset }
              });

              if (!error) {
                  setAuth(prev => prev.user ? ({
                      ...prev,
                      user: { ...prev.user, credits: newCredits, lastCreditReset: newReset }
                  }) : prev);
                  
                  setNotification({ show: true, title: 'Créditos Restaurados', message: 'Seus 15 sinais foram restaurados.', type: 'neutral' });
              }
          }
      };

      checkReset();
      const interval = setInterval(checkReset, 60000); 
      return () => clearInterval(interval);
  }, [auth.isAuthenticated, isTimeTampered]); 

  // --- COUNTDOWN TIMER (Chronometer for Credits) ---
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) return;

    const timer = setInterval(() => {
        const lastReset = new Date(auth.user!.lastCreditReset);
        const nextReset = new Date(lastReset.getTime() + (4 * 60 * 60 * 1000)); // 4 Hours
        const now = new Date();
        const diff = nextReset.getTime() - now.getTime();

        if (diff <= 0) {
            setTimeUntilReset('00:00:00');
        } else {
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [auth.user]);

  // --- HANDLE UNLOCK PREMIUM (SYSTEM IMPLEMENTATION) ---
  const handleUnlockPremium = async (code: string): Promise<boolean> => {
      if (isTimeTampered) return false;
      
      const regex = /^VERTX-TRAD-[A-Z0-9]{4}-[A-Z0-9]{4}-30$/;
      
      if (!regex.test(code)) {
          setNotification({ show: true, title: 'Formato Inválido', message: 'O código deve seguir o padrão VERTX-TRAD.', type: 'neutral' });
          return false;
      }

      if (!auth.user) return false;

      try {
          const { data: codeData, error: fetchError } = await supabase
              .from('premium_codes')
              .select('*')
              .eq('code', code)
              .single();

          if (fetchError || !codeData) {
               console.warn("Código não encontrado:", fetchError);
               setNotification({ show: true, title: 'Código Inválido', message: 'Código não encontrado no sistema.', type: 'neutral' });
               return false;
          }

          if (codeData.is_used) {
               setNotification({ show: true, title: 'Código Usado', message: 'Este código já foi ativado anteriormente.', type: 'neutral' });
               return false;
          }

          const { error: updateError } = await supabase
            .from('premium_codes')
            .update({ 
                is_used: true, 
                used_by: auth.user.email,
                used_at: new Date().toISOString() 
            })
            .eq('code', code);

          if (updateError) {
              throw new Error("Falha ao atualizar status do código");
          }

          const now = new Date();
          let currentExpiry = auth.user.premiumExpiry ? new Date(auth.user.premiumExpiry) : new Date();
          if (currentExpiry < now) currentExpiry = now;

          const newExpiryDate = new Date(currentExpiry);
          newExpiryDate.setDate(newExpiryDate.getDate() + 30); // ADD 30 DAYS (1 MONTH)
          
          const expiryString = newExpiryDate.toISOString();

          const { error: userError } = await supabase.auth.updateUser({
              data: { plan: 'PREMIUM', premiumExpiry: expiryString }
          });

          if (!userError) {
              setAuth(prev => prev.user ? ({
                  ...prev,
                  user: { ...prev.user, plan: 'PREMIUM', premiumExpiry: expiryString }
              }) : prev);

              setNotification({
                  show: true,
                  title: 'Premium Ativado',
                  message: 'Bem-vindo ao Vertx Premium. Todos os recursos liberados.',
                  type: 'success'
              });
              return true;
          }
      } catch (err) {
          console.error("Erro no processo de ativação:", err);
          setNotification({ show: true, title: 'Erro no Sistema', message: 'Não foi possível processar a ativação. Tente novamente.', type: 'neutral' });
      }
      
      return false;
  };

  // --- CHECK PREMIUM EXPIRY (REAL-TIME DOWNGRADE) ---
  useEffect(() => {
    // Só executa se o usuário for Premium e não houver fraude de tempo
    if (auth.user?.plan !== 'PREMIUM' || !auth.user.premiumExpiry || isTimeTampered) return;

    const checkExpiry = async () => {
        const expiryDate = new Date(auth.user!.premiumExpiry!);
        const now = new Date();

        if (now > expiryDate) {
            console.log("Premium expirado em tempo real. Rebaixando usuário...");
            
            // Atualiza no Supabase
            const { error } = await supabase.auth.updateUser({
                data: { plan: 'FREE', premiumExpiry: null }
            });
            
            if (!error) {
                // Atualiza estado local
                setAuth(prev => prev.user ? ({
                    ...prev,
                    user: { ...prev.user, plan: 'FREE', premiumExpiry: null }
                }) : prev);

                // Se estiver num ativo bloqueado, reseta
                if (currentAsset.symbol !== 'BTC/USD') {
                    setCurrentAsset(ASSETS[0]); 
                }

                setNotification({ 
                    show: true, 
                    title: 'Assinatura Expirada', 
                    message: 'Seu período Premium encerrou. Você retornou ao plano Gratuito.', 
                    type: 'neutral' 
                });
            }
        }
    };

    // Executa a verificação imediatamente
    checkExpiry();

    // E configura um intervalo para verificar a cada segundo
    const interval = setInterval(checkExpiry, 1000);

    return () => clearInterval(interval);
  }, [auth.user, currentAsset, isTimeTampered]);


  // Initialize Data
  useEffect(() => {
    if (isTimeTampered) return;
    const initialData = generateInitialData(currentAsset.basePrice);
    setData(initialData);
    setAnalysis(null); 
    setHasVotedCurrent(false);
  }, [currentAsset, isTimeTampered]);

  // Persist settings
  useEffect(() => { localStorage.setItem('vertx_trade_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('vertx_sound_enabled', String(soundEnabled)); }, [soundEnabled]);
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleSound = () => setSoundEnabled(prev => !prev);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      setTimeout(() => { ctx.close(); }, 700);
    } catch (e) {
      console.error('Error generating audio', e);
    }
  }, [soundEnabled]);

  // Live Market Data Simulation
  useEffect(() => {
    if (isTimeTampered) return;
    if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);
    dataIntervalRef.current = window.setInterval(() => {
      setData(prevData => {
        const lastPoint = prevData[prevData.length - 1];
        const now = new Date();
        const change = (Math.random() - 0.5) * (currentAsset.basePrice * 0.001 * currentAsset.volatility); 
        let newPrice = lastPoint.price + change;
        newPrice = Math.max(0.01, newPrice); 
        const newPoint: DataPoint = {
          time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
          price: Number(newPrice.toFixed(2)),
          volume: Math.floor(Math.random() * 500) + 50,
        };
        const newData = prevData.slice(1);
        newData.push(newPoint);
        return newData;
      });
    }, 1000); 
    return () => { if (dataIntervalRef.current) clearInterval(dataIntervalRef.current); };
  }, [currentAsset, isTimeTampered]);

  useEffect(() => {
    if (notification.show) {
        const timer = setTimeout(() => { setNotification(prev => ({ ...prev, show: false })); }, 5000);
        return () => clearTimeout(timer);
    }
  }, [notification.show]);

  useEffect(() => {
    let interval: number;
    if (cooldown > 0) {
      interval = window.setInterval(() => { setCooldown(prev => (prev > 0 ? prev - 1 : 0)); }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleAnalyze = useCallback(async () => {
    if (isAnalyzing || cooldown > 0 || !auth.user || isTimeTampered) return;

    // Check Credits (If Free)
    if (auth.user.plan === 'FREE') {
        if (auth.user.credits <= 0) {
            setNotification({ show: true, title: t.no_credits, message: t.no_credits_desc, type: 'neutral' });
            return;
        }
        // Deduct Credit via Supabase
        const newCredits = auth.user.credits - 1;
        const { error } = await supabase.auth.updateUser({
            data: { credits: newCredits }
        });
        
        if (error) {
             setNotification({ show: true, title: 'Erro de Sincronização', message: 'Não foi possível atualizar seus créditos.', type: 'neutral' });
             return;
        }

        // Optimistic update
        setAuth(prev => prev.user ? ({
             ...prev,
             user: { ...prev.user, credits: newCredits }
        }) : prev);
    }

    // Start Simulation Process (50s - 60s)
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStatus("Iniciando conexão com servidores de análise...");

    const totalDuration = Math.floor(Math.random() * (60000 - 50000 + 1)) + 50000; // 50s to 60s
    const startTime = Date.now();
    const isPremium = auth.user.plan === 'PREMIUM';

    // Timer Loop
    const updateInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const rawPercent = (elapsed / totalDuration) * 100;
        const progress = Math.min(rawPercent, 99); // Hold at 99% until data is ready

        setAnalysisProgress(progress);

        // Dynamic Status Updates to simulate "Deep Analysis"
        if (progress < 15) {
            setAnalysisStatus("Coletando dados do livro de ofertas e volume...");
        } else if (progress < 30) {
            setAnalysisStatus(`Analisando estrutura de mercado do ${currentAsset.symbol}...`);
        } else if (progress < 45) {
            setAnalysisStatus("Calculando indicadores técnicos (RSI, EMA, MACD, Bollinger)...");
        } else if (progress < 60) {
            setAnalysisStatus("Detectando padrões de velas e fractais de tempo...");
        } else if (progress < 75) {
            setAnalysisStatus("Consultando Rede Neural Gemini AI & Modelos Preditivos...");
        } else if (progress < 90) {
            setAnalysisStatus("Cruzando dados com sentimento de mercado global...");
        } else {
            setAnalysisStatus("Validando probabilidade estatística e gerando sinal final...");
        }

        // Finish
        if (elapsed >= totalDuration) {
            clearInterval(updateInterval);
            
            // Actual API Call (happens at the end so it uses fresh data)
            const result = await analyzeMarketData(currentAsset.symbol, data, isPremium);
            
            setAnalysis(result);
            setHasVotedCurrent(false);
            setIsAnalyzing(false);
            setAnalysisProgress(100);
            setCooldown(30); 
            
            let notifType: 'buy' | 'sell' | 'neutral' = 'neutral';
            if (result.signal === SignalType.BUY) notifType = 'buy';
            if (result.signal === SignalType.SELL) notifType = 'sell';

            if (result.confidence > 0) {
                playSound();
                setNotification({ 
                    show: true, 
                    title: t.notif_signal,
                    message: `${result.signal === 'BUY' ? t.buy : result.signal === 'SELL' ? t.sell : t.hold} - ${currentAsset.symbol}`,
                    type: notifType
                });
            } else {
                setNotification({ show: true, title: 'Erro', message: result.reasoning, type: 'neutral' });
                setCooldown(5);
            }
        }
    }, 200); // Update UI every 200ms

  }, [currentAsset, data, isAnalyzing, cooldown, playSound, t, auth, isTimeTampered]);

  const handleRegisterResult = useCallback((outcome: TradeOutcome) => {
    if (!analysis) return;
    const historyItem: HistoryItem = { ...analysis, outcome, closedAt: new Date().toISOString() };
    setHistory(prev => [...prev, historyItem]);
    setHasVotedCurrent(true);
    setNotification({ 
        show: true, 
        title: t.notif_success,
        message: `${outcome === 'WIN' ? t.win : t.loss} ${t.registered.toLowerCase()}.`,
        type: 'success'
    });
  }, [analysis, t]);

  // Request to clear history (opens modal)
  const handleRequestClearHistory = useCallback(() => {
      setIsClearHistoryModalOpen(true);
  }, []);

  // Actually clear history
  const handleConfirmClearHistory = useCallback(() => {
      setHistory([]);
      localStorage.removeItem('vertx_trade_history'); // Force clear persistence
      setIsClearHistoryModalOpen(false);
      setNotification({ show: true, title: t.history, message: t.notif_cleared, type: 'neutral' });
  }, [t]);

  const handleDeleteItem = useCallback((id: string) => {
      setHistory(prev => prev.filter(item => item.id !== id));
      setNotification({ show: true, title: t.notif_removed, message: '', type: 'neutral' });
  }, [t]);

  const stats = useMemo(() => {
     if (data.length === 0) return { max: 0, min: 0, vol: 0 };
     let max = 0, min = Number.MAX_VALUE, vol = 0;
     for(const d of data) {
         if(d.price > max) max = d.price;
         if(d.price < min) min = d.price;
         vol += d.volume;
     }
     return { max, min, vol };
  }, [data]);

  const renderNotification = () => {
    const styles = {
        success: { border: 'border-primary', icon: <CheckCircle className="text-primary" size={20} />, bg: 'shadow-primary/10' },
        buy: { border: 'border-primary', icon: <ArrowUpRight className="text-primary" size={20} />, bg: 'shadow-primary/10' },
        sell: { border: 'border-red-500', icon: <ArrowDownRight className="text-red-500" size={20} />, bg: 'shadow-red-500/10' },
        neutral: { border: 'border-text-muted', icon: <Minus className="text-text-muted" size={20} />, bg: 'shadow-gray-500/10' },
    };
    const style = styles[notification.type];
    return (
        <div className={`fixed top-24 right-4 md:right-6 z-[100] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] transform ${
            notification.show ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 -translate-y-2 scale-[0.98] blur-sm pointer-events-none'
        }`}>
            <div className={`bg-bg-card/95 backdrop-blur-xl border-l-4 ${style.border} border-y border-r border-border/50 text-text-main p-4 rounded-lg shadow-2xl ${style.bg} flex items-start gap-3 min-w-[300px] max-w-[90vw] md:max-w-sm relative overflow-hidden group`}>
                <div className="absolute inset-0 bg-gradient-to-r from-bg-subtle/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="mt-0.5 p-1.5 bg-bg-subtle rounded-md border border-border">{style.icon}</div>
                <div className="flex-1 pr-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1 text-text-muted">{notification.title}</h4>
                    <p className="text-sm font-medium leading-tight text-text-main">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(prev => ({...prev, show: false}))} className="absolute top-2 right-2 p-1 text-text-muted hover:text-text-main transition-colors"><X size={14} /></button>
                {notification.show && ( <div className="absolute bottom-0 left-0 h-0.5 bg-current w-full opacity-30 origin-left animate-[shrink_5s_linear_forwards]" style={{ color: style.border.replace('border-', 'var(--') }} /> )}
            </div>
        </div>
    );
  };

  // --- RENDER AUTH SCREEN IF NOT LOGGED IN ---
  if (authLoading) {
      return (
          <div className="min-h-screen bg-bg flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative z-10 flex flex-col items-center gap-6">
                  <Activity size={32} className="animate-spin text-primary" />
              </div>
          </div>
      );
  }

  if (!auth.isAuthenticated) {
      return <AuthScreen />;
  }

  // --- FRAUD DETECTION LOCK SCREEN ---
  if (isTimeTampered) {
      return (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
              <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6 animate-pulse">
                  <ShieldAlert className="text-red-500" size={48} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-4">{t.security_alert}</h1>
              <p className="text-text-muted max-w-md mb-8 leading-relaxed">
                  {t.time_manipulation_desc}
              </p>
              
              <div className="bg-bg-card border border-red-500/20 rounded-xl p-6 w-full max-w-sm mb-8">
                   <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                       <span className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                           <Clock size={14} /> {t.device_time}
                       </span>
                       <span className="font-mono text-red-400">
                           {timeDiffData?.device?.toLocaleTimeString()}
                       </span>
                   </div>
                   <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                           <Clock size={14} /> {t.server_time} (Est.)
                       </span>
                       <span className="font-mono text-primary">
                           {timeDiffData?.server?.toLocaleTimeString() || "Syncing..."}
                       </span>
                   </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm font-medium animate-pulse">
                  {t.time_sync_required}
              </div>
          </div>
      );
  }

  const isPremium = auth.user?.plan === 'PREMIUM';

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-primary-dim selection:text-primary pb-10 overflow-x-hidden transition-colors duration-300 flex flex-col">
      
      {/* Important Info Modal */}
      {isInfoModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in" 
                onClick={() => setIsInfoModalOpen(false)} 
             />
             <div className="relative bg-bg-card border border-yellow-500/30 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                 {/* Header */}
                 <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-yellow-500/5">
                     <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                         <AlertTriangle size={24} />
                     </div>
                     <h3 className="text-lg font-bold text-white tracking-tight">Aviso Importante</h3>
                     <button 
                        onClick={() => setIsInfoModalOpen(false)}
                        className="ml-auto p-2 text-text-muted hover:text-white bg-bg-subtle/50 hover:bg-bg-subtle rounded-md transition-colors"
                     >
                         <X size={20} />
                     </button>
                 </div>
                 
                 {/* Body */}
                 <div className="p-6 overflow-y-auto custom-scrollbar text-sm text-text-muted leading-relaxed space-y-4">
                     <p>
                        O <strong className="text-white">VERTX TRADING</strong> é um aplicativo de geração de sinais de trade utilizando Inteligência Artificial, desenvolvido com base em dados de mercado em tempo real e múltiplas análises avançadas aplicadas a cada ativo. A IA do aplicativo processa diferentes indicadores, padrões e cenários de mercado para gerar sinais com alta probabilidade estatística de acerto, podendo chegar a até 90%, conforme as condições analisadas.
                     </p>
                     <p className="p-3 bg-yellow-500/5 border-l-2 border-yellow-500/50 text-yellow-100/80 rounded-r-md">
                        Entretanto, nenhuma tecnologia ou estratégia de trading é 100% precisa. O mercado financeiro envolve riscos, volatilidade e fatores imprevisíveis. Os sinais fornecidos pelo VERTX TRADING não garantem lucros e devem ser utilizados como ferramenta de apoio à tomada de decisão, e não como recomendação financeira definitiva.
                     </p>
                     <p>
                        O usuário é totalmente responsável pela gestão do seu capital, devendo operar com cautela, controle de risco e apenas valores que esteja disposto a perder.
                     </p>
                 </div>

                 {/* Footer */}
                 <div className="p-4 bg-bg-subtle/50 border-t border-white/5 text-[10px] text-center text-text-muted font-mono uppercase tracking-widest">
                     <p>O VERTX TRADING foi desenvolvido pela Mogin Studios LTD.</p>
                     <p className="mt-1">Todos os direitos reservados © Mogin Studios LTD.</p>
                 </div>
             </div>
         </div>
      )}

      {/* Clear History Modal */}
      {isClearHistoryModalOpen && (
         <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
             <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in" 
                onClick={() => setIsClearHistoryModalOpen(false)} 
             />
             <div className="relative bg-bg-card border border-red-500/30 rounded-xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-slide-up p-6 text-center">
                 <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                     <AlertTriangle className="text-red-500" size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-text-main mb-2">{t.modal_clear_title}</h3>
                 <p className="text-sm text-text-muted mb-6 leading-relaxed">
                     {t.confirm_clear}
                 </p>
                 <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => setIsClearHistoryModalOpen(false)}
                        className="py-2.5 px-4 rounded-lg border border-border text-text-main font-medium text-sm hover:bg-bg-subtle transition-colors"
                     >
                         {t.cancel}
                     </button>
                     <button 
                        onClick={handleConfirmClearHistory}
                        className="py-2.5 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-lg shadow-red-500/20"
                     >
                         {t.yes_clear}
                     </button>
                 </div>
             </div>
         </div>
      )}

      {renderNotification()}

      <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-md supports-[backdrop-filter]:bg-bg/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            
            <svg viewBox="0 0 48 48" className="w-8 h-8 md:w-10 md:h-10 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>
                <path d="M10 18 L24 40 L38 8" stroke="url(#logo-gradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="38" cy="8" r="4" fill="#10b981" className="animate-pulse" />
                <circle cx="10" cy="18" r="3" fill="#ffffff" />
            </svg>

            <div className="flex flex-col">
                <h1 className="text-sm md:text-xl font-black tracking-tighter text-text-main leading-none">
                    VERTX <span className="text-primary">{t.title}</span>
                </h1>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] md:text-[10px] font-mono text-text-muted tracking-widest uppercase mt-0.5">{t.subtitle}</span>
                    {isPremium ? (
                         <span className="text-[9px] bg-primary text-black px-1 rounded font-bold">PRO</span>
                    ) : (
                         <span className="text-[9px] bg-bg-subtle text-text-muted px-1 rounded font-bold border border-border">FREE</span>
                    )}
                </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Settings Dropdown Trigger */}
            <div className="relative" ref={settingsMenuRef}>
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 rounded-md bg-bg-card border border-border text-text-muted hover:text-primary hover:border-primary/50 transition-all active:scale-95"
                >
                    <Settings size={20} />
                </button>

                {/* Dropdown Content */}
                {isSettingsOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                        <div className="p-2 space-y-1">
                            {/* Info */}
                            <button 
                                onClick={() => { setIsInfoModalOpen(true); setIsSettingsOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:text-white hover:bg-bg-subtle rounded-lg transition-colors text-left"
                            >
                                <Info size={16} />
                                <span>Informações</span>
                            </button>
                            
                            {/* Sound */}
                            <button 
                                onClick={toggleSound}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:text-white hover:bg-bg-subtle rounded-lg transition-colors text-left"
                            >
                                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                <span>Sons: {soundEnabled ? 'Ligado' : 'Desligado'}</span>
                            </button>

                            {/* Theme */}
                            <button 
                                onClick={toggleTheme}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:text-white hover:bg-bg-subtle rounded-lg transition-colors text-left"
                            >
                                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                <span>Tema: {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                            </button>
                        </div>
                        
                        <div className="h-px bg-border/50 mx-2" />
                        
                        <div className="p-2">
                            {/* Logout */}
                            <button 
                                onClick={() => { setIsSettingsOpen(false); supabase.auth.signOut(); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-colors text-left font-medium"
                            >
                                <LogOut size={16} />
                                <span>Sair da Conta</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 md:px-6 mt-3 md:mt-8 flex-grow w-full">
        <div className="flex items-center justify-between mb-4 md:mb-6 sticky top-16 md:top-20 z-40 bg-bg pt-2 pb-2 transition-colors duration-300">
            <div className="flex w-full md:w-auto bg-bg-card/90 backdrop-blur-sm p-1 rounded-lg border border-border shadow-sm">
                <button onClick={() => setActiveTab('market')} className={`flex-1 md:flex-none px-4 py-2 text-xs md:text-sm font-medium transition-all rounded-md flex items-center justify-center gap-2 ${activeTab === 'market' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-main'}`}>
                    <TrendingUp size={14} className="md:w-4 md:h-4" />
                    {t.market}
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 md:flex-none px-4 py-2 text-xs md:text-sm font-medium transition-all rounded-md flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-main'}`}>
                    <HistoryIcon size={14} className="md:w-4 md:h-4" />
                    {t.history}
                    {history.length > 0 && ( <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'history' ? 'bg-black/20 text-black' : 'bg-bg-subtle text-text-main border border-border'}`}>{history.length}</span> )}
                </button>
                <button onClick={() => setActiveTab('premium')} className={`flex-1 md:flex-none px-4 py-2 text-xs md:text-sm font-medium transition-all rounded-md flex items-center justify-center gap-2 ${activeTab === 'premium' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-main'}`}>
                    <Crown size={14} className="md:w-4 md:h-4" />
                    {t.premium}
                </button>
            </div>
        </div>

        {activeTab === 'market' && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <AssetSelector assets={ASSETS} currentAsset={currentAsset} onSelect={setCurrentAsset} isPremium={isPremium} />
          </div>
        )}

        {activeTab === 'premium' ? (
            <PremiumPanel onUnlock={handleUnlockPremium} premiumExpiry={auth.user?.premiumExpiry || null} />
        ) : activeTab === 'market' ? (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-3xl font-black text-text-main tracking-tight">{currentAsset.symbol}</h2>
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full animate-pulse-subtle">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase">{t.live}</span>
                            </div>
                        </div>
                        <div className="font-mono text-xl md:text-2xl font-bold text-primary">${data[data.length-1]?.price.toFixed(2)}</div>
                    </div>
                    
                    <MarketChart data={data} symbol={currentAsset.symbol} support={analysis?.keySupport} resistance={analysis?.keyResistance} />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
                        <StatCard label={t.max24h} value={`$${(stats.max * 1.02).toFixed(2)}`} />
                        <StatCard label={t.min24h} value={`$${(stats.min * 0.98).toFixed(2)}`} />
                        <StatCard label={t.volume} value={`${(stats.vol / 1000).toFixed(1)}k`} />
                        <StatCard label={t.volatility} value={`${currentAsset.volatility}%`} />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4 md:mb-6 mt-4 lg:mt-0 justify-between">
                        <div className="flex items-center gap-2">
                            {/* Custom SVG Logo */}
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                                <path d="M2 12h3l3-8 4 16 3-8h7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <h2 className="text-base md:text-lg font-bold text-text-main tracking-tight uppercase">{t.neural_ai}</h2>
                        </div>
                        
                        {/* Credits Counter for Free Tier */}
                        {!isPremium && (
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2 px-3 py-1 bg-bg-card border border-border rounded-full">
                                    <span className="text-[10px] uppercase text-text-muted font-bold">{t.credits_left}:</span>
                                    <span className={`text-xs font-mono font-bold ${auth.user!.credits > 0 ? 'text-primary' : 'text-red-500'}`}>
                                        {auth.user!.credits}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
                                    <Clock size={10} />
                                    <span>Reset: {timeUntilReset}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <SignalPanel 
                        analysis={analysis} 
                        loading={isAnalyzing} 
                        onAnalyze={handleAnalyze} 
                        onRegisterResult={handleRegisterResult}
                        hasVoted={hasVotedCurrent}
                        cooldown={cooldown}
                        progress={analysisProgress}
                        status={analysisStatus}
                    />
                </div>
            </div>
        ) : (
            <HistoryPanel history={history} onClearHistory={handleRequestClearHistory} onDeleteItem={handleDeleteItem} />
        )}

      </div>
      
      {/* Footer with Mogin Studios LTD credits */}
      <footer className="w-full mt-auto py-6 border-t border-border bg-bg-card/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-1">
            <p className="text-[10px] md:text-xs text-text-muted font-mono uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity text-center">
                Créditos reservados para Mogin Studios LTD
            </p>
            <p className="text-[10px] text-text-muted/50 font-mono tracking-wider">
                © {new Date().getFullYear()} Todos os direitos reservados.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
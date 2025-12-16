import React, { useState, useEffect } from 'react';
import { TEXTS } from '../constants';
import { Crown, Check, Key, Activity, Calendar, ShieldCheck, ShoppingCart, ExternalLink, X, AlertTriangle, Clock } from 'lucide-react';

interface PremiumPanelProps {
  onUnlock: (code: string) => Promise<boolean>;
  premiumExpiry: string | null;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const PremiumPanel: React.FC<PremiumPanelProps> = ({ onUnlock, premiumExpiry }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const t = TEXTS;

  const handleSubmit = async () => {
    if (!code) return;
    setLoading(true);
    try {
        const isValid = await onUnlock(code);
        if (isValid) {
            setSuccess(true);
            setError(false);
            setCode(''); 
        } else {
            setError(true);
            setTimeout(() => setError(false), 3000);
        }
    } catch (e) {
        setError(true);
        setTimeout(() => setError(false), 3000);
    } finally {
        setLoading(false);
    }
  };

  const isPremiumActive = premiumExpiry && new Date(premiumExpiry) > new Date();

  // Countdown Logic
  useEffect(() => {
    if (!isPremiumActive || !premiumExpiry) {
        setTimeLeft(null);
        return;
    }

    const calculateTimeLeft = () => {
        const difference = +new Date(premiumExpiry) - +new Date();
        
        if (difference > 0) {
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            });
        } else {
            setTimeLeft(null);
        }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [premiumExpiry, isPremiumActive]);

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* MODAL DE COMPRA */}
        {showBuyModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in" 
                    onClick={() => setShowBuyModal(false)}
                />
                <div className="relative bg-bg-card border border-primary/30 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-bg-subtle/30">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <ShoppingCart size={20} className="text-primary" />
                            Adquirir Premium
                        </h3>
                        <button 
                            onClick={() => setShowBuyModal(false)}
                            className="p-2 text-text-muted hover:text-white rounded-md hover:bg-white/5 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wide">Informação Importante</h4>
                                    <ul className="text-xs text-yellow-100/80 space-y-1.5 list-disc pl-4 leading-relaxed">
                                        <li>
                                            O código será enviado para seu <strong>E-mail</strong> ou <strong>WhatsApp</strong> informado no pagamento.
                                        </li>
                                        <li>
                                            <strong>Prazo de envio:</strong> Até 24 horas (Processamento Manual).
                                        </li>
                                        <li>
                                            <strong>Garantia:</strong> Caso não receba em 24h, você pode solicitar reembolso total.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-sm text-text-muted">
                                O pagamento é processado pela plataforma <strong>Cakto</strong>, garantindo total segurança dos seus dados.
                            </p>
                        </div>

                        <a 
                            href="https://pay.cakto.com.br/3ap2h3c_688091" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-emerald-400 text-black font-bold rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                        >
                            Ir para Pagamento Seguro
                            <ExternalLink size={18} />
                        </a>
                        
                        <div className="flex justify-center items-center gap-2 text-[10px] text-text-muted uppercase tracking-widest opacity-60">
                             <ShieldCheck size={12} />
                             Pagamento Seguro via Cakto
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transition-colors duration-500 ${isPremiumActive ? 'bg-primary shadow-primary/40' : 'bg-gradient-to-br from-primary to-emerald-600 shadow-primary/20'}`}>
                    {isPremiumActive ? <ShieldCheck className="text-black" size={32} /> : <Crown className="text-black" size={32} />}
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">VERTX <span className="text-primary">PREMIUM</span></h2>
                
                {isPremiumActive && timeLeft ? (
                    <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-xl inline-block min-w-[300px] animate-in zoom-in duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
                             <div className="h-full bg-primary animate-[shimmer_2s_infinite]"></div>
                        </div>
                        <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2">Tempo Restante</p>
                        <div className="flex items-center justify-center gap-4 text-white">
                             <div className="flex flex-col items-center">
                                 <span className="font-mono text-2xl font-bold">{timeLeft.days}</span>
                                 <span className="text-[9px] text-text-muted uppercase">Dias</span>
                             </div>
                             <span className="text-primary/50 text-xl font-thin">:</span>
                             <div className="flex flex-col items-center">
                                 <span className="font-mono text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
                                 <span className="text-[9px] text-text-muted uppercase">Hrs</span>
                             </div>
                             <span className="text-primary/50 text-xl font-thin">:</span>
                             <div className="flex flex-col items-center">
                                 <span className="font-mono text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                                 <span className="text-[9px] text-text-muted uppercase">Min</span>
                             </div>
                             <span className="text-primary/50 text-xl font-thin">:</span>
                             <div className="flex flex-col items-center">
                                 <span className="font-mono text-2xl font-bold text-primary">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                                 <span className="text-[9px] text-text-muted uppercase">Seg</span>
                             </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-text-muted text-sm mt-2 max-w-md mx-auto">
                        Desbloqueie o poder total da análise IA. Ferramentas profissionais para resultados profissionais.
                    </p>
                )}
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[t.benefit_1, t.benefit_2, t.benefit_4, "Prioridade na IA"].map((benefit, i) => (
                    <div key={i} className={`bg-bg-card border p-4 rounded-lg flex items-center gap-3 transition-colors ${isPremiumActive ? 'border-primary/20 bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                        <div className={`p-1.5 rounded-full transition-colors ${isPremiumActive ? 'bg-primary text-black' : 'bg-primary/10 text-primary'}`}>
                            <Check size={16} strokeWidth={3} />
                        </div>
                        <span className={`text-sm font-medium ${isPremiumActive ? 'text-white' : 'text-text-main'}`}>{benefit}</span>
                    </div>
                ))}
            </div>

            {/* Price Tag or Status */}
            {!isPremiumActive && (
                <div className="bg-bg-subtle/30 border border-primary/20 rounded-xl p-6 mb-8 relative overflow-hidden flex flex-col items-center gap-4">
                    <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                        MENSAL
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black text-white">R$ 19,90<span className="text-sm text-text-muted font-normal"> / mês</span></div>
                        <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wide">Acesso total por 30 dias</p>
                    </div>
                    
                    <button 
                        onClick={() => setShowBuyModal(true)}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-black font-bold rounded-full shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.6)] hover:bg-emerald-400 transition-all active:scale-95 animate-pulse-subtle"
                    >
                        <ShoppingCart size={18} />
                        Adquirir Código Agora
                    </button>
                </div>
            )}

            {/* Code Input */}
            <div className="bg-bg-card border border-border rounded-xl p-6">
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block flex items-center gap-2">
                    <Key size={14} />
                    {isPremiumActive ? "Estender Assinatura" : t.premium_code}
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                if(success) setSuccess(false);
                            }}
                            placeholder="VERTX-TRAD-XXXX-YYYY-30"
                            className={`w-full bg-bg-subtle border ${error ? 'border-red-500' : 'border-border'} rounded-lg py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-primary transition-colors uppercase`}
                        />
                    </div>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || !code}
                        className={`px-6 py-3 rounded-lg font-bold text-black transition-all active:scale-95 flex items-center justify-center min-w-[140px] ${success ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-bg-subtle text-text-main border border-border hover:border-primary/50 hover:text-white'}`}
                    >
                        {loading ? <Activity className="animate-spin" size={18} /> : success ? "Ativado!" : "Validar Código"}
                    </button>
                </div>
                {error && (
                    <p className="text-red-500 text-xs mt-2 font-medium animate-pulse">{t.code_invalid}</p>
                )}
                {success && (
                     <p className="text-emerald-500 text-xs mt-2 font-medium animate-bounce flex items-center gap-1">
                        <Check size={12} /> {t.code_success}
                     </p>
                )}
            </div>
            
            <p className="text-center text-[10px] text-text-muted mt-6 opacity-60">
                Já tem um código? Digite acima para ativar.
            </p>
        </div>
    </div>
  );
};

export default PremiumPanel;
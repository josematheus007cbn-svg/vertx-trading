import React, { useState } from 'react';
import { TEXTS } from '../constants';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, ChevronRight, Activity, AlertCircle, KeyRound, Check } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false); // Novo estado para recuperação
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const t = TEXTS;

  const getTranslatedError = (msg: string) => {
    if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
    if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
    if (msg.includes("Password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
    if (msg.includes("Email not confirmed")) return "E-mail não confirmado. Verifique sua caixa de entrada.";
    if (msg.includes("invalid claim")) return "Sessão expirada. Tente novamente.";
    if (msg.includes("Too many requests")) return "Muitas tentativas. Aguarde um momento.";
    return "Erro na autenticação. Tente novamente.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Se não estiver recuperando senha, exige senha
    if (!isRecovering && !password) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isRecovering) {
        // --- LÓGICA DE RECUPERAÇÃO ---
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href, // Redireciona para o próprio app
        });

        if (error) throw error;
        setSuccessMsg(t.recover_success);
      } 
      else if (isRegistering) {
        // --- LÓGICA DE CADASTRO ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              credits: 15, // Changed from 10 to 15
              plan: 'FREE',
              lastCreditReset: new Date().toISOString()
            }
          }
        });

        if (error) throw error;
        
        if (data.user) {
             if (data.session) {
                 if(onLoginSuccess) onLoginSuccess();
             } else {
                 setErrorMsg("Conta criada! Verifique seu e-mail para confirmar o acesso.");
                 setIsLoading(false);
                 return;
             }
        }
      } else {
        // --- LÓGICA DE LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMsg(getTranslatedError(error.message || ""));
    } finally {
      setIsLoading(false);
    }
  };

  // Reseta estados ao trocar de modo
  const toggleMode = (mode: 'login' | 'register' | 'recovery') => {
      setErrorMsg('');
      setSuccessMsg('');
      setIsLoading(false);
      
      if (mode === 'recovery') {
          setIsRecovering(true);
          setIsRegistering(false);
      } else if (mode === 'register') {
          setIsRecovering(false);
          setIsRegistering(true);
      } else {
          setIsRecovering(false);
          setIsRegistering(false);
      }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-10">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary blur-lg opacity-40"></div>
                 <svg viewBox="0 0 48 48" className="w-16 h-16 relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="logo-auth-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>
                    <path d="M10 18 L24 40 L38 8" stroke="url(#logo-auth-gradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="38" cy="8" r="4" fill="#10b981" className="animate-pulse" />
                    <circle cx="10" cy="18" r="3" fill="#ffffff" />
                </svg>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">VERTX <span className="text-primary">TRADING</span></h1>
            <p className="text-xs font-mono text-text-muted uppercase tracking-[0.3em] mt-1">Portal de Acesso ao Sistema</p>
        </div>

        <div className="bg-zinc-900/80 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                {isRecovering ? t.recover_title : isRegistering ? t.create_acc : t.login_title}
            </h2>
            
            {isRecovering && (
                <p className="text-xs text-text-muted mb-6">{t.recover_desc}</p>
            )}
            {!isRecovering && <div className="mb-6"></div>}

            {errorMsg && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}
            
            {successMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                    <Check size={16} className="shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-text-muted font-bold ml-1">{t.email}</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
                            placeholder="usuario@vertx.com"
                            required
                        />
                    </div>
                </div>

                {!isRecovering && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-text-muted font-bold ml-1">{t.password}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        {/* Link Esqueceu a senha - Apenas no modo Login */}
                        {!isRegistering && (
                            <div className="flex justify-end pt-1">
                                <button
                                    type="button"
                                    onClick={() => toggleMode('recovery')}
                                    className="text-[10px] text-text-muted hover:text-primary transition-colors"
                                >
                                    {t.forgot_password}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-emerald-400 text-black font-bold py-3.5 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Activity className="animate-spin" />
                    ) : (
                        <>
                            {isRecovering ? (
                                <>
                                    <KeyRound size={18} />
                                    {t.recover_btn}
                                </>
                            ) : isRegistering ? (
                                <>
                                    {t.register_btn}
                                    <ChevronRight size={18} />
                                </>
                            ) : (
                                <>
                                    {t.login_btn}
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                {isRecovering ? (
                    <button 
                        onClick={() => toggleMode('login')}
                        className="text-xs text-text-muted hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                        <ChevronRight size={12} className="rotate-180" />
                        {t.back_login}
                    </button>
                ) : (
                    <button 
                        onClick={() => toggleMode(isRegistering ? 'login' : 'register')}
                        className="text-xs text-text-muted hover:text-white transition-colors"
                    >
                        {isRegistering ? "Já tem uma conta? Entrar" : "Novo acesso? Criar Conta"}
                    </button>
                )}
            </div>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-2 text-[10px] text-text-muted font-mono opacity-50">
            <div className="flex gap-4">
                <span>CRIPTOGRAFIA SEGURA</span>
                <span>•</span>
                <span>V 2.5.0</span>
            </div>
            <span className="mt-1">Créditos reservados para Mogin Studios LTD</span>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
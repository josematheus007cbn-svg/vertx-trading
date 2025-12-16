
import { Asset } from './types';
import { format } from 'date-fns';

export const ASSETS: Asset[] = [
  // --- POPULAR / MAJORS ---
  { symbol: 'BTC/USD', name: 'Bitcoin', basePrice: 65000, volatility: 150 },
  { symbol: 'ETH/USD', name: 'Ethereum', basePrice: 3500, volatility: 20 },
  { symbol: 'EUR/USD', name: 'Euro/USD', basePrice: 1.08, volatility: 0.002 },
  { symbol: 'GBP/USD', name: 'Libra/USD', basePrice: 1.27, volatility: 0.002 },
  { symbol: 'USD/JPY', name: 'USD/Iene', basePrice: 151.0, volatility: 0.2 },
  { symbol: 'XAU/USD', name: 'Ouro', basePrice: 2300, volatility: 5 },

  // --- CRYPTO / MEME / TRENDING ---
  { symbol: 'SHIB/USD', name: 'Shiba Inu', basePrice: 0.000025, volatility: 0.000001 },
  { symbol: 'LABUBU', name: 'Labubu Token', basePrice: 12.50, volatility: 1.5 },

  // --- STOCKS & COMMODITIES ---
  { symbol: 'APPLE', name: 'Apple Inc.', basePrice: 220.0, volatility: 1.2 },
  { symbol: 'URANIUM', name: 'Urânio Spot', basePrice: 85.0, volatility: 0.8 },
  { symbol: 'OURO/PRATA', name: 'Ouro/Prata Ratio', basePrice: 83.5, volatility: 0.4 },

  // --- BRAZIL & LATAM ---
  { symbol: 'USD/BRL', name: 'USD/Real', basePrice: 5.15, volatility: 0.02 },
  { symbol: 'USD/MXN', name: 'USD/Peso Mex.', basePrice: 16.50, volatility: 0.05 },
  { symbol: 'USD/COP', name: 'USD/Peso Col.', basePrice: 3850, volatility: 15 },

  // --- AUD PAIRS ---
  { symbol: 'AUD/CAD', name: 'Dólar Aus/CAD', basePrice: 0.90, volatility: 0.003 },
  { symbol: 'AUD/CHF', name: 'Dólar Aus/Franco', basePrice: 0.59, volatility: 0.002 },
  { symbol: 'AUD/JPY', name: 'Dólar Aus/Iene', basePrice: 100.5, volatility: 0.15 },
  { symbol: 'AUD/NZD', name: 'Dólar Aus/Neo.Z', basePrice: 1.09, volatility: 0.002 },
  { symbol: 'AUD/USD', name: 'Dólar Aus/USD', basePrice: 0.65, volatility: 0.002 },

  // --- CAD PAIRS ---
  { symbol: 'CAD/CHF', name: 'CAD/Franco', basePrice: 0.65, volatility: 0.002 },
  { symbol: 'CAD/JPY', name: 'CAD/Iene', basePrice: 110.0, volatility: 0.15 },
  { symbol: 'USD/CAD', name: 'USD/CAD', basePrice: 1.36, volatility: 0.003 },
  { symbol: 'NZD/CAD', name: 'Neo.Z/CAD', basePrice: 0.82, volatility: 0.002 },
  { symbol: 'EUR/CAD', name: 'Euro/CAD', basePrice: 1.48, volatility: 0.003 },
  { symbol: 'GBP/CAD', name: 'Libra/CAD', basePrice: 1.72, volatility: 0.004 },

  // --- CHF PAIRS ---
  { symbol: 'CHF/JPY', name: 'Franco/Iene', basePrice: 168.0, volatility: 0.2 },
  { symbol: 'USD/CHF', name: 'USD/Franco', basePrice: 0.91, volatility: 0.002 },
  { symbol: 'EUR/CHF', name: 'Euro/Franco', basePrice: 0.97, volatility: 0.002 },
  { symbol: 'GBP/CHF', name: 'Libra/Franco', basePrice: 1.13, volatility: 0.003 },

  // --- EUR PAIRS ---
  { symbol: 'EUR/AUD', name: 'Euro/Dólar Aus', basePrice: 1.65, volatility: 0.004 },
  { symbol: 'EUR/GBP', name: 'Euro/Libra', basePrice: 0.85, volatility: 0.001 },
  { symbol: 'EUR/JPY', name: 'Euro/Iene', basePrice: 163.0, volatility: 0.2 },
  { symbol: 'EUR/NZD', name: 'Euro/Neo.Z', basePrice: 1.80, volatility: 0.005 },
  { symbol: 'EUR/THB', name: 'Euro/Baht', basePrice: 39.5, volatility: 0.1 },

  // --- GBP PAIRS ---
  { symbol: 'GBP/AUD', name: 'Libra/Dólar Aus', basePrice: 1.92, volatility: 0.005 },
  { symbol: 'GBP/JPY', name: 'Libra/Iene', basePrice: 191.0, volatility: 0.25 },
  { symbol: 'GBP/NZD', name: 'Libra/Neo.Z', basePrice: 2.10, volatility: 0.006 },

  // --- JPY PAIRS (Others) ---
  { symbol: 'NOK/JPY', name: 'Coroa Nor/Iene', basePrice: 14.0, volatility: 0.05 },
  { symbol: 'NZD/JPY', name: 'Neo.Z/Iene', basePrice: 91.0, volatility: 0.15 },

  // --- EXOTICS & OTHERS ---
  { symbol: 'USD/HKD', name: 'USD/Dólar HK', basePrice: 7.83, volatility: 0.001 },
  { symbol: 'USD/INR', name: 'USD/Rúpia', basePrice: 83.5, volatility: 0.05 },
  { symbol: 'USD/NOK', name: 'USD/Coroa Nor', basePrice: 10.9, volatility: 0.03 },
  { symbol: 'USD/PLN', name: 'USD/Zloty', basePrice: 3.95, volatility: 0.01 },
  { symbol: 'USD/SEK', name: 'USD/Coroa Sue', basePrice: 10.8, volatility: 0.03 },
  { symbol: 'USD/SGD', name: 'USD/Dólar Sing', basePrice: 1.35, volatility: 0.002 },
  { symbol: 'USD/THB', name: 'USD/Baht', basePrice: 36.8, volatility: 0.05 },
  { symbol: 'USD/TRY', name: 'USD/Lira Turca', basePrice: 32.2, volatility: 0.1 },
  { symbol: 'USD/ZAR', name: 'USD/Rand', basePrice: 18.5, volatility: 0.08 },
];

export const TEXTS = {
  title: 'TRADING',
  subtitle: 'SISTEMA DE ANÁLISE IA',
  connected: 'CONECTADO',
  market: 'Mercado',
  history: 'Histórico',
  live: 'AO VIVO',
  max24h: 'Máxima 24h',
  min24h: 'Mínima 24h',
  volume: 'Volume',
  volatility: 'Volatilidade',
  neural_ai: 'VERTX NEURAL.IA',
  select_asset: 'Selecione um ativo para gerar sinal.',
  generating: 'GERANDO...',
  wait: 'Aguarde',
  generate_btn: 'GERAR SINAL',
  recommendation: 'Recomendação',
  confidence: 'Confiança',
  trend: 'Tendência',
  trend_high: 'Alta',
  trend_low: 'Baixa',
  trend_neutral: 'Neutra',
  win: 'Vitória',
  loss: 'Derrota',
  registered: 'Registrado',
  resistance: 'Resistência',
  support: 'Suporte',
  analysis_title: 'ANÁLISE TÉCNICA.IA',
  buy: 'COMPRA',
  sell: 'VENDA',
  hold: 'NEUTRO',
  empty_history: 'Histórico vazio.',
  clear_all: 'Limpar Tudo',
  total: 'Total Trades',
  win_rate: 'Taxa de Acerto',
  status: 'Desempenho',
  profitable: 'Lucrativo',
  neutral: 'Neutro',
  time: 'Hora',
  asset: 'Ativo',
  signal: 'Sinal',
  conf: 'Conf',
  result: 'Resultado',
  notif_signal: 'Sinal Identificado',
  notif_success: 'Histórico Atualizado',
  notif_removed: 'Item Removido',
  notif_cleared: 'Histórico Limpo',
  confirm_clear: 'Tem certeza que deseja limpar todo o histórico de operações?',
  modal_clear_title: 'Limpar Histórico?',
  cancel: 'Cancelar',
  yes_clear: 'Sim, Limpar Tudo',
  
  // Auth & Premium
  login_title: 'Portal de Acesso',
  login_btn: 'ENTRAR NO SISTEMA',
  register_btn: 'CRIAR CONTA',
  email: 'E-mail de Acesso',
  password: 'Senha de Segurança',
  welcome: 'Bem-vindo de volta',
  create_acc: 'Inicializar Conta',
  premium: 'Premium',
  locked_asset: 'Ativo Bloqueado',
  locked_desc: 'Desbloqueie o Premium para acessar todos os ativos.',
  credits_left: 'Créditos Restantes',
  no_credits: 'Créditos Esgotados',
  no_credits_desc: 'Você usou seus 15 sinais. Volte em 4h ou ative o Premium para acesso ilimitado.',
  activate_premium: 'Ativar Premium',
  premium_code: 'Código de Acesso',
  premium_benefits: 'Vantagens Premium',
  benefit_1: 'Geração de Sinais Ilimitada',
  benefit_2: 'Todos os Ativos Liberados',
  benefit_3: 'IA com 90% de Precisão',
  benefit_4: 'Sem Anúncios',
  code_invalid: 'Código Inválido ou Expirado',
  code_success: 'Premium Ativado com Sucesso!',
  free_tier: 'Plano Gratuito',
  days: 'dias',
  
  // Password Recovery
  forgot_password: 'Esqueceu a senha?',
  recover_title: 'Recuperar Acesso',
  recover_btn: 'ENVIAR LINK',
  recover_desc: 'Digite seu e-mail para receber as instruções de redefinição de senha.',
  back_login: 'Voltar ao Login',
  recover_success: 'Link enviado! Verifique seu e-mail.',
  
  // Stats
  streak: 'Sequência',
  best_asset: 'Melhor Ativo',
  avg_conf: 'Conf. Média (Wins)',
  filter_asset: 'Filtrar Ativo',
  filter_result: 'Filtrar Resultado',
  all: 'Todos',
  export_csv: 'Exportar CSV',
  no_data_filter: 'Nenhuma operação encontrada com os filtros atuais.',

  // Anti-Fraud
  security_alert: 'Alerta de Segurança',
  time_manipulation: 'Manipulação de Data/Hora Detectada',
  time_manipulation_desc: 'Nosso sistema detectou que a data ou hora do seu dispositivo foi alterada para burlar as regras de segurança.',
  time_sync_required: 'Ajuste seu relógio para o horário automático/correto para restaurar o acesso ao sistema.',
  device_time: 'Hora do Dispositivo',
  server_time: 'Hora do Servidor',
};

export const generateInitialData = (basePrice: number, count = 60) => {
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = count; i > 0; i--) {
    const time = new Date(now.getTime() - i * 60000); 
    const change = (Math.random() - 0.5) * (basePrice * 0.005);
    currentPrice += change;
    
    data.push({
      time: format(time, 'HH:mm'),
      price: Number(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
      ma7: Number((currentPrice * (1 + (Math.random() * 0.002 - 0.001))).toFixed(2)),
      ma25: Number((currentPrice * (1 + (Math.random() * 0.005 - 0.0025))).toFixed(2)),
    });
  }
  return data;
};

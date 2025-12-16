import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DataPoint, AIAnalysisResult, SignalType, TrendDirection } from "../types";

// --- FUNÇÕES MATEMÁTICAS AUXILIARES (Local Engine) ---

const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    diff >= 0 ? gains += diff : losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
};

// --- ANÁLISE HÍBRIDA (IA + Matemática) ---

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    signal: { type: Type.STRING },
    confidence: { type: Type.INTEGER },
    trend: { type: Type.STRING },
    patternsDetected: { type: Type.ARRAY, items: { type: Type.STRING } },
    keySupport: { type: Type.NUMBER },
    keyResistance: { type: Type.NUMBER },
    reasoning: { type: Type.STRING },
  },
  required: ["signal", "confidence", "trend", "patternsDetected", "keySupport", "keyResistance", "reasoning"],
};

// Função de Fallback (Motor Matemático Puro) - Totalmente em Português
const generateLocalAnalysis = (symbol: string, data: DataPoint[], rsi: number, emaShort: number, emaLong: number, stdDev: number, isPremium: boolean): AIAnalysisResult => {
    const lastPrice = data[data.length - 1].price;
    
    let signal = SignalType.HOLD;
    let trend = TrendDirection.NEUTRAL;
    let confidence = 50; // Base confidence
    let patterns = [];
    let reasoning = "";

    // Lógica Técnica Local
    if (emaShort > emaLong) trend = TrendDirection.BULLISH;
    else if (emaShort < emaLong) trend = TrendDirection.BEARISH;

    if (rsi < 30) {
        signal = SignalType.BUY;
        confidence = 60 + (30 - rsi);
        patterns.push("Sobrevenda Extrema (RSI)");
        reasoning = `RSI ${rsi.toFixed(0)} indica forte sobrevenda, sugerindo possível reversão para alta.`;
    } else if (rsi > 70) {
        signal = SignalType.SELL;
        confidence = 60 + (rsi - 70);
        patterns.push("Sobrecompra Extrema (RSI)");
        reasoning = `RSI ${rsi.toFixed(0)} indica forte sobrecompra, sugerindo possível correção.`;
    } else if (trend === TrendDirection.BULLISH && rsi > 50) {
        signal = SignalType.BUY;
        confidence = 55;
        patterns.push("Tendência de Alta");
        reasoning = "Médias móveis alinhadas para alta com RSI saudável.";
    } else if (trend === TrendDirection.BEARISH && rsi < 50) {
        signal = SignalType.SELL;
        confidence = 55;
        patterns.push("Tendência de Baixa");
        reasoning = "Médias móveis indicam queda e RSI confirma momento vendedor.";
    } else {
        reasoning = "Mercado lateralizado sem direção clara. Aguarde confirmação.";
    }

    // Apply Premium / Free Constraints to Confidence
    if (isPremium) {
        // Boost confidence for premium
        confidence = Math.min(96, Math.max(80, confidence + 20));
    } else {
        // Clamp confidence for free users (50-60%)
        confidence = Math.min(60, Math.max(50, confidence));
    }

    return {
        id: crypto.randomUUID(),
        symbol,
        currentPrice: lastPrice,
        timestamp: new Date().toISOString(),
        signal,
        confidence: Math.floor(confidence),
        trend,
        patternsDetected: patterns.length > 0 ? patterns : ["Análise Técnica"],
        keySupport: Number((lastPrice - stdDev * 2).toFixed(2)),
        keyResistance: Number((lastPrice + stdDev * 2).toFixed(2)),
        reasoning: reasoning
    };
};

export const analyzeMarketData = async (
  symbol: string,
  data: DataPoint[],
  isPremium: boolean = false
): Promise<AIAnalysisResult> => {
  const prices = data.map(d => d.price);
  const currentPrice = prices[prices.length - 1];

  const rsi = calculateRSI(prices);
  const ema7 = calculateEMA(prices, 7);
  const ema25 = calculateEMA(prices, 25);
  
  const recent = prices.slice(-10);
  const mean = recent.reduce((a, b) => a + b, 0) / 10;
  const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 10;
  const stdDev = Math.sqrt(variance);
  
  try {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        console.warn("API Key missing, using Quantum Engine.");
        await new Promise(r => setTimeout(r, 1000));
        return generateLocalAnalysis(symbol, data, rsi, ema7, ema25, stdDev, isPremium);
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Configuração de Nível
    const tierInstruction = isPremium 
        ? "Modo: PRECISÃO. Confiança 85-95%." 
        : "Modo: BÁSICO. Confiança 50-60%.";

    const prompt = `
      Atue como um Analista Quântico Sênior.
      Tarefa: Analisar dados de mercado e gerar um sinal de trading.
      Idioma: **Responda EXCLUSIVAMENTE em Português do Brasil**.
      
      Nível: ${tierInstruction}

      Contexto Técnico:
      - RSI (14): ${rsi.toFixed(2)}
      - Cruzamento EMA: ${ema7 > ema25 ? "Alta (Bullish)" : "Baixa (Bearish)"}
      
      Regras de Saída:
      1. Sinal: "BUY" (Compra), "SELL" (Venda), ou "HOLD" (Neutro/Aguardar).
      2. Confiança: ${isPremium ? "Alta (80-95)" : "Baixa (50-60)"}.
      3. Tendência: "BULLISH" (Alta), "BEARISH" (Baixa), ou "NEUTRAL".
      4. Raciocínio (reasoning): Explique o sinal de forma técnica e direta em Português.
      5. Padrões (patternsDetected): Liste padrões identificados em Português (ex: Engolfo, Martelo, Cruzamento).

      Dados: ${JSON.stringify({ symbol, currentPrice, indicators: { RSI: rsi, EMA7: ema7 } })}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: isPremium ? 0.1 : 0.7, 
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : "{}";
    const analysis = JSON.parse(cleanJson);

    const normalizedSignal = analysis.signal?.toUpperCase();
    const finalSignal = Object.values(SignalType).includes(normalizedSignal as SignalType) 
      ? (normalizedSignal as SignalType) : SignalType.HOLD;

    const normalizedTrend = analysis.trend?.toUpperCase();
    const finalTrend = Object.values(TrendDirection).includes(normalizedTrend as TrendDirection)
      ? (normalizedTrend as TrendDirection) : TrendDirection.NEUTRAL;
    
    // Ajuste de Confiança conforme o Plano
    let rawConf = Number(analysis.confidence) || 50;
    if (isPremium) {
        rawConf = Math.max(80, Math.min(98, rawConf));
    } else {
        rawConf = Math.max(50, Math.min(60, rawConf));
    }

    return {
      id: crypto.randomUUID(),
      symbol,
      currentPrice,
      timestamp: new Date().toISOString(),
      signal: finalSignal,
      confidence: rawConf, 
      trend: finalTrend,
      patternsDetected: Array.isArray(analysis.patternsDetected) ? analysis.patternsDetected.slice(0,3) : ["Análise IA"],
      keySupport: Number(analysis.keySupport) || (currentPrice - stdDev),
      keyResistance: Number(analysis.keyResistance) || (currentPrice + stdDev),
      reasoning: analysis.reasoning || "Análise processada."
    };

  } catch (error) {
    console.error("Gemini failed, switching to local engine:", error);
    return generateLocalAnalysis(symbol, data, rsi, ema7, ema25, stdDev, isPremium);
  }
};
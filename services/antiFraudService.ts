import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient';

const TOLERANCE_MS = 1000 * 60 * 5; // 5 minutos de tolerância
const LAST_TIME_KEY = 'vertx_secure_ts';

export interface TimeCheckResult {
    tampered: boolean;
    serverTime?: Date;
    deviceTime?: Date;
    reason?: 'offset' | 'backward' | null;
}

/**
 * Verifica a integridade temporal comparando hora do dispositivo com servidor
 * e verificando inconsistências históricas (voltar no tempo).
 */
export const checkTimeIntegrity = async (): Promise<TimeCheckResult> => {
    const deviceNow = new Date();
    const deviceTime = deviceNow.getTime();

    // 1. Verificação Local (Anti Back-to-Future)
    // Se o usuário voltar a data para antes do último uso registrado, é fraude.
    const lastKnownStr = localStorage.getItem(LAST_TIME_KEY);
    if (lastKnownStr) {
        const lastKnownTime = parseInt(lastKnownStr, 10);
        // Se a hora atual for significativamente menor que a última hora registrada (com tolerância)
        if (deviceTime < (lastKnownTime - TOLERANCE_MS)) {
            return {
                tampered: true,
                deviceTime: deviceNow,
                reason: 'backward'
            };
        }
    }
    
    // Atualiza o timestamp local
    localStorage.setItem(LAST_TIME_KEY, deviceTime.toString());

    // 2. Verificação Remota (Server Sync)
    try {
        // Fazemos uma requisição leve (HEAD) para o Supabase apenas para pegar o header 'Date'
        // Usamos as constantes importadas para evitar erros de runtime com process.env
        const response = await fetch(`${SUPABASE_URL}/rest/v1/premium_codes?select=id&limit=1`, {
            method: 'HEAD',
            headers: {
                'apikey': SUPABASE_ANON_KEY
            }
        });

        const serverDateStr = response.headers.get('date');
        if (serverDateStr) {
            const serverTime = Date.parse(serverDateStr);
            const diff = Math.abs(deviceTime - serverTime);

            if (diff > TOLERANCE_MS) {
                return {
                    tampered: true,
                    serverTime: new Date(serverTime),
                    deviceTime: deviceNow,
                    reason: 'offset'
                };
            }
        }

        return { tampered: false };

    } catch (e) {
        // Se estiver offline ou erro de rede, confiamos apenas na verificação local por enquanto
        // para não bloquear uso legítimo sem internet.
        // A verificação local (passo 1) já protege contra voltar no tempo offline.
        return { tampered: false };
    }
};
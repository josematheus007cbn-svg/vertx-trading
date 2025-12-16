import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://rhggmkaaeaabxlkgtfgt.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_VEPdjB5omhNwY9eSc93evw_2wWQM2aG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});
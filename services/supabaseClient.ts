
import { createClient } from '@supabase/supabase-js';

// Active Supabase credentials (.env / current project)
const ACTIVE_URL = 'https://cruiirntmgpgcwgdlxea.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydWlpcm50bWdwZ2N3Z2RseGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzIzNjYsImV4cCI6MjEwMDIwODM2Nn0.kMKv0UMfGktATuUNuxpxY8ieoCeTsYe_7limODsN1hE';

const DEFAULT_URL = (import.meta as any).env?.VITE_SUPABASE_URL || ACTIVE_URL;
const DEFAULT_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ACTIVE_KEY;

const DEFAULT_NEW_URL = 'https://ymolrxscthxxtlmnxmob.supabase.co';
const DEFAULT_NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltb2xyeHNjdGh4eHRsbW54bW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjgzNzgsImV4cCI6MjA3OTk0NDM3OH0.Hv64EHm_eZE3QHKN8QkdDFnYAQT1f_7KTDcaRoFobi8';

const DEFAULT_SPECIAL_OLD_URL = 'https://opdcyccwracapxfxisfw.supabase.co';
const DEFAULT_SPECIAL_OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZGN5Y2N3cmFjYXB4Znhpc2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzkyMDUsImV4cCI6MjA5NTM1NTIwNX0.p4gmiTKIjcljdjoqzQn-S6z5YyrU9XvZPPKgnNF5_Cs';

// Verified Supabase project domains whitelist for safe configuration
const ALLOWED_PROJECT_REFS = ['cruiirntmgpgcwgdlxea', 'iwvbrigjydmhbwbnbbbk', 'ymolrxscthxxtlmnxmob', 'opdcyccwracapxfxisfw'];

// Helper to get config securely
const getConfig = () => {
   try {
      // Purge any unsafe or stale custom URLs from localStorage to prevent storage hijacking / data exfiltration
      const customUrl = localStorage.getItem('supabase_url');
      if (customUrl) {
         const isAllowed = ALLOWED_PROJECT_REFS.some(ref => customUrl.includes(ref));
         if (!isAllowed) {
            localStorage.removeItem('supabase_url');
            localStorage.removeItem('supabase_key');
         }
      }

      // Strict fallback to immutable build-time environment constants
      return { 
         url: DEFAULT_URL, 
         key: DEFAULT_KEY, 
         newUrl: DEFAULT_NEW_URL, 
         newKey: DEFAULT_NEW_KEY, 
         specialOldUrl: DEFAULT_SPECIAL_OLD_URL, 
         specialOldKey: DEFAULT_SPECIAL_OLD_KEY 
      };
   } catch (e) {
      return { 
         url: DEFAULT_URL, 
         key: DEFAULT_KEY, 
         newUrl: DEFAULT_NEW_URL, 
         newKey: DEFAULT_NEW_KEY, 
         specialOldUrl: DEFAULT_SPECIAL_OLD_URL, 
         specialOldKey: DEFAULT_SPECIAL_OLD_KEY 
      };
   }
};

let config = getConfig();

export let supabase = createClient(config.url, config.key);
export let supabaseNew = createClient(config.newUrl, config.newKey);
export let supabaseSpecialOld = createClient(config.specialOldUrl, config.specialOldKey);

/**
 * Re-initialize Supabase clients safely.
 */
export const refreshSupabaseClients = () => {
   config = getConfig();
   supabase = createClient(config.url, config.key);
   supabaseNew = createClient(config.newUrl, config.newKey);
   supabaseSpecialOld = createClient(config.specialOldUrl, config.specialOldKey);
};

/**
 * Helper to check if a specific error implies a critical configuration mismatch
 */
export const isCriticalSupabaseError = (error: any): boolean => {
   if (!error) return false;

   const msg = typeof error === 'string' ? error.toLowerCase() : (error.message || '').toLowerCase();
   const code = error.code || '';

   if (msg.includes('project not found') || (msg.includes('not found') && code === '404')) {
      return true;
   }

   if (msg.includes('connection refused') || msg.includes('upstream connect error')) {
      return true;
   }

   return false;
};

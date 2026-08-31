
import { createClient } from '@supabase/supabase-js';

// Active Supabase credentials (.env / current project)
const ACTIVE_URL = 'https://lxhwyrzxgqvosecnhfli.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aHd5cnp4Z3F2b3NlY25oZmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzQ3MjEsImV4cCI6MjA4NTE1MDcyMX0.32gBAnMHN9R4eWl-Tu2NxivrM7c7Kqctk9XEvdpKf94';

const DEFAULT_URL = (import.meta as any).env?.VITE_SUPABASE_URL || ACTIVE_URL;
const DEFAULT_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ACTIVE_KEY;

const DEFAULT_NEW_URL = 'https://ymolrxscthxxtlmnxmob.supabase.co';
const DEFAULT_NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltb2xyeHNjdGh4eHRsbW54bW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjgzNzgsImV4cCI6MjA3OTk0NDM3OH0.Hv64EHm_eZE3QHKN8QkdDFnYAQT1f_7KTDcaRoFobi8';

const DEFAULT_SPECIAL_OLD_URL = 'https://opdcyccwracapxfxisfw.supabase.co';
const DEFAULT_SPECIAL_OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZGN5Y2N3cmFjYXB4Znhpc2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzkyMDUsImV4cCI6MjA5NTM1NTIwNX0.p4gmiTKIjcljdjoqzQn-S6z5YyrU9XvZPPKgnNF5_Cs';

// Helper to get config from localStorage
const getConfig = () => {
   try {
      let url = localStorage.getItem('supabase_url') || DEFAULT_URL;
      let key = localStorage.getItem('supabase_key') || DEFAULT_KEY;

      // Automatically purge old stale URL from localStorage if it points to old projects
      if (url && !url.includes('lxhwyrzxgqvosecnhfli')) {
         localStorage.removeItem('supabase_url');
         localStorage.removeItem('supabase_key');
         url = DEFAULT_URL;
         key = DEFAULT_KEY;
      }

      const newUrl = localStorage.getItem('supabase_new_url') || DEFAULT_NEW_URL;
      const newKey = localStorage.getItem('supabase_new_key') || DEFAULT_NEW_KEY;
      const specialOldUrl = localStorage.getItem('supabase_special_old_url') || DEFAULT_SPECIAL_OLD_URL;
      const specialOldKey = localStorage.getItem('supabase_special_old_key') || DEFAULT_SPECIAL_OLD_KEY;
      return { url, key, newUrl, newKey, specialOldUrl, specialOldKey };
   } catch (e) {
      return { url: DEFAULT_URL, key: DEFAULT_KEY, newUrl: DEFAULT_NEW_URL, newKey: DEFAULT_NEW_KEY, specialOldUrl: DEFAULT_SPECIAL_OLD_URL, specialOldKey: DEFAULT_SPECIAL_OLD_KEY };
   }
};

let config = getConfig();

export let supabase = createClient(config.url, config.key);
export let supabaseNew = createClient(config.newUrl, config.newKey);
export let supabaseSpecialOld = createClient(config.specialOldUrl, config.specialOldKey);

/**
 * Re-initialize Supabase clients using the latest values from localStorage.
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

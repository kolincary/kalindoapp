import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from './firebaseClient';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// Default Fallback Supabase credentials
const FALLBACK_URL = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';

const DEFAULT_URL = (import.meta as any).env?.VITE_SUPABASE_URL || FALLBACK_URL;
const DEFAULT_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

const DEFAULT_NEW_URL = 'https://ymolrxscthxxtlmnxmob.supabase.co';
const DEFAULT_NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltb2xyeHNjdGh4eHRsbW54bW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjgzNzgsImV4cCI6MjA3OTk0NDM3OH0.Hv64EHm_eZE3QHKN8QkdDFnYAQT1f_7KTDcaRoFobi8';

const DEFAULT_SPECIAL_OLD_URL = 'https://opdcyccwracapxfxisfw.supabase.co';
const DEFAULT_SPECIAL_OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZGN5Y2N3cmFjYXB4Znhpc2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzkyMDUsImV4cCI6MjA5NTM1NTIwNX0.p4gmiTKIjcljdjoqzQn-S6z5YyrU9XvZPPKgnNF5_Cs';

export interface ActiveSupabaseConfig {
  url: string;
  key: string;
  newUrl: string;
  newKey: string;
  specialOldUrl: string;
  specialOldKey: string;
  projectRef: string;
  isCustom: boolean;
}

// Extract project ref from URL (e.g. https://abcdef.supabase.co -> abcdef)
export const extractProjectRef = (url: string): string => {
  try {
    const clean = (url || '').trim().replace(/^https?:\/\//, '');
    return clean.split('.')[0] || 'unknown';
  } catch {
    return 'unknown';
  }
};

// Helper to get config
export const getConfig = (): ActiveSupabaseConfig => {
  try {
    const customUrl = localStorage.getItem('active_supabase_url') || localStorage.getItem('supabase_url');
    const customKey = localStorage.getItem('active_supabase_key') || localStorage.getItem('supabase_key');

    const newUrl = localStorage.getItem('supabase_new_url') || DEFAULT_NEW_URL;
    const newKey = localStorage.getItem('supabase_new_key') || DEFAULT_NEW_KEY;

    if (customUrl && customKey && customUrl.startsWith('https://')) {
      return {
        url: customUrl.trim(),
        key: customKey.trim(),
        newUrl: newUrl.trim(),
        newKey: newKey.trim(),
        specialOldUrl: DEFAULT_SPECIAL_OLD_URL,
        specialOldKey: DEFAULT_SPECIAL_OLD_KEY,
        projectRef: extractProjectRef(customUrl),
        isCustom: true
      };
    }

    return {
      url: DEFAULT_URL,
      key: DEFAULT_KEY,
      newUrl: DEFAULT_NEW_URL,
      newKey: DEFAULT_NEW_KEY,
      specialOldUrl: DEFAULT_SPECIAL_OLD_URL,
      specialOldKey: DEFAULT_SPECIAL_OLD_KEY,
      projectRef: extractProjectRef(DEFAULT_URL),
      isCustom: false
    };
  } catch (e) {
    return {
      url: DEFAULT_URL,
      key: DEFAULT_KEY,
      newUrl: DEFAULT_NEW_URL,
      newKey: DEFAULT_NEW_KEY,
      specialOldUrl: DEFAULT_SPECIAL_OLD_URL,
      specialOldKey: DEFAULT_SPECIAL_OLD_KEY,
      projectRef: extractProjectRef(DEFAULT_URL),
      isCustom: false
    };
  }
};

let activeConfig = getConfig();

export let supabase: SupabaseClient = createClient(activeConfig.url, activeConfig.key);
export let supabaseNew: SupabaseClient = createClient(activeConfig.newUrl, activeConfig.newKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
export let supabaseSpecialOld: SupabaseClient = createClient(activeConfig.specialOldUrl, activeConfig.specialOldKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

/**
 * Re-initialize Supabase clients safely.
 */
export const refreshSupabaseClients = () => {
  activeConfig = getConfig();
  supabase = createClient(activeConfig.url, activeConfig.key);
  supabaseNew = createClient(activeConfig.newUrl, activeConfig.newKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  supabaseSpecialOld = createClient(activeConfig.specialOldUrl, activeConfig.specialOldKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
};

/**
 * Test connectivity to any Supabase instance by checking public table access
 */
export const testSupabaseConnection = async (
  url: string,
  key: string
): Promise<{ success: boolean; message: string; rowCount?: number }> => {
  try {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl || !cleanKey) {
      return { success: false, message: 'URL dan Key tidak boleh kosong.' };
    }
    if (!cleanUrl.startsWith('https://')) {
      return { success: false, message: 'URL Supabase harus diawali dengan https://' };
    }

    const testClient = createClient(cleanUrl, cleanKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    // Check table accessibility and count
    const { count, error } = await testClient
      .from('scanned_items')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // If table doesn't exist yet, check if project is reachable
      if (error.code === '42P01' || error.message.includes('relation "public.scanned_items" does not exist')) {
        return {
          success: true,
          message: 'Terkoneksi ke Supabase! (Catatan: Tabel scanned_items belum dibuat, silakan jalankan Master SQL Schema).',
          rowCount: 0
        };
      }
      return { success: false, message: `Koneksi gagal: ${error.message}` };
    }

    return {
      success: true,
      message: `Koneksi Berhasil! Terhubung ke tabel scanned_items (${(count || 0).toLocaleString()} data terdeteksi).`,
      rowCount: count || 0
    };
  } catch (err: any) {
    return { success: false, message: `Error koneksi: ${err?.message || 'Tidak dapat menghubungi server'}` };
  }
};

/**
 * Set active Supabase credentials dynamically and optionally broadcast to all users via Firestore
 */
export const setActiveSupabaseCredentials = async (
  url: string,
  key: string,
  broadcastToAllUsers = true,
  adminUsername = 'Admin'
): Promise<void> => {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  // 1. Save locally
  localStorage.setItem('active_supabase_url', cleanUrl);
  localStorage.setItem('active_supabase_key', cleanKey);
  localStorage.setItem('supabase_url', cleanUrl);
  localStorage.setItem('supabase_key', cleanKey);

  // 2. Refresh local client
  refreshSupabaseClients();

  // 3. Broadcast to all users via Firestore Real-Time Config
  if (broadcastToAllUsers && db) {
    try {
      const configRef = doc(db, 'system_config', 'supabase_active');
      await setDoc(configRef, {
        url: cleanUrl,
        key: cleanKey,
        project_ref: extractProjectRef(cleanUrl),
        updated_at: Date.now(),
        updated_by: adminUsername
      }, { merge: true });
    } catch (err) {
      console.warn('Failed to broadcast active Supabase config to Firestore:', err);
    }
  }
};

/**
 * Listen to Firestore Remote Config for real-time hot-swap notifications across all user devices
 */
export const initRemoteSupabaseConfigListener = () => {
  if (!db) return () => {};

  try {
    const configRef = doc(db, 'system_config', 'supabase_active');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const remoteUrl = (data?.url || '').trim();
      const remoteKey = (data?.key || '').trim();
      const updatedAt = data?.updated_at || 0;

      if (!remoteUrl || !remoteKey) return;

      const currentConfig = getConfig();
      
      // If remote URL is different from currently connected URL, dispatch update event
      if (remoteUrl !== currentConfig.url) {
        console.log(`⚡ REMOTE SUPABASE CHANGE DETECTED: ${currentConfig.url} ➔ ${remoteUrl}`);
        window.dispatchEvent(new CustomEvent('supabase_config_changed', {
          detail: {
            url: remoteUrl,
            key: remoteKey,
            projectRef: extractProjectRef(remoteUrl),
            updated_at: updatedAt,
            updated_by: data?.updated_by || 'Admin'
          }
        }));
      }
    }, (err) => {
      console.warn('Remote Supabase config listener notice:', err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to init remote Supabase listener:', err);
    return () => {};
  }
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

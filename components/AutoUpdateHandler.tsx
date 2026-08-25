
import React, { useEffect, useState } from 'react';
import { RefreshCw, Download, X, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const VERSION_CHECK_INTERVAL = 60000; // 60 seconds
const STORAGE_KEY_VERSION = 'app_version';
const COUNTDOWN_SECONDS = 10;

export const AutoUpdateHandler: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [newVersion, setNewVersion] = useState('');

  // Soft Reload for Version Updates (preserves user session)
  const executeSoftReload = () => {
    console.log("🔄 NEW VERSION DETECTED - Soft Reload");
    setMessage('Loading New Version...');

    // Clear browser cache but preserve localStorage (user sessions)
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }

    // Hard reload to fetch new assets (cache-busting)
    window.location.reload();
  };

  // Hard Reset for Manual Force Refresh (clears everything)
  const executeHardReset = async () => {
    console.log("⚠️ FORCE REFRESH SIGNAL RECEIVED ⚠️");
    setIsResetting(true);
    setMessage('Clearing System Cache...');

    try {
      // 1. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 2. Clear Cache Storage
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      // 3. Clear Storage (preserve theme only)
      const savedTheme = localStorage.getItem('theme');
      localStorage.clear();
      sessionStorage.clear();
      if (savedTheme) localStorage.setItem('theme', savedTheme);

      setMessage('Reloading System...');

      // 4. Force Reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (e) {
      console.error("Reset failed", e);
      window.location.reload();
    }
  };

  // Check for version updates
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Fetch version.json with cache-busting
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data.version;
        const storedVersion = localStorage.getItem(STORAGE_KEY_VERSION);

        console.log(`Version Check: Stored=${storedVersion}, Server=${serverVersion}`);

        if (storedVersion && serverVersion && storedVersion !== serverVersion) {
          // New version detected!
          console.log(`🚀 NEW VERSION DETECTED: ${storedVersion} → ${serverVersion}`);
          setNewVersion(serverVersion);
          setShowUpdateNotification(true);
          setCountdown(COUNTDOWN_SECONDS);
        } else if (!storedVersion) {
          // First time - just save version
          localStorage.setItem(STORAGE_KEY_VERSION, serverVersion);
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Then check every 60 seconds
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer for auto-reload
  useEffect(() => {
    if (!showUpdateNotification) return;

    if (countdown === 0) {
      // Update stored version before reload
      localStorage.setItem(STORAGE_KEY_VERSION, newVersion);
      executeSoftReload();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showUpdateNotification, countdown, newVersion]);

  // Listen for Manual Force Refresh from Admin Panel
  useEffect(() => {
    const channel = supabase
      .channel('global_refresh_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'id=eq.1',
        },
        (payload) => {
          console.log("Force Refresh Signal Detected:", payload);
          if (payload.new && payload.new.last_force_refresh_at) {
            executeHardReset();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Manual Force Reset UI
  if (isResetting) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-white dark:bg-gray-800 w-full max-w-xs sm:max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 dark:bg-red-950/50 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-red-500/20">
            <RefreshCw size={32} className="text-red-600 dark:text-red-400 animate-spin" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-1.5 uppercase tracking-tight">Pembaruan Sistem</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5 font-medium">
            {message || "Memperbarui sistem ke versi terbaru..."}
          </p>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div className="bg-red-600 h-full rounded-full animate-[progress_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes progress { 
            0% { width: 0%; margin-left: 0; } 
            50% { width: 70%; margin-left: 30%; } 
            100% { width: 0%; margin-left: 100%; } 
          }
        `}</style>
      </div>
    );
  }

  // Auto-Update Notification
  if (showUpdateNotification) {
    const progressPercent = ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;

    return (
      <div className="fixed top-3 sm:top-4 left-3 right-3 sm:left-auto sm:right-4 z-[9999] sm:w-96 max-w-full animate-[slideDown_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white rounded-2xl shadow-2xl border border-blue-400/30 backdrop-blur-xl p-3.5 sm:p-4 overflow-hidden relative group">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 ring-1 ring-white/20">
                <Sparkles size={16} className="text-blue-200 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-xs sm:text-sm tracking-tight text-white">Update Tersedia!</h4>
                  <span className="text-[10px] font-mono font-bold bg-blue-500/40 border border-blue-300/30 px-1.5 py-0.2 rounded text-blue-100">
                    v{newVersion}
                  </span>
                </div>
                <p className="text-[11px] text-blue-100/90 leading-tight mt-0.5 truncate">
                  Memuat ulang otomatis dalam <strong className="font-mono text-white">{countdown}s</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowUpdateNotification(false)}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Tutup pemberitahuan"
            >
              <X size={16} />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                localStorage.setItem(STORAGE_KEY_VERSION, newVersion);
                executeSoftReload();
              }}
              className="flex-1 py-2 px-3 bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-700 rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={13} className="animate-spin text-blue-600" />
              <span>Update Sekarang</span>
            </button>
            <button
              onClick={() => setShowUpdateNotification(false)}
              className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Nanti
            </button>
          </div>

          {/* Progress Bar Line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div 
              className="h-full bg-gradient-to-r from-blue-300 to-cyan-300 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

        </div>
        <style>{`
          @keyframes slideDown { 
            from { transform: translateY(-80px); opacity: 0; } 
            to { transform: translateY(0); opacity: 1; } 
          }
        `}</style>
      </div>
    );
  }

  return null;
};

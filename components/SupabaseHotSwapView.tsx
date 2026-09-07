import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowRight, 
  Play, 
  Square, 
  RefreshCw, 
  Server, 
  Shield, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  FileText, 
  Users, 
  Layers, 
  Zap, 
  Info,
  Radio,
  CheckSquare,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  getConfig, 
  testSupabaseConnection, 
  setActiveSupabaseCredentials,
  extractProjectRef 
} from '../services/supabaseClient';
import { MASTER_SUPABASE_SQL_SCHEMA } from '../services/supabaseMasterSchema';

interface TableMigrationConfig {
  name: string;
  label: string;
  supportsDateFilter: boolean;
  timestampColumn?: string;
  defaultSelected: boolean;
}

const AVAILABLE_TABLES: TableMigrationConfig[] = [
  { name: 'scanned_items', label: 'Data Scan Barcode (scanned_items)', supportsDateFilter: true, timestampColumn: 'timestamp', defaultSelected: true },
  { name: 'admin_imports', label: 'Manifest Import Admin (admin_imports)', supportsDateFilter: false, defaultSelected: true },
  { name: 'cancelled_orders', label: 'Resi Cancel Gudang & Import (cancelled_orders)', supportsDateFilter: false, defaultSelected: true },
  { name: 'batch_items', label: 'Rekap Batch Print (batch_items)', supportsDateFilter: false, defaultSelected: true },
  { name: 'admin_shift_notes', label: 'Catatan Shift Admin (admin_shift_notes)', supportsDateFilter: false, defaultSelected: true },
  { name: 'employees', label: 'Daftar Karyawan & PIN (employees)', supportsDateFilter: false, defaultSelected: true },
  { name: 'user_permissions', label: 'Hak Akses Role (user_permissions)', supportsDateFilter: false, defaultSelected: true },
  { name: 'user_pins', label: 'PIN Master Role (user_pins)', supportsDateFilter: false, defaultSelected: true },
  { name: 'app_settings', label: 'Pengaturan Global (app_settings)', supportsDateFilter: false, defaultSelected: true },
  { name: 'app_profiles_config', label: 'Konfigurasi Profil (app_profiles_config)', supportsDateFilter: false, defaultSelected: false },
  { name: 'running_texts', label: 'Running Text (running_texts)', supportsDateFilter: false, defaultSelected: false },
  { name: 'admin_special_scans', label: 'Special Scan Data (admin_special_scans)', supportsDateFilter: false, defaultSelected: false },
  { name: 'failed_scans', label: 'Riwayat Gagal Scan (failed_scans)', supportsDateFilter: false, defaultSelected: false }
];

export const SupabaseHotSwapView: React.FC = () => {
  const currentConfig = getConfig();

  // Active Connection State
  const [activeUrl, setActiveUrl] = useState(currentConfig.url);
  const [activeKey, setActiveKey] = useState(currentConfig.key);
  const [activeTestStatus, setActiveTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string; count?: number }>({ loading: false });

  // Schema Copy State
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Migration Engine State
  const [sourceUrl, setSourceUrl] = useState(currentConfig.url);
  const [sourceKey, setSourceKey] = useState(currentConfig.key);
  const [targetUrl, setTargetUrl] = useState(currentConfig.newUrl || '');
  const [targetKey, setTargetKey] = useState(currentConfig.newKey || '');

  const [sourceTestStatus, setSourceTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string; count?: number }>({ loading: false });
  const [targetTestStatus, setTargetTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string; count?: number }>({ loading: false });

  // Scope & Dates
  const [migrationScope, setMigrationScope] = useState<'ALL' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Selected Tables
  const [selectedTables, setSelectedTables] = useState<string[]>(() => 
    AVAILABLE_TABLES.filter(t => t.defaultSelected).map(t => t.name)
  );

  // Migration Execution State
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{
    currentTable: string;
    currentBatch: number;
    totalRows: number;
    migratedRows: number;
    percentage: number;
    statusText: string;
  }>({
    currentTable: '',
    currentBatch: 0,
    totalRows: 0,
    migratedRows: 0,
    percentage: 0,
    statusText: 'Siap untuk migrasi'
  });
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const abortMigrationRef = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Switch & Broadcast State
  const [switchTargetUrl, setSwitchTargetUrl] = useState(currentConfig.newUrl || '');
  const [switchTargetKey, setSwitchTargetKey] = useState(currentConfig.newKey || '');
  const [broadcastToAll, setBroadcastToAll] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState('');

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [migrationLogs]);

  // Initial Test of Active Connection
  useEffect(() => {
    handleTestActiveConnection();
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setMigrationLogs(prev => [...prev.slice(-300), `[${time}] ${msg}`]);
  };

  const handleTestActiveConnection = async () => {
    setActiveTestStatus({ loading: true });
    const res = await testSupabaseConnection(activeUrl, activeKey);
    setActiveTestStatus({
      loading: false,
      success: res.success,
      message: res.message,
      count: res.rowCount
    });
  };

  const handleTestSourceConnection = async () => {
    setSourceTestStatus({ loading: true });
    const res = await testSupabaseConnection(sourceUrl, sourceKey);
    setSourceTestStatus({
      loading: false,
      success: res.success,
      message: res.message,
      count: res.rowCount
    });
  };

  const handleTestTargetConnection = async () => {
    setTargetTestStatus({ loading: true });
    const res = await testSupabaseConnection(targetUrl, targetKey);
    setTargetTestStatus({
      loading: false,
      success: res.success,
      message: res.message,
      count: res.rowCount
    });
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(MASTER_SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName) 
        : [...prev, tableName]
    );
  };

  const handleSelectAllTables = () => {
    setSelectedTables(AVAILABLE_TABLES.map(t => t.name));
  };

  const handleDeselectAllTables = () => {
    setSelectedTables([]);
  };

  // Start Universal Data Migration
  const handleStartMigration = async () => {
    if (!sourceUrl.trim() || !sourceKey.trim()) {
      alert('URL & Key Supabase Sumber (Asal) belum diisi.');
      return;
    }
    if (!targetUrl.trim() || !targetKey.trim()) {
      alert('URL & Key Supabase Target (Tujuan Baru) belum diisi.');
      return;
    }
    if (sourceUrl.trim() === targetUrl.trim()) {
      alert('Supabase Sumber dan Target tidak boleh sama!');
      return;
    }
    if (selectedTables.length === 0) {
      alert('Pilih minimal satu tabel untuk dimigrasikan.');
      return;
    }

    const confirmMsg = `Mulai proses migrasi data dari:\n${extractProjectRef(sourceUrl)} ➔ ${extractProjectRef(targetUrl)}\n\nCakupan: ${migrationScope === 'ALL' ? 'SEMUA DATA (Seluruh Waktu)' : `Rentang Tanggal: ${startDate} s/d ${endDate}`}\nTabel: ${selectedTables.join(', ')}\n\nLanjutkan?`;
    if (!window.confirm(confirmMsg)) return;

    setIsMigrating(true);
    abortMigrationRef.current = false;
    setMigrationLogs([]);
    addLog(`🚀 Memulai inisialisasi migrasi data...`);
    addLog(`Sumber: ${sourceUrl} (${extractProjectRef(sourceUrl)})`);
    addLog(`Target : ${targetUrl} (${extractProjectRef(targetUrl)})`);
    addLog(`Cakupan: ${migrationScope === 'ALL' ? 'SEMUA DATA' : `Tanggal ${startDate} s/d ${endDate}`}`);

    const sourceClient: SupabaseClient = createClient(sourceUrl.trim(), sourceKey.trim(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const targetClient: SupabaseClient = createClient(targetUrl.trim(), targetKey.trim(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const BATCH_SIZE = 1000;
    let grandTotalMigrated = 0;

    try {
      for (let tableIndex = 0; tableIndex < selectedTables.length; tableIndex++) {
        if (abortMigrationRef.current) {
          addLog(`🛑 Migrasi dibatalkan oleh pengguna.`);
          break;
        }

        const tableName = selectedTables[tableIndex];
        const tableConfig = AVAILABLE_TABLES.find(t => t.name === tableName);
        addLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        addLog(`📦 Memproses Tabel [${tableIndex + 1}/${selectedTables.length}]: ${tableName}`);

        // 1. Hitung total baris pada tabel sumber
        let countQuery = sourceClient.from(tableName).select('*', { count: 'exact', head: true });
        
        // Apply date filter if custom scope and supported
        if (migrationScope === 'CUSTOM' && tableConfig?.supportsDateFilter && tableConfig.timestampColumn) {
          const startMs = new Date(`${startDate}T00:00:00`).getTime();
          const endMs = new Date(`${endDate}T23:59:59.999`).getTime();
          countQuery = countQuery.gte(tableConfig.timestampColumn, startMs).lte(tableConfig.timestampColumn, endMs);
        }

        const { count, error: countErr } = await countQuery;
        if (countErr) {
          addLog(`⚠️ Gagal membaca tabel ${tableName} dari sumber: ${countErr.message}. Melewati tabel ini...`);
          continue;
        }

        const totalRows = count || 0;
        addLog(`📊 Ditemukan total ${totalRows.toLocaleString()} baris data pada tabel ${tableName}.`);

        if (totalRows === 0) {
          addLog(`ℹ️ Tidak ada data pada tabel ${tableName}, lanjut ke tabel berikutnya.`);
          continue;
        }

        // 2. Fetch & Transfer in Streaming Batches
        let tableMigrated = 0;
        let offset = 0;

        while (offset < totalRows) {
          if (abortMigrationRef.current) {
            addLog(`🛑 Migrasi dihentikan pada tabel ${tableName} offset ${offset}.`);
            break;
          }

          let fetchQuery = sourceClient.from(tableName).select('*');

          if (migrationScope === 'CUSTOM' && tableConfig?.supportsDateFilter && tableConfig.timestampColumn) {
            const startMs = new Date(`${startDate}T00:00:00`).getTime();
            const endMs = new Date(`${endDate}T23:59:59.999`).getTime();
            fetchQuery = fetchQuery.gte(tableConfig.timestampColumn, startMs).lte(tableConfig.timestampColumn, endMs);
          }

          // Safe ordering to prevent timeout
          if (tableConfig?.timestampColumn) {
            fetchQuery = fetchQuery.order(tableConfig.timestampColumn, { ascending: true });
          } else {
            fetchQuery = fetchQuery.order('id', { ascending: true });
          }

          const { data: batchRows, error: fetchErr } = await fetchQuery.range(offset, offset + BATCH_SIZE - 1);

          if (fetchErr) {
            addLog(`❌ Error membaca batch ${offset} - ${offset + BATCH_SIZE}: ${fetchErr.message}`);
            break;
          }

          if (!batchRows || batchRows.length === 0) {
            break;
          }

          // 3. Upsert into Target Supabase
          const { error: upsertErr } = await targetClient
            .from(tableName)
            .upsert(batchRows, { onConflict: 'id', ignoreDuplicates: false });

          if (upsertErr) {
            addLog(`❌ Gagal menyimpan batch ke target: ${upsertErr.message}`);
            // Retry once with ignore duplicates if constraint conflict
            addLog(`🔄 Mencoba kembali dengan ignoreDuplicates=true...`);
            const { error: retryErr } = await targetClient
              .from(tableName)
              .upsert(batchRows, { onConflict: 'id', ignoreDuplicates: true });
            
            if (retryErr) {
              addLog(`❌ Gagal pada retry: ${retryErr.message}`);
              break;
            }
          }

          tableMigrated += batchRows.length;
          grandTotalMigrated += batchRows.length;
          offset += BATCH_SIZE;

          const pct = Math.min(100, Math.round((tableMigrated / totalRows) * 100));
          setMigrationProgress({
            currentTable: tableName,
            currentBatch: Math.ceil(offset / BATCH_SIZE),
            totalRows: totalRows,
            migratedRows: tableMigrated,
            percentage: pct,
            statusText: `Memigrasi ${tableName}: ${tableMigrated.toLocaleString()} / ${totalRows.toLocaleString()} (${pct}%)`
          });

          addLog(`✓ ${tableName}: Berhasil migrasi baris ${tableMigrated.toLocaleString()} / ${totalRows.toLocaleString()} (${pct}%)`);
        }

        addLog(`✅ Selesai migrasi tabel ${tableName} (${tableMigrated.toLocaleString()} baris).`);
      }

      if (!abortMigrationRef.current) {
        addLog(`🎉 MIGRASI SELESAI SEMPURNA! Total ${grandTotalMigrated.toLocaleString()} baris berhasil dipindahkan.`);
        setMigrationProgress(prev => ({
          ...prev,
          percentage: 100,
          statusText: `Migrasi Selesai! Total ${grandTotalMigrated.toLocaleString()} baris berhasil dipindahkan.`
        }));

        // Set target credentials to switch section automatically
        setSwitchTargetUrl(targetUrl.trim());
        setSwitchTargetKey(targetKey.trim());
      }
    } catch (err: any) {
      addLog(`💥 Terjadi exception selama migrasi: ${err?.message || err}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleAbortMigration = () => {
    if (window.confirm('Yakin ingin membatalkan proses migrasi data?')) {
      abortMigrationRef.current = true;
      addLog('⚠️ Meminta pembatalan migrasi...');
    }
  };

  // Switch Active Supabase & Broadcast to All Users
  const handleApplyNewSupabase = async () => {
    const cleanUrl = switchTargetUrl.trim();
    const cleanKey = switchTargetKey.trim();

    if (!cleanUrl || !cleanKey) {
      alert('URL dan Key Supabase Target belum diisi.');
      return;
    }
    if (!cleanUrl.startsWith('https://')) {
      alert('URL Supabase harus diawali dengan https://');
      return;
    }

    const confirmMsg = `Konfirmasi Hot-Swap Supabase:\n\nDatabase Baru: ${cleanUrl} (${extractProjectRef(cleanUrl)})\nSiarkan ke Semua User: ${broadcastToAll ? 'YA (Real-Time Popup Auto-Reload)' : 'TIDAK (Hanya di perangkat ini)'}\n\nApakah Anda yakin ingin menerapkan database ini sekarang?`;
    if (!window.confirm(confirmMsg)) return;

    setIsApplying(true);
    setApplySuccessMessage('');

    try {
      // 1. Test target connection first
      const testRes = await testSupabaseConnection(cleanUrl, cleanKey);
      if (!testRes.success) {
        if (!window.confirm(`Peringatan tes koneksi:\n${testRes.message}\n\nTetap lanjutkan perpindahan?`)) {
          setIsApplying(false);
          return;
        }
      }

      // 2. Set credentials and broadcast via Firestore
      await setActiveSupabaseCredentials(cleanUrl, cleanKey, broadcastToAll, 'Admin Master');

      setApplySuccessMessage(`Database berhasil dialihkan ke ${extractProjectRef(cleanUrl)}! Seluruh pengguna akan otomatis terhubung ke database baru.`);
      setActiveUrl(cleanUrl);
      setActiveKey(cleanKey);

      // Re-test active status
      setTimeout(() => {
        handleTestActiveConnection();
      }, 1000);
    } catch (err: any) {
      alert('Gagal menerapkan Supabase baru: ' + (err?.message || err));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-200">
              <Zap size={14} className="text-yellow-400 animate-pulse" />
              Hot-Swap Database & Universal Migrator
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Manajemen & Migrasi Supabase
            </h1>
            <p className="text-sm text-blue-200/80 max-w-2xl">
              Ganti instance Supabase tanpa edit kode atau redeploy Vercel. Lengkap dengan 1-Klik Master SQL Schema, Migrasi Seluruh Data / Rentang Tanggal, dan Siaran Real-Time ke semua pengguna.
            </p>
          </div>

          {/* Active Status Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Database Aktif</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${activeTestStatus.success ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                <span className="text-xs font-bold text-emerald-300">
                  {activeTestStatus.success ? 'ONLINE' : 'CONNECTING'}
                </span>
              </div>
            </div>
            <div className="text-sm font-mono font-bold text-white truncate">
              {extractProjectRef(activeUrl)}
            </div>
            <div className="text-[11px] text-blue-200/70 truncate mt-0.5">
              {activeUrl}
            </div>
            {activeTestStatus.count !== undefined && (
              <div className="text-[11px] font-bold text-emerald-300 mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                <span>Total Data Scan:</span>
                <span className="font-mono text-xs">{activeTestStatus.count.toLocaleString()} rows</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 3 Main Columns / Workflow Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STEP 1: SQL Schema Initializer */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/80 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Inisialisasi SQL Baru</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">1-Klik Master DDL PostgreSQL</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Saat membuat proyek Supabase baru, jalankan skrip Master SQL berikut di <strong>SQL Editor</strong> untuk membuat seluruh 9 tabel, indeks query kecepatan tinggi, dan hak akses public secara instan.
            </p>

            <div className="bg-gray-50 dark:bg-gray-900/70 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <CheckCircle size={14} /> 9 Tabel Lengkap Termasuk Triggers
              </div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <CheckCircle size={14} /> Otomatis Disable RLS & Bypass Public
              </div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <CheckCircle size={14} /> Indeks Timestamp & Barcode Tercepat
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleCopySchema}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              {copiedSchema ? <Check size={18} className="text-emerald-300" /> : <Copy size={18} />}
              {copiedSchema ? 'Tersalin ke Clipboard!' : 'Copy Master SQL Schema'}
            </button>

            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              Buka Supabase Dashboard <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* STEP 2: Google Auth & Provider Guide */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/80 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Google OAuth (Tanpa Ribet)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gunakan ID Token Langsung</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-2xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles size={16} className="shrink-0 text-amber-500" />
                Tidak Perlu Edit Google Cloud Console!
              </div>
              <p className="leading-relaxed text-[11px]">
                Aplikasi ini menggunakan <strong>Google ID Token (GIS)</strong>. Domain Vercel Anda sudah terdaftar di Google Cloud.
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <li>Buka Supabase Baru &gt; <strong>Authentication</strong> &gt; <strong>Providers</strong>.</li>
              <li>Pilih <strong>Google</strong> dan aktifkan (Enable).</li>
              <li>Paste <strong>Client ID Google</strong> Anda yang lama.</li>
              <li>Simpan (Save). Login Google langsung berfungsi 100%!</li>
            </ol>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info size={16} className="text-blue-500 shrink-0" />
            <span>Tanpa perlu menambahkan redirect URI baru di Google Console.</span>
          </div>
        </div>

        {/* STEP 3: Hot-Swap Switcher & Broadcast */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/80 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hot-Swap & Siaran Live</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Refresh Otomatis Semua User</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Target Supabase URL
                </label>
                <input
                  type="text"
                  value={switchTargetUrl}
                  onChange={(e) => setSwitchTargetUrl(e.target.value)}
                  placeholder="https://xxxx.supabase.co"
                  className="w-full px-3.5 py-2.5 mt-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Target Supabase Anon Key
                </label>
                <textarea
                  value={switchTargetKey}
                  onChange={(e) => setSwitchTargetKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  rows={2}
                  className="w-full px-3.5 py-2 mt-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] font-mono focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <label className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={broadcastToAll}
                  onChange={(e) => setBroadcastToAll(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Siarkan Real-Time ke Seluruh Perangkat User
                </span>
              </label>

              {applySuccessMessage && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                  {applySuccessMessage}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleApplyNewSupabase}
            disabled={isApplying || !switchTargetUrl.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            {isApplying ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
            🚀 Terapkan & Siarkan Database
          </button>
        </div>

      </div>

      {/* STEP 4: Universal Data Migration Engine */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/80 p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Universal Data Migrator (Antar Supabase)
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Pindahkan data tanpa batasan waktu secara streaming batch dengan kecepatan tinggi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllTables}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all"
            >
              Pilih Semua Tabel
            </button>
            <button
              onClick={handleDeselectAllTables}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all"
            >
              Kosongkan
            </button>
          </div>
        </div>

        {/* Source & Target Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Source Supabase */}
          <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-sm">
                <Server size={18} /> Supabase Sumber (Asal)
              </div>
              <button
                onClick={handleTestSourceConnection}
                disabled={sourceTestStatus.loading}
                className="px-2.5 py-1 bg-orange-200 dark:bg-orange-900/60 hover:bg-orange-300 text-orange-800 dark:text-orange-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                {sourceTestStatus.loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Tes Sumber
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">SOURCE URL</label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://source.supabase.co"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">SOURCE ANON KEY</label>
              <textarea
                value={sourceKey}
                onChange={(e) => setSourceKey(e.target.value)}
                placeholder="eyJhbGci..."
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800 rounded-xl text-[10px] font-mono outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            {sourceTestStatus.message && (
              <div className={`p-2.5 rounded-xl text-xs ${sourceTestStatus.success ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'}`}>
                {sourceTestStatus.message}
              </div>
            )}
          </div>

          {/* Target Supabase */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <Server size={18} /> Supabase Target (Tujuan Baru)
              </div>
              <button
                onClick={handleTestTargetConnection}
                disabled={targetTestStatus.loading}
                className="px-2.5 py-1 bg-emerald-200 dark:bg-emerald-900/60 hover:bg-emerald-300 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                {targetTestStatus.loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Tes Target
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">TARGET URL</label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://target.supabase.co"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">TARGET ANON KEY</label>
              <textarea
                value={targetKey}
                onChange={(e) => setTargetKey(e.target.value)}
                placeholder="eyJhbGci..."
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[10px] font-mono outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {targetTestStatus.message && (
              <div className={`p-2.5 rounded-xl text-xs ${targetTestStatus.success ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'}`}>
                {targetTestStatus.message}
              </div>
            )}
          </div>

        </div>

        {/* Scope Selector: All Time vs Custom Range */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            PILIHAN CAKUPAN MIGRASI DATA:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setMigrationScope('ALL')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                migrationScope === 'ALL'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                migrationScope === 'ALL' ? 'border-blue-600' : 'border-gray-400'
              }`}>
                {migrationScope === 'ALL' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
              </div>
              <div>
                <div className="font-bold text-sm">Semua Data (Seluruh Waktu / Full Migration)</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Memindahkan 100% seluruh data dari semua tanggal tanpa batasan apapun.
                </p>
              </div>
            </div>

            <div
              onClick={() => setMigrationScope('CUSTOM')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                migrationScope === 'CUSTOM'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                migrationScope === 'CUSTOM' ? 'border-blue-600' : 'border-gray-400'
              }`}>
                {migrationScope === 'CUSTOM' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">Rentang Tanggal Kustom (Custom Range)</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                  Pilih tanggal mulai dan tanggal akhir untuk data scan.
                </p>

                {migrationScope === 'CUSTOM' && (
                  <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-1">DARI TANGGAL:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-1">SAMPAI TANGGAL:</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table Selection Checkboxes */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            PILIH TABEL UNTUK DIMIGRASIKAN ({selectedTables.length} dipilih):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AVAILABLE_TABLES.map((t) => {
              const isSelected = selectedTables.includes(t.name);
              return (
                <div
                  key={t.name}
                  onClick={() => toggleTableSelection(t.name)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-semibold'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 pointer-events-none"
                    />
                    <span className="truncate">{t.label}</span>
                  </div>
                  {t.supportsDateFilter && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                      Filterable
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar & Status */}
        {isMigrating && (
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                {migrationProgress.statusText}
              </span>
              <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">
                {migrationProgress.percentage}%
              </span>
            </div>
            
            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${migrationProgress.percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {!isMigrating ? (
            <button
              onClick={handleStartMigration}
              disabled={selectedTables.length === 0}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50"
            >
              <Play size={20} /> Mulai Migrasi Data
            </button>
          ) : (
            <button
              onClick={handleAbortMigration}
              className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 active:scale-[0.98]"
            >
              <Square size={20} /> Batalkan Migrasi
            </button>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Shield size={16} className="text-emerald-500 shrink-0" />
            <span>Migrasi menggunakan <code>upsert</code> aman (tidak akan menduplikat data yang sudah ada).</span>
          </div>
        </div>

        {/* Live Terminal Log */}
        {migrationLogs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
              <span>Live Terminal Log Migrasi</span>
              <button
                onClick={() => setMigrationLogs([])}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Clear Log
              </button>
            </div>
            <div
              ref={logContainerRef}
              className="w-full h-48 bg-gray-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-y-auto border border-gray-800 space-y-1 select-text"
            >
              {migrationLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">{log}</div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const fs = require('fs');

const filePath = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update logistikActiveTab state definition and add Cancel Tab states
const targetState = `const [logistikActiveTab, setLogistikActiveTab] = useState<'LOGISTIK' | 'PICKER'>('LOGISTIK');`;
const replacementState = `const [logistikActiveTab, setLogistikActiveTab] = useState<'LOGISTIK' | 'PICKER' | 'CANCEL'>('LOGISTIK');
   
   // --- TAB 3: DEDICATED CANCEL COMPARISON FILTER & PAGINATION ---
   const [cancelViewPickerSearch, setCancelViewPickerSearch] = useState<string>('');
   const [cancelViewPickerStaff, setCancelViewPickerStaff] = useState<string>('ALL');
   const [cancelViewPickerStatus, setCancelViewPickerStatus] = useState<'ALL' | 'INTERCEPTED' | 'LOGISTIK'>('ALL');
   const [cancelViewPickerPage, setCancelViewPickerPage] = useState<number>(1);
   const [cancelViewPickerRowsPerPage, setCancelViewPickerRowsPerPage] = useState<number>(50);
   const [cancelViewLogistikSearch, setCancelViewLogistikSearch] = useState<string>('');
   const [cancelViewLogistikPage, setCancelViewLogistikPage] = useState<number>(1);
   const [cancelViewLogistikRowsPerPage, setCancelViewLogistikRowsPerPage] = useState<number>(50);`;

if (!content.includes(targetState)) {
   console.error('targetState not found!');
   process.exit(1);
}
content = content.replace(targetState, replacementState);

// 2. Add useMemos for Cancel Tab
const targetExport = `   // Excel Export with Multiple Sheets (Picker, Logistik, Ringkasan)`;
const cancelMemos = `   // Dedicated Lists & Filters for Tab 3: Data Cancel Comparison
   const pickerCancelFullList = useMemo(() => {
      const logistikCancelSet = new Set(
         allLogistikMasterList.filter(l => l.is_cancelled).map(l => normalizeBarcodeKey(l.barcode))
      );
      return allPickerMasterList
         .filter(item => item.is_cancelled)
         .map(item => {
            const norm = normalizeBarcodeKey(item.barcode);
            const reachedLogistik = logistikCancelSet.has(norm);
            return {
               ...item,
               reachedLogistik
            };
         });
   }, [allPickerMasterList, allLogistikMasterList]);

   const filteredCancelPickerList = useMemo(() => {
      return pickerCancelFullList.filter(item => {
         if (cancelViewPickerStatus === 'INTERCEPTED' && item.reachedLogistik) return false;
         if (cancelViewPickerStatus === 'LOGISTIK' && !item.reachedLogistik) return false;
         if (cancelViewPickerStaff !== 'ALL' && item.employee_name !== cancelViewPickerStaff) return false;
         if (cancelViewPickerSearch.trim()) {
            const s = cancelViewPickerSearch.trim().toLowerCase();
            const b = (item.barcode || '').toLowerCase();
            const e = (item.employee_name || '').toLowerCase();
            if (!b.includes(s) && !e.includes(s)) return false;
         }
         return true;
      });
   }, [pickerCancelFullList, cancelViewPickerStatus, cancelViewPickerStaff, cancelViewPickerSearch]);

   const paginatedCancelPickerList = useMemo(() => {
      const from = (cancelViewPickerPage - 1) * cancelViewPickerRowsPerPage;
      return filteredCancelPickerList.slice(from, from + cancelViewPickerRowsPerPage);
   }, [filteredCancelPickerList, cancelViewPickerPage, cancelViewPickerRowsPerPage]);

   const logistikCancelFullList = useMemo(() => {
      return allLogistikMasterList.filter(item => item.is_cancelled);
   }, [allLogistikMasterList]);

   const filteredCancelLogistikList = useMemo(() => {
      return logistikCancelFullList.filter(item => {
         if (cancelViewLogistikSearch.trim()) {
            const s = cancelViewLogistikSearch.trim().toLowerCase();
            const b = (item.barcode || '').toLowerCase();
            if (!b.includes(s)) return false;
         }
         return true;
      });
   }, [logistikCancelFullList, cancelViewLogistikSearch]);

   const paginatedCancelLogistikList = useMemo(() => {
      const from = (cancelViewLogistikPage - 1) * cancelViewLogistikRowsPerPage;
      return filteredCancelLogistikList.slice(from, from + cancelViewLogistikRowsPerPage);
   }, [filteredCancelLogistikList, cancelViewLogistikPage, cancelViewLogistikRowsPerPage]);

   // Excel Export with Multiple Sheets (Picker, Logistik, Ringkasan)`;

if (!content.includes(targetExport)) {
   console.error('targetExport not found!');
   process.exit(1);
}
content = content.replace(targetExport, cancelMemos);

// 3. Update useEffect for Dual-Column Tab to include CANCEL tab
const targetEffect = `if (activeView === 'LOGISTIK_DATA' && logistikActiveTab === 'PICKER') {`;
const replacementEffect = `if (activeView === 'LOGISTIK_DATA' && (logistikActiveTab === 'PICKER' || logistikActiveTab === 'CANCEL')) {`;
if (!content.includes(targetEffect)) {
   console.error('targetEffect not found!');
   process.exit(1);
}
content = content.replace(targetEffect, replacementEffect);

// 4. Update Header Title & Icon
const targetHeader = `{logistikActiveTab === 'LOGISTIK' ? <Truck className="w-5 h-5 sm:w-6 sm:h-6" /> : <ScanLine className="w-5 h-5 sm:w-6 sm:h-6" />}`;
const replacementHeader = `{logistikActiveTab === 'LOGISTIK' ? <Truck className="w-5 h-5 sm:w-6 sm:h-6" /> : logistikActiveTab === 'PICKER' ? <ScanLine className="w-5 h-5 sm:w-6 sm:h-6" /> : <Ban className="w-5 h-5 sm:w-6 sm:h-6 text-rose-300" />}`;
if (!content.includes(targetHeader)) {
   console.error('targetHeader not found!');
   process.exit(1);
}
content = content.replace(targetHeader, replacementHeader);

const targetHeaderTitle = `{logistikActiveTab === 'LOGISTIK' ? 'Data Logistik' : 'Komparasi Picker vs Logistik'}`;
const replacementHeaderTitle = `{logistikActiveTab === 'LOGISTIK' ? 'Data Logistik' : logistikActiveTab === 'PICKER' ? 'Komparasi Picker vs Logistik' : 'Daftar Resi Cancel'}`;
content = content.replace(targetHeaderTitle, replacementHeaderTitle);

const targetHeaderSub = `{logistikActiveTab === 'LOGISTIK'
                                          ? 'Kelola & import data resi logistik dengan cepat. Cukup copy-paste no resi / ID pesanan.'
                                          : \`Komparasi 2 kolom data scan Picker vs data Logistik pada tanggal terpilih (\${filterDate}).\`}`;
const replacementHeaderSub = `{logistikActiveTab === 'LOGISTIK'
                                          ? 'Kelola & import data resi logistik dengan cepat. Cukup copy-paste no resi / ID pesanan.'
                                          : logistikActiveTab === 'PICKER'
                                          ? \`Komparasi 2 kolom data scan Picker vs data Logistik pada tanggal terpilih (\${filterDate}).\`
                                          : \`Daftar lengkap \${compComparisonStats.cancelPickerCount || 0} Resi Cancel di Picker & \${compComparisonStats.cancelLogistikCount || 0} Resi Cancel di Logistik (\${filterDate}).\`}`;
content = content.replace(targetHeaderSub, replacementHeaderSub);

// 5. Update Tab Switcher Buttons (Add Tab 3)
const targetTabs = `                                 <ArrowRightLeft size={16} />
                                 <span>Komparasi Picker vs Logistik</span>
                                 <span className={\`px-2 py-0.5 rounded-full text-[10px] font-extrabold \${
                                    logistikActiveTab === 'PICKER'
                                       ? 'bg-white/20 text-white'
                                       : 'bg-gray-200 dark:bg-gray-650 text-gray-700 dark:text-gray-300'
                                 }\`}>
                                    {(compComparisonStats.matchCount || 0).toLocaleString('id-ID')} Match / {(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')} Pckr
                                 </span>
                              </button>
                           </div>`;

const replacementTabs = `                                 <ArrowRightLeft size={16} />
                                 <span>Komparasi Picker vs Logistik</span>
                                 <span className={\`px-2 py-0.5 rounded-full text-[10px] font-extrabold \${
                                    logistikActiveTab === 'PICKER'
                                       ? 'bg-white/20 text-white'
                                       : 'bg-gray-200 dark:bg-gray-650 text-gray-700 dark:text-gray-300'
                                 }\`}>
                                    {(compComparisonStats.matchCount || 0).toLocaleString('id-ID')} Match / {(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')} Pckr
                                 </span>
                              </button>

                              <button
                                 onClick={() => {
                                    setLogistikActiveTab('CANCEL');
                                    setCancelViewPickerPage(1);
                                    setCancelViewLogistikPage(1);
                                 }}
                                 className={\`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer \${
                                    logistikActiveTab === 'CANCEL'
                                       ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-500/20'
                                       : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                                 }\`}
                              >
                                 <Ban size={16} />
                                 <span>Daftar Resi Cancel</span>
                                 <span className={\`px-2 py-0.5 rounded-full text-[10px] font-extrabold \${
                                    logistikActiveTab === 'CANCEL'
                                       ? 'bg-white/20 text-white'
                                       : 'bg-gray-200 dark:bg-gray-650 text-gray-700 dark:text-gray-300'
                                 }\`}>
                                    {(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')} Picker / {(compComparisonStats.cancelLogistikCount || 0).toLocaleString('id-ID')} Logistik
                                 </span>
                              </button>
                           </div>`;

if (!content.includes(targetTabs)) {
   console.error('targetTabs not found!');
   process.exit(1);
}
content = content.replace(targetTabs, replacementTabs);

// 6. Insert Tab 3 UI view right after Tab 2
const targetTab2Marker = `{activeView === 'BATCH_DATA' && (`;

const tab3UI = `{/* 18.3 DATA LOGISTIK - TAB 3: DEDICATED DAFTAR & KOMPARASI RESI CANCEL */}
                        {activeView === 'LOGISTIK_DATA' && logistikActiveTab === 'CANCEL' && (
                            <div className="w-full flex-1 flex flex-col min-h-0 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 p-3.5 sm:p-5 gap-4">
                               {/* 1. TOP CANCEL KPI ANALYTICS HEADER */}
                               <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                                  {/* Card 1: Total Cancel Picker */}
                                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-rose-200/80 dark:border-rose-800/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                                        <Ban size={22} />
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <div className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cancel di Picker & Ojol</div>
                                        <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                                           {(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')}
                                        </div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-semibold mt-0.5">
                                           Sempat di-scan oleh tim Picker
                                        </div>
                                     </div>
                                  </div>

                                  {/* Card 2: Total Cancel Logistik */}
                                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-amber-200/80 dark:border-amber-800/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                                        <Truck size={22} />
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <div className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cancel di Logistik</div>
                                        <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                                           {(compComparisonStats.cancelLogistikCount || 0).toLocaleString('id-ID')}
                                        </div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-semibold mt-0.5">
                                           Sempat ter-scan di meja Logistik
                                        </div>
                                     </div>
                                  </div>

                                  {/* Card 3: Dicegat di Picker (Aman) */}
                                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                                        <CheckCircle2 size={22} />
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <div className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">🛡️ Dicegat di Picker (Aman)</div>
                                        <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                                           {Math.max(0, (compComparisonStats.cancelPickerCount || 0) - (compComparisonStats.cancelLogistikCount || 0)).toLocaleString('id-ID')}
                                        </div>
                                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate font-semibold mt-0.5">
                                           Tidak diteruskan ke Logistik/Kurir
                                        </div>
                                     </div>
                                  </div>

                                  {/* Card 4: Lolos ke Logistik (Perlu Tarik) */}
                                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-purple-200/80 dark:border-purple-800/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                                        <AlertTriangle size={22} />
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <div className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">⚠️ Ter-Scan Logistik</div>
                                        <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                                           {(compComparisonStats.cancelLogistikCount || 0).toLocaleString('id-ID')}
                                        </div>
                                        <div className="text-[10px] text-purple-600 dark:text-purple-400 truncate font-semibold mt-0.5">
                                           Perlu ditarik dari paket kurir
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               {/* 2. ACTION BAR & BULK COPY BUTTONS */}
                               <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                     <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-750 text-xs font-bold text-gray-700 dark:text-gray-300">
                                        <CalendarIcon size={14} className="text-gray-500" />
                                        <span>Tanggal: {filterDate}</span>
                                     </div>
                                     <button
                                        onClick={loadDualComparisonData}
                                        disabled={isLoadingDualComparison}
                                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                     >
                                        <RefreshCw size={13} className={isLoadingDualComparison ? 'animate-spin' : ''} />
                                        <span>Refresh Data Cancel</span>
                                     </button>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                     <button
                                        onClick={async () => {
                                           const textToCopy = pickerCancelFullList.map(item => item.barcode).join('\\n');
                                           const ok = await copyToClipboard(textToCopy);
                                           if (ok) setSuccessToast(\`\${pickerCancelFullList.length} Barcode Cancel Picker disalin!\`);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                                        title="Salin Semua Resi Cancel Picker"
                                     >
                                        <Copy size={13} />
                                        <span>Salin Resi Cancel Picker ({pickerCancelFullList.length})</span>
                                     </button>
                                     <button
                                        onClick={async () => {
                                           const textToCopy = logistikCancelFullList.map(item => item.barcode).join('\\n');
                                           const ok = await copyToClipboard(textToCopy);
                                           if (ok) setSuccessToast(\`\${logistikCancelFullList.length} Barcode Cancel Logistik disalin!\`);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                                        title="Salin Semua Resi Cancel Logistik"
                                     >
                                        <Copy size={13} />
                                        <span>Salin Resi Cancel Logistik ({logistikCancelFullList.length})</span>
                                     </button>
                                  </div>
                               </div>

                               {/* 3. DUAL-COLUMN SIDE-BY-SIDE TABLE FOR CANCELLED ITEMS */}
                               <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-0">
                                  {/* KOLOM KIRI: RESI CANCEL DI PICKER */}
                                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 shadow-xs flex flex-col overflow-hidden">
                                     {/* Header Kolom Kiri */}
                                     <div className="p-3.5 bg-gradient-to-r from-rose-50 to-red-50/40 dark:from-rose-950/40 dark:to-red-950/20 border-b border-rose-100 dark:border-rose-900/60 flex flex-wrap items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5">
                                           <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-sm shadow-rose-600/30">
                                              <Ban size={16} />
                                           </div>
                                           <div>
                                              <div className="flex items-center gap-2">
                                                 <h3 className="text-sm font-bold text-gray-900 dark:text-white">Resi Cancel di Picker & Ojol</h3>
                                                 <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-mono">
                                                    {pickerCancelFullList.length} Resi
                                                 </span>
                                              </div>
                                              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
                                                 <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🛡️ Dicegat: {pickerCancelFullList.filter(p => !p.reachedLogistik).length}</span>
                                                 <span>•</span>
                                                 <span className="text-purple-600 dark:text-purple-400 font-semibold">⚠️ Ke Logistik: {pickerCancelFullList.filter(p => p.reachedLogistik).length}</span>
                                              </div>
                                           </div>
                                        </div>

                                        {/* Filter Status Intercepted / Reached Logistik */}
                                        <div className="flex items-center bg-white dark:bg-gray-850 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs flex-wrap gap-1">
                                           <button
                                              onClick={() => { setCancelViewPickerStatus('ALL'); setCancelViewPickerPage(1); }}
                                              className={\`px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                 cancelViewPickerStatus === 'ALL'
                                                    ? 'bg-rose-600 text-white shadow-xs'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                              }\`}
                                           >
                                              Semua ({pickerCancelFullList.length})
                                           </button>
                                           <button
                                              onClick={() => { setCancelViewPickerStatus('INTERCEPTED'); setCancelViewPickerPage(1); }}
                                              className={\`px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                 cancelViewPickerStatus === 'INTERCEPTED'
                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                              }\`}
                                           >
                                              🛡️ Dicegat ({pickerCancelFullList.filter(p => !p.reachedLogistik).length})
                                           </button>
                                           <button
                                              onClick={() => { setCancelViewPickerStatus('LOGISTIK'); setCancelViewPickerPage(1); }}
                                              className={\`px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                 cancelViewPickerStatus === 'LOGISTIK'
                                                    ? 'bg-purple-600 text-white shadow-xs'
                                                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                                              }\`}
                                           >
                                              ⚠️ Ke Logistik ({pickerCancelFullList.filter(p => p.reachedLogistik).length})
                                           </button>
                                        </div>
                                     </div>

                                     {/* Toolbar Search & Staff Filter */}
                                     <div className="p-2.5 bg-gray-50/70 dark:bg-gray-850/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2">
                                        <div className="flex-1 min-w-[140px] relative h-8">
                                           <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                           <input
                                              type="text"
                                              placeholder="Cari resi / nama staf picker cancel..."
                                              value={cancelViewPickerSearch}
                                              onChange={(e) => { setCancelViewPickerSearch(e.target.value); setCancelViewPickerPage(1); }}
                                              className="w-full pl-7 pr-6 h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-rose-500"
                                           />
                                           {cancelViewPickerSearch && (
                                              <button onClick={() => setCancelViewPickerSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                 <X size={11} />
                                              </button>
                                           )}
                                        </div>

                                        <select
                                           value={cancelViewPickerStaff}
                                           onChange={(e) => { setCancelViewPickerStaff(e.target.value); setCancelViewPickerPage(1); }}
                                           className="h-8 px-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-rose-500"
                                        >
                                           <option value="ALL">Semua Staf ({logistikPickerStaffList.length})</option>
                                           {logistikPickerStaffList.map(st => (
                                              <option key={st} value={st}>{st}</option>
                                           ))}
                                        </select>
                                     </div>

                                     {/* Tabel Data Cancel Kolom Kiri */}
                                     <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[300px] max-h-[500px]">
                                        <table className="w-full text-left whitespace-nowrap text-xs">
                                           <thead className="bg-gray-50/90 dark:bg-gray-850/90 backdrop-blur sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                                              <tr>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400 w-10 text-center">#</th>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400">Waktu Scan</th>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400">Barcode / Resi</th>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400">Staf Picker</th>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400 text-center">Status Alur</th>
                                              </tr>
                                           </thead>
                                           <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                              {isLoadingDualComparison ? (
                                                 <tr>
                                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                                       <Loader2 size={24} className="animate-spin mx-auto text-rose-600 mb-2" />
                                                       <span>Memuat data resi cancel...</span>
                                                    </td>
                                                 </tr>
                                              ) : paginatedCancelPickerList.length === 0 ? (
                                                 <tr>
                                                    <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                                                       Tidak ada resi cancel yang sesuai dengan filter.
                                                    </td>
                                                 </tr>
                                              ) : (
                                                 paginatedCancelPickerList.map((item, idx) => (
                                                    <tr
                                                       key={item.id || idx}
                                                       className="bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/60 border-l-4 border-l-rose-500 transition-colors"
                                                    >
                                                       <td className="px-3 py-2 text-center font-mono text-gray-400 font-bold">
                                                          {(cancelViewPickerPage - 1) * cancelViewPickerRowsPerPage + idx + 1}
                                                       </td>
                                                       <td className="px-3 py-2 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                                                          {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                                                       </td>
                                                       <td className="px-3 py-2 font-mono font-bold text-gray-900 dark:text-gray-100">
                                                          <div className="flex items-center gap-1.5 flex-wrap">
                                                             <span>{item.barcode}</span>
                                                             <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                                                                CANCEL
                                                             </span>
                                                             <button
                                                                onClick={async () => {
                                                                   const ok = await copyToClipboard(item.barcode);
                                                                   if (ok) setSuccessToast(\`Barcode \${item.barcode} disalin!\`);
                                                                }}
                                                                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                                                title="Salin Barcode Ini"
                                                             >
                                                                <Copy size={11} />
                                                             </button>
                                                          </div>
                                                       </td>
                                                       <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                                                          <div className="flex items-center gap-1.5 flex-wrap">
                                                             <span className={\`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider \${
                                                                item.role_category === 'OJOL'
                                                                   ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                                   : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                                                             }\`}>
                                                                {item.role_category === 'OJOL' ? '🛵 OJOL' : '📦 PICKER'}
                                                             </span>
                                                             <span className="font-semibold text-xs">{item.employee_name || '-'}</span>
                                                          </div>
                                                       </td>
                                                       <td className="px-3 py-2 text-center">
                                                          {item.reachedLogistik ? (
                                                             <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                                                                <AlertTriangle size={11} /> TER-SCAN LOGISTIK
                                                             </span>
                                                          ) : (
                                                             <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                                                <CheckCircle2 size={11} /> 🛡️ AMAN DICEGAT
                                                             </span>
                                                          )}
                                                       </td>
                                                    </tr>
                                                 ))
                                              )}
                                           </tbody>
                                        </table>
                                     </div>

                                     {/* Pagination Footer Kolom Picker */}
                                     <div className="p-2.5 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1 text-gray-500">
                                           <span>Baris:</span>
                                           <select
                                              value={cancelViewPickerRowsPerPage}
                                              onChange={(e) => { setCancelViewPickerRowsPerPage(Number(e.target.value)); setCancelViewPickerPage(1); }}
                                              className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-[11px]"
                                           >
                                              <option value={25}>25</option>
                                              <option value={50}>50</option>
                                              <option value={100}>100</option>
                                              <option value={10000}>Semua</option>
                                           </select>
                                           <span className="ml-1 text-[11px]">({filteredCancelPickerList.length} dari {pickerCancelFullList.length})</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                           <button
                                              onClick={() => setCancelViewPickerPage(p => Math.max(1, p - 1))}
                                              disabled={cancelViewPickerPage === 1}
                                              className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-40 text-xs font-bold cursor-pointer"
                                           >
                                              <ChevronLeft size={12} />
                                           </button>
                                           <span className="px-2 py-0.5 font-bold text-[11px] text-rose-600 dark:text-rose-400">
                                              {cancelViewPickerPage} / {Math.max(1, Math.ceil(filteredCancelPickerList.length / cancelViewPickerRowsPerPage))}
                                           </span>
                                           <button
                                              onClick={() => setCancelViewPickerPage(p => p + 1)}
                                              disabled={cancelViewPickerPage * cancelViewPickerRowsPerPage >= filteredCancelPickerList.length}
                                              className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-40 text-xs font-bold cursor-pointer"
                                           >
                                              <ChevronRight size={12} />
                                           </button>
                                        </div>
                                     </div>
                                  </div>

                                  {/* KOLOM KANAN: RESI CANCEL DI LOGISTIK */}
                                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 shadow-xs flex flex-col overflow-hidden">
                                     {/* Header Kolom Kanan */}
                                     <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-orange-950/20 border-b border-amber-100 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5">
                                           <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-sm shadow-amber-600/30">
                                              <Truck size={16} />
                                           </div>
                                           <div>
                                              <div className="flex items-center gap-2">
                                                 <h3 className="text-sm font-bold text-gray-900 dark:text-white">Resi Cancel di Logistik</h3>
                                                 <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-mono">
                                                    {logistikCancelFullList.length} Resi
                                                 </span>
                                              </div>
                                              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                                 Resi yang sempat ter-scan di meja Logistik
                                              </div>
                                           </div>
                                        </div>
                                     </div>

                                     {/* Toolbar Search Kolom Kanan */}
                                     <div className="p-2.5 bg-gray-50/70 dark:bg-gray-850/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                        <div className="flex-1 relative h-8">
                                           <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                           <input
                                              type="text"
                                              placeholder="Cari barcode / resi logistik cancel..."
                                              value={cancelViewLogistikSearch}
                                              onChange={(e) => { setCancelViewLogistikSearch(e.target.value); setCancelViewLogistikPage(1); }}
                                              className="w-full pl-7 pr-6 h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-amber-500"
                                           />
                                           {cancelViewLogistikSearch && (
                                              <button onClick={() => setCancelViewLogistikSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                 <X size={11} />
                                              </button>
                                           )}
                                        </div>
                                     </div>

                                     {/* Tabel Data Cancel Kolom Kanan */}
                                     <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[300px] max-h-[500px]">
                                        <table className="w-full text-left whitespace-nowrap text-xs">
                                           <thead className="bg-gray-50/90 dark:bg-gray-850/90 backdrop-blur sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                                              <tr>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400 w-10 text-center">#</th>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400">Waktu Scan Logistik</th>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400">Barcode / Resi Logistik</th>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400">Role</th>
                                                 <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-gray-400 text-center">Status</th>
                                              </tr>
                                           </thead>
                                           <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                              {isLoadingDualComparison ? (
                                                 <tr>
                                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                                       <Loader2 size={24} className="animate-spin mx-auto text-amber-600 mb-2" />
                                                       <span>Memuat data resi cancel logistik...</span>
                                                    </td>
                                                 </tr>
                                              ) : paginatedCancelLogistikList.length === 0 ? (
                                                 <tr>
                                                    <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                                                       Tidak ada resi cancel logistik yang sesuai dengan filter.
                                                    </td>
                                                 </tr>
                                              ) : (
                                                 paginatedCancelLogistikList.map((item, idx) => (
                                                    <tr
                                                       key={item.id || idx}
                                                       className="bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/60 border-l-4 border-l-rose-500 transition-colors"
                                                    >
                                                       <td className="px-3 py-2 text-center font-mono text-gray-400 font-bold">
                                                          {(cancelViewLogistikPage - 1) * cancelViewLogistikRowsPerPage + idx + 1}
                                                       </td>
                                                       <td className="px-3 py-2 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                                                          {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                                                       </td>
                                                       <td className="px-3 py-2 font-mono font-bold text-gray-900 dark:text-gray-100">
                                                          <div className="flex items-center gap-1.5 flex-wrap">
                                                             <span>{item.barcode}</span>
                                                             <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                                                                CANCEL
                                                             </span>
                                                             <button
                                                                onClick={async () => {
                                                                   const ok = await copyToClipboard(item.barcode);
                                                                   if (ok) setSuccessToast(\`Barcode Logistik \${item.barcode} disalin!\`);
                                                                }}
                                                                className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                                                                title="Salin Barcode Ini"
                                                             >
                                                                <Copy size={11} />
                                                             </button>
                                                          </div>
                                                       </td>
                                                       <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                             {item.role || 'LOGISTIK'}
                                                          </span>
                                                       </td>
                                                       <td className="px-3 py-2 text-center">
                                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                                             <Ban size={11} className="text-rose-600 dark:text-rose-400" />
                                                             DATA CANCEL
                                                          </span>
                                                       </td>
                                                    </tr>
                                                 ))
                                              )}
                                           </tbody>
                                        </table>
                                     </div>

                                     {/* Pagination Footer Kolom Logistik */}
                                     <div className="p-2.5 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1 text-gray-500">
                                           <span>Baris:</span>
                                           <select
                                              value={cancelViewLogistikRowsPerPage}
                                              onChange={(e) => { setCancelViewLogistikRowsPerPage(Number(e.target.value)); setCancelViewLogistikPage(1); }}
                                              className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-[11px]"
                                           >
                                              <option value={25}>25</option>
                                              <option value={50}>50</option>
                                              <option value={100}>100</option>
                                              <option value={10000}>Semua</option>
                                           </select>
                                           <span className="ml-1 text-[11px]">({filteredCancelLogistikList.length} dari {logistikCancelFullList.length})</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                           <button
                                              onClick={() => setCancelViewLogistikPage(p => Math.max(1, p - 1))}
                                              disabled={cancelViewLogistikPage === 1}
                                              className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-40 text-xs font-bold cursor-pointer"
                                           >
                                              <ChevronLeft size={12} />
                                           </button>
                                           <span className="px-2 py-0.5 font-bold text-[11px] text-amber-600 dark:text-amber-400">
                                              {cancelViewLogistikPage} / {Math.max(1, Math.ceil(filteredCancelLogistikList.length / cancelViewLogistikRowsPerPage))}
                                           </span>
                                           <button
                                              onClick={() => setCancelViewLogistikPage(p => p + 1)}
                                              disabled={cancelViewLogistikPage * cancelViewLogistikRowsPerPage >= filteredCancelLogistikList.length}
                                              className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-40 text-xs font-bold cursor-pointer"
                                           >
                                              <ChevronRight size={12} />
                                           </button>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                        )}

                        {activeView === 'BATCH_DATA' && (`;

if (!content.includes(targetTab2Marker)) {
   console.error('targetTab2Marker not found!');
   process.exit(1);
}
content = content.replace(targetTab2Marker, tab3UI);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched AdminDashboard.tsx with Tab 3 (Daftar Resi Cancel)!');

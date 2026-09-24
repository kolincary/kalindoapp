const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

console.log("Applying UI size enhancement and instant switching for 1 Hari / Rentang Tanggal...");

// 1. Optimize fetchPackingData Firestore Range with Promise.all
const oldFsFetchBlock = `            try {
               let combinedDocs: any[] = [];
               for (let i = 0; i < dateList.length; i++) {
                  const dStr = dateList[i];
                  let singleDayDocs: any[] = [];
                  if (firestoreDayDataCache.has(dStr)) {
                     singleDayDocs = firestoreDayDataCache.get(dStr)!;
                  } else {
                     setFirestoreLoadingText(\`Memuat data \${dStr} (\${i + 1}/\${dateList.length})...\`);
                     // Yield to UI thread to keep animations and clicks 100% fluid
                     await new Promise(r => setTimeout(r, 10));

                     const dStartMs = new Date(\`\${dStr}T00:00:00\`).getTime();
                     const dEndMs = new Date(\`\${dStr}T23:59:59.999\`).getTime();
                     const dQuery = fsQuery(
                        collection(db, 'scanned_items'),
                        where('timestamp', '>=', dStartMs),
                        where('timestamp', '<=', dEndMs)
                     );
                     const dSnap = await getDocs(dQuery);
                     singleDayDocs = dSnap.docs.map(docSnap => ({
                        id: docSnap.id,
                        ...(docSnap.data() as Record<string, any>)
                     }));
                     firestoreDayDataCache.set(dStr, singleDayDocs);
                     setFirestoreFetchCount(prev => prev + 1);
                  }
                  combinedDocs = combinedDocs.concat(singleDayDocs);
               }
               setFirestoreLoadingText('');`;

const newFsFetchBlock = `            try {
               const uncachedDates = dateList.filter(dStr => !firestoreDayDataCache.has(dStr));
               if (uncachedDates.length > 0) {
                  setFirestoreLoadingText(\`Memuat \${uncachedDates.length} hari dari Firestore...\`);
                  await Promise.all(
                     uncachedDates.map(async (dStr) => {
                        const dStartMs = new Date(\`\${dStr}T00:00:00\`).getTime();
                        const dEndMs = new Date(\`\${dStr}T23:59:59.999\`).getTime();
                        const dQuery = fsQuery(
                           collection(db, 'scanned_items'),
                           where('timestamp', '>=', dStartMs),
                           where('timestamp', '<=', dEndMs)
                        );
                        const dSnap = await getDocs(dQuery);
                        const singleDayDocs = dSnap.docs.map(docSnap => ({
                           id: docSnap.id,
                           ...(docSnap.data() as Record<string, any>)
                        }));
                        firestoreDayDataCache.set(dStr, singleDayDocs);
                     })
                  );
                  setFirestoreFetchCount(prev => prev + uncachedDates.length);
               }

               let combinedDocs: any[] = [];
               for (const dStr of dateList) {
                  const dayDocs = firestoreDayDataCache.get(dStr) || [];
                  combinedDocs = combinedDocs.concat(dayDocs);
               }
               setFirestoreLoadingText('');`;

if (norm.includes(oldFsFetchBlock)) {
   norm = norm.replace(oldFsFetchBlock, newFsFetchBlock);
   console.log("✅ 1. Parallelized Firestore range fetching in fetchPackingData.");
} else {
   console.log("⚠️ 1. oldFsFetchBlock not found directly.");
}

// 2. Optimize exportPackingData Firestore Range with Promise.all
const oldFsExportBlock = `                for (let i = 0; i < dateList.length; i++) {
                   const dStr = dateList[i];
                   let singleDayDocs: any[] = [];
                   if (firestoreDayDataCache.has(dStr)) {
                      singleDayDocs = firestoreDayDataCache.get(dStr)!;
                   } else {
                      setExportPackingProgress(Math.round(((i + 1) / (dateList.length + 1)) * 50));
                      await new Promise(r => setTimeout(r, 10));
                      const dStartMs = new Date(\`\${dStr}T00:00:00\`).getTime();
                      const dEndMs = new Date(\`\${dStr}T23:59:59.999\`).getTime();
                      const dQuery = fsQuery(
                         collection(db, 'scanned_items'),
                         where('timestamp', '>=', dStartMs),
                         where('timestamp', '<=', dEndMs)
                      );
                      const dSnap = await getDocs(dQuery);
                      singleDayDocs = dSnap.docs.map(docSnap => ({
                         id: docSnap.id,
                         ...(docSnap.data() as Record<string, any>)
                      }));
                      firestoreDayDataCache.set(dStr, singleDayDocs);
                   }
                   allDayDocs = allDayDocs.concat(singleDayDocs);
                }`;

const newFsExportBlock = `                const uncachedDates = dateList.filter(dStr => !firestoreDayDataCache.has(dStr));
                if (uncachedDates.length > 0) {
                   setExportPackingProgress(15);
                   await Promise.all(
                      uncachedDates.map(async (dStr) => {
                         const dStartMs = new Date(\`\${dStr}T00:00:00\`).getTime();
                         const dEndMs = new Date(\`\${dStr}T23:59:59.999\`).getTime();
                         const dQuery = fsQuery(
                            collection(db, 'scanned_items'),
                            where('timestamp', '>=', dStartMs),
                            where('timestamp', '<=', dEndMs)
                         );
                         const dSnap = await getDocs(dQuery);
                         const singleDayDocs = dSnap.docs.map(docSnap => ({
                            id: docSnap.id,
                            ...(docSnap.data() as Record<string, any>)
                         }));
                         firestoreDayDataCache.set(dStr, singleDayDocs);
                      })
                   );
                   setExportPackingProgress(40);
                }

                for (const dStr of dateList) {
                   const dayDocs = firestoreDayDataCache.get(dStr) || [];
                   allDayDocs = allDayDocs.concat(dayDocs);
                }`;

if (norm.includes(oldFsExportBlock)) {
   norm = norm.replace(oldFsExportBlock, newFsExportBlock);
   console.log("✅ 2. Parallelized Firestore range fetching in exportPackingData.");
} else {
   console.log("⚠️ 2. oldFsExportBlock not found directly.");
}

// 3. Enlarge UI Sizing and remove double fetch in Date Toggle Pill & Inputs
const oldToolbarBlock = `                                    {/* Date Filter (Support Single & Range 7 Hari Khusus Admin & Admin3 via Firestore) */}
                                    <div className={\`col-span-12 sm:col-span-12 \${canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? 'md:col-span-6 lg:col-span-4' : (activeView === 'SCAN_ALL' || activeView.startsWith('GUDANG_') ? 'md:col-span-4 lg:col-span-3' : 'md:col-span-3 lg:col-span-2')} relative\`}>
                                       {/* Admin3 & Admin Toggle Pill */}
                                       {canUse7DaysRangeFilter && (
                                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                             <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-semibold">
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      setDateFilterMode('SINGLE');
                                                      fetchPackingData(1);
                                                   }}
                                                   className={\`px-2 py-0.5 rounded-md transition-all cursor-pointer \${dateFilterMode === 'SINGLE' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}\`}
                                                >
                                                   📅 1 Hari
                                                </button>
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      setDateFilterMode('RANGE');
                                                      fetchPackingData(1);
                                                   }}
                                                   className={\`px-2 py-0.5 rounded-md transition-all cursor-pointer \${dateFilterMode === 'RANGE' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}\`}
                                                >
                                                   📆 Rentang Tanggal
                                                </button>
                                             </div>

                                             {dateFilterMode === 'RANGE' && (
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                      const today = new Date().toISOString().split('T')[0];
                                                      setRangeStartDate(sevenDaysAgo);
                                                      setRangeEndDate(today);
                                                   }}
                                                   className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                                   title="Set otomatis rentang 7 hari terakhir s/d hari ini"
                                                >
                                                   ⚡ 7 Hari Terakhir
                                                </button>
                                             )}
                                          </div>
                                       )}

                                       {/* Date Inputs (Auto-Clamped to Max 7 Days) */}
                                       {canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? (
                                          <div className="flex items-center gap-1.5 h-10 w-full">
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeStartDate}
                                                   max={rangeEndDate}
                                                   onChange={(e) => {
                                                      const val = e.target.value;
                                                      if (!val) return;
                                                      const sD = new Date(val);
                                                      const eD = new Date(rangeEndDate);
                                                      const diff = Math.ceil((eD.getTime() - sD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                                      if (diff > 7) {
                                                         const newEnd = new Date(sD.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                         setRangeEndDate(newEnd);
                                                         setSuccessToast("Rentang tanggal disesuaikan maksimal 7 hari.");
                                                      }
                                                      setPage(1);
                                                      setRangeStartDate(val);
                                                   }}
                                                   className="w-full h-full px-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Mulai (Maks 7 hari)"
                                                />
                                             </div>
                                             <span className="text-xs font-bold text-gray-400 dark:text-gray-500 shrink-0">s/d</span>
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeEndDate}
                                                   min={rangeStartDate}
                                                   max={new Date().toISOString().split('T')[0]}
                                                   onChange={(e) => {
                                                      const val = e.target.value;
                                                      if (!val) return;
                                                      const eD = new Date(val);
                                                      const sD = new Date(rangeStartDate);
                                                      const diff = Math.ceil((eD.getTime() - sD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                                      if (diff > 7) {
                                                         const newStart = new Date(eD.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                         setRangeStartDate(newStart);
                                                         setSuccessToast("Rentang tanggal disesuaikan maksimal 7 hari.");
                                                      }
                                                      setPage(1);
                                                      setRangeEndDate(val);
                                                   }}
                                                   className="w-full h-full px-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Akhir (Maks 7 hari)"
                                                />
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="relative w-full h-10">
                                             <div className="relative w-full h-full group">
                                                <CalendarIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />
                                                {canManageDate ? (
                                                   <input
                                                      id="main-date-filter"
                                                      type="date"
                                                      value={filterDate}
                                                      min={!isDateFilterUnrestricted ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                                                      max={!isDateFilterUnrestricted ? new Date().toISOString().split('T')[0] : undefined}
                                                      onChange={(e) => {
                                                         const selected = e.target.value;
                                                         if (!isDateFilterUnrestricted) {
                                                            const minDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                            if (selected && selected < minDate) {
                                                               alert("Restricted: You can only view data from the last 2 days.");
                                                               return;
                                                            }
                                                         }
                                                         setPage(1);
                                                         setFilterDate(selected);
                                                      }}
                                                      onClick={(e) => {
                                                         try {
                                                            if (typeof (e.currentTarget as any).showPicker === 'function') {
                                                               (e.currentTarget as any).showPicker();
                                                            }
                                                         } catch (err) {}
                                                      }}
                                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                   />
                                                ) : null}
                                                <div className={\`w-full h-full pl-9 pr-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm flex items-center font-semibold shadow-2xs pointer-events-none \${canManageDate ? 'text-gray-800 dark:text-gray-200 group-hover:border-blue-400 dark:group-hover:border-blue-500' : 'text-gray-400 bg-gray-50/50'} transition-all\`}>
                                                   {formatDisplayDate(canManageDate ? filterDate : getTodayString())}
                                                </div>
                                                {canManageDate && <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />}
                                             </div>
                                          </div>
                                       )}`;

const newToolbarBlock = `                                    {/* Date Filter (Support Single & Range 7 Hari Khusus Admin & Admin3 via Firestore) */}
                                    <div className={\`col-span-12 sm:col-span-12 \${canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? 'md:col-span-7 lg:col-span-5 xl:col-span-4' : (activeView === 'SCAN_ALL' || activeView.startsWith('GUDANG_') ? 'md:col-span-4 lg:col-span-3' : 'md:col-span-4 lg:col-span-3 xl:col-span-2.5')} relative\`}>
                                       {/* Admin3 & Admin Toggle Pill (Enlarged & Prominent) */}
                                       {canUse7DaysRangeFilter && (
                                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                                             <div className="inline-flex rounded-xl p-1 bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 text-xs sm:text-sm font-bold shadow-2xs">
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      if (dateFilterMode !== 'SINGLE') {
                                                         setPage(1);
                                                         setDateFilterMode('SINGLE');
                                                      }
                                                   }}
                                                   className={\`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 \${dateFilterMode === 'SINGLE' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs font-black ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'}\`}
                                                >
                                                   <CalendarIcon size={14} />
                                                   <span>1 Hari</span>
                                                </button>
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      if (dateFilterMode !== 'RANGE') {
                                                         setPage(1);
                                                         setDateFilterMode('RANGE');
                                                      }
                                                   }}
                                                   className={\`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 \${dateFilterMode === 'RANGE' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-black ring-1 ring-blue-500/50' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'}\`}
                                                >
                                                   <Calendar size={14} />
                                                   <span>Rentang Tanggal</span>
                                                </button>
                                             </div>

                                             {dateFilterMode === 'RANGE' && (
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                      const today = new Date().toISOString().split('T')[0];
                                                      setPage(1);
                                                      setRangeStartDate(sevenDaysAgo);
                                                      setRangeEndDate(today);
                                                   }}
                                                   className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                                   title="Set otomatis rentang 7 hari terakhir s/d hari ini"
                                                >
                                                   <span>⚡ 7 Hari Terakhir</span>
                                                </button>
                                             )}
                                          </div>
                                       )}

                                       {/* Date Inputs (Auto-Clamped to Max 7 Days, Enlarged & Modernized) */}
                                       {canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? (
                                          <div className="flex items-center gap-2 h-11 w-full">
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeStartDate}
                                                   max={rangeEndDate}
                                                   onChange={(e) => {
                                                      const val = e.target.value;
                                                      if (!val) return;
                                                      const sD = new Date(val);
                                                      const eD = new Date(rangeEndDate);
                                                      const diff = Math.ceil((eD.getTime() - sD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                                      if (diff > 7) {
                                                         const newEnd = new Date(sD.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                         setRangeEndDate(newEnd);
                                                         setSuccessToast("Rentang tanggal disesuaikan maksimal 7 hari.");
                                                      }
                                                      setPage(1);
                                                      setRangeStartDate(val);
                                                   }}
                                                   className="w-full h-full px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Mulai (Maks 7 hari)"
                                                />
                                             </div>
                                             <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-black text-gray-500 dark:text-gray-400 rounded-lg shrink-0 select-none">
                                                s/d
                                             </span>
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeEndDate}
                                                   min={rangeStartDate}
                                                   max={new Date().toISOString().split('T')[0]}
                                                   onChange={(e) => {
                                                      const val = e.target.value;
                                                      if (!val) return;
                                                      const eD = new Date(val);
                                                      const sD = new Date(rangeStartDate);
                                                      const diff = Math.ceil((eD.getTime() - sD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                                      if (diff > 7) {
                                                         const newStart = new Date(eD.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                         setRangeStartDate(newStart);
                                                         setSuccessToast("Rentang tanggal disesuaikan maksimal 7 hari.");
                                                      }
                                                      setPage(1);
                                                      setRangeEndDate(val);
                                                   }}
                                                   className="w-full h-full px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Akhir (Maks 7 hari)"
                                                />
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="relative w-full h-11">
                                             <div className="relative w-full h-full group">
                                                <CalendarIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />
                                                {canManageDate ? (
                                                   <input
                                                      id="main-date-filter"
                                                      type="date"
                                                      value={filterDate}
                                                      min={!isDateFilterUnrestricted ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                                                      max={!isDateFilterUnrestricted ? new Date().toISOString().split('T')[0] : undefined}
                                                      onChange={(e) => {
                                                         const selected = e.target.value;
                                                         if (!isDateFilterUnrestricted) {
                                                            const minDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                            if (selected && selected < minDate) {
                                                               alert("Restricted: You can only view data from the last 2 days.");
                                                               return;
                                                            }
                                                         }
                                                         setPage(1);
                                                         setFilterDate(selected);
                                                      }}
                                                      onClick={(e) => {
                                                         try {
                                                            if (typeof (e.currentTarget as any).showPicker === 'function') {
                                                               (e.currentTarget as any).showPicker();
                                                            }
                                                         } catch (err) {}
                                                      }}
                                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                   />
                                                ) : null}
                                                <div className={\`w-full h-full pl-10 pr-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm flex items-center font-bold shadow-2xs pointer-events-none \${canManageDate ? 'text-gray-800 dark:text-gray-200 group-hover:border-blue-400 dark:group-hover:border-blue-500' : 'text-gray-400 bg-gray-50/50'} transition-all\`}>
                                                   {formatDisplayDate(canManageDate ? filterDate : getTodayString())}
                                                </div>
                                                {canManageDate && <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />}
                                             </div>
                                          </div>
                                       )}`;

if (norm.includes(oldToolbarBlock)) {
   norm = norm.replace(oldToolbarBlock, newToolbarBlock);
   console.log("✅ 3. Enlarged UI Sizing and eliminated mode switching lag.");
} else {
   console.log("⚠️ 3. oldToolbarBlock not matched directly.");
}

const finalCode = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(targetFile, finalCode, 'utf8');
console.log("Finished applying range size and speed fixes!");

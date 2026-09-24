const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

console.log("Applying Day-by-Day Chunky Caching & 7-Day Clamping for Firestore Range...");

// 1. Replace the Range Fetch block in fetchPackingData
const oldRangeFetchStart = `         // JIKA MODE RENTANG TANGGAL DIAKTIFKAN (KHUSUS ADMIN/ADMIN3 VIA FIRESTORE ONLY)`;
const oldRangeFetchEnd = `               return;
            } catch (err: any) {
               console.error("Error fetching date range from Firestore:", err);
               alert("Gagal memuat data rentang tanggal dari Firestore: " + err.message);
            } finally {
               setIsLoadingPacking(false);
            }
         }`;

const idx1 = code.indexOf(oldRangeFetchStart);
const idx2 = code.indexOf(oldRangeFetchEnd, idx1);

if (idx1 !== -1 && idx2 !== -1) {
   const newRangeFetchBlock = `         // JIKA MODE RENTANG TANGGAL DIAKTIFKAN (KHUSUS ADMIN/ADMIN3 VIA FIRESTORE ONLY)
         if (canUse7DaysRangeFilter && dateFilterMode === 'RANGE') {
            // Safety Clamp: Maksimal 7 Hari agar browser tidak crash/freeze
            let startD = new Date(rangeStartDate);
            let endD = new Date(rangeEndDate);
            if (isNaN(startD.getTime())) startD = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
            if (isNaN(endD.getTime())) endD = new Date();
            if (startD > endD) startD = endD;
            const diffDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (diffDays > 7) {
               startD = new Date(endD.getTime() - 6 * 24 * 60 * 60 * 1000);
               const clampedStartStr = startD.toISOString().split('T')[0];
               setRangeStartDate(clampedStartStr);
            }

            // Generate list of date strings: [date1, date2, ..., dateN]
            const dateList: string[] = [];
            let curr = new Date(startD);
            while (curr <= endD) {
               dateList.push(curr.toISOString().split('T')[0]);
               curr.setDate(curr.getDate() + 1);
            }

            try {
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
               setFirestoreLoadingText('');

               let targetRole = 'PACKING';
               if (activeView === 'PACKING_2_DATA') targetRole = 'PACKING_2';
               else if (activeView === 'SORTIR_DATA') targetRole = 'SORTIR';
               else if (activeView === 'PICKER_DATA') targetRole = 'PICKER';
               else if (activeView === 'CHECKER_DATA') targetRole = 'CHECKER';
               else if (activeView === 'LOGISTIK_DATA') targetRole = 'LOGISTIK';
               else if (activeView === 'OJOL_DATA') targetRole = 'OJOL';
               else if (activeView.startsWith('GUDANG')) targetRole = 'GUDANG';

               let fsRoleItems: any[] = [];
               combinedDocs.forEach(d => {
                  const r = (d.role || '').toUpperCase();
                  let isMatch = false;
                  if (activeView === 'SCAN_ALL') {
                     isMatch = true;
                  } else if (targetRole === 'PACKING_2') {
                     isMatch = (r === 'PACKING_2' || r === 'PACKING_2_DATA');
                  } else if (targetRole === 'PACKING') {
                     isMatch = (r === 'PACKING' || r === 'PACKING_DATA' || (r.includes('PACK') && r !== 'PACKING_2'));
                  } else if (targetRole === 'SORTIR') {
                     isMatch = (r === 'SORTIR' || r === 'SORTIR_DATA');
                  } else if (targetRole === 'PICKER') {
                     isMatch = (r === 'PICKER' || r === 'PICKER_DATA');
                  } else if (targetRole === 'CHECKER') {
                     isMatch = (r === 'CHECKER' || r === 'CHECKER_DATA');
                  } else if (targetRole === 'LOGISTIK') {
                     isMatch = (r === 'LOGISTIK' || r === 'LOGISTIK_DATA');
                  } else if (targetRole === 'OJOL') {
                     isMatch = (r === 'OJOL' || r === 'OJOL_DATA');
                  } else if (targetRole === 'GUDANG') {
                     isMatch = (r === 'GUDANG' || r.includes('GUDANG'));
                  }

                  if (isMatch) {
                     let rawBarcode = (d.barcode || '').toString().trim();
                     if (rawBarcode && targetRole !== 'LOGISTIK' && rawBarcode.startsWith('0026')) {
                        rawBarcode = rawBarcode.slice(2);
                     }
                     if (/^LXAD[^-]/i.test(rawBarcode)) rawBarcode = 'LXAD-' + rawBarcode.substring(4);
                     if (/^JNAP[^-]/i.test(rawBarcode)) rawBarcode = 'JNAP-' + rawBarcode.substring(4);
                     if (/^JNEB[^-]/i.test(rawBarcode)) rawBarcode = 'JNEB-' + rawBarcode.substring(4);

                     const empName = d.employee_name || d.admin_name || d.leader_name || '-';
                     fsRoleItems.push({
                        ...d,
                        barcode: rawBarcode,
                        employee_name: empName,
                        shift: shiftMap.get(empName) || 'Unknown',
                        is_from_firestore: true
                     });
                  }
               });

               // Filter Staff
               if (filterPackingStaff && filterPackingStaff !== 'ALL') {
                  fsRoleItems = fsRoleItems.filter(item => item.employee_name === filterPackingStaff || item.admin_name === filterPackingStaff);
               }
               // Filter Shift
               if (filterPackingShift && filterPackingShift !== 'ALL') {
                  const validNames = new Set(shiftToNamesMap[filterPackingShift] || []);
                  fsRoleItems = fsRoleItems.filter(item => validNames.has(item.employee_name));
               }
               // Filter Cancel Only
               if (filterCancelOnly) {
                  fsRoleItems = fsRoleItems.filter(item => (item.description || '').includes('[CANCEL] Camera Scan'));
               }
               // Filter Search Term
               if (packingSearch) {
                  const term = packingSearch.toLowerCase();
                  fsRoleItems = fsRoleItems.filter(item =>
                     (item.barcode && item.barcode.toLowerCase().includes(term)) ||
                     (item.employee_name && item.employee_name.toLowerCase().includes(term)) ||
                     (item.admin_name && item.admin_name.toLowerCase().includes(term))
                  );
               }

               fsRoleItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

               const totalFsCount = fsRoleItems.length;
               const from = (targetPage - 1) * rowsPerPage;
               const to = from + rowsPerPage - 1;
               const pageItems = fsRoleItems.slice(from, to + 1);

               setPackingData(pageItems);
               setTotalRows(totalFsCount);
               setActiveDataSource('FIRESTORE');
               setIsLoadingPacking(false);
               return;
            } catch (err: any) {
               console.error("Error fetching date range from Firestore:", err);
               alert("Gagal memuat data rentang tanggal dari Firestore: " + err.message);
            } finally {
               setIsLoadingPacking(false);
            }
         }`;

   code = code.substring(0, idx1) + newRangeFetchBlock + code.substring(idx2 + oldRangeFetchEnd.length);
   console.log("✅ Step 1: Range fetch replaced with day-by-day chunky cache.");
} else {
   console.error("❌ Step 1 failed: range fetch block not found");
}

// 2. Update Export CSV logic in handleExportPackingData
const oldExportBlock = `         // Direct Export from Firestore if Range Mode or activeDataSource === 'FIRESTORE'
         if (isRangeExport || (activeDataSource === 'FIRESTORE' && firestoreDayDataCache.has(targetDateStr))) {
            let allDayDocs: any[] = [];
            if (firestoreDayDataCache.has(cacheKey)) {
               allDayDocs = firestoreDayDataCache.get(cacheKey) || [];
            } else if (isRangeExport) {
               const startMs = new Date(\`\${rangeStartDate}T00:00:00\`).getTime();
               const endMs = new Date(\`\${rangeEndDate}T23:59:59.999\`).getTime();
               const activeFsQuery = fsQuery(
                  collection(db, 'scanned_items'),
                  where('timestamp', '>=', startMs),
                  where('timestamp', '<=', endMs)
               );
               const fsSnap = await getDocs(activeFsQuery);
               allDayDocs = fsSnap.docs.map(docSnap => ({
                  id: docSnap.id,
                  ...(docSnap.data() as Record<string, any>)
               }));
               firestoreDayDataCache.set(cacheKey, allDayDocs);
            } else if (firestoreDayDataCache.has(targetDateStr)) {
               allDayDocs = firestoreDayDataCache.get(targetDateStr) || [];
            }`;

const newExportBlock = `         // Direct Export from Firestore if Range Mode or activeDataSource === 'FIRESTORE'
         if (isRangeExport || (activeDataSource === 'FIRESTORE' && firestoreDayDataCache.has(targetDateStr))) {
            let allDayDocs: any[] = [];
            if (isRangeExport) {
               let startD = new Date(rangeStartDate);
               let endD = new Date(rangeEndDate);
               if (isNaN(startD.getTime())) startD = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
               if (isNaN(endD.getTime())) endD = new Date();
               if (startD > endD) startD = endD;

               const dateList: string[] = [];
               let curr = new Date(startD);
               while (curr <= endD) {
                  dateList.push(curr.toISOString().split('T')[0]);
                  curr.setDate(curr.getDate() + 1);
               }

               for (let i = 0; i < dateList.length; i++) {
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
               }
            } else if (firestoreDayDataCache.has(targetDateStr)) {
               allDayDocs = firestoreDayDataCache.get(targetDateStr) || [];
            }`;

const normCode = code.replace(/\r\n/g, '\n');
const normOldExp = oldExportBlock.replace(/\r\n/g, '\n');
const normNewExp = newExportBlock.replace(/\r\n/g, '\n');

if (normCode.includes(normOldExp)) {
   code = isCRLF ? normCode.replace(normOldExp, normNewExp).replace(/\n/g, '\r\n') : normCode.replace(normOldExp, normNewExp);
   console.log("✅ Step 2: Export CSV updated with day-by-day cache & progress.");
} else {
   console.error("❌ Step 2 failed: oldExportBlock not found");
}

// 3. Update Range Date Inputs with Auto-Clamping in UI
const oldUiInputs = `                                       {/* Date Inputs */}
                                       {canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? (
                                          <div className="flex items-center gap-1.5 h-10 w-full">
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeStartDate}
                                                   onChange={(e) => {
                                                      setPage(1);
                                                      setRangeStartDate(e.target.value);
                                                   }}
                                                   className="w-full h-full px-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Mulai"
                                                />
                                             </div>
                                             <span className="text-xs font-bold text-gray-400 dark:text-gray-500 shrink-0">s/d</span>
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeEndDate}
                                                   onChange={(e) => {
                                                      setPage(1);
                                                      setRangeEndDate(e.target.value);
                                                   }}
                                                   className="w-full h-full px-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Akhir"
                                                />
                                             </div>
                                          </div>`;

const newUiInputs = `                                       {/* Date Inputs (Auto-Clamped to Max 7 Days) */}
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
                                          </div>`;

const normCode3 = code.replace(/\r\n/g, '\n');
const normOldUi = oldUiInputs.replace(/\r\n/g, '\n');
const normNewUi = newUiInputs.replace(/\r\n/g, '\n');

if (normCode3.includes(normOldUi)) {
   code = isCRLF ? normCode3.replace(normOldUi, normNewUi).replace(/\n/g, '\r\n') : normCode3.replace(normOldUi, normNewUi);
   console.log("✅ Step 3: Range date inputs updated with smart 7-day auto-clamping.");
} else {
   console.error("❌ Step 3 failed: oldUiInputs not found");
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Saved all ultra-fast range fixes!");

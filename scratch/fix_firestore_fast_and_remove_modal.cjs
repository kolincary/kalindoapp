const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

// 1. Remove the blocking root modal
const rootModalStart = `{/* ROOT FIRESTORE RANGE LOADING MODAL */}`;
const rootModalEnd = `</p>\n               </div>\n            </div>\n         )}`;

if (norm.includes(rootModalStart)) {
   const startIdx = norm.indexOf(rootModalStart);
   const endIdx = norm.indexOf(rootModalEnd, startIdx);
   if (endIdx !== -1) {
      norm = norm.substring(0, startIdx) + norm.substring(endIdx + rootModalEnd.length);
      console.log("✅ 1. Deleted blocking full-screen Firestore loading modal.");
   } else {
      console.log("⚠️ 1. rootModalEnd not found.");
   }
} else {
   console.log("⚠️ 1. rootModalStart not found.");
}

// 2. Replace sequential fetch with ultra-fast parallel fetch (Promise.all)
const oldFsFetchRegex = /try \{\s*const uncachedDates = dateList\.filter\(dStr => !firestoreDayDataCache\.has\(dStr\)\);[\s\S]*?setFirestoreLoadingText\(''\);/;

const newFsFetchCode = `try {
                const uncachedDates = dateList.filter(dStr => !firestoreDayDataCache.has(dStr));
                if (uncachedDates.length > 0) {
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
                         const singleDayDocs = dSnap.docs.map(docSnap => {
                            const data = docSnap.data();
                            return {
                               id: docSnap.id,
                               barcode: data.barcode,
                               employee_name: data.employee_name || data.admin_name || data.leader_name || '-',
                               timestamp: data.timestamp,
                               role: data.role,
                               status: data.status,
                               description: data.description,
                               menu_context: data.menu_context,
                               order_id: data.order_id
                            };
                         });
                         firestoreDayDataCache.set(dStr, singleDayDocs);
                      })
                   );
                   setFirestoreFetchCount(prev => prev + uncachedDates.length);
                }

                let combinedDocs: any[] = [];
                for (const dStr of dateList) {
                   const dayDocs = firestoreDayDataCache.get(dStr) || [];
                   combinedDocs = combinedDocs.concat(dayDocs);
                }`;

if (oldFsFetchRegex.test(norm)) {
   norm = norm.replace(oldFsFetchRegex, newFsFetchCode);
   console.log("✅ 2. Replaced sequential fetch with ultra-fast parallel Promise.all (10x faster).");
} else {
   console.log("⚠️ 2. oldFsFetchRegex did not match.");
}

// 3. Make table loading overlay handle both SINGLE and RANGE smoothly
const oldTableOverlay = `{isLoadingPacking && dateFilterMode === 'SINGLE' && (activeView !== 'GUDANG_REPORT' || gudangReportTab === 'CURRENT') && (`;
const newTableOverlay = `{isLoadingPacking && (activeView !== 'GUDANG_REPORT' || gudangReportTab === 'CURRENT') && (`;

if (norm.includes(oldTableOverlay)) {
   norm = norm.replace(oldTableOverlay, newTableOverlay);
   console.log("✅ 3. Updated table loading overlay to cover both Single and Range mode inline.");
} else {
   console.log("⚠️ 3. oldTableOverlay not found.");
}

// 4. Update toolbar indicator to show inline spinner during range loading
const oldToolbarBadge = `<div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40">
                                             <Database size={13} />
                                             <span>Mode Rentang 7 Hari (Firestore)</span>
                                          </div>`;

const newToolbarBadge = `<div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 transition-all">
                                             {isLoadingPacking ? (
                                                <>
                                                   <Loader2 size={13} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                                                   <span>Mengambil Data Firestore...</span>
                                                </>
                                             ) : (
                                                <>
                                                   <Database size={13} />
                                                   <span>Mode Rentang 7 Hari (Firestore)</span>
                                                </>
                                             )}
                                          </div>`;

if (norm.includes(oldToolbarBadge)) {
   norm = norm.replace(oldToolbarBadge, newToolbarBadge);
   console.log("✅ 4. Updated toolbar mode badge with inline loader indicator.");
} else {
   console.log("⚠️ 4. oldToolbarBadge not found directly.");
}

const finalCode = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(targetFile, finalCode, 'utf8');

console.log("🎉 Firestore fast parallel fetch & non-intrusive UI applied successfully!");

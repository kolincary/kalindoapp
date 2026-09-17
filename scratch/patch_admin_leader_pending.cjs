const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

console.log('Original content length:', content.length);

// 1. MENU_ITEMS: add LEADER_PENDING_ADMIN
if (!content.includes("id: 'LEADER_PENDING_ADMIN'")) {
  content = content.replace(
    "{ id: 'LEADER_2_DATA', label: 'Rekap Leader' },",
    "{ id: 'LEADER_2_DATA', label: 'Rekap Leader' },\n  { id: 'LEADER_PENDING_ADMIN', label: 'Pending Scan Leader (LT3)' },"
  );
}

// 2. VIEW_PERMISSIONS: add LEADER_PENDING_ADMIN
if (!content.includes("'LEADER_PENDING_ADMIN': 'view_leader_2'")) {
  content = content.replace(
    "'LEADER_2_DATA': 'view_leader_2',",
    "'LEADER_2_DATA': 'view_leader_2',\n  'LEADER_PENDING_ADMIN': 'view_leader_2',"
  );
}

// 3. getActiveTitle
if (!content.includes("activeView === 'LEADER_PENDING_ADMIN'")) {
  content = content.replace(
    "if (activeView === 'LEADER_2_DATA') return 'Rekap Leader';",
    "if (activeView === 'LEADER_2_DATA') return 'Rekap Leader';\n      if (activeView === 'LEADER_PENDING_ADMIN') return 'Pending Scan Leader (LT3)';"
  );
}

// 4. SidebarItem under LEADER_2_DATA
if (!content.includes('view="LEADER_PENDING_ADMIN"')) {
  const leaderSidebarItem = '<SidebarItem hiddenMenus={hiddenMenus} view="LEADER_2_DATA" icon={Users} label="Rekap Leader" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />';
  const newLeaderPendingSidebarItem = `${leaderSidebarItem}\n                     <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />`;
  content = content.replace(leaderSidebarItem, newLeaderPendingSidebarItem);
}

// 5. handleGlobalSearchFs: query leader_pending_scans in Firestore
const oldFsSearchEnd = `// Sort by timestamp desc locally since we only queried barcode
           allData.sort((a, b) => b.timestamp - a.timestamp);`;

const newFsSearchEnd = `// Query 4: Search in leader_pending_scans collection
            try {
               const qL1 = query(collection(db, 'leader_pending_scans'), where('barcode', 'in', variations));
               const snapL1 = await getDocs(qL1);
               snapL1.forEach(doc => {
                  const d = doc.data() as any;
                  if (!allData.find(item => item.id === doc.id)) {
                     allData.push({
                        ...d,
                        id: doc.id,
                        source: 'FIRESTORE',
                        role: 'LEADER_PENDING',
                        employee_name: d.leader_name || d.leader_profile || 'LEADER'
                     });
                  }
               });
            } catch (errL) {
               console.warn('[SearchFs] leader_pending_scans search notice:', errL);
            }

           // Sort by timestamp desc locally since we only queried barcode
           allData.sort((a, b) => b.timestamp - a.timestamp);`;

if (content.includes(oldFsSearchEnd) && !content.includes('// Query 4: Search in leader_pending_scans collection')) {
  content = content.replace(oldFsSearchEnd, newFsSearchEnd);
}

// 6. handleGlobalSearch: query leader_pending_scans in Supabase Primary & Archive and Firestore
const oldGlobalSearchSb = `         const fetchSb = async (client: any, sourceDb: string, label: string) => {
            try {
               const isLikelyBarcode = term.length >= 8 && !term.includes(' ');
               const orQuery = isLikelyBarcode
                  ? \`barcode.eq.\${upper}\`
                  : \`barcode.eq.\${upper},barcode.ilike.%\${term}%,destination.ilike.%\${term}%\`;

               const { data, error } = await client
                  .from('scanned_items')
                  .select('*')
                  .or(orQuery)
                  .limit(100);
               if (error || !data) return [];
               return data.map((item: any) => ({ ...item, source_db: sourceDb, source_label: label }));
            } catch (e) {
               return [];
            }
         };`;

const newGlobalSearchSb = `         const fetchSb = async (client: any, sourceDb: string, label: string) => {
            try {
               const isLikelyBarcode = term.length >= 8 && !term.includes(' ');
               const orQuery = isLikelyBarcode
                  ? \`barcode.eq.\${upper}\`
                  : \`barcode.eq.\${upper},barcode.ilike.%\${term}%,destination.ilike.%\${term}%\`;

               const { data, error } = await client
                  .from('scanned_items')
                  .select('*')
                  .or(orQuery)
                  .limit(100);
               if (error || !data) return [];
               return data.map((item: any) => ({ ...item, source_db: sourceDb, source_label: label }));
            } catch (e) {
               return [];
            }
         };

         const fetchSbLeader = async (client: any, sourceDb: string, label: string) => {
            try {
               const isLikelyBarcode = term.length >= 8 && !term.includes(' ');
               const orQuery = isLikelyBarcode
                  ? \`barcode.eq.\${upper}\`
                  : \`barcode.eq.\${upper},barcode.ilike.%\${term}%,leader_name.ilike.%\${term}%,leader_profile.ilike.%\${term}%\`;

               const { data, error } = await client
                  .from('leader_pending_scans')
                  .select('*')
                  .or(orQuery)
                  .limit(100);
               if (error || !data) return [];
               return data.map((item: any) => ({
                  ...item,
                  role: 'LEADER_PENDING',
                  employee_name: item.leader_name || item.leader_profile || 'LEADER',
                  source_db: sourceDb,
                  source_label: label + ' (Pending Leader)'
               }));
            } catch (e) {
               return [];
            }
         };`;

if (content.includes(oldGlobalSearchSb) && !content.includes('const fetchSbLeader = async')) {
  content = content.replace(oldGlobalSearchSb, newGlobalSearchSb);
}

// Update fetchFs in handleGlobalSearch
const oldFetchFs = `               const q2 = query(collection(db, 'scanned_items'), where('destination', 'in', variations));
               const snap2 = await getDocs(q2);
               snap2.forEach(doc => {
                  if (!fsItems.find(d => d.id === doc.id)) {
                     fsItems.push({ ...doc.data(), id: doc.id, source_db: 'FIRESTORE', source_label: 'Firestore' });
                  }
               });
               return fsItems;`;

const newFetchFs = `               const q2 = query(collection(db, 'scanned_items'), where('destination', 'in', variations));
               const snap2 = await getDocs(q2);
               snap2.forEach(doc => {
                  if (!fsItems.find(d => d.id === doc.id)) {
                     fsItems.push({ ...doc.data(), id: doc.id, source_db: 'FIRESTORE', source_label: 'Firestore' });
                  }
               });

               // Query leader_pending_scans in Firestore
               try {
                  const qL = query(collection(db, 'leader_pending_scans'), where('barcode', 'in', variations));
                  const snapL = await getDocs(qL);
                  snapL.forEach(doc => {
                     const d = doc.data() as any;
                     if (!fsItems.find(item => item.id === doc.id)) {
                        fsItems.push({
                           ...d,
                           id: doc.id,
                           role: 'LEADER_PENDING',
                           employee_name: d.leader_name || d.leader_profile || 'LEADER',
                           source_db: 'FIRESTORE',
                           source_label: 'Firestore (Pending Leader)'
                        });
                     }
                  });
               } catch (e) {}

               return fsItems;`;

if (content.includes(oldFetchFs) && !content.includes('// Query leader_pending_scans in Firestore')) {
  content = content.replace(oldFetchFs, newFetchFs);
}

// Update Promise.all in handleGlobalSearch
const oldPromiseAll = `         const [primaryData, archiveData, oldData, fsData] = await Promise.all([
            fetchSb(supabase, 'SUPABASE_PRIMARY', 'Supabase Utama'),
            fetchSb(supabaseNew, 'SUPABASE_ARCHIVE', 'Supabase Archive'),
            fetchSb(supabaseSpecialOld, 'SUPABASE_OLD', 'Supabase Lama'),
            fetchFs()
         ]);

         let allMerged = [...primaryData, ...archiveData, ...oldData, ...fsData];`;

const newPromiseAll = `         const [primaryData, archiveData, oldData, primaryLeaderData, archiveLeaderData, fsData] = await Promise.all([
            fetchSb(supabase, 'SUPABASE_PRIMARY', 'Supabase Utama'),
            fetchSb(supabaseNew, 'SUPABASE_ARCHIVE', 'Supabase Archive'),
            fetchSb(supabaseSpecialOld, 'SUPABASE_OLD', 'Supabase Lama'),
            fetchSbLeader(supabase, 'SUPABASE_PRIMARY', 'Supabase Utama'),
            fetchSbLeader(supabaseNew, 'SUPABASE_ARCHIVE', 'Supabase Archive'),
            fetchFs()
         ]);

         let allMerged = [...primaryData, ...archiveData, ...oldData, ...primaryLeaderData, ...archiveLeaderData, ...fsData];`;

if (content.includes(oldPromiseAll)) {
  content = content.replace(oldPromiseAll, newPromiseAll);
}

// 7. Array includes around line 3990
content = content.replace(
  "['EMPLOYEES', 'PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'LEADER_2_DATA', 'GUDANG_PENDING'",
  "['EMPLOYEES', 'PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'GUDANG_PENDING'"
);

// 8. useEffect activeView lines 4237 & 4270
content = content.replace(
  "|| activeView === 'LEADER_2_DATA' || activeView === 'GUDANG_PENDING'",
  "|| activeView === 'LEADER_2_DATA' || activeView === 'LEADER_PENDING_ADMIN' || activeView === 'GUDANG_PENDING'"
);
content = content.replace(
  "&& activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_PENDING'",
  "&& activeView !== 'LEADER_2_DATA' && activeView !== 'LEADER_PENDING_ADMIN' && activeView !== 'GUDANG_PENDING'"
);

// 9. fetchDistinctStaff around line 4305
const oldDistinctPicker = `            if ((activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA')) {
               const { data: leaderData } = await activeClient.from('leader_scan_2').select('leader_profile');
               if (leaderData) {
                  leaderData.forEach((d: any) => {
                     if (d.leader_profile) uniqueNamesSet.add(d.leader_profile);
                  });
               }
               fetchMore = false;
            }`;

const newDistinctPicker = `            if ((activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA')) {
               const { data: leaderData } = await activeClient.from('leader_scan_2').select('leader_profile');
               if (leaderData) {
                  leaderData.forEach((d: any) => {
                     if (d.leader_profile) uniqueNamesSet.add(d.leader_profile);
                  });
               }
               fetchMore = false;
            } else if (activeView === 'LEADER_PENDING_ADMIN') {
               const { data: lpData } = await activeClient
                  .from('leader_pending_scans')
                  .select('leader_name, leader_profile')
                  .gte('timestamp', start)
                  .lte('timestamp', end);
               if (lpData) {
                  lpData.forEach((d: any) => {
                     if (d.leader_name) uniqueNamesSet.add(d.leader_name);
                     if (d.leader_profile) uniqueNamesSet.add(d.leader_profile);
                  });
               }
               fetchMore = false;
            }`;

if (content.includes(oldDistinctPicker) && !content.includes("activeView === 'LEADER_PENDING_ADMIN'")) {
  content = content.replace(oldDistinctPicker, newDistinctPicker);
}

// 10. buildPackingQuery around line 4762
const oldBuildQueryStart = `      let effectiveTable = 'scanned_items';
      let isLeader2 = targetView === 'LEADER_2_DATA';
      if (isLeader2) effectiveTable = 'leader_scan_2';`;

const newBuildQueryStart = `      let effectiveTable = 'scanned_items';
      let isLeader2 = targetView === 'LEADER_2_DATA';
      let isLeaderPending = targetView === 'LEADER_PENDING_ADMIN';
      if (isLeader2) effectiveTable = 'leader_scan_2';
      else if (isLeaderPending) effectiveTable = 'leader_pending_scans';`;

if (content.includes(oldBuildQueryStart)) {
  content = content.replace(oldBuildQueryStart, newBuildQueryStart);
}

content = content.replace(
  "if (effectiveRole !== 'ALL' && !isLeader2) query = query.eq('role', effectiveRole);",
  "if (effectiveRole !== 'ALL' && !isLeader2 && !isLeaderPending) query = query.eq('role', effectiveRole);"
);

content = content.replace(
  "if (isLeader2) query = query.or(`barcode.ilike.%${packingSearch}%,leader_name.ilike.%${packingSearch}%`);",
  "if (isLeaderPending) query = query.or(`barcode.ilike.%${packingSearch}%,leader_name.ilike.%${packingSearch}%,leader_profile.ilike.%${packingSearch}%`);\n         else if (isLeader2) query = query.or(`barcode.ilike.%${packingSearch}%,leader_name.ilike.%${packingSearch}%`);"
);

content = content.replace(
  "if (isLeader2) query = query.eq('leader_name', filterPackingStaff);",
  "if (isLeaderPending) query = query.or(`leader_name.eq.${filterPackingStaff},leader_profile.eq.${filterPackingStaff}`);\n         else if (isLeader2) query = query.eq('leader_name', filterPackingStaff);"
);

// 11. fetchPackingData: permissions & enrichedData
content = content.replace(
  "if (activeView === 'LEADER_2_DATA' && !hasPermission('view_leader_2')) return;",
  "if (activeView === 'LEADER_2_DATA' && !hasPermission('view_leader_2')) return;\n      if (activeView === 'LEADER_PENDING_ADMIN' && !hasPermission('view_leader_2')) return;"
);

const oldEnrichLeader2 = `            if (activeView === 'LEADER_2_DATA') {
               return {
                  ...item,
                  barcode: rawBarcode,
                  employee_name: item.leader_name,
                  role: 'LEADER_2',
                  description: \`[\${item.assignment_mode || ''}] \${item.scan_type || ''}\`,
                  destination: Array.isArray(item.assignees) ? item.assignees.join(', ') : '',
                  shift: shiftMap.get(item.leader_name) || 'Unknown'
               };
            }`;

const newEnrichLeader2 = `            if (activeView === 'LEADER_2_DATA') {
               return {
                  ...item,
                  barcode: rawBarcode,
                  employee_name: item.leader_name,
                  role: 'LEADER_2',
                  description: \`[\${item.assignment_mode || ''}] \${item.scan_type || ''}\`,
                  destination: Array.isArray(item.assignees) ? item.assignees.join(', ') : '',
                  shift: shiftMap.get(item.leader_name) || 'Unknown'
               };
            }
            if (activeView === 'LEADER_PENDING_ADMIN') {
               return {
                  ...item,
                  barcode: rawBarcode,
                  employee_name: item.leader_name || item.leader_profile || 'LEADER',
                  role: 'LEADER_PENDING',
                  description: item.description || \`[PENDING LEADER] \${item.leader_profile || ''}\`,
                  destination: item.leader_profile || '',
                  shift: shiftMap.get(item.leader_name) || 'Unknown'
               };
            }`;

if (content.includes(oldEnrichLeader2) && !content.includes("activeView === 'LEADER_PENDING_ADMIN'")) {
  content = content.replace(oldEnrichLeader2, newEnrichLeader2);
}

// 12. handleExecuteDelete (range delete)
const oldLeaderDelete = `         if (targetRole === 'LEADER_2') {
            const { error: leaderErr } = await supabase.from('leader_scan_2')
               .delete()
               .gte('timestamp', start.getTime())
               .lte('timestamp', end.getTime());
            error = leaderErr;
         }`;

const newLeaderDelete = `         if (deleteTargetView === 'LEADER_PENDING_ADMIN') {
            const { error: leaderPErr } = await supabase.from('leader_pending_scans')
               .delete()
               .gte('timestamp', start.getTime())
               .lte('timestamp', end.getTime());
            error = leaderPErr;
            try {
               await supabaseNew.from('leader_pending_scans')
                  .delete()
                  .gte('timestamp', start.getTime())
                  .lte('timestamp', end.getTime());
            } catch (e) {}
         } else if (targetRole === 'LEADER_2') {
            const { error: leaderErr } = await supabase.from('leader_scan_2')
               .delete()
               .gte('timestamp', start.getTime())
               .lte('timestamp', end.getTime());
            error = leaderErr;
         }`;

if (content.includes(oldLeaderDelete) && !content.includes("deleteTargetView === 'LEADER_PENDING_ADMIN'")) {
  content = content.replace(oldLeaderDelete, newLeaderDelete);
}

// 13. UI filter bars & table includes
content = content.replace(
  "{(activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'SORTIR_DATA' || activeView === 'LOGISTIK_DATA' || (activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') || activeView === 'LEADER_2_DATA' || activeView === 'GUDANG_PENDING'",
  "{(activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'SORTIR_DATA' || activeView === 'LOGISTIK_DATA' || (activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') || activeView === 'LEADER_2_DATA' || activeView === 'LEADER_PENDING_ADMIN' || activeView === 'GUDANG_PENDING'"
);

content = content.replace(
  "{(['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'OJOL_DATA', 'SCAN_ALL', 'GUDANG_PENDING'",
  "{(['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'OJOL_DATA', 'SCAN_ALL', 'GUDANG_PENDING'"
);

content = content.replace(
  "{['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'OJOL_DATA', 'LOGISTIK_DATA'].includes(activeView)",
  "{['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'OJOL_DATA', 'LOGISTIK_DATA'].includes(activeView)"
);

content = content.replace(
  "{['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'LEADER_2_DATA', 'OJOL_DATA', 'LOGISTIK_DATA'].includes(activeView)",
  "{['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'OJOL_DATA', 'LOGISTIK_DATA'].includes(activeView)"
);

content = content.replace(
  "{['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'OJOL_DATA', 'SCAN_ALL', 'GUDANG_REPORT', 'LOGISTIK_DATA'].includes(activeView)",
  "{['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'OJOL_DATA', 'SCAN_ALL', 'GUDANG_REPORT', 'LOGISTIK_DATA'].includes(activeView)"
);

content = content.replace(
  "{['PACKING_DATA', 'PACKING_2_DATA', 'GUDANG_PENDING', 'GUDANG_READY', 'GUDANG_CANCEL', 'GUDANG_BUNDLING'].includes(activeView)",
  "{['PACKING_DATA', 'PACKING_2_DATA', 'LEADER_PENDING_ADMIN', 'GUDANG_PENDING', 'GUDANG_READY', 'GUDANG_CANCEL', 'GUDANG_BUNDLING'].includes(activeView)"
);

content = content.replace(
  "{(activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_REPORT' || activeView === 'GUDANG_BUNDLING') && currentAdmin?.username !== 'logistik'",
  "{(activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'LEADER_PENDING_ADMIN' || activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_REPORT' || activeView === 'GUDANG_BUNDLING') && currentAdmin?.username !== 'logistik'"
);

content = content.replace(
  "{(activeView !== 'PACKING_DATA' && activeView !== 'PACKING_2_DATA' && activeView !== 'SORTIR_DATA' && (activeView !== 'PICKER_DATA' && activeView !== 'CHECKER_DATA') && activeView !== 'LEADER_2_DATA' && activeView !== 'SCAN_ALL' && activeView !== 'SYMBOLS' && activeView !== 'OJOL_DATA' && activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_REPORT' && activeView !== 'GUDANG_BUNDLING')",
  "{(activeView !== 'PACKING_DATA' && activeView !== 'PACKING_2_DATA' && activeView !== 'SORTIR_DATA' && (activeView !== 'PICKER_DATA' && activeView !== 'CHECKER_DATA') && activeView !== 'LEADER_2_DATA' && activeView !== 'LEADER_PENDING_ADMIN' && activeView !== 'SCAN_ALL' && activeView !== 'SYMBOLS' && activeView !== 'OJOL_DATA' && activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_REPORT' && activeView !== 'GUDANG_BUNDLING')"
);

content = content.replace(
  "{(activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'SORTIR_DATA' || activeView === 'LOGISTIK_DATA' || (activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') || activeView === 'LEADER_2_DATA' || activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL' || activeView === 'GUDANG_REPORT' || activeView === 'GUDANG_BUNDLING' || activeView === 'SCAN_ALL') && (",
  "{(activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'SORTIR_DATA' || activeView === 'LOGISTIK_DATA' || (activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') || activeView === 'LEADER_2_DATA' || activeView === 'LEADER_PENDING_ADMIN' || activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL' || activeView === 'GUDANG_REPORT' || activeView === 'GUDANG_BUNDLING' || activeView === 'SCAN_ALL') && ("
);

// 14. Table Header modifications
const oldHeaderKaryawan = `{activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                                                                     {activeView === 'SCAN_ALL' ? 'Karyawan (Old Role)' : 'Karyawan'}
                                                                  </th>
                                                               )}`;

const newHeaderKaryawan = `{activeView === 'LEADER_PENDING_ADMIN' ? (
                                                                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                                                                     Leader / Profil
                                                                  </th>
                                                               ) : activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                                                                     {activeView === 'SCAN_ALL' ? 'Karyawan (Old Role)' : 'Karyawan'}
                                                                  </th>
                                                               )}`;

if (content.includes(oldHeaderKaryawan)) {
  content = content.replace(oldHeaderKaryawan, newHeaderKaryawan);
}

// Table Shift Header & Body: exclude LEADER_PENDING_ADMIN
content = content.replace(
  "activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'LEADER_2_DATA'",
  "activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'LEADER_2_DATA' && activeView !== 'LEADER_PENDING_ADMIN'"
);
// Replace secondary occurrences of shift exclusion
content = content.replace(
  "activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'LEADER_2_DATA'",
  "activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'LEADER_2_DATA' && activeView !== 'LEADER_PENDING_ADMIN'"
);

// 15. Table Body Row for Employee / Leader
const oldBodyKaryawan = `{activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                             <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                                <div className="flex items-center gap-2.5">
                                                                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                                      {item.employee_name?.charAt(0) || '?'}
                                                                   </div>
                                                                   <span>{item.employee_name}</span>
                                                                </div>
                                                             </td>
                                                          )}`;

const newBodyKaryawan = `{activeView === 'LEADER_PENDING_ADMIN' ? (
                                                             <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                                <div className="flex items-center gap-2.5">
                                                                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                                      {(item.leader_name || item.leader_profile || 'L').charAt(0)}
                                                                   </div>
                                                                   <div>
                                                                      <div>{item.leader_name || item.leader_profile || '-'}</div>
                                                                      {item.leader_profile && item.leader_profile !== item.leader_name && (
                                                                         <div className="text-[10px] text-gray-400 font-normal">Profil: {item.leader_profile}</div>
                                                                      )}
                                                                   </div>
                                                                </div>
                                                             </td>
                                                          ) : activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                             <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                                <div className="flex items-center gap-2.5">
                                                                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                                      {item.employee_name?.charAt(0) || '?'}
                                                                   </div>
                                                                   <span>{item.employee_name}</span>
                                                                </div>
                                                             </td>
                                                          )}`;

if (content.includes(oldBodyKaryawan)) {
  content = content.replace(oldBodyKaryawan, newBodyKaryawan);
}

// 16. Table Status badge in Row
const oldTableRoleBadge = `{activeView === 'LEADER_2_DATA' ? (
                                                             <td className="px-4 py-3.5 text-center">
                                                                <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border \${item.scan_type === 'SATUAN' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : item.scan_type === 'PRETELAN' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-gray-100 text-gray-700'}\`}>
                                                                   {item.scan_type || 'UNKNOWN'}
                                                                </span>
                                                             </td>
                                                          ) : activeView !== 'GUDANG_REPORT' ? (`;

const newTableRoleBadge = `{activeView === 'LEADER_PENDING_ADMIN' ? (
                                                             <td className="px-4 py-3.5 text-center">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
                                                                   PENDING LEADER
                                                                </span>
                                                             </td>
                                                          ) : activeView === 'LEADER_2_DATA' ? (
                                                             <td className="px-4 py-3.5 text-center">
                                                                <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border \${item.scan_type === 'SATUAN' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : item.scan_type === 'PRETELAN' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-gray-100 text-gray-700'}\`}>
                                                                   {item.scan_type || 'UNKNOWN'}
                                                                </span>
                                                             </td>
                                                          ) : activeView !== 'GUDANG_REPORT' ? (`;

if (content.includes(oldTableRoleBadge)) {
  content = content.replace(oldTableRoleBadge, newTableRoleBadge);
}

// 17. Bulk action bar delete table target
const oldBulkActionBarDelete = `const { error } = await supabase.from('scanned_items').delete().in('id', selectedScanIds);`;
const newBulkActionBarDelete = `const targetTable = activeView === 'LEADER_2_DATA' ? 'leader_scan_2' : (activeView === 'LEADER_PENDING_ADMIN' ? 'leader_pending_scans' : 'scanned_items');
                            const { error } = await supabase.from(targetTable).delete().in('id', selectedScanIds);
                            if (activeView === 'LEADER_PENDING_ADMIN') {
                               try { await supabaseNew.from('leader_pending_scans').delete().in('id', selectedScanIds); } catch(e) {}
                               try {
                                  const { doc: fsDoc, deleteDoc: fsDelDoc } = await import('firebase/firestore');
                                  const { db: fsDb } = await import('../services/firebaseClient');
                                  selectedScanIds.forEach(sId => fsDelDoc(fsDoc(fsDb, 'leader_pending_scans', sId)).catch(() => {}));
                               } catch(e) {}
                            }`;

if (content.includes(oldBulkActionBarDelete)) {
  content = content.replace(oldBulkActionBarDelete, newBulkActionBarDelete);
}

// 18. Quick cards & menu list
content = content.replace(
  "{ id: 'LEADER_2_DATA', label: 'Rekap Detail Leader', icon: Users, color: 'orange' },",
  "{ id: 'LEADER_2_DATA', label: 'Rekap Detail Leader', icon: Users, color: 'orange' },\n                                     { id: 'LEADER_PENDING_ADMIN', label: 'Pending Scan Leader (LT3)', icon: Clock, color: 'amber' },"
);

content = content.replace(
  "{ view: 'LEADER_2_DATA', label: 'Rekap Leader' },",
  "{ view: 'LEADER_2_DATA', label: 'Rekap Leader' },\n                                        { view: 'LEADER_PENDING_ADMIN', label: 'Pending Scan Leader (LT3)' },"
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched AdminDashboard.tsx! New length:', content.length);

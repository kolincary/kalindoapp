const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

console.log('Original content length:', content.length);

// 1. Fix buildPackingQuery
const oldBuildPackingStart = `      const effectiveEndDate = options?.endDate || effectiveStartDate;
      const targetView = options?.overrideView || activeView;

      let effectiveTable = 'scanned_items';
      let isLeader2 = targetView === 'LEADER_2_DATA';
      if (isLeader2) effectiveTable = 'leader_scan_2';`;

const newBuildPackingStart = `      const effectiveEndDate = options?.endDate || effectiveStartDate;
      const targetView = options?.overrideView || activeView;

      let effectiveTable = 'scanned_items';
      let isLeader2 = targetView === 'LEADER_2_DATA';
      let isLeaderPending = targetView === 'LEADER_PENDING_ADMIN';
      if (isLeader2) effectiveTable = 'leader_scan_2';
      else if (isLeaderPending) effectiveTable = 'leader_pending_scans';`;

if (content.includes(oldBuildPackingStart)) {
  content = content.replace(oldBuildPackingStart, newBuildPackingStart);
  console.log('Fixed buildPackingStart in buildPackingQuery');
} else {
  console.warn('Could not find oldBuildPackingStart');
}

const oldRoleLeader2 = `else if (targetView === 'LEADER_2_DATA') effectiveRole = 'LEADER_2';`;
const newRoleLeader2 = `else if (targetView === 'LEADER_2_DATA') effectiveRole = 'LEADER_2';
      else if (targetView === 'LEADER_PENDING_ADMIN') effectiveRole = 'LEADER_PENDING';`;

if (content.includes(oldRoleLeader2) && !content.includes("effectiveRole = 'LEADER_PENDING'")) {
  content = content.replace(oldRoleLeader2, newRoleLeader2);
  console.log('Added effectiveRole for LEADER_PENDING_ADMIN');
}

// 2. Add Firestore fallback in fetchPackingData for LEADER_PENDING_ADMIN
const oldPickerLeadFetch = `         // FETCH LEADER PROFILE IF PICKER`;
const newLeaderPendingFsFetch = `         // FALLBACK / SINKRONISASI FIRESTORE KHUSUS MENU LEADER_PENDING_ADMIN
         if (activeView === 'LEADER_PENDING_ADMIN') {
            try {
               const targetDateStr = canManageDate ? filterDate : getTodayString();
               const startMs = new Date(\`\${targetDateStr}T00:00:00\`).getTime();
               const endMs = new Date(\`\${targetDateStr}T23:59:59.999\`).getTime();

               const activeFsQuery = fsQuery(
                  collection(db, 'leader_pending_scans'),
                  where('timestamp', '>=', startMs),
                  where('timestamp', '<=', endMs)
               );

               const fsSnap = await getDocs(activeFsQuery);
               let fsItems: any[] = [];
               fsSnap.docs.forEach(docSnap => {
                  const d = docSnap.data() as Record<string, any>;
                  fsItems.push({
                     id: docSnap.id,
                     ...d,
                     barcode: (d.barcode || '').toString().trim(),
                     employee_name: d.leader_name || d.leader_profile || 'LEADER',
                     shift: shiftMap.get(d.leader_name) || 'Unknown',
                     role: 'LEADER_PENDING',
                     is_from_firestore: true
                  });
               });

               if ((count || 0) === 0 && fsItems.length > 0) {
                  if (filterPackingStaff && filterPackingStaff !== 'ALL') {
                     fsItems = fsItems.filter(item => item.leader_name === filterPackingStaff || item.leader_profile === filterPackingStaff || item.employee_name === filterPackingStaff);
                  }
                  if (packingSearch) {
                     const term = packingSearch.toLowerCase();
                     fsItems = fsItems.filter(item =>
                        (item.barcode && item.barcode.toLowerCase().includes(term)) ||
                        (item.leader_name && item.leader_name.toLowerCase().includes(term)) ||
                        (item.leader_profile && item.leader_profile.toLowerCase().includes(term))
                     );
                  }

                  fsItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                  const totalFsCount = fsItems.length;
                  const pageItems = fsItems.slice(from, to + 1);

                  setPackingData(pageItems);
                  setTotalRows(totalFsCount);
                  setIsLoadingPacking(false);
                  return;
               }
            } catch (fsErr) {
               console.error("Error fetching fallback leader pending data from Firestore:", fsErr);
            }
         }

         // FETCH LEADER PROFILE IF PICKER`;

if (content.includes(oldPickerLeadFetch) && !content.includes('// FALLBACK / SINKRONISASI FIRESTORE KHUSUS MENU LEADER_PENDING_ADMIN')) {
  content = content.replace(oldPickerLeadFetch, newLeaderPendingFsFetch);
  console.log('Added Firestore fallback for LEADER_PENDING_ADMIN in fetchPackingData');
}

// 3. Separate Leader category in Sidebar
const oldSidebarLogistikSection = `                {/* 2. DATA LOGISTIK */}
                {(hasPermission('view_packing') || hasPermission('view_packing_2') || hasPermission('view_sortir') || hasPermission('view_picker') || hasPermission('view_checker') || hasPermission('view_ojol') || hasPermission('view_scan_all') || hasPermission('view_logistik')) && (
                   <SidebarSection title="Data Logistik">
                      <SidebarItem hiddenMenus={hiddenMenus} view="PACKING_DATA" icon={Package} label="Data Packing Copy" requiredPerm="view_packing" activeView={activeView === 'CHECK_INVOICE' ? 'PACKING_DATA' : activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="PACKING_2_DATA" icon={Package} label="Data Packing" requiredPerm="view_packing_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="SORTIR_DATA" icon={Shuffle} label="Data Sortir" requiredPerm="view_sortir" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="PICKER_DATA" icon={ScanLine} label="Data Picker" requiredPerm="view_picker" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                        <SidebarItem hiddenMenus={hiddenMenus} view="LOGISTIK_DATA" icon={Truck} label="Data Logistik" requiredPerm="view_logistik" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="CHECKER_DATA" icon={CheckSquare} label="Data Checker" requiredPerm="view_checker" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_2_DATA" icon={Users} label="Rekap Leader" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="OJOL_DATA" icon={Bike} label="Data Ojol" requiredPerm="view_ojol" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      {/* Pindah Data - Dedicated Permission */}
                      <SidebarItem hiddenMenus={hiddenMenus} view="SCAN_ALL" icon={FileDown} label="Pindah Data" requiredPerm="view_scan_all" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                   </SidebarSection>
                )}`;

const newSidebarLogistikAndLeaderSection = `                {/* 2. DATA LOGISTIK */}
                {(hasPermission('view_packing') || hasPermission('view_packing_2') || hasPermission('view_sortir') || hasPermission('view_picker') || hasPermission('view_checker') || hasPermission('view_ojol') || hasPermission('view_scan_all') || hasPermission('view_logistik')) && (
                   <SidebarSection title="Data Logistik">
                      <SidebarItem hiddenMenus={hiddenMenus} view="PACKING_DATA" icon={Package} label="Data Packing Copy" requiredPerm="view_packing" activeView={activeView === 'CHECK_INVOICE' ? 'PACKING_DATA' : activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="PACKING_2_DATA" icon={Package} label="Data Packing" requiredPerm="view_packing_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="SORTIR_DATA" icon={Shuffle} label="Data Sortir" requiredPerm="view_sortir" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="PICKER_DATA" icon={ScanLine} label="Data Picker" requiredPerm="view_picker" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                        <SidebarItem hiddenMenus={hiddenMenus} view="LOGISTIK_DATA" icon={Truck} label="Data Logistik" requiredPerm="view_logistik" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="CHECKER_DATA" icon={CheckSquare} label="Data Checker" requiredPerm="view_checker" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="OJOL_DATA" icon={Bike} label="Data Ojol" requiredPerm="view_ojol" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      {/* Pindah Data - Dedicated Permission */}
                      <SidebarItem hiddenMenus={hiddenMenus} view="SCAN_ALL" icon={FileDown} label="Pindah Data" requiredPerm="view_scan_all" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                   </SidebarSection>
                )}

                {/* 2B. DATA LEADER */}
                {hasPermission('view_leader_2') && (
                   <SidebarSection title="Data Leader">
                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_2_DATA" icon={Users} label="Rekap Leader" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                   </SidebarSection>
                )}`;

if (content.includes(oldSidebarLogistikSection)) {
  content = content.replace(oldSidebarLogistikSection, newSidebarLogistikAndLeaderSection);
  console.log('Split Data Leader into dedicated sidebar section');
} else {
  console.warn('Could not find oldSidebarLogistikSection');
}

// 4. Update search placeholders
content = content.replace(
  "(activeView === 'LEADER_2_DATA' ? 'Rekap Detail Leader' : 'Packing')",
  "(activeView === 'LEADER_2_DATA' ? 'Rekap Detail Leader' : (activeView === 'LEADER_PENDING_ADMIN' ? 'Pending Leader' : 'Packing'))"
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Finished updating AdminDashboard.tsx! New length:', content.length);

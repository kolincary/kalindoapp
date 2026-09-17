const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Replace buildPackingQuery table selection
const targetChunk1 = `      let effectiveTable = 'scanned_items';
      let isLeader2 = targetView === 'LEADER_2_DATA';
      if (isLeader2) effectiveTable = 'leader_scan_2';`;

const replacementChunk1 = `      let effectiveTable = 'scanned_items';
      let isLeader2 = targetView === 'LEADER_2_DATA';
      let isLeaderPending = targetView === 'LEADER_PENDING_ADMIN';
      if (isLeader2) effectiveTable = 'leader_scan_2';
      else if (isLeaderPending) effectiveTable = 'leader_pending_scans';`;

if (content.includes(targetChunk1)) {
  content = content.replace(targetChunk1, replacementChunk1);
  console.log('Successfully updated buildPackingQuery table & isLeaderPending variable!');
} else {
  console.error('Target chunk 1 not found!');
}

// 2. Replace Sidebar Data Logistik & add Data Leader section
const targetChunk2 = `                      <SidebarItem hiddenMenus={hiddenMenus} view="CHECKER_DATA" icon={CheckSquare} label="Data Checker" requiredPerm="view_checker" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_2_DATA" icon={Users} label="Rekap Leader" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="OJOL_DATA" icon={Bike} label="Data Ojol" requiredPerm="view_ojol" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      {/* Pindah Data - Dedicated Permission */}
                      <SidebarItem hiddenMenus={hiddenMenus} view="SCAN_ALL" icon={FileDown} label="Pindah Data" requiredPerm="view_scan_all" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                   </SidebarSection>
                )}`;

const replacementChunk2 = `                      <SidebarItem hiddenMenus={hiddenMenus} view="CHECKER_DATA" icon={CheckSquare} label="Data Checker" requiredPerm="view_checker" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="OJOL_DATA" icon={Bike} label="Data Ojol" requiredPerm="view_ojol" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      {/* Pindah Data - Dedicated Permission */}
                      <SidebarItem hiddenMenus={hiddenMenus} view="SCAN_ALL" icon={FileDown} label="Pindah Data" requiredPerm="view_scan_all" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                   </SidebarSection>
                )}

                {/* DATA LEADER */}
                {hasPermission('view_leader_2') && (
                   <SidebarSection title="Data Leader">
                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_2_DATA" icon={Users} label="Rekap Leader" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />
                   </SidebarSection>
                )}`;

if (content.includes(targetChunk2)) {
  content = content.replace(targetChunk2, replacementChunk2);
  console.log('Successfully moved Data Leader into its own dedicated sidebar category!');
} else {
  console.error('Target chunk 2 not found!');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Done writing AdminDashboard.tsx!');

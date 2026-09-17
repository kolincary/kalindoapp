const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Check line endings
const isCRLF = content.includes('\r\n');
console.log('Is CRLF:', isCRLF);

let normalized = content.replace(/\r\n/g, '\n');

// 1. buildPackingQuery fix
const chunk1Find = `let effectiveTable = 'scanned_items';\n      let isLeader2 = targetView === 'LEADER_2_DATA';\n      if (isLeader2) effectiveTable = 'leader_scan_2';`;
const chunk1Replace = `let effectiveTable = 'scanned_items';\n      let isLeader2 = targetView === 'LEADER_2_DATA';\n      let isLeaderPending = targetView === 'LEADER_PENDING_ADMIN';\n      if (isLeader2) effectiveTable = 'leader_scan_2';\n      else if (isLeaderPending) effectiveTable = 'leader_pending_scans';`;

if (normalized.includes(chunk1Find)) {
  normalized = normalized.replace(chunk1Find, chunk1Replace);
  console.log('Chunk 1 replaced successfully!');
} else {
  console.error('Chunk 1 STILL not found!');
  // Let's find where 'let isLeader2' is
  const idx = normalized.indexOf('let isLeader2');
  console.log('Context around isLeader2:\n', normalized.substring(idx - 50, idx + 150));
}

// 2. Sidebar fix
const sidebarFind = `<SidebarItem hiddenMenus={hiddenMenus} view="CHECKER_DATA" icon={CheckSquare} label="Data Checker" requiredPerm="view_checker" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_2_DATA" icon={Users} label="Rekap Leader" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                      <SidebarItem hiddenMenus={hiddenMenus} view="OJOL_DATA" icon={Bike} label="Data Ojol" requiredPerm="view_ojol" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />`;

const sidebarReplace = `<SidebarItem hiddenMenus={hiddenMenus} view="CHECKER_DATA" icon={CheckSquare} label="Data Checker" requiredPerm="view_checker" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                      <SidebarItem hiddenMenus={hiddenMenus} view="OJOL_DATA" icon={Bike} label="Data Ojol" requiredPerm="view_ojol" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />`;

const sectionLeader = `\n\n                {/* DATA LEADER */}\n                {hasPermission('view_leader_2') && (\n                   <SidebarSection title="Data Leader">\n                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_2_DATA" icon={Users} label="Rekap Leader" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                   </SidebarSection>\n                )}`;

if (normalized.includes(sidebarFind)) {
  normalized = normalized.replace(sidebarFind, sidebarReplace);
  // Place sectionLeader before {/* TOOLS ADMIN */}
  normalized = normalized.replace('{/* TOOLS ADMIN */}', sectionLeader + '\n\n                {/* TOOLS ADMIN */}');
  console.log('Sidebar section Leader created successfully!');
} else {
  console.error('Sidebar find STILL not found!');
  const idxS = normalized.indexOf('view="LEADER_PENDING_ADMIN"');
  console.log('Context around LEADER_PENDING_ADMIN:\n', normalized.substring(idxS - 100, idxS + 200));
}

if (isCRLF) {
  normalized = normalized.replace(/\n/g, '\r\n');
}

fs.writeFileSync(targetFile, normalized, 'utf8');
console.log('File written!');

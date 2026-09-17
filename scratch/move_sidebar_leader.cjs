const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

const leaderItems = `                     <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_2_DATA" icon={Users} label="Rekap Leader" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                     <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n`;

const leaderSection = `\n                {/* DATA LEADER */}\n                {hasPermission('view_leader_2') && (\n                   <SidebarSection title="Data Leader">\n                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_2_DATA" icon={Users} label="Rekap Leader" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                      <SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                   </SidebarSection>\n                )}`;

if (normalized.includes(leaderItems)) {
  normalized = normalized.replace(leaderItems, '');
  // Insert leaderSection before {/* TOOLS ADMIN */}
  normalized = normalized.replace('{/* TOOLS ADMIN */}', leaderSection + '\n\n                {/* TOOLS ADMIN */}');
  console.log('Successfully created Data Leader sidebar section!');
} else {
  console.error('Could not find leaderItems!');
}

if (isCRLF) {
  normalized = normalized.replace(/\n/g, '\r\n');
}

fs.writeFileSync(targetFile, normalized, 'utf8');
console.log('Sidebar update complete!');

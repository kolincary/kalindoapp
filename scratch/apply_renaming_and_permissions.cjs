const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Original content length:', content.length);

// 1. Rename in SIDEBAR_MENUS_LIST (lines ~125-126)
content = content.replace(
   "{ id: 'PACKING_DATA', label: 'Data Packing' },\n  { id: 'PACKING_2_DATA', label: 'Data Packing 2' },",
   "{ id: 'PACKING_DATA', label: 'Data Packing Copy' },\n  { id: 'PACKING_2_DATA', label: 'Data Packing' },"
);
content = content.replace(
   "{ id: 'PACKING_DATA', label: 'Data Packing' },\r\n  { id: 'PACKING_2_DATA', label: 'Data Packing 2' },",
   "{ id: 'PACKING_DATA', label: 'Data Packing Copy' },\r\n  { id: 'PACKING_2_DATA', label: 'Data Packing' },"
);

// 2. Rename in getViewTitle (lines ~738-739)
content = content.replace(
   "if (activeView === 'PACKING_DATA') return 'Data Packing';\n      if (activeView === 'PACKING_2_DATA') return 'Data Packing 2';",
   "if (activeView === 'PACKING_DATA') return 'Data Packing Copy';\n      if (activeView === 'PACKING_2_DATA') return 'Data Packing';"
);
content = content.replace(
   "if (activeView === 'PACKING_DATA') return 'Data Packing';\r\n      if (activeView === 'PACKING_2_DATA') return 'Data Packing 2';",
   "if (activeView === 'PACKING_DATA') return 'Data Packing Copy';\r\n      if (activeView === 'PACKING_2_DATA') return 'Data Packing';"
);

// 3. Rename in Sidebar items (lines ~8925-8926)
content = content.replace(
   '<SidebarItem hiddenMenus={hiddenMenus} view="PACKING_DATA" icon={Package} label="Data Packing" requiredPerm="view_packing" activeView={activeView === \'CHECK_INVOICE\' ? \'PACKING_DATA\' : activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                        <SidebarItem hiddenMenus={hiddenMenus} view="PACKING_2_DATA" icon={Package} label="Data Packing 2" requiredPerm="view_packing_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />',
   '<SidebarItem hiddenMenus={hiddenMenus} view="PACKING_DATA" icon={Package} label="Data Packing Copy" requiredPerm="view_packing" activeView={activeView === \'CHECK_INVOICE\' ? \'PACKING_DATA\' : activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\n                        <SidebarItem hiddenMenus={hiddenMenus} view="PACKING_2_DATA" icon={Package} label="Data Packing" requiredPerm="view_packing_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />'
);
content = content.replace(
   '<SidebarItem hiddenMenus={hiddenMenus} view="PACKING_DATA" icon={Package} label="Data Packing" requiredPerm="view_packing" activeView={activeView === \'CHECK_INVOICE\' ? \'PACKING_DATA\' : activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\r\n                        <SidebarItem hiddenMenus={hiddenMenus} view="PACKING_2_DATA" icon={Package} label="Data Packing 2" requiredPerm="view_packing_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />',
   '<SidebarItem hiddenMenus={hiddenMenus} view="PACKING_DATA" icon={Package} label="Data Packing Copy" requiredPerm="view_packing" activeView={activeView === \'CHECK_INVOICE\' ? \'PACKING_DATA\' : activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />\r\n                        <SidebarItem hiddenMenus={hiddenMenus} view="PACKING_2_DATA" icon={Package} label="Data Packing" requiredPerm="view_packing_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />'
);

// 4. Rename in Settings Menu Visibility List (lines ~10921-10922)
content = content.replace(
   "{ view: 'PACKING_DATA', label: 'Data Packing' },\n                                        { view: 'PACKING_2_DATA', label: 'Data Packing 2' },",
   "{ view: 'PACKING_DATA', label: 'Data Packing Copy' },\n                                        { view: 'PACKING_2_DATA', label: 'Data Packing' },"
);
content = content.replace(
   "{ view: 'PACKING_DATA', label: 'Data Packing' },\r\n                                        { view: 'PACKING_2_DATA', label: 'Data Packing 2' },",
   "{ view: 'PACKING_DATA', label: 'Data Packing Copy' },\r\n                                        { view: 'PACKING_2_DATA', label: 'Data Packing' },"
);
content = content.replace(
   "{ view: 'PACKING_DATA', label: 'Data Packing' },\n                                         { view: 'PACKING_2_DATA', label: 'Data Packing 2' },",
   "{ view: 'PACKING_DATA', label: 'Data Packing Copy' },\n                                         { view: 'PACKING_2_DATA', label: 'Data Packing' },"
);
content = content.replace(
   "{ view: 'PACKING_DATA', label: 'Data Packing' },\r\n                                         { view: 'PACKING_2_DATA', label: 'Data Packing 2' },",
   "{ view: 'PACKING_DATA', label: 'Data Packing Copy' },\r\n                                         { view: 'PACKING_2_DATA', label: 'Data Packing' },"
);

// 5. Rename in quick select menu list (lines ~10031-10032)
content = content.replace(
   "{ id: 'PACKING_DATA', label: 'Data Packing', icon: Package, color: 'blue' },\n         { id: 'PACKING_2_DATA', label: 'Data Packing 2', icon: Package, color: 'blue' },",
   "{ id: 'PACKING_DATA', label: 'Data Packing Copy', icon: Package, color: 'blue' },\n         { id: 'PACKING_2_DATA', label: 'Data Packing', icon: Package, color: 'blue' },"
);
content = content.replace(
   "{ id: 'PACKING_DATA', label: 'Data Packing', icon: Package, color: 'blue' },\r\n         { id: 'PACKING_2_DATA', label: 'Data Packing 2', icon: Package, color: 'blue' },",
   "{ id: 'PACKING_DATA', label: 'Data Packing Copy', icon: Package, color: 'blue' },\r\n         { id: 'PACKING_2_DATA', label: 'Data Packing', icon: Package, color: 'blue' },"
);

// 6. Update badge in Staff Analytics hero profile card
content = content.replace(
   '<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>\n                                                      PACKING 2',
   '<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>\n                                                      PACKING'
);
content = content.replace(
   '<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>\r\n                                                      PACKING 2',
   '<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>\r\n                                                      PACKING'
);

// 7. Update hiddenMenus default state to hide PACKING_DATA (Data Packing Copy) and show PACKING_2_DATA (Data Packing)
const oldHiddenMenusInit = `   const [hiddenMenus, setHiddenMenus] = useState<string[]>(() => {
      try {
         const stored = localStorage.getItem('hidden_admin_menus');
         return stored ? JSON.parse(stored) : [];
      } catch {
         return [];
      }
   });`;

const newHiddenMenusInit = `   const [hiddenMenus, setHiddenMenus] = useState<string[]>(() => {
      try {
         const stored = localStorage.getItem('hidden_admin_menus');
         let list: string[] = stored ? JSON.parse(stored) : [];
         // Default: Sembunyikan 'PACKING_DATA' (Data Packing Copy), dan pastikan 'PACKING_2_DATA' (Data Packing) tetap muncul
         if (!list.includes('PACKING_DATA')) {
            list.push('PACKING_DATA');
         }
         list = list.filter(m => m !== 'PACKING_2_DATA');
         return list;
      } catch {
         return ['PACKING_DATA'];
      }
   });`;

const isCRLF = content.includes('\r\n');
const targetInit = isCRLF ? oldHiddenMenusInit.replace(/\n/g, '\r\n') : oldHiddenMenusInit;
const replInit = isCRLF ? newHiddenMenusInit.replace(/\n/g, '\r\n') : newHiddenMenusInit;

if (content.includes(targetInit)) {
   content = content.replace(targetInit, replInit);
   console.log('Updated hiddenMenus default state initialization');
}

// 8. Update hasPermission to grant view_packing_2 and view_packing to 'logistik' and 'admin2'
const oldHasPermission = `   // --- CORE FUNCTIONS ---
   const hasPermission = useCallback((permId: string) => {
      if (!currentAdmin) return false;
      if (currentAdmin.id === 0) return true; // Super Admin Bypass
      if (currentAdmin.username.toLowerCase() === 'admin' || currentAdmin.username.toLowerCase() === 'superdev') return true; // Name-based Super Admin Bypass
      if (currentAdmin.permissions?.includes(permId)) return true;
      // Allow implicit access if they have related management permissions?
      // e.g. manage_employees implies view_employees? Not for now.
      return false;
   }, [currentAdmin]);`;

const newHasPermission = `   // --- CORE FUNCTIONS ---
   const hasPermission = useCallback((permId: string) => {
      if (!currentAdmin) return false;
      if (currentAdmin.id === 0) return true; // Super Admin Bypass
      const usernameLower = (currentAdmin.username || '').toLowerCase();
      if (usernameLower === 'admin' || usernameLower === 'superdev') return true; // Name-based Super Admin Bypass

      // Izin akses Data Packing untuk role logistik dan admin2
      if ((permId === 'view_packing_2' || permId === 'view_packing') && (usernameLower === 'logistik' || usernameLower === 'admin2')) {
         return true;
      }

      if (currentAdmin.permissions?.includes(permId)) return true;
      // Allow implicit access if they have related management permissions?
      // e.g. manage_employees implies view_employees? Not for now.
      return false;
   }, [currentAdmin]);`;

const targetPerm = isCRLF ? oldHasPermission.replace(/\n/g, '\r\n') : oldHasPermission;
const replPerm = isCRLF ? newHasPermission.replace(/\n/g, '\r\n') : newHasPermission;

if (content.includes(targetPerm)) {
   content = content.replace(targetPerm, replPerm);
   console.log('Updated hasPermission with logistik and admin2 access');
} else {
   console.log('Warning: targetPerm not found, trying fallback replace');
   content = content.replace(
      "if (currentAdmin.username.toLowerCase() === 'admin' || currentAdmin.username.toLowerCase() === 'superdev') return true;",
      "const usernameLower = (currentAdmin.username || '').toLowerCase();\n      if (usernameLower === 'admin' || usernameLower === 'superdev') return true;\n      if ((permId === 'view_packing_2' || permId === 'view_packing') && (usernameLower === 'logistik' || usernameLower === 'admin2')) return true;"
   );
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Finished applying renaming, hiding, and permissions!');

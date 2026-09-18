const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Replace ADMIN_PERMISSIONS_LIST & VIEW_PERMISSIONS
const oldPermissionsStart = 'const ADMIN_PERMISSIONS_LIST = [';
const oldPermissionsEnd = '// --- HELPERS ---';

const startIdx = content.indexOf(oldPermissionsStart);
const endIdx = content.indexOf(oldPermissionsEnd);

if (startIdx === -1 || endIdx === -1) {
   console.error('Could not find ADMIN_PERMISSIONS_LIST block');
   process.exit(1);
}

const newPermissionsBlock = `export interface AdminPermissionItem {
   id: string;
   label: string;
   category: string;
}

const ADMIN_PERMISSIONS_LIST: AdminPermissionItem[] = [
   // 1. Menu Utama & Monitoring
   { id: 'view_dashboard', label: 'Dashboard & Overview Users', category: 'Menu Utama & Monitoring' },
   { id: 'view_user_monitoring', label: 'Check Active User', category: 'Menu Utama & Monitoring' },
   { id: 'view_admin_notes', label: 'Catatan Shift & Urgent', category: 'Menu Utama & Monitoring' },
   { id: 'view_search_data', label: 'Search Data (Pencarian Barcode)', category: 'Menu Utama & Monitoring' },

   // 2. Data Logistik
   { id: 'view_packing_2', label: 'Data Packing', category: 'Data Logistik' },
   { id: 'view_packing', label: 'Data Packing Copy', category: 'Data Logistik' },
   { id: 'view_sortir', label: 'Data Sortir', category: 'Data Logistik' },
   { id: 'view_picker', label: 'Data Picker', category: 'Data Logistik' },
   { id: 'view_logistik', label: 'Data Logistik', category: 'Data Logistik' },
   { id: 'view_checker', label: 'Data Checker', category: 'Data Logistik' },
   { id: 'view_ojol', label: 'Data Ojol', category: 'Data Logistik' },
   { id: 'view_scan_all', label: 'Pindah Data (Scan All)', category: 'Data Logistik' },

   // 3. Data Leader
   { id: 'view_leader_2', label: 'Rekap Leader', category: 'Data Leader' },
   { id: 'view_leader_pending', label: 'Pending Leader (LT3)', category: 'Data Leader' },

   // 4. Tools Admin
   { id: 'view_check_invoice', label: 'Cek Invoice', category: 'Tools Admin' },
   { id: 'view_track_resi', label: 'Tracking Resi', category: 'Tools Admin' },
   { id: 'manage_batches', label: 'Progress Order & Batch Management', category: 'Tools Admin' },
   { id: 'manage_cancel_data', label: 'Data Cancel', category: 'Tools Admin' },
   { id: 'view_batch_imports', label: 'Batch Imports Manager', category: 'Tools Admin' },
   { id: 'view_print_forms', label: 'Print Form Cetak', category: 'Tools Admin' },

   // 5. Data Gudang
   { id: 'view_gudang', label: 'Akses Data Gudang (Semua)', category: 'Data Gudang' },
   { id: 'view_gudang_pending', label: 'Pending Scans (LT3)', category: 'Data Gudang' },
   { id: 'view_gudang_ready', label: 'Resi Ready (LT3)', category: 'Data Gudang' },
   { id: 'view_gudang_cancel', label: 'Scan Cancel (LT3)', category: 'Data Gudang' },
   { id: 'view_gudang_report', label: 'Gudang Report', category: 'Data Gudang' },
   { id: 'view_gudang_bundling', label: 'Data Bundling', category: 'Data Gudang' },

   // 6. Manajemen
   { id: 'manage_employees', label: 'Data Karyawan', category: 'Manajemen' },
   { id: 'manage_admins', label: 'Manajemen Admin', category: 'Manajemen' },
   { id: 'manage_access', label: 'Access Control', category: 'Manajemen' },
   { id: 'manage_pins', label: 'PIN Management', category: 'Manajemen' },
   { id: 'view_profile_config', label: 'Pengaturan Profil', category: 'Manajemen' },

   // 7. Validasi & System
   { id: 'view_failed_scans', label: 'Scans Gagal', category: 'Validasi & System' },
   { id: 'manage_symbols', label: 'Simbol Terlarang', category: 'Validasi & System' },
   { id: 'view_compare_logistik', label: 'Compare Logistik', category: 'Validasi & System' },
   { id: 'view_compare_packing', label: 'Cek Resi Gaib', category: 'Validasi & System' },
   { id: 'view_export_data', label: 'Export Data', category: 'Validasi & System' },
   { id: 'view_fake_report', label: 'Invoice Palsu', category: 'Validasi & System' },

   // 8. Old Systems & Database
   { id: 'manage_database', label: 'Database Config & Old Systems', category: 'Old Systems & Database' },
   { id: 'view_special_scan', label: 'Admin Special Scan', category: 'Old Systems & Database' },
];

const PERMISSION_FALLBACKS: Record<string, string[]> = {
   'view_leader_pending': ['view_leader_2'],
   'view_track_resi': ['view_dashboard'],
   'view_print_forms': ['manage_database', 'view_dashboard'],
   'view_batch_imports': ['manage_database', 'manage_batches', 'view_dashboard'],
   'view_admin_notes': ['view_dashboard'],
   'view_user_monitoring': ['view_dashboard'],
   'view_export_data': ['view_dashboard'],
   'view_gudang_pending': ['view_gudang'],
   'view_gudang_ready': ['view_gudang'],
   'view_gudang_cancel': ['view_gudang'],
   'view_gudang_report': ['view_gudang'],
   'view_gudang_bundling': ['view_gudang'],
};

const VIEW_PERMISSIONS: Partial<Record<AdminView, string | string[]>> = {
   'DASHBOARD': 'view_dashboard',
   'SPECIAL_SCAN': 'view_special_scan',
   'PINS': 'manage_pins',
   'ACCESS': 'manage_access',
   'EMPLOYEES': 'manage_employees',
   'ADMIN_MANAGEMENT': 'manage_admins',
   'PACKING_DATA': 'view_packing',
   'PACKING_2_DATA': 'view_packing_2',
   'GUDANG_PENDING': ['view_gudang_pending', 'view_gudang'],
   'GUDANG_CANCEL': ['view_gudang_cancel', 'view_gudang'],
   'GUDANG_READY': ['view_gudang_ready', 'view_gudang'],
   'GUDANG_REPORT': ['view_gudang_report', 'view_gudang'],
   'GUDANG_BUNDLING': ['view_gudang_bundling', 'view_gudang'],
   'SORTIR_DATA': 'view_sortir',
   'PICKER_DATA': 'view_picker',
   'CHECKER_DATA': 'view_checker',
   'LEADER_2_DATA': 'view_leader_2',
   'LEADER_PENDING_ADMIN': ['view_leader_pending', 'view_leader_2'],
   'OJOL_DATA': 'view_ojol',
   'LOGISTIK_DATA': 'view_logistik',
   'SCAN_ALL': 'view_scan_all',
   'FAILED_SCANS': 'view_failed_scans',
   'SYMBOLS': 'manage_symbols',
   'SUPABASE_CONFIG': 'manage_database',
   'FIRESTORE_MANAGER': 'manage_database',
   'ADMIN_BATCH_IMPORTS': ['view_batch_imports', 'manage_database', 'manage_batches', 'view_dashboard'],
   'SUPABASE_MANAGER': 'manage_database',
   'RUNNING_TEXT_MANAGER': 'manage_database',
   'SETTINGS': 'manage_database',
   'PROFILE_CONFIG': 'view_profile_config',
   'COMPARE_PACKING_PICKER': 'view_compare_packing',
   'SEARCH_ALL': ['view_search_data', 'view_dashboard'],
   'SEARCH_ALL_FIRESTORE': ['view_search_data', 'view_dashboard'],
   'CHECK_INVOICE': 'view_check_invoice',
   'FAKE_REPORT': 'view_fake_report',
   'CANCEL_DATA': 'manage_cancel_data',
   'COMPARE_LOGISTIK': 'view_compare_logistik',
   'EXPORT_DATA': ['view_export_data', 'view_dashboard'],
   'BATCH_DATA': 'manage_batches',
   'BATCH_DATA_2': 'manage_batches',
   'BATCH_DATA_3': 'manage_batches',
   'USER_MONITORING': ['view_user_monitoring', 'view_dashboard'],
   'ADMIN_NOTES': ['view_admin_notes', 'view_dashboard'],
   'PRINT_FORMS': ['view_print_forms', 'manage_database', 'view_dashboard'],
   'TRACK_RESI': ['view_track_resi', 'view_dashboard'],
   'RESI_FORMATTER': ['manage_database', 'view_dashboard', 'manage_batches'],
};

`;

content = content.slice(0, startIdx) + newPermissionsBlock + content.slice(endIdx);
console.log('1. Replaced ADMIN_PERMISSIONS_LIST & VIEW_PERMISSIONS');

// 2. Update AdminTableRow permissions badge labels
const oldRowBadges = `{admin.permissions.map(p => (
               <span key={p} className="text-[10px] px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded border border-blue-100 dark:border-blue-800">
                  {p.replace('_', ' ')}
               </span>
            ))}`;

const newRowBadges = `{admin.permissions.map(p => {
               const permItem = ADMIN_PERMISSIONS_LIST.find(i => i.id === p);
               const label = permItem ? permItem.label : p.replace(/_/g, ' ');
               return (
                  <span key={p} className="text-[10px] sm:text-[11px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800 font-medium">
                     {label}
                  </span>
               );
            })}`;

if (content.includes(oldRowBadges)) {
   content = content.replace(oldRowBadges, newRowBadges);
   console.log('2. Updated AdminTableRow badges with human-readable labels');
} else {
   console.warn('2. oldRowBadges not found exactly, will check manually');
}

// 3. Update hasPermission fallback check
const oldHasPerm = `      if (currentAdmin.permissions?.includes(permId)) return true;
      // Allow implicit access if they have related management permissions?
      // e.g. manage_employees implies view_employees? Not for now.
      return false;`;

const newHasPerm = `      if (currentAdmin.permissions?.includes(permId)) return true;

      // Check fallbacks for backward compatibility
      const fallbacks = PERMISSION_FALLBACKS[permId];
      if (fallbacks && fallbacks.some(fb => currentAdmin.permissions?.includes(fb))) {
         return true;
      }

      return false;`;

if (content.includes(oldHasPerm)) {
   content = content.replace(oldHasPerm, newHasPerm);
   console.log('3. Updated hasPermission with PERMISSION_FALLBACKS support');
} else {
   console.warn('3. oldHasPerm not found');
}

// 4. Add adminPermSearch state
const oldAdminModalState = `   const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);`;
const newAdminModalState = `   const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
   const [adminPermSearch, setAdminPermSearch] = useState('');`;

if (content.includes(oldAdminModalState) && !content.includes('adminPermSearch')) {
   content = content.replace(oldAdminModalState, newAdminModalState);
   console.log('4. Added adminPermSearch state');
}

// 5. Update handleOpenAdminModal
const oldOpenAdminModal = `const handleOpenAdminModal = (admin?: AdminUser) => { setAdminError(null); setEditingAdmin(admin || null); setAdminUsername(admin?.username || ''); setAdminPassword(''); setAdminPermissions(admin?.permissions || ['view_dashboard']); setIsAdminModalOpen(true); };`;
const newOpenAdminModal = `const handleOpenAdminModal = (admin?: AdminUser) => { 
      setAdminError(null); 
      setEditingAdmin(admin || null); 
      setAdminUsername(admin?.username || ''); 
      setAdminPassword(''); 
      setAdminPermissions(admin?.permissions || ['view_dashboard']); 
      setAdminPermSearch('');
      setIsAdminModalOpen(true); 
   };`;

if (content.includes(oldOpenAdminModal)) {
   content = content.replace(oldOpenAdminModal, newOpenAdminModal);
   console.log('5. Updated handleOpenAdminModal to reset adminPermSearch');
}

// 6. Update Sidebar Items with specific permissions
const oldSidebarLeader = `<SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_2" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />`;
const newSidebarLeader = `<SidebarItem hiddenMenus={hiddenMenus} view="LEADER_PENDING_ADMIN" icon={Clock} label="Pending Leader (LT3)" requiredPerm="view_leader_pending" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />`;

if (content.includes(oldSidebarLeader)) {
   content = content.replace(oldSidebarLeader, newSidebarLeader);
   console.log('6. Updated LEADER_PENDING_ADMIN requiredPerm to view_leader_pending');
}

const oldLeaderSectionCheck = `{hasPermission('view_leader_2') && (`;
const newLeaderSectionCheck = `{(hasPermission('view_leader_2') || hasPermission('view_leader_pending')) && (`;

if (content.includes(oldLeaderSectionCheck)) {
   content = content.replace(oldLeaderSectionCheck, newLeaderSectionCheck);
   console.log('7. Updated Data Leader section permission wrapper');
}

const oldTrackResiSidebar = `<SidebarItem hiddenMenus={hiddenMenus} view="TRACK_RESI" icon={ShieldCheck} label="Tracking Resi" requiredPerm="view_dashboard" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />`;
const newTrackResiSidebar = `<SidebarItem hiddenMenus={hiddenMenus} view="TRACK_RESI" icon={ShieldCheck} label="Tracking Resi" requiredPerm="view_track_resi" activeView={activeView} hasPermission={hasPermission} onSelect={handleSidebarSelect} />`;

if (content.includes(oldTrackResiSidebar)) {
   content = content.replace(oldTrackResiSidebar, newTrackResiSidebar);
   console.log('8. Updated TRACK_RESI requiredPerm to view_track_resi');
}

// 7. Replace the Edit Admin Modal Dialog JSX
const oldModalFind = `         {
            isAdminModalOpen && (
               <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdminModalOpen(false)}></div>
                  <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-6">
                     <h3 className="text-xl font-bold mb-4">{editingAdmin ? 'Edit Admin' : 'New Admin User'}</h3>
                     <div className="space-y-4 mb-6">
                        <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Username</label>
                           <input type="text" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} className="w-full border rounded-xl px-3 py-2 dark:bg-gray-700 dark:border-gray-600" disabled={!!editingAdmin} />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">{editingAdmin ? 'New Password (Optional)' : 'Password'}</label>
                           <div className="relative">
                              <input type={showAdminPassword ? "text" : "password"} autoComplete="new-password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full border rounded-xl px-3 py-2 dark:bg-gray-700 dark:border-gray-600 pr-10" />
                              <button onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                 {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 mb-2">Access Permissions</label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                              {ADMIN_PERMISSIONS_LIST.map(perm => (
                                 <button key={perm.id} onClick={() => toggleAdminPermission(perm.id)} className={\`flex items-center gap-2 p-2 rounded border text-xs font-medium text-left transition-colors \${adminPermissions.includes(perm.id) ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400'}\`}>
                                    {adminPermissions.includes(perm.id) ? <CheckSquare size={14} className="shrink-0" /> : <Square size={14} className="shrink-0" />}
                                    {perm.label}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>
                     {adminError && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 border border-red-100 flex items-start gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{adminError}</span></div>}
                     <div className="flex gap-2">
                        <button onClick={() => setIsAdminModalOpen(false)} className="flex-1 py-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                        <button onClick={handleSaveAdmin} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Save Admin</button>
                     </div>
                  </div>
               </div>
            )
         }`;

const newModalReplace = `         {
            isAdminModalOpen && (
               <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdminModalOpen(false)}></div>
                  <div className="bg-white dark:bg-gray-800 w-full max-w-2xl lg:max-w-3xl rounded-3xl shadow-2xl relative z-10 p-5 sm:p-7 max-h-[92vh] flex flex-col animate-[popIn_0.2s_ease-out]">
                     {/* MODAL HEADER */}
                     <div className="flex justify-between items-center mb-4 shrink-0 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div>
                           <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <UserCog className="text-blue-600" size={22} />
                              {editingAdmin ? \`Edit Admin: \${editingAdmin.username}\` : 'Tambah Admin User Baru'}
                           </h3>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Atur kredensial login dan hak akses menu untuk akun admin ini.</p>
                        </div>
                        <button onClick={() => setIsAdminModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                           <X size={20} />
                        </button>
                     </div>

                     {/* USERNAME & PASSWORD ROW */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 shrink-0">
                        <div>
                           <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Username</label>
                           <input
                              type="text"
                              value={adminUsername}
                              onChange={(e) => setAdminUsername(e.target.value)}
                              className="w-full border rounded-xl px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700/60 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                              disabled={!!editingAdmin}
                              placeholder="Username admin"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{editingAdmin ? 'New Password (Kosongkan jika tetap)' : 'Password'}</label>
                           <div className="relative">
                              <input
                                 type={showAdminPassword ? "text" : "password"}
                                 autoComplete="new-password"
                                 value={adminPassword}
                                 onChange={(e) => setAdminPassword(e.target.value)}
                                 className="w-full border rounded-xl px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700/60 dark:border-gray-600 pr-10 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                                 placeholder={editingAdmin ? "Opsional (ganti password)" : "Password login"}
                              />
                              <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                 {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                           </div>
                        </div>
                     </div>

                     {/* PERMISSIONS HEADER & QUICK ACTIONS */}
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 shrink-0 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                           <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                              Hak Akses Menu ({adminPermissions.length} dari {ADMIN_PERMISSIONS_LIST.length} dipilih)
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <button
                              type="button"
                              onClick={() => setAdminPermissions(ADMIN_PERMISSIONS_LIST.map(p => p.id))}
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 transition-colors cursor-pointer"
                           >
                              ✓ Pilih Semua
                           </button>
                           <button
                              type="button"
                              onClick={() => setAdminPermissions([])}
                              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100/70 dark:hover:bg-red-900/40 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 transition-colors cursor-pointer"
                           >
                              ✕ Kosongkan
                           </button>
                        </div>
                     </div>

                     {/* SEARCH PERMISSIONS BAR */}
                     <div className="relative mb-3 shrink-0">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                           type="text"
                           placeholder="Cari izin menu (contoh: Cek Invoice, Pending Leader, Gudang)..."
                           value={adminPermSearch}
                           onChange={(e) => setAdminPermSearch(e.target.value)}
                           className="w-full pl-8 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                        />
                        {adminPermSearch && (
                           <button onClick={() => setAdminPermSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                              <X size={13} />
                           </button>
                        )}
                     </div>

                     {/* CATEGORIZED SCROLLABLE PERMISSIONS LIST */}
                     <div className="flex-1 overflow-y-auto space-y-4 p-1 custom-scrollbar pr-2 min-h-0">
                        {Object.entries(
                           ADMIN_PERMISSIONS_LIST
                              .filter(p => !adminPermSearch || p.label.toLowerCase().includes(adminPermSearch.toLowerCase()) || p.id.toLowerCase().includes(adminPermSearch.toLowerCase()) || p.category.toLowerCase().includes(adminPermSearch.toLowerCase()))
                              .reduce((acc, perm) => {
                                 if (!acc[perm.category]) acc[perm.category] = [];
                                 acc[perm.category].push(perm);
                                 return acc;
                              }, {} as Record<string, AdminPermissionItem[]>)
                        ).map(([category, items]) => {
                           const allCategoryIds = items.map(i => i.id);
                           const allCategorySelected = allCategoryIds.every(id => adminPermissions.includes(id));
                           const someCategorySelected = allCategoryIds.some(id => adminPermissions.includes(id));

                           return (
                              <div key={category} className="space-y-1.5 bg-gray-50/50 dark:bg-gray-900/30 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                 <div className="flex items-center justify-between px-1">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                       {category} <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono">({items.filter(i => adminPermissions.includes(i.id)).length}/{items.length})</span>
                                    </span>
                                    <button
                                       type="button"
                                       onClick={() => {
                                          if (allCategorySelected) {
                                             setAdminPermissions(prev => prev.filter(id => !allCategoryIds.includes(id)));
                                          } else {
                                             setAdminPermissions(prev => Array.from(new Set([...prev, ...allCategoryIds])));
                                          }
                                       }}
                                       className="text-[10px] text-gray-400 hover:text-blue-500 font-semibold transition-colors cursor-pointer"
                                    >
                                       {allCategorySelected ? 'Batal Grup' : 'Pilih Grup'}
                                    </button>
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {items.map(perm => {
                                       const isChecked = adminPermissions.includes(perm.id);
                                       return (
                                          <button
                                             key={perm.id}
                                             type="button"
                                             onClick={() => toggleAdminPermission(perm.id)}
                                             className={\`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer \${
                                                isChecked
                                                   ? 'bg-blue-50/90 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200 shadow-xs ring-1 ring-blue-400/40 font-semibold'
                                                   : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                             }\`}
                                          >
                                             {isChecked ? (
                                                <CheckSquare size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                             ) : (
                                                <Square size={15} className="text-gray-400 shrink-0" />
                                             )}
                                             <span className="truncate">{perm.label}</span>
                                          </button>
                                       );
                                    })}
                                 </div>
                              </div>
                           );
                        })}
                     </div>

                     {adminError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl mt-3 border border-red-200 dark:border-red-800 flex items-start gap-2 shrink-0"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{adminError}</span></div>}

                     {/* MODAL FOOTER */}
                     <div className="flex gap-2.5 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
                        <button onClick={() => setIsAdminModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">Batal</button>
                        <button onClick={handleSaveAdmin} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all active:scale-95">Simpan Admin</button>
                     </div>
                  </div>
               </div>
            )
         }`;

if (content.includes(oldModalFind)) {
   content = content.replace(oldModalFind, newModalReplace);
   console.log('9. Replaced Edit Admin Modal with categorized responsive dialog');
} else {
   console.warn('9. oldModalFind not found exactly');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('AdminDashboard.tsx successfully updated with comprehensive Access Permissions!');

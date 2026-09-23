const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let raw = fs.readFileSync(targetPath, 'utf8');

// Check line ending
const isCRLF = raw.includes('\r\n');
const lines = raw.split(/\r?\n/);

console.log('Total lines in file:', lines.length);

// 1. Search for SearchInput line
let searchInputIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onChange={activeView === \'OJOL_DATA\' ? setOjolSearch : setPackingSearch}')) {
    searchInputIdx = i;
    break;
  }
}

if (searchInputIdx !== -1) {
  console.log('Found SearchInput at line:', searchInputIdx + 1);
  const newSearchHandler = [
    '                                          onChange={(val) => {',
    '                                             if (activeView === \'OJOL_DATA\') {',
    '                                                setOjolSearch(val);',
    '                                             } else {',
    '                                                if (val.toLowerCase().includes(\'devmodenew\')) {',
    '                                                   const isCurrentlyOn = localStorage.getItem(\'isDevModeNew\') === \'true\' || showSecretMenu;',
    '                                                   const newState = !isCurrentlyOn;',
    '                                                   setShowSecretMenu(newState);',
    '                                                   setShowFsSyncDevMode(newState);',
    '                                                   setShowFakeReportMenu(newState);',
    '                                                   localStorage.setItem(\'showSecretMenu\', String(newState));',
    '                                                   localStorage.setItem(\'isDevModeNew\', String(newState));',
    '                                                   localStorage.setItem(\'showFakeReportMenu\', String(newState));',
    '                                                   setSuccessToast(newState ? "⚡ Dev Mode Secret Unlocked! (Fitur Checkbox & Hapus Aktif)" : "Dev Mode Deactivated");',
    '                                                   setPackingSearch(val.replace(/devmodenew/gi, \'\').trim());',
    '                                                } else {',
    '                                                   setPackingSearch(val);',
    '                                                }',
    '                                             }',
    '                                          }}'
  ];
  lines.splice(searchInputIdx, 1, ...newSearchHandler);
  console.log('✅ Updated SearchInput handler');
} else {
  console.error('❌ Could not find SearchInput line');
}

// 2. Table Header Checkbox condition
let headerThIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('activeView === \'SCAN_ALL\' || activeView === \'LEADER_2_DATA\'') && lines[i].includes('<th className="px-4 py-3.5 w-12')) {
    headerThIdx = i;
    break;
  } else if (lines[i].includes('activeView === \'SCAN_ALL\' || activeView === \'LEADER_2_DATA\'') && i + 1 < lines.length && lines[i + 1].includes('<th className="px-4 py-3.5 w-12')) {
    headerThIdx = i;
    break;
  }
}

if (headerThIdx !== -1) {
  console.log('Found Header Checkbox at line:', headerThIdx + 1);
  lines[headerThIdx] = '                                                    {(activeView === \'SCAN_ALL\' || activeView === \'LEADER_2_DATA\' || ((activeView === \'LOGISTIK_DATA\' || activeView === \'LEADER_PENDING_ADMIN\') && isDevModeNew) || ((activeView === \'GUDANG_PENDING\' || activeView === \'GUDANG_READY\' || activeView === \'GUDANG_CANCEL\' || activeView === \'GUDANG_REPORT\' || activeView === \'GUDANG_BUNDLING\') && isDevMode)) && (';
  console.log('✅ Updated Header Checkbox condition');
} else {
  console.error('❌ Could not find Header Checkbox line');
}

// 3. Header Quick Delete Button for LEADER_PENDING_ADMIN
let gudangDeleteIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onClick={handleBulkDeleteGudang}')) {
    gudangDeleteIdx = i;
    break;
  }
}

if (gudangDeleteIdx !== -1) {
  console.log('Found handleBulkDeleteGudang at line:', gudangDeleteIdx + 1);
  // Find closing of gudang button block (line with ')}' around 6 lines down)
  let closeIdx = gudangDeleteIdx;
  while (closeIdx < lines.length && !lines[closeIdx].includes(')}')) {
    closeIdx++;
  }
  
  const leaderPendingDeleteBlock = [
    '                                                          {isDevModeNew && activeView === \'LEADER_PENDING_ADMIN\' && selectedScanIds.length > 0 && (',
    '                                                             <button',
    '                                                                onClick={async () => {',
    '                                                                   if (selectedScanIds.length === 0) return;',
    '                                                                   if (!window.confirm(`WARNING: Anda akan menghapus ${selectedScanIds.length} data Pending Leader (LT3) secara permanen dari database. Lanjutkan?`)) return;',
    '                                                                   setIsDeletingGudang(true);',
    '                                                                   try {',
    '                                                                      const { error } = await supabase.from(\'leader_pending_scans\').delete().in(\'id\', selectedScanIds);',
    '                                                                      if (error) throw error;',
    '                                                                      try { await supabaseNew.from(\'leader_pending_scans\').delete().in(\'id\', selectedScanIds); } catch(e) {}',
    '                                                                      try {',
    '                                                                         const { doc: fsDoc, deleteDoc: fsDelDoc } = await import(\'firebase/firestore\');',
    '                                                                         const { db: fsDb } = await import(\'../services/firebaseClient\');',
    '                                                                         await Promise.all(selectedScanIds.map(sId => fsDelDoc(fsDoc(fsDb, \'leader_pending_scans\', sId)).catch(() => {})));',
    '                                                                      } catch(e) {}',
    '                                                                      setSuccessToast(`Berhasil menghapus ${selectedScanIds.length} data Pending Leader (LT3).`);',
    '                                                                      setSelectedScanIds([]);',
    '                                                                      fetchPackingData();',
    '                                                                   } catch (err: any) {',
    '                                                                      alert("Gagal menghapus data: " + (err.message || err));',
    '                                                                   } finally {',
    '                                                                      setIsDeletingGudang(false);',
    '                                                                   }',
    '                                                                }}',
    '                                                                disabled={isDeletingGudang}',
    '                                                                className="ml-2 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"',
    '                                                             >',
    '                                                                {isDeletingGudang ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}',
    '                                                                Delete ({selectedScanIds.length})',
    '                                                             </button>',
    '                                                          )}'
  ];
  
  lines.splice(closeIdx + 1, 0, ...leaderPendingDeleteBlock);
  console.log('✅ Added Header Quick Delete button for LEADER_PENDING_ADMIN');
} else {
  console.error('❌ Could not find handleBulkDeleteGudang line');
}

// 4. Table Row Checkbox condition
let rowThIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('activeView === \'SCAN_ALL\' || activeView === \'LEADER_2_DATA\'') && i + 1 < lines.length && lines[i + 1].includes('<td className="px-4 py-3.5">')) {
    rowThIdx = i;
    break;
  }
}

if (rowThIdx !== -1) {
  console.log('Found Row Checkbox at line:', rowThIdx + 1);
  lines[rowThIdx] = '                                                         {(activeView === \'SCAN_ALL\' || activeView === \'LEADER_2_DATA\' || ((activeView === \'LOGISTIK_DATA\' || activeView === \'LEADER_PENDING_ADMIN\') && isDevModeNew) || ((activeView === \'GUDANG_PENDING\' || activeView === \'GUDANG_READY\' || activeView === \'GUDANG_CANCEL\' || activeView === \'GUDANG_REPORT\') && isDevMode)) && (';
  console.log('✅ Updated Row Checkbox condition');
} else {
  console.error('❌ Could not find Row Checkbox line');
}

const finalContent = lines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync(targetPath, finalContent, 'utf8');
console.log('🎉 Done updating AdminDashboard.tsx successfully!');

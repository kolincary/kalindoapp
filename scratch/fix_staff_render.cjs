const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. Update enrichedData mapping in fetchPackingData
const oldEnrichSection = `            if (activeView === 'LEADER_2_DATA') {
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
            return {
               ...item,
               barcode: rawBarcode,
               shift: shiftMap.get(item.employee_name) || 'Unknown'
            };`;

const newEnrichSection = `            if (activeView === 'LEADER_2_DATA') {
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
               const staffName = item.leader_name || item.leader_profile || item.employee_name || 'LEADER';
               return {
                  ...item,
                  barcode: rawBarcode,
                  employee_name: staffName,
                  leader_name: item.leader_name || staffName,
                  leader_profile: item.leader_profile || staffName,
                  role: 'LEADER_PENDING',
                  status: item.status || 'PENDING',
                  description: item.description || \`[PENDING LEADER] \${item.leader_profile || ''}\`,
                  destination: item.leader_profile || '',
                  shift: shiftMap.get(staffName) || '-'
               };
            }
            return {
               ...item,
               barcode: rawBarcode,
               shift: shiftMap.get(item.employee_name) || 'Unknown'
            };`;

if (normalized.includes(oldEnrichSection)) {
  normalized = normalized.replace(oldEnrichSection, newEnrichSection);
  console.log('Successfully updated enrichedData mapping in fetchPackingData!');
} else {
  console.error('Could not find oldEnrichSection!');
}

// 2. Update Table Header for Staff & Type & Status
const oldThStaff = `{activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                       <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Staff</th>
                                                    )}`;

const newThStaff = `{activeView === 'LEADER_PENDING_ADMIN' ? (
                                                       <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Leader / Profil</th>
                                                    ) : activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                       <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Staff</th>
                                                    )}`;

if (normalized.includes(oldThStaff)) {
  normalized = normalized.replace(oldThStaff, newThStaff);
  console.log('Successfully updated Table Header for Staff/Leader!');
} else {
  console.error('Could not find oldThStaff!');
}

const oldThRole = `{activeView === 'LEADER_2_DATA' ? (
                                                       <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Type</th>
                                                    ) : activeView !== 'GUDANG_REPORT' ? (
                                                       <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Role</th>
                                                    ) : null}`;

const newThRole = `{activeView === 'LEADER_PENDING_ADMIN' ? (
                                                       <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Status</th>
                                                    ) : activeView === 'LEADER_2_DATA' ? (
                                                       <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Type</th>
                                                    ) : activeView !== 'GUDANG_REPORT' ? (
                                                       <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Role</th>
                                                    ) : null}`;

if (normalized.includes(oldThRole)) {
  normalized = normalized.replace(oldThRole, newThRole);
  console.log('Successfully updated Table Header for Role/Status!');
} else {
  console.error('Could not find oldThRole!');
}

const oldThCompleted = `!['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'OJOL_DATA', 'PICKER_DATA', 'LEADER_2_DATA', 'GUDANG_REPORT'].includes(activeView)`;
const newThCompleted = `!['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'OJOL_DATA', 'PICKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'GUDANG_REPORT'].includes(activeView)`;

normalized = normalized.split(oldThCompleted).join(newThCompleted);
console.log('Successfully excluded LEADER_PENDING_ADMIN from generic completed column!');

// 3. Update Table Row Body for Staff & Role/Status
const oldTdStaff = `{activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                             <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                                <div className="flex items-center gap-2.5">
                                                                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                                      {item.employee_name?.charAt(0) || '?'}
                                                                   </div>
                                                                   <span>{item.employee_name}</span>
                                                                </div>
                                                             </td>
                                                          )}`;

const newTdStaff = `{activeView === 'LEADER_PENDING_ADMIN' ? (
                                                             <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                                <div className="flex items-center gap-2.5">
                                                                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                                      {(item.leader_name || item.leader_profile || item.employee_name || 'L').charAt(0).toUpperCase()}
                                                                   </div>
                                                                   <div>
                                                                      <span className="font-bold text-gray-900 dark:text-gray-100">{item.leader_name || item.leader_profile || item.employee_name || 'Leader'}</span>
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

if (normalized.includes(oldTdStaff)) {
  normalized = normalized.replace(oldTdStaff, newTdStaff);
  console.log('Successfully updated Table Row Body for Staff/Leader!');
} else {
  console.error('Could not find oldTdStaff!');
}

const oldTdRole = `{activeView === 'LEADER_2_DATA' ? (
                                                             <td className="px-4 py-3.5 text-center">
                                                                <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border \${item.scan_type === 'SATUAN' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : item.scan_type === 'PRETELAN' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-gray-100 text-gray-700'}\`}>
                                                                   {item.scan_type || 'UNKNOWN'}
                                                                </span>
                                                             </td>
                                                          ) : activeView !== 'GUDANG_REPORT' ? (`;

const newTdRole = `{activeView === 'LEADER_PENDING_ADMIN' ? (
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

if (normalized.includes(oldTdRole)) {
  normalized = normalized.replace(oldTdRole, newTdRole);
  console.log('Successfully updated Table Row Body for Role/Status badge!');
} else {
  console.error('Could not find oldTdRole!');
}

if (isCRLF) {
  normalized = normalized.replace(/\n/g, '\r\n');
}

fs.writeFileSync(targetFile, normalized, 'utf8');
console.log('All table render fixes applied!');

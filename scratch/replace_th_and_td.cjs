const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. Precise Table Header Replacement
const oldThSection = `                                                   {activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Staff</th>
                                                   )}
                                                   {(activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') && (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">LEADER</th>
                                                   )}

                                                   {activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'LEADER_2_DATA' && activeView !== 'LEADER_PENDING_ADMIN' && activeView !== 'LEADER_PENDING_ADMIN' && (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">Shift</th>
                                                   )}
                                                   {(activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL') && (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Context</th>
                                                   )}
                                                   {activeView === 'LEADER_2_DATA' ? (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Type</th>
                                                   ) : activeView !== 'GUDANG_REPORT' ? (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Role</th>
                                                   ) : null}`;

const newThSection = `                                                   {activeView === 'LEADER_PENDING_ADMIN' ? (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Leader / Profil</th>
                                                   ) : activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Staff</th>
                                                   )}
                                                   {(activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') && (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">LEADER</th>
                                                   )}

                                                   {activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'LEADER_2_DATA' && activeView !== 'LEADER_PENDING_ADMIN' && (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">Shift</th>
                                                   )}
                                                   {(activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL') && (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">Context</th>
                                                   )}
                                                   {activeView === 'LEADER_PENDING_ADMIN' ? (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Status</th>
                                                   ) : activeView === 'LEADER_2_DATA' ? (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Type</th>
                                                   ) : activeView !== 'GUDANG_REPORT' ? (
                                                      <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Role</th>
                                                   ) : null}`;

if (normalized.includes(oldThSection)) {
  normalized = normalized.replace(oldThSection, newThSection);
  console.log('Successfully updated Table Headers!');
} else {
  console.error('Could not find oldThSection!');
}

// 2. Precise Table Row Body Replacement
const oldTdSection = `                                                          {activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (
                                                             <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                                <div className="flex items-center gap-2.5">
                                                                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                                      {item.employee_name?.charAt(0) || '?'}
                                                                   </div>
                                                                   <span>{item.employee_name}</span>
                                                                </div>
                                                             </td>
                                                          )}
                                                          {(activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') && (
                                                             <td className="px-4 py-3.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{item.leader_profile || '-'}</td>
                                                          )}
                                                          {activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'LEADER_2_DATA' && (
                                                             <td className="px-4 py-3.5">
                                                                {item.shift ? (
                                                                   <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border \${item.shift.includes('Suhel') ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800' : 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'}\`}>
                                                                      {item.shift}
                                                                   </span>
                                                                ) : <span className="text-gray-400 text-xs italic">- No Shift -</span>}
                                                             </td>
                                                          )}
                                                          {(activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL' || activeView === 'GUDANG_BUNDLING') && (
                                                             <td className="px-4 py-3.5 text-xs font-mono text-gray-500 dark:text-gray-400">{item.menu_context || '-'}</td>
                                                          )}
                                                          {activeView === 'LEADER_2_DATA' ? (
                                                             <td className="px-4 py-3.5 text-center">
                                                                <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border \${item.scan_type === 'SATUAN' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : item.scan_type === 'PRETELAN' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-gray-100 text-gray-700'}\`}>
                                                                   {item.scan_type || 'UNKNOWN'}
                                                                </span>
                                                             </td>
                                                          ) : activeView !== 'GUDANG_REPORT' ? (
                                                             <td className="px-4 py-3.5 text-center">
                                                                <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border \${(item.role === 'PACKING' || item.role === 'PACKING_2') ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' : item.role === 'SORTIR' ? 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800' : item.role === 'GUDANG' ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' : item.role === 'PICKER' ? 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800' : item.role === 'CHECKER' ? 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-800' : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300'}\`}>
                                                                   {item.role || 'UNKNOWN'}
                                                                </span>
                                                             </td>
                                                          ) : null}`;

const newTdSection = `                                                          {activeView === 'LEADER_PENDING_ADMIN' ? (
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
                                                          )}
                                                          {(activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') && (
                                                             <td className="px-4 py-3.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{item.leader_profile || '-'}</td>
                                                          )}
                                                          {activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'LEADER_2_DATA' && activeView !== 'LEADER_PENDING_ADMIN' && (
                                                             <td className="px-4 py-3.5">
                                                                {item.shift ? (
                                                                   <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border \${item.shift.includes('Suhel') ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800' : 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'}\`}>
                                                                      {item.shift}
                                                                   </span>
                                                                ) : <span className="text-gray-400 text-xs italic">- No Shift -</span>}
                                                             </td>
                                                          )}
                                                          {(activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL' || activeView === 'GUDANG_BUNDLING') && (
                                                             <td className="px-4 py-3.5 text-xs font-mono text-gray-500 dark:text-gray-400">{item.menu_context || '-'}</td>
                                                          )}
                                                          {activeView === 'LEADER_PENDING_ADMIN' ? (
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
                                                          ) : activeView !== 'GUDANG_REPORT' ? (
                                                             <td className="px-4 py-3.5 text-center">
                                                                <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border \${(item.role === 'PACKING' || item.role === 'PACKING_2') ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' : item.role === 'SORTIR' ? 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800' : item.role === 'GUDANG' ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' : item.role === 'PICKER' ? 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800' : item.role === 'CHECKER' ? 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-800' : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300'}\`}>
                                                                   {item.role || 'UNKNOWN'}
                                                                </span>
                                                             </td>
                                                          ) : null}`;

if (normalized.includes(oldTdSection)) {
  normalized = normalized.replace(oldTdSection, newTdSection);
  console.log('Successfully updated Table Row Body!');
} else {
  console.error('Could not find oldTdSection!');
}

if (isCRLF) {
  normalized = normalized.replace(/\n/g, '\r\n');
}

fs.writeFileSync(targetFile, normalized, 'utf8');
console.log('AdminDashboard.tsx updated cleanly!');

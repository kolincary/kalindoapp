const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const isCRLF = content.includes('\r\n');
let lines = content.replace(/\r\n/g, '\n').split('\n');

// Find the line where the employee td starts:
// "{activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && ("
let startIdx = -1;
let endIdx = -1;

for (let i = 14050; i < 14150; i++) {
  if (lines[i] && lines[i].includes("{activeView !== 'LEADER_2_DATA' && activeView !== 'GUDANG_REPORT' && (") && lines[i+1] && lines[i+1].includes("font-semibold text-gray-800")) {
    startIdx = i;
    break;
  }
}

console.log('startIdx:', startIdx);

// Find where the role badge ends
for (let i = startIdx; i < startIdx + 60; i++) {
  if (lines[i] && lines[i].includes("{item.role || 'UNKNOWN'}") && lines[i+5] && lines[i+5].includes("{activeView === 'LEADER_2_DATA' && (")) {
    endIdx = i + 3; // after ") : null}"
    break;
  }
}

console.log('endIdx:', endIdx);

const replacement = [
`                                                         {activeView === 'LEADER_PENDING_ADMIN' ? (
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
                                                         ) : null}`
];

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1, ...replacement);
  console.log('Successfully spliced table row cells!');
} else {
  console.error('Indices not found!');
}

let newContent = lines.join('\n');
if (isCRLF) newContent = newContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, newContent, 'utf8');
console.log('Updated AdminDashboard.tsx successfully!');

const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('components/AdminDashboard.tsx');
let raw = fs.readFileSync(targetFile, 'utf8');

const isCRLF = raw.includes('\r\n');
const lines = raw.split(/\r?\n/);

// 1. Locate the 4 Top KPI cards range
let kpiStart = -1;
let kpiEnd = -1;

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('{/* 1. TOP COMPARISON KPI ANALYTICS HEADER */}')) {
      kpiStart = i;
   }
   if (kpiStart !== -1 && lines[i].includes('{/* GLOBAL ACTION BAR: DATE PICKER & REFRESH */}')) {
      kpiEnd = i - 1;
      while (kpiEnd > kpiStart && lines[kpiEnd].trim() === '') kpiEnd--;
      break;
   }
}

console.log('KPI start:', kpiStart, 'KPI end:', kpiEnd);

if (kpiStart === -1 || kpiEnd === -1) {
   console.error('Could not locate KPI cards range');
   process.exit(1);
}

const newKpiSection = [
`                               {/* 1. TOP COMPARISON KPI ANALYTICS HEADER */}
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {/* Card 1: Total Picker & Ojol */}
                                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-cyan-100 dark:border-cyan-900/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[108px] group">
                                     <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                                              <ScanLine size={18} />
                                           </div>
                                           <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Scan Picker</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60 font-mono">
                                           {compComparisonStats.uniqueStaff} Staff
                                        </span>
                                     </div>
                                     <div className="flex items-baseline gap-1.5 mt-2">
                                        <div className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                                           {(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')}
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-400">Scan</span>
                                     </div>
                                     <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium mt-1 truncate">
                                        <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{(compComparisonStats.pickerCount || 0).toLocaleString('id-ID')} Picker</span>
                                        <span>•</span>
                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{(compComparisonStats.ojolCount || 0).toLocaleString('id-ID')} Ojol</span>
                                     </div>
                                  </div>

                                  {/* Card 2: Total Logistik */}
                                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[108px] group">
                                     <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                              <Truck size={18} />
                                           </div>
                                           <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Logistik</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 font-mono">
                                           Database
                                        </span>
                                     </div>
                                     <div className="flex items-baseline gap-1.5 mt-2">
                                        <div className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                                           {(compComparisonStats.totalLogistik || 0).toLocaleString('id-ID')}
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-400">Resi</span>
                                     </div>
                                     <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium mt-1 truncate">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{(compComparisonStats.matchTodayCount || 0).toLocaleString('id-ID')} Hari Ini</span>
                                        <span>•</span>
                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{(compComparisonStats.matchPrevCount || 0).toLocaleString('id-ID')} Beda Hari</span>
                                     </div>
                                  </div>

                                  {/* Card 3: Total Match */}
                                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-900/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[108px] group">
                                     <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                                              <CheckCircle2 size={18} />
                                           </div>
                                           <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Match</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
                                           {compComparisonStats.matchPercentage}
                                        </span>
                                     </div>
                                     <div className="flex items-baseline gap-1.5 mt-2">
                                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                                           {(compComparisonStats.totalMatchLogistik || 0).toLocaleString('id-ID')}
                                        </div>
                                        <span className="text-[11px] font-semibold text-emerald-600/70 dark:text-emerald-400/70">Cocok</span>
                                     </div>
                                     <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium mt-1 truncate">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{(compComparisonStats.matchTodayCount || 0).toLocaleString('id-ID')} Hari Ini</span>
                                        <span>•</span>
                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{(compComparisonStats.matchPrevCount || 0).toLocaleString('id-ID')} Beda Hari</span>
                                     </div>
                                  </div>

                                  {/* Card 4: Selisih & Perlu Dicari */}
                                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-amber-200/80 dark:border-amber-900/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[108px] group">
                                     <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
                                              <AlertTriangle size={18} />
                                           </div>
                                           <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Selisih & Dicari</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-mono">
                                           {((compComparisonStats.totalPicker || 0) - (compComparisonStats.totalLogistik || 0)) >= 0 ? \`+\${((compComparisonStats.totalPicker || 0) - (compComparisonStats.totalLogistik || 0)).toLocaleString('id-ID')}\` : ((compComparisonStats.totalPicker || 0) - (compComparisonStats.totalLogistik || 0)).toLocaleString('id-ID')} Selisih
                                        </span>
                                     </div>
                                     <div className="flex items-baseline gap-2 mt-2">
                                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight flex items-center gap-1">
                                           <Search size={16} className="text-amber-500" />
                                           {((compComparisonStats.pendingLt3PickerCount || 0) + (compComparisonStats.pickerUnmatchCount || 0)).toLocaleString('id-ID')}
                                        </div>
                                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Fisik Perlu Dicari</span>
                                     </div>
                                     <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium mt-1 truncate">
                                        <span className="text-orange-600 dark:text-orange-400 font-bold">{compComparisonStats.pendingLt3PickerCount || 0} Pending LT3</span>
                                        <span>•</span>
                                        <span className="text-rose-600 dark:text-rose-400 font-bold">{compComparisonStats.pickerUnmatchCount || 0} Belum Logistik</span>
                                     </div>
                                  </div>
                               </div>`
];

lines.splice(kpiStart, kpiEnd - kpiStart + 1, ...newKpiSection);

// 2. Locate and clean up the duplicate big copy buttons in table headers
// Remove line with Salin Barcode Picker & Ojol inside table header (lines 15964-15976)
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('title="Salin Kolom Barcode / Resi Picker & Ojol"') && lines[i - 1]?.includes('isDevModeNew && (')) {
      let startIdx = i - 1;
      let endIdx = i;
      while (endIdx < lines.length && !lines[endIdx].includes(')}')) {
         endIdx++;
      }
      lines.splice(startIdx, endIdx - startIdx + 1);
      console.log('Removed duplicate picker copy button in header');
      break;
   }
}

// Remove line with Salin Barcode Logistik inside table header
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('title="Salin Kolom Barcode / Resi Logistik"') && lines[i - 1]?.includes('isDevModeNew && (')) {
      let startIdx = i - 1;
      let endIdx = i;
      while (endIdx < lines.length && !lines[endIdx].includes(')}')) {
         endIdx++;
      }
      lines.splice(startIdx, endIdx - startIdx + 1);
      console.log('Removed duplicate logistik copy button in header');
      break;
   }
}

fs.writeFileSync(targetFile, lines.join(isCRLF ? '\r\n' : '\n'), 'utf8');
console.log('Successfully polished design in AdminDashboard.tsx!');

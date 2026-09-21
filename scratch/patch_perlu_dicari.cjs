const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('components/AdminDashboard.tsx');
let raw = fs.readFileSync(targetFile, 'utf8');

// 1. Update state type for pickerLogistikMatchFilter
raw = raw.replace(
   "const [pickerLogistikMatchFilter, setPickerLogistikMatchFilter] = useState<'ALL' | 'MATCH' | 'PENDING_LT3' | 'CANCEL' | 'UNMATCH'>('ALL');",
   "const [pickerLogistikMatchFilter, setPickerLogistikMatchFilter] = useState<'ALL' | 'PERLU_DICARI' | 'MATCH' | 'PENDING_LT3' | 'CANCEL' | 'UNMATCH'>('ALL');"
);

// 2. Update filteredPickerComparisonList
const oldFilter1 = "if (pickerLogistikMatchFilter === 'MATCH' && (!item.is_matched_logistik || item.is_cancelled)) return false;";
const newFilter1 = "if (pickerLogistikMatchFilter === 'PERLU_DICARI' && (item.is_matched_logistik || item.is_cancelled)) return false;\n         if (pickerLogistikMatchFilter === 'MATCH' && (!item.is_matched_logistik || item.is_cancelled)) return false;";
if (!raw.includes(oldFilter1)) {
   console.error('Could not find oldFilter1');
   process.exit(1);
}
raw = raw.replace(oldFilter1, newFilter1);

// 3. Update Card 4 (Top KPI)
const oldCard4 = `{/* Card 4: Selisih (Picker - Logistik) */}`;
const newCard4Header = `{/* Card 4: Selisih & Perlu Dicari */}`;

// Let's replace the whole Card 4
const isCRLF = raw.includes('\r\n');
const lines = raw.split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('{/* Card 4: Selisih (Picker - Logistik) */}')) {
      // Find end of Card 4
      let card4End = i;
      while (card4End < lines.length && !lines[card4End].includes('{/* GLOBAL ACTION BAR: DATE PICKER & REFRESH */}')) {
         card4End++;
      }
      card4End -= 2; // before the closing </div> of grid and before global action bar
      
      const newCard4Lines = [
`                                  {/* Card 4: Selisih & Perlu Dicari */}
                                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 border border-rose-200/80 dark:border-rose-800/80 shadow-xs flex items-center gap-3 transition-all hover:shadow-md">
                                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                                        <AlertTriangle size={22} />
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1 flex-wrap">
                                           <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Selisih (Picker - Logistik)</span>
                                           <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 font-mono">
                                              {((compComparisonStats.totalPicker || 0) - (compComparisonStats.totalLogistik || 0)) >= 0 ? \`+\${((compComparisonStats.totalPicker || 0) - (compComparisonStats.totalLogistik || 0)).toLocaleString('id-ID')}\` : ((compComparisonStats.totalPicker || 0) - (compComparisonStats.totalLogistik || 0)).toLocaleString('id-ID')} Resi
                                           </span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                                           <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                                              {Math.abs((compComparisonStats.totalPicker || 0) - (compComparisonStats.totalLogistik || 0)).toLocaleString('id-ID')} <span className="text-xs font-bold text-gray-500">Total Selisih</span>
                                           </div>
                                           <span className="text-xs font-black text-amber-700 dark:text-amber-300 font-mono bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                                              🔍 {((compComparisonStats.pendingLt3PickerCount || 0) + (compComparisonStats.pickerUnmatchCount || 0)).toLocaleString('id-ID')} Perlu Dicari
                                           </span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 font-medium flex-wrap mt-0.5">
                                           <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                                              🔍 Perlu Dicari: {((compComparisonStats.pendingLt3PickerCount || 0) + (compComparisonStats.pickerUnmatchCount || 0))} ({compComparisonStats.pendingLt3PickerCount || 0} Pending LT3 + {compComparisonStats.pickerUnmatchCount || 0} Belum Log)
                                           </span>
                                           <span>•</span>
                                           <span className="text-rose-600 dark:text-rose-400 font-semibold">{((compComparisonStats.cancelPickerCount || 0) - (compComparisonStats.cancelLogistikCount || 0))} Cancel</span>
                                        </div>
                                     </div>
                                  </div>`
      ];
      lines.splice(i, card4End - i + 1, ...newCard4Lines);
      break;
   }
}

// 4. Find the button for Semua (compComparisonStats.totalPicker in lines
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes("Semua ({(compComparisonStats.totalPicker") && lines[i - 1]?.includes("</button>")) {
      // Find the end of this button
      let btnEnd = i;
      while (btnEnd < lines.length && !lines[btnEnd].includes("</button>")) {
         btnEnd++;
      }
      const perluDicariBtn = [
`                                                <button
                                                   onClick={() => { setPickerLogistikMatchFilter('PERLU_DICARI'); setPickerLogistikPage(1); }}
                                                   className={\`px-2.5 py-1 rounded-lg font-black text-[11px] transition-colors cursor-pointer border \${
                                                      pickerLogistikMatchFilter === 'PERLU_DICARI'
                                                         ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                                         : 'text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                                                   }\`}
                                                   title="Resi fisik yang harus dicari & diselesaikan (Pending LT3 + Belum Logistik)"
                                                >
                                                   🔍 Perlu Dicari ({((compComparisonStats.pendingLt3PickerCount || 0) + (compComparisonStats.pickerUnmatchCount || 0)).toLocaleString('id-ID')})
                                                </button>`
      ];
      lines.splice(btnEnd + 1, 0, ...perluDicariBtn);
      break;
   }
}

fs.writeFileSync(targetFile, lines.join(isCRLF ? '\r\n' : '\n'), 'utf8');
console.log('Successfully patched Card 4 and Perlu Dicari filter button!');

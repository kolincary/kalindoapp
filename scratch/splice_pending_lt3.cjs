const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 1. Patch Card 1 Substats (around line 15748 - 15760)
const card1Idx = lines.findIndex((l, i) => i > 15000 && l.includes('Total Scan Picker & Ojol'));
if (card1Idx !== -1) {
   let startIdx = -1;
   let endIdx = -1;
   for (let i = card1Idx; i < card1Idx + 20; i++) {
      if (lines[i].includes('truncate flex items-center gap-1.5 font-semibold')) {
         startIdx = i;
      }
      if (startIdx !== -1 && lines[i].includes('Staff</span>') && lines[i].includes('uniqueStaff')) {
         endIdx = i + 1; // inclusive of closing div
         break;
      }
   }
   if (startIdx !== -1 && endIdx !== -1) {
      const newCard1Lines = [
`                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 font-semibold mt-0.5 flex-wrap">`,
`                                           <span className="text-cyan-600 dark:text-cyan-400">{(compComparisonStats.pickerCount || 0).toLocaleString('id-ID')} Picker</span>`,
`                                           <span>•</span>`,
`                                           <span className="text-amber-600 dark:text-amber-400">{(compComparisonStats.ojolCount || 0).toLocaleString('id-ID')} Ojol</span>`,
`                                           {(compComparisonStats.pendingLt3PickerCount || 0) > 0 && (`,
`                                              <>`,
`                                                 <span>•</span>`,
`                                                 <span className="text-orange-600 dark:text-orange-400">{(compComparisonStats.pendingLt3PickerCount || 0).toLocaleString('id-ID')} Pending LT3</span>`,
`                                              </>`,
`                                           )}`,
`                                           {(compComparisonStats.cancelPickerCount || 0) > 0 && (`,
`                                              <>`,
`                                                 <span>•</span>`,
`                                                 <span className="text-rose-600 dark:text-rose-400">{(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')} Cancel</span>`,
`                                              </>`,
`                                           )}`,
`                                           <span>•</span>`,
`                                           <span>{compComparisonStats.uniqueStaff} Staff</span>`,
`                                        </div>`
      ];
      lines.splice(startIdx, endIdx - startIdx + 1, ...newCard1Lines);
      console.log('1. Replaced Card 1 Substats successfully at lines', startIdx, '-', endIdx);
   } else {
      console.error('Could not find Card 1 bounds:', startIdx, endIdx);
   }
}

// 2. Patch Picker Header & Pills (around line 15940+)
const pickerHeaderIdx = lines.findIndex((l, i) => i > 15000 && l.includes('Data Picker & Ojol') && l.includes('<h3'));
if (pickerHeaderIdx !== -1) {
   let startIdx = -1;
   let endIdx = -1;
   for (let i = pickerHeaderIdx; i < pickerHeaderIdx + 60; i++) {
      if (lines[i].includes('Match: {(compComparisonStats.matchCount')) {
         startIdx = i - 1; // start from `<div className="text-[11px]...`
      }
      if (startIdx !== -1 && lines[i].includes('Belum Logistik') && lines[i].includes('pickerLogistikMatchFilter === \'UNMATCH\'')) {
         // find the closing </div> of the filter button group
         for (let j = i; j < i + 10; j++) {
            if (lines[j].includes('</div>') && lines[j+1] && lines[j+1].includes('</div>') && lines[j+2] && lines[j+2].includes('</div>')) {
               endIdx = j + 2;
               break;
            }
         }
         break;
      }
   }
   if (startIdx !== -1 && endIdx !== -1) {
      const newHeaderLines = [
`                                               <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">`,
`                                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Match: {(compComparisonStats.matchCount || 0).toLocaleString('id-ID')}</span>`,
`                                                  <span>•</span>`,
`                                                  <span className="text-orange-600 dark:text-orange-400 font-semibold">Pending LT3: {(compComparisonStats.pendingLt3PickerCount || 0).toLocaleString('id-ID')}</span>`,
`                                                  <span>•</span>`,
`                                                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Cancel: {(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')}</span>`,
`                                                  <span>•</span>`,
`                                                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Belum Logistik: {(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')}</span>`,
`                                               </div>`,
`                                            </div>`,
`                                         </div>`,
``,
`                                         {/* Filter Status Match (Pills dengan 5 Level Status: Semua, Match, Pending LT3, Cancel, Belum Logistik) & Copy Button */}`,
`                                         <div className="flex items-center gap-2 flex-wrap">`,
`                                            {isDevModeNew && (`,
`                                               <button`,
`                                                  onClick={async () => {`,
`                                                     const textToCopy = filteredPickerComparisonList.map(item => item.barcode).join('\\n');`,
`                                                     const ok = await copyToClipboard(textToCopy);`,
`                                                     if (ok) setSuccessToast(\`⚡ DevMode: \${filteredPickerComparisonList.length} Barcode Picker/Ojol disalin!\`);`,
`                                                  }}`,
`                                                  className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"`,
`                                                  title="Salin Kolom Barcode / Resi Picker & Ojol"`,
`                                               >`,
`                                                  <Copy size={12} />`,
`                                                  <span>Salin Barcode Picker & Ojol ({filteredPickerComparisonList.length})</span>`,
`                                               </button>`,
`                                            )}`,
`                                            <div className="flex items-center bg-white dark:bg-gray-850 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs flex-wrap gap-1">`,
`                                               <button`,
`                                                  onClick={() => { setPickerLogistikMatchFilter('ALL'); setPickerLogistikPage(1); }}`,
`                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${`,
`                                                     pickerLogistikMatchFilter === 'ALL'`,
`                                                        ? 'bg-cyan-600 text-white shadow-xs'`,
`                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'`,
`                                                  }\`}`,
`                                               >`,
`                                                  Semua ({(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')})`,
`                                               </button>`,
`                                               <button`,
`                                                  onClick={() => { setPickerLogistikMatchFilter('MATCH'); setPickerLogistikPage(1); }}`,
`                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${`,
`                                                     pickerLogistikMatchFilter === 'MATCH'`,
`                                                        ? 'bg-emerald-600 text-white shadow-xs'`,
`                                                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'`,
`                                                  }\`}`,
`                                               >`,
`                                                  ✅ Match ({(compComparisonStats.matchCount || 0).toLocaleString('id-ID')})`,
`                                               </button>`,
`                                               <button`,
`                                                  onClick={() => { setPickerLogistikMatchFilter('PENDING_LT3'); setPickerLogistikPage(1); }}`,
`                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${`,
`                                                     pickerLogistikMatchFilter === 'PENDING_LT3'`,
`                                                        ? 'bg-orange-600 text-white shadow-xs'`,
`                                                        : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40'`,
`                                                  }\`}`,
`                                                  title="Resi tertahan di Pending Scans (LT3)"`,
`                                               >`,
`                                                  ⏳ Pending LT3 ({(compComparisonStats.pendingLt3PickerCount || 0).toLocaleString('id-ID')})`,
`                                               </button>`,
`                                               <button`,
`                                                  onClick={() => { setPickerLogistikMatchFilter('CANCEL'); setPickerLogistikPage(1); }}`,
`                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${`,
`                                                     pickerLogistikMatchFilter === 'CANCEL'`,
`                                                        ? 'bg-rose-600 text-white shadow-xs'`,
`                                                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'`,
`                                                  }\`}`,
`                                                  title="Resi berstatus Cancel"`,
`                                               >`,
`                                                  🚫 Cancel ({(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')})`,
`                                               </button>`,
`                                               <button`,
`                                                  onClick={() => { setPickerLogistikMatchFilter('UNMATCH'); setPickerLogistikPage(1); }}`,
`                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${`,
`                                                     pickerLogistikMatchFilter === 'UNMATCH'`,
`                                                        ? 'bg-rose-700 text-white shadow-xs'`,
`                                                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'`,
`                                                  }\`}`,
`                                                  title="Resi yang murni belum sampai ke Logistik (di luar pending & cancel)"`,
`                                               >`,
`                                                  ❌ Belum Logistik ({(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')})`,
`                                               </button>`,
`                                            </div>`,
`                                         </div>`
      ];
      lines.splice(startIdx, endIdx - startIdx + 1, ...newHeaderLines);
      console.log('2. Replaced Picker Header & Pills successfully at lines', startIdx, '-', endIdx);
   } else {
      console.error('Could not find Picker Header bounds:', startIdx, endIdx);
   }
}

// 3. Patch Picker Table Row (around line 16120+)
const pickerRowIdx = lines.findIndex((l, i) => i > 15000 && l.includes('paginatedPickerComparisonList.map((item, idx) => ('));
if (pickerRowIdx !== -1) {
   let startIdx = pickerRowIdx + 1; // the <tr ...
   let endIdx = -1;
   for (let i = startIdx; i < startIdx + 120; i++) {
      if (lines[i].includes('</tr>')) {
         endIdx = i;
         break;
      }
   }
   if (startIdx !== -1 && endIdx !== -1) {
      const newRowLines = [
`                                                     <tr`,
`                                                        key={item.id || idx}`,
`                                                        className={\`transition-colors \${`,
`                                                           item.is_cancelled`,
`                                                              ? 'bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100/70 border-l-4 border-l-rose-500'`,
`                                                              : item.is_matched_logistik`,
`                                                              ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'`,
`                                                              : item.is_pending_lt3`,
`                                                              ? 'bg-orange-50/40 dark:bg-orange-950/20 hover:bg-orange-50/70 border-l-4 border-l-orange-500'`,
`                                                              : 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/50'`,
`                                                        }\`}`,
`                                                     >`,
`                                                        <td className="px-3 py-2 text-center font-mono text-gray-400 font-bold">`,
`                                                           {(pickerLogistikPage - 1) * pickerLogistikRowsPerPage + idx + 1}`,
`                                                        </td>`,
`                                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 font-mono text-[11px]">`,
`                                                           {new Date(item.timestamp).toLocaleTimeString('id-ID')}`,
`                                                        </td>`,
`                                                        <td `,
`                                                            className={\`px-3 py-2 font-mono font-bold text-gray-900 dark:text-gray-100 \${isDevModeNew ? 'select-text cursor-text' : 'select-none cursor-default'}\`}`,
`                                                            onContextMenu={(e) => { if (!isDevModeNew) e.preventDefault(); }}`,
`                                                            onCopy={(e) => { if (!isDevModeNew) e.preventDefault(); }}`,
`                                                            onMouseDown={(e) => { if (!isDevModeNew && e.detail > 1) e.preventDefault(); }}`,
`                                                         >`,
`                                                            <div className="flex items-center gap-1.5 flex-wrap">`,
`                                                              <span `,
`                                                                 className={isDevModeNew ? "inline-block select-text" : "select-none pointer-events-none inline-block"} `,
`                                                                 style={isDevModeNew ? {} : { userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}`,
`                                                              >`,
`                                                                 {item.barcode}`,
`                                                              </span>`,
`                                                              {item.is_cancelled && (`,
`                                                                 <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">`,
`                                                                    CANCEL`,
`                                                                 </span>`,
`                                                              )}`,
`                                                              {item.is_pending_lt3 && !item.is_cancelled && (`,
`                                                                 <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-500 text-white shadow-xs">`,
`                                                                    PENDING LT3`,
`                                                                 </span>`,
`                                                              )}`,
`                                                              {isDevModeNew && (`,
`                                                                 <button`,
`                                                                    onClick={async () => {`,
`                                                                       const ok = await copyToClipboard(item.barcode);`,
`                                                                       if (ok) setSuccessToast(\`Barcode \${item.barcode} disalin!\`);`,
`                                                                    }}`,
`                                                                    className="p-1 rounded hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer"`,
`                                                                    title="Salin Barcode Ini"`,
`                                                                 >`,
`                                                                    <Copy size={11} />`,
`                                                                 </button>`,
`                                                              )}`,
`                                                            </div>`,
`                                                         </td>`,
`                                                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">`,
`                                                           <div className="flex items-center gap-1.5 flex-wrap">`,
`                                                              <span className={\`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider \${`,
`                                                                 item.role_category === 'OJOL'`,
`                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'`,
`                                                                    : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'`,
`                                                              }\`}>`,
`                                                                 {item.role_category === 'OJOL' ? '🛵 OJOL' : '📦 PICKER'}`,
`                                                              </span>`,
`                                                              <span className="font-semibold text-xs">{item.employee_name || '-'}</span>`,
`                                                              {item.is_cancelled && (`,
`                                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">`,
`                                                                    <AlertTriangle size={10} /> DATA CANCEL`,
`                                                                 </span>`,
`                                                              )}`,
`                                                              {item.is_pending_lt3 && !item.is_cancelled && (`,
`                                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-800">`,
`                                                                    <Clock size={10} /> PENDING LT3`,
`                                                                 </span>`,
`                                                              )}`,
`                                                           </div>`,
`                                                        </td>`,
`                                                        <td className="px-3 py-2 text-[11px] text-gray-500 font-mono">`,
`                                                           {item.leader_profile || '-'}`,
`                                                        </td>`,
`                                                        <td className="px-3 py-2 text-center">`,
`                                                           {item.is_cancelled ? (`,
`                                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">`,
`                                                                 <Ban size={11} className="text-rose-600 dark:text-rose-400" />`,
`                                                                 DATA CANCEL`,
`                                                              </span>`,
`                                                           ) : item.is_matched_logistik ? (`,
`                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">`,
`                                                                 ✅ MATCH`,
`                                                              </span>`,
`                                                           ) : item.is_pending_lt3 ? (`,
`                                                              <div className="flex flex-col items-center">`,
`                                                                 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-300 dark:border-orange-800 shadow-2xs">`,
`                                                                    <Clock size={11} className="text-orange-600 dark:text-orange-400" />`,
`                                                                    ⏳ PENDING LT3`,
`                                                                 </span>`,
`                                                                 {item.pending_lt3_staff && (`,
`                                                                    <span className="text-[10px] text-orange-700 dark:text-orange-400 mt-0.5 font-bold">`,
`                                                                       Oleh: {item.pending_lt3_staff}`,
`                                                                    </span>`,
`                                                                 )}`,
`                                                              </div>`,
`                                                           ) : (`,
`                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">`,
`                                                                 ❌ BELUM LOGISTIK`,
`                                                              </span>`,
`                                                           )}`,
`                                                        </td>`,
`                                                     </tr>`
      ];
      lines.splice(startIdx, endIdx - startIdx + 1, ...newRowLines);
      console.log('3. Replaced Picker Table Rows successfully at lines', startIdx, '-', endIdx);
   } else {
      console.error('Could not find Picker Row bounds:', startIdx, endIdx);
   }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Finished updating AdminDashboard.tsx successfully!');

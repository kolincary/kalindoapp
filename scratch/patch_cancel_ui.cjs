const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetBlock = `                                              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                                                 <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Match: {(compComparisonStats.matchCount || 0).toLocaleString('id-ID')}</span>
                                                 <span>•</span>
                                                 <span className="text-rose-600 dark:text-rose-400 font-semibold">Belum Logistik: {(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')}</span>
                                              </div>
                                           </div>
                                        </div>

                                        {/* Filter Status Match (Pills) & Copy Button */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                           {isDevModeNew && (
                                              <button
                                                 onClick={async () => {
                                                    const textToCopy = filteredPickerComparisonList.map(item => item.barcode).join('\\n');
                                                    const ok = await copyToClipboard(textToCopy);
                                                    if (ok) setSuccessToast(\`⚡ DevMode: \${filteredPickerComparisonList.length} Barcode Picker/Ojol disalin!\`);
                                                 }}
                                                 className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                                 title="Salin Kolom Barcode / Resi Picker & Ojol"
                                              >
                                                 <Copy size={12} />
                                                 <span>Salin Barcode Picker & Ojol ({filteredPickerComparisonList.length})</span>
                                              </button>
                                           )}
                                           <div className="flex items-center bg-white dark:bg-gray-850 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                                              <button
                                                 onClick={() => { setPickerLogistikMatchFilter('ALL'); setPickerLogistikPage(1); }}
                                                 className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                    pickerLogistikMatchFilter === 'ALL'
                                                       ? 'bg-cyan-600 text-white shadow-xs'
                                                       : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                 }\`}
                                              >
                                                 Semua ({(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')})
                                              </button>
                                              <button
                                                 onClick={() => { setPickerLogistikMatchFilter('MATCH'); setPickerLogistikPage(1); }}
                                                 className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                    pickerLogistikMatchFilter === 'MATCH'
                                                       ? 'bg-emerald-600 text-white shadow-xs'
                                                       : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                 }\`}
                                              >
                                                 ✅ Match ({(compComparisonStats.matchCount || 0).toLocaleString('id-ID')})
                                              </button>
                                              <button
                                                 onClick={() => { setPickerLogistikMatchFilter('UNMATCH'); setPickerLogistikPage(1); }}
                                                 className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                    pickerLogistikMatchFilter === 'UNMATCH'
                                                       ? 'bg-rose-600 text-white shadow-xs'
                                                       : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                 }\`}
                                              >
                                                 ❌ Belum Logistik ({(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')})
                                              </button>
                                           </div>
                                        </div>
                                     </div>`;

const replacementBlock = `                                              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
                                                 <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Match: {(compComparisonStats.matchCount || 0).toLocaleString('id-ID')}</span>
                                                 <span>•</span>
                                                 <span className="text-rose-600 dark:text-rose-400 font-semibold">Cancel: {(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')}</span>
                                                 <span>•</span>
                                                 <span className="text-gray-500 dark:text-gray-400 font-semibold">Belum Logistik: {(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')}</span>
                                              </div>
                                           </div>
                                        </div>

                                        {/* Filter Status Match (Pills) & Copy Button */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                           {isDevModeNew && (
                                              <button
                                                 onClick={async () => {
                                                    const textToCopy = filteredPickerComparisonList.map(item => item.barcode).join('\\n');
                                                    const ok = await copyToClipboard(textToCopy);
                                                    if (ok) setSuccessToast(\`⚡ DevMode: \${filteredPickerComparisonList.length} Barcode Picker/Ojol disalin!\`);
                                                 }}
                                                 className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                                 title="Salin Kolom Barcode / Resi Picker & Ojol"
                                              >
                                                 <Copy size={12} />
                                                 <span>Salin Barcode Picker & Ojol ({filteredPickerComparisonList.length})</span>
                                              </button>
                                           )}
                                           <div className="flex items-center bg-white dark:bg-gray-850 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs flex-wrap gap-1">
                                              <button
                                                 onClick={() => { setPickerLogistikMatchFilter('ALL'); setPickerLogistikPage(1); }}
                                                 className={\`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                    pickerLogistikMatchFilter === 'ALL'
                                                       ? 'bg-cyan-600 text-white shadow-xs'
                                                       : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                 }\`}
                                              >
                                                 Semua ({(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')})
                                              </button>
                                              <button
                                                 onClick={() => { setPickerLogistikMatchFilter('MATCH'); setPickerLogistikPage(1); }}
                                                 className={\`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                    pickerLogistikMatchFilter === 'MATCH'
                                                       ? 'bg-emerald-600 text-white shadow-xs'
                                                       : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                 }\`}
                                              >
                                                 ✅ Match ({(compComparisonStats.matchCount || 0).toLocaleString('id-ID')})
                                              </button>
                                              <button
                                                 onClick={() => { setPickerLogistikMatchFilter('CANCEL'); setPickerLogistikPage(1); }}
                                                 className={\`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                    pickerLogistikMatchFilter === 'CANCEL'
                                                       ? 'bg-rose-600 text-white shadow-xs'
                                                       : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                 }\`}
                                                 title="Data Picker & Ojol yang terdaftar di menu Data Cancel"
                                              >
                                                 🚫 Cancel ({(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')})
                                              </button>
                                              <button
                                                 onClick={() => { setPickerLogistikMatchFilter('UNMATCH'); setPickerLogistikPage(1); }}
                                                 className={\`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                    pickerLogistikMatchFilter === 'UNMATCH'
                                                       ? 'bg-gray-700 text-white shadow-xs'
                                                       : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                 }\`}
                                              >
                                                 ❌ Belum Logistik ({(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')})
                                              </button>
                                           </div>
                                        </div>
                                     </div>`;

const targetRowBlock = `                                                  paginatedPickerComparisonList.map((item, idx) => (
                                                     <tr
                                                        key={item.id || idx}
                                                        className={\`transition-colors \${
                                                           item.is_matched_logistik
                                                              ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                                                              : 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/50'
                                                        }\`}
                                                     >
                                                        <td className="px-3 py-2 text-center font-mono text-gray-400 font-bold">
                                                           {(pickerLogistikPage - 1) * pickerLogistikRowsPerPage + idx + 1}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                                                           {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                                                        </td>
                                                        <td 
                                                            className={\`px-3 py-2 font-mono font-bold text-gray-900 dark:text-gray-100 \${isDevModeNew ? 'select-text cursor-text' : 'select-none cursor-default'}\`}
                                                            onContextMenu={(e) => { if (!isDevModeNew) e.preventDefault(); }}
                                                            onCopy={(e) => { if (!isDevModeNew) e.preventDefault(); }}
                                                            onMouseDown={(e) => { if (!isDevModeNew && e.detail > 1) e.preventDefault(); }}
                                                         >
                                                            <div className="flex items-center gap-1.5">
                                                               <span 
                                                                  className={isDevModeNew ? "inline-block select-text" : "select-none pointer-events-none inline-block"} 
                                                                  style={isDevModeNew ? {} : { userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
                                                               >
                                                                  {item.barcode}
                                                               </span>
                                                               {isDevModeNew && (
                                                                  <button
                                                                     onClick={async () => {
                                                                        const ok = await copyToClipboard(item.barcode);
                                                                        if (ok) setSuccessToast(\`Barcode \${item.barcode} disalin!\`);
                                                                     }}
                                                                     className="p-1 rounded hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer"
                                                                     title="Salin Barcode Ini"
                                                                  >
                                                                     <Copy size={11} />
                                                                  </button>
                                                               )}
                                                            </div>
                                                         </td>
                                                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                                                           <div className="flex items-center gap-1.5 flex-wrap">
                                                              <span className={\`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider \${
                                                                 item.role_category === 'OJOL'
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                                    : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                                                              }\`}>
                                                                 {item.role_category === 'OJOL' ? '🛵 OJOL' : '📦 PICKER'}
                                                              </span>
                                                              <span className="font-semibold text-xs">{item.employee_name || '-'}</span>
                                                           </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-[11px] text-gray-500 font-mono">
                                                           {item.leader_profile || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                           {item.is_matched_logistik ? (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                                                 ✅ MATCH
                                                              </span>
                                                           ) : (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                                                                 ❌ BELUM LOGISTIK
                                                              </span>
                                                           )}
                                                        </td>
                                                     </tr>
                                                  ))`;

const replacementRowBlock = `                                                  paginatedPickerComparisonList.map((item, idx) => (
                                                     <tr
                                                        key={item.id || idx}
                                                        className={\`transition-colors \${
                                                           item.is_cancelled
                                                              ? 'bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100/70 border-l-4 border-l-rose-500'
                                                              : item.is_matched_logistik
                                                              ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                                                              : 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/50'
                                                        }\`}
                                                     >
                                                        <td className="px-3 py-2 text-center font-mono text-gray-400 font-bold">
                                                           {(pickerLogistikPage - 1) * pickerLogistikRowsPerPage + idx + 1}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                                                           {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                                                        </td>
                                                        <td 
                                                            className={\`px-3 py-2 font-mono font-bold text-gray-900 dark:text-gray-100 \${isDevModeNew ? 'select-text cursor-text' : 'select-none cursor-default'}\`}
                                                            onContextMenu={(e) => { if (!isDevModeNew) e.preventDefault(); }}
                                                            onCopy={(e) => { if (!isDevModeNew) e.preventDefault(); }}
                                                            onMouseDown={(e) => { if (!isDevModeNew && e.detail > 1) e.preventDefault(); }}
                                                         >
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                               <span 
                                                                  className={isDevModeNew ? "inline-block select-text" : "select-none pointer-events-none inline-block"} 
                                                                  style={isDevModeNew ? {} : { userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
                                                               >
                                                                  {item.barcode}
                                                               </span>
                                                               {item.is_cancelled && (
                                                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                                                                     CANCEL
                                                                  </span>
                                                               )}
                                                               {isDevModeNew && (
                                                                  <button
                                                                     onClick={async () => {
                                                                        const ok = await copyToClipboard(item.barcode);
                                                                        if (ok) setSuccessToast(\`Barcode \${item.barcode} disalin!\`);
                                                                     }}
                                                                     className="p-1 rounded hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer"
                                                                     title="Salin Barcode Ini"
                                                                  >
                                                                     <Copy size={11} />
                                                                  </button>
                                                               )}
                                                            </div>
                                                         </td>
                                                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                                                           <div className="flex items-center gap-1.5 flex-wrap">
                                                              <span className={\`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider \${
                                                                 item.role_category === 'OJOL'
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                                    : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                                                              }\`}>
                                                                 {item.role_category === 'OJOL' ? '🛵 OJOL' : '📦 PICKER'}
                                                              </span>
                                                              <span className="font-semibold text-xs">{item.employee_name || '-'}</span>
                                                              {item.is_cancelled && (
                                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                                                    ⚠️ DATA CANCEL
                                                                 </span>
                                                              )}
                                                           </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-[11px] text-gray-500 font-mono">
                                                           {item.leader_profile || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                           {item.is_cancelled ? (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                                                 🚫 DATA CANCEL
                                                              </span>
                                                           ) : item.is_matched_logistik ? (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                                                 ✅ MATCH
                                                              </span>
                                                           ) : (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                                                                 ❌ BELUM LOGISTIK
                                                              </span>
                                                           )}
                                                        </td>
                                                     </tr>
                                                  ))`;

if (!content.includes(targetBlock)) {
  console.error('targetBlock not found!');
  process.exit(1);
}
if (!content.includes(targetRowBlock)) {
  console.error('targetRowBlock not found!');
  process.exit(1);
}

content = content.replace(targetBlock, replacementBlock);
content = content.replace(targetRowBlock, replacementRowBlock);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched AdminDashboard.tsx!');

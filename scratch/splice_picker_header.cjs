const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const actualStart = 15949;
const endIdx = 16006;

console.log('Checking actualStart:', lines[actualStart]);
console.log('Checking endIdx:', lines[endIdx]);

if (lines[actualStart] && lines[actualStart].includes('text-[11px]') && lines[endIdx] && lines[endIdx].trim() === '</div>') {
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
  lines.splice(actualStart, endIdx - actualStart + 1, ...newHeaderLines);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully replaced Picker Header lines!');
} else {
  console.error('Validation failed at bounds!');
}

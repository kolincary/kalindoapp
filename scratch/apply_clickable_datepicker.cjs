const fs = require('fs');

const filePath = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update Header Date Picker
const oldHeaderDatePicker = `               {/* Filter Tanggal Control */}
               <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                  <Calendar size={15} className="text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">Filter Tanggal TikTok:</span>
                  <input
                     type="date"
                     value={filterInvoiceDate}
                     onChange={(e) => {
                        const newDate = e.target.value;
                        setFilterInvoiceDate(newDate);
                        if (rawImportedTiktokRows.length > 0) {
                           applyTiktokDateFilter(newDate, rawImportedTiktokRows);
                        }
                     }}
                     className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {filterInvoiceDate ? (
                     <button
                        onClick={() => {
                           setFilterInvoiceDate('');
                           if (rawImportedTiktokRows.length > 0) {
                              applyTiktokDateFilter('', rawImportedTiktokRows);
                           }
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded transition-colors"
                        title="Tampilkan Semua Tanggal"
                     >
                        ✕ Semua
                     </button>
                  ) : (
                     <button
                        onClick={() => {
                           const today = getTodayString();
                           setFilterInvoiceDate(today);
                           if (rawImportedTiktokRows.length > 0) {
                              applyTiktokDateFilter(today, rawImportedTiktokRows);
                           }
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded transition-colors"
                     >
                        Hari Ini
                     </button>
                  )}
               </div>`;

const newHeaderDatePicker = `               {/* Filter Tanggal Control (Click anywhere to open calendar) */}
               <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                  <div
                     className="relative flex items-center gap-2 cursor-pointer select-none"
                     onClick={(e) => {
                        const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                        if (input && typeof input.showPicker === 'function') {
                           try { input.showPicker(); } catch (err) {}
                        }
                     }}
                  >
                     <Calendar size={15} className="text-indigo-500 shrink-0 pointer-events-none" />
                     <span className="text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">Filter Tanggal TikTok:</span>
                     <div className="relative">
                        <input
                           type="date"
                           value={filterInvoiceDate}
                           onClick={(e) => { try { if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker(); } catch (error) { } }}
                           onChange={(e) => {
                              const newDate = e.target.value;
                              setFilterInvoiceDate(newDate);
                              if (rawImportedTiktokRows.length > 0) {
                                 applyTiktokDateFilter(newDate, rawImportedTiktokRows);
                              }
                           }}
                           className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer relative z-10"
                           style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                        />
                        <style>{\`input[type="date"]::-webkit-calendar-picker-indicator { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }\`}</style>
                     </div>
                  </div>
                  {filterInvoiceDate ? (
                     <button
                        onClick={() => {
                           setFilterInvoiceDate('');
                           if (rawImportedTiktokRows.length > 0) {
                              applyTiktokDateFilter('', rawImportedTiktokRows);
                           }
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded transition-colors"
                        title="Tampilkan Semua Tanggal"
                     >
                        ✕ Semua
                     </button>
                  ) : (
                     <button
                        onClick={() => {
                           const today = getTodayString();
                           setFilterInvoiceDate(today);
                           if (rawImportedTiktokRows.length > 0) {
                              applyTiktokDateFilter(today, rawImportedTiktokRows);
                           }
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded transition-colors"
                     >
                        Hari Ini
                     </button>
                  )}
               </div>`;

if (!content.includes(oldHeaderDatePicker)) {
   console.error("ERROR: oldHeaderDatePicker not found");
   process.exit(1);
}
content = content.replace(oldHeaderDatePicker, newHeaderDatePicker);
console.log("✓ Header date picker updated to click anywhere");

// 2. Update Modal Date Picker
const oldModalDatePicker = `                     {/* Date Filter Preview inside Modal */}
                     <div className="mb-4 p-3 bg-indigo-50/70 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                           <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                           <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Filter Tanggal:</span>
                        </div>
                        <input
                           type="date"
                           value={filterInvoiceDate}
                           onChange={(e) => setFilterInvoiceDate(e.target.value)}
                           className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>`;

const newModalDatePicker = `                     {/* Date Filter Preview inside Modal (Click anywhere to open calendar) */}
                     <div
                        className="mb-4 p-3 bg-indigo-50/70 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between gap-2 cursor-pointer select-none"
                        onClick={(e) => {
                           const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                           if (input && typeof input.showPicker === 'function') {
                              try { input.showPicker(); } catch (err) {}
                           }
                        }}
                     >
                        <div className="flex items-center gap-2 pointer-events-none">
                           <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                           <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Filter Tanggal:</span>
                        </div>
                        <div className="relative">
                           <input
                              type="date"
                              value={filterInvoiceDate}
                              onClick={(e) => { try { if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker(); } catch (error) { } }}
                              onChange={(e) => setFilterInvoiceDate(e.target.value)}
                              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer relative z-10"
                              style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                           />
                           <style>{\`input[type="date"]::-webkit-calendar-picker-indicator { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }\`}</style>
                        </div>
                     </div>`;

if (!content.includes(oldModalDatePicker)) {
   console.error("ERROR: oldModalDatePicker not found");
   process.exit(1);
}
content = content.replace(oldModalDatePicker, newModalDatePicker);
console.log("✓ Modal date picker updated to click anywhere");

fs.writeFileSync(filePath, content, 'utf8');
console.log("SUCCESS: components/AdminDashboard.tsx patched successfully!");

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

console.log("Starting comprehensive date picker optimization...");

// 1. Fix Komparasi Picker vs Logistik Date Picker
const oldKomparasiRegex = /<div className="relative h-10 w-48 sm:w-56">\s*<div\s*className="relative w-full h-full cursor-pointer group"\s*onClick=\{\(\) => \{\s*const input = document\.getElementById\('logistik-dual-comp-date-filter'\) as HTMLInputElement;\s*if \(input\) \{\s*try \{ if \(typeof input\.showPicker === 'function'\) input\.showPicker\(\); else input\.click\(\); \} catch \(e\) \{ input\.click\(\); \}\s*\}\s*\}\}\s*>\s*<div className="absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 flex items-center justify-between transition-all group-hover:border-cyan-500 shadow-2xs">\s*<div className="flex items-center gap-2 overflow-hidden">\s*<div className="w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">\s*<CalendarIcon size=\{13\} \/>\s*<\/div>\s*<div className="flex flex-col text-left">\s*<span className="text-\[9px\] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none">Tanggal Data<\/span>\s*<span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mt-0\.5">\s*\{filterDate \|\| 'Pilih Tanggal'\}\s*<\/span>\s*<\/div>\s*<\/div>\s*<ChevronDown size=\{14\} className="text-gray-400 group-hover:text-cyan-500 shrink-0 transition-colors" \/>\s*<\/div>\s*<input\s*id="logistik-dual-comp-date-filter"\s*type="date"\s*value=\{filterDate\}\s*onChange=\{\(e\) => \{\s*setFilterDate\(e\.target\.value\);\s*resetDualComparisonFilters\(\);\s*\}\}\s*className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"\s*\/>\s*<\/div>\s*<\/div>/;

const newKomparasi = `<div className="relative h-10 w-48 sm:w-56">
                                       <div className="relative w-full h-full group">
                                          <div className="absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 flex items-center justify-between transition-all group-hover:border-cyan-500 shadow-2xs pointer-events-none">
                                             <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                                   <CalendarIcon size={13} />
                                                </div>
                                                <div className="flex flex-col text-left">
                                                   <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none">Tanggal Data</span>
                                                   <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5">
                                                      {filterDate || 'Pilih Tanggal'}
                                                   </span>
                                                </div>
                                             </div>
                                             <ChevronDown size={14} className="text-gray-400 group-hover:text-cyan-500 shrink-0 transition-colors" />
                                          </div>
                                          <input
                                             id="logistik-dual-comp-date-filter"
                                             type="date"
                                             value={filterDate}
                                             onChange={(e) => {
                                                setFilterDate(e.target.value);
                                                resetDualComparisonFilters();
                                             }}
                                             onClick={(e) => {
                                                try {
                                                   if (typeof (e.currentTarget as any).showPicker === 'function') {
                                                      (e.currentTarget as any).showPicker();
                                                   }
                                                } catch (err) {}
                                             }}
                                             className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                          />
                                       </div>
                                    </div>`;

if (oldKomparasiRegex.test(norm)) {
   norm = norm.replace(oldKomparasiRegex, newKomparasi);
   console.log("✅ 1. Komparasi Date Picker fixed!");
} else {
   console.log("⚠️ 1. Komparasi Date Picker regex didn't match directly, trying line-based replacement...");
   const lines = norm.split('\n');
   let foundIdx = -1;
   for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('id="logistik-dual-comp-date-filter"')) {
         foundIdx = i;
         break;
      }
   }
   if (foundIdx !== -1) {
      // Find start div
      let startIdx = foundIdx;
      while (startIdx > 0 && !lines[startIdx].includes('<div className="relative h-10 w-48 sm:w-56">')) {
         startIdx--;
      }
      let endIdx = foundIdx;
      while (endIdx < lines.length && !lines[endIdx].includes('</div>') && !lines[endIdx+1]?.includes('</div>')) {
         endIdx++;
      }
      endIdx += 2; // cover closing div tags
      lines.splice(startIdx, endIdx - startIdx + 1, newKomparasi);
      norm = lines.join('\n');
      console.log(`✅ 1. Komparasi Date Picker replaced via line indices [${startIdx}-${endIdx}]!`);
   }
}

// 2. Fix Leader/Checker Date Filter around line 22374
const oldLeaderChecker = norm.indexOf("onClick={(e) => {\n                        const input = e.currentTarget.querySelector('input[type=\"date\"]') as HTMLInputElement;\n                        if (input && typeof input.showPicker === 'function') {\n                           try { input.showPicker(); } catch (err) {}\n                        }\n                     }}");

if (oldLeaderChecker !== -1) {
   // Replace with simple container without double showPicker
   norm = norm.replace(
      "onClick={(e) => {\n                        const input = e.currentTarget.querySelector('input[type=\"date\"]') as HTMLInputElement;\n                        if (input && typeof input.showPicker === 'function') {\n                           try { input.showPicker(); } catch (err) {}\n                        }\n                     }}",
      "/* clean click delegation */"
   );
   console.log("✅ 2. Leader/Checker outer onClick removed.");
}

// 3. Fix Cancel Orders Date Filter around line 22750
const oldCancelDate = norm.indexOf("onClick={(e) => {\n                                             const input = e.currentTarget.querySelector('input[type=\"date\"]') as HTMLInputElement;\n                                             if (input) {\n                                                try {\n                                                   input.showPicker();\n                                                } catch (err) {\n                                                   input.focus();\n                                                }\n                                             }\n                                          }}");

if (oldCancelDate !== -1) {
   norm = norm.replace(
      "onClick={(e) => {\n                                             const input = e.currentTarget.querySelector('input[type=\"date\"]') as HTMLInputElement;\n                                             if (input) {\n                                                try {\n                                                   input.showPicker();\n                                                } catch (err) {\n                                                   input.focus();\n                                                }\n                                             }\n                                          }}",
      "/* clean click delegation */"
   );
   console.log("✅ 3. Cancel Orders date filter outer onClick removed.");
}

// 4. Fix Invoice Modal Date Picker around line 26303
const oldInvoiceDate = norm.indexOf("onClick={(e) => {\n                           const input = e.currentTarget.querySelector('input[type=\"date\"]') as HTMLInputElement;\n                           if (input && typeof input.showPicker === 'function') {\n                              try { input.showPicker(); } catch (err) {}\n                           }\n                        }}");

if (oldInvoiceDate !== -1) {
   norm = norm.replace(
      "onClick={(e) => {\n                           const input = e.currentTarget.querySelector('input[type=\"date\"]') as HTMLInputElement;\n                           if (input && typeof input.showPicker === 'function') {\n                              try { input.showPicker(); } catch (err) {}\n                           }\n                        }}",
      "/* clean click delegation */"
   );
   console.log("✅ 4. Invoice modal outer onClick removed.");
}

// 5. Clean up redundant contextmenu / mousedown showPicker spam in import modals
norm = norm.replace(/onContextMenu=\{\(e\) => \{\s*e\.preventDefault\(\);\s*e\.currentTarget\.showPicker\(\);\s*\}\}/g, '');
norm = norm.replace(/onMouseDown=\{\(e\) => \{\s*if \(e\.button === 1\) \{\s*e\.preventDefault\(\);\s*e\.currentTarget\.showPicker\(\);\s*\}\s*\}\}/g, '');

const finalCode = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(targetFile, finalCode, 'utf8');
console.log("🎉 All date pickers updated and saved successfully!");

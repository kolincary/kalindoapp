const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

// 1. Remove outer onClick from Cek Invoice table header date filter (around line 22374)
const targetCekInvoice = `                   <div
                      className="relative flex items-center gap-2 cursor-pointer select-none flex-1 sm:flex-initial"
                      onClick={(e) => {
                         const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                         if (input && typeof input.showPicker === 'function') {
                            try { input.showPicker(); } catch (err) {}
                         }
                      }}
                   >`;

const replCekInvoice = `                   <div
                      className="relative flex items-center gap-2 cursor-pointer select-none flex-1 sm:flex-initial"
                   >`;

if (norm.includes(targetCekInvoice)) {
   norm = norm.replace(targetCekInvoice, replCekInvoice);
   console.log("✅ Removed outer onClick from Cek Invoice header filter");
} else {
   console.log("Note: Cek invoice target already cleaned or different format");
}

// 2. Check and remove any remaining parent querySelector('input[type="date"]').showPicker()
const generalOuterPickerRegex = /onClick=\{\(e\)\s*=>\s*\{\s*const\s+input\s*=\s*e\.currentTarget\.querySelector\('input\[type="date"\]'\)[^;]*;\s*if\s*\(input[^)]*\)\s*\{\s*try\s*\{\s*input\.showPicker\(\);\s*\}\s*catch\s*\(err\)\s*\{\}\s*\}\s*\}\}/g;

if (generalOuterPickerRegex.test(norm)) {
   norm = norm.replace(generalOuterPickerRegex, '');
   console.log("✅ Cleaned remaining general outer picker handlers");
}

const finalCode = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(targetFile, finalCode, 'utf8');
console.log("Done cleaning pickers!");

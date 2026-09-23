const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
const lines = content.split(/\r?\n/);

console.log(`Total lines: ${lines.length}`);

// We want to find the pagination bar at line ~16300 (or containing Halaman ... dari ... Total ... data)
let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Halaman <strong') && lines[i].includes('{page}') && i > 15000) {
    targetIdx = i;
    break;
  }
}

if (targetIdx !== -1) {
  console.log(`Found target at line ${targetIdx + 1}: ${lines[targetIdx]}`);
  
  // Find the parent div and span
  // Let's replace the line containing `Total <strong ...>{totalRows.toLocaleString('id-ID')}</strong> data`
  for (let j = targetIdx - 2; j <= targetIdx + 4; j++) {
    if (lines[j] && lines[j].includes('Total <strong') && lines[j].includes('totalRows')) {
      console.log(`Replacing line ${j + 1}: ${lines[j]}`);
      
      const indent = lines[j].match(/^\s*/)[0];
      const newBlock = [
        `${indent}Total <strong className="font-bold text-gray-800 dark:text-gray-200">{totalRows.toLocaleString('id-ID')}</strong> data`,
        `${indent}{firestoreLoadingText && (`,
        `${indent}   <span className="ml-2 text-xs font-semibold text-amber-600 dark:text-amber-400 animate-pulse flex items-center gap-1">`,
        `${indent}      <Loader2 size={12} className="animate-spin" /> {firestoreLoadingText}`,
        `${indent}   </span>`,
        `${indent})}`,
        `${indent}{activeDataSource === 'FIRESTORE' ? (`,
        `${indent}   <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">`,
        `${indent}      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>`,
        `${indent}      Firestore`,
        `${indent}      <button`,
        `${indent}         type="button"`,
        `${indent}         onClick={() => {`,
        `${indent}            setForcedDataSource('SUPABASE');`,
        `${indent}            fetchPackingData(1, 'SUPABASE');`,
        `${indent}         }}`,
        `${indent}         className="ml-1 text-[10px] font-normal underline hover:text-emerald-950 dark:hover:text-white cursor-pointer"`,
        `${indent}         title="Klik untuk paksa beralih ke sumber Supabase"`,
        `${indent}      >`,
        `${indent}         (Ke Supabase)`,
        `${indent}      </button>`,
        `${indent}   </span>`,
        `${indent}) : (`,
        `${indent}   <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-2xs">`,
        `${indent}      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>`,
        `${indent}      Supabase`,
        `${indent}      <button`,
        `${indent}         type="button"`,
        `${indent}         onClick={() => {`,
        `${indent}            setForcedDataSource('FIRESTORE');`,
        `${indent}            fetchPackingData(1, 'FIRESTORE');`,
        `${indent}         }}`,
        `${indent}         className="ml-1 text-[10px] font-normal underline hover:text-blue-950 dark:hover:text-white cursor-pointer"`,
        `${indent}         title="Klik untuk paksa beralih ke sumber Firestore"`,
        `${indent}      >`,
        `${indent}         (Ke Firestore)`,
        `${indent}      </button>`,
        `${indent}   </span>`,
        `${indent})}`
      ].join(isCRLF ? '\r\n' : '\n');
      
      lines[j] = newBlock;
      break;
    }
  }

  const finalContent = lines.join(isCRLF ? '\r\n' : '\n');
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log("Successfully patched AdminDashboard.tsx pagination UI!");
} else {
  console.log("Target not found");
}

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

const lines = norm.split('\n');
let startIdx = -1;
let endIdx = -1;

for (let i = 10200; i < 10300; i++) {
   if (lines[i] && lines[i].includes('for (let i = 0; i < dateList.length; i++)') && lines[i+1]?.includes('const dStr = dateList[i];')) {
      startIdx = i;
      break;
   }
}

if (startIdx !== -1) {
   for (let j = startIdx; j < startIdx + 30; j++) {
      if (lines[j] && lines[j].includes('allDayDocs = allDayDocs.concat(singleDayDocs);') && lines[j+1]?.includes('}')) {
         endIdx = j + 1;
         break;
      }
   }
}

if (startIdx !== -1 && endIdx !== -1) {
   const replacementLines = [
      '                const uncachedDates = dateList.filter(dStr => !firestoreDayDataCache.has(dStr));',
      '                if (uncachedDates.length > 0) {',
      '                   setExportPackingProgress(15);',
      '                   await Promise.all(',
      '                      uncachedDates.map(async (dStr) => {',
      '                         const dStartMs = new Date(`${dStr}T00:00:00`).getTime();',
      '                         const dEndMs = new Date(`${dStr}T23:59:59.999`).getTime();',
      '                         const dQuery = fsQuery(',
      '                            collection(db, \'scanned_items\'),',
      '                            where(\'timestamp\', \'>=\', dStartMs),',
      '                            where(\'timestamp\', \'<=\', dEndMs)',
      '                         );',
      '                         const dSnap = await getDocs(dQuery);',
      '                         const singleDayDocs = dSnap.docs.map(docSnap => ({',
      '                            id: docSnap.id,',
      '                            ...(docSnap.data() as Record<string, any>)',
      '                         }));',
      '                         firestoreDayDataCache.set(dStr, singleDayDocs);',
      '                      })',
      '                   );',
      '                   setExportPackingProgress(40);',
      '                }',
      '',
      '                for (const dStr of dateList) {',
      '                   const dayDocs = firestoreDayDataCache.get(dStr) || [];',
      '                   allDayDocs = allDayDocs.concat(dayDocs);',
      '                }'
   ];

   lines.splice(startIdx, endIdx - startIdx + 1, ...replacementLines);
   norm = lines.join('\n');
   console.log(`✅ Parallelized export Firestore range fetch at lines [${startIdx}-${endIdx}]!`);
} else {
   console.log(`⚠️ Start or end index not found for export fetch block (start: ${startIdx}, end: ${endIdx})`);
}

const finalCode = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(targetFile, finalCode, 'utf8');

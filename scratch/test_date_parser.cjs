function extractDatePattern(str) {
   if (!str) return '';
   const s = String(str).trim();
   
   // Match DD/MM/YYYY or DD-MM-YYYY (e.g. 16/09/2026 23:59:13)
   const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
   if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
   }

   // Match YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-09-16 23:59:13)
   const ymdMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
   if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
   }

   return '';
}

function parseExcelDateTimeToDateStr(val, rawCell) {
   if (val === null || val === undefined || val === '') return '';
   
   // If formatted string is available in cell (rawCell.w)
   if (rawCell && rawCell.w) {
      const match = extractDatePattern(rawCell.w);
      if (match) return match;
   }

   // If string
   if (typeof val === 'string') {
      const match = extractDatePattern(val);
      if (match) return match;
   }

   // If JS Date
   if (val instanceof Date && !isNaN(val.getTime())) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
   }

   // If Excel serial date number
   if (typeof val === 'number' && val > 30000) {
      // Excel epoch starts 1899-12-30 (due to 1900 leap year bug)
      const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(jsDate.getTime())) {
         const y = jsDate.getUTCFullYear();
         const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
         const d = String(jsDate.getUTCDate()).padStart(2, '0');
         return `${y}-${m}-${d}`;
      }
   }

   return '';
}

const tests = [
   '16/09/2026 23:59:13',
   '16/09/2026 23:57:18',
   '16-09-2026 01:20:00',
   '2026-09-16 23:59:13',
   '2026/09/16 12:00:00',
   '1/9/2026 08:30:00',
   new Date(2026, 8, 16),
   46281.9994
];

tests.forEach(t => console.log(String(t), '->', parseExcelDateTimeToDateStr(t)));

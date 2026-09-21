const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

const normalizeBarcodeKey = (barcode) => {
   if (!barcode) return '';
   return barcode.toString().trim().toUpperCase()
      .replace(/[\s\-_]/g, '')
      .replace(/^00/, '');
};

const fetchAllRecordsForRoles = async (roles, startMs, endMs) => {
   let allData = [];
   let offset = 0;
   const batchSize = 1000;
   let hasMore = true;

   while (hasMore) {
      let pageData = null;
      let pageError = null;

      for (let attempt = 0; attempt < 3; attempt++) {
         const { data, error } = await supabase
            .from('scanned_items')
            .select('id, barcode, employee_name, timestamp, role, menu_context')
            .in('role', roles)
            .gte('timestamp', startMs)
            .lte('timestamp', endMs)
            .order('timestamp', { ascending: true })
            .order('id', { ascending: true })
            .range(offset, offset + batchSize - 1);

         pageData = data;
         pageError = error;
         if (!error && data) break;
         await new Promise(r => setTimeout(r, 300));
      }

      if (pageError || !pageData || pageData.length === 0) {
         hasMore = false;
         break;
      }
      allData.push(...pageData);
      if (pageData.length < batchSize) {
         hasMore = false;
      } else {
         offset += batchSize;
      }
   }
   return allData;
};

async function run() {
  const start = new Date('2026-09-21T00:00:00').getTime();
  const end = new Date('2026-09-21T23:59:59.999').getTime();

  const [pickerRaw, ojolRaw, logistikRaw] = await Promise.all([
     fetchAllRecordsForRoles(['PICKER', 'Picker', 'PICKER_2'], start, end),
     fetchAllRecordsForRoles(['OJOL', 'Ojol'], start, end),
     fetchAllRecordsForRoles(['LOGISTIK', 'Logistik'], start, end)
  ]);

  console.log(`Raw from DB: Picker = ${pickerRaw.length}, Ojol = ${ojolRaw.length}, Total = ${pickerRaw.length + ojolRaw.length}, Logistik = ${logistikRaw.length}`);

  const isExcludedOrderSn = (barcode) => {
     let b = (barcode || '').toString().trim();
     if (/^00(?:2[6-9]|3\d|40)/.test(b)) {
        b = b.slice(2);
     }
     return /^(?:2[6-9]|3\d|40)/.test(b);
  };

  const isRevanOrRachelStaff = (empName) => {
     const name = (empName || '').toString().trim().toUpperCase();
     return name === 'REVAN' || name === 'RACHEL' || name.startsWith('REVAN') || name.startsWith('RACHEL') || name.includes('REVAN') || name.includes('RACHEL');
  };

  const ojolExcluded = ojolRaw.filter(x => isExcludedOrderSn(x.barcode));
  console.log(`Ojol items filtered out by prefix (26..99): ${ojolExcluded.length}`);

  const revanRachelExcluded = pickerRaw.filter(x => isRevanOrRachelStaff(x.employee_name) && isExcludedOrderSn(x.barcode));
  console.log(`Picker REVAN/RACHEL items filtered out by prefix (26..99): ${revanRachelExcluded.length}`);

  const filteredPicker = pickerRaw.filter(x => !(isRevanOrRachelStaff(x.employee_name) && isExcludedOrderSn(x.barcode)));
  const filteredOjol = ojolRaw.filter(x => !isExcludedOrderSn(x.barcode));

  console.log(`After prefix filters: Picker = ${filteredPicker.length}, Ojol = ${filteredOjol.length}, Combined = ${filteredPicker.length + filteredOjol.length}`);

  // Cancelled orders
  const { data: cancelRows } = await supabase
     .from('cancelled_orders')
     .select('barcode, cancelled_at')
     .eq('is_active', true)
     .gte('cancelled_at', '2026-09-21T00:00:00')
     .lte('cancelled_at', '2026-09-21T23:59:59.999');

  const cancelledBarcodeSet = new Set();
  if (cancelRows && cancelRows.length > 0) {
     cancelRows.forEach((c) => {
        const raw = (c.barcode || '').trim().toUpperCase();
        const norm = normalizeBarcodeKey(raw);
        if (raw) {
           cancelledBarcodeSet.add(raw);
           if (raw.startsWith('0026')) cancelledBarcodeSet.add(raw.slice(2));
        }
        if (norm) cancelledBarcodeSet.add(norm);
     });
  }

  const combined = [...filteredPicker, ...filteredOjol];
  const cancelledFromCombined = combined.filter(item => {
     let rawBarcode = (item.barcode || '').toString().trim().toUpperCase();
     let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
     const norm = normalizeBarcodeKey(rawBarcode);
     return cancelledBarcodeSet.has(rawBarcode) ||
            cancelledBarcodeSet.has(stripped0026) ||
            (norm && cancelledBarcodeSet.has(norm));
  });
  console.log(`Cancelled orders filtered out from Picker/Ojol: ${cancelledFromCombined.length}`);

  const activePicker = combined.filter(item => {
     let rawBarcode = (item.barcode || '').toString().trim().toUpperCase();
     let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
     const norm = normalizeBarcodeKey(rawBarcode);
     return !(cancelledBarcodeSet.has(rawBarcode) ||
              cancelledBarcodeSet.has(stripped0026) ||
              (norm && cancelledBarcodeSet.has(norm)));
  });

  console.log(`FINAL activePicker count: ${activePicker.length}`);
}

run();

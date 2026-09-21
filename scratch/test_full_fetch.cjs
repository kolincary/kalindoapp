const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

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

  console.time('fetch_all');
  const [pickerRaw, ojolRaw, logistikRaw] = await Promise.all([
    fetchAllRecordsForRoles(['PICKER', 'Picker', 'PICKER_2'], start, end),
    fetchAllRecordsForRoles(['OJOL', 'Ojol'], start, end),
    fetchAllRecordsForRoles(['LOGISTIK', 'Logistik'], start, end),
  ]);
  console.timeEnd('fetch_all');

  console.log(`Picker fetched: ${pickerRaw.length}, Unique IDs: ${new Set(pickerRaw.map(x=>x.id)).size}`);
  console.log(`Ojol fetched: ${ojolRaw.length}, Unique IDs: ${new Set(ojolRaw.map(x=>x.id)).size}`);
  console.log(`Logistik fetched: ${logistikRaw.length}, Unique IDs: ${new Set(logistikRaw.map(x=>x.id)).size}`);

  const pFound004 = pickerRaw.find(x => x.barcode === '004662850240');
  const lFound004 = logistikRaw.find(x => x.barcode === '004662850240');
  console.log('Picker has 004662850240?', !!pFound004, pFound004?.employee_name);
  console.log('Logistik has 004662850240?', !!lFound004, lFound004?.employee_name);
}

run();

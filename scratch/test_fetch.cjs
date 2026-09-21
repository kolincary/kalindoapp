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
      console.log(`Fetched batch offset ${offset}: got ${pageData.length} records, total so far: ${allData.length}`);
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

  console.log('Fetching logistik...');
  const logistikRaw = await fetchAllRecordsForRoles(['LOGISTIK', 'Logistik'], start, end);
  console.log('Total logistik fetched:', logistikRaw.length);

  const foundTarget = logistikRaw.find(x => x.barcode === '004662850240' || (x.barcode && x.barcode.includes('4662850240')));
  console.log('Found 004662850240 in logistikRaw?', foundTarget);

  const foundSPX = logistikRaw.find(x => x.barcode === 'SPXID062417398049');
  console.log('Found SPXID062417398049 in logistikRaw?', foundSPX);
}

run();

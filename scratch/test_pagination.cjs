const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function run() {
  const start = new Date('2026-09-21T00:00:00').getTime();
  const end = new Date('2026-09-21T23:59:59.999').getTime();

  // Check unique IDs in allData
  const allData = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('scanned_items')
      .select('id, barcode')
      .in('role', ['LOGISTIK', 'Logistik'])
      .gte('timestamp', start)
      .lte('timestamp', end)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  const ids = allData.map(x => x.id);
  const uniqueIds = new Set(ids);
  console.log(`Total fetched: ${allData.length}, Unique IDs: ${uniqueIds.size}`);

  const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
  console.log(`Duplicate count due to unstable pagination: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log('Sample duplicates:', duplicates.slice(0, 5));
  }

  // Now check if ordering by `id` (or primary key) fixes it!
  const allDataWithIdOrder = [];
  offset = 0;
  while (true) {
    const { data } = await supabase
      .from('scanned_items')
      .select('id, barcode')
      .in('role', ['LOGISTIK', 'Logistik'])
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('id', { ascending: true })
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allDataWithIdOrder.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  const idsOrdered = allDataWithIdOrder.map(x => x.id);
  const uniqueIdsOrdered = new Set(idsOrdered);
  console.log(`WITH ORDER BY ID: Total fetched: ${allDataWithIdOrder.length}, Unique IDs: ${uniqueIdsOrdered.size}`);

  const foundTargetOrdered = allDataWithIdOrder.find(x => x.barcode === '004662850240');
  console.log('Found 004662850240 with order by id?', foundTargetOrdered);
  
  const foundSPXOrdered = allDataWithIdOrder.find(x => x.barcode === 'SPXID062417398049');
  console.log('Found SPXID062417398049 with order by id?', foundSPXOrdered);
}

run();

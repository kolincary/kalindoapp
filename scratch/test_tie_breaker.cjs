const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function run() {
  const start = new Date('2026-09-21T00:00:00').getTime();
  const end = new Date('2026-09-21T23:59:59.999').getTime();

  // Let's test why there are duplicate IDs or if created_at has ties.
  // In Supabase, if we sort by `created_at` or `timestamp`, when batch inserts happen, hundreds of rows have the exact same `created_at` and `timestamp`.
  // What is a truly unique tie-breaker?
  // Let's check `id` tie-breaker: `.order('timestamp', { ascending: true }).order('id', { ascending: true })`
  console.time('test_tie_breaker');
  const allData = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('scanned_items')
      .select('id, barcode, timestamp, employee_name, role, menu_context')
      .in('role', ['LOGISTIK', 'Logistik'])
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('timestamp', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + 999);
    if (error) {
      console.error('Error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.timeEnd('test_tie_breaker');
  console.log(`Total: ${allData.length}, Unique IDs: ${new Set(allData.map(x=>x.id)).size}`);

  const foundTarget = allData.find(x => x.barcode === '004662850240');
  console.log('Found 004662850240?', foundTarget);

  const foundSPX = allData.find(x => x.barcode === 'SPXID062417398049');
  console.log('Found SPXID062417398049?', foundSPX);
}

run();

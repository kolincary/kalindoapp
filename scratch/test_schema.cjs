const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function run() {
  const start = new Date('2026-09-21T00:00:00').getTime();
  const end = new Date('2026-09-21T23:59:59.999').getTime();

  // Test what ordering is fast and 100% deterministic!
  // What columns exist on scanned_items?
  const { data: sample } = await supabase.from('scanned_items').select('*').limit(1);
  console.log('Sample row columns:', Object.keys(sample[0]));

  // Test scan_date filter vs timestamp filter:
  // How does query by scan_date = '2026-09-21' perform?
  console.time('query_scan_date');
  const { data: dateData, error: dateError } = await supabase
    .from('scanned_items')
    .select('id, barcode, timestamp, employee_name, role, menu_context')
    .in('role', ['LOGISTIK', 'Logistik'])
    .eq('scan_date', '2026-09-21')
    .range(0, 999);
  console.timeEnd('query_scan_date');
  console.log('Date query result count:', dateData ? dateData.length : 0, 'error:', dateError);
}

run();

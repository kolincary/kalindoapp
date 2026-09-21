const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function run() {
  const start = new Date('2026-09-21T00:00:00').getTime();
  const end = new Date('2026-09-21T23:59:59.999').getTime();

  console.log('Testing Method 1: order by created_at ascending');
  console.time('method1');
  const method1Data = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('scanned_items')
      .select('id, barcode, timestamp, employee_name, role, menu_context')
      .in('role', ['LOGISTIK', 'Logistik'])
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('created_at', { ascending: true })
      .range(offset, offset + 999);
    if (error) {
      console.error('Method 1 error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    method1Data.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.timeEnd('method1');
  console.log(`Method 1: Total: ${method1Data.length}, Unique IDs: ${new Set(method1Data.map(x=>x.id)).size}`);
  console.log('Method 1 found 004662850240?', method1Data.find(x => x.barcode === '004662850240'));
  console.log('Method 1 found SPXID062417398049?', method1Data.find(x => x.barcode === 'SPXID062417398049'));

  console.log('\nTesting Method 2: order by timestamp asc, created_at asc');
  console.time('method2');
  const method2Data = [];
  offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('scanned_items')
      .select('id, barcode, timestamp, employee_name, role, menu_context')
      .in('role', ['LOGISTIK', 'Logistik'])
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('timestamp', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + 999);
    if (error) {
      console.error('Method 2 error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    method2Data.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.timeEnd('method2');
  console.log(`Method 2: Total: ${method2Data.length}, Unique IDs: ${new Set(method2Data.map(x=>x.id)).size}`);
  console.log('Method 2 found 004662850240?', method2Data.find(x => x.barcode === '004662850240'));
  console.log('Method 2 found SPXID062417398049?', method2Data.find(x => x.barcode === 'SPXID062417398049'));
}

run();

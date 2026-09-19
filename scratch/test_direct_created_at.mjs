import { createClient } from '@supabase/supabase-js';
const ACTIVE_URL = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(ACTIVE_URL, ACTIVE_KEY);

async function testCreatedAtDirect() {
  const startOfDay = '2026-09-18T17:00:00.000Z';
  const endOfDay = '2026-09-19T16:59:59.000Z';

  console.log('Testing batch_items by created_at directly...');
  const t0 = Date.now();
  const res = await supabase
    .from('batch_items')
    .select('id, barcode, batch_id, created_at, msku, qty, order_id')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .limit(5000);
  console.log(`batch_items direct created_at: ${res.data?.length} rows in ${Date.now() - t0}ms, error:`, res.error);

  console.log('\nTesting leader_scan_2 with date string or range...');
  const t1 = Date.now();
  const d = new Date();
  const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const res2 = await supabase
    .from('leader_scan_2')
    .select('barcode, assignees')
    .eq('date', dateStr)
    .limit(1000);
  console.log(`leader_scan_2 by date string (${dateStr}): ${res2.data?.length} rows in ${Date.now() - t1}ms, error:`, res2.error);
}

testCreatedAtDirect();

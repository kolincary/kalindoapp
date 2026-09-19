import { createClient } from '@supabase/supabase-js';
const ACTIVE_URL = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(ACTIVE_URL, ACTIVE_KEY);

async function testAll() {
  console.log('--- 1. Testing batch_items with batches!inner join ---');
  try {
    const t0 = Date.now();
    const startOfDay = '2026-09-18T17:00:00.000Z';
    const endOfDay = '2026-09-19T16:59:59.000Z';
    const res1 = await supabase
      .from('batch_items')
      .select('*, batches!inner(batch_no, excel_filename, created_at)', { count: 'exact' })
      .gte('batches.created_at', startOfDay)
      .lte('batches.created_at', endOfDay)
      .order('created_at', { ascending: false })
      .limit(5000);
    console.log(`batch_items inner join: count=${res1.count}, rows=${res1.data?.length}, took=${Date.now() - t0}ms, error:`, res1.error);
  } catch (e) {
    console.error('Inner join error:', e);
  }

  console.log('\n--- 2. Testing 2-step approach: batches first, then batch_items by batch_id.in ---');
  try {
    const t0 = Date.now();
    const startOfDay = '2026-09-18T17:00:00.000Z';
    const endOfDay = '2026-09-19T16:59:59.000Z';
    const bRes = await supabase
      .from('batches')
      .select('id, batch_no, excel_filename, created_at')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .limit(500);
    console.log(`batches query: rows=${bRes.data?.length}, took=${Date.now() - t0}ms, error:`, bRes.error);

    const bIds = bRes.data?.map(b => b.id) || [];
    if (bIds.length > 0) {
      const t1 = Date.now();
      const itemsRes = await supabase
        .from('batch_items')
        .select('*')
        .in('batch_id', bIds)
        .order('created_at', { ascending: false })
        .limit(5000);
      console.log(`batch_items by batch_id.in: rows=${itemsRes.data?.length}, took=${Date.now() - t1}ms, error:`, itemsRes.error);
    }
  } catch (e) {
    console.error('2-step error:', e);
  }

  console.log('\n--- 3. Testing leader_scan_2 timestamp query ---');
  try {
    const t0 = Date.now();
    const startTs = 1789578000000;
    const endTs = 1790009999000;
    const res3 = await supabase
      .from('leader_scan_2')
      .select('barcode, assignees')
      .gte('timestamp', startTs)
      .lte('timestamp', endTs)
      .limit(5000);
    console.log(`leader_scan_2 query: rows=${res3.data?.length}, took=${Date.now() - t0}ms, error:`, res3.error);
  } catch (e) {
    console.error('leader_scan_2 error:', e);
  }
}

testAll();

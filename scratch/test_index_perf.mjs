import { createClient } from '@supabase/supabase-js';
const ACTIVE_URL = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(ACTIVE_URL, ACTIVE_KEY);

async function testIndex() {
  const startOfDay = '2026-09-18T17:00:00.000Z';
  const endOfDay = '2026-09-19T16:59:59.000Z';

  // 1. Fetch batches
  const t0 = Date.now();
  const { data: batches, error: bErr } = await supabase
    .from('batches')
    .select('id, batch_no, excel_filename, created_at')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);
  console.log(`1. Batches query: ${batches?.length} rows in ${Date.now() - t0}ms, error:`, bErr);

  const bIds = batches?.map(b => b.id) || [];
  console.log('Batch IDs count:', bIds.length);

  if (bIds.length > 0) {
    // 2. Query batch_items without order
    const t1 = Date.now();
    const { data: itemsNoOrder, error: err1 } = await supabase
      .from('batch_items')
      .select('id, barcode, batch_id, created_at')
      .in('batch_id', bIds);
    console.log(`2. batch_items without order: ${itemsNoOrder?.length} rows in ${Date.now() - t1}ms, error:`, err1);

    // 3. Query batch_items with order by id (indexed primary key)
    const t2 = Date.now();
    const { data: itemsOrderPK, error: err2 } = await supabase
      .from('batch_items')
      .select('id, barcode, batch_id, created_at')
      .in('batch_id', bIds)
      .order('id', { ascending: false });
    console.log(`3. batch_items order by id: ${itemsOrderPK?.length} rows in ${Date.now() - t2}ms, error:`, err2);

    // 4. Query batch_items per batch_id in parallel or small chunks
    const t3 = Date.now();
    const promises = bIds.map(bId => 
      supabase.from('batch_items').select('id, barcode, batch_id, created_at').eq('batch_id', bId)
    );
    const results = await Promise.all(promises);
    const allItems = results.flatMap(r => r.data || []);
    console.log(`4. batch_items eq per batch_id: ${allItems.length} rows in ${Date.now() - t3}ms`);
  }

  // 5. Test leader_scan_2 timestamp vs date
  console.log('\nTesting leader_scan_2...');
  const t4 = Date.now();
  const { data: leaderRows, error: lErr } = await supabase
    .from('leader_scan_2')
    .select('barcode, assignees')
    .limit(1000);
  console.log(`5. leader_scan_2 limit 1000: ${leaderRows?.length} rows in ${Date.now() - t4}ms, error:`, lErr);
}

testIndex();

import { createClient } from '@supabase/supabase-js';
const ACTIVE_URL = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(ACTIVE_URL, ACTIVE_KEY);

async function testOptimalBatchFetch() {
  const startOfDay = '2026-09-18T17:00:00.000Z';
  const endOfDay = '2026-09-19T16:59:59.000Z';

  console.log('--- 1. Fetching Batches for Date ---');
  const t0 = Date.now();
  const { data: batches, error: bErr } = await supabase
    .from('batches')
    .select('id, batch_no, excel_filename, created_at')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .order('created_at', { ascending: false });
  console.log(`Batches: ${batches?.length} rows in ${Date.now() - t0}ms, error:`, bErr);

  if (!batches || batches.length === 0) {
    console.log('No batches found for today.');
    return;
  }

  const batchMap = new Map();
  batches.forEach(b => batchMap.set(b.id, b));

  console.log('\n--- 2. Fetching Batch Items per batch_id (batched in parallel) ---');
  const t1 = Date.now();
  // Query batch_items per batch_id in parallel
  const itemPromises = batches.map(b => 
    supabase
      .from('batch_items')
      .select('id, barcode, batch_id, created_at, msku, qty, order_id')
      .eq('batch_id', b.id)
      .limit(1000)
  );

  const itemResults = await Promise.all(itemPromises);
  const allItems = [];
  itemResults.forEach((res, idx) => {
    if (res.data) {
      const bHeader = batches[idx];
      res.data.forEach(item => {
        allItems.push({
          ...item,
          batches: {
            batch_no: bHeader.batch_no,
            excel_filename: bHeader.excel_filename,
            created_at: bHeader.created_at
          }
        });
      });
    }
  });

  console.log(`Successfully fetched ${allItems.length} batch items in ${Date.now() - t1}ms!`);

  console.log('\n--- 3. Testing leader_scan_2 with date format (D/M/YYYY & DD/MM/YYYY) ---');
  const t2 = Date.now();
  const filterDate = '2026-09-19';
  const [y, m, d] = filterDate.split('-');
  const dateFormatted1 = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`; // 19/9/2026
  const dateFormatted2 = `${d}/${m}/${y}`; // 19/09/2026
  
  // Also yesterday and day before
  const dPrev1 = new Date(new Date(filterDate).getTime() - 86400000);
  const dPrev1Str1 = `${dPrev1.getDate()}/${dPrev1.getMonth() + 1}/${dPrev1.getFullYear()}`;
  const dPrev1Str2 = `${String(dPrev1.getDate()).padStart(2, '0')}/${String(dPrev1.getMonth() + 1).padStart(2, '0')}/${dPrev1.getFullYear()}`;

  const datesToQuery = Array.from(new Set([dateFormatted1, dateFormatted2, dPrev1Str1, dPrev1Str2]));
  console.log('Querying leader_scan_2 with dates:', datesToQuery);

  const { data: leaderData, error: lErr } = await supabase
    .from('leader_scan_2')
    .select('barcode, assignees, date')
    .in('date', datesToQuery)
    .limit(5000);
  console.log(`leader_scan_2 with date IN: ${leaderData?.length} rows in ${Date.now() - t2}ms, error:`, lErr);
}

testOptimalBatchFetch();

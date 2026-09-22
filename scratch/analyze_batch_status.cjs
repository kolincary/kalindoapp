const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);

async function analyzeBatches() {
  const c = createClient(urlMatch[1], keyMatch[1]);
  
  // Get all batches created today (22/9/2026)
  const startToday = '2026-09-22T00:00:00.000Z';
  const { data: batches, error } = await c
    .from('batches')
    .select('id, batch_no, excel_filename, created_at')
    .gte('created_at', startToday)
    .order('created_at', { ascending: false });

  console.log(`Found ${batches?.length || 0} batches today in Supabase.`);

  const batchReport = [];
  for (const b of batches || []) {
    const { count, error: cErr } = await c
      .from('batch_items')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', b.id);

    // Also check how many are already in scanned_items
    batchReport.push({
      batch_no: b.batch_no,
      filename: b.excel_filename,
      items_in_batch_items: count || 0,
      created_at: b.created_at
    });
  }

  console.log('\n--- Batch Breakdown (Items in batch_items vs 0 items) ---');
  const zeroItems = batchReport.filter(b => b.items_in_batch_items === 0);
  const partialItems = batchReport.filter(b => b.items_in_batch_items > 0 && b.items_in_batch_items < 50);
  const fullItems = batchReport.filter(b => b.items_in_batch_items >= 50);

  console.log(`Batches with 0 items remaining in batch_items (Already auto-moved or failed): ${zeroItems.length}`);
  console.log(`Batches with partial items (1-49): ${partialItems.length}`);
  console.log(`Batches with 50+ items: ${fullItems.length}`);

  console.log('\nSample 0-items batches:');
  console.table(zeroItems.slice(0, 10));

  console.log('\nSample partial-items batches:');
  console.table(partialItems.slice(0, 10));

  console.log('\nSample 50-items batches:');
  console.table(fullItems.slice(0, 10));
}

analyzeBatches();

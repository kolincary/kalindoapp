const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);

async function inspectBatches() {
  const c = createClient(urlMatch[1], keyMatch[1]);
  
  console.log('--- 1. Recent Batches in Supabase ---');
  const { data: batches, error: bErr } = await c
    .from('batches')
    .select('id, batch_no, excel_filename, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('Recent Batches:', batches, bErr);

  if (batches && batches.length > 0) {
    const sampleBatchId = batches[0].id;
    console.log(`\n--- 2. Sample Items from batch ${sampleBatchId} (${batches[0].excel_filename}) ---`);
    const { data: items, error: iErr } = await c
      .from('batch_items')
      .select('*')
      .eq('batch_id', sampleBatchId)
      .limit(10);
    console.log('Sample batch_items:', items, iErr);
  }

  console.log('\n--- 3. Checking batches with duplicate excel_filename ---');
  const { data: allBatches } = await c
    .from('batches')
    .select('id, batch_no, excel_filename, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const filenameCounts = {};
  for (const b of allBatches || []) {
    const name = b.excel_filename?.trim();
    if (!name) continue;
    filenameCounts[name] = (filenameCounts[name] || 0) + 1;
  }

  const duplicates = Object.entries(filenameCounts).filter(([k, v]) => v > 1);
  console.log('Batches with duplicate filename in Supabase (Top 10):', duplicates.slice(0, 10));

  if (duplicates.length > 0) {
    const dupName = duplicates[0][0];
    console.log(`\n--- 4. Examining duplicate batch: "${dupName}" ---`);
    const matchingBatches = allBatches.filter(b => b.excel_filename?.trim() === dupName);
    console.log('Matching batch headers:', matchingBatches);
    for (const mb of matchingBatches) {
      const { data: bItems, count } = await c
        .from('batch_items')
        .select('barcode, order_id', { count: 'exact' })
        .eq('batch_id', mb.id)
        .limit(5);
      console.log(`Batch ${mb.id} (${mb.batch_no}, created: ${mb.created_at}): Total ${count} items in batch_items. Sample:`, bItems);
    }
  }
}

inspectBatches();

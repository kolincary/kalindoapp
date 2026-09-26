const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const { data: batches } = await supabase.from('batches').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('--- LATEST 5 BATCHES IN SUPABASE ---');
  for (const b of batches) {
    const { count, error } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).eq('batch_id', b.id);
    const { data: sample } = await supabase.from('batch_items').select('*').eq('batch_id', b.id).limit(2);
    console.log(`Batch: ${b.batch_no} | ${b.excel_filename} | created_at: ${b.created_at} | items count: ${count}`);
    if (sample && sample.length > 0) {
      console.log('   Sample item:', sample[0]);
    }
  }

  // Also check total count of batch_items across the whole table
  const { count: totalBatchItems } = await supabase.from('batch_items').select('*', { count: 'exact', head: true });
  console.log('\nTOTAL batch_items in table:', totalBatchItems);

  // Check scanned_items with %AUTO-BATCH%
  const { count: autoBatchScans } = await supabase.from('scanned_items').select('*', { count: 'exact', head: true }).ilike('description', '%AUTO-BATCH%');
  console.log('TOTAL scanned_items with AUTO-BATCH:', autoBatchScans);

  process.exit(0);
}
run();

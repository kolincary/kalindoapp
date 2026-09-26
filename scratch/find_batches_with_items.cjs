const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  // Find recent batches with batch_items > 0
  const { data: bList } = await supabase.from('batches').select('id, batch_no, excel_filename, created_at').order('created_at', { ascending: false }).limit(50);

  console.log(`Checking ${bList.length} most recent batches in Supabase:`);
  for (const b of bList) {
    const { count } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).eq('batch_id', b.id);
    if (count > 0) {
      console.log(`  ✅ Batch: ${b.batch_no} | ${b.excel_filename} | items: ${count} | created_at: ${b.created_at}`);
    }
  }

  process.exit(0);
}

run();

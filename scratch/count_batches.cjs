const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const { count: bCount } = await supabase.from('batches').select('*', { count: 'exact', head: true });
  console.log('Total batches in Supabase:', bCount);

  const { count: iCount } = await supabase.from('batch_items').select('*', { count: 'exact', head: true });
  console.log('Total batch_items in Supabase:', iCount);

  // Group batches by date
  const { data: bList } = await supabase.from('batches').select('batch_no, created_at, excel_filename').order('created_at', { ascending: false }).limit(20);
  console.log('Latest 20 batches in Supabase:');
  bList.forEach(b => console.log(`  ${b.batch_no} | ${b.excel_filename} | ${b.created_at}`));

  process.exit(0);
}

run();

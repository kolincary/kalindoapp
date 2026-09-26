const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const { count: sbCount } = await supabase.from('batches').select('*', { count: 'exact', head: true })
    .gte('created_at', '2026-09-26T00:00:00Z')
    .lte('created_at', '2026-09-26T23:59:59Z');
  console.log('Supabase batches on 2026-09-26 (UTC):', sbCount);

  const { count: sbCount2 } = await supabase.from('batches').select('*', { count: 'exact', head: true })
    .ilike('batch_no', 'BTCH-20260926%');
  console.log('Supabase batches with BTCH-20260926%:', sbCount2);

  process.exit(0);
}

run();

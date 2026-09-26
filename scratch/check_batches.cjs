const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

import('@supabase/supabase-js').then(async ({ createClient }) => {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const { data: batches } = await supabase.from('batches').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('--- RECENT BATCHES IN SUPABASE ---');
  if (batches && batches.length > 0) {
    for (const b of batches) {
      const { count } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).eq('batch_id', b.id);
      console.log('Batch ID:', b.id, 'Batch No:', b.batch_no, 'excel_filename:', b.excel_filename, 'created_at:', b.created_at, 'items count:', count);
    }
  } else {
    console.log('No batches found in Supabase.');
  }

  // Also check total batch_items
  const { count: totalItems } = await supabase.from('batch_items').select('*', { count: 'exact', head: true });
  console.log('Total batch_items in DB:', totalItems);

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

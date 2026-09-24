const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const sbUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const sbKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const sb = createClient(sbUrl, sbKey);

async function run() {
  const start = new Date('2026-09-16T00:00:00');
  const end = new Date('2026-09-16T23:59:59.999');
  console.log('Querying Supabase timestamp between:', start.getTime(), 'and', end.getTime());

  const res = await sb
    .from('scanned_items')
    .select('id, barcode, timestamp, employee_name, role', { count: 'exact' })
    .gte('timestamp', start.getTime())
    .lte('timestamp', end.getTime())
    .eq('role', 'PACKING')
    .range(0, 10);

  console.log('Count:', res.count, 'Error:', res.error);
  console.log('Data length:', res.data ? res.data.length : 0);
  if (res.data && res.data.length > 0) {
    console.log('First doc:', res.data[0]);
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

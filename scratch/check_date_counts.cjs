const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const sbUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const sbKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const sb = createClient(sbUrl, sbKey);

async function run() {
  // Let's check counts for:
  // 1. 2026-09-16 with scan_date
  const { count: c1 } = await sb.from('scanned_items').select('*', { count: 'exact', head: true }).eq('scan_date', '2026-09-16').in('role', ['PACKING', 'PACKING_2']);
  console.log('scan_date = 2026-09-16 (Packing):', c1);

  // 2. What date has ~12,363 records?
  const { data: dateCounts } = await sb.rpc('get_packing_date_counts').catch(() => ({ data: null }));
  
  // Or check distinct scan_date around September 2026
  const dates = [
    '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'
  ];
  for (const d of dates) {
    const { count } = await sb.from('scanned_items').select('*', { count: 'exact', head: true }).eq('scan_date', d).in('role', ['PACKING', 'PACKING_2']);
    console.log(`Supabase scan_date = ${d} (Packing):`, count);
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

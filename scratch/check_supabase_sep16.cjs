const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const sbUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const sbKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const sb = createClient(sbUrl, sbKey);

async function run() {
  const { data, error } = await sb
    .from('scanned_items')
    .select('*')
    .gte('created_at', '2026-09-16T00:00:00')
    .lte('created_at', '2026-09-16T23:59:59')
    .limit(5);

  console.log('Sample Supabase 16 Sep 2026 records:');
  console.log(data);

  // Check distinct roles on 16 Sep 2026
  const { data: roleData } = await sb
    .from('scanned_items')
    .select('role')
    .gte('created_at', '2026-09-16T00:00:00')
    .lte('created_at', '2026-09-16T23:59:59');

  const roleCount = {};
  if (roleData) {
    roleData.forEach(r => roleCount[r.role] = (roleCount[r.role] || 0) + 1);
  }
  console.log('Supabase roles on 16 Sep 2026:', roleCount);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

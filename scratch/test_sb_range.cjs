const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let sbUrl = '', sbKey = '';
env.split('\n').forEach(l => {
  if (l.startsWith('VITE_SUPABASE_URL=')) sbUrl = l.replace('VITE_SUPABASE_URL=', '').trim();
  if (l.startsWith('VITE_SUPABASE_ANON_KEY=')) sbKey = l.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
});

const supabase = createClient(sbUrl, sbKey);

async function testSupabaseRange() {
  const s = new Date('2026-09-01T00:00:00').getTime();
  const e = new Date('2026-09-07T23:59:59.999').getTime();
  
  console.time('supabase_count');
  const countRes = await supabase
    .from('scanned_items')
    .select('*', { count: 'exact', head: true })
    .in('role', ['LOGISTIK', 'Logistik', 'LOGISTIK_DATA'])
    .gte('timestamp', s)
    .lte('timestamp', e);
  console.timeEnd('supabase_count');
  console.log('Logistik count in Supabase for 7 days:', countRes.count);

  console.time('supabase_page1');
  const pageRes = await supabase
    .from('scanned_items')
    .select('id, barcode, employee_name, timestamp, role, status')
    .in('role', ['LOGISTIK', 'Logistik', 'LOGISTIK_DATA'])
    .gte('timestamp', s)
    .lte('timestamp', e)
    .order('timestamp', { ascending: false })
    .range(0, 99);
  console.timeEnd('supabase_page1');
  console.log('Page 1 items fetched:', pageRes.data?.length);
}

testSupabaseRange().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

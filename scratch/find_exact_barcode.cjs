const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);

async function findExact() {
  const c = createClient(urlMatch[1], keyMatch[1]);
  
  // Try exact match or eq on barcode
  console.log("1. eq query for 'TK HOME 3.49 NOPIYA 22.PDF':");
  const r1 = await c.from('leader_scan_2').select('*').eq('barcode', 'TK HOME 3.49 NOPIYA 22.PDF');
  console.log('Result 1:', r1.data, r1.error);

  console.log("2. eq query for 'TK HOME 3.49 NOPIYA 22':");
  const r2 = await c.from('leader_scan_2').select('*').eq('barcode', 'TK HOME 3.49 NOPIYA 22');
  console.log('Result 2:', r2.data, r2.error);

  console.log("3. ilike with timestamp / date:");
  const startTs = new Date('2026-09-22T00:00:00').getTime();
  const endTs = new Date('2026-09-22T23:59:59.999').getTime();
  const r3 = await c.from('leader_scan_2').select('*').gte('timestamp', startTs).lte('timestamp', endTs).ilike('barcode', '%NOPIYA%');
  console.log('Result 3 (Today NOPIYA):', r3.data, r3.error);

  console.log("4. All rows for today (22/9/2026) in leader_scan_2:");
  const r4 = await c.from('leader_scan_2').select('barcode, leader_name, assignees, timestamp, date').gte('timestamp', startTs).lte('timestamp', endTs).order('timestamp', { ascending: false });
  console.log('Total today rows in leader_scan_2:', r4.data?.length);
  const nopiyaRows = r4.data?.filter(x => x.barcode.includes('NOPIYA') || x.barcode.includes('TK HOME'));
  console.log('NOPIYA or TK HOME rows today:', nopiyaRows);
}

findExact();

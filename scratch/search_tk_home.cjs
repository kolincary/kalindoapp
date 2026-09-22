const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);
const newUrlMatch = supaFile.match(/FALLBACK_NEW_URL\s*=\s*'([^']+)'/);
const newKeyMatch = supaFile.match(/FALLBACK_NEW_KEY\s*=\s*'([^']+)'/);

async function inspect() {
  const c1 = createClient(urlMatch[1], keyMatch[1]);
  const c2 = (newUrlMatch && newKeyMatch) ? createClient(newUrlMatch[1], newKeyMatch[1]) : null;

  console.log('--- 1. Searching in Primary DB: leader_scan_2 ---');
  const r1 = await c1.from('leader_scan_2').select('*').ilike('barcode', '%TK HOME%');
  console.log('leader_scan_2 (Primary):', r1.data, r1.error);

  console.log('--- 2. Searching in Primary DB: scanned_items ---');
  const r2 = await c1.from('scanned_items').select('*').ilike('barcode', '%TK HOME%');
  console.log('scanned_items (Primary):', r2.data?.length, r2.data?.slice(0, 3), r2.error);

  console.log('--- 3. Searching in Primary DB: leader_pending_scans ---');
  const r3 = await c1.from('leader_pending_scans').select('*').ilike('barcode', '%TK HOME%');
  console.log('leader_pending_scans (Primary):', r3.data, r3.error);

  console.log('--- 4. Searching for NOPIYA in leader_scan_2 ---');
  const r4 = await c1.from('leader_scan_2').select('*').or('barcode.ilike.%NOPIYA%,leader_name.ilike.%NOPIYA%,leader_profile.ilike.%NOPIYA%');
  console.log('NOPIYA in leader_scan_2:', r4.data, r4.error);

  console.log('--- 5. Searching for NOPIYA in scanned_items ---');
  const r5 = await c1.from('scanned_items').select('*').or('barcode.ilike.%NOPIYA%,employee_name.ilike.%NOPIYA%').limit(5);
  console.log('NOPIYA in scanned_items:', r5.data, r5.error);

  if (c2) {
    console.log('--- 6. Searching in Archive DB: leader_scan_2 ---');
    const ra1 = await c2.from('leader_scan_2').select('*').ilike('barcode', '%TK HOME%');
    console.log('leader_scan_2 (Archive):', ra1.data, ra1.error);
  }

  console.log('--- 7. Recent 5 rows in leader_scan_2 ---');
  const recent = await c1.from('leader_scan_2').select('*').order('timestamp', { ascending: false }).limit(5);
  console.log('Recent leader_scan_2:', recent.data);
}

inspect();

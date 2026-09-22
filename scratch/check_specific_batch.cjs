const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);

async function checkSpecificBatch() {
  const c = createClient(urlMatch[1], keyMatch[1]);
  
  const filename = 'SP CAMPUR 89.50 ZAHRA 22';
  console.log(`Checking items for "${filename}" in scanned_items...`);
  const { data: scanned, error: sErr } = await c
    .from('scanned_items')
    .select('id, barcode, role, employee_name, timestamp, created_at, excel_filename')
    .eq('excel_filename', filename)
    .limit(10);
  console.log(`Found ${scanned?.length || 0} in scanned_items with excel_filename = "${filename}":`, scanned, sErr);

  // Check by barcode in leader_scan_2 or scanned_items
  const { data: leaderRow } = await c
    .from('leader_scan_2')
    .select('*')
    .ilike('barcode', `%SP CAMPUR 89.50 ZAHRA 22%`);
  console.log('\nIn leader_scan_2:', leaderRow);
}

checkSpecificBatch();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);
const newUrlMatch = supaFile.match(/DEFAULT_NEW_URL\s*=\s*'([^']+)'/);
const newKeyMatch = supaFile.match(/DEFAULT_NEW_KEY\s*=\s*'([^']+)'/);

async function verifyAll() {
  const cPrimary = createClient(urlMatch[1], keyMatch[1]);
  const cBackup = createClient(newUrlMatch[1], newKeyMatch[1]);

  const targetBarcodes = [
    'KILAT 2.50 ZAHRA 22.PDF',
    'TK CAMPUR 51.50 HELEN 22.PDF',
    'SP CAMPUR 66.50 ZAHRA 22.PDF'
  ];

  console.log('--- Verification of the 3 target barcodes ---');
  for (const b of targetBarcodes) {
    const { data: pData } = await cPrimary.from('leader_scan_2').select('*').eq('barcode', b);
    const { data: bData } = await cBackup.from('leader_scan_2').select('*').eq('barcode', b);
    console.log(`Barcode: "${b}"`);
    console.log(`  - Primary:`, pData?.[0]?.leader_name, pData?.[0]?.date, pData?.[0]?.assignees);
    console.log(`  - Backup: `, bData?.[0]?.leader_name, bData?.[0]?.date, bData?.[0]?.assignees);
  }

  const { count: countP } = await cPrimary.from('leader_scan_2').select('*', { count: 'exact', head: true });
  const { count: countB } = await cBackup.from('leader_scan_2').select('*', { count: 'exact', head: true });
  console.log(`\nExact Total Count Primary: ${countP}`);
  console.log(`Exact Total Count Backup:  ${countB}`);
}

verifyAll();

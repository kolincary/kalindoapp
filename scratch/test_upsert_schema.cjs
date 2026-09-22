const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);
const newUrlMatch = supaFile.match(/DEFAULT_NEW_URL\s*=\s*'([^']+)'/);
const newKeyMatch = supaFile.match(/DEFAULT_NEW_KEY\s*=\s*'([^']+)'/);

async function checkSchema() {
  const cPrimary = createClient(urlMatch[1], keyMatch[1]);
  const cBackup = createClient(newUrlMatch[1], newKeyMatch[1]);

  console.log('Testing upsert with payload without id:');
  const testBarcode = 'TEST_UPSERT_CHECK_123';
  const payload = {
    barcode: testBarcode,
    assignment_mode: 'INDIVIDU',
    assignees: ['TEST'],
    leader_name: 'TEST',
    status: 'ASSIGNED',
    timestamp: Date.now(),
    scan_type: 'PRETELAN',
    leader_profile: 'TEST',
    date: '22/9/2026'
  };

  const rP1 = await cPrimary.from('leader_scan_2').upsert([payload], { onConflict: 'barcode' });
  console.log('Primary upsert 1 (insert):', rP1.error);

  const payload2 = { ...payload, leader_name: 'TEST_UPDATED' };
  const rP2 = await cPrimary.from('leader_scan_2').upsert([payload2], { onConflict: 'barcode' });
  console.log('Primary upsert 2 (update with onConflict barcode):', rP2.error);

  // Clean up
  await cPrimary.from('leader_scan_2').delete().eq('barcode', testBarcode);

  const rB1 = await cBackup.from('leader_scan_2').upsert([payload], { onConflict: 'barcode' });
  console.log('Backup upsert 1 (insert):', rB1.error);

  const rB2 = await cBackup.from('leader_scan_2').upsert([payload2], { onConflict: 'barcode' });
  console.log('Backup upsert 2 (update with onConflict barcode):', rB2.error);

  // Clean up
  await cBackup.from('leader_scan_2').delete().eq('barcode', testBarcode);
}

checkSchema();

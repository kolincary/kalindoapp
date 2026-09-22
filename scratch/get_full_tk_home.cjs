const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);

async function checkRow() {
  const c = createClient(urlMatch[1], keyMatch[1]);
  const res = await c.from('leader_scan_2').select('*').eq('barcode', 'TK HOME 3.49 NOPIYA 22.PDF');
  console.log('Full Row Data:', JSON.stringify(res.data, null, 2));
}

checkRow();

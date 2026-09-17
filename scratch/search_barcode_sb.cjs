const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);

async function inspect() {
  const c = createClient(urlMatch[1], keyMatch[1]);
  const s1 = await c.from('scanned_items').select('*').ilike('barcode', '%10000023160022%');
  console.log('scanned_items match:', s1.data);

  const s2 = await c.from('leader_scan_2').select('*').ilike('barcode', '%10000023160022%');
  console.log('leader_scan_2 match:', s2.data);
}

inspect();

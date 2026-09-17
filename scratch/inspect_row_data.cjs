const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);

async function inspect() {
  const c = createClient(urlMatch[1], keyMatch[1]);
  const { data, error } = await c.from('leader_pending_scans').select('*').limit(10);
  console.log('leader_pending_scans in Supabase:', { error, data });
}

inspect();

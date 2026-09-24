const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const sbUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const sbKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const sb = createClient(sbUrl, sbKey);

async function run() {
  const { data } = await sb.from('scanned_items').select('*').eq('barcode', 'JY1776898781');
  console.log('JY1776898781 in Supabase:');
  console.log(JSON.stringify(data, null, 2));
}
run();

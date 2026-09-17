const fs = require('fs');
const content = fs.readFileSync('services/supabaseClient.ts', 'utf8');

const urlMatch = content.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = content.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);

const newUrlMatch = content.match(/FALLBACK_NEW_URL\s*=\s*'([^']+)'/);
const newKeyMatch = content.match(/FALLBACK_NEW_KEY\s*=\s*'([^']+)'/);

const { createClient } = require('@supabase/supabase-js');

async function test() {
  if (urlMatch && keyMatch) {
    console.log('Testing Primary URL:', urlMatch[1]);
    const c1 = createClient(urlMatch[1], keyMatch[1]);
    const res1 = await c1.from('leader_pending_scans').select('*', { count: 'exact' }).limit(5);
    console.log('Primary Table check:', res1.error ? res1.error : `OK - count: ${res1.count}`);
    if (res1.data) console.log('Primary Data:', res1.data);
  }

  if (newUrlMatch && newKeyMatch) {
    console.log('\nTesting New/Archive URL:', newUrlMatch[1]);
    const c2 = createClient(newUrlMatch[1], newKeyMatch[1]);
    const res2 = await c2.from('leader_pending_scans').select('*', { count: 'exact' }).limit(5);
    console.log('Archive Table check:', res2.error ? res2.error : `OK - count: ${res2.count}`);
    if (res2.data) console.log('Archive Data:', res2.data);
  }
}

test();

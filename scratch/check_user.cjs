const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

import('@supabase/supabase-js').then(async ({ createClient }) => {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('app_users').select('*').ilike('email', '%jgilbeth%');
  console.log('Result:', JSON.stringify(data, null, 2));
  if (error) console.error(error);
});

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
  const { data, error } = await supabase.from('app_users').select('email, allow_manual_input, is_blocked, pin');
  console.log('Total users in app_users:', data ? data.length : 0);
  const allowed = data ? data.filter(u => u.allow_manual_input === true) : [];
  console.log('Users with allow_manual_input === true:', allowed);
  const jgilbeth = data ? data.filter(u => u.email.toLowerCase().includes('jgilbeth') || u.email.toLowerCase().includes('developer')) : [];
  console.log('jgilbeth / developer users:', jgilbeth);
});

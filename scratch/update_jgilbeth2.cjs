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
  
  console.log('Updating jgilbeth2@gmail.com allow_manual_input to false...');
  const { data, error } = await supabase
    .from('app_users')
    .update({ allow_manual_input: false })
    .ilike('email', 'jgilbeth2@gmail.com')
    .select();

  if (error) {
    console.error('Update error:', error);
  } else {
    console.log('Updated user successfully:', data);
  }
});

const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const { data: fails } = await supabase.from('failed_scans')
    .select('*')
    .ilike('fail_message', '%tidak terdaftar%')
    .order('timestamp', { ascending: false })
    .limit(30);

  console.log(`Found ${fails?.length} 'tidak terdaftar' failed scans:`);
  fails?.forEach(f => {
    const dt = new Date(f.timestamp).toISOString();
    console.log(`${dt} | Role: ${f.role} | User: ${f.employee_name} | Barcode: ${f.barcode} | Msg: ${f.fail_message}`);
  });

  process.exit(0);
}

run();

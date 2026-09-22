const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function inspectDika() {
  const { data: dikaScans, error } = await supabase
    .from('scanned_items')
    .select('id, barcode, role, employee_name, description, timestamp, excel_filename, created_at')
    .eq('employee_name', 'DIKA')
    .order('timestamp', { ascending: true });

  if (error) console.error('Error fetching DIKA scans:', error);
  console.log('Total DIKA scans found:', dikaScans ? dikaScans.length : 0);

  // Group by timestamp / batch
  const grouped = {};
  (dikaScans || []).forEach(d => {
    const ts = d.timestamp;
    if (!grouped[ts]) grouped[ts] = [];
    grouped[ts].push(d);
  });

  for (const [ts, arr] of Object.entries(grouped)) {
    const dt = new Date(Number(ts) || ts);
    console.log(`\nTimestamp: ${ts} (${dt.toISOString()} / ${dt.toLocaleString()}) -> Count: ${arr.length}`);
    console.log('  Descriptions:', [...new Set(arr.map(a => a.description))]);
    console.log('  Filenames:', [...new Set(arr.map(a => a.excel_filename))]);
    console.log('  Sample barcodes:', arr.slice(0, 3).map(a => a.barcode));
  }

  process.exit(0);
}

inspectDika().catch(e => {
  console.error(e);
  process.exit(1);
});

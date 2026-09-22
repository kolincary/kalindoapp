const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function inspectNopiya22() {
  const { data: scans, error } = await supabase
    .from('scanned_items')
    .select('*')
    .ilike('excel_filename', '%SP CAMPUR 24.50 NOPIYA 22%')
    .order('timestamp', { ascending: true });

  if (error) console.error('Error:', error);
  console.log('Total items found with excel_filename like NOPIYA 22:', scans ? scans.length : 0);

  if (scans && scans.length > 0) {
    const byRoleStaff = {};
    scans.forEach(s => {
      const k = `${s.role} - ${s.employee_name} (${s.description})`;
      byRoleStaff[k] = (byRoleStaff[k] || 0) + 1;
    });
    console.log('By Role & Staff:', byRoleStaff);
    
    // Show DIKA scans specifically
    const dika = scans.filter(s => s.employee_name === 'DIKA');
    console.log('\nDIKA scans in this batch:', dika.length);
    console.log('DIKA timestamps:');
    const tsGroup = {};
    dika.forEach(d => {
      const dt = new Date(Number(d.timestamp) || d.timestamp);
      const k = `${d.timestamp} (${dt.toISOString()}) - desc: ${d.description}`;
      tsGroup[k] = (tsGroup[k] || 0) + 1;
    });
    console.log(tsGroup);

    // Look at the 3 camera scans of DIKA
    const cameraScans = dika.filter(d => d.description === 'Camera Scan');
    console.log('\nCamera scans by DIKA:', cameraScans.map(c => ({ barcode: c.barcode, ts: c.timestamp, date: new Date(Number(c.timestamp)).toISOString() })));
  }

  process.exit(0);
}

inspectNopiya22().catch(e => {
  console.error(e);
  process.exit(1);
});

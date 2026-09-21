const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function run() {
  const tables = ['scanned_items', 'batch_items', 'cancelled_orders', 'leader_scan_2'];
  for (const t of tables) {
    const { data, error } = await supabase
      .from(t)
      .select('*')
      .ilike('barcode', '%6912414671%');
    console.log(`Table ${t} for 6912414671:`, data);
  }
}

run();

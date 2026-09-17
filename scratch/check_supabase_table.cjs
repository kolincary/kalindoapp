const { createClient } = require('@supabase/supabase-js');

const supaUrl = 'https://iwvbrigjydmhbwbnbbbk.supabase.co';
const supaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dmJyaWdqeWRtaGJ3Ym5iYmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MDY1MTcsImV4cCI6MjA1NDA4MjUxN30.i9w170hZlT3dO3K4u-r3_H5Lgq5e7i_Xp1fH7g4lQkM';

const client = createClient(supaUrl, supaKey);

async function checkTable() {
  console.log('--- Testing query on leader_pending_scans ---');
  const { data, error, count } = await client.from('leader_pending_scans').select('*', { count: 'exact' }).limit(10);
  console.log('Error:', error);
  console.log('Count:', count);
  console.log('Sample Data:', data);
}

checkTable();

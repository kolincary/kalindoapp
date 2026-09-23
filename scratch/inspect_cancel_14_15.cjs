const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnqymhgnflqbltptotbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRucXltaGduZmxxYmx0cHRvdGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMDExNjEsImV4cCI6MjA1Njg3NzE2MX0.g6-J1UfQkM6_v8XhWb8Xj4U8-1i2p4vB8X8X8X8X8X8';

// Let's check environment or import from supabaseClient
const sb = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRucXltaGduZmxxYmx0cHRvdGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMDExNjEsImV4cCI6MjA1Njg3NzE2MX0.3Lw1q5V6l-3L6l-3L6l-3L6l-3L6l-3L6l-3L6l-3L6');

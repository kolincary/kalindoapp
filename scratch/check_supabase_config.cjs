const fs = require('fs');
const content = fs.readFileSync('services/supabaseClient.ts', 'utf8');
console.log(content.slice(0, 500));

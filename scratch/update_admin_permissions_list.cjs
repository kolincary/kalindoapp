const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Update labels in ADMIN_PERMISSIONS_LIST
content = content.replace(
   "{ id: 'view_packing', label: 'View Packing Data' },\n   { id: 'view_packing_2', label: 'View Packing 2 Data' },",
   "{ id: 'view_packing_2', label: 'View Data Packing' },\n   { id: 'view_packing', label: 'View Data Packing Copy' },"
);
content = content.replace(
   "{ id: 'view_packing', label: 'View Packing Data' },\r\n   { id: 'view_packing_2', label: 'View Packing 2 Data' },",
   "{ id: 'view_packing_2', label: 'View Data Packing' },\r\n   { id: 'view_packing', label: 'View Data Packing Copy' },"
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Updated ADMIN_PERMISSIONS_LIST labels successfully!');

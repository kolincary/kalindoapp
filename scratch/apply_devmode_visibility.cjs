const fs = require('fs');
const path = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace footer buttons with regex to ignore \r\n vs \n differences
const footerSupabaseRegex = /<button[\s\S]*?onClick=\{\(\) => \{\s*handleSwitchDatabase\('SUPABASE'\);[\s\S]*?\(Ke Supabase\)[\s\S]*?<\/button>/;
const footerFirestoreRegex = /<button[\s\S]*?onClick=\{\(\) => \{\s*handleSwitchDatabase\('FIRESTORE'\);[\s\S]*?\(Ke Firestore\)[\s\S]*?<\/button>/;

if (footerSupabaseRegex.test(content)) {
  content = content.replace(footerSupabaseRegex, (match) => `{isDevModeNew && (\n                                                       ${match}\n                                                    )}`);
  console.log('Successfully wrapped footer Supabase button with isDevModeNew');
} else {
  console.log('footerSupabaseRegex did not match');
}

if (footerFirestoreRegex.test(content)) {
  content = content.replace(footerFirestoreRegex, (match) => `{isDevModeNew && (\n                                                       ${match}\n                                                    )}`);
  console.log('Successfully wrapped footer Firestore button with isDevModeNew');
} else {
  console.log('footerFirestoreRegex did not match');
}

// Check search input for OJOL_DATA
const ojolPattern = /(if\s*\(\s*activeView\s*===\s*'OJOL_DATA'\s*\)\s*\{\s*setOjolSearch\(val\);[\r\n\s]*\}\s*else\s*\{[\r\n\s]*if\s*\(val\.toLowerCase\(\)\.includes\('devmodenew'\)\))/;
if (ojolPattern.test(content)) {
  console.log('OJOL devmodenew pattern already exists or needs update');
} else {
  // Let's replace the block where packingSearch is handled with devmodenew
  const searchPattern = /if\s*\(activeView\s*===\s*'OJOL_DATA'\)\s*\{\s*setOjolSearch\(val\);\s*\}\s*else\s*\{[\r\n\s]*if\s*\(val\.toLowerCase\(\)\.includes\('devmodenew'\)\)/;
  if (searchPattern.test(content)) {
    console.log('Search pattern matched');
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done 2.');

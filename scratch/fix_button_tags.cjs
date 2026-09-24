const fs = require('fs');
const path = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Clean up any misplaced isDevModeNew inside button tag
content = content.replace(
  /<button\s*\{isDevModeNew && \(\s*type="button"/g,
  '{isDevModeNew && (\n                                                       <button\n                                                          type="button"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed button opening tag!');

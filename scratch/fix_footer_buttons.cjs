const fs = require('fs');
const path = 'components/AdminDashboard.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

let idx1 = -1;
let idx2 = -1;
for (let i = 16840; i < 16910 && i < lines.length; i++) {
  if (lines[i].includes('onClick={() => {') && lines[i+1]?.includes("handleSwitchDatabase('SUPABASE')")) {
    idx1 = i - 1; // <button line
  }
  if (lines[i].includes('onClick={() => {') && lines[i+1]?.includes("handleSwitchDatabase('FIRESTORE')")) {
    idx2 = i - 1; // <button line
  }
}

console.log('idx1:', idx1, 'idx2:', idx2);
if (idx1 !== -1 && !lines[idx1-1].includes('isDevModeNew')) {
  lines.splice(idx1, 0, '                                                       {isDevModeNew && (');
  if (idx2 !== -1) idx2++;
}
if (idx2 !== -1 && !lines[idx2-1].includes('isDevModeNew')) {
  lines.splice(idx2, 0, '                                                       {isDevModeNew && (');
}

fs.writeFileSync(path, lines.join('\r\n'), 'utf8');
console.log('Fixed footer buttons!');

const fs = require('fs');
const path = 'components/AdminDashboard.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

let idx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('value={activeView === \'OJOL_DATA\' ? ojolSearch : packingSearch}')) {
    idx = i;
    break;
  }
}

console.log('Found line at:', idx);
if (idx !== -1) {
  // Let's inspect the next 25 lines
  let endIdx = -1;
  for (let j = idx; j < idx + 30; j++) {
    if (lines[j].includes('placeholder={`Search ${activeView === \'OJOL_DATA\'')) {
      endIdx = j;
      break;
    }
  }
  console.log('Found end line at:', endIdx);
  if (endIdx !== -1) {
    const replacement = [
      "                                          onChange={(val) => {",
      "                                             if (val.toLowerCase().includes('devmodenew')) {",
      "                                                const isCurrentlyOn = localStorage.getItem('isDevModeNew') === 'true' || showSecretMenu;",
      "                                                const newState = !isCurrentlyOn;",
      "                                                setShowSecretMenu(newState);",
      "                                                setShowFsSyncDevMode(newState);",
      "                                                setShowFakeReportMenu(newState);",
      "                                                localStorage.setItem('showSecretMenu', String(newState));",
      "                                                localStorage.setItem('isDevModeNew', String(newState));",
      "                                                localStorage.setItem('showFakeReportMenu', String(newState));",
      "                                                setSuccessToast(newState ? \"⚡ Dev Mode Secret Unlocked! (Database Switcher & Fitur Dev Aktif)\" : \"Dev Mode Deactivated\");",
      "                                                const cleaned = val.replace(/devmodenew/gi, '').trim();",
      "                                                if (activeView === 'OJOL_DATA') setOjolSearch(cleaned);",
      "                                                else setPackingSearch(cleaned);",
      "                                                return;",
      "                                             }",
      "                                             if (activeView === 'OJOL_DATA') {",
      "                                                setOjolSearch(val);",
      "                                             } else {",
      "                                                setPackingSearch(val);",
      "                                             }",
      "                                          }}"
    ];
    lines.splice(idx + 1, endIdx - idx - 1, ...replacement);
    fs.writeFileSync(path, lines.join('\r\n'), 'utf8');
    console.log('Successfully replaced lines!');
  }
}

const fs = require('fs');
const path = 'components/AdminDashboard.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

let idx = -1;
for (let i = 490; i < 520; i++) {
  if (lines[i].includes('onClick={() => onSelect(emp.id)}')) {
    idx = i;
    break;
  }
}

if (idx !== -1) {
  let tdStart = -1;
  let tdEnd = -1;
  for (let i = idx - 10; i < idx; i++) {
    if (lines[i].includes('{/* Checkbox */}')) {
      tdStart = i;
      break;
    }
  }
  for (let i = idx; i < idx + 20; i++) {
    if (lines[i].trim() === '</td>') {
      tdEnd = i;
      break;
    }
  }
  console.log('tdStart:', tdStart, 'tdEnd:', tdEnd);
  if (tdStart !== -1 && tdEnd !== -1) {
    const fixedBlock = [
      "         {/* Checkbox */}",
      "         <td className=\"p-3.5 pl-4 sm:pl-6 w-12 sticky left-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-slate-50 dark:group-hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700\">",
      "            <button",
      "               onClick={() => onSelect(emp.id)}",
      "               className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${",
      "                  isSelected",
      "                     ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/30'",
      "                     : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400'",
      "               }`}",
      "               title={isSelected ? \"Deselect\" : \"Select employee\"}",
      "            >",
      "               {isSelected && <Check size={13} strokeWidth={3} />}",
      "            </button>",
      "         </td>"
    ];
    lines.splice(tdStart, tdEnd - tdStart + 1, ...fixedBlock);
    fs.writeFileSync(path, lines.join('\r\n'), 'utf8');
    console.log('Successfully fixed EmployeeRow checkbox!');
  }
}

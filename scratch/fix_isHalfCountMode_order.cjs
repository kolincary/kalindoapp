const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Remove late declaration at line 3582
const lateDeclCRLF = '   const [isHalfCountMode, setIsHalfCountMode] = useState(false);\r\n';
const lateDeclLF = '   const [isHalfCountMode, setIsHalfCountMode] = useState(false);\n';

if (content.includes(lateDeclCRLF)) {
   content = content.replace(lateDeclCRLF, '');
} else if (content.includes(lateDeclLF)) {
   content = content.replace(lateDeclLF, '');
}

// 2. Add declaration near packing2OverallTotal at top of component state
const topTargetCRLF = '   const [packing2OverallTotal, setPacking2OverallTotal] = useState<number>(0);\r\n';
const topTargetLF = '   const [packing2OverallTotal, setPacking2OverallTotal] = useState<number>(0);\n';

if (!content.includes('const [isHalfCountMode, setIsHalfCountMode]')) {
   if (content.includes(topTargetCRLF)) {
      content = content.replace(topTargetCRLF, `${topTargetCRLF}   const [isHalfCountMode, setIsHalfCountMode] = useState(false);\r\n`);
   } else if (content.includes(topTargetLF)) {
      content = content.replace(topTargetLF, `${topTargetLF}   const [isHalfCountMode, setIsHalfCountMode] = useState(false);\n`);
   }
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Moved isHalfCountMode useState to top before useMemo hooks!');

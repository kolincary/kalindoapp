const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'Dashboard.tsx');
let rawContent = fs.readFileSync(filePath, 'utf8');
const isCrlf = rawContent.includes('\r\n');
let content = rawContent.replace(/\r\n/g, '\n');

const target = `                  <div className="flex items-center gap-2 text-white opacity-90 mt-1">
                     <User size={14} className="text-white" />
                     <span className="text-sm font-medium text-white">{employeeName}</span>
                     {isLeader && selectedLeaderProfile && (
                        <span className="ml-2 text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                           Profil: {selectedLeaderProfile}
                        </span>
                     )}
                  </div>`;

const replace = `                  <div className="flex items-center gap-2 text-white opacity-90 mt-1 flex-wrap">
                     <div className="flex items-center gap-1.5">
                        <User size={14} className="text-white" />
                        <span className="text-sm font-medium text-white">{employeeName}</span>
                     </div>
                     {userEmail && (
                        <span className="text-[11px] font-mono font-medium bg-black/25 text-white/90 px-2 py-0.5 rounded-full border border-white/10" title="Akun Email Login">
                           {userEmail}
                        </span>
                     )}
                     {isLeader && selectedLeaderProfile && (
                        <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                           Profil: {selectedLeaderProfile}
                        </span>
                     )}
                  </div>`;

if (!content.includes(target)) {
  console.error('Target not found in Dashboard.tsx');
  process.exit(1);
}

content = content.replace(target, replace);
if (isCrlf) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Dashboard.tsx updated with email badge!');

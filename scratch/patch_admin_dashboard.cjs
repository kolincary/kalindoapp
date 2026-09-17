const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let rawContent = fs.readFileSync(filePath, 'utf8');
const isCrlf = rawContent.includes('\r\n');
let content = rawContent.replace(/\r\n/g, '\n');

// Patch 1: State sync
const target1 = `   // 2. Data Management State
   const [localPermissions, setLocalPermissions] = useState<UserPermissions>(permissions);
   const [localManualInput, setLocalManualInput] = useState<UserManualInputAccess>(manualInputAccess);
   const [blockedUsers, setBlockedUsers] = useState<Record<string, boolean>>({});`;

const replace1 = `   // 2. Data Management State
   const [localPermissions, setLocalPermissions] = useState<UserPermissions>(permissions);
   const [localManualInput, setLocalManualInput] = useState<UserManualInputAccess>(manualInputAccess);
   const [blockedUsers, setBlockedUsers] = useState<Record<string, boolean>>({});

   // Sync state when props change
   useEffect(() => {
      if (manualInputAccess && Object.keys(manualInputAccess).length > 0) {
         setLocalManualInput(prev => ({ ...prev, ...manualInputAccess }));
      }
   }, [manualInputAccess]);

   useEffect(() => {
      if (permissions && Object.keys(permissions).length > 0) {
         setLocalPermissions(prev => ({ ...prev, ...permissions }));
      }
   }, [permissions]);`;

// Patch 2: fetchBlockedStatus -> fetch all access data
const target2 = `   const fetchBlockedStatus = async () => {
      try {
         const { data, error } = await supabase.from('app_users').select('email, is_blocked');
         if (error) throw error;
         const blockedMap: Record<string, boolean> = {};
         data?.forEach((u: any) => {
            if (u.email) blockedMap[u.email] = u.is_blocked || false;
         });
         setBlockedUsers(blockedMap);
      } catch (err: any) {
         console.error("Error fetching blocked status:", err);
      }
   };`;

const replace2 = `   const fetchBlockedStatus = async () => {
      try {
         const { data, error } = await supabase.from('app_users').select('email, is_blocked, allow_manual_input, roles, pin');
         if (error) throw error;
         const blockedMap: Record<string, boolean> = {};
         const manualMap: Record<string, boolean> = {};
         const permsMap: Record<string, (UserRole | string)[]> = {};
         data?.forEach((u: any) => {
            if (u.email) {
               const rawEmail = u.email;
               const lowerEmail = rawEmail.toLowerCase().trim();
               const isBlocked = u.is_blocked === true;
               const allowManual = u.allow_manual_input === true;
               blockedMap[rawEmail] = isBlocked;
               blockedMap[lowerEmail] = isBlocked;
               manualMap[rawEmail] = allowManual;
               manualMap[lowerEmail] = allowManual;
               if (u.roles) {
                  permsMap[rawEmail] = u.roles;
                  permsMap[lowerEmail] = u.roles;
               }
            }
         });
         setBlockedUsers(blockedMap);
         setLocalManualInput(prev => ({ ...prev, ...manualMap }));
         if (Object.keys(permsMap).length > 0) {
            setLocalPermissions(prev => ({ ...prev, ...permsMap }));
         }
      } catch (err: any) {
         console.error("Error fetching access data:", err);
      }
   };`;

// Patch 3: handleSave and toggleManualInput
const target3 = `   const handleSave = () => { onSave(localPermissions, pins); setSaved(true); setTimeout(() => setSaved(false), 2000); };

   const toggleManualInput = async (email: string) => {
      const current = localManualInput[email] || false;
      const newVal = !current;
      setLocalManualInput(prev => ({ ...prev, [email]: newVal }));
      const { error } = await supabase.from('app_users').update({ allow_manual_input: newVal }).eq('email', email);
      if (error) { console.error(error); setLocalManualInput(prev => ({ ...prev, [email]: current })); }
   };`;

const replace3 = `   const handleSave = () => { onSave(localPermissions, pins, localManualInput); setSaved(true); setTimeout(() => setSaved(false), 2000); };

   const toggleManualInput = async (email: string) => {
      const lower = email.toLowerCase().trim();
      const current = localManualInput[lower] ?? localManualInput[email] ?? false;
      const newVal = !current;
      setLocalManualInput(prev => ({ ...prev, [email]: newVal, [lower]: newVal }));
      const { error } = await supabase.from('app_users').update({ allow_manual_input: newVal }).ilike('email', lower);
      if (error) { 
         console.error("Toggle manual input error:", error); 
         setLocalManualInput(prev => ({ ...prev, [email]: current, [lower]: current })); 
      }
   };`;

// Patch 4: table render canManualInput
const target4 = `canManualInput={localManualInput[email] || false}`;
const replace4 = `canManualInput={localManualInput[email?.toLowerCase().trim()] ?? localManualInput[email] ?? false}`;

console.log('Checking Patch 1...', content.includes(target1));
console.log('Checking Patch 2...', content.includes(target2));
console.log('Checking Patch 3...', content.includes(target3));
console.log('Checking Patch 4 count...', content.split(target4).length - 1);

if (!content.includes(target1) || !content.includes(target2) || !content.includes(target3)) {
  console.error('Target strings not found!');
  process.exit(1);
}

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);
content = content.replace(target3, replace3);
content = content.replaceAll(target4, replace4);

if (isCrlf) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminDashboard.tsx patched successfully!');

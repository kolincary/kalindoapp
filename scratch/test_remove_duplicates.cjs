function removeKalindoFromTiktok(kalindoData, tiktokData) {
   const kalindoLines = kalindoData.split(/\r?\n/).map(l => l.trim()).filter(l => l);
   const kalindoSet = new Set();

   kalindoLines.forEach(line => {
      const clean = line.replace(/^["']|["']$/g, '').trim();
      if (!clean) return;
      if (clean.includes('\t')) {
         const code = clean.split('\t')[0].trim().replace(/^["']|["']$/g, '');
         if (code) kalindoSet.add(code);
      } else {
         const parts = clean.split(/\s+/);
         const code = parts[0]?.trim().replace(/^["']|["']$/g, '');
         if (code) kalindoSet.add(code);
      }
   });

   const tiktokLines = tiktokData.split(/\r?\n/).map(l => l.trim()).filter(l => l);
   const remainingTiktok = [];
   const seen = new Set();

   tiktokLines.forEach(line => {
      const clean = line.replace(/^["']|["']$/g, '').trim();
      if (!clean) return;
      const code = clean.includes('\t') 
         ? clean.split('\t')[0].trim().replace(/^["']|["']$/g, '') 
         : clean.split(/\s+/)[0].trim().replace(/^["']|["']$/g, '');
      
      if (code && !kalindoSet.has(code) && !seen.has(code)) {
         seen.add(code);
         remainingTiktok.push(code);
      }
   });

   const removedCount = tiktokLines.length - remainingTiktok.length;
   return { remaining: remainingTiktok, removedCount };
}

const kData = `586106239984568001
586106239984568002
586106239984568003`;

const tData = `586106239984568001
586106239984568002
586106239984568003
586106239984568004
586106239984568005`;

const res = removeKalindoFromTiktok(kData, tData);
console.log('Removed count:', res.removedCount);
console.log('Remaining:', res.remaining);

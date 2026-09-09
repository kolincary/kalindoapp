const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const packingStatsTarget = `   const packingStats = useMemo(() => {
      if (packingData.length === 0) return { total: totalRows, activeStaff: 0, latest: '-' };
      const uniqueStaff = new Set(packingData.map(i => i.employee_name));
      const latestTime = new Date(packingData[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { total: totalRows, activeStaff: uniqueStaff.size, latest: latestTime };
   }, [packingData, totalRows]);`;

const packing2AnalyticsCode = `   // Analytics khusus staff pada menu Data Packing 2
   const packing2StaffAnalytics = useMemo(() => {
      if (activeView !== 'PACKING_2_DATA' || filterPackingStaff === 'ALL') return null;

      const staffName = filterPackingStaff;
      const staffTotal = isHalfCountMode ? Math.ceil(totalRows / 2) : totalRows;
      const effectiveOverallTotal = isHalfCountMode ? Math.ceil(packing2OverallTotal / 2) : packing2OverallTotal;
      const overallTotal = effectiveOverallTotal > 0 ? effectiveOverallTotal : (staffTotal > 0 ? staffTotal : 1);
      const percentage = Math.min(100, Math.round((staffTotal / overallTotal) * 100)) || 0;

      // Hourly distribution dari packingData
      const hourlyMap: Record<number, number> = {};
      for (let h = 0; h < 24; h++) hourlyMap[h] = 0;

      let latestItem: any = null;
      let latestTimeStr = '-';

      if (packingData.length > 0) {
         latestItem = packingData[0];
         try {
            latestTimeStr = new Date(latestItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
         } catch (e) {
            latestTimeStr = '-';
         }

         packingData.forEach(item => {
            try {
               const date = new Date(item.timestamp);
               const hour = date.getHours();
               if (!isNaN(hour) && hour >= 0 && hour < 24) {
                  hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
               }
            } catch (e) {}
         });
      }

      // Cari jam-jam aktif
      const activeHourEntries = Object.entries(hourlyMap).map(([h, count]) => ({ hour: parseInt(h), count }));
      const activeHoursWithScans = activeHourEntries.filter(e => e.count > 0);
      const activeHoursCount = Math.max(1, activeHoursWithScans.length);
      
      // Rata-rata scan per jam aktif
      const avgPerHour = Math.round(staffTotal / activeHoursCount) || 0;

      // Tentukan rentang jam untuk grafik (misal 07:00 - 21:00 atau rentang data aktif)
      let minHour = 8;
      let maxHour = 20;
      if (activeHoursWithScans.length > 0) {
         const minActive = Math.min(...activeHoursWithScans.map(e => e.hour));
         const maxActive = Math.max(...activeHoursWithScans.map(e => e.hour));
         minHour = Math.max(0, Math.min(minHour, minActive));
         maxHour = Math.min(23, Math.max(maxHour, maxActive));
      }

      const hourlyChartData: { hour: string; rawHour: number; count: number }[] = [];
      let maxCountInHour = 1;
      for (let h = minHour; h <= maxHour; h++) {
         const count = hourlyMap[h] || 0;
         if (count > maxCountInHour) maxCountInHour = count;
         hourlyChartData.push({
            hour: \`\${h.toString().padStart(2, '0')}:00\`,
            rawHour: h,
            count
         });
      }

      // Status produktivitas
      let speedTag = { label: '🟢 Normal', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/20' };
      if (avgPerHour >= 120) {
         speedTag = { label: '⚡ Super Cepat', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-500/20' };
      } else if (avgPerHour >= 60) {
         speedTag = { label: '🔥 Sangat Produktif', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500/20' };
      }

      // Shift staff
      const staffEmployee = employees.find(e => e.name === staffName);
      const shift = staffEmployee?.shift || (packingData[0]?.shift) || 'Shift 1';

      // Inisial avatar
      const initials = staffName.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'ST';

      return {
         staffName,
         initials,
         shift,
         staffTotal,
         overallTotal,
         percentage,
         avgPerHour,
         activeHoursCount,
         hourlyChartData,
         maxCountInHour,
         speedTag,
         latestItem,
         latestTimeStr
      };
   }, [activeView, filterPackingStaff, totalRows, packing2OverallTotal, packingData, employees, isHalfCountMode]);`;

// Check CRLF vs LF
const isCRLF = content.includes('\r\n');
const targetStr = isCRLF ? packingStatsTarget.replace(/\n/g, '\r\n') : packingStatsTarget;
const codeToAdd = isCRLF ? packing2AnalyticsCode.replace(/\n/g, '\r\n') : packing2AnalyticsCode;

if (!content.includes('const packing2StaffAnalytics = useMemo')) {
   content = content.replace(targetStr, `${targetStr}${isCRLF ? '\r\n\r\n' : '\n\n'}${codeToAdd}`);
   console.log('Inserted packing2StaffAnalytics useMemo!');
} else {
   console.log('packing2StaffAnalytics already defined');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('AdminDashboard.tsx updated successfully!');

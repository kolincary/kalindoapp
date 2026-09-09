const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Original content length:', content.length);

// 1. Check if TrendingUp, Activity, Award are in lucide-react imports
const importTarget = "} from 'lucide-react';";
if (!content.includes('TrendingUp,')) {
   content = content.replace(importTarget, `   TrendingUp,\n   Activity,\n   Award,\n${importTarget}`);
   console.log('Added TrendingUp, Activity, Award to lucide-react imports');
}

// 2. Add state: packing2OverallTotal
const stateTarget = "const [packingStaffList, setPackingStaffList] = useState<string[]>([]);";
if (!content.includes('packing2OverallTotal')) {
   content = content.replace(stateTarget, `${stateTarget}\n   const [packing2OverallTotal, setPacking2OverallTotal] = useState<number>(0);`);
   console.log('Added packing2OverallTotal state');
}

// 3. Add packing2StaffAnalytics useMemo after packingStats
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

if (!content.includes('packing2StaffAnalytics = useMemo')) {
   content = content.replace(packingStatsTarget, `${packingStatsTarget}\n\n${packing2AnalyticsCode}`);
   console.log('Added packing2StaffAnalytics useMemo');
}

// 4. Update fetchPackingData to fetch overall total for PACKING_2_DATA
const fetchPackingDataTarget = `         setPackingData(enrichedData);
         setTotalRows(count || 0);`;

const fetchPackingDataReplacement = `         setPackingData(enrichedData);
         setTotalRows(count || 0);

         // Update overall total untuk Packing 2 analytics
         if (activeView === 'PACKING_2_DATA') {
            if (filterPackingStaff === 'ALL') {
               setPacking2OverallTotal(count || 0);
            } else {
               // Ambil count keseluruhan staff pada tanggal ini
               try {
                  const ovStart = new Date(effectiveStartDate + 'T00:00:00');
                  const ovEnd = new Date(effectiveEndDate + 'T23:59:59.999');
                  activeClient.from('scanned_items')
                     .select('id', { count: 'exact', head: true })
                     .gte('timestamp', ovStart.getTime())
                     .lte('timestamp', ovEnd.getTime())
                     .eq('role', 'PACKING_2')
                     .then(({ count: ovCount }: any) => {
                        if (ovCount !== null && ovCount !== undefined) {
                           setPacking2OverallTotal(ovCount);
                        }
                     });
               } catch (ovErr) {
                  console.error('Error fetching PACKING_2 overall total:', ovErr);
               }
            }
         }`;

if (!content.includes('// Update overall total untuk Packing 2 analytics')) {
   content = content.replace(fetchPackingDataTarget, fetchPackingDataReplacement);
   console.log('Added packing2OverallTotal fetch in fetchPackingData');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Updated AdminDashboard.tsx successfully!');

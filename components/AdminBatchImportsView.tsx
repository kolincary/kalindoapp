import React, { useState, useEffect } from 'react';
import { db } from '../services/firebaseClient';
import { supabase } from '../services/supabaseClient';
import { collection, getDocs, query, orderBy, limit, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { 
  Database, 
  Search, 
  RefreshCw, 
  Trash2, 
  Pencil, 
  X, 
  Save, 
  AlertCircle,
  Eye,
  Copy,
  Check,
  FileText,
  Layers
} from 'lucide-react';

interface AdminBatchImportItem {
  id: string;
  excelFilename: string;
  staffName: string;
  jumlah: number;
  batchId: string;
  timestamp: string;
  createdAt: string;
  barcodes: string[];
  [key: string]: any;
}

export function AdminBatchImportsView() {
  const [items, setItems] = useState<AdminBatchImportItem[]>([]);
  const [pickerNames, setPickerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<'excelFilename' | 'batchId' | 'staffName' | 'id' | 'barcode'>('excelFilename');
  const [limitCount, setLimitCount] = useState<number>(100);

  // Mass Search State
  const [searchMode, setSearchMode] = useState<'SINGLE' | 'MASS'>('SINGLE');
  const [massSearchText, setMassSearchText] = useState('');
  const [massSearchApplied, setMassSearchApplied] = useState<string[]>([]);

  const getParsedMassBarcodes = (text: string): string[] => {
    if (!text || !text.trim()) return [];
    return Array.from(
      new Set(
        text
          .split(/[\r\n,;\t]+/)
          .map(b => b.replace(/@/g, '').trim().toUpperCase())
          .filter(b => b.length >= 3)
      )
    );
  };
  
  // Edit State
  const [editingItem, setEditingItem] = useState<AdminBatchImportItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminBatchImportItem>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Barcode Viewer Modal State
  const [viewingBarcodesItem, setViewingBarcodesItem] = useState<AdminBatchImportItem | null>(null);
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState('');
  const [copiedBarcodes, setCopiedBarcodes] = useState(false);

  const fetchRecentData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let constraints: any[] = [orderBy('timestamp', 'desc')];
      if (limitCount > 0) {
        constraints.push(limit(limitCount));
      }

      const q = query(
        collection(db, 'admin_batch_imports'),
        ...constraints
      );
      const snapshot = await getDocs(q);
      const data: AdminBatchImportItem[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...(docSnap.data() as Record<string, any>) } as AdminBatchImportItem);
      });
      setItems(data);
    } catch (err: any) {
      console.error('Error fetching admin_batch_imports data:', err);
      setErrorMsg(err.message || 'Gagal memuat data dari Firestore');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchRecentData();
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const term = searchTerm.trim();
      const termUpper = term.toUpperCase();
      let data: AdminBatchImportItem[] = [];

      if (searchBy === 'id') {
        const q = query(collection(db, 'admin_batch_imports'), where('__name__', '==', term));
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...(docSnap.data() as Record<string, any>) } as AdminBatchImportItem);
        });
      } else if (searchBy === 'barcode') {
        // 1. Try exact array-contains query in Firestore
        const qExact = query(collection(db, 'admin_batch_imports'), where('barcodes', 'array-contains', termUpper));
        const snapshotExact = await getDocs(qExact);
        snapshotExact.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...(docSnap.data() as Record<string, any>) } as AdminBatchImportItem);
        });

        // 2. If no exact match or for partial search, scan recent Firestore docs
        if (data.length === 0) {
          const qRecent = query(collection(db, 'admin_batch_imports'), orderBy('timestamp', 'desc'), limit(limitCount > 0 ? limitCount : 1000));
          const snapRecent = await getDocs(qRecent);
          snapRecent.forEach((docSnap) => {
            const item = { id: docSnap.id, ...(docSnap.data() as Record<string, any>) } as AdminBatchImportItem;
            if (Array.isArray(item.barcodes) && item.barcodes.some(b => (b || '').toString().toUpperCase().includes(termUpper))) {
              data.push(item);
            }
          });
        }
      } else {
        const variations = Array.from(new Set([term, termUpper, term.toLowerCase()]));
        const q = query(collection(db, 'admin_batch_imports'), where(searchBy, 'in', variations));
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...(docSnap.data() as Record<string, any>) } as AdminBatchImportItem);
        });
      }
      
      setItems(data);
      if (data.length === 0) {
        setErrorMsg(`Tidak ditemukan data batch import yang cocok dengan ${searchBy === 'barcode' ? 'Nomor Resi' : searchBy}: "${searchTerm}"`);
      }
    } catch (err: any) {
      console.error('Error searching firestore:', err);
      setErrorMsg(err.message || 'Gagal mencari data');
    } finally {
      setLoading(false);
    }
  };

  const handleMassSearch = async () => {
    const parsed = getParsedMassBarcodes(massSearchText);
    setMassSearchApplied(parsed);
    if (parsed.length === 0) {
      alert("Silakan paste setidaknya 1 barcode valid.");
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const matchedMap = new Map<string, AdminBatchImportItem>();
      
      // 1. In chunks of 30, query array-contains-any in Firestore
      for (let i = 0; i < parsed.length; i += 30) {
        const chunk = parsed.slice(i, i + 30);
        try {
          const q = query(
            collection(db, 'admin_batch_imports'),
            where('barcodes', 'array-contains-any', chunk)
          );
          const snap = await getDocs(q);
          snap.forEach(docSnap => {
            matchedMap.set(docSnap.id, { id: docSnap.id, ...(docSnap.data() as Record<string, any>) } as AdminBatchImportItem);
          });
        } catch (e) {
          console.warn("Array contains any failed, continuing fallback...", e);
        }
      }

      // 2. Also scan recent batch imports from Firestore for any items containing the parsed barcodes
      const qRecent = query(collection(db, 'admin_batch_imports'), orderBy('timestamp', 'desc'), limit(limitCount > 0 ? limitCount : 1000));
      const snapRecent = await getDocs(qRecent);
      snapRecent.forEach(docSnap => {
        const item = { id: docSnap.id, ...(docSnap.data() as Record<string, any>) } as AdminBatchImportItem;
        if (Array.isArray(item.barcodes) && item.barcodes.some(b => parsed.includes((b || '').toString().trim().toUpperCase()))) {
          matchedMap.set(item.id, item);
        }
      });

      const data = Array.from(matchedMap.values()).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setItems(data);
      if (data.length === 0) {
        setErrorMsg(`Tidak ditemukan data batch import yang memuat ${parsed.length} barcode yang dicari.`);
      }
    } catch (err: any) {
      console.error('Error mass searching firestore:', err);
      setErrorMsg(err.message || 'Gagal mencari data massal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentData();
  }, [limitCount]);

  useEffect(() => {
    const fetchPickerNames = async () => {
      if (!items || items.length === 0) return;
      
      const barcodeToBatchId: Record<string, string> = {};
      const firstBarcodes: string[] = [];
      
      items.forEach(item => {
        if (item.barcodes && item.barcodes.length > 0) {
          const bc = item.barcodes[0];
          firstBarcodes.push(bc);
          barcodeToBatchId[bc] = item.id;
        }
      });

      if (firstBarcodes.length === 0) return;

      try {
        let result: Record<string, string> = {};
        for (let i = 0; i < firstBarcodes.length; i += 100) {
          const chunk = firstBarcodes.slice(i, i + 100);
          const { data, error } = await supabase
            .from('scanned_items')
            .select('barcode, employee_name')
            .in('barcode', chunk)
            .in('role', ['PICKER', 'Picker', 'OJOL', 'Ojol']);
          
          if (data && !error) {
            data.forEach(row => {
              if (row.employee_name && row.barcode) {
                const batchId = barcodeToBatchId[row.barcode];
                if (batchId) {
                  result[batchId] = row.employee_name;
                }
              }
            });
          }
        }
        setPickerNames(prev => ({ ...prev, ...result }));
      } catch (e) {
        console.error("Failed to fetch picker names", e);
      }
    };
    
    fetchPickerNames();
  }, [items]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data impor batch ini dari Firestore & Supabase secara permanen?')) {
      return;
    }
    
    try {
      const itemToDelete = items.find(item => item.id === id);

      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'admin_batch_imports', id));

      // 2. Delete from Supabase
      if (itemToDelete) {
        if (itemToDelete.batchId) {
          const { data: matchedBatches } = await supabase.from('batches').select('id').eq('batch_no', itemToDelete.batchId);
          const matchingIds = (matchedBatches || []).map(b => b.id);
          if (matchingIds.length > 0) {
            await supabase.from('batch_items').delete().in('batch_id', matchingIds);
            await supabase.from('batches').delete().in('id', matchingIds);
          }
        }
        if (itemToDelete.barcodes && itemToDelete.barcodes.length > 0) {
          for (let i = 0; i < itemToDelete.barcodes.length; i += 500) {
            const chunk = itemToDelete.barcodes.slice(i, i + 500);
            await supabase.from('batch_items').delete().in('barcode', chunk);
          }
        }
      }

      setItems(items.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Error deleting document:', err);
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  const openEditModal = (item: AdminBatchImportItem) => {
    setEditingItem(item);
    setEditForm({ ...item });
  };

  const openBarcodesModal = (item: AdminBatchImportItem) => {
    setViewingBarcodesItem(item);
    setBarcodeSearchTerm(searchTerm && searchBy === 'barcode' ? searchTerm : '');
    setCopiedBarcodes(false);
  };

  const handleCopyBarcodes = (barcodes: string[]) => {
    if (!barcodes || barcodes.length === 0) return;
    navigator.clipboard.writeText(barcodes.join('\n'));
    setCopiedBarcodes(true);
    setTimeout(() => setCopiedBarcodes(false), 2000);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    setIsSaving(true);
    try {
      const docRef = doc(db, 'admin_batch_imports', editingItem.id);
      
      const dataToSave = { ...editForm };
      delete dataToSave.id;
      
      await updateDoc(docRef, dataToSave);
      
      setItems(items.map(item => item.id === editingItem.id ? { ...item, ...dataToSave } as AdminBatchImportItem : item));
      setEditingItem(null);
    } catch (err: any) {
      console.error('Error updating document:', err);
      alert('Gagal mengupdate data: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (tsStr: string) => {
    if (!tsStr) return '-';
    try {
      return new Date(tsStr).toLocaleString('id-ID');
    } catch (e) {
      return tsStr;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 min-h-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-500" />
              Batch Imports Manager
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Kelola data collection 'admin_batch_imports' secara langsung di Firestore
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batas Row:</span>
            <select 
              value={limitCount}
              onChange={(e) => setLimitCount(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            >
              <option value={100}>100 Data</option>
              <option value={500}>500 Data</option>
              <option value={1000}>1000 Data</option>
              <option value={2000}>2000 Data</option>
              <option value={5000}>5000 Data</option>
              <option value={0}>Tanpa Batas (Semua Data)</option>
            </select>
          </div>
        </div>

        {/* Filter & Search Bar with Single / Mass Mode */}
        <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between w-full">
            {/* Mode Switcher */}
            <div className="flex items-center p-1 bg-gray-200 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSearchMode('SINGLE');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  searchMode === 'SINGLE'
                    ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Single Search</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode('MASS');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  searchMode === 'MASS'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mass Search (Paste Vertikal)</span>
                {massSearchApplied.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-white text-amber-700 rounded-full text-[10px] font-extrabold">
                    {massSearchApplied.length}
                  </span>
                )}
              </button>
            </div>

            {/* Single Search Mode Form */}
            {searchMode === 'SINGLE' && (
              <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-center flex-1 w-full">
                <select 
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-[42px]"
                >
                  <option value="excelFilename">Excel Filename</option>
                  <option value="barcode">Nomor Resi / Barcode</option>
                  <option value="batchId">Batch ID</option>
                  <option value="staffName">Staff Name</option>
                  <option value="id">Doc ID</option>
                </select>
                
                <div className="relative flex items-center flex-1 min-w-[160px]">
                  <Search className="absolute left-3 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder={searchBy === 'barcode' ? "Cari nomor resi / barcode (misal: 004647886474)..." : "Cari data import batch..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-[42px] w-full"
                  />
                  {searchTerm && (
                    <button 
                      type="button"
                      onClick={() => { setSearchTerm(''); fetchRecentData(); }}
                      className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm h-[42px] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Cari
                </button>
                
                <button 
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    fetchRecentData();
                  }}
                  title="Refresh / Reset Filter"
                  className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors h-[42px] flex items-center justify-center cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </form>
            )}
          </div>

          {/* Mass Search Expandable Panel */}
          {searchMode === 'MASS' && (
            <div className="w-full bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Paste Daftar Barcode Vertikal (Atas ke Bawah):
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {massSearchText.trim() && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      {getParsedMassBarcodes(massSearchText).length} Barcode Terdeteksi
                    </span>
                  )}
                </div>
              </div>

              <textarea
                value={massSearchText}
                onChange={(e) => setMassSearchText(e.target.value)}
                rows={4}
                placeholder={`Paste barcode vertikal di sini...
Contoh:
SPXID066536875668
SPXID069983704608
11004285496374
LXAD-1234567890`}
                className="w-full p-3 bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono text-xs text-gray-900 dark:text-white resize-y"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  {massSearchApplied.length > 0 ? (
                    <span>Menampilkan hasil pencarian untuk <b>{massSearchApplied.length}</b> barcode massal.</span>
                  ) : (
                    <span>Paste daftar barcode di atas lalu klik &quot;Cari Massal&quot;.</span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  {(massSearchText || massSearchApplied.length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMassSearchText('');
                        setMassSearchApplied([]);
                        fetchRecentData();
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleMassSearch}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari Massal ({getParsedMassBarcodes(massSearchText).length})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold w-16">No</th>
                <th className="px-4 py-3 font-semibold">Excel Filename</th>
                <th className="px-4 py-3 font-semibold">Batch ID</th>
                <th className="px-4 py-3 font-semibold text-center">Jumlah Resi</th>
                <th className="px-4 py-3 font-semibold">Staff Name</th>
                <th className="px-4 py-3 font-semibold">Picker Name</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Doc ID</th>
                <th className="px-4 py-3 font-semibold text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat data dari Firestore...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const hasMatchedBarcode = searchTerm && searchBy === 'barcode' && Array.isArray(item.barcodes) && item.barcodes.some(b => (b || '').toString().toUpperCase().includes(searchTerm.trim().toUpperCase()));

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${hasMatchedBarcode ? 'bg-amber-50/70 dark:bg-amber-900/20' : ''}`}>
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        {item.excelFilename}
                        {hasMatchedBarcode && (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-full border border-amber-300 dark:border-amber-700 animate-pulse">
                            Resi Cocok
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">{item.batchId}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openBarcodesModal(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors cursor-pointer"
                          title="Klik untuk melihat list resi barcode"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{item.barcodes?.length || item.jumlah || 0}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">{item.staffName || '-'}</td>
                      <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">{pickerNames[item.id] || '-'}</td>
                      <td className="px-4 py-3 text-xs">{formatDate(item.timestamp)}</td>
                      <td className="px-4 py-3 text-[10px] text-gray-400 font-mono select-all max-w-[120px] truncate">
                        {item.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openBarcodesModal(item)}
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                            title="Lihat List Resi Barcode (Mata)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(item)}
                            className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            title="Edit Document"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && items.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Menampilkan {items.length} data {limitCount === 0 ? '(Tanpa Batas / Semua Data)' : `terbaru`}
            </span>
          </div>
        )}
      </div>

      {/* BARCODE LIST VIEWER MODAL (GAMBAR MATA) */}
      {viewingBarcodesItem && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-gray-700 animate-[fadeIn_0.2s_ease-out]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/20 sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  List Resi Barcode
                  <span className="text-xs px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-full font-bold">
                    {viewingBarcodesItem.barcodes?.length || viewingBarcodesItem.jumlah || 0} resi
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Batch: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{viewingBarcodesItem.batchId}</span> ({viewingBarcodesItem.excelFilename})
                </p>
              </div>
              <button 
                onClick={() => setViewingBarcodesItem(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Controls */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Filter nomor resi di batch ini..."
                  value={barcodeSearchTerm}
                  onChange={(e) => setBarcodeSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {barcodeSearchTerm && (
                  <button 
                    onClick={() => setBarcodeSearchTerm('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              <button 
                onClick={() => handleCopyBarcodes(viewingBarcodesItem.barcodes || [])}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                {copiedBarcodes ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                {copiedBarcodes ? 'Tersalin!' : 'Salin Semua Barcode'}
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800">
              {(() => {
                const barcodes = viewingBarcodesItem.barcodes || [];
                const filtered = barcodes.filter(b => (b || '').toString().toUpperCase().includes(barcodeSearchTerm.trim().toUpperCase()));

                if (barcodes.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                      <FileText className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-sm font-medium">Tidak ada array barcodes pada dokumen batch ini.</p>
                    </div>
                  );
                }

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-sm">Tidak ada resi yang cocok dengan filter "{barcodeSearchTerm}"</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {filtered.map((bc, i) => {
                      const isHighlighted = searchTerm && bc.toUpperCase().includes(searchTerm.trim().toUpperCase());

                      return (
                        <div 
                          key={`${bc}-${i}`} 
                          className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-colors ${
                            isHighlighted 
                              ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-900 dark:text-amber-200 shadow-sm ring-2 ring-amber-400/50' 
                              : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <span className="text-[10px] text-gray-400 font-sans mr-2 select-none">#{i + 1}</span>
                          <span className="truncate select-all">{bc}</span>
                          {isHighlighted && (
                            <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded shrink-0 ml-1">COCOK</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center text-xs text-gray-500">
              <span>Staff: <strong className="text-gray-700 dark:text-gray-300">{viewingBarcodesItem.staffName || '-'}</strong></span>
              <button 
                onClick={() => setViewingBarcodesItem(null)}
                className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" />
                Edit Batch Import
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doc ID (Read Only)</label>
                <input 
                  type="text" 
                  value={editForm.id || ''} 
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excel Filename</label>
                   <input 
                     type="text" 
                     value={editForm.excelFilename || ''} 
                     onChange={(e) => setEditForm({...editForm, excelFilename: e.target.value})}
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch ID</label>
                   <input 
                     type="text" 
                     value={editForm.batchId || ''} 
                     onChange={(e) => setEditForm({...editForm, batchId: e.target.value})}
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff Name</label>
                   <input 
                     type="text" 
                     value={editForm.staffName || ''} 
                     onChange={(e) => setEditForm({...editForm, staffName: e.target.value})}
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
                   <input 
                     type="number" 
                     value={editForm.jumlah || 0} 
                     onChange={(e) => setEditForm({...editForm, jumlah: Number(e.target.value)})}
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timestamp</label>
                   <input 
                     type="text" 
                     value={editForm.timestamp || ''} 
                     onChange={(e) => setEditForm({...editForm, timestamp: e.target.value})}
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created At</label>
                   <input 
                     type="text" 
                     value={editForm.createdAt || ''} 
                     onChange={(e) => setEditForm({...editForm, createdAt: e.target.value})}
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                   />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barcodes (Read Only) - {editForm.barcodes?.length || 0} resi</label>
                <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 h-32 overflow-y-auto font-mono text-xs leading-relaxed">
                   {editForm.barcodes ? editForm.barcodes.join(', ') : 'Tidak ada barcode'}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 italic">* Data barcode hanya bisa dibaca dan tidak bisa diedit untuk mencegah kerusakan format array.</p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 mt-auto">
              <button 
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

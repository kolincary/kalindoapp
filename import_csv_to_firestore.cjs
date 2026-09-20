/**
 * Tool Import CSV Supabase -> Cloud Firestore (Ultra Fast Streaming)
 * 
 * Cara Penggunaan:
 * 1. Letakkan file CSV di folder proyek ini (contoh: scanned_items.csv atau backup.csv)
 * 2. Jalankan perintah di Terminal / Command Prompt:
 *    node import_csv_to_firestore.cjs
 * 
 * Atau tentukan path file secara langsung:
 *    node import_csv_to_firestore.cjs "C:\path\ke\file_backup.csv"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import Firebase Client SDK from local node_modules
const { initializeApp } = require('./node_modules/firebase/app');
const { getFirestore, doc, writeBatch } = require('./node_modules/firebase/firestore');

// Konfigurasi Firebase (Project KS)
const firebaseConfig = {
  apiKey: "AIzaSyCyt5XTwrSIK0aWlZXkUw4wdaMrMZsfbP4",
  authDomain: "pro-pulsar-476713-s9.firebaseapp.com",
  projectId: "pro-pulsar-476713-s9",
  storageBucket: "pro-pulsar-476713-s9.firebasestorage.app",
  messagingSenderId: "1087859743191",
  appId: "1:1087859743191:web:aec1c24af3ad0b40d61392"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "project-ks");
const TARGET_COLLECTION = 'scanned_items';
const BATCH_SIZE = 250; // Ukuran batch optimal & aman
const THROTTLE_DELAY_MS = 30; // Jeda mikro agar write stream Firestore stabil

// Parser baris CSV yang mendukung koma di dalam tanda kutip ("...")
function parseCSVLine(text) {
  const result = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        curr += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(curr.trim());
      curr = '';
    } else {
      curr += char;
    }
  }
  result.push(curr.trim());
  return result;
}

// Cari file CSV jika tidak disertakan argumen
function findCSVFile() {
  const argFile = process.argv[2];
  if (argFile && fs.existsSync(argFile)) {
    return path.resolve(argFile);
  }

  const defaultNames = ['scanned_items.csv', 'backup.csv', 'data.csv', 'export.csv'];
  for (const name of defaultNames) {
    const p = path.join(__dirname, name);
    if (fs.existsSync(p)) return p;
  }

  // Scan file .csv pertama yang ada di folder
  const files = fs.readdirSync(__dirname);
  const found = files.find(f => f.toLowerCase().endsWith('.csv'));
  if (found) return path.join(__dirname, found);

  return null;
}

async function runImport() {
  console.log('\n======================================================');
  console.log('🚀 KALINDO SCAN: IMPORT CSV SUPABASE -> CLOUD FIRESTORE');
  console.log('======================================================\n');

  const csvPath = findCSVFile();
  if (!csvPath) {
    console.error('❌ File CSV tidak ditemukan!');
    console.log('\nPetunjuk:');
    console.log('1. Salin file CSV hasil export Supabase ke folder proyek ini.');
    console.log('2. Atau jalankan dengan argumen: node import_csv_to_firestore.cjs "nama_file.csv"\n');
    process.exit(1);
  }

  const fileStats = fs.statSync(csvPath);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  console.log(`📁 File Target : ${path.basename(csvPath)} (${fileSizeMB} MB)`);
  console.log(`🎯 Database    : project-ks (Firestore)`);
  console.log(`📦 Collection  : ${TARGET_COLLECTION}\n`);

  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = [];
  let isFirstLine = true;
  let lineCount = 0;
  let successCount = 0;
  let batchItems = [];
  let batchNumber = 0;
  const startTime = Date.now();

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (isFirstLine) {
      headers = parseCSVLine(line).map(h => h.replace(/^["']|["']$/g, '').trim());
      console.log(`📋 Header Kolom Ditemukan (${headers.length}):`, headers.join(', '));
      console.log('\n⏳ Memulai proses import ke Firestore...\n');
      isFirstLine = false;
      continue;
    }

    lineCount++;
    const values = parseCSVLine(line);
    const row = {};

    headers.forEach((h, idx) => {
      let val = values[idx] !== undefined ? values[idx] : null;
      if (val !== null && val !== '') {
        // Hilangkan quotes
        if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }

        // Parse timestamp menjadi integer number jika memungkinkan
        if (h === 'timestamp' && val) {
          const num = Number(val);
          if (!isNaN(num)) {
            val = num;
          } else {
            const parsedDate = new Date(val).getTime();
            if (!isNaN(parsedDate)) val = parsedDate;
          }
        }

        row[h] = val;
      }
    });

    if (Object.keys(row).length > 0) {
      batchItems.push(row);
    }

    // Commit batch jika mencapai BATCH_SIZE (250)
    if (batchItems.length >= BATCH_SIZE) {
      batchNumber++;
      await commitBatch(batchItems);
      successCount += batchItems.length;
      batchItems = [];

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      const speed = Math.round(successCount / (elapsedSec || 1));
      process.stdout.write(`\r[Batch #${batchNumber}] Terimport: ${successCount.toLocaleString('id-ID')} baris (${speed} data/detik) | Waktu: ${elapsedSec}s`);

      // Throttle delay
      if (THROTTLE_DELAY_MS > 0) {
        await new Promise(r => setTimeout(r, THROTTLE_DELAY_MS));
      }
    }
  }

  // Sisa item terakhir
  if (batchItems.length > 0) {
    batchNumber++;
    await commitBatch(batchItems);
    successCount += batchItems.length;
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n======================================================`);
  console.log(`✅ IMPORT SELESAI DENGAN SUKSES!`);
  console.log(`📊 Total Baris Terimport : ${successCount.toLocaleString('id-ID')} data`);
  console.log(`⏱️ Total Waktu           : ${totalTime} detik`);
  console.log(`🎯 Koleksi Firestore     : '${TARGET_COLLECTION}' (project-ks)`);
  console.log(`======================================================\n`);
  process.exit(0);
}

async function commitBatch(items) {
  const batch = writeBatch(db);
  for (const item of items) {
    const docId = item.id ? String(item.id) : `${item.barcode || 'item'}_${item.role || ''}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const docRef = doc(db, TARGET_COLLECTION, docId);

    const clean = {};
    for (const k in item) {
      if (item[k] !== undefined && item[k] !== null) {
        clean[k] = item[k];
      }
    }

    batch.set(docRef, clean, { merge: true });
  }

  let retries = 3;
  while (retries > 0) {
    try {
      await batch.commit();
      break;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

runImport().catch(err => {
  console.error('\n❌ Terjadi error saat proses import:', err);
  process.exit(1);
});

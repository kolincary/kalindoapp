const admin = require('firebase-admin');

// Let's check how the app initializes firebase client SDK or admin SDK
// In client SDK, let's see how firebase is initialized in the project
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, getCountFromServer, limit, orderBy } = require('firebase/firestore');

// Let's check firebase config from project
const fs = require('fs');
const path = require('path');

async function test() {
  const firebaseConfigPath = path.join(__dirname, '..', 'firebaseConfig.ts');
  let configContent = '';
  if (fs.existsSync(firebaseConfigPath)) {
    configContent = fs.readFileSync(firebaseConfigPath, 'utf8');
  } else {
    // search for firebaseConfig or db
    console.log('Searching for firebase config in src/ or components/ ...');
  }
  console.log('Firebase config search done');
}

test();

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const fbFile = fs.readFileSync('services/firebaseClient.ts', 'utf8');
console.log(fbFile);

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually since import.meta.env doesn't work in raw Node.js
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^VITE_([^=]+)=(.*)$/);
  if (match) {
    envVars['VITE_' + match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedProjectsData() {
  try {
    const rawData = fs.readFileSync('C:/Users/PC/.gemini/antigravity-ide/brain/22ba0cd0-a605-4b6f-8793-c329098f8c8e/scratch/projectData.json', 'utf8');
    const projectData = JSON.parse(rawData);
    
    // Add IDs to each project
    projectData.residential = projectData.residential.map((p, i) => ({...p, id: 'residential-' + Date.now() + '-' + i}));
    projectData.commercial = projectData.commercial.map((p, i) => ({...p, id: 'commercial-' + Date.now() + '-' + i}));
    
    await setDoc(doc(db, 'siteSettings', 'projectsData'), projectData);
    console.log('Successfully seeded siteSettings/projectsData to Firestore!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedProjectsData();

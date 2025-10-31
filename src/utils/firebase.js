import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Environment variables (simulated by global access in this environment)
// *** HARDCODED FIREBASE CONFIGURATION ***
const firebaseConfig = {
  apiKey: "AIzaSyA21YC_XeiHCyEOWjwls2J7YevY48VbK4U",
  authDomain: "remote-video-call.firebaseapp.com",
  databaseURL: "https://remote-video-call-default-rtdb.firebaseio.com",
  projectId: "remote-video-call",
  storageBucket: "remote-video-call.firebasestorage.app",
  messagingSenderId: "304055085151",
  appId: "1:304055085151:web:7413c85b2ef0a49c7053ea",
  measurementId: "G-YVBB1YNGWB"
};

export const initFirebase = (setLogLevel) => {
  if (!firebaseConfig) {
    console.error("Firebase configuration not found.");
    return { app: null, db: null, auth: null };
  }
  if (setLogLevel) setLogLevel('debug');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  return { app, db, auth };
};

export const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

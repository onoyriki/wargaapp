
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, memoryLocalCache, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCOKhXXn7IyDrwrS8U8bnzeC5XfJWqWIf4",
  authDomain: "wargaapp-56a1f.firebaseapp.com",
  projectId: "wargaapp-56a1f",
  storageBucket: "wargaapp-56a1f.firebasestorage.app",
  messagingSenderId: "223789396780",
  appId: "1:223789396780:web:8100b5a2464051754b7289",
  measurementId: "G-TLZZHN8NX8"
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

// Initialize Firestore with persistence
let db: Firestore;

// Check if running in a browser environment
if (typeof window !== 'undefined') {
  try {
    // Use initializeFirestore with default persistent cache settings
    db = initializeFirestore(app, {
      localCache: persistentLocalCache()
    });
  } catch (err) {
    console.warn('Firestore persistence initialization failed:', err);
    // Fallback to in-memory persistence if IndexedDB fails
    db = initializeFirestore(app, {
        localCache: memoryLocalCache()
    });
  }
} else {
  // For server-side rendering, use getFirestore without persistence
  db = getFirestore(app);
}

export { app, auth, db, storage };

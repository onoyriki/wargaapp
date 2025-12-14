
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

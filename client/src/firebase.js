// Firebase configuration for SakhiCredit
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAR7ZUYxkKuPqBoJUUXAKFeC1UleuhGnz4",
  authDomain: "sakhi-66790.firebaseapp.com",
  projectId: "sakhi-66790",
  storageBucket: "sakhi-66790.firebasestorage.app",
  messagingSenderId: "469460087563",
  appId: "1:469460087563:web:5b5d67b8acb8813fafa80e",
  measurementId: "G-29KPR0W36E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Use the project's specific Google OAuth Client ID
googleProvider.setCustomParameters({
  client_id: '752446007973-qm6a3d80pchrajma51dfh2od47sll22q.apps.googleusercontent.com'
});


export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
  signOut
};

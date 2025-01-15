import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwlZqZwx_6l2QFvnnHO_LtGWFtu7gTeL4",
  authDomain: "cru-guest-management.firebaseapp.com",
  projectId: "cru-guest-management",
  storageBucket: "cru-guest-management.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "621970417699",
  appId: "1:621970417699:web:d7c62302c6694859f22996",
  measurementId: "G-GXPGJNNMNZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Ensure the app is initialized correctly
if (!app) {
  throw new Error('Firebase app failed to initialize');
}
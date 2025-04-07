import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDtwEtmg-4XgHlsyu0KEzkY7U7u26Y_K5o",
  authDomain: "reorg-presentation.firebaseapp.com",
  projectId: "reorg-presentation",
  storageBucket: "reorg-presentation.firebasestorage.app",
  messagingSenderId: "849557555127",
  appId: "1:849557555127:web:6d12110e5680506dff0a32",
  measurementId: "G-RDM81N4BRQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);

export { app, analytics, db }; 
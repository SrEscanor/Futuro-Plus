import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 1. Importe o Firestore

const firebaseConfig = {
  apiKey: "AIzaSyBFZqeWzcFlZJRSf4PR1vPu-RNxFPvJgSs",
  authDomain: "futuroplus-bce54.firebaseapp.com",
  projectId: "futuroplus-bce54",
  storageBucket: "futuroplus-bce54.firebasestorage.app",
  messagingSenderId: "809256060399",
  appId: "1:809256060399:web:faa209ea8869daab3d621a",
  measurementId: "G-F84B9KL0P0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // 2. Inicialize o Firestore

export { app, auth, db }; // 3. Exporte o db junto com o auth
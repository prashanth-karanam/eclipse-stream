// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAL0yYoxbBZkYh4RXVgcW5zd6rxTnqVaJs",
  authDomain: "cineplus-495a2.firebaseapp.com",
  projectId: "cineplus-495a2",
  storageBucket: "cineplus-495a2.firebasestorage.app",
  messagingSenderId: "780981517237",
  appId: "1:780981517237:web:29cfe67738745b5a08b7fc",
  measurementId: "G-75009SZ5H7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, deleteDoc };

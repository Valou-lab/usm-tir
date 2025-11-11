import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCI2A43hCpR_nVStbMvgzz6cYaGiXbjN3o",
    authDomain: "usmm-tir-planning.firebaseapp.com",
    projectId: "usmm-tir-planning",
    storageBucket: "usmm-tir-planning.firebasestorage.app",
    messagingSenderId: "716159124127",
    appId: "1:716159124127:web:3c24dc82ecbb307a9058aa"
};


// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Exporter les services Firebase pour les utiliser dans l'application
export const auth = getAuth(app);
export const db = getFirestore(app);
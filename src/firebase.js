import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore"; // Assuming this import is also needed for getFirestore
import { getStorage } from "firebase/storage"; // Assuming this import is also needed for getStorage

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA_AGv_ZedWcWbj16ZbW32bPxlZhfCpIyI",
    authDomain: "lumen-c0ed2.firebaseapp.com",
    projectId: "lumen-c0ed2",
    storageBucket: "lumen-c0ed2.firebasestorage.app",
    messagingSenderId: "345399810566",
    appId: "1:345399810566:web:71d8528663310d31b64187",
    measurementId: "G-LR83G0H0G8",
    databaseURL: "https://lumen-c0ed2-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const dbRealtime = getDatabase(app);

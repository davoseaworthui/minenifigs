// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeFirestore } from "./initFirestore";

// Your web app's Firebase configuration
// You need to replace this with your own Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-mode",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-mode",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-mode",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-mode",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "demo-mode",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-mode",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firestore with example data if needed
if (process.env.NODE_ENV === "development") {
  initializeFirestore().catch(console.error);
}

export { app, auth, db };

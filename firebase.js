// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACW4N486R7JF4OeAyVOr20XBnEa7Gzcgg",
  authDomain: "portfolio-architect-pro.firebaseapp.com",
  projectId: "portfolio-architect-pro",
  storageBucket: "portfolio-architect-pro.firebasestorage.app",
  messagingSenderId: "688628767153",
  appId: "1:688628767153:web:d4334ccebf3b29c1c78590",
  measurementId: "G-V2Y6JG5B0K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services the rest of the app needs
export const auth = getAuth(app);
export const db = getFirestore(app);

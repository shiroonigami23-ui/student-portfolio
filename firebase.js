// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);

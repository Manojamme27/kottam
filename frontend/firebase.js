// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
    authDomain: "kottam-food-delivery.firebaseapp.com",
    projectId: "kottam-food-delivery",
    storageBucket: "kottam-food-delivery.firebasestorage.app",
    messagingSenderId: "691338836731",
    appId: "1:691338836731:web:f98a1e226693d55e390e5e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app)
export{app,auth}
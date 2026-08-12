import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1_8mPr5dU2Vn0iPs1P6eq_HqXaM_i3Rw",
  authDomain: "fintrack-4e45d.firebaseapp.com",
  projectId: "fintrack-4e45d",
  storageBucket: "fintrack-4e45d.firebasestorage.app",
  messagingSenderId: "322041144719",
  appId: "1:322041144719:web:172f8b657189b24cc6d7fa",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };


export async function getFirebase() {
  return {
    app,
    auth,
    db,
    googleProvider,
  };
}

export default app;
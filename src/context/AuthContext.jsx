// ─────────────────────────────────────────────────────────────────────────────
//  src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
import { getFirebase } from "../services/firebase";
import { friendlyError } from "../services/constants";

const AuthCtx = createContext(null);

export function useAuth() {
  return useContext(AuthCtx);
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = still loading
  const [authErr, setAuthErr] = useState("");

  // Listen for auth state changes
  useEffect(() => {
    let unsub;
    getFirebase().then(({ auth }) => {
      import("firebase/auth").then(({ onAuthStateChanged }) => {
        unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
      });
    });
    return () => unsub?.();
  }, []);

  const signUp = async (email, password) => {
    setAuthErr("");
    try {
      const { auth } = await getFirebase();
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setAuthErr(friendlyError(e.code));
    }
  };

  const signIn = async (email, password) => {
    setAuthErr("");
    try {
      const { auth } = await getFirebase();
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setAuthErr(friendlyError(e.code));
    }
  };

  const signInGoogle = async () => {
    setAuthErr("");
    try {
      const { auth, googleProvider } = await getFirebase();
      const { signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") setAuthErr(friendlyError(e.code));
    }
  };

  const signOut = async () => {
    const { auth } = await getFirebase();
    const { signOut: fbSignOut } = await import("firebase/auth");
    await fbSignOut(auth);
  };

  const resetPassword = async (email) => {
    setAuthErr("");
    try {
      const { auth } = await getFirebase();
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (e) {
      setAuthErr(friendlyError(e.code));
      return false;
    }
  };

  return (
    <AuthCtx.Provider value={{ user, authErr, setAuthErr, signUp, signIn, signInGoogle, signOut, resetPassword }}>
      {children}
    </AuthCtx.Provider>
  );
}

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, githubProvider, signInWithPopup, signOut as fbSignOut, isPlaceholder } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (isPlaceholder || !auth || !googleProvider) {
      alert("⚠️ Firebase is currently in Restricted Demo Mode because your public environment variables inside 'frontend/.env.local' are still placeholders.\n\nPlease replace them with your actual Firebase project keys to enable live Google Authentication popups!");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Firebase Auth Google Error:", error);
    }
  };

  const signInWithGithub = async () => {
    if (isPlaceholder || !auth || !githubProvider) {
      alert("⚠️ Firebase is currently in Restricted Demo Mode because your public environment variables inside 'frontend/.env.local' are still placeholders.\n\nPlease replace them with your actual Firebase project keys to enable live GitHub Authentication popups!");
      return;
    }
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error) {
      console.error("Firebase Auth GitHub Error:", error);
    }
  };

  const signOut = async () => {
    if (!auth) {
      setUser(null);
      return;
    }
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error("Firebase SignOut Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithGithub, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

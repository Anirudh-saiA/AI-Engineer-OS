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
  signInMockDeveloper: () => void;
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
    } catch (error: any) {
      console.error("Firebase Auth Google Error:", error);
      if (error.code === "auth/account-exists-with-different-credential") {
        alert("🔒 Account exists with a different credential!\n\nYou have already signed in with a different provider (likely GitHub) using the same email address.\n\nTo allow both, please go to Firebase Console -> Authentication -> Settings -> User sign-in method -> Link accounts, and select 'Allow creation of multiple accounts with the same email address'.");
      } else if (error.code === "auth/unauthorized-domain") {
        alert("🌐 Unauthorized Domain!\n\nYour deployed domain 'ai-engineer-os-eight.vercel.app' is not authorized in your Firebase Project yet.\n\nTo fix this:\n1. Go to Firebase Console -> Authentication -> Settings tab.\n2. In the 'Authorized domains' section, click 'Add domain'.\n3. Enter 'ai-engineer-os-eight.vercel.app' and click Save.\n\nThis will instantly enable live Google logins on your website!");
      } else if (error.code !== "auth/popup-closed-by-user") {
        alert(`❌ Authentication Error: ${error.message || "An unknown error occurred."}`);
      }
    }
  };

  const signInWithGithub = async () => {
    if (isPlaceholder || !auth || !githubProvider) {
      alert("⚠️ Firebase is currently in Restricted Demo Mode because your public environment variables inside 'frontend/.env.local' are still placeholders.\n\nPlease replace them with your actual Firebase project keys to enable live GitHub Authentication popups!");
      return;
    }
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error: any) {
      console.error("Firebase Auth GitHub Error:", error);
      if (error.code === "auth/account-exists-with-different-credential") {
        alert("🔒 Account exists with a different credential!\n\nYou have already signed in with a different provider (likely Google) using the same email address.\n\nTo allow both, please go to Firebase Console -> Authentication -> Settings -> User sign-in method -> Link accounts, and select 'Allow creation of multiple accounts with the same email address'.");
      } else if (error.code === "auth/unauthorized-domain") {
        alert("🌐 Unauthorized Domain!\n\nYour deployed domain 'ai-engineer-os-eight.vercel.app' is not authorized in your Firebase Project yet.\n\nTo fix this:\n1. Go to Firebase Console -> Authentication -> Settings tab.\n2. In the 'Authorized domains' section, click 'Add domain'.\n3. Enter 'ai-engineer-os-eight.vercel.app' and click Save.\n\nThis will instantly enable live GitHub logins on your website!");
      } else if (error.code !== "auth/popup-closed-by-user") {
        alert(`❌ Authentication Error: ${error.message || "An unknown error occurred."}`);
      }
    }
  };

  const signOut = async () => {
    if (!auth) {
      setUser(null);
      return;
    }
    try {
      await fbSignOut(auth);
    } catch (error: any) {
      console.error("Firebase SignOut Error:", error);
    }
  };

  const signInMockDeveloper = () => {
    const mockUser = {
      uid: "mock_developer_uid",
      email: "mock-developer@aios.dev",
      displayName: "Mock Developer",
      photoURL: null,
    } as any;
    setUser(mockUser);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithGithub, signOut, signInMockDeveloper }}>
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

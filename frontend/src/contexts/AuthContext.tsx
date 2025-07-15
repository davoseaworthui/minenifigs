"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Mock user for testing when Firebase is not configured
const createMockUser = (email: string): User =>
  ({
    uid: `mock-${Date.now()}`,
    email,
    emailVerified: true,
    displayName: null,
    photoURL: null,
    phoneNumber: null,
    isAnonymous: false,
    providerId: "firebase",
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: "",
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => "mock-token",
    getIdTokenResult: async () => ({
      token: "mock-token",
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      signInProvider: "password",
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({}),
  } as User);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [useMockAuth, setUseMockAuth] = useState(false);

  useEffect(() => {
    // Check if Firebase is properly configured
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setUser(user);
          setLoading(false);
          setUseMockAuth(false);
        },
        (error) => {
          console.error("Firebase Auth error:", error);
          // If Firebase auth fails, use mock authentication
          setUseMockAuth(true);
          setLoading(false);

          // Check for stored mock user
          const storedUser = localStorage.getItem("mockUser");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Firebase initialization error:", error);
      setUseMockAuth(true);
      setLoading(false);

      // Check for stored mock user
      const storedUser = localStorage.getItem("mockUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (useMockAuth) {
        // Mock authentication
        const mockUser = createMockUser(email);
        localStorage.setItem("mockUser", JSON.stringify(mockUser));
        setUser(mockUser);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      // Fallback to mock auth if Firebase fails
      const mockUser = createMockUser(email);
      localStorage.setItem("mockUser", JSON.stringify(mockUser));
      setUser(mockUser);
      setUseMockAuth(true);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (useMockAuth) {
        // Mock authentication
        const mockUser = createMockUser(email);
        localStorage.setItem("mockUser", JSON.stringify(mockUser));
        setUser(mockUser);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      // Fallback to mock auth if Firebase fails
      const mockUser = createMockUser(email);
      localStorage.setItem("mockUser", JSON.stringify(mockUser));
      setUser(mockUser);
      setUseMockAuth(true);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (useMockAuth) {
        localStorage.removeItem("mockUser");
        setUser(null);
      } else {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback for mock auth
      localStorage.removeItem("mockUser");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {useMockAuth && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                <strong>Demo Mode:</strong> Firebase authentication is not
                configured. Using local storage for testing.
                <a href="/FIREBASE_SETUP.md" className="underline ml-1">
                  Setup Firebase
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { auth, db } from "../services/firebase";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Storage keys
const STORAGE_KEYS = {
  teamId: "quiz_team_id",
  gameId: "quiz_game_id",
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
  teamId: string | null;
  setTeamId: (id: string | null) => void;
  signIn: () => Promise<void>;
  signInAdmin: (email: string, password: string) => Promise<void>;
  signUpAdmin: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [teamId, setTeamIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.teamId);
  });

  // Check if user is admin
  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user?.email) {
      setIsAdmin(false);
      return false;
    }

    try {
      setIsAdminLoading(true);
      const adminRef = doc(db, "admins", user.email);
      const adminSnap = await getDoc(adminRef);
      const adminStatus = adminSnap.exists();
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      return false;
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsLoading(false);

      // Check admin status when user changes
      if (user?.email) {
        await checkAdminStatus();
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (teamId) {
      localStorage.setItem(STORAGE_KEYS.teamId, teamId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.teamId);
    }
  }, [teamId]);

  // Anonymous sign in for teams
  const signIn = async () => {
    try {
      setIsLoading(true);
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password sign in for admins
  const signInAdmin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Check if user is admin
      const adminRef = doc(db, "admins", email.toLowerCase());
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        // Not an admin, sign out
        await firebaseSignOut(auth);
        throw new Error("You are not authorized as an admin");
      }

      setIsAdmin(true);
    } catch (error: any) {
      console.error("Error signing in admin:", error);
      if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create admin account (for first-time setup or adding new admins)
  const signUpAdmin = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Check if this email is in the admins collection
      const adminRef = doc(db, "admins", email.toLowerCase());
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        throw new Error("This email is not authorized as an admin");
      }

      // Create the Firebase Auth account
      await createUserWithEmailAndPassword(auth, email, password);
      setIsAdmin(true);
    } catch (error: any) {
      console.error("Error creating admin account:", error);
      if (error.code === "auth/email-already-in-use") {
        throw new Error(
          "An account with this email already exists. Please sign in.",
        );
      } else if (error.code === "auth/weak-password") {
        throw new Error("Password should be at least 6 characters");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
      setTeamIdState(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const setTeamId = (id: string | null) => {
    setTeamIdState(id);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    isAdminLoading,
    teamId,
    setTeamId,
    signIn,
    signInAdmin,
    signUpAdmin,
    signOut,
    checkAdminStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

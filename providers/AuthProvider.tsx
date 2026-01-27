import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { authApi } from '../services/api/auth';
import { useRouter, useSegments } from 'expo-router';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  roles: string[];
  isLoading: boolean;
  isAdmin: boolean;
  isVolunteer: boolean;
  isDisabledPerson: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  roles: [],
  isLoading: true,
  isAdmin: false,
  isVolunteer: false,
  isDisabledPerson: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// This hook handles protecting routes based on auth status
function useProtectedRoute(user: User | null, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)'; // If we had an (auth) group
    // Ideally we check if the user is in the login screen.
    // For now, let's assume 'auth/login' is the path.
    const inLogin = segments[0] === 'auth' && segments[1] === 'login';

    if (!user && !inLogin) {
      // Redirect to login if not authenticated and not already on login
      router.replace('/auth/login');
    } else if (user && inLogin) {
      // Redirect to home if authenticated and trying to access login
      router.replace('/');
    }
  }, [user, segments, isLoading]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const data = await authApi.getMe();
      if (data) {
        setRoles(data.roles || []);
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
    }
  };

  useEffect(() => {
    // Check active sessions and subscribes to updates
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // If we just logged in, fetch profile
        if (!user) { // optimization
           setIsLoading(true);
           refreshProfile().finally(() => setIsLoading(false));
        }
      } else {
        setRoles([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // useProtectedRoute(user, isLoading); 
  // Note: We might want to disable this inside the provider and use it in the layout 
  // to avoid circular dependencies if layout uses AuthProvider.
  // Ideally, the layout wraps the app with AuthProvider, and a child component handles routing.
  // But for simplicity in Expo Router, we can handle it here or in a separate "AuthGuard" component.

  const signOut = async () => {
    await authApi.logout();
    setSession(null);
    setUser(null);
    setRoles([]);
  };

  const isAdmin = roles.includes('admin');
  const isVolunteer = roles.includes('volunteer');
  const isDisabledPerson = roles.includes('disabled_person');

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        roles,
        isLoading,
        isAdmin,
        isVolunteer,
        isDisabledPerson,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

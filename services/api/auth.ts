import { supabase } from '../supabase';
import { handleSupabaseError, unwrap } from '../utils/errors';

export const authApi = {
  // 1. Register
  register: async (email: string, password: string, fullName: string) => {
    // Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // Saved to user_metadata, triggers will handle profile sync if configured
      },
    });

    if (authError) handleSupabaseError(authError);
    return authData.user;
  },

  // 2. Login
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) handleSupabaseError(error);
    return data.session;
  },

  // 3. Logout
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) handleSupabaseError(error);
  },

  // 4. Get Current Session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) handleSupabaseError(error);
    return data.session;
  },

  // 5. Get Composite Profile (Phase 3 Requirement: profiles + user_roles)
  getMe: async () => {
    // Get user ID first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) handleSupabaseError(userError);
    if (!user) return null;

    // Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) handleSupabaseError(profileError);

    // Fetch Roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) handleSupabaseError(rolesError);

    const roles = rolesData ? rolesData.map((r) => r.role) : [];

    return {
      ...profile,
      roles,
    };
  },
};

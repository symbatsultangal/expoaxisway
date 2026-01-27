import { supabase } from '../supabase';
import { handleSupabaseError, unwrap } from '../utils/errors';

export const volunteersApi = {
  // 1. Get Feed
  // In a real app, we'd use PostGIS for "radius_km".
  // For this schema, we'll fetch 'created' requests and filter client-side or assume
  // backend View does it. Using simple pagination here.
  getFeed: async (limit = 20) => {
    const { data, error } = await supabase
      .from('help_requests')
      .select(`
        id,
        description,
        complexity_level,
        is_emergency,
        origin_latitude,
        origin_longitude,
        created_at,
        requester:profiles(full_name, avatar_url)
      `)
      .eq('status', 'created') // Only show open requests
      .order('created_at', { ascending: false })
      .limit(limit);

    return unwrap(data, error);
  },

  // 2. Apply to Request
  apply: async (requestId: string, volunteerId: string) => {
    const { data, error } = await supabase
      .from('help_request_volunteers')
      .insert({
        request_id: requestId,
        volunteer_id: volunteerId,
        is_accepted: false
      })
      .select()
      .single();

    return unwrap(data, error);
  },

  // 3. Get My Assignments
  getMyAssignments: async (volunteerId: string, status?: 'active' | 'history') => {
    // This is complex because we need to filter by the *parent request's* status
    // Supabase allows filtering on joined tables!
    
    let requestStatusFilter = status === 'active' 
      ? ['accepted', 'in_progress'] 
      : ['completed', 'cancelled'];
      
    // If no status provided, maybe return all?
    // Let's stick to the joined filter.
    
    const { data, error } = await supabase
      .from('help_request_volunteers')
      .select(`
        id,
        is_accepted,
        request:help_requests!inner(
          id,
          description,
          status,
          started_at,
          completed_at,
          requester:profiles(full_name, phone:user_private_info(phone_number))
        )
      `)
      .eq('volunteer_id', volunteerId)
      .eq('is_accepted', true) // Only actual assignments
      .in('request.status', requestStatusFilter)
      .order('created_at', { ascending: false });

    return unwrap(data, error);
  }
};

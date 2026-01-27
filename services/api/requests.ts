import { supabase } from '../supabase';
import { handleSupabaseError, unwrap } from '../utils/errors';

// Types (Ideally imported from generated types, locally defined for now)
export interface CreateRequestParams {
  description: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  complexity_level: number;
  is_emergency?: boolean;
}

export const requestsApi = {
  // 1. Create Request
  create: async (userId: string, params: CreateRequestParams) => {
    const { data, error } = await supabase
      .from('help_requests')
      .insert({
        requester_id: userId,
        ...params,
        status: 'created',
      })
      .select()
      .single();

    return unwrap(data, error);
  },

  // 2. List My Requests
  listMine: async (userId: string, status?: string) => {
    let query = supabase
      .from('help_requests')
      .select(`
        *,
        volunteers:help_request_volunteers(
           id,
           is_accepted,
           volunteer:profiles(id, full_name, avatar_url)
        )
      `)
      .eq('requester_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    return unwrap(data, error);
  },

  // 3. Get Request Details (with Candidates)
  getDetails: async (requestId: string) => {
     const { data, error } = await supabase
       .from('help_requests')
       .select(`
         *,
         candidates:help_request_volunteers(
           id,
           volunteer_id,
           is_accepted,
           volunteer:profiles(id, full_name, avatar_url,
             stats:volunteers(accumulated_seconds, is_verified)
           )
         )
       `)
       .eq('id', requestId)
       .single();
       
     return unwrap(data, error);
  },

  // 4. Accept Volunteer
  // NOTE: Phase 3 spec recommends RPC 'accept_volunteer'. 
  // Since the schema lacks this RPC, we implement the logic via client-side RLS operations.
  // The trigger 'update_request_on_accept' in schema.sql will automatically 
  // update the parent help_request status to 'accepted'.
  acceptVolunteer: async (requestId: string, volunteerId: string) => {
    // We update the specific volunteer application row
    const { data, error } = await supabase
      .from('help_request_volunteers')
      .update({ is_accepted: true })
      .eq('request_id', requestId)
      .eq('volunteer_id', volunteerId)
      .select() // Select to verify it worked (RLS might return empty if not allowed)
      .single();

    return unwrap(data, error);
  },

  // 5. Cancel Request
  // Using update per RLS policy
  cancelRequest: async (requestId: string, userId: string, reason: string) => {
    const { data, error } = await supabase
      .from('help_requests')
      .update({
        status: 'cancelled',
        cancelled_by: userId,
        cancellation_reason: reason
      })
      .eq('id', requestId)
      .select()
      .single();

    return unwrap(data, error);
  },

  // 6. Complete Request
  completeRequest: async (requestId: string) => {
    const { data, error } = await supabase
      .from('help_requests')
      .update({
        status: 'completed'
      })
      .eq('id', requestId)
      .select()
      .single();

    return unwrap(data, error);
  }
};

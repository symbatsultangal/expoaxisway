import { supabase } from '../supabase';
import { handleSupabaseError, unwrap } from '../utils/errors';

export const adminApi = {
  // 1. Verify Disability
  // RLS for user_disabilities does not have an "Admin update" policy in the provided schema.
  // Therefore, we MUST use the RPC defined in the design phase, which would be SECURITY DEFINER.
  verifyDisability: async (userDisabilityId: string, status: 'verified' | 'rejected', notes?: string) => {
    const { data, error } = await supabase
      .rpc('admin_verify_disability', { 
        disability_row_id: userDisabilityId, 
        new_status: status,
        admin_notes: notes 
      });

    return unwrap(data, error);
  },

  // 2. Verify Volunteer
  // RLS policy "Admin manage volunteers" exists, so we can update directly.
  verifyVolunteer: async (volunteerId: string, status: boolean, notes?: string) => {
    const { data, error } = await supabase
      .from('volunteers')
      .update({ 
        is_verified: status,
        verification_notes: notes
      })
      .eq('user_id', volunteerId)
      .select()
      .single();

    return unwrap(data, error);
  },
  
  // 3. Create Place (Admin/Partner)
  createPlace: async (placeData: any) => {
     const { data, error } = await supabase
       .from('places')
       .insert(placeData)
       .select()
       .single();
       
     return unwrap(data, error);
  }
};

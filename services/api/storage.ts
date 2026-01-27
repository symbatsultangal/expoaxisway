import { supabase } from '../supabase';
import { handleSupabaseError, unwrap } from '../utils/errors';

// Helper to convert URI to Blob (needed for React Native / Web compatibility)
// In a real generic implementation, we'd handle File vs Blob vs ArrayBuffer
export const storageApi = {
  uploadProof: async (userId: string, file: Blob | File | ArrayBuffer, fileName: string) => {
    // Construct path: proofs/{user_id}/{timestamp}_{filename}
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `proofs/${userId}/${timestamp}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('proofs') // Assumes bucket 'proofs' exists per Phase 4
      .upload(path, file, {
        upsert: false
      });

    if (error) handleSupabaseError(error);

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('proofs')
      .getPublicUrl(path);

    return { path, publicUrl };
  }
};

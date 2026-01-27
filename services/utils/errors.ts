import { PostgrestError } from '@supabase/supabase-js';

export class ApiError extends Error {
  status: number;
  originalError: PostgrestError | Error | null;

  constructor(message: string, status: number, originalError: PostgrestError | Error | null = null) {
    super(message);
    this.status = status;
    this.originalError = originalError;
  }
}

export function handleSupabaseError(error: PostgrestError | Error | null): never {
  if (!error) {
    throw new ApiError('Unknown error occurred', 500);
  }

  // Handle PostgrestErrors
  if ('code' in error) {
    switch (error.code) {
      case 'PGRST116': // Row not found (when .single() is used)
        throw new ApiError('Resource not found', 404, error);
      case '42501': // RLS Violation
        throw new ApiError('Permission denied', 403, error);
      case '23505': // Unique violation
        throw new ApiError('Resource already exists', 409, error);
      case '23514': // Check violation
        throw new ApiError('Validation failed', 422, error);
      default:
        throw new ApiError(error.message, 500, error);
    }
  }

  // Handle standard JS Errors
  throw new ApiError(error.message, 500, error);
}

// Helper to safely unwrap Supabase response
export function unwrap<T>(data: T | null, error: PostgrestError | null): T {
  if (error) {
    handleSupabaseError(error);
  }
  
  if (data === null) {
    // This case usually happens with .single() combined with handleSupabaseError(PGRST116)
    // But if we get here without error, it might be a void return
    return null as T;
  }
  
  return data;
}

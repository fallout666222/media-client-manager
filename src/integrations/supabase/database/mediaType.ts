
import { supabase } from '../client';

export const getMediaTypes = async () => {
  return await supabase.from('media_types').select('*');
};

export const createMediaType = async (mediaType: { name: string, description?: string }) => {
  return await supabase.from('media_types').insert(mediaType).select().single();
};

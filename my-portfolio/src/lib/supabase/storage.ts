import { createClient } from './client';

export async function uploadFile(file: File): Promise<string | null> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('portfolio-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError.message);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from('portfolio-assets')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

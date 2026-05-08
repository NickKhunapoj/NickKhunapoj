import { createClient } from './client';

const BUCKET_NAME = 'portfolio-assets';

function getStoragePathFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) return null;

    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export async function uploadFile(file: File): Promise<string | null> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError.message);
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

export async function deleteStoredFile(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;

  const path = getStoragePathFromUrl(url);
  if (!path) return false;

  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    console.error('Error deleting file:', error.message);
    throw new Error(error.message);
  }

  return true;
}

export async function deleteStoredFiles(urls: Array<string | null | undefined>) {
  const paths = Array.from(new Set(urls.map((url) => url ? getStoragePathFromUrl(url) : null).filter(Boolean))) as string[];
  if (paths.length === 0) return false;

  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);

  if (error) {
    console.error('Error deleting files:', error.message);
    throw new Error(error.message);
  }

  return true;
}

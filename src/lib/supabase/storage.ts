import { createClient } from "./client";

const BUCKET = "încărcări";

export async function uploadFile(
  file: File,
  folder: string
): Promise<{ url: string; path: string } | null> {
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  // Try public URL first, fall back to signed URL for private buckets
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  if (urlData?.publicUrl) {
    return { url: urlData.publicUrl, path: data.path };
  }

  // Signed URL fallback (valid 1 year)
  const { data: signedData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.path, 365 * 24 * 60 * 60);

  return {
    url: signedData?.signedUrl || "",
    path: data.path,
  };
}

export async function deleteFile(path: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  return !error;
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/utils";

export async function uploadTaskPhoto(
  file: File,
  taskId: string,
  userId: string
): Promise<{ url: string; path: string }> {
  const supabase = createClient();
  
  // 1. Compress image using canvas
  const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });

  // 2. Generate unique filename
  const ext = "jpg";
  const filename = `${userId}/${taskId}/${Date.now()}.${ext}`;

  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("task-proofs")
    .upload(filename, compressed, { contentType: "image/jpeg", upsert: false });

  if (error) throw error;

  // 4. Get signed URL (valid 24h for security)
  const { data: signedUrl } = await supabase.storage
    .from("task-proofs")
    .createSignedUrl(filename, 86400);

  if (!signedUrl) throw new Error("Failed to create signed URL");

  return { url: signedUrl.signedUrl, path: filename };
}

export async function getPhotoUrl(path: string): Promise<string> {
  const supabase = createClient();
  
  const { data } = await supabase.storage
    .from("task-proofs")
    .createSignedUrl(path, 86400);
  
  if (!data) throw new Error("Failed to get photo URL");
  
  return data.signedUrl;
}

export async function deletePhoto(path: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from("task-proofs")
    .remove([path]);
  
  if (error) throw error;
}

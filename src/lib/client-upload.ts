"use client";

import { createClient } from "@/lib/supabase/client";

const LIMITS = {
  "employee-photos": {
    maxBytes: 2 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp"],
    label: "JPEG, PNG ou WebP, 2 Mo max",
  },
  "organization-logos": {
    maxBytes: 2 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp"],
    label: "JPEG, PNG ou WebP, 2 Mo max",
  },
  "expense-receipts": {
    maxBytes: 5 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "application/pdf"],
    label: "JPEG, PNG ou PDF, 5 Mo max",
  },
} as const;

export type UploadBucket = keyof typeof LIMITS;

export function uploadHint(bucket: UploadBucket) {
  return LIMITS[bucket].label;
}

export async function uploadToBucket(bucket: UploadBucket, file: File) {
  const rules = LIMITS[bucket];
  if (!(rules.types as readonly string[]).includes(file.type)) {
    throw new Error(`Format non accepté. ${rules.label}`);
  }
  if (file.size > rules.maxBytes) {
    throw new Error(`Fichier trop volumineux. ${rules.label}`);
  }

  const supabase = createClient();
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();
  if (orgError || !org) throw new Error("Organisation introuvable");

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${org.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Props:
//   • currentUrl        — the existing image URL (for edit mode pre-fill)
//   • onUploadComplete  — callback fired when the upload succeeds.
//                         The parent form receives the new public URL and
//                         stores it in its own state.
//
// Teaching note:
//   This component is "controlled" from the outside via a callback.
//   It does NOT manage the form's imageUrl state itself — it tells the
//   parent what the new URL is and lets the parent decide what to do.
//   This is the standard React "lifting state up" pattern.
// ---------------------------------------------------------------------------
interface ImageUploadFieldProps {
  currentUrl: string;
  onUploadComplete: (publicUrl: string) => void;
}

export default function ImageUploadField({
  currentUrl,
  onUploadComplete,
}: ImageUploadFieldProps) {
  // Local state — just for this component's UI
  const [preview, setPreview] = useState<string>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<"idle" | "uploading" | "done">("idle");

  // A ref to the hidden <input type="file"> — clicking the styled button
  // programmatically triggers the file picker without any visible input.
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ---- Client-side validation ----
    // These checks run immediately in the browser, before any network call.
    // Server-side validation in Supabase Storage policies is the real guard.
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setError(null);

    // ---- Show an instant local preview ----
    // URL.createObjectURL() creates a temporary browser-local URL that
    // points to the file in memory. It's instant — no upload needed yet.
    // We show this immediately so the UI feels responsive.
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setProgress("uploading");
    setUploading(true);

    // ---- Upload to Supabase Storage ----
    // We generate a unique filename using a timestamp + original name.
    // Spaces are replaced with hyphens to avoid URL encoding issues.
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const { data, error: uploadError } = await supabase.storage
      .from("artwork-images")   // the bucket name we created in the dashboard
      .upload(fileName, file, {
        upsert: false,          // fail if the filename already exists (safety)
      });

    setUploading(false);

    if (uploadError) {
      // Upload failed — revert the preview and show the error
      setError(uploadError.message);
      setPreview(currentUrl);
      setProgress("idle");
      return;
    }

    // ---- Get the public URL ----
    // Supabase Storage gives us a stable, permanent public URL for the file.
    // This is what we store in our `artworks.image_url` database column.
    const { data: urlData } = supabase.storage
      .from("artwork-images")
      .getPublicUrl(data.path);

    setProgress("done");

    // Fire the callback so the parent form updates its imageUrl state
    onUploadComplete(urlData.publicUrl);
  };

  return (
    <div className="space-y-3">
      {/* Image Preview */}
      {preview && (
        <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden bg-gallery-subtle border border-gallery-border">
          <Image
            src={preview}
            alt="Artwork preview"
            fill
            className="object-cover"
            unoptimized={preview.startsWith("blob:")} // blob: URLs are local — skip Next.js optimisation
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Upload progress overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-xs uppercase tracking-widest">
                  Uploading…
                </p>
              </div>
            </div>
          )}
          {/* Success indicator */}
          {progress === "done" && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-full">
              ✓ Saved
            </div>
          )}
        </div>
      )}

      {/* Upload trigger button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-3 border-2 border-dashed border-gallery-border text-gallery-muted text-sm hover:border-gallery-text hover:text-gallery-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
      >
        {uploading
          ? "Uploading…"
          : preview
          ? "↑ Change Image"
          : "↑ Upload Image"}
      </button>

      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}

      {/* Helper text */}
      <p className="text-xs text-gallery-muted">
        Accepted: JPG, PNG, WebP, GIF · Max size: 5 MB
      </p>
    </div>
  );
}

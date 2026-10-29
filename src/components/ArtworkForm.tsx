"use client";

import { useState } from "react";
import { Artwork } from "@/types";
import { ArtworkInput } from "@/data/artworks";
import ImageUploadField from "@/components/ImageUploadField";
import { useAuth } from "@/context/AuthContext";

// ---------------------------------------------------------------------------
// Props:
//   • initialData — when editing, pre-fills the form with existing artwork data
//   • onSubmit    — called with the form data when the user clicks Save
//   • submitLabel — text on the submit button ("Create Artwork" or "Save Changes")
// ---------------------------------------------------------------------------
interface ArtworkFormProps {
  initialData?: Artwork;
  onSubmit: (data: ArtworkInput) => Promise<void>;
  submitLabel?: string;
}

const MEDIUM_OPTIONS: Artwork["medium"][] = [
  "painting",
  "photography",
  "print",
  "sculpture",
];

export default function ArtworkForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
}: ArtworkFormProps) {
  // ---- form state (pre-filled when editing) ----
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [medium, setMedium] = useState<Artwork["medium"]>(
    initialData?.medium ?? "painting"
  );
  const [dimensions, setDimensions] = useState(initialData?.dimensions ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [year, setYear] = useState(
    initialData?.year?.toString() ?? new Date().getFullYear().toString()
  );
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [collections, setCollections] = useState(
    initialData?.collections?.join(", ") ?? ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- AI assist: generate a description + tags from the uploaded image ----
  // The browser never talks to the AI provider directly — it calls OUR API
  // route, which holds the secret key. We send the user's Supabase access
  // token so the server knows who is asking.
  const { session } = useAuth();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ imageUrl, title, medium }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDescription(data.description);
      // Merge AI tags with any collections the artist already typed
      const existing = collections.split(",").map((c) => c.trim()).filter(Boolean);
      setCollections([...new Set([...existing, ...data.tags])].join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client-side validation
    if (!title.trim()) return setError("Title is required.");
    if (!price || isNaN(Number(price)) || Number(price) <= 0)
      return setError("Enter a valid price.");
    if (!year || isNaN(Number(year)))
      return setError("Enter a valid year.");
    if (!imageUrl.trim()) return setError("Please upload an image for this artwork.");

    setSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        artistId: initialData?.artistId ?? "", // set by the page (current user's artist ID)
        medium,
        dimensions: dimensions.trim(),
        price: Number(price),
        year: Number(year),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        collections: collections
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // Shared input styling
  const inputClass =
    "w-full px-4 py-3 bg-white border border-gallery-border rounded-sm text-gallery-text placeholder:text-gallery-muted/50 focus:outline-none focus:border-gallery-accent transition-colors text-sm";
  const labelClass =
    "block text-xs uppercase tracking-widest text-gallery-muted mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="artwork-title" className={labelClass}>
          Title *
        </label>
        <input
          id="artwork-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sunset Over Mountains"
          className={inputClass}
          required
        />
      </div>

      {/* Medium & Year — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="artwork-medium" className={labelClass}>
            Medium *
          </label>
          <select
            id="artwork-medium"
            value={medium}
            onChange={(e) => setMedium(e.target.value as Artwork["medium"])}
            className={inputClass}
          >
            {MEDIUM_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="artwork-year" className={labelClass}>
            Year *
          </label>
          <input
            id="artwork-year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2024"
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Dimensions & Price — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="artwork-dimensions" className={labelClass}>
            Dimensions
          </label>
          <input
            id="artwork-dimensions"
            type="text"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder='e.g. 24" × 36"'
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="artwork-price" className={labelClass}>
            Price (USD) *
          </label>
          <input
            id="artwork-price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="2500"
            className={inputClass}
            required
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className={labelClass}>Artwork Image *</label>
        {/*
          ImageUploadField handles the full upload flow:
            1. User picks a file
            2. Component shows a local preview immediately
            3. File is uploaded to Supabase Storage
            4. onUploadComplete is called with the permanent public URL
            5. We store that URL in our imageUrl state

          The parent (this form) doesn't need to know HOW the upload works —
          it just receives the final URL via the callback.
        */}
        <ImageUploadField
          currentUrl={imageUrl}
          onUploadComplete={(url) => setImageUrl(url)}
        />
      </div>

      {/* Collections (tags) */}
      <div>
        <label htmlFor="artwork-collections" className={labelClass}>
          Collections (comma-separated)
        </label>
        <input
          id="artwork-collections"
          type="text"
          value={collections}
          onChange={(e) => setCollections(e.target.value)}
          placeholder="e.g. new, abstract, featured"
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="artwork-description" className={`${labelClass} mb-0`}>
            Description
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!imageUrl || generating}
            title={imageUrl ? "Write a description and tags from the image" : "Upload an image first"}
            className="text-xs uppercase tracking-widest text-gallery-accent hover:text-gallery-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? "Generating…" : "✨ Generate with AI"}
          </button>
        </div>
        <textarea
          id="artwork-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Tell the story behind this artwork…"
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-gallery-text text-white text-sm uppercase tracking-widest hover:bg-gallery-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

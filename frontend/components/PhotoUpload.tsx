"use client";

import { useRef, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, checked before compression
const MAX_DIMENSION = 400;
const JPEG_QUALITY = 0.8;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function PhotoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUri: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after removing it
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPG or PNG image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be under 5MB.");
      return;
    }

    setProcessing(true);
    try {
      const dataUri = await resizeAndCompress(file);
      onChange(dataUri);
    } catch {
      setError("Could not process that image. Try a different file.");
    } finally {
      setProcessing(false);
    }
  }

  function handleRemove() {
    onChange("");
    setError(null);
  }

  return (
    <div className="flex items-center gap-4">
      {value ? (
        <img
          src={value}
          alt="CV profile"
          className="h-20 w-20 rounded-full border border-border object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-center text-[11px] leading-tight text-muted">
          No photo
        </div>
      )}

      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={processing}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:border-accent-text hover:text-accent-text disabled:opacity-50"
          >
            {processing ? "Processing…" : value ? "Change photo" : "Upload photo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="mt-1.5 text-xs text-muted">JPG or PNG, up to 5MB. Resized automatically.</p>
        {error && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function resizeAndCompress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

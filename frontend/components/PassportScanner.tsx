"use client";

import { useRef, useState } from "react";
import { apiPost, ApiError } from "@/lib/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const UNSUPPORTED_TYPE_ERROR = "Please upload a JPG, PNG, WEBP, or PDF file.";

export interface PassportScanResult {
  full_name: string;
  passport_number: string;
  nationality: string;
  dob: string; // "DD MMM YYYY"
  sex: string;
  expiry_date: string; // "DD MMM YYYY"
  issuing_country: string;
  permanent_address: string | null;
  mrz_read: boolean;
  checksums_valid: boolean;
}

interface ScanApiResponse extends PassportScanResult {
  scan_images: string[]; // bio-data page first, address page (if any) second
}

interface PassportScannerProps {
  bioImage: string;
  addressImage: string;
  onImagesChange: (bioImage: string, addressImage: string) => void;
  onScanResult: (result: PassportScanResult) => void;
}

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return UNSUPPORTED_TYPE_ERROR;
  if (file.size > MAX_FILE_SIZE) return "Each file must be under 10MB.";
  return null;
}

export default function PassportScanner({
  bioImage,
  addressImage,
  onImagesChange,
  onScanResult,
}: PassportScannerProps) {
  const [bioFile, setBioFile] = useState<{ name: string; dataUri: string; mimeType: string } | null>(
    null
  );
  const [addressFile, setAddressFile] = useState<{
    name: string;
    dataUri: string;
    mimeType: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const bioInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  async function handlePick(
    e: React.ChangeEvent<HTMLInputElement>,
    slot: "bio" | "address"
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const dataUri = await readAsDataUri(file);
      const picked = { name: file.name, dataUri, mimeType: file.type };
      if (slot === "bio") setBioFile(picked);
      else setAddressFile(picked);
    } catch {
      setError("Could not read that file. Try a different one.");
    }
  }

  async function handleScan() {
    if (!bioFile) return;
    setScanning(true);
    setError(null);

    const images = [bioFile, ...(addressFile ? [addressFile] : [])].map((f) => ({
      mime_type: f.mimeType,
      data: f.dataUri,
    }));

    try {
      const result = await apiPost<ScanApiResponse>("/cvs/scan-passport/", { images });
      const { scan_images, ...fields } = result;
      onImagesChange(scan_images[0] ?? bioImage, scan_images[1] ?? addressImage);
      onScanResult(fields);
      setBioFile(null);
      setAddressFile(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not scan that passport. Try a clearer photo or a different file."
      );
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="mb-4 rounded-md border border-border p-4">
      <p className="mb-1 text-sm font-medium text-foreground">📷 Scan Passport</p>
      <p className="mb-3 text-xs text-muted">
        Upload a photo or PDF of your passport&apos;s bio-data page to auto-fill the fields below.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UploadSlot
          label="Bio-data page (required)"
          inputRef={bioInputRef}
          picked={bioFile}
          storedImage={bioImage}
          onPick={(e) => handlePick(e, "bio")}
          onClear={() => setBioFile(null)}
          onRemoveStored={() => onImagesChange("", addressImage)}
        />
        <UploadSlot
          label="Address page (if separate)"
          inputRef={addressInputRef}
          picked={addressFile}
          storedImage={addressImage}
          onPick={(e) => handlePick(e, "address")}
          onClear={() => setAddressFile(null)}
          onRemoveStored={() => onImagesChange(bioImage, "")}
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleScan}
          disabled={!bioFile || scanning}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-50"
        >
          {scanning ? "Scanning…" : "Scan Passport"}
        </button>
        {error && <p className="text-xs text-red-700 dark:text-red-400">{error}</p>}
      </div>

      <p className="mt-3 text-xs text-muted">
        Your passport photos are stored securely with your CV and are only visible to you. They
        will not appear in exported PDF/Word documents.
      </p>
    </div>
  );
}

function UploadSlot({
  label,
  inputRef,
  picked,
  storedImage,
  onPick,
  onClear,
  onRemoveStored,
}: {
  label: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  picked: { name: string; dataUri: string; mimeType: string } | null;
  storedImage: string;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onRemoveStored: () => void;
}) {
  const previewSrc = picked && picked.mimeType !== "application/pdf" ? picked.dataUri : null;

  return (
    <div className="rounded-md border border-dashed border-border p-3">
      <p className="mb-2 text-xs font-medium text-foreground/80">{label}</p>

      {storedImage && !picked && (
        <div className="mb-2 flex items-center gap-2">
          <img
            src={storedImage}
            alt="Stored passport scan"
            className="h-16 w-16 rounded border border-border object-cover"
          />
          <button
            type="button"
            onClick={onRemoveStored}
            className="text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove scan
          </button>
        </div>
      )}

      {picked && (
        <div className="mb-2 flex items-center gap-2">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Selected file preview"
              className="h-16 w-16 rounded border border-border object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-border text-center text-[10px] leading-tight text-muted">
              PDF
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs text-foreground">{picked.name}</p>
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:border-accent-text hover:text-accent-text"
      >
        {storedImage || picked ? "Choose different file" : "Choose file"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}

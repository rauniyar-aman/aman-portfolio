"use client";

import { useState } from "react";

const tabButtonClass = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
    active
      ? "border-accent-text bg-accent-soft text-accent-text"
      : "border-border text-muted hover:border-accent-text/50"
  }`;

export default function PassportPreviewPanel({
  bioImage,
  addressImage,
  sticky = true,
}: {
  bioImage: string;
  addressImage: string;
  sticky?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"bio" | "address">("bio");

  const hasBoth = Boolean(bioImage) && Boolean(addressImage);
  const activeImage = activeTab === "address" && addressImage ? addressImage : bioImage || addressImage;

  return (
    <div className={sticky ? "sticky top-20" : undefined}>
      <div className="rounded-md border border-border bg-surface">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-foreground">Passport Preview</span>
          <span className="text-muted">{open ? "−" : "+"}</span>
        </button>
        <p className="px-4 pb-3 text-xs text-muted">Compare these fields against your passport</p>

        {open && (
          <div className="border-t border-border p-4">
            {hasBoth && (
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("bio")}
                  className={tabButtonClass(activeTab === "bio")}
                >
                  Bio-data page
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("address")}
                  className={tabButtonClass(activeTab === "address")}
                >
                  Address page
                </button>
              </div>
            )}
            {activeImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeImage}
                alt="Passport scan"
                className="w-full rounded border border-border object-contain"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { VehicleImage } from "@/components/vehicles/VehicleImage";
import { fileToResizedDataUrl } from "@/lib/image";
import type { VehicleCategory } from "@/types";

interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Used for the preview when there is no photo yet. */
  color: string;
  category: VehicleCategory;
  name: string;
}

export function ImageUploadField({ value, onChange, color, category, name }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      onChange(await fileToResizedDataUrl(file));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not read that image.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = ""; // allows picking the same file again
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Photo</p>
      <VehicleImage vehicle={{ name: name || "Vehicle", imageUrl: value, color, category }} className="aspect-[16/8] rounded-lg border border-border" />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id="vehicle-photo"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <Button variant="secondary" size="sm" loading={busy} onClick={() => inputRef.current?.click()}>
          <ImagePlus className="size-4" aria-hidden /> {value ? "Replace photo" : "Upload photo"}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange("")}>
            <Trash2 className="size-4" aria-hidden /> Remove
          </Button>
        )}
        <span className="text-xs text-muted-foreground">Optional. Without a photo we show an illustration.</span>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Image, X, Loader2 } from "lucide-react";
import { validateImageFile, cn } from "@/lib/utils";
import { toast } from "sonner";

interface PhotoUploaderProps {
  onPhotoSelect: (file: File) => void;
  previewUrl?: string;
  onClear?: () => void;
  isUploading?: boolean;
}

export function PhotoUploader({
  onPhotoSelect,
  previewUrl,
  onClear,
  isUploading = false,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    onPhotoSelect(file);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e);
  };

  if (previewUrl) {
    return (
      <Card className="overflow-hidden">
        <div className="relative aspect-[4/3] bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {onClear && !isUploading && (
            <button
              onClick={onClear}
              className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleCameraCapture}
      />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
      
      <Button
        type="button"
        variant="outline"
        className="h-20 flex-col gap-2 border-2 border-dashed hover:border-brand-gold hover:bg-brand-gold/5"
        onClick={() => cameraInputRef.current?.click()}
        disabled={isUploading}
      >
        <Camera className="w-6 h-6" />
        <span className="text-xs">Ambil Foto</span>
      </Button>
      
      <Button
        type="button"
        variant="outline"
        className="h-20 flex-col gap-2 border-2 border-dashed hover:border-brand-gold hover:bg-brand-gold/5"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Image className="w-6 h-6" />
        <span className="text-xs">Dari Galeri</span>
      </Button>
    </div>
  );
}

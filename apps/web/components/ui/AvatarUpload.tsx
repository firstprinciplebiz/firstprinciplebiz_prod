"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  userId: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const iconSizes = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function AvatarUpload({
  currentAvatarUrl,
  onUploadComplete,
  onRemove,
  userId,
  size = "lg",
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const supabase = createClient();

      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemove?.();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        {/* Avatar Display */}
        <div
          className={`
            ${sizeClasses[size]} rounded-full overflow-hidden
            bg-slate-100 flex items-center justify-center
            border-4 border-white shadow-lg relative
          `}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile"
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <User className={`${iconSizes[size]} text-slate-400`} />
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Remove Button */}
        {previewUrl && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-0 right-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}

      {/* Helper Text */}
      <p className="mt-2 text-xs text-slate-500 text-center">
        JPG, PNG or WebP. Max 5MB.
      </p>
    </div>
  );
}


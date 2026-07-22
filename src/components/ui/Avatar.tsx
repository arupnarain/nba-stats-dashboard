"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string | null;
  alt: string;
  /** Fallback initials shown when there is no image or it fails to load. */
  fallback: string;
  size?: number;
  rounded?: boolean;
  className?: string;
}

/**
 * Player/entity headshot with graceful fallback. Uses next/image for
 * automatic lazy-loading and sizing; on error we swap to initials so a
 * missing headshot never leaves a broken-image icon.
 */
export function Avatar({
  src,
  alt,
  fallback,
  size = 48,
  rounded = true,
  className,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-surface-2 text-muted",
        rounded ? "rounded-full" : "rounded-md",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          unoptimized
        />
      ) : (
        <span className="text-xs font-semibold">{fallback}</span>
      )}
    </div>
  );
}

/** Initials from a full name, e.g. "Trae Young" -> "TY". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

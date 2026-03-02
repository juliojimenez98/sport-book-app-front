import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon } from "lucide-react";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: React.ReactNode;
  containerClassName?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className,
  containerClassName,
  fallbackIcon,
  ...props
}: ImageWithFallbackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center bg-muted/20 w-full h-full", containerClassName)}>
      {/* Skeleton overlay - only shows while loading */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 w-full h-full">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      )}

      {/* Error state */}
      {hasError ? (
        <div className="absolute inset-0 z-10 bg-muted/30 flex items-center justify-center w-full h-full">
          {fallbackIcon || <ImageIcon className="h-1/2 w-1/2 text-muted-foreground opacity-30" />}
        </div>
      ) : null}

      {/* Actual image - always present so it can load, but visually hidden until ready */}
      {/* Disable hydration mismatch on src by rendering it always */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
    </div>
  );
}

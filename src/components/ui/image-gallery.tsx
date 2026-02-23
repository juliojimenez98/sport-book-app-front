"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ImageIcon, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  fallbackIcon?: React.ReactNode;
  hideThumbnails?: boolean;
  hideOverlay?: boolean;
}

export function ImageGallery({ images, alt = "Image", fallbackIcon, hideThumbnails = false, hideOverlay = false }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If no images exist, show fallback
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary/10 rounded-lg">
        {fallbackIcon ? (
          fallbackIcon
        ) : (
          <ImageIcon className="h-12 w-12 text-primary/30" />
        )}
      </div>
    );
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const openMainImage = () => {
    if (images.length > 0) setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* Main Image View */}
      <div
        className="relative w-full h-full min-h-[160px] bg-muted overflow-hidden group cursor-pointer"
        onClick={openMainImage}
      >
        <img
          src={images[0]} // Always show the first image natively as the cover
          alt={`${alt} cover`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Explicit Expand Button */}
        {images.length > 0 && (
           <Button
             size="icon"
             variant="secondary"
             className="absolute top-2 right-2 h-8 w-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border border-border/50 text-foreground shadow-sm"
             onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openMainImage();
             }}
             title="Expandir imagen"
           >
             <Maximize2 className="h-4 w-4" />
           </Button>
        )}

        {/* Hover Overlay indicating it can be expanded (optional hidden on small cards) */}
        {images.length > 0 && !hideOverlay && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full transition-opacity backdrop-blur-sm">
              Ver galería ({images.length})
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && !hideThumbnails && (
        <div className="flex gap-2 pb-1 overflow-x-auto snap-x scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(idx);
                setIsModalOpen(true);
              }}
              className={cn(
                "relative h-20 w-32 shrink-0 rounded-md overflow-hidden bg-muted snap-start ring-offset-1 ring-offset-background transition-all hover:opacity-90",
              )}
            >
              <img
                src={img}
                alt={`${alt} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Optional darken overlay on thumbnails */}
              <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Expansion Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden bg-black/95 border-border/10 rounded-sm sm:rounded-xl flex flex-col">
          {/* Accessible Title & Description for Screen Readers */}
          <div className="sr-only">
             <DialogTitle>Galería de Imágenes: {alt}</DialogTitle>
             <DialogDescription>
                Explora las imágenes en pantalla completa. Usa las flechas para navegar.
             </DialogDescription>
          </div>
          
          {/* Header area (Close button) */}
          <div className="absolute top-0 right-0 z-50 p-4">
             {/* We manually put the close X so it doesn't conflict with radix default rendering white-on-white */}
             <DialogClose asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full bg-black/20 backdrop-blur-sm">
                   <X className="h-5 w-5" />
                </Button>
             </DialogClose>
          </div>

          <div className="relative flex-1 flex items-center justify-center w-full h-full pt-10 pb-20 px-4 sm:px-12 object-contain">
            <img
              src={images[selectedIndex]}
              alt={`${alt} expanded ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none animate-in fade-in zoom-in-95 duration-200"
              key={selectedIndex} // Force re-render for animation on change
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 bg-black/40 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
          
          {/* Thumbnail Strip inside Modal */}
          {images.length > 1 && (
             <div className="h-24 w-full bg-black flex items-center justify-center border-t border-white/10 shrink-0">
               <div className="flex gap-2 overflow-x-auto px-4 w-full justify-center pb-2 pt-2 scrollbar-hide">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={cn(
                        "relative h-16 w-24 shrink-0 rounded overflow-hidden transition-all",
                        selectedIndex === idx
                          ? "ring-2 ring-primary ring-offset-1 ring-offset-black opacity-100"
                          : "opacity-40 hover:opacity-80"
                      )}
                    >
                      <img
                        src={img}
                        alt={`Modal thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
               </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

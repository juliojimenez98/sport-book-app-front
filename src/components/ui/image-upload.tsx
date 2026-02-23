"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadApi, getAssetUrl } from "@/lib/api/endpoints";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface ImageUploadProps {
  value?: string; // S3 Key or external absolute URL
  onChange: (url: string) => void;
  folder?: string;
  className?: string; // Tailored width/height from parents
}

export function ImageUpload({ value, onChange, folder = "general", className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadApi.uploadImage(file, folder);
      if (res.key) {
        onChange(res.key);
        toast.success("Imagen subida con éxito");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Error al subir la imagen");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("relative w-full overflow-hidden border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent cursor-pointer hover:bg-muted/50", className, value ? "border-transparent" : "border-muted-foreground/20")}>
      
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      {isUploading ? (
        <div className="flex flex-col items-center justify-center space-y-2 p-6 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Subiendo imagen...</span>
        </div>
      ) : value ? (
        <div className="relative w-full h-full group z-10">
          <img
            src={getAssetUrl(value)}
            alt="Upload"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col gap-2">
             <Button
               type="button"
               variant="secondary"
               size="sm"
               className="pointer-events-none"
             >
               Cambiar Imagen
             </Button>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange("");
            }}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90 z-20 shadow-sm transition-transform hover:scale-105"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 p-6 z-10">
          <div className="p-3 bg-muted rounded-full">
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
             <p className="text-sm font-medium">Haz clic o arrastra una imagen</p>
             <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP hasta 5MB</p>
          </div>
        </div>
      )}
    </div>
  );
}

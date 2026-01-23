import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentCaptureProps {
  onCapture: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

export function DocumentCapture({
  onCapture,
  accept = "image/*,application/pdf",
  maxSizeMB = 5,
  disabled = false,
  className,
}: DocumentCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    onCapture(file);
  }, [maxSizeMB, onCapture]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-contain rounded-lg border bg-muted"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Capture */}
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              disabled={disabled || loading}
              className="sr-only"
            />
            <div className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed transition-colors",
              disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"
            )}>
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Camera className="h-8 w-8 text-primary" />
              )}
              <span className="text-sm font-medium">Take Photo</span>
            </div>
          </label>

          {/* File Upload */}
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept={accept}
              onChange={handleInputChange}
              disabled={disabled || loading}
              className="sr-only"
            />
            <div className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed transition-colors",
              disabled ? "opacity-50 cursor-not-allowed" : "hover:border-accent hover:bg-accent/5"
            )}>
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-accent" />
              )}
              <span className="text-sm font-medium">Upload File</span>
            </div>
          </label>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}

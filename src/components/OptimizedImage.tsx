import React, { useState, useEffect, useMemo } from "react";
import {
  getOptimizedImageUrl,
  getBlurPlaceholder,
  getResponsiveImageUrls,
  type ImageTransformOptions,
} from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> {
  src: string | null | undefined;
  alt: string;
  transformOptions?: ImageTransformOptions;
  enableBlur?: boolean;
  fallbackSrc?: string;
  wrapperClassName?: string;
  disableResponsiveSrcSet?: boolean;
}

const DEFAULT_FALLBACK_DATA_URI = "data:image/gif;base64,R0lGODlhAQABAPAAACwAAAAAAQABAAACAkQBADs=";
const optimizedUrlCache = new Map<string, string>();

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  transformOptions = {},
  enableBlur = true,
  fallbackSrc = DEFAULT_FALLBACK_DATA_URI,
  className,
  wrapperClassName,
  onLoad,
  onError,
  disableResponsiveSrcSet = false,
  sizes: sizesProp,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [overrideSrc, setOverrideSrc] = useState<string | null>(null);

  const sanitizedTransformOptions = useMemo<Omit<ImageTransformOptions, "quality" | "dpr">>(() => {
    if (!transformOptions) return {};
    const { quality, dpr, ...rest } = transformOptions;
    return rest;
  }, [transformOptions]);

  const aggressiveOptions = useMemo(() => ({
    quality: "auto:low" as const, // 1. Calidad baja por defecto
    format: "auto" as const,      // 2. Formato AVIF/WebP automático
    dpr: 1.0 as const,            // 3. Bloquea resoluciones Retina (DPR=1.0)
    ...sanitizedTransformOptions,
  }), [sanitizedTransformOptions]);

  const transformKey = useMemo(() => JSON.stringify(aggressiveOptions || {}), [aggressiveOptions]);
  const cacheKey = useMemo(
    () => `${src ?? "__fallback__"}|${fallbackSrc}|${transformKey}`,
    [src, fallbackSrc, transformKey]
  );

  const optimizedSrc = useMemo(() => {
    const imageUrl = src || fallbackSrc;
    if (!imageUrl) return "";
    if (optimizedUrlCache.has(cacheKey)) {
      return optimizedUrlCache.get(cacheKey)!;
    }
    const optimized = getOptimizedImageUrl(imageUrl, aggressiveOptions);
    if (optimized) {
      optimizedUrlCache.set(cacheKey, optimized);
    }
    return optimized;
  }, [cacheKey, src, fallbackSrc, transformKey, aggressiveOptions]);

  const { srcSet, sizes: responsiveSizes } = useMemo(() => {
    if (disableResponsiveSrcSet) return { srcSet: "", sizes: "" };
    const responsive = getResponsiveImageUrls(src || fallbackSrc, aggressiveOptions);
    return responsive;
  }, [src, fallbackSrc, transformKey, disableResponsiveSrcSet]);

  const blurDataUrl = useMemo(() => {
    if (!enableBlur || !src) return undefined;
    return getBlurPlaceholder(src);
  }, [enableBlur, src]);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setOverrideSrc(null);
  }, [optimizedSrc]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!hasError) {
      setHasError(true);
      setOverrideSrc(fallbackSrc);
    }
    onError?.(e);
  };

  const finalSrc = overrideSrc ?? optimizedSrc;
  const effectiveSrc = finalSrc || fallbackSrc;
  const effectiveSrcSet = overrideSrc || disableResponsiveSrcSet ? undefined : srcSet || undefined;
  const effectiveSizes = overrideSrc || disableResponsiveSrcSet
    ? undefined
    : (sizesProp ?? responsiveSizes);

  return (
    <span className={cn("relative block overflow-hidden", wrapperClassName)}>
      {enableBlur && blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover blur-xl scale-110 transition-opacity duration-300"
        />
      )}
      <img
        {...props}
        src={effectiveSrc}
        srcSet={effectiveSrcSet}
        sizes={effectiveSizes}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "relative block h-full w-full object-cover transition-opacity duration-300",
          !isLoaded && enableBlur && "opacity-0",
          className
        )}
        loading={props.loading || "lazy"}
      />
    </span>
  );
};

export default OptimizedImage;

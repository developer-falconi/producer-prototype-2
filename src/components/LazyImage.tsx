import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function LazyImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      className={cn(
        className,
        "transition-opacity duration-500 ease-in-out",
        loaded ? "opacity-100" : "opacity-0"
      )}
    />
  );
}

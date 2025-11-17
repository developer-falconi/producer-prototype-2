import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/qualifiers/quality";
import { auto as autoFormat } from "@cloudinary/url-gen/qualifiers/format";
import { fill, scale, fit, pad } from "@cloudinary/url-gen/actions/resize";
import { autoGravity, focusOn } from "@cloudinary/url-gen/qualifiers/gravity";
import { FocusOn } from "@cloudinary/url-gen/qualifiers/focusOn";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo";

export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
  },
});

export type ImageTransformOptions = {
  width?: number;
  height?: number;
  aspectRatio?: string;
  crop?: "fill" | "scale" | "fit" | "pad";
  gravity?: "auto" | "face" | "faces" | "center";
  quality?: "auto" | "auto:best" | "auto:good" | "auto:eco" | "auto:low" | number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  dpr?: number | "auto";
};

/**
 * Genera una URL optimizada de Cloudinary para una imagen
 * Si la URL ya es de Cloudinary, extrae el public_id
 * Si es una URL externa, usa fetch para procesarla
 */
export const getOptimizedImageUrl = (
  imageUrl: string | null | undefined,
  options: ImageTransformOptions = {}
): string => {
  if (!imageUrl) return "";

  const isDataUrl = /^data:/i.test(imageUrl);
  if (isDataUrl) return imageUrl;

  const {
    width,
    height,
    aspectRatio,
    crop = "fill",
    gravity = "auto",
    quality = "auto",
    format = "auto",
    dpr = "auto",
  } = options;

  try {
    // Detectar si ya es una URL de Cloudinary
    const cloudinaryRegex = /cloudinary\.com\/([^/]+)\/(image|video)\/upload\/(?:v\d+\/)?(.+)/;
    const match = imageUrl.match(cloudinaryRegex);

    let cldImage;

    if (match) {
      // Es una URL de Cloudinary, extraer el public_id
      const publicId = match[3].replace(/\.[^.]+$/, ""); // Remover extensión
      cldImage = cloudinary.image(publicId);
    } else {
      // URL externa, usar fetch
      cldImage = cloudinary.image(imageUrl).setDeliveryType("fetch");
    }

    cldImage.addFlag("strip_profile");

    // Aplicar transformaciones
    if (width || height) {
      let resizeAction;
      switch (crop) {
        case "scale":
          resizeAction = scale();
          break;
        case "fit":
          resizeAction = fit();
          break;
        case "pad":
          resizeAction = pad();
          break;
        default:
          resizeAction = fill();
      }

      if (width) resizeAction.width(width);
      if (height) resizeAction.height(height);

      const canApplyGravity = typeof (resizeAction as any)?.gravity === "function";

      if (canApplyGravity) {
        if (gravity === "auto") {
          resizeAction.gravity(autoGravity());
        } else if (gravity === "face") {
          resizeAction.gravity(focusOn(FocusOn.face()));
        } else if (gravity === "faces") {
          resizeAction.gravity(focusOn(FocusOn.faces()));
        }
      }

      cldImage.resize(resizeAction);
    }

    if (aspectRatio) {
      cldImage.resize(fill().aspectRatio(aspectRatio).gravity(autoGravity()));
    }

    if (!width && !height) {
      cldImage.addTransformation("w_auto:breakpoints");
    }

    // Aplicar calidad
    if (quality === "auto") {
      cldImage.quality(auto());
    } else if (typeof quality === "string") {
      cldImage.quality(quality);
    } else {
      cldImage.quality(quality);
    }

    // Aplicar formato
    if (format === "auto") {
      cldImage.format(autoFormat());
    } else if (format) {
      cldImage.format(format);
    }

    // Aplicar DPR
    if (dpr === "auto") {
      cldImage.addTransformation("dpr_auto");
    } else if (dpr) {
      cldImage.addTransformation(`dpr_${dpr}`);
    }

    return cldImage.toURL();
  } catch (error) {
    console.error("Error optimizing image with Cloudinary:", error);
    return imageUrl;
  }
};

/**
 * Obtiene una URL de imagen responsive con múltiples tamaños
 */
export const getResponsiveImageUrls = (
  imageUrl: string | null | undefined,
  options: Omit<ImageTransformOptions, "width"> = {}
): { srcSet: string; sizes: string } => {
  if (!imageUrl) return { srcSet: "", sizes: "" };

  if (/^data:/i.test(imageUrl)) {
    return { srcSet: "", sizes: "" };
  }

  const widths = [320, 640, 768, 1024, 1280, 1536, 1920];

  const srcSet = widths
    .map((w) => {
      const url = getOptimizedImageUrl(imageUrl, { ...options, width: w });
      return `${url} ${w}w`;
    })
    .join(", ");

  const sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  return { srcSet, sizes };
};

/**
 * Genera una URL de placeholder blur (LQIP - Low Quality Image Placeholder)
 */
export const getBlurPlaceholder = (
  imageUrl: string | null | undefined
): string => {
  if (!imageUrl) return "";
  return getOptimizedImageUrl(imageUrl, {
    width: 20,
    quality: "auto:low",
    format: "auto",
  });
};

/**
 * Configuración preestablecida para diferentes tipos de imágenes
 */
export const imagePresets = {
  thumbnail: (url: string) =>
    getOptimizedImageUrl(url, {
      width: 200,
      height: 200,
      crop: "fill",
      gravity: "auto",
      quality: "auto:eco",
    }),

  card: (url: string) =>
    getOptimizedImageUrl(url, {
      width: 400,
      aspectRatio: "16:9",
      crop: "fill",
      gravity: "auto",
      quality: "auto:eco",
    }),

  hero: (url: string) =>
    getOptimizedImageUrl(url, {
      width: 1920,
      height: 1080,
      crop: "fill",
      gravity: "auto",
      quality: "auto:best",
    }),

  avatar: (url: string) =>
    getOptimizedImageUrl(url, {
      width: 150,
      height: 150,
      crop: "fill",
      gravity: "face",
      quality: "auto:eco",
    }),

  og: (url: string) =>
    getOptimizedImageUrl(url, {
      width: 1200,
      height: 630,
      crop: "fill",
      gravity: "auto",
      quality: "auto:good",
      format: "jpg",
    }),
};

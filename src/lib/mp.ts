import { MpLocale } from "./types";

declare global {
  interface Window { MercadoPago?: any }
}

export function getMercadoPago(publicKey: string, locale: MpLocale = "es-AR") {
  if (!window?.MercadoPago) {
    throw new Error("MercadoPago SDK no está cargado. Asegúrate de incluir el script oficial.");
  }
  
  return new window.MercadoPago(publicKey, { locale });
}
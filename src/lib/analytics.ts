declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function initializeGoogleAnalytics(measurementId: string | undefined | null) {
  if (!measurementId) {
    console.warn("Google Analytics Measurement ID not provided. Skipping Analytics initialization.");
    return;
  }

  if (typeof window.gtag === 'function') {
    console.log(`gtag.js already loaded. Re-configuring with ID: ${measurementId}`);
    window.gtag('config', measurementId, { 'send_page_view': true });
    return;
  }

  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);

  console.log(`Google Analytics initialized dynamically with ID: ${measurementId}`);
}
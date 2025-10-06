import { Producer } from "@/lib/types";

const Footer = ({ producer }: { producer: Producer }) => {
  return (
    <footer className="bg-stone-300 backdrop-blur supports-[backdrop-filter]:bg-stone-300 p-4 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-4">
          <div className="space-y-4 col-span-2">
            <div className="flex items-center space-x-2">
              <img src={producer.logo} alt={`${producer.name} Logo`} className="block h-10 w-auto" />
              <span className="text-[#951f1f] font-bold text-xl">
                {producer.name}
              </span>
            </div>
            <p className="text-[#951f1f] text-sm">
              {
                producer.webDetails && producer.webDetails.presentation
                  ? producer.webDetails.presentation
                  : `Creamos experiencias únicas que conectan artistas con audiencias a través de eventos memorables.`
              }
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[#951f1f] font-semibold">Navegación</h3>
            <div className="space-y-2">
              <a
                href="/"
                className="block text-[#951f1f] hover:font-semibold transition-colors duration-300"
              >
                Inicio
              </a>
              <a
                href="/events"
                className="block text-[#951f1f] hover:font-semibold transition-colors duration-300"
              >
                Eventos
              </a>
              <a
                href="/gallery"
                className="block text-[#951f1f] hover:font-semibold transition-colors duration-300"
              >
                Galería
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[#951f1f] font-semibold">Contacto</h3>
            <div className="flex flex-wrap w-full gap-4">
              {producer.phone && (
                <a
                  href={`https://wa.me/${producer.phone}?text=Hola,%20${producer.name}!%20Quiero%20info%20de%20sus%20eventos%20`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#951f1f] hover:font-semibold transition-colors duration-300"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  WhatsApp
                </a>
              )}

              {producer.email && producer.email.email && (
                <a
                  href={`mailto:${producer.email.email}`}
                  className="flex items-center gap-2 text-[#951f1f] hover:font-semibold transition-colors duration-300"
                >
                  {/* Email Icon SVG */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Email
                </a>
              )}

              {producer.instagram && (
                <a
                  href={`https://instagram.com/${producer.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#951f1f] hover:font-semibold transition-colors duration-300"
                >
                  {/* Instagram Icon SVG */}
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Instagram
                </a>
              )}

              {producer.youtube && (
                <a
                  href={producer.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#951f1f] hover:font-semibold transition-colors duration-300"
                >
                  {/* YouTube Icon SVG */}
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 576 512">
                    <path d="M549.7 124.1c-6.3-23.7-24.9-42.4-48.6-48.6C456.5 64 288 64 288 64s-168.5 0-213.1 11.5c-23.7 6.3-42.4 24.9-48.6 48.6C16.8 168.7 16 224 16 224s.8 55.3 10.3 99.9c6.3 23.7 24.9 42.4 48.6 48.6C119.5 384 288 384 288 384s168.5 0 213.1-11.5c23.7-6.3 42.4-24.9 48.6-48.6 9.5-44.6 10.3-99.9 10.3-99.9s-.8-55.3-10.3-99.9zM232 312V136l142 88-142 88z" />
                  </svg>
                  YouTube
                </a>
              )}

              {producer.tiktok && (
                <a
                  href={producer.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#951f1f] hover:font-semibold transition-colors duration-300"
                >
                  {/* TikTok Icon SVG */}
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M168.6 35.3c-4.5-5.1-7.8-11.1-9.6-17.5H126v137.1c0 7.1-2.7 14-7.5 19.1-4.8 5.2-11.3 8.5-18.3 9.2-7 .7-14.1-1.1-19.9-5s-9.9-9.5-11.5-16.1c-1.6-6.6-.6-13.5 2.6-19.4 3.3-5.9 8.6-10.5 15-12.8 3.2-1.1 6.5-1.6 9.9-1.6 3.6 0 7.2.6 10.6 1.8V93.5c-8.5-1.3-17.3-1-25.7.9-15.6 3.5-29.4 13.3-37.8 27-8.4 13.7-11.2 30.3-7.9 46 3.3 15.7 12.3 29.8 25 39.2s28.7 13.9 44.6 12.2c15.9-1.7 30.5-9.8 40.6-22.5 8.9-11.1 13.7-25.1 13.7-39.3V93.8c10.6 7.5 23.1 12.8 36 15.4V73.1c-6.4-.1-12.8-1.4-18.7-3.8-6.2-2.5-11.9-6.2-16.7-10.9z" />
                  </svg>
                  TikTok
                </a>
              )}

              {producer.spotify && (
                <a
                  href={producer.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#951f1f] hover:font-semibold transition-colors duration-300"
                >
                  {/* Spotify Icon SVG */}
                  <svg className="h-4 w-4" viewBox="0 0 168 168" fill="currentColor">
                    <circle cx="84" cy="84" r="84" fill="currentColor" />
                    <path fill="#000000" d="M122.4 119.8c-1.8 2.8-5.5 3.6-8.3 1.8-22.8-14-51.5-17.2-85.2-9.2-3.1.8-6.3-1.1-7.1-4.1s1.1-6.3 4.1-7.1c36.6-9.7 68.2-6.2 93.9 10.5 2.8 1.7 3.6 5.4 1.8 8.1zm11-23.7c-2.2 3.5-6.8 4.5-10.3 2.3-26.1-16-65.9-20.7-96.7-11.1-3.8 1.2-8-0.9-9.2-4.7-1.2-3.8.9-8 4.7-9.2 34.3-10.7 78.1-5.7 108.4 12.5 3.5 2.1 4.5 6.7 2.3 10.2zm.3-24.2c-29.3-17.8-78-19.4-106.5-10.4-4.5 1.3-9.3-1.4-10.6-5.9-1.3-4.5 1.4-9.3 5.9-10.6 33.3-9.4 86.2-7.5 118.5 11.6 4.1 2.5 5.5 7.8 3 11.9-2.5 4.1-7.8 5.5-11.3 3.4z" />
                  </svg>
                  Spotify
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-[#951f1f] text-sm">
            © {new Date().getFullYear()} {producer.name}. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
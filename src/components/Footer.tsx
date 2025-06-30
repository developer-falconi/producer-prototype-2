
import { Youtube, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Ø</span>
              </div>
              <span className="text-white font-bold text-xl">ONDA Producciones</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Creamos experiencias únicas que conectan artistas con audiencias a través de eventos memorables.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Navegación</h3>
            <div className="space-y-2">
              <a href="/" className="block text-gray-400 hover:text-purple-400 transition-colors duration-300">Inicio</a>
              <a href="/events" className="block text-gray-400 hover:text-purple-400 transition-colors duration-300">Eventos</a>
              <a href="/gallery" className="block text-gray-400 hover:text-purple-400 transition-colors duration-300">Galería</a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Contacto</h3>
            <div className="space-y-3">
              <a 
                href="tel:+5491134082507" 
                className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors duration-300"
              >
                <Phone className="w-4 h-4" />
                +54 911 3408-2507
              </a>
              <a 
                href="https://instagram.com/somos_onda" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors duration-300"
              >
                <span className="w-4 h-4 text-center">📷</span>
                @somos_onda
              </a>
              <a 
                href="https://youtube.com/@somos_onda?si=pbbCybxD9k57O_c9" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors duration-300"
              >
                <Youtube className="w-4 h-4" />
                ONDA YouTube
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 ONDA Producciones. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

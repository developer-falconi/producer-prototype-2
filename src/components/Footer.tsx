import { Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Producer } from "@/lib/types";

import { Youtube, Phone } from "lucide-react";
import { motion } from "motion/react";
import { FadeIn } from "@/components/animated/FadeIn";
import { StaggeredFadeIn } from "@/components/animated/StaggeredFadeIn";

const Footer = () => {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-background border-t border-border py-12 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <FadeIn delay={0.1}>
            <div className="space-y-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <span className="text-background font-bold text-sm">Ø</span>
                </div>
                <span className="text-foreground font-bold text-xl">ONDA Producciones</span>
              </motion.div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Creamos experiencias únicas que conectan artistas con audiencias a través de eventos memorables.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="space-y-4">
              <h3 className="text-foreground font-semibold">Navegación</h3>
              <StaggeredFadeIn staggerDelay={0.1}>
                {[
                  <motion.a 
                    key="inicio"
                    href="/" 
                    whileHover={{ x: 5 }}
                    className="block text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    Inicio
                  </motion.a>,
                  <motion.a 
                    key="eventos"
                    href="/events" 
                    whileHover={{ x: 5 }}
                    className="block text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    Eventos
                  </motion.a>,
                  <motion.a 
                    key="galeria"
                    href="/gallery" 
                    whileHover={{ x: 5 }}
                    className="block text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    Galería
                  </motion.a>
                ]}
              </StaggeredFadeIn>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="space-y-4">
              <h3 className="text-foreground font-semibold">Contacto</h3>
              <StaggeredFadeIn staggerDelay={0.1}>
                {[
                  <motion.a 
                    key="phone"
                    href="tel:+5491134082507" 
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    <Phone className="w-4 h-4" />
                    +54 911 3408-2507
                  </motion.a>,
                  <motion.a 
                    key="instagram"
                    href="https://instagram.com/somos_onda" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    <span className="w-4 h-4 text-center">📷</span>
                    @somos_onda
                  </motion.a>,
                  <motion.a 
                    key="youtube"
                    href="https://youtube.com/@somos_onda?si=pbbCybxD9k57O_c9" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    <Youtube className="w-4 h-4" />
                    ONDA YouTube
                  </motion.a>
                ]}
              </StaggeredFadeIn>
            </div>
          </FadeIn>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-border mt-8 pt-8 text-center"
        >
          <p className="text-muted-foreground text-sm">
            © 2025 ONDA Producciones. Todos los derechos reservados.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
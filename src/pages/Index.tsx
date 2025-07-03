import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, TrendingUp, Users, Award, Play } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FadeIn } from "@/components/animated/FadeIn";
import { SlideIn } from "@/components/animated/SlideIn";
import { ScaleIn } from "@/components/animated/ScaleIn";
import { AnimatedCard } from "@/components/animated/AnimatedCard";
import { AnimatedButton } from "@/components/animated/AnimatedButton";
import { StaggeredFadeIn } from "@/components/animated/StaggeredFadeIn";

const Index = () => {
  const [producerData, setProducerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with the provided data
    const mockData = {
      "success": true,
      "data": {
        "id": 5,
        "name": "ONDA Producciones",
        "domain": "https://ondaproducciones.web.app",
        "logo": "http://res.cloudinary.com/djecjeokj/image/upload/v1748456928/Productoras/ONDA%20Producciones/Flyers/nzbtk2yb2zfbi11b3n2c.png",
        "phone": "+5491134082507",
        "instagram": "somos_onda",
        "youtube": "https://youtube.com/@somos_onda?si=pbbCybxD9k57O_c9",
        "tiktok": "https://vm.tiktok.com/ZMSBsNjN6/",
        "events": [
          {
            "id": 6,
            "name": "ØNDA en Escena cap.5 - Música, teatro y vino",
            "description": "En la quinta edición de ØNDA en Escena, te traemos dos presentaciones espectaculares:",
            "startDate": "2025-06-28T22:00:00.000Z",
            "endDate": "2025-06-29T02:00:00.000Z",
            "location": "Teatro Espacio de Arte (Av. Sucre 437, San Isidro)",
            "status": "COMPLETED",
            "logo": "http://res.cloudinary.com/djecjeokj/image/upload/v1749661298/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20en%20Escena%20cap.5%20-%20M%C3%BAsica%2C%20teatro%20y%20vino/Flyers/gjjt0pe1w2xrjwbekzi1.jpg",
            "prevents": [
              {
                "id": 18,
                "name": "Tanda 1 (19hs)",
                "price": "16000.00",
                "quantity": 46,
                "status": "SOLD_OUT",
                "remaining": 0
              },
              {
                "id": 17,
                "name": "Tanda 2 (21hs)",
                "price": "16000.00",
                "quantity": 45,
                "status": "INACTIVE",
                "remaining": 6
              }
            ]
          },
          {
            "id": 5,
            "name": "ØNDA Session x Fermín B",
            "description": "ØNDA Producciones te trae la décima edición de las ØNDA Sessions, esta vez con Fermín Bereciartua como músico principal.",
            "startDate": "2025-06-06T23:00:00.000Z",
            "endDate": "2025-06-07T02:00:00.000Z",
            "location": "Barrio Laguna del Sol",
            "status": "COMPLETED",
            "logo": "http://res.cloudinary.com/djecjeokj/image/upload/v1748473281/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20Session%20cap.%2010%20x%20Ferm%C3%ADn%20B/Flyers/d543uoapumsbw76ucu4j.jpg",
            "prevents": [
              {
                "id": 13,
                "name": "ØNDA Session x Fermín B",
                "price": "16000.00",
                "quantity": 40,
                "status": "INACTIVE",
                "remaining": 9
              }
            ]
          }
        ]
      }
    };

    setTimeout(() => {
      setProducerData(mockData.data);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FadeIn>
          <div className="text-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-foreground text-lg">Cargando ONDA...</p>
          </div>
        </FadeIn>
      </div>
    );
  }

  if (!producerData) return null;

  const featuredEvent = producerData.events[0];
  const totalEvents = producerData.events.length;
  const completedEvents = producerData.events.filter(e => e.status === "COMPLETED").length;
  const totalTicketsSold = producerData.events.reduce((sum, event) => 
    sum + event.prevents.reduce((eventSum, prevent) => 
      eventSum + (prevent.quantity - prevent.remaining), 0
    ), 0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <FadeIn>
                <div className="space-y-4">
                  <motion.img 
                    src={producerData.logo} 
                    alt={producerData.name}
                    className="h-20 w-auto"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  />
                  <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                    Creamos experiencias 
                    <span className="text-muted-foreground">
                      {" "}únicas
                    </span>
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Somos ONDA Producciones, creadores de eventos que combinan música, arte y experiencias inolvidables. 
                    Conectamos artistas con audiencias en espacios únicos.
                  </p>
                </div>
              </FadeIn>
              
              <SlideIn direction="up" delay={0.3}>
                <div className="flex flex-wrap gap-4">
                  <AnimatedButton size="lg" className="px-8 py-3">
                    <Link to="/events">Explorar Eventos</Link>
                  </AnimatedButton>
                  <AnimatedButton variant="outline" size="lg" className="px-8 py-3">
                    <Link to="/gallery">Ver Galería</Link>
                  </AnimatedButton>
                </div>
              </SlideIn>
            </div>
            
            <SlideIn direction="right" delay={0.2}>
              <AnimatedCard className="lg:pl-12" delay={0.4}>
                <Card className="bg-card border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <motion.img 
                        src={featuredEvent.logo} 
                        alt={featuredEvent.name}
                        className="w-full h-64 object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center"
                      >
                        <Play className="w-12 h-12 text-white" />
                      </motion.div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold text-lg mb-2">{featuredEvent.name}</h3>
                        <div className="flex items-center gap-4 text-white/80 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(featuredEvent.startDate).toLocaleDateString('es-AR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {featuredEvent.location.split('(')[0]}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <StaggeredFadeIn staggerDelay={0.1}>
            {[
              <div className="grid md:grid-cols-4 gap-8" key="stats">
                <ScaleIn delay={0.1} hover={true}>
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">{totalEvents}</div>
                    <div className="text-muted-foreground">Eventos Realizados</div>
                  </div>
                </ScaleIn>
                
                <ScaleIn delay={0.2} hover={true}>
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-secondary-foreground" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">{totalTicketsSold}+</div>
                    <div className="text-muted-foreground">Tickets Vendidos</div>
                  </div>
                </ScaleIn>
                
                <ScaleIn delay={0.3} hover={true}>
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">{completedEvents}</div>
                    <div className="text-muted-foreground">Eventos Exitosos</div>
                  </div>
                </ScaleIn>
                
                <ScaleIn delay={0.4} hover={true}>
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">100%</div>
                    <div className="text-muted-foreground">Satisfacción</div>
                  </div>
                </ScaleIn>
              </div>
            ]}
          </StaggeredFadeIn>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <FadeIn>
            <h2 className="text-4xl font-bold text-foreground">Nuestra Misión</h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-xl text-muted-foreground leading-relaxed">
              En ONDA Producciones creemos que cada evento es una oportunidad única de crear conexiones auténticas. 
              Fusionamos música, arte y gastronomía para generar experiencias que trascienden lo convencional, 
              donde cada detalle está cuidadosamente pensado para sorprender y emocionar.
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <StaggeredFadeIn staggerDelay={0.2}>
              {[
                <ScaleIn key="community" hover={true}>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Comunidad</h3>
                    <p className="text-muted-foreground">Creamos espacios donde las personas se conectan a través del arte y la música.</p>
                  </div>
                </ScaleIn>,
                
                <ScaleIn key="quality" hover={true}>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mx-auto">
                      <Award className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Calidad</h3>
                    <p className="text-muted-foreground">Cada evento es una producción cuidada al detalle, con artistas de primer nivel.</p>
                  </div>
                </ScaleIn>,
                
                <ScaleIn key="innovation" hover={true}>
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto">
                      <Play className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Innovación</h3>
                    <p className="text-muted-foreground">Experimentamos con formatos únicos que combinan diferentes expresiones artísticas.</p>
                  </div>
                </ScaleIn>
              ]}
            </StaggeredFadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <FadeIn>
            <h2 className="text-4xl font-bold text-foreground">¿Listo para vivir la experiencia ONDA?</h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-xl text-muted-foreground">
              Descubre nuestros próximos eventos y únete a la comunidad ONDA
            </p>
          </FadeIn>
          <SlideIn direction="up" delay={0.4}>
            <div className="flex flex-wrap justify-center gap-4">
              <AnimatedButton size="lg" className="px-8 py-3">
                <Link to="/events">Ver Todos los Eventos</Link>
              </AnimatedButton>
              <AnimatedButton variant="outline" size="lg" className="px-8 py-3">
                <a href={`https://instagram.com/${producerData.instagram}`} target="_blank" rel="noopener noreferrer">
                  Síguenos en Instagram
                </a>
              </AnimatedButton>
            </div>
          </SlideIn>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
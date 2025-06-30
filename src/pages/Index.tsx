
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, TrendingUp, Users, Award, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedWave from "@/components/AnimatedWave";

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
            "description": "En la quinta edición de ØNDA en Escena, te traemos dos presentaciones espectaculares:\r\n\r\n🎭 \"Manchas\", una obra de teatro.\r\nDramaturgia: Carmela Pando.\r\nDirección: Joaquín Ochoa. \r\nElenco: Carmela Pando y Tadeo Macri. \r\nMúsica original: Bautista Caillet-Bois.\r\nProducción general: Carmela Pando.\r\n\r\n🎤  Trío vocal: show a tres voces con canciones de pop, soul y funk. \r\nVoces: Felicitas Carman, Josefina Louge y Milagros Huergo\r\nGuitarra: Bachi Guyot\r\n\r\n🌼 Además: exposición de fotografía (@bjorrnx), venta de ropa (@aticothrft), accesorios (@verv1c) , y mucha, mucha ønda!\r\n\r\n⏰ HORARIOS\r\n     Tanda 1 - 19:00 (SOLD OUT!)\r\n     Tanda 2 - 21:00\r\n\r\n¡Tu entrada incluye una copa de vino Portillo!🍷😊\r\n\r\nAcompañan: Portillo Wines y Cerveza Escalada",
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
            "description": "ØNDA Producciones te trae la décima edición de las ØNDA Sessions, esta vez con Fermín Bereciartua como músico principal.\r\n\r\n🍷 Tu entrada incluye una copa de vino Portillo y una consumición de comida!\r\n\r\n🤩 Música, expo de arte, ropa vintage, accesorios, gastronomía y mucha, mucha buena ønda\r\n\r\nAcompañan: Portillo Wines y Cerveza Escalada",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando ONDA...</p>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <AnimatedWave />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <img 
                  src={producerData.logo} 
                  alt={producerData.name}
                  className="h-20 w-auto filter drop-shadow-lg"
                />
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Creamos experiencias 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    {" "}únicas
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Somos ONDA Producciones, creadores de eventos que combinan música, arte y experiencias inolvidables. 
                  Conectamos artistas con audiencias en espacios únicos.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105">
                  <Link to="/events">Explorar Eventos</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-3 rounded-full transition-all duration-300">
                  <Link to="/gallery">Ver Galería</Link>
                </Button>
              </div>
            </div>
            
            <div className="lg:pl-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden group hover:bg-white/15 transition-all duration-500">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    <img 
                      src={featuredEvent.logo} 
                      alt={featuredEvent.name}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
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
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-2 animate-fade-in hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">{totalEvents}</div>
              <div className="text-gray-400">Eventos Realizados</div>
            </div>
            
            <div className="text-center space-y-2 animate-fade-in hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">{totalTicketsSold}+</div>
              <div className="text-gray-400">Tickets Vendidos</div>
            </div>
            
            <div className="text-center space-y-2 animate-fade-in hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">{completedEvents}</div>
              <div className="text-gray-400">Eventos Exitosos</div>
            </div>
            
            <div className="text-center space-y-2 animate-fade-in hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-gray-400">Satisfacción</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white animate-fade-in">Nuestra Misión</h2>
          <p className="text-xl text-gray-300 leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
            En ONDA Producciones creemos que cada evento es una oportunidad única de crear conexiones auténticas. 
            Fusionamos música, arte y gastronomía para generar experiencias que trascienden lo convencional, 
            donde cada detalle está cuidadosamente pensado para sorprender y emocionar.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Comunidad</h3>
              <p className="text-gray-400">Creamos espacios donde las personas se conectan a través del arte y la música.</p>
            </div>
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Calidad</h3>
              <p className="text-gray-400">Cada evento es una producción cuidada al detalle, con artistas de primer nivel.</p>
            </div>
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Innovación</h3>
              <p className="text-gray-400">Experimentamos con formatos únicos que combinan diferentes expresiones artísticas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white animate-fade-in">¿Listo para vivir la experiencia ONDA?</h2>
          <p className="text-xl text-gray-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Descubre nuestros próximos eventos y únete a la comunidad ONDA
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105">
              <Link to="/events">Ver Todos los Eventos</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white hover:text-purple-900 px-8 py-3 rounded-full transition-all duration-300">
              <a href={`https://instagram.com/${producerData.instagram}`} target="_blank" rel="noopener noreferrer">
                Síguenos en Instagram
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

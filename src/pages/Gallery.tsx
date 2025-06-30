
import { useState, useEffect } from "react";
import { Play, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Gallery = () => {
  const [mediaContent, setMediaContent] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock media content for each event
    const mockMediaContent = [
      {
        id: 1,
        eventId: 6,
        eventName: "ØNDA en Escena cap.5",
        type: "image",
        url: "http://res.cloudinary.com/djecjeokj/image/upload/v1749661298/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20en%20Escena%20cap.5%20-%20M%C3%BAsica%2C%20teatro%20y%20vino/Flyers/gjjt0pe1w2xrjwbekzi1.jpg",
        thumbnail: "http://res.cloudinary.com/djecjeokj/image/upload/v1749661298/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20en%20Escena%20cap.5%20-%20M%C3%BAsica%2C%20teatro%20y%20vino/Flyers/gjjt0pe1w2xrjwbekzi1.jpg",
        title: "Flyer Oficial - Teatro y Música",
        category: "flyers"
      },
      {
        id: 2,
        eventId: 6,
        eventName: "ØNDA en Escena cap.5",
        type: "image",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        title: "Presentación Teatro Manchas",
        category: "photos"
      },
      {
        id: 3,
        eventId: 6,
        eventName: "ØNDA en Escena cap.5",
        type: "image",
        url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
        title: "Trío Vocal en Vivo",
        category: "photos"
      },
      {
        id: 4,
        eventId: 5,
        eventName: "ØNDA Session x Fermín B",
        type: "image",
        url: "http://res.cloudinary.com/djecjeokj/image/upload/v1748473281/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20Session%20cap.%2010%20x%20Ferm%C3%ADn%20B/Flyers/d543uoapumsbw76ucu4j.jpg",
        thumbnail: "http://res.cloudinary.com/djecjeokj/image/upload/v1748473281/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20Session%20cap.%2010%20x%20Ferm%C3%ADn%20B/Flyers/d543uoapumsbw76ucu4j.jpg",
        title: "ØNDA Session - Fermín Bereciartua",
        category: "flyers"
      },
      {
        id: 5,
        eventId: 5,
        eventName: "ØNDA Session x Fermín B",
        type: "image",
        url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
        title: "Fermín B en Vivo",
        category: "photos"
      },
      {
        id: 6,
        eventId: 5,
        eventName: "ØNDA Session x Fermín B",
        type: "video",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
        title: "Resumen ØNDA Session",
        category: "videos"
      },
      {
        id: 7,
        eventId: 6,
        eventName: "ØNDA en Escena cap.5",
        type: "image",
        url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=300&fit=crop",
        title: "Ambiente del Teatro",
        category: "photos"
      },
      {
        id: 8,
        eventId: 5,
        eventName: "ØNDA Session x Fermín B",
        type: "image",
        url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
        title: "Público Disfrutando",
        category: "photos"
      },
      {
        id: 9,
        eventId: 6,
        eventName: "ØNDA en Escena cap.5",
        type: "image",
        url: "https://images.unsplash.com/photo-1574391884720-bbc725fc5806?w=800&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1574391884720-bbc725fc5806?w=400&h=300&fit=crop",
        title: "Copa de Vino Portillo",
        category: "experiences"
      }
    ];

    setTimeout(() => {
      setMediaContent(mockMediaContent);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = [
    { key: "all", label: "Todo", icon: ImageIcon },
    { key: "photos", label: "Fotos", icon: ImageIcon },
    { key: "videos", label: "Videos", icon: Play },
    { key: "flyers", label: "Flyers", icon: ImageIcon },
    { key: "experiences", label: "Experiencias", icon: ImageIcon }
  ];

  const filteredContent = selectedCategory === "all" 
    ? mediaContent 
    : mediaContent.filter(item => item.category === selectedCategory);

  const renderMediaCard = (item, index) => {
    if (item.type === "video") {
      return (
        <Card 
          key={item.id} 
          className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden group hover:bg-white/15 transition-all duration-500 hover:scale-105 animate-fade-in"
          style={{ animationDelay: `${0.1 * index}s` }}
        >
          <CardContent className="p-0">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative overflow-hidden cursor-pointer">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                    <p className="text-gray-300 text-xs">{item.eventName}</p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-black/90 border-white/20">
                <div className="aspect-video">
                  <iframe
                    src={item.url}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card 
        key={item.id} 
        className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden group hover:bg-white/15 transition-all duration-500 hover:scale-105 animate-fade-in"
        style={{ animationDelay: `${0.1 * index}s` }}
      >
        <CardContent className="p-0">
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative overflow-hidden cursor-pointer">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                    <p className="text-gray-300 text-xs">{item.eventName}</p>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-black/90 border-white/20">
              <img 
                src={item.url} 
                alt={item.title}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="pt-32 pb-20 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white text-lg">Cargando galería...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Galería ONDA
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Revive los mejores momentos de nuestros eventos a través de imágenes, videos y experiencias únicas
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  variant={selectedCategory === category.key ? "default" : "outline"}
                  className={`px-6 py-2 rounded-full transition-all duration-300 ${
                    selectedCategory === category.key
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "border-white/30 text-white hover:bg-white/10 hover:scale-105"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.label}
                </Button>
              );
            })}
          </div>

          {/* Media Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((item, index) => renderMediaCard(item, index))}
          </div>

          {filteredContent.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-gray-400 text-lg mb-4">No hay contenido disponible</div>
              <p className="text-gray-500">Selecciona otra categoría para ver más contenido</p>
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center mt-16 animate-fade-in">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">¿Quieres ser parte de la próxima experiencia?</h3>
              <p className="text-gray-300 mb-6">
                Únete a nuestra comunidad y no te pierdas ningún evento exclusivo de ONDA Producciones
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  asChild 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
                >
                  <a href="/events">Ver Próximos Eventos</a>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-full transition-all duration-300"
                >
                  <a href="https://instagram.com/somos_onda" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Síguenos
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Gallery;

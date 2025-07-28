import { useState, useEffect } from "react";
import { Play, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProducer } from "@/context/ProducerContext";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Spinner from "@/components/Spinner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { fetchProducerGalleryData } from "@/lib/api";
import { EventImageDto } from "@/lib/types";

const Gallery = () => {
  const { producer } = useProducer();
  const [mediaContent, setMediaContent] = useState<EventImageDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (producer) {
      (async () => {
        try {
          const resp = await fetchProducerGalleryData();
          if (resp.success && resp.data) {
            setMediaContent(resp.data);
          }
        } catch (err) {
          console.error("Error fetching event details:", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [producer]);

  const categories = [
    { key: "all", label: "Todo", icon: ImageIcon },
    { key: "photos", label: "Fotos", icon: ImageIcon },
    { key: "videos", label: "Videos", icon: Play },
    { key: "flyers", label: "Flyers", icon: ImageIcon },
    { key: "experiences", label: "Experiencias", icon: ImageIcon }
  ];

  // const filteredContent = selectedCategory === "all"
  //   ? mediaContent
  //   : mediaContent.filter(item => item?.category === selectedCategory);

  const filteredContent = mediaContent;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      } as const
    },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  };

  const buttonVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const renderMediaCard = (item: EventImageDto, index: number) => {
    if (item.name === "video") {
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
                    src={item.url}
                    alt={item.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-sm">{item.name}</h3>
                    <p className="text-gray-300 text-xs">{item.event.name}</p>
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
                  src={item.url}
                  alt={item.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-sm">{item.name}</h3>
                    <p className="text-gray-300 text-xs">{item.event.name}</p>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-black/90 border-white/20 data-[state=open]:text-white">
              <div className="transition-opacity duration-300">
                <div className="absolute bottom-4 left-6">
                  <h3 className="text-white font-semibold text-lg md:text-3xl">{item.name}</h3>
                  <p className="text-gray-300 text-base md:text-xl">{item.event.name}</p>
                </div>
              </div>
              <img
                src={item.url}
                alt={item.name}
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
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-gray-900">
        <Spinner textColor="text-white" borderColor="border-t-black" />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-black to-gray-900">
        <p className="font-medium text-lg text-black mb-2">Error al cargar los datos del productor.</p>
        <Link to='https://www.produtik.com' target="_blank">
          <div className="flex items-center gap-2 bg-blue-800 hover:bg-blue-800/80 text-white text-sm px-3 py-1 rounded-full shadow-lg cursor-pointer">
            Encontranos en Produtik <ExternalLink className="h-4 w-4" />
          </div>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative min-h-screen bg-gradient-to-br from-black via-black to-gray-900"
    >
      <div className="container">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              variants={textVariants}
              className="text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              Galería {producer.name}
            </motion.h1>
            <motion.p
              variants={textVariants}
              className="text-xl text-gray-200 max-w-2xl mx-auto"
            >
              Revive los mejores momentos de nuestros eventos a través de imágenes, videos y experiencias únicas
            </motion.p>
          </div>

          {/* Category Filters */}
          {/* <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.div key={category.key} variants={buttonVariants}>
                  <Button
                    onClick={() => setSelectedCategory(category.key)}
                    variant={selectedCategory === category.key ? "default" : "outline"}
                    className={cn(
                      "px-6 py-2 rounded-full transition-all duration-300",
                      selectedCategory === category.key
                        ? "bg-blue-800 text-white hover:bg-blue-800/80 hover:scale-105"
                        : "border-white/30 text-white bg-gray-800 hover:bg-gray-800/80 hover:scale-105"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {category.label}
                  </Button>
                </motion.div>
              );
            })}
          </motion.div> */}

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredContent.length > 0 ? (
                filteredContent.map((item, index) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    {renderMediaCard(item, index)}
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="no-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 col-span-full"
                >
                  <div className="text-gray-800 text-lg mb-4">No hay contenido disponible</div>
                  <p className="text-gray-700">Selecciona otra categoría para ver más contenido</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Call to Action */}
          <motion.div
            variants={textVariants}
            className="text-center mt-8"
          >
            <motion.div
              variants={itemVariants} // Reusing itemVariants for the CTA box
              className="bg-gray-800/80 backdrop-blur-lg border border-white/10 rounded-lg p-6 w-full mx-auto"
            >
              <h3 className="text-2xl font-bold text-gray-100 mb-4">¿Quieres ser parte de la próxima experiencia?</h3>
              <p className="text-gray-200 mb-6">
                Únete a nuestra comunidad y no te pierdas ningún evento exclusivo de {producer.name}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <motion.div variants={buttonVariants}>
                  <Button
                    asChild
                    className="bg-gray-800 hover:bg-gray-800/80 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
                  >
                    <a href="/events">Ver Próximos Eventos</a>
                  </Button>
                </motion.div>
                <motion.div variants={buttonVariants}>
                  <Button
                    asChild
                    className="bg-blue-800 hover:bg-blue-800/80 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
                  >
                    <a href={`https://instagram.com/${producer.instagram}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Síguenos
                    </a>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <Footer producer={producer} />
    </motion.div>
  );
};

export default Gallery;
import { useState, useEffect, useMemo } from "react";
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
// tracking
import { useTracking } from "@/hooks/use-tracking";
import { Helmet } from "react-helmet-async";

const Gallery = () => {
  const { producer } = useProducer();
  const tracking = useTracking({ producer }); // page_view se dispara acá
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
            tracking.ui("gallery_loaded", { count: resp.data.length });
            if (!resp.data?.length) {
              tracking.ui("gallery_empty");
            }
          } else {
            tracking.ui("gallery_load_error", { reason: "bad_response" });
          }
        } catch (err: any) {
          console.error("Error fetching gallery:", err);
          tracking.ui("gallery_load_error", { reason: "exception", message: String(err?.message || err) });
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [producer, tracking]);

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

  // track del filtro (si activan los filtros de arriba)
  useEffect(() => {
    tracking.ui("gallery_filter_selected", { category_key: selectedCategory });
  }, [selectedCategory, tracking]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 } as const
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

  const mediaKind = (item: EventImageDto) =>
    item?.name?.toLowerCase?.() === "video" ? "video" : "image";

  const onMediaOpenChange = (item: EventImageDto, open: boolean) => {
    const kind = mediaKind(item);
    const payload = {
      id: item.id,
      name: item.name,
      kind,
      url: item.url,
      event_id: item.event?.id,
      event_name: item.event?.name,
    };
    tracking.ui(open ? "gallery_media_open" : "gallery_media_close", payload);
  };

  const meta = useMemo(() => {
    const site = producer?.name || "Produtik";
    const titleBase = producer?.webDetails?.galleryTitle || `Galería ${site}`;
    const subtitle = producer?.webDetails?.gallerySubtitle
      || `Revive los mejores momentos de ${site}`;
    const count = filteredContent.length;
    const title = `${titleBase} — ${site}`;
    const description = `${subtitle}${count ? ` | ${count} piezas` : ""}`;
    const image = filteredContent[0]?.url || producer?.logo || "/og-default.jpg";
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}`;

    const hasPart = filteredContent.slice(0, 12).map((it) => {
      const common = {
        name: it.name || it.event?.name || "Media",
        description: it.event?.name ? `Evento: ${it.event.name}` : undefined,
        url: it.url
      };
      return it.name === "video"
        ? { "@type": "VideoObject", ...common, thumbnailUrl: it.url, embedUrl: it.url }
        : { "@type": "ImageObject", ...common, contentUrl: it.url };
    });

    const ld = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: titleBase,
      description,
      url,
      mainEntity: {
        "@type": "ImageGallery",
        name: titleBase,
        hasPart
      }
    };

    return { site, title, description, image, url, ld };
  }, [producer, filteredContent]);

  const renderMediaCard = (item: EventImageDto, index: number) => {
    if (item.name === "video") {
      return (
        <Card
          key={item.id}
          className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden group hover:bg-white/15 transition-all duration-500 hover:scale-105 animate-fade-in"
          style={{ animationDelay: `${0.1 * index}s` }}
        >
          <CardContent className="p-0">
            <Dialog onOpenChange={(open) => onMediaOpenChange(item, open)}>
              <DialogTrigger asChild>
                <div
                  className="relative overflow-hidden cursor-pointer"
                  onClick={() => {
                    tracking.ui("gallery_card_click", {
                      id: item.id,
                      kind: "video",
                      event_id: item.event?.id,
                    });
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                    onLoad={() => tracking.ui("gallery_media_impression", { id: item.id, kind: "video" })}
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
                    onLoad={() => tracking.ui("gallery_video_iframe_loaded", { id: item.id })}
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
          <Dialog onOpenChange={(open) => onMediaOpenChange(item, open)}>
            <DialogTrigger asChild>
              <div
                className="relative overflow-hidden cursor-pointer"
                onClick={() => {
                  tracking.ui("gallery_card_click", {
                    id: item.id,
                    kind: "image",
                    event_id: item.event?.id,
                  });
                }}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                  onLoad={() => tracking.ui("gallery_media_impression", { id: item.id, kind: "image" })}
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
                onLoad={() => tracking.ui("gallery_dialog_image_loaded", { id: item.id })}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-emerald-950 to-black">
        <Spinner />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-emerald-950 to-black">
        <p className="font-medium text-lg text-black mb-2">Error al cargar los datos del productor.</p>
        <Link to='https://www.produtik.com' target="_blank">
          <div className="flex items-center gap-2 bg-emerald-950 hover:bg-emerald-950/80 text-white text-sm px-3 py-1 rounded-full shadow-lg cursor-pointer">
            Encontranos en Produtik <ExternalLink className="h-4 w-4" />
          </div>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.url} />
        <meta name="theme-color" content="#000000" />
        {/* OG */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={meta.site} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:url" content={meta.url} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        {/* LD+JSON */}
        <script type="application/ld+json">{JSON.stringify(meta.ld)}</script>
      </Helmet>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative min-h-screen flex flex-col bg-gradient-to-br from-black via-emerald-950 to-black"
      >
        <div className="container flex-1">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.h1
                variants={textVariants}
                className="text-4xl lg:text-5xl font-bold text-white my-3"
              >
                {producer.webDetails?.galleryTitle || `Galería ${producer.name}`}
              </motion.h1>
              <motion.p
                variants={textVariants}
                className="text-xl text-gray-200 max-w-2xl mx-auto"
              >
                {
                  producer.webDetails?.gallerySubtitle
                  || 'Revive los mejores momentos de nuestros eventos a través de imágenes, videos y experiencias únicas'
                }
              </motion.p>
            </div>

            {/* Category Filters (si los usan, ya trackea arriba con gallery_filter_selected) */}
            {/* ... */}

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
            <motion.div variants={textVariants} className="text-center mt-8">
              <motion.div
                variants={itemVariants}
                className="bg-black backdrop-blur-lg border border-white/10 rounded-lg p-6 w-full mx-auto"
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
                      <a
                        href="/events"
                        onClick={() => tracking.ui("gallery_cta_view_events_click")}
                      >
                        Ver Próximos Eventos
                      </a>
                    </Button>
                  </motion.div>
                  <motion.div variants={buttonVariants}>
                    <Button
                      asChild
                      className="bg-emerald-950 hover:bg-emerald-950/80 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105"
                    >
                      <a
                        href={`https://instagram.com/${producer.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => tracking.ui("gallery_cta_follow_click", { handle: producer.instagram })}
                      >
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
    </>
  );
};

export default Gallery;

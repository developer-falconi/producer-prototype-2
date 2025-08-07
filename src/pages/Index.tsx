import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Award, TrendingUp, ExternalLink, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import { useProducer } from "@/context/ProducerContext";
import { cn } from "@/lib/utils";
import { Event, PaymentStatus } from "@/lib/types";
import { fetchProducerEventDetailData } from "@/lib/api";
import PaymentResult from "@/components/PaymentResult";
import { Link } from "react-router-dom";
import { CountingNumber } from "@/components/animate-ui/text/counting-number";
import { useIsMobile } from "@/hooks/use-mobile";
import EventCarousel from "@/components/EventCarousel";

const Index = () => {
  const { producer, loadingProducer } = useProducer();
  const isMobile = useIsMobile();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentEventId, setPaymentEventId] = useState<string | null>(null);
  const [loadingEventPayment, setLoadingEventPayment] = useState<boolean>(false);
  const [eventBought, setEventBought] = useState<Event>();
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);

  const [statsInView, setStatsInView] = useState(false);
  const statsSectionRef = useRef<HTMLDivElement>(null);

  const [videoStarted, setVideoStarted] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const status = q.get('collection_status') || q.get('status');
    const eid = q.get('event');

    if (status) {
      const params: Record<string, string> = {};
      q.forEach((v, k) => (params[k] = v));
      setPaymentStatus({ status, params });
      setPaymentEventId(eid);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (paymentEventId && producer) {
      (async () => {
        try {
          setLoadingEventPayment(true);
          const resp = await fetchProducerEventDetailData(Number(paymentEventId));
          if (resp.success && resp.data) {
            setEventBought(resp.data);
          }
        } catch (err) {
          console.error("Error fetching event details:", err);
        } finally {
          setLoadingEventPayment(false);
        }
      })();
    }
  }, [paymentEventId, producer]);

  useEffect(() => {
    if (paymentStatus) {
      setIsDialogVisible(true);
      const timer = setTimeout(() => {
        setIsDialogVisible(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (!producer || !statsSectionRef.current) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStatsInView(true);
        observer.unobserve(entry.target);
      }
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    });

    observer.observe(statsSectionRef.current);

    return () => {
      if (statsSectionRef.current) {
        observer.unobserve(statsSectionRef.current);
      }
    };
  }, [producer]);


  if (loadingProducer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-gray-900">
        <Spinner />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-black to-gray-900">
        <p className="font-medium text-lg text-white mb-2">Error al cargar los datos del productor.</p>
        <Link to='https://www.produtik.com' target="_blank">
          <div className="flex items-center gap-2 bg-blue-800 hover:bg-blue-800/80 text-white text-sm px-3 py-1 rounded-full shadow-lg cursor-pointer">
            Encontranos en Produtik <ExternalLink className="h-4 w-4" />
          </div>
        </Link>
      </div>
    );
  }

  const featuredEvents = producer.events
    .filter(event => event.featured)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const eventsForHeroCarousel = featuredEvents.length > 0 ? featuredEvents : producer.events.slice(0, 3);
  const fallbackVideoUrl = "/fallbackvideo.mp4";

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-black via-black to-gray-900 font-sans antialiased">
      <AnimatePresence>
        {isDialogVisible && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="rounded-lg shadow-lg max-w-md w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {
                loadingEventPayment ? (
                  <Spinner />
                ) : (
                  paymentStatus &&
                  <PaymentResult
                    status={paymentStatus.status}
                    eventBought={eventBought}
                  />
                )
              }
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={cn(
        "flex-grow",
        isMobile ? "pt-0" : "pt-16"
      )}>
        <section
          className={cn(
            "relative p-6 w-full min-h-[calc(100vh-4rem)] flex flex-col md:flex-row",
            "items-center justify-center",
            "overflow-hidden text-white text-center",
            !videoStarted && "bg-gradient-to-br from-black via-black to-gray-900"
          )}>
          <EventCarousel events={eventsForHeroCarousel} />
          <video
            className={cn(
              "absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700",
              videoStarted ? "opacity-100" : "opacity-0"
            )}
            src={fallbackVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onPlaying={() => setVideoStarted(true)}
          >
            Your browser does not support the video tag.
          </video>
          <div
            className={cn(
              "flex flex-col w-full pt-0",
              eventsForHeroCarousel.length > 0 && 'md:w-1/2'
            )}
          >
            <motion.h1
              className={cn(
                "font-extrabold mb-4 leading-tight drop-shadow-lg mx-auto",
                eventsForHeroCarousel.length > 0
                  ? 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl'
                  : 'text-4xl md:text-6xl lg:text-7xl xl:text-8xl'
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {producer.logo && (
                <img
                  src={producer.logo}
                  alt={`${producer.name} Logo`}
                  className={cn(
                    "block rounded-full mx-auto mb-4 object-cover",
                    eventsForHeroCarousel.length > 0 ? 'h-24 w-24 md:h-36 md:w-36' : 'h-32 w-32 md:h-36 md:w-36'
                  )}
                />
              )}
              {producer.name}
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto drop-shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {
                producer.webDetails?.subtitle
                  ? producer.webDetails.subtitle
                  : 'Explorando nuevas fronteras en la creación de eventos únicos.'
              }
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <Link to="/events">
                <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-full shadow-lg text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center">
                  Ver Todos los Eventos <ArrowRight className="ml-3 h-5 w-5" />
                </button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ESTADÍSTICAS */}
        <section
          className="py-12 sm:py-20 bg-gradient-to-r from-blue-700 to-indigo-800 text-white"
          ref={statsSectionRef}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {[
              { icon: Users, num: producer.totalClients, label: "Entradas Vendidas" },
              { icon: Award, num: producer.totalEvents, label: "Eventos Exitosos" },
              { icon: TrendingUp, num: 100, label: "Satisfacción del Cliente" },
            ].map(({ icon: Icon, num, label }, i) => (
              <motion.div
                key={i}
                className="text-center space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.2 + i * 0.2 }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {statsInView ? (
                    <CountingNumber number={Number(num)} />
                  ) : (0)}
                  {label === 'Satisfacción del Cliente' && '%'}
                </div>
                <div className="text-blue-100 font-medium text-sm sm:text-base">
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* MISIÓN */}
        <section className="py-12 sm:py-20 px-4 bg-black">
          <motion.div
            className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } },
            }}
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-bold text-white"
              variants={{ hidden: {}, visible: {} }}
            >
              Nuestra Misión
            </motion.h2>
            <motion.p
              className="text-lg sm:text-xl text-gray-200 leading-relaxed"
              variants={{ hidden: {}, visible: {} }}
            >
              {
                producer.webDetails && producer.webDetails.mission
                  ? producer.webDetails.mission
                  : `En ${producer.name}, cada evento es una conexión auténtica entre música, arte y gastronomía, diseñada para emocionar e inspirar.`
              }
            </motion.p>
          </motion.div>
        </section>
      </main>
      <Footer producer={producer} />
    </div>
  );
};

export default Index;
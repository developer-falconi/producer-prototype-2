import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Award, TrendingUp } from "lucide-react";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import FeaturedEvent from "@/components/FeaturedEvent";
import ImageSection from "@/components/ImageSection";
import { useProducer } from "@/context/ProducerContext";
import { cn } from "@/lib/utils";
import { Event, PaymentStatus } from "@/lib/types";
import { fetchProducerEventDetailData } from "@/lib/api";
import PaymentResult from "@/components/PaymentResult";

const Index = () => {
  const { producer, loadingProducer } = useProducer();
  const [activeEvent, setActiveEvent] = useState<any>(null);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentEventId, setPaymentEventId] = useState<string | null>(null);
  const [loadingEventPayment, setLoadingEventPayment] = useState<boolean>(false);
  const [eventBought, setEventBought] = useState<Event>();
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);

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
    if (producer) {
      const feturedEvent = producer.events[0];
      if (feturedEvent) setActiveEvent(feturedEvent);
    }
  }, [producer])

  useEffect(() => {
    if (paymentStatus) {
      setIsDialogVisible(true);
      const timer = setTimeout(() => {
        setIsDialogVisible(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);

  if (loadingProducer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-400">
        <Spinner />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">Error al cargar los datos del productor.</div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-200 to-gray-400">
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

      <section
        className={cn(
          "relative flex-grow h-auto md:h-[calc(100vh-4rem)] overflow-hidden"
        )}
      >
        <div className="md:absolute md:inset-0 flex flex-col lg:flex-row items-center justify-center">
          {/* IMAGE + ICONS */}
          <motion.div
            className="w-full lg:w-1/2 p-4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ImageSection producer={producer} />
          </motion.div>

          {/* TEXT + FEATURED */}
          <motion.div
            className="w-full lg:w-1/2 p-6 flex flex-col justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {producer.name}, <br /> Universe
            </h1>
            <p className="text-base sm:text-lg text-gray-700 mb-8">
              Más que eventos, nuestra pasión hecha realidad: un ecosistema completo donde cada detalle te sorprenderá.
            </p>

            {activeEvent && (
              <motion.div
                className="relative max-w-md mx-auto lg:mx-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <span className="absolute top-0 -left-2 bg-gray-700 text-white px-4 py-1 rounded-t-lg rounded-bl-lg uppercase text-xs sm:text-sm">
                  Destacado
                </span>
                <FeaturedEvent activeEvent={activeEvent} />
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 sm:py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Users, num: producer.totalClients, label: "Tickets Vendidos" },
            { icon: Award, num: producer.totalEvents, label: "Eventos Exitosos" },
            { icon: TrendingUp, num: "100%", label: "Satisfacción" },
          ].map(({ icon: Icon, num, label }, i) => (
            <motion.div
              key={i}
              className="text-center space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.2 }}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-zinc-700 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">{num}</div>
              <div className="text-gray-900 font-medium text-sm sm:text-base">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MISSION */}
      <section className="py-12 sm:py-20">
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
            className="text-3xl sm:text-4xl font-bold text-gray-900"
            variants={{ hidden: {}, visible: {} }}
          >
            Nuestra Misión
          </motion.h2>
          <motion.p
            className="text-lg sm:text-xl text-gray-800 leading-relaxed"
            variants={{ hidden: {}, visible: {} }}
          >
            En ONDA Producciones cada evento es una conexión auténtica entre música, arte y gastronomía, diseñada para emocionar.
          </motion.p>
        </motion.div>
      </section>

      <Footer producer={producer} />
    </div>
  );
};

export default Index;
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Award, TrendingUp, ExternalLink, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import { useProducer } from "@/context/ProducerContext";
import { cn } from "@/lib/utils";
import { EventDto, PaymentStatus } from "@/lib/types";
import { fetchProducerEventDetailData } from "@/lib/api";
import PaymentResult from "@/components/PaymentResult";
import { Link, useLocation } from "react-router-dom";
import { CountingNumber } from "@/components/animate-ui/text/counting-number";
import { useIsMobile } from "@/hooks/use-mobile";
import EventCarousel from "@/components/EventCarousel";
import { useTracking } from "@/hooks/use-tracking";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const { producer, loadingProducer } = useProducer();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { search } = location;
  const tracking = useTracking({ producer, currency: "ARS" });

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentEventId, setPaymentEventId] = useState<string | null>(null);
  const [loadingEventPayment, setLoadingEventPayment] = useState<boolean>(false);
  const [eventBought, setEventBought] = useState<EventDto>();
  const [isDialogVisible, setIsDialogVisible] = useState<boolean>(false);
  const [statsInView, setStatsInView] = useState(false);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const [videoStarted, setVideoStarted] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const status = q.get("collection_status") || q.get("status");
    const eid = q.get("event");
    if (status) {
      const params: Record<string, string> = {};
      q.forEach((v, k) => (params[k] = v));
      setPaymentStatus({ status, params });
      setPaymentEventId(eid);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!paymentEventId || !producer) return;
    (async () => {
      try {
        setLoadingEventPayment(true);
        const resp = await fetchProducerEventDetailData(Number(paymentEventId));
        if (resp.success && resp.data) setEventBought(resp.data);
      } catch (err) {
        console.error("Error fetching event details:", err);
      } finally {
        setLoadingEventPayment(false);
      }
    })();
  }, [paymentEventId, producer]);

  useEffect(() => {
    if (!paymentStatus) return;
    setIsDialogVisible(true);
    const t = setTimeout(() => setIsDialogVisible(false), 8000);
    return () => clearTimeout(t);
  }, [paymentStatus]);

  useEffect(() => {
    if (!producer || !statsSectionRef.current) return;
    const el = statsSectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [producer]);

  const featuredEvents = useMemo(
    () =>
      producer?.events
        ?.filter((event) => event.featured)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) ?? [],
    [producer]
  );

  const eventsForHeroCarousel = useMemo(() => {
    if (!producer) return [];
    return featuredEvents.length > 0 ? featuredEvents : producer.events.slice(0, 3);
  }, [featuredEvents, producer]);

  const meta = useMemo(() => {
    const siteName = producer?.name || "Produtik";
    const subtitle = producer?.webDetails?.subtitle ||
      "Explorando nuevas fronteras en la creación de eventos únicos.";
    const title = `Inicio — ${siteName}`;
    const description = subtitle.length > 180 ? subtitle.slice(0, 177) + "…" : subtitle;

    const origin = typeof window !== "undefined" ? window.location.origin : "https://example.com";
    const url = typeof window !== "undefined"
      ? `${origin}${location.pathname}${location.search}`
      : `${origin}/`;

    const ogImage = eventsForHeroCarousel[0]?.flyer ||
      producer?.logo ||
      "/og-default.jpg";

    const favicon = producer?.logo || "/favicon.svg";

    const orgLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: origin,
      logo: producer?.logo || undefined,
      sameAs: producer?.instagram ? [`https://instagram.com/${producer.instagram}`] : undefined,
    };

    const siteLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/events?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };

    const eventsLd =
      eventsForHeroCarousel.length > 0
        ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: eventsForHeroCarousel.slice(0, 5).map((ev, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Event",
              name: ev.name,
              startDate: ev.startDate,
              endDate: ev.endDate,
              image: ev.flyer,
              url: `${origin}/events?event=${ev.id}`,
            },
          })),
        }
        : null;

    return { siteName, title, description, url, ogImage, favicon, orgLd, siteLd, eventsLd };
  }, [producer, eventsForHeroCarousel, location.pathname, location.search]);

  useEffect(() => {
    if (!eventsForHeroCarousel.length) return;
    eventsForHeroCarousel.slice(0, 3).forEach((ev) => tracking.viewEvent(ev));
  }, [eventsForHeroCarousel, tracking]);

  useEffect(() => {
    if (!paymentStatus || !eventBought) return;
    const p = paymentStatus.params || {};
    const totalValue = Number(p.total || p.transaction_amount || p.amount || 0);
    const items: Array<{ prevent?: any; qty?: number }> = [];
    if ((eventBought as any).featuredPrevent) items.push({ prevent: (eventBought as any).featuredPrevent, qty: 1 });
    tracking.handleMercadoPagoReturn(paymentStatus, eventBought, totalValue, items);
  }, [paymentStatus, eventBought, tracking]);

  const handleHeroCta = useCallback(() => {
    if (eventsForHeroCarousel[0]) tracking.selectFromList("Hero CTA", eventsForHeroCarousel[0]);
  }, [eventsForHeroCarousel, tracking]);

  if (loadingProducer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Spinner />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950">
        <p className="font-medium text-lg text-white mb-3">Error al cargar los datos del productor.</p>
        <Link to="https://app.produtik.com" target="_blank">
          <div className="flex items-center gap-2 bg-blue-800 hover:bg-blue-800/80 text-white text-sm px-3 py-1 rounded-full shadow-lg cursor-pointer">
            Encontranos en Produtik <ExternalLink className="h-4 w-4" />
          </div>
        </Link>
      </div>
    );
  }

  const fallbackVideoUrl = "/fallbackvideo.mp4";
  const actualTickets = producer?.totalClients || producer?.webDetails?.totalTickets || 0;
  const actualEvents = producer?.totalEvents || producer?.webDetails?.totalEvents || 0;

  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.url} />
        <link rel="icon" href={meta.favicon} />
        <meta name="theme-color" content="#0a0a0a" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={meta.siteName} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.ogImage} />
        <meta property="og:url" content={meta.url} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.ogImage} />

        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(meta.orgLd)}</script>
        <script type="application/ld+json">{JSON.stringify(meta.siteLd)}</script>
        {meta.eventsLd && (
          <script type="application/ld+json">{JSON.stringify(meta.eventsLd)}</script>
        )}
      </Helmet>
      <div className="flex flex-col min-h-screen bg-neutral-950 text-white font-sans antialiased">
        <AnimatePresence>
          {isDialogVisible && (
            <motion.div
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              aria-modal="true"
              role="dialog"
            >
              <motion.div
                className="rounded-2xl bg-neutral-900/90 border border-white/10 backdrop-blur-xl shadow-xl max-w-md w-full p-4"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                {loadingEventPayment ? (
                  <div className="py-8 flex justify-center">
                    <Spinner />
                  </div>
                ) : (
                  paymentStatus && <PaymentResult status={paymentStatus.status} eventBought={eventBought} />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className={cn("flex-grow", isMobile ? "pt-0" : "pt-16")}>
          {/* HERO */}
          <section
            className={cn(
              "relative p-6 w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden text-center",
              eventsForHeroCarousel.length > 0 && "md:flex-row"
            )}
          >
            {!prefersReducedMotion && (
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
                aria-hidden="true"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-neutral-950/50 to-neutral-950/90 z-[1]" />

            {eventsForHeroCarousel.length > 0 && (
              <div className="relative z-[2] w-full md:w-1/2 max-w-[720px] mx-auto mb-2">
                <EventCarousel events={eventsForHeroCarousel} />
              </div>
            )}

            <div
              className={cn(
                "relative z-[2] flex flex-col w-full items-center justify-center",
                eventsForHeroCarousel.length > 0 ? "md:w-1/2 md:items-start" : "max-w-4xl"
              )}
            >
              <motion.h1
                className={cn(
                  "font-extrabold mb-5 leading-tight drop-shadow-lg text-center w-full",
                  eventsForHeroCarousel.length > 0
                    ? "text-3xl lg:text-5xl"
                    : "text-5xl"
                )}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
              >
                {producer.logo && (
                  <img
                    src={producer.logo}
                    alt={`Logo de ${producer.name}`}
                    className={cn(
                      "block rounded-full mx-auto mb-4 object-cover ring-1 ring-white/15",
                      eventsForHeroCarousel.length > 0
                        ? "h-20 w-20 md:h-28 md:w-28"
                        : "h-24 w-24 md:h-28 md:w-28"
                    )}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                {producer.name}
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg md:text-xl text-neutral-200/90 mb-8 max-w-2xl drop-shadow w-full"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3 }}
              >
                {producer.webDetails?.subtitle ??
                  "Explorando nuevas fronteras en la creación de eventos únicos."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.4 }}
                className="flex flex-wrap items-center gap-3 justify-center w-full"
              >
                <Link to={`/events${search}`} onClick={handleHeroCta}>
                  <button className="bg-white text-neutral-900 font-semibold py-3 px-7 rounded-full shadow-lg text-base md:text-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 inline-flex items-center">
                    Ver todos los eventos <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
              </motion.div>
            </div>
          </section>
          {/* ESTADÍSTICAS */}
          <section
            className="relative isolate py-12 bg-neutral-900/70 border-y border-white/5"
            ref={statsSectionRef}
            aria-labelledby="stats-heading"
          >
            {/* Glow sutil de fondo */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(800px_240px_at_50%_-60px,rgba(255,255,255,0.10),transparent)]" />
            <h2 id="stats-heading" className="sr-only">Indicadores de la productora</h2>

            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {[
                  { icon: Users, num: actualTickets, label: "Entradas vendidas" },
                  { icon: Award, num: actualEvents, label: "Eventos exitosos" },
                  { icon: TrendingUp, num: 100, label: "Satisfacción del cliente" },
                ].map(({ icon: Icon, num, label }, i) => (
                  <motion.article
                    key={i}
                    role="group"
                    aria-label={label}
                    className="rounded-2xl bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] py-4 text-center transition-all duration-300 hover:bg-white/[0.06] hover:-translate-y-1 focus-within:-translate-y-1 focus-within:ring-2 focus-within:ring-cyan-400/30"
                    initial={{ opacity: 0, y: 16 }}
                    animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                    transition={{ delay: 0.08 + i * 0.08, duration: 0.5 }}
                    tabIndex={0}
                  >
                    <div className="mx-auto mb-3 sm:mb-4 grid place-items-center">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition" style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.25), transparent)' }} />
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-1 ring-white/10 bg-white/10 grid place-items-center">
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
                        </div>
                      </div>
                    </div>

                    <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
                      {statsInView ? <CountingNumber number={Number(num)} /> : 0}
                      {label === "Satisfacción del cliente" && "%"}
                    </div>

                    <p className="mt-1 text-neutral-300 text-sm sm:text-base">{label}</p>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>

          {/* MISIÓN */}
          <section className="relative py-12 bg-neutral-950 overflow-hidden">
            {/* halo superior */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(700px_260px_at_50%_0%,rgba(34,211,238,0.14),transparent)]" />

            <motion.div
              className="max-w-5xl mx-auto px-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.12 } },
              }}
            >
              <motion.div
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                variants={{ hidden: {}, visible: {} }}
              >
                <motion.h2
                  className="text-3xl sm:text-4xl font-bold tracking-tight"
                  variants={{ hidden: {}, visible: {} }}
                >
                  Nuestra misión
                </motion.h2>

                {/* divisor sutil */}
                <div className="mx-auto mt-4 sm:mt-5 h-px w-24 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                <motion.p
                  className="mt-4 sm:mt-6 text-base sm:text-lg text-neutral-300 leading-relaxed"
                  variants={{ hidden: {}, visible: {} }}
                >
                  {producer.webDetails?.mission ?? `En ${producer.name}, cada evento es una conexión auténtica entre música, arte y gastronomía, diseñada para emocionar e inspirar.`}
                </motion.p>
              </motion.div>
            </motion.div>
          </section>
        </main>

        <Footer producer={producer} />
      </div>
    </>
  );
};

export default Index;

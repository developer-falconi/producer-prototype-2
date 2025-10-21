import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Filter, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { fetchProducerEventsData } from "@/lib/api";
import { EventDto } from "@/lib/types";
import { useProducer } from "@/context/ProducerContext";
import { useTracking } from "@/hooks/use-tracking";
import { useDebouncedValue } from "@/hooks/use-debounce";
import Spinner from "@/components/Spinner";
import { Helmet } from "react-helmet-async";

const VALID_STATUS = new Set(["all", "active", "completed", "upcoming"]);

const absolutize = (u?: string | null) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return origin + (u.startsWith("/") ? u : `/${u}`);
};

const buildShareUrl = (active: EventDto | null, promoterKey: string | null) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const slugOrId = active?.key?.trim()?.length ? active.key!.trim() : (active?.id != null ? String(active.id) : "");
  const promoter = promoterKey ? `&promoter=${encodeURIComponent(promoterKey)}` : "";
  const base = `${origin}${window.location.pathname}`;
  return slugOrId ? `${base}?event=${slugOrId}${promoter}` : `${origin}${window.location.pathname}${window.location.search}`;
};

const Events = () => {
  const { producer, loadingProducer } = useProducer();
  const tracking = useTracking({ producer });

  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");

  const [initialOpenEventId, setInitialOpenEventId] = useState<number | null>(null);
  const [promoterKey, setPromoterKey] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const activeEvent = useMemo(() => {
    const param = searchParams.get("event") || "";
    if (!param) return null;

    const maybeId = Number(param);
    if (Number.isFinite(maybeId)) {
      return events.find(e => e.id === maybeId) || null;
    }

    const normalized = param.trim().toLowerCase();
    return events.find(e => (e.key || "").toLowerCase() === normalized) || null;
  }, [searchParams, events]);

  const siteName = producer?.name || "Produtik";
  const baseTitle = producer?.webDetails?.eventTitle || "Nuestros Eventos";
  const baseSubtitle = producer?.webDetails?.eventSubtitle ||
    "Descubre todas las experiencias únicas que hemos creado y las que están por venir";

  const title = activeEvent ? `${activeEvent.name} — ${siteName}` : `${baseTitle} — ${siteName}`;

  const description = (() => {
    const raw = (activeEvent?.description || baseSubtitle || "").toString();
    return raw.length > 180 ? raw.slice(0, 177) + "…" : raw;
  })();

  const rawImage = activeEvent?.flyer || producer?.logo || "/og-default.jpg";
  const image = absolutize(rawImage);
  const iconHref = absolutize(activeEvent?.flyer || producer?.logo || "/favicon.svg");

  const shareUrl = buildShareUrl(activeEvent, promoterKey);

  const updateURLParams = (patch: Record<string, string | null | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await fetchProducerEventsData();
        if (resp.success && resp.data) {
          setEvents(resp.data);
        } else {
          console.error("Failed to fetch producer data:", resp);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const param = searchParams.get("event") || null;
    const promoterKeyParam = searchParams.get("promoter");

    setPromoterKey(promoterKeyParam || null);

    const qParam = searchParams.get("q") ?? "";
    if (qParam !== searchTerm) setSearchTerm(qParam);

    const statusParam = (searchParams.get("status") ?? "all").toLowerCase();
    const normalized = VALID_STATUS.has(statusParam)
      ? (statusParam as typeof statusFilter)
      : "all";
    if (normalized !== statusFilter) setStatusFilter(normalized);

    if (!param) {
      setInitialOpenEventId(null);
      return;
    }

    const maybeId = Number(param);
    if (Number.isFinite(maybeId)) {
      setInitialOpenEventId(maybeId);
      return;
    }

    const normalizedKey = param.trim().toLowerCase();
    const match = events.find(e => (e.key || "").toLowerCase() === normalizedKey);
    setInitialOpenEventId(match ? match.id : null);
  }, [searchParams, events]);


  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";
    const currentStatus = (searchParams.get("status") ?? "all").toLowerCase();

    const next: Record<string, string | null> = {
      q: searchTerm || null,
      status: statusFilter !== "all" ? statusFilter : null,
    };

    const sameQ = (next.q ?? "") === currentQ;
    const sameS = (next.status ?? "all") === currentStatus;
    if (!sameQ || !sameS) updateURLParams(next);
  }, [searchTerm, statusFilter]);

  const filteredEvents = useMemo(() => {
    let list = events;

    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter.toUpperCase());
    }

    return list;
  }, [events, debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!producer) return;
    tracking.search(debouncedSearch || "", filteredEvents.length);
  }, [debouncedSearch, filteredEvents.length, producer, tracking]);

  const handleSelectFromGrid = (e: EventDto) => {
    tracking.selectFromList("events_grid", e);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        ev.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    updateURLParams({ q: null, status: null });
  };

  const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10 animate-pulse">
      <div className="h-[350px] bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-white/10 rounded" />
        <div className="h-4 w-1/2 bg-white/10 rounded" />
        <div className="h-9 w-24 bg-white/10 rounded mt-2" />
      </div>
    </div>
  );

  if (loading || loadingProducer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2e5d4] text-[#951f1f]">
        <Spinner textColor="text-[#951f1f]" borderColor="border-t-[#951f1f]" />
        <span className="sr-only">Cargando eventos…</span>
      </div>
    )
  }

  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>{title}</title>
        <link rel="icon" href={iconHref} />
        <meta name="theme-color" content="#000000" />

        <link rel="canonical" href={shareUrl} />

        <meta name="description" content={description} />

        {/* Open Graph */}
        <meta property="og:type" content={activeEvent ? "event" : "website"} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:image:secure_url" content={image} />
        <meta property="og:image:alt" content={activeEvent ? activeEvent.name : siteName} />
        {/* Tamaños típicos para previews grandes */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={shareUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta name="twitter:image:alt" content={activeEvent ? activeEvent.name : siteName} />

        {activeEvent && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              name: activeEvent.name,
              startDate: activeEvent.startDate,
              endDate: activeEvent.endDate,
              image: [image],
              description,
              organizer: { "@type": "Organization", name: siteName },
              url: shareUrl
            })}
          </script>
        )}
      </Helmet>
      <div className="relative min-h-screen bg-[#f2e5d4] text-[#951f1f]">
        {producer ? (
          <>
            {/* Header */}
            <header className="container max-w-7xl mx-auto p-6 text-center">
              <h1 className="text-4xl lg:text-5xl font-bold my-3">
                {producer?.webDetails?.eventTitle || "Nuestros Eventos"}
              </h1>
              <p className="text-lg md:text-xl max-w-2xl mx-auto">
                {producer?.webDetails?.eventSubtitle ||
                  "Descubre todas las experiencias únicas que hemos creado y las que están por venir"}
              </p>
            </header>

            {/* Filtros sticky */}
            <div className="border-y border-white/10 bg-stone-300 backdrop-blur">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:flex-nowrap md:items-center gap-3 py-3">
                  {/* Buscar – ocupa 1/2 en md */}
                  <div className="relative w-full md:basis-1/2 md:flex-shrink-0 text-[#951f1f]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                    <Input
                      ref={searchRef}
                      placeholder="Buscar eventos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/15 text-[#951f1f] placeholder-[#951f1f] focus:ring-0 focus:border-white"
                      aria-label="Buscar eventos"
                    />
                  </div>

                  {/* Grupo derecho – comparte la otra mitad */}
                  <div className="flex w-full md:basis-1/2 md:items-center gap-3">
                    {/* Estado */}
                    <div className="flex items-center">
                      <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                      >
                        <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/15 text-[#951f1f]">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                          <SelectItem value="all" className="cursor-pointer">Todos</SelectItem>
                          <SelectItem value="active" className="cursor-pointer">Activos</SelectItem>
                          <SelectItem value="upcoming" className="cursor-pointer">Próximos</SelectItem>
                          <SelectItem value="completed" className="cursor-pointer">Finalizados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Limpiar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-[#951f1f] hover:text-white hover:bg-white/10"
                      title="Limpiar filtros"
                      aria-label="Limpiar filtros"
                    >
                      <X className="w-4 h-4 mr-1" /> Limpiar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <main className="max-w-7xl mx-auto p-8">
              {/* Loading con skeletons */}
              {(loading || loadingProducer) && (
                <div className="grid md:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Grid */}
              {!loading && !loadingProducer && (
                <>
                  <div className="grid md:grid-cols-3 gap-8">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        role="group"
                        className="contents"
                        onClick={() => handleSelectFromGrid(event)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") handleSelectFromGrid(event);
                        }}
                      >
                        <EventCard
                          event={event}
                          initialOpenEventId={initialOpenEventId}
                          promoterKey={promoterKey}
                          setSearchParams={setSearchParams}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Empty state */}
                  {filteredEvents.length === 0 && (
                    <div className="text-center py-16">
                      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                        <Search className="h-6 w-6 text-[#951f1f]" />
                      </div>
                      <div className="text-[#951f1f] text-lg mb-2">
                        No se encontraron eventos
                      </div>
                      <p className="text-[#951f1f] mb-6">
                        Intenta ajustar la búsqueda o cambiar el estado
                      </p>
                      <Button onClick={clearFilters} className="bg-white text-black hover:bg-white/90">
                        Quitar filtros
                      </Button>
                    </div>
                  )}
                </>
              )}
            </main>
            <Footer producer={producer} />
          </>
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <p className="font-medium text-lg text-white mb-2">
              Error al cargar los datos del productor.
            </p>
            <Link to="https://app.produtik.com" target="_blank">
              <div className="flex items-center gap-2 bg-[#001B97] hover:[#001B97]/80 text-white text-sm px-3 py-1 rounded-full shadow-lg cursor-pointer">
                Encontranos en Produtik <ExternalLink className="h-4 w-4" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Events;
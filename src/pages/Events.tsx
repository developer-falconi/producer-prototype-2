import { useState, useEffect } from "react";
import { Search, Filter, ExternalLink } from "lucide-react";
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
import Spinner from "@/components/Spinner";
import EventCard from "@/components/EventCard";
import { fetchProducerEventsData } from "@/lib/api";
import { Event } from "@/lib/types";
import { useProducer } from "@/context/ProducerContext";

const Events = () => {
  const { producer, loadingProducer } = useProducer();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [initialOpenEventId, setInitialOpenEventId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await fetchProducerEventsData();
        if (resp.success && resp.data) {
          setEvents(resp.data);
          setFilteredEvents(resp.data);
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
    const eventIdParam = searchParams.get("event");
    setInitialOpenEventId(eventIdParam ? Number(eventIdParam) : null);
  }, [searchParams]);

  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (e) => e.status === statusFilter.toUpperCase()
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, statusFilter]);

  if (loading || loadingProducer) {
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
    <div className="relative min-h-screen bg-gradient-to-br from-black via-black to-gray-900">
      <div className="container max-w-7xl mx-auto">
        {/* header and filters unchanged */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Nuestros Eventos
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Descubre todas las experiencias únicas que hemos creado y las que
            están por venir
          </p>
        </div>

        <div
          className="flex flex-col md:flex-row gap-4 mb-8 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 w-5 h-5" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-gray-900/20 text-white placeholder:text-white"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-white/10 border-gray-900/20 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem
                value="all"
                className="text-white hover:bg-slate-700 cursor-pointer"
              >
                Todos
              </SelectItem>
              <SelectItem
                value="active"
                className="text-white hover:bg-slate-700 cursor-pointer"
              >
                Activos
              </SelectItem>
              <SelectItem
                value="completed"
                className="text-white hover:bg-slate-700 cursor-pointer"
              >
                Finalizados
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              initialOpenEventId={initialOpenEventId}
              setSearchParams={setSearchParams}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-white text-lg mb-4">
              No se encontraron eventos
            </div>
            <p className="text-gray-800">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>

      <Footer producer={producer} />
    </div>
  );
};

export default Events;

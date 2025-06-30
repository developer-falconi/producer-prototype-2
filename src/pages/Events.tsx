
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Search, Filter, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with expanded mock data
    const mockEvents = [
      {
        "id": 6,
        "name": "ØNDA en Escena cap.5 - Música, teatro y vino",
        "description": "En la quinta edición de ØNDA en Escena, te traemos dos presentaciones espectaculares: \"Manchas\", una obra de teatro y un Trío vocal con pop, soul y funk.",
        "shortDescription": "Teatro, música vocal y vino en una experiencia única",
        "startDate": "2025-06-28T22:00:00.000Z",
        "endDate": "2025-06-29T02:00:00.000Z",
        "location": "Teatro Espacio de Arte (Av. Sucre 437, San Isidro)",
        "status": "COMPLETED",
        "logo": "http://res.cloudinary.com/djecjeokj/image/upload/v1749661298/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20en%20Escena%20cap.5%20-%20M%C3%BAsica%2C%20teatro%20y%20vino/Flyers/gjjt0pe1w2xrjwbekzi1.jpg",
        "category": "Teatro y Música",
        "ticketPrice": "16000.00",
        "totalCapacity": 91,
        "soldTickets": 85,
        "prevents": [
          { "id": 18, "name": "Tanda 1 (19hs)", "price": "16000.00", "status": "SOLD_OUT", "remaining": 0 },
          { "id": 17, "name": "Tanda 2 (21hs)", "price": "16000.00", "status": "INACTIVE", "remaining": 6 }
        ]
      },
      {
        "id": 5,
        "name": "ØNDA Session x Fermín B",
        "description": "ØNDA Producciones te trae la décima edición de las ØNDA Sessions, esta vez con Fermín Bereciartua como músico principal.",
        "shortDescription": "Música en vivo, arte y gastronomía con Fermín Bereciartua",
        "startDate": "2025-06-06T23:00:00.000Z",
        "endDate": "2025-06-07T02:00:00.000Z",
        "location": "Barrio Laguna del Sol",
        "status": "COMPLETED",
        "logo": "http://res.cloudinary.com/djecjeokj/image/upload/v1748473281/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20Session%20cap.%2010%20x%20Ferm%C3%ADn%20B/Flyers/d543uoapumsbw76ucu4j.jpg",
        "category": "Música",
        "ticketPrice": "16000.00",
        "totalCapacity": 40,
        "soldTickets": 31,
        "prevents": [
          { "id": 13, "name": "ØNDA Session x Fermín B", "price": "16000.00", "status": "INACTIVE", "remaining": 9 }
        ]
      },
      {
        "id": 7,
        "name": "ØNDA Session Acústica - Primavera",
        "description": "Una tarde de música acústica con artistas locales en un ambiente íntimo y relajado.",
        "shortDescription": "Música acústica en un ambiente íntimo",
        "startDate": "2025-07-15T20:00:00.000Z",
        "endDate": "2025-07-15T23:00:00.000Z",
        "location": "Café Cultural El Refugio",
        "status": "ACTIVE",
        "logo": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
        "category": "Música",
        "ticketPrice": "12000.00",
        "totalCapacity": 30,
        "soldTickets": 18,
        "prevents": [
          { "id": 19, "name": "Entrada General", "price": "12000.00", "status": "ACTIVE", "remaining": 12 }
        ]
      },
      {
        "id": 8,
        "name": "Arte y Vino - Exposición Colectiva",
        "description": "Una noche dedicada al arte visual con una exposición colectiva de artistas emergentes, acompañada de degustación de vinos.",
        "shortDescription": "Exposición de arte con degustación de vinos",
        "startDate": "2025-07-22T19:00:00.000Z",
        "endDate": "2025-07-22T22:00:00.000Z",
        "location": "Galería Espacio Creativo",
        "status": "ACTIVE",
        "logo": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop",
        "category": "Arte",
        "ticketPrice": "15000.00",
        "totalCapacity": 50,
        "soldTickets": 23,
        "prevents": [
          { "id": 20, "name": "Entrada con Degustación", "price": "15000.00", "status": "ACTIVE", "remaining": 27 }
        ]
      }
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = events;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(event => {
        if (statusFilter === "active") return event.status === "ACTIVE";
        if (statusFilter === "completed") return event.status === "COMPLETED";
        return true;
      });
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, statusFilter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    if (status === "ACTIVE") {
      return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Activo</span>;
    }
    if (status === "COMPLETED") {
      return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">Finalizado</span>;
    }
    return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">Próximamente</span>;
  };

  const getAvailabilityInfo = (event) => {
    const totalSold = event.soldTickets;
    const total = event.totalCapacity;
    const percentage = Math.round((totalSold / total) * 100);
    
    if (event.status === "COMPLETED") {
      return { text: "Evento finalizado", color: "text-gray-400" };
    }
    
    if (percentage >= 100) {
      return { text: "Sold Out", color: "text-red-400" };
    }
    
    if (percentage >= 80) {
      return { text: `Últimas ${total - totalSold} entradas`, color: "text-yellow-400" };
    }
    
    return { text: `${total - totalSold} disponibles`, color: "text-green-400" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="pt-32 pb-20 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white text-lg">Cargando eventos...</p>
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
              Nuestros Eventos
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Descubre todas las experiencias únicas que hemos creado y las que están por venir
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                <SelectItem value="active" className="text-white hover:bg-slate-700">Activos</SelectItem>
                <SelectItem value="completed" className="text-white hover:bg-slate-700">Finalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => {
              const availability = getAvailabilityInfo(event);
              
              return (
                <Card 
                  key={event.id} 
                  className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden group hover:bg-white/15 transition-all duration-500 hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img 
                        src={event.logo} 
                        alt={event.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-purple-300 text-sm font-medium">{event.category}</span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{event.name}</h3>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.shortDescription}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          {formatDate(event.startDate)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <Clock className="w-4 h-4 text-purple-400" />
                          {formatTime(event.startDate)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <MapPin className="w-4 h-4 text-purple-400" />
                          {event.location.split('(')[0]}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-white">
                          <span className="text-lg font-bold">${parseInt(event.ticketPrice).toLocaleString()}</span>
                        </div>
                        <div className={`text-sm font-medium ${availability.color}`}>
                          {availability.text}
                        </div>
                      </div>
                      
                      <Button 
                        asChild 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                      >
                        <Link to={`/event/${event.id}`}>
                          {event.status === "COMPLETED" ? "Ver Detalles" : "Comprar Entradas"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-gray-400 text-lg mb-4">No se encontraron eventos</div>
              <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Events;


import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Clock, Users, CreditCard, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    documentNumber: "",
    phone: "",
    gender: "",
    email: "",
    selectedPrevent: "",
    paymentMethod: "mercadopago"
  });
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    // Mock event data based on ID
    const mockEvents = {
      "6": {
        "id": 6,
        "name": "ØNDA en Escena cap.5 - Música, teatro y vino",
        "description": "En la quinta edición de ØNDA en Escena, te traemos dos presentaciones espectaculares:\n\n🎭 \"Manchas\", una obra de teatro.\nDramaturgia: Carmela Pando.\nDirección: Joaquín Ochoa. \nElenco: Carmela Pando y Tadeo Macri. \nMúsica original: Bautista Caillet-Bois.\nProducción general: Carmela Pando.\n\n🎤  Trío vocal: show a tres voces con canciones de pop, soul y funk. \nVoces: Felicitas Carman, Josefina Louge y Milagros Huergo\nGuitarra: Bachi Guyot\n\n🌼 Además: exposición de fotografía (@bjorrnx), venta de ropa (@aticothrft), accesorios (@verv1c) , y mucha, mucha ønda!\n\n⏰ HORARIOS\n     Tanda 1 - 19:00 (SOLD OUT!)\n     Tanda 2 - 21:00\n\n¡Tu entrada incluye una copa de vino Portillo!🍷😊\n\nAcompañan: Portillo Wines y Cerveza Escalada",
        "startDate": "2025-06-28T22:00:00.000Z",
        "endDate": "2025-06-29T02:00:00.000Z",
        "location": "Teatro Espacio de Arte (Av. Sucre 437, San Isidro)",
        "status": "COMPLETED",
        "logo": "http://res.cloudinary.com/djecjeokj/image/upload/v1749661298/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20en%20Escena%20cap.5%20-%20M%C3%BAsica%2C%20teatro%20y%20vino/Flyers/gjjt0pe1w2xrjwbekzi1.jpg",
        "category": "Teatro y Música",
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
      "5": {
        "id": 5,
        "name": "ØNDA Session x Fermín B",
        "description": "ØNDA Producciones te trae la décima edición de las ØNDA Sessions, esta vez con Fermín Bereciartua como músico principal.\n\n🍷 Tu entrada incluye una copa de vino Portillo y una consumición de comida!\n\n🤩 Música, expo de arte, ropa vintage, accesorios, gastronomía y mucha, mucha buena ønda\n\nAcompañan: Portillo Wines y Cerveza Escalada",
        "startDate": "2025-06-06T23:00:00.000Z",
        "endDate": "2025-06-07T02:00:00.000Z",
        "location": "Barrio Laguna del Sol",
        "status": "COMPLETED",
        "logo": "http://res.cloudinary.com/djecjeokj/image/upload/v1748473281/Productoras/ONDA%20Producciones/Eventos/%C3%98NDA%20Session%20cap.%2010%20x%20Ferm%C3%ADn%20B/Flyers/d543uoapumsbw76ucu4j.jpg",
        "category": "Música",
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
      },
      "7": {
        "id": 7,
        "name": "ØNDA Session Acústica - Primavera",
        "description": "Una tarde de música acústica con artistas locales en un ambiente íntimo y relajado. Disfruta de una experiencia única donde la música se fusiona con el arte y la gastronomía en un espacio acogedor.\n\n🎵 Lineup:\n- Artistas locales emergentes\n- Música acústica y folk\n- Ambiente íntimo y relajado\n\n🍷 Incluye:\n- Bienvenida con bebida\n- Snacks artesanales\n- Ambiente único\n\nUn evento perfecto para disfrutar de buena música en un ambiente relajado y conectar con otros amantes del arte.",
        "startDate": "2025-07-15T20:00:00.000Z",
        "endDate": "2025-07-15T23:00:00.000Z",
        "location": "Café Cultural El Refugio (Palermo, CABA)",
        "status": "ACTIVE",
        "logo": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
        "category": "Música",
        "prevents": [
          {
            "id": 19,
            "name": "Entrada General",
            "price": "12000.00",
            "quantity": 30,
            "status": "ACTIVE",
            "remaining": 12
          }
        ]
      }
    };

    setTimeout(() => {
      const eventData = mockEvents[id];
      if (eventData) {
        setEvent(eventData);
      }
      setLoading(false);
    }, 1000);
  }, [id]);

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      toast({
        title: "Archivo cargado",
        description: `${file.name} ha sido cargado correctamente.`,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const requiredFields = ['fullName', 'documentNumber', 'phone', 'gender', 'email', 'selectedPrevent'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    if (formData.paymentMethod === "transfer" && !proofFile) {
      toast({
        title: "Comprobante requerido",
        description: "Por favor adjunta el comprobante de transferencia.",
        variant: "destructive"
      });
      return;
    }

    // Process purchase
    console.log("Purchase data:", formData);
    console.log("Proof file:", proofFile);

    if (formData.paymentMethod === "mercadopago") {
      // Simulate Mercado Pago redirect
      window.open("https://www.mercadopago.com.ar", "_blank");
    }

    toast({
      title: "¡Compra procesada!",
      description: "Tu solicitud ha sido enviada correctamente. Te contactaremos pronto.",
    });

    setShowPurchaseForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="pt-32 pb-20 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white text-lg">Cargando evento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="pt-32 pb-20 px-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Evento no encontrado</h1>
          <Button asChild>
            <Link to="/events">Volver a Eventos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const availablePrevents = event.prevents.filter(p => p.status === "ACTIVE" && p.remaining > 0);
  const canPurchase = event.status === "ACTIVE" && availablePrevents.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10 mb-6">
            <Link to="/events">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Eventos
            </Link>
          </Button>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Event Image */}
            <div className="animate-fade-in">
              <img 
                src={event.logo} 
                alt={event.name}
                className="w-full h-96 object-cover rounded-2xl shadow-2xl"
              />
            </div>

            {/* Event Details */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div>
                <span className="text-purple-400 text-sm font-medium">{event.category}</span>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mt-2 mb-4">
                  {event.name}
                </h1>
                
                <div className="flex items-center gap-1 mb-2">
                  {event.status === "ACTIVE" && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      Entradas Disponibles
                    </span>
                  )}
                  {event.status === "COMPLETED" && (
                    <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">
                      Evento Finalizado
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  <span>{event.location}</span>
                </div>
              </div>

              {/* Ticket Options */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Opciones de Entrada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.prevents.map((prevent) => (
                    <div key={prevent.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">{prevent.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {prevent.status === "SOLD_OUT" 
                            ? "Agotado" 
                            : prevent.status === "ACTIVE" 
                            ? `${prevent.remaining} disponibles`
                            : "No disponible"
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          ${parseInt(prevent.price).toLocaleString()}
                        </div>
                        {prevent.status === "SOLD_OUT" && (
                          <span className="text-red-400 text-sm font-medium">AGOTADO</span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Purchase Button */}
              {canPurchase && (
                <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Comprar Entradas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Comprar Entradas - {event.name}</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName" className="text-white">Nombre Completo *</Label>
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="documentNumber" className="text-white">DNI/Pasaporte *</Label>
                          <Input
                            id="documentNumber"
                            value={formData.documentNumber}
                            onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone" className="text-white">Teléfono *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="gender" className="text-white">Género *</Label>
                          <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="masculine" className="text-white hover:bg-slate-700">Masculino</SelectItem>
                              <SelectItem value="feminine" className="text-white hover:bg-slate-700">Femenino</SelectItem>
                              <SelectItem value="other" className="text-white hover:bg-slate-700">Otro</SelectItem>
                              <SelectItem value="prefer-not-to-say" className="text-white hover:bg-slate-700">Prefiero no decir</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-white">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-white">Tipo de Entrada *</Label>
                        <RadioGroup 
                          value={formData.selectedPrevent} 
                          onValueChange={(value) => handleInputChange('selectedPrevent', value)}
                          className="mt-2"
                        >
                          {availablePrevents.map((prevent) => (
                            <div key={prevent.id} className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
                              <RadioGroupItem value={prevent.id.toString()} id={prevent.id.toString()} />
                              <label htmlFor={prevent.id.toString()} className="flex-1 cursor-pointer">
                                <div className="flex justify-between items-center">
                                  <span className="text-white">{prevent.name}</span>
                                  <span className="text-purple-400 font-bold">${parseInt(prevent.price).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-400 text-sm">{prevent.remaining} disponibles</p>
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <div>
                        <Label className="text-white">Método de Pago *</Label>
                        <RadioGroup 
                          value={formData.paymentMethod} 
                          onValueChange={(value) => handleInputChange('paymentMethod', value)}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
                            <RadioGroupItem value="mercadopago" id="mercadopago" />
                            <label htmlFor="mercadopago" className="flex-1 cursor-pointer text-white">
                              Mercado Pago (Tarjeta de crédito/débito)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
                            <RadioGroupItem value="transfer" id="transfer" />
                            <label htmlFor="transfer" className="flex-1 cursor-pointer text-white">
                              Transferencia Bancaria
                            </label>
                          </div>
                        </RadioGroup>
                      </div>

                      {formData.paymentMethod === "transfer" && (
                        <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <h4 className="text-white font-medium">Datos para Transferencia:</h4>
                          <div className="text-sm text-gray-300 space-y-1">
                            <p><strong>Banco:</strong> Banco Nación</p>
                            <p><strong>CBU:</strong> 0110590520059051234567</p>
                            <p><strong>Titular:</strong> ONDA Producciones</p>
                            <p><strong>CUIT:</strong> 20-12345678-9</p>
                          </div>
                          
                          <div>
                            <Label htmlFor="proof" className="text-white">Comprobante de Pago *</Label>
                            <div className="mt-2">
                              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-purple-400 transition-colors">
                                <Upload className="w-5 h-5 mr-2" />
                                {proofFile ? proofFile.name : "Seleccionar archivo"}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*,.pdf"
                                  onChange={handleFileUpload}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 flex gap-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowPurchaseForm(false)}
                          className="flex-1 border-white/30 text-white hover:bg-white/10"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        >
                          {formData.paymentMethod === "mercadopago" ? "Pagar con Mercado Pago" : "Enviar Solicitud"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Event Description */}
          <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Sobre el Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {event.description}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventDetail;

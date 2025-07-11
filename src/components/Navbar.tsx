import { Link, useLocation } from "react-router-dom";
import { Home, Ticket, Images } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useProducer } from "@/context/ProducerContext";
import { useEffect } from "react";
import { initializeGoogleAnalytics } from "@/lib/analytics";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const navItems = [
  { path: "/", label: "Inicio", icon: <Home size={20} /> },
  { path: "/events", label: "Eventos", icon: <Ticket size={20} /> },
  { path: "/gallery", label: "Galería", icon: <Images size={20} /> }
];

const Navbar = () => {
  const { producer } = useProducer();
  const isMobile = useIsMobile();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderLink = (item: typeof navItems[number]) => (
    <Link
      key={item.path}
      to={item.path}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-lg transition",
        isActive(item.path) ? "bg-blue-800 rounded-lg text-white" : "text-white hover:text-blue-800"
      )}
    >
      {item.icon}
      {!isMobile && <span>{item.label}</span>}
    </Link>
  );

  useEffect(() => {
    if (producer) {
      document.title = `${producer.name} Platform`;
      const faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = producer.logo || '/favicon.svg';
      }

      if (producer.googleAnalyticsId) initializeGoogleAnalytics(producer.googleAnalyticsId);
    } else {
      document.title = 'Producer Platform';
    }
  }, [producer]);
  
  if(!producer) return

  return (
    <nav
      className={cn(
        "fixed inset-x-0 z-40 bg-black/80 backdrop-blur-lg",
        isMobile ? "bottom-4 rounded-lg mx-4" : "top-0 border-b border-white/10"
      )}
    >
      <div className="max-w-7xl mx-auto px-4">
        {isMobile ? (
          <div className="flex justify-around items-center h-12">
            {navItems.map(renderLink)}
          </div>
        ) : (
          <div className="flex items-center justify-between h-16">
            <>
              <Link
                to="/"
                className="flex items-center gap-2 font-medium text-white hover:scale-105 transition"
              >
                <Avatar>
                  <AvatarImage src={producer?.logo} alt={producer?.name || 'logo'} />
                  <AvatarFallback>{producer?.name}</AvatarFallback>
                </Avatar>
                {producer?.name} Universe
              </Link>
            </>

            <div className="flex items-center space-x-8">
              {navItems.slice(0, 3).map(renderLink)}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

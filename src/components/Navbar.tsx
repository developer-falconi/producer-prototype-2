import { Link, useLocation } from "react-router-dom";
import { Home, Ticket, Images, TicketSlash } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useProducer } from "@/context/ProducerContext";
import OptimizedImage from "@/components/OptimizedImage";

const navItems = [
  { path: "/", label: "Inicio", icon: <Home size={20} /> },
  { path: "/events", label: "Eventos", icon: <Ticket size={20} /> },
  { path: "/gallery", label: "Galería", icon: <Images size={20} /> },
  // { path: "/devoluciones", label: "Devoluciones", icon: <TicketSlash size={20} />, },
];

const Navbar = () => {
  const { producer } = useProducer();
  const isMobile = useIsMobile();
  const location = useLocation();
  const initials = producer?.name
    ? producer.name
        .split(" ")
        .map((segment) => segment[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "PT";
  const { search } = location;
  const isActive = (path: string) => location.pathname === path;

  const renderLink = (item: typeof navItems[number]) => (
    <Link
      key={item.path}
      to={`${item.path}${search}`}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-lg transition",
        isActive(item.path) ? "bg-[#001B97] rounded-lg text-white" : "text-white hover:text-blue-400"
      )}
    >
      {item.icon}
      {!isMobile && <span>{item.label}</span>}
    </Link>
  );

  if (!producer) return null;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 z-40 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60",
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
            <Link
              to={`/${search}`}
              className="flex items-center gap-2 font-medium text-white hover:scale-105 transition"
            >
              <span className="relative h-9 w-9 flex-shrink-0 rounded-full overflow-hidden bg-transparent">
                {producer?.logo ? (
                  <OptimizedImage
                    src={producer.logo}
                    alt={producer.name || "logo"}
                    transformOptions={{ width: 256, height: 256, crop: "fit", gravity: "auto" }}
                    sizes="36px"
                    wrapperClassName="absolute inset-0"
                    className="h-full w-full object-cover"
                    loading="eager"
                    enableBlur={false}
                    fallbackSrc="https://via.placeholder.com/256?text=Logo"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase">
                    {initials}
                  </span>
                )}
              </span>
              {producer?.name}
            </Link>
            <div className="flex items-center space-x-8">{navItems.map(renderLink)}</div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

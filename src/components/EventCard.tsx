import { Calendar, CircleDollarSign, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatEventDate, formatEventPrice } from "@/lib/utils";
import { EventDto, EventStatus, Prevent, PreventStatusEnum } from "@/lib/types";
import { useEffect, useState } from "react";
import { SetURLSearchParams } from "react-router-dom";
import { TicketPurchaseFlow } from "./TicketPurchase/TicketPurchaseFlow";
import QuickInEventPurchaseFlow from "./InEventPurchase/InEventPurchaseFlow";
import { useProducer } from "@/context/ProducerContext";
import { useTracking } from "@/hooks/use-tracking";

interface EventCardProps {
  event: EventDto;
  initialOpenEventId: number | null;
  promoterKey: string | null;
  setSearchParams: SetURLSearchParams;
}

const EventCard: React.FC<EventCardProps> = ({ event, initialOpenEventId, promoterKey, setSearchParams }) => {
  const { producer } = useProducer();
  const tracking = useTracking({ producer });

  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  useEffect(() => {
    if (initialOpenEventId && event.id === initialOpenEventId) {
      setIsEventDetailsOpen(true);
    }
  }, [initialOpenEventId, event.id]);

  useEffect(() => {
    if (isEventDetailsOpen) {
      try {
        tracking.viewEvent(event);
      } catch (e) {
        console.warn("viewEvent tracking error:", e);
      }
    }
  }, [isEventDetailsOpen, event, tracking]);

  const statusColors = {
    ACTIVE: "bg-green-800",
    COMPLETED: "bg-blue-800",
    INACTIVE: "bg-orange-800",
    CANCELLED: "bg-red-800",
    UPCOMING: "bg-violet-700",
  };

  const statusColor = statusColors[event?.status] || "bg-gray-500";

  const getFirstPreventDate = (preventasList: Prevent[] | undefined) => {
    if (!preventasList || preventasList.length === 0) return null;
    const sorted = [...preventasList].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    return sorted[0]?.startDate ? new Date(sorted[0].startDate) : null;
  };

  const handleCardClick = () => {
    try {
      tracking.selectFromList("events_grid", event);
    } catch (e) {
      console.warn("selectFromList tracking error:", e);
    }

    setIsEventDetailsOpen(true);
    setSearchParams((prev) => {
      const slugOrId = (event.key?.trim()?.length ? event.key!.trim() : String(event.id));
      prev.set("event", slugOrId);
      return prev;
    });
  };

  const handleCloseDetails = () => {
    setIsEventDetailsOpen(false);
    setSearchParams(prev => {
      prev.delete('event');
      return prev;
    });
  };

  const getFeaturedPrevent = (preventasList: Prevent[]): Prevent | null => {
    return preventasList.find((preventa) => preventa.featured) || null;
  };

  const getOldestActivePrevent = (preventasList: Prevent[]): Prevent | null => {
    const activePreventas = preventasList.filter(
      (preventa) => preventa.status === PreventStatusEnum.ACTIVE
    );

    if (activePreventas.length === 0) {
      return null;
    }

    activePreventas.sort((a, b) => {
      const endDateA = new Date(a.endDate).getTime();
      const endDateB = new Date(b.endDate).getTime();
      return endDateA - endDateB;
    });

    return activePreventas[0];
  };

  const displayPrice = event.prevents && event.prevents.length > 0
    ? getFeaturedPrevent(event.prevents)?.price || getOldestActivePrevent(event.prevents)?.price
    : null;

  const formattedPrice = displayPrice === 0
    ? 'Liberada'
    : (displayPrice ? formatEventPrice(displayPrice) : '-');

  const firstPreventDate = getFirstPreventDate(event.prevents);
  const isUpcoming = event.status === EventStatus.UPCOMING;
  const isCompleted = event.status === EventStatus.COMPLETED;
  const isLive = new Date() >= new Date(event.salesEndDate) && new Date() < new Date(event.endDate);

  return (
    <>
      <Card
        onClick={handleCardClick}
        className={cn(
          "bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden cursor-pointer",
          "group hover:bg-white/15 transition-all duration-500 hover:scale-105 animate-fade-in z-10",
          isLive && 'border-4 border-red-700'
        )}
      >
        <CardContent className="p-0 relative min-h-[500px]">
          {isLive && (
            <Radio className="absolute top-2 right-2 bg-red-700 text-white h-7 w-7 text-xs font-bold p-1 rounded-full z-30 animate-pulse" />
          )}

          {isUpcoming && (
            <div className="absolute top-3 left-3 z-30">
              <div
                className={cn(
                  "flex flex-col items-start text-white rounded-lg px-3 py-2 shadow-lg shadow-black/20",
                  statusColor
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Próximamente
                  </span>
                </div>
                {firstPreventDate && (
                  <span className="text-[11px] mt-0.5 font-medium opacity-90">
                    A la venta: {formatEventDate(firstPreventDate.toISOString())}
                  </span>
                )}
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="absolute top-3 left-3 z-30">
              <div
                className={cn(
                  "flex flex-col items-start text-white rounded-lg px-3 py-2 shadow-lg shadow-black/20",
                  statusColor
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Finalizado
                  </span>
                </div>
                {event.endDate && (
                  <span className="text-[11px] mt-0.5 font-medium opacity-90">
                    Terminó: {formatEventDate(event.endDate)}
                  </span>
                )}
              </div>
            </div>
          )}

          <img
            src={event.flyer}
            alt={event.name}
            className="absolute inset-0 w-full h-full aspect-9/16 object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-black via-black/50 to-transparent">
            {
              !isCompleted && (
                <div className={cn(
                  'absolute bottom-6 right-6', statusColor,
                  'text-white rounded-md px-2 py-1 text-xs h-11 w-11',
                  'flex items-center justify-center'
                )}>
                  <div className="flex flex-col items-center font-medium">
                    <span className="m-0 text-sm">{formatEventDate(event.startDate).split(' ')[0]}</span>
                    <span className="m-0">{formatEventDate(event.startDate).split(' ')[1]}</span>
                  </div>
                </div>
              )
            }

            {/* event Details */}
            <div className="flex flex-col justify-end h-full">
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg line-clamp-2">{event.name}</h3>

                {!isCompleted && (
                  <div className="flex justify-between space-y-2">
                    <div className="flex just items-center gap-2 text-white text-sm font-medium">
                      <CircleDollarSign className="w-4 h-4 text-white" />
                      <span className="text-base font-semibold text-white">
                        {formattedPrice}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEventDetailsOpen && (
        isLive ? (
          <QuickInEventPurchaseFlow
            event={event}
            isOpen={isEventDetailsOpen}
            onClose={handleCloseDetails}
          />
        ) : (
          <TicketPurchaseFlow
            initialEvent={event}
            isOpen={isEventDetailsOpen}
            promoterKey={promoterKey}
            onClose={handleCloseDetails}
          />
        )
      )}
    </>
  );
};

export default EventCard;
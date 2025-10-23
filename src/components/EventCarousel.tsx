import { EventDto } from "@/lib/types";
import { Link, useSearchParams } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay, EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import { cn } from "@/lib/utils";
import CountdownTimer from "./CountdownTimer";
import { Radio } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const EventCarousel = ({ events }: { events: EventDto[] }) => {
  if (!events || events.length === 0) return null;

  const [searchParams] = useSearchParams();
  const loopEnabled = events.length > 3;

  const isMobile = useIsMobile();

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden md:w-1/2 mx-auto">
      <Swiper
        effect="coverflow"
        slidesPerView={1}
        spaceBetween={20}
        loop={loopEnabled}
        centeredSlides
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        navigation
        modules={[Autoplay, Pagination, Navigation, EffectCoverflow]}
        className="relative z-20 w-full py-4"
      >
        {events.map((event) => {
          const isLive = new Date() >= new Date(event.startDate);
          const eventParam = event.key?.trim()?.length ? event.key.trim() : String(event.id);

          const baseUrl = `/events?${searchParams.toString()}`;
          const url = searchParams.toString()
            ? `${baseUrl}&event=${eventParam}`
            : `/events?event=${eventParam}`;
          return (
            <SwiperSlide
              key={event.id}
              className="flex justify-center w-4/5"
            >
              <Link to={url} className="block z-10">
                <div
                  className={cn(
                    'relative aspect-[9/12]',
                    isMobile
                      ? 'max-h-[70vh] md:max-h-[70vh] w-[80%] max-w-[80%]'
                      : 'max-h-[90vh] md:max-h-[90vh] w-full max-w-full',
                    'mx-auto',
                    'rounded-xl shadow-2xl overflow-hidden cursor-pointer',
                    isLive && 'border-4 border-red-700'
                  )}
                >
                  {isLive && (
                    <Radio className="absolute top-2 right-2 bg-red-700 text-white h-7 w-7 text-xs font-bold p-1 rounded-full z-30 animate-pulse" />
                  )}

                  <img
                    src={event.flyer || 'https://via.placeholder.com/600x900?text=EventDto+Image'}
                    alt={event.name}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    width={150}
                    height={300}
                  />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pb-2 z-20">
                    <CountdownTimer targetDate={event.startDate} />
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  );
};

export default EventCarousel;

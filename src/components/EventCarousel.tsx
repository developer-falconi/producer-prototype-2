import { Event } from "@/lib/types";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay, EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import { cn } from "@/lib/utils";
import CountdownTimer from "./CountdownTimer";

const EventCarousel = ({ events }: { events: Event[] }) => {
  if (!events || events.length === 0) return null;

  const loopEnabled = events.length > 3;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden md:w-1/2">
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
        {events.map((event) => (
          <SwiperSlide
            key={event.id}
            className="flex justify-center w-4/5"
          >
            <Link to={`/events?event=${event.id}`} className="block z-10">
              <div
                className={cn(
                  'relative aspect-[9/12]',
                  'max-h-[60vh] md:max-h-[70vh]',
                  'w-full max-w-full mx-auto',
                  'rounded-xl shadow-2xl overflow-hidden cursor-pointer'
                )}
              >
                <img
                  src={event.logo || 'https://via.placeholder.com/600x900?text=Event+Image'}
                  alt={event.name}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  width={150}
                  height={300}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 p-4 z-20">
                  <CountdownTimer targetDate={event.startDate} />
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default EventCarousel;

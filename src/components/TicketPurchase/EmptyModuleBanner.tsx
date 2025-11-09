import { EmptyBannerDto } from "@/lib/types";
import { ArrowUpRight } from "lucide-react";

interface EmptyModuleBannerProps {
  banner: EmptyBannerDto;
}

const moduleCopy: Record<string, string> = {
  EVENT_EXPERIENCES: "Experiencias",
  EVENT_PRODUCTS: "Productos",
  EVENT_COMBOS: "Combos",
};

export const EmptyModuleBanner = ({ banner }: EmptyModuleBannerProps) => {
  const badgeCopy = moduleCopy[banner.module] || "Muy pronto";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#050B30] via-[#050B30]/90 to-black p-6 sm:p-8">
      <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
        <div className="relative z-10 space-y-4 md:flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            {badgeCopy}
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-white">{banner.title}</h3>
            <p className="mt-2 text-sm sm:text-base text-zinc-300 whitespace-pre-line leading-relaxed">
              {banner.description}
            </p>
          </div>

          {banner.actionUrl && (
            <a
              href={banner.actionUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 text-sm font-semibold hover:bg-emerald-300 transition-colors"
            >
              {banner.actionLabel || "Quiero saber más"}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>

        {banner.image && (
          <div className="relative z-0 md:w-1/3 lg:w-2/5 rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
            <div className="absolute inset-0 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />
            <img
              src={banner.image}
              alt={banner.title}
              className="h-64 w-full md:h-full object-cover object-center"
            />
          </div>
        )}

      </div>
    </div>
  );
};

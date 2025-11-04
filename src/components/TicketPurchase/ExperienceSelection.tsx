import React, { useEffect, useMemo, useState } from "react";
import {
  ExperienceChildDto,
  ExperienceDto,
  PurchaseData,
  PurchaseExperienceItem,
} from "@/lib/types";
import { FormInput } from "../ui/form-input";
import { Button } from "../ui/button";
import { Armchair, CheckCircle2, ChevronDown, Search } from "lucide-react";
import { cn, formatDate, formatTime, formatPrice } from "@/lib/utils";

interface ExperienceSelectionProps {
  experiences: ExperienceDto[];
  purchaseData: PurchaseData;
  onUpdateExperiences: (items: PurchaseExperienceItem[]) => void;
}

const getAvailableStock = (experience: ExperienceChildDto) => {
  if (typeof experience.remaining === "number") return experience.remaining;
  if (typeof experience.stock === "number") return experience.stock;
  return Number.POSITIVE_INFINITY;
};

const formatSchedule = (iso: string) => {
  if (!iso) return "";
  try {
    return formatTime(iso);
  } catch {
    return iso;
  }
};

export const ExperienceSelection: React.FC<ExperienceSelectionProps> = ({
  experiences,
  purchaseData,
  onUpdateExperiences,
}) => {
  const [query, setQuery] = useState("");
  const selected = purchaseData.experiences ?? [];
  const [openParentId, setOpenParentId] = useState<number | null>(null);

  const getQty = (childId: number) =>
    selected.find((item) => item.experience.id === childId)?.quantity ?? 0;

  const updateExperienceQuantity = (
    parent: ExperienceDto,
    child: ExperienceChildDto,
    nextQty: number
  ) => {
    const max = getAvailableStock(child);
    const upperBound = Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER;
    const safeQty = Math.max(0, Math.min(Math.floor(nextQty), upperBound));

    const filtered = selected.filter(
      (item) => item.experience.id !== child.id
    );

    if (safeQty > 0) {
      filtered.push({ parent, experience: child, quantity: safeQty });
    }

    onUpdateExperiences(filtered);
  };

  const filteredExperiences = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return experiences;

    return experiences
      .map((parent) => {
        const matchesParent =
          (parent.name ?? "").toLowerCase().includes(term) ||
          (parent.description ?? "").toLowerCase().includes(term);

        const filteredChildren = parent.children.filter((child) => {
          const haystack = `${child.name ?? ""} ${child.description ?? ""}`.toLowerCase();
          return haystack.includes(term);
        });

        if (matchesParent) return parent;
        if (filteredChildren.length > 0) {
          return { ...parent, children: filteredChildren };
        }
        return null;
      })
      .filter((item): item is ExperienceDto => item != null);
  }, [experiences, query]);

  useEffect(() => {
    if (!experiences || experiences.length === 0) {
      setOpenParentId(null);
      return;
    }

    setOpenParentId((prev) => {
      if (prev && experiences.some((exp) => exp.id === prev)) {
        return prev;
      }

      return experiences[0]?.id ?? null;
    });
  }, [experiences]);

  useEffect(() => {
    if (!filteredExperiences || filteredExperiences.length === 0) return;

    setOpenParentId((prev) => {
      if (prev && filteredExperiences.some((exp) => exp.id === prev)) {
        return prev;
      }

      return filteredExperiences[0]?.id ?? null;
    });
  }, [filteredExperiences]);

  if (!experiences || experiences.length === 0) {
    return (
      <div className="px-4 sm:px-6 pb-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pb-6 space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <FormInput
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar experiencias por nombre, marca o descripcion"
          iconLeft={<Search className="h-4 w-4 text-white/70" />}
        />
        <p className="mt-2 text-xs text-zinc-400">
          Tip: filtra por marca, horario o tipo de experiencia.
        </p>
      </div>

      {filteredExperiences.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        filteredExperiences.map((parent) => (
          <ExperienceGroup
            key={parent.id}
            parent={parent}
            isOpen={openParentId === parent.id}
            onToggle={() => setOpenParentId(parent.id)}
            getQty={getQty}
            onChange={(child, qty) =>
              updateExperienceQuantity(parent, child, qty)
            }
          />
        ))
      )}
    </div>
  );
};

function ExperienceGroup({
  parent,
  isOpen,
  onToggle,
  getQty,
  onChange,
}: {
  parent: ExperienceDto;
  isOpen: boolean;
  onToggle: () => void;
  getQty: (childId: number) => number;
  onChange: (child: ExperienceChildDto, qty: number) => void;
}) {
  const displayDescription = parent.description?.trim();
  const children = parent.children ?? [];

  return (
    <section className="rounded-3xl border border-white/10 bg-black/40 p-5 shadow-inner">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left transition-colors hover:text-white"
      >
        <div className="flex items-center gap-4">
          {parent.image && (
            <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/40 shrink-0">
              <img
                src={parent.image}
                alt={parent.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold uppercase tracking-wide text-white/90">
              {parent.name}
            </span>
            {displayDescription && (
              <span className="text-sm text-zinc-400">{displayDescription}</span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/60 transition-transform duration-200",
            isOpen && "rotate-180 text-white"
          )}
        />
      </button>

      {isOpen && (
        <div className="mt-4">
          {children.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-zinc-400">
              No hay variantes disponibles en este momento.
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-3 grid-cols-2',
                'sm:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]'
              )}
            >
              {children.map((child) => (
                <ExperienceOption
                  key={child.id}
                  child={child}
                  qty={getQty(child.id)}
                  onChange={(qty) => onChange(child, qty)}
                />
              ))}
            </div>
          )}
        </div>
      )
      }
    </section >
  );
}

function ExperienceOption({
  child,
  qty,
  onChange,
}: {
  child: ExperienceChildDto;
  qty: number;
  onChange: (qty: number) => void;
}) {
  const stock = getAvailableStock(child);
  const soldOut = Number.isFinite(stock) && stock <= 0;

  const inc = () => {
    if (soldOut) return;
    if (Number.isFinite(stock)) {
      onChange(Math.min(qty + 1, stock as number));
    } else {
      onChange(qty + 1);
    }
  };

  const dec = () => onChange(Math.max(0, qty - 1));

  return (
    <div
      className={cn(
        "relative flex min-w-[130px] flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 transition-all duration-200",
        soldOut && "opacity-60",
        qty > 0
          ? "border-[#3EE18F]/50 bg-[#3EE18F]/10 shadow-[0_0_0_1px_rgba(62,225,143,0.2)]"
          : "hover:border-white/25 hover:bg-white/[0.07]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white truncate">{child.name}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-right">
        {child.price != null && (
          <span className="text-xs font-medium text-white/80">
            {formatPrice(Number(child.price ?? 0))}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-emerald-300 text-xs">
          <Armchair className="h-3 w-3" />
          {soldOut ? "Agotado" : stock}
        </span>
      </div>

      <div className="mt-auto flex items-center gap-6 justify-center text-xs text-zinc-300">
        {qty === 0 ? (
          <Button
            onClick={inc}
            disabled={soldOut}
            className="h-7 rounded-full border border-white/20 bg-transparent px-3 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-40"
          >
            Seleccionar
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="h-auto w-4 rounded-full border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
              onClick={dec}
            >
              -
            </Button>
            <span className="min-w-4 text-center font-semibold text-white">
              {qty}
            </span>
            <Button
              variant="ghost"
              className="h-auto w-4 rounded-full border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
              onClick={inc}
              disabled={soldOut || (Number.isFinite(stock) && qty >= (stock as number))}
            >
              +
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
      <h3 className="text-lg font-semibold text-white">
        {query ? "No encontramos experiencias con ese filtro" : "Sin experiencias disponibles"}
      </h3>
      <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
        {query
          ? "Ajusta la busqueda o proba con otro criterio para descubrir experiencias."
          : "Pronto habra nuevas experiencias disponibles para este evento."}
      </p>
    </div>
  );
}

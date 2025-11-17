import React, { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ProductEventDto, ComboEventDto, ProductTypeEnum, PurchaseData, PurchaseProductItem, PurchaseComboItem, EmptyBannerDto } from "@/lib/types";
import { Search, Package, Sandwich } from "lucide-react";
import { Input } from "@/components/ui/input";
import ItemCard from "../ItemCard";
import { FormInput } from "../ui/form-input";
import { EmptyModuleBanner } from "./EmptyModuleBanner";

interface ProductSelectionProps {
  availableProducts: ProductEventDto[];
  availableCombos: ComboEventDto[];
  purchaseData: PurchaseData;
  onUpdateProductsAndCombos: (products: PurchaseProductItem[], combos: PurchaseComboItem[]) => void;
  emptyBanner?: EmptyBannerDto | null;
}

export const ProductSelection: React.FC<ProductSelectionProps> = ({
  availableProducts,
  availableCombos,
  purchaseData,
  onUpdateProductsAndCombos,
  emptyBanner,
}) => {
  const [searchText, setSearchText] = useState("");

  const selectedProducts: PurchaseProductItem[] = purchaseData.products ?? [];
  const selectedCombos: PurchaseComboItem[] = purchaseData.combos ?? [];

  const getProductQty = (id: number) => selectedProducts.find((p) => p.product.id === id)?.quantity ?? 0;
  const getComboQty = (id: number) => selectedCombos.find((c) => c.combo.id === id)?.quantity ?? 0;

  const updateItemQuantity = (type: ProductTypeEnum, id: number, nextQty: number) => {
    const nextProducts: PurchaseProductItem[] = [...selectedProducts].filter((p) =>
      type === ProductTypeEnum.PRODUCT ? p.product.id !== id : true
    );
    const nextCombos: PurchaseComboItem[] = [...selectedCombos].filter((c) =>
      type === ProductTypeEnum.COMBO ? c.combo.id !== id : true
    );

    if (nextQty > 0) {
      if (type === ProductTypeEnum.PRODUCT) {
        const product = availableProducts.find((p) => p.id === id);
        if (product) nextProducts.push({ product, quantity: nextQty });
      } else {
        const combo = availableCombos.find((c) => c.id === id);
        if (combo) nextCombos.push({ combo, quantity: nextQty });
      }
    }

    onUpdateProductsAndCombos(nextProducts, nextCombos);
  };

  const { filteredProducts, filteredCombos } = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const byText = (t?: string) => (t || "").toLowerCase().includes(q);

    return {
      filteredProducts: (availableProducts ?? []).filter(
        (p) => byText(p.product?.name) || byText(p.product?.description)
      ),
      filteredCombos: (availableCombos ?? []).filter(
        (c) => byText(c.name) || byText(c.description)
      ),
    };
  }, [searchText, availableProducts, availableCombos]);

  const hasNothing = (availableProducts?.length ?? 0) === 0 && (availableCombos?.length ?? 0) === 0;

  return (
    <div className={cn("px-4 sm:px-6 pb-4 relative overflow-hidden")}>
      {hasNothing ? (
        emptyBanner ? (
          <EmptyModuleBanner banner={emptyBanner} />
        ) : (
          <EmptyNotice text="No hay productos ni combos disponibles para este evento." />
        )
      ) : (
        <Tabs defaultValue={filteredCombos.length > 0 ? "combos" : "products"} className="w-full relative z-10">
          <TabsList className="grid grid-cols-2 w-full rounded-xl bg-transparent">
            <TabsTrigger
              value="combos"
              className={cn(
                "w-full rounded-lg text-white transition",
                "data-[state=active]:bg-[#001B97] data-[state=active]:text-white",
                "data-[state=inactive]:text-zinc-300 hover:data-[state=inactive]:text-white"
              )}
            >
              <div className="flex items-center gap-2">
                <Sandwich className="h-4 w-4" />
                Combos
                <span className="ml-1 rounded-full bg-white/10 px-2 py-[2px] text-[10px] text-white/80">
                  {filteredCombos.length}
                </span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="products"
              className={cn(
                "w-full rounded-lg transition",
                "data-[state=active]:bg-[#001B97] data-[state=active]:text-white",
                "data-[state=inactive]:text-zinc-300 hover:data-[state=inactive]:text-white"
              )}
            >
              <div className="flex items-center gap-2 text-white">
                <Package className="h-4 w-4" />
                Productos
                <span className="ml-1 rounded-full bg-white/10 px-2 py-[2px] text-[10px] text-white/80">
                  {filteredProducts.length}
                </span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Buscador */}
          <div className="mt-3">
            <FormInput
              type="text"
              placeholder="Buscar por nombre o descripción…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              iconLeft={<Search className="h-4 w-4" />}
            />
            <p className="mt-2 text-xs text-zinc-400">
              Tip: escribí “promo”, “sin alcohol”, “combo”, etc.
            </p>
          </div>

          {/* Combos (sin imagen) */}
          <TabsContent value="combos" className="mt-5">
            <SectionHeader title="Combos disponibles" count={filteredCombos.length} />
            {filteredCombos.length === 0 ? (
              <EmptyNotice text="No hay combos disponibles en este momento." />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredCombos.map((c) => (
                  <ItemCard
                    key={c.id}
                    title={c.name}
                    description={c.description}
                    price={Number(c.price)}
                    stock={c.stock}
                    qty={getComboQty(c.id)}
                    imageUrl={undefined}
                    onInc={() => updateItemQuantity(ProductTypeEnum.COMBO, c.id, getComboQty(c.id) + 1)}
                    onDec={() => updateItemQuantity(ProductTypeEnum.COMBO, c.id, Math.max(0, getComboQty(c.id) - 1))}
                    onSet={(q) => updateItemQuantity(ProductTypeEnum.COMBO, c.id, q)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Productos */}
          <TabsContent value="products" className="mt-5">
            <SectionHeader title="Productos disponibles" count={filteredProducts.length} />
            {filteredProducts.length === 0 ? (
              <EmptyNotice text="No hay productos disponibles en este momento." />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((p) => {
                  const price = Number(p.price);
                  const discount = Number(p.discountPercentage) || 0;
                  const effective = price * (1 - discount / 100);

                  return (
                    <ItemCard
                      key={p.id}
                      title={p.product?.name || "Producto"}
                      description={p.product?.description || ""}
                      price={effective}
                      originalPrice={discount > 0 ? price : undefined}
                      stock={p.eventStock}
                      qty={getProductQty(p.id)}
                      imageUrl={p.product?.imageUrl}
                      onInc={() => updateItemQuantity(ProductTypeEnum.PRODUCT, p.id, getProductQty(p.id) + 1)}
                      onDec={() => updateItemQuantity(ProductTypeEnum.PRODUCT, p.id, Math.max(0, getProductQty(p.id) - 1))}
                      onSet={(q) => updateItemQuantity(ProductTypeEnum.PRODUCT, p.id, q)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#001B97" }} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-[2px] text-[11px] text-zinc-300">
        {count} ítem{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function EmptyNotice({ text }: { text: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 p-8 rounded-xl border border-white/10 bg-white/[0.03] text-center")}>
      <div className="h-2 w-16 rounded-full bg-white/10" />
      <span className="text-zinc-400 text-sm">{text}</span>
      <p className="text-xs text-zinc-500">Probá limpiar el filtro o revisá más tarde.</p>
    </div>
  );
}

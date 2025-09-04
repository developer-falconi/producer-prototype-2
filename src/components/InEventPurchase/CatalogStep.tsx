import { ProductEventDto, ComboEventDto, ProductTypeEnum, PurchaseProductItem, PurchaseComboItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useMemo, useState } from "react";
import ItemCard from "../ItemCard";
import { Search, Package, Sandwich } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormInput } from "../ui/form-input";

export default function CatalogStep({
  products,
  combos,
  selectedProducts,
  selectedCombos,
  updateItemQuantity,
}: {
  products: ProductEventDto[];
  combos: ComboEventDto[];
  selectedProducts: PurchaseProductItem[];
  selectedCombos: PurchaseComboItem[];
  updateItemQuantity: (type: ProductTypeEnum, id: number, nextQty: number) => void;
}) {
  const [searchText, setSearchText] = useState("");

  const { filteredCombos, filteredProducts } = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const byText = (t?: string) => (t || "").toLowerCase().includes(q);
    return {
      filteredCombos: combos.filter((c) => byText(c.name) || byText(c.description)),
      filteredProducts: products.filter((p) => byText(p.product?.name) || byText(p.product?.description)),
    };
  }, [searchText, products, combos]);

  const getProductQty = (id: number) => selectedProducts.find(p => p.product.id === id)?.quantity ?? 0;
  const getComboQty = (id: number) => selectedCombos.find(c => c.combo.id === id)?.quantity ?? 0;

  const handleMutateQty = (type: ProductTypeEnum, id: number, delta: number) => {
    const currentQty = type === ProductTypeEnum.PRODUCT ? getProductQty(id) : getComboQty(id);
    const nextQty = Math.max(0, currentQty + delta);
    updateItemQuantity(type, id, nextQty);
  };

  return (
    <div className={cn("px-4 sm:px-6 pb-4 relative overflow-hidden")}>
      <Tabs defaultValue="combos" className="w-full relative z-10">
        <TabsList
          className="grid grid-cols-2 w-full rounded-xl bg-transparent"
        >
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
                  onInc={() => handleMutateQty(ProductTypeEnum.COMBO, c.id, 1)}
                  onDec={() => handleMutateQty(ProductTypeEnum.COMBO, c.id, -1)}
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
                const discount = Number(p.discountPercentage);
                const effective = price * (1 - (isNaN(discount) ? 0 : discount) / 100);
                return (
                  <ItemCard
                    key={p.id}
                    title={p.product?.name || "Producto"}
                    description={p.product?.description || ""}
                    price={effective}
                    stock={p.eventStock}
                    imageUrl={p.product?.imageUrl}
                    originalPrice={discount > 0 ? price : undefined}
                    qty={getProductQty(p.id)}
                    onInc={() => handleMutateQty(ProductTypeEnum.PRODUCT, p.id, 1)}
                    onDec={() => handleMutateQty(ProductTypeEnum.PRODUCT, p.id, -1)}
                    onSet={(q) => updateItemQuantity(ProductTypeEnum.PRODUCT, p.id, q)}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

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

interface EmptyNoticeProps { text: string; }

export const EmptyNotice: React.FC<EmptyNoticeProps> = ({ text }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 p-8 rounded-xl border border-white/10 bg-white/[0.03] text-center")}>
      <div className="h-2 w-16 rounded-full bg-white/10" />
      <span className="text-zinc-400 text-sm">{text}</span>
      <p className="text-xs text-zinc-500">Probá limpiar el filtro o revisá más tarde.</p>
    </div>
  );
};
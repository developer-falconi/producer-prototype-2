import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Easing } from "framer-motion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductEventDto, ComboEventDto, ProductTypeEnum, PurchaseData, PurchaseProductItem, PurchaseComboItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as Easing
    },
  },
};

const listVariants = {
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

interface ProductSelectionProps {
  availableProducts: ProductEventDto[];
  availableCombos: ComboEventDto[];
  purchaseData: PurchaseData;
  onUpdateProductsAndCombos: (products: PurchaseProductItem[], combos: PurchaseComboItem[]) => void;
}

export const ProductSelection: React.FC<ProductSelectionProps> = ({
  availableProducts,
  availableCombos,
  purchaseData,
  onUpdateProductsAndCombos
}) => {
  // selectedQuantities will now directly store the quantity for each unique item ID
  const [selectedQuantities, setSelectedQuantities] = useState<{ [key: string]: number }>({});

  // Initialize selectedQuantities from purchaseData
  useEffect(() => {
    const initialQuantities: { [key: string]: number } = {};
    purchaseData.products.forEach(item => {
      initialQuantities[`${ProductTypeEnum.PRODUCT}_${item.product.id}`] = item.quantity;
    });
    purchaseData.combos.forEach(item => {
      initialQuantities[`${ProductTypeEnum.COMBO}_${item.combo.id}`] = item.quantity;
    });
    setSelectedQuantities(initialQuantities);
  }, [purchaseData.products, purchaseData.combos]);

  const handleQuantityChange = useCallback(
    (
      item: ProductEventDto | ComboEventDto,
      type: ProductTypeEnum,
      newQuantityValue: number
    ) => {
      const maxStock = type === ProductTypeEnum.COMBO ? (item as ComboEventDto).stock : (item as ProductEventDto).eventStock;
      // Ensure quantity is not negative and does not exceed stock
      const quantity = Math.max(0, Math.min(newQuantityValue, maxStock));

      const key = `${type}_${item.id}`;

      setSelectedQuantities(prevQuantities => ({
        ...prevQuantities,
        [key]: quantity,
      }));

      // Prepare the updated products and combos arrays to send back
      let updatedProducts: PurchaseProductItem[] = [];
      let updatedCombos: PurchaseComboItem[] = [];

      // Start with current purchaseData, but filter out the item being changed
      purchaseData.products.forEach(pItem => {
        if (pItem.product.id !== item.id || type !== ProductTypeEnum.PRODUCT) {
          updatedProducts.push(pItem);
        }
      });
      purchaseData.combos.forEach(cItem => {
        if (cItem.combo.id !== item.id || type !== ProductTypeEnum.COMBO) {
          updatedCombos.push(cItem);
        }
      });


      if (quantity > 0) {
        if (type === ProductTypeEnum.PRODUCT) {
          updatedProducts.push({ product: item as ProductEventDto, quantity: quantity });
        } else {
          updatedCombos.push({ combo: item as ComboEventDto, quantity: quantity });
        }
      }

      onUpdateProductsAndCombos(updatedProducts, updatedCombos);
    },
    [purchaseData.products, purchaseData.combos, onUpdateProductsAndCombos]
  );

  const noData = availableProducts?.length === 0 && availableCombos?.length === 0;

  const renderCard = (item: ProductEventDto | ComboEventDto, type: ProductTypeEnum) => {
    const isCombo = type === ProductTypeEnum.COMBO;
    const currentQuantity = selectedQuantities[`${type}_${item.id}`] || 0;
    const stock = isCombo ? (item as ComboEventDto).stock : (item as ProductEventDto).eventStock;
    const isSoldOut = stock === 0;

    let name: string;
    let description: string;
    let imageUrl: string = '';
    let displayPrice: number;
    let discountNum: number = 0;
    let originalPrice: number = 0;

    if (isCombo) {
      const combo = item as ComboEventDto;
      name = combo.name;
      description = combo.description;
      displayPrice = combo.price;
    } else {
      const productEvent = item as ProductEventDto;
      name = productEvent.product.name;
      description = productEvent.product.description;
      originalPrice = parseFloat(productEvent.price);
      discountNum = parseFloat(productEvent.discountPercentage);
      displayPrice = originalPrice * (1 - discountNum / 100);
      imageUrl = productEvent.product.imageUrl || '/placeholder-product.png';
    }

    return (
      <motion.div
        key={`${type}_${item.id}`}
        variants={itemVariants}
        className={cn(
          "flex flex-col rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out border border-gray-700",
          isSoldOut ? "bg-gray-700 opacity-60" : "bg-gray-900 hover:shadow-xl hover:scale-[1.02]",
          isCombo ? "p-4" : ""
        )}
      >
        {/* Conditional rendering of the image section */}
        {!isCombo && (
          <div className="relative w-full h-60 bg-gray-700 flex items-center justify-center overflow-hidden">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />

            {/* FULL IMAGE OVERLAY with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex flex-col justify-end p-4 text-white">
              <h3 className="text-xl font-bold truncate">
                {name}
              </h3>
              <div className="flex items-baseline mt-1">
                {discountNum > 0 && (
                  <span className="text-base text-gray-400 line-through mr-2">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                <span className="text-2xl font-extrabold text-green-400">
                  {formatPrice(displayPrice)}
                </span>
                <span className="ml-2 text-sm text-gray-300">/unidad</span>
              </div>
            </div>

            {/* Discount Tag (positioned above overlay) */}
            {discountNum > 0 && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-sm font-bold px-2.5 py-1 rounded-full shadow-md z-10">
                -{discountNum}%
              </span>
            )}
            {isSoldOut && (
              <span className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-red-400 text-xl font-bold z-20">
                AGOTADO
              </span>
            )}
          </div>
        )}

        {/* Content for both products and combos */}
        <div className={cn("flex flex-col flex-grow p-4", { "mt-0": !isCombo, "pt-0": isCombo })}>
            {/* Combo-specific header when no image */}
            {isCombo && (
                <div className="flex flex-col justify-start text-white mb-4">
                    <h3 className="text-xl font-bold truncate">
                        {name}
                    </h3>
                    <div className="flex items-baseline mt-1">
                        <span className="text-2xl font-extrabold text-green-400">
                            {formatPrice(displayPrice)}
                        </span>
                        <span className="ml-2 text-sm text-gray-300">/unidad</span>
                    </div>
                </div>
            )}

            {description && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {description}
                </p>
            )}

            {/* Render Combo Items here if desired, uncomment and ensure data structure */}
            {/* {isCombo && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-1">Contenido del Combo:</h4>
                <ul className="list-disc list-inside text-xs text-gray-400">
                  {(item as ComboEventDto)?.comboItems?.length > 0 ? (
                    (item as ComboEventDto).comboItems.map((comboItem: ProductComboItemDto) => (
                      <li key={comboItem.id}>
                        {comboItem.quantity}x {comboItem.productEvent.product.name}
                      </li>
                    ))
                  ) : (
                    <li>No hay productos definidos para este combo.</li>
                  )}
                </ul>
              </div>
            )} */}

            {stock > 0 && stock <= 10 && (
                <p className="text-sm text-orange-400 mb-3">
                    ¡Últimas {stock} unidades!
                </p>
            )}

            <div
                className={cn(
                    "flex items-center justify-center mt-auto border",
                    "border-gray-700 rounded-lg bg-gray-800"
                )}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(item, type, currentQuantity - 1)}
                    disabled={currentQuantity === 0 || isSoldOut}
                    className="w-9 h-9 text-white hover:bg-gray-700 transition-colors text-lg"
                >
                    -
                </Button>
                <Input
                    type="number"
                    value={currentQuantity}
                    onChange={(e) => handleQuantityChange(item, type, parseInt(e.target.value) || 0)}
                    min="0"
                    readOnly
                    max={stock}
                    className="w-16 text-center mx-2 bg-transparent text-white border-none focus-visible:ring-0 focus-visible:ring-offset-0 [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
                    disabled={isSoldOut}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(item, type, currentQuantity + 1)}
                    disabled={currentQuantity >= stock || isSoldOut}
                    className="w-9 h-9 text-white hover:bg-gray-700 transition-colors text-lg"
                >
                    +
                </Button>
            </div>
            {isSoldOut && (
                <p className="text-center text-red-500 text-sm mt-2">
                    Este {isCombo ? 'combo' : 'producto'} está agotado.
                </p>
            )}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      <div className="space-y-6 p-6">
        <motion.h2 variants={itemVariants} className="text-xl font-extrabold text-white mb-6 text-center">
          Selecciona tus Productos
        </motion.h2>

        {noData ? (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="text-center text-gray-400 p-8 border border-dashed border-gray-600 rounded-lg bg-gray-900/50">
            <p className="text-xl font-medium">No hay productos ni combos disponibles para este evento.</p>
            <p className="text-sm mt-3">Por favor, contacta al organizador para más información.</p>
          </motion.div>
        ) : (
          <>
            {availableCombos.length > 0 && (
              <div className="mb-10">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Combos Disponibles</h3>
                <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableCombos.map(combo => renderCard(combo, ProductTypeEnum.COMBO))}
                </motion.div>
              </div>
            )}

            {availableProducts.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Productos Individuales</h3>
                <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {availableProducts.map(productEvent => renderCard(productEvent, ProductTypeEnum.PRODUCT))}
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    </AnimatePresence>
  );
};
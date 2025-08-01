import React, { useState } from 'react';
import { Wallet } from '@mercadopago/sdk-react';
import { cn } from '@/lib/utils';

interface MercadoPagoButtonProps {
  preferenceId: string | null;
  publicKey: string;
}

const MercadoPagoButton: React.FC<MercadoPagoButtonProps> = ({ preferenceId, publicKey }) => {
  const [loadingButton, setLoadingButton] = useState(true);

  const initialization: any = { redirectMode: 'self', preferenceId };

  const handleOnSubmit = async () => {
    console.log('Mercado Pago Wallet Brick: Payment process initiated by user.');
  };

  const handleOnReady = async () => {
    console.log('Mercado Pago Wallet Brick: Ready.');
    setLoadingButton(false);
  };

  const handleOnError = async (error: any) => {
    console.error('Mercado Pago Wallet Brick Error:', error);
  };

  if (!publicKey) {
    return (
      <div style={{ padding: '10px', border: '1px solid red', color: 'red', borderRadius: '4px' }}>
        Error de configuración: La clave pública de Mercado Pago no está disponible.
        El botón de pago no puede mostrarse.
      </div>
    );
  }

  if (!preferenceId) {
    console.warn('MercadoPagoButton: preferenceId is null or undefined. Wallet Brick will not render.');
    return (
      <div style={{ fontStyle: 'italic', padding: '10px', color: 'gray' }}>
        Preparando botón de pago... (Esperando ID de preferencia)
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full bg-gray-400 rounded-lg p-1",
        loadingButton && "hidden"
      )}
    >
      <Wallet
        initialization={initialization}
        customization={{ theme: 'dark', valueProp: 'smart_option' }}
        onSubmit={handleOnSubmit}
        onReady={handleOnReady}
        onError={handleOnError}
      />
    </div>
  );
};

export default MercadoPagoButton;
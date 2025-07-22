import React from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

interface MercadoPagoButtonProps {
  preferenceId: string | null;
  publicKey: string;
}

const MercadoPagoButton: React.FC<MercadoPagoButtonProps> = ({ preferenceId, publicKey }) => {
  if (publicKey) {
    initMercadoPago(publicKey, {
      locale: 'es-AR',
    });
  } else {
    console.error(
      'Error: Mercado Pago Public Key (publicKey) is missing. ' +
      'The Mercado Pago Button will not work correctly. ' +
      'Please ensure it is set in your .env file and the project is rebuilt if necessary.'
    );
  }

  const initialization: any = { redirectMode: 'self', preferenceId }

  const handleOnSubmit = async () => {
    console.log('Mercado Pago Wallet Brick: Payment process initiated by user.');
  };

  const handleOnReady = async () => {
    console.log('Mercado Pago Wallet Brick: Ready.');
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
    <div className="mercadopago-button-container w-full">
      <Wallet
        initialization={initialization}
        customization={{ valueProp: 'smart_option' }}
        onSubmit={handleOnSubmit}
        onReady={handleOnReady}
        onError={handleOnError}
      />
    </div>
  );
};

export default MercadoPagoButton;
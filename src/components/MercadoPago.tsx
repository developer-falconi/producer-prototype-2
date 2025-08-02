import React, { useState } from 'react';
import { Wallet } from '@mercadopago/sdk-react';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';
import SmallSpinner from './SmallSpinner';
import { SpinnerSize } from '@/lib/types';

interface MercadoPagoButtonProps {
  preferenceId: string | null;
  publicKey: string;
  loadingButton: boolean;
  setLoadingButton: React.Dispatch<React.SetStateAction<boolean>>;
}

const MercadoPagoButton: React.FC<MercadoPagoButtonProps> = ({
  preferenceId,
  publicKey,
  loadingButton,
  setLoadingButton
}) => {
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
    <div className={cn(
      loadingButton && 'w-full flex justify-center p-4'
    )}
    >
      <SmallSpinner
        className={cn(
          !loadingButton && "hidden"
        )}
        size={SpinnerSize.MEDIUM}
      />
      <div
        className={cn(
          'p-0 m-0',
          loadingButton && "hidden"
        )}
      >
        <Wallet
          initialization={initialization}
          customization={{ theme: 'dark', valueProp: 'smart_option', customStyle: { hideValueProp: true } }}
          onSubmit={handleOnSubmit}
          onReady={handleOnReady}
          onError={handleOnError}
        />
      </div>
    </div>
  );
};

export default React.memo(MercadoPagoButton);
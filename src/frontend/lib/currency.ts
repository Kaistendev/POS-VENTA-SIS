import { useState, useEffect } from 'react';

/**
 * Tasa de cambio del día (USD → Bs.) desde Ajustes.
 */
export function useExchangeRate(): number {
  const [rate, setRate] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (window.api) {
      window.api.getSettings()
        .then((s) => {
          if (!cancelled) setRate(parseFloat((s as any)?.exchange_rate_usd_ves) || 0);
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, []);

  return rate;
}

/**
 * Referencia en bolívares de un monto en USD.
 * Devuelve cadena vacía si no hay tasa configurada.
 */
export function formatBsRef(usdAmount: number, rate: number): string {
  if (!rate || rate <= 0 || !Number.isFinite(usdAmount)) return '';
  const bs = usdAmount * rate;
  return `≈ Bs. ${bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

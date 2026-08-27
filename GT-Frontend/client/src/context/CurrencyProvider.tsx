import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { CurrencyContext } from './currency.context';
import { getCurrencies } from '../services/currency.service';

import type { Currency } from '../types/currency.types';

const CURRENCY_STORAGE_KEY =
  'globaltour.selectedCurrency';

interface CurrencyProviderProps {
  children: ReactNode;
}

function getInitialCurrency() {
  const storedCurrency =
    localStorage.getItem(
      CURRENCY_STORAGE_KEY,
    );

  return storedCurrency || 'USD';
}

export function CurrencyProvider({
  children,
}: CurrencyProviderProps) {
  const [currencies, setCurrencies] =
    useState<Currency[]>([]);

  const [
    selectedCurrency,
    setSelectedCurrencyState,
  ] = useState(getInitialCurrency);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadCurrencies = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response =
          await getCurrencies();

        if (isCancelled) {
          return;
        }

        setCurrencies(response.data);

        setSelectedCurrencyState(
          (currentCurrency) => {
            const currencyExists =
              response.data.some(
                (currency) =>
                  currency.code ===
                  currentCurrency,
              );

            if (currencyExists) {
              return currentCurrency;
            }

            const hasUsd =
              response.data.some(
                (currency) =>
                  currency.code === 'USD',
              );

            const fallbackCurrency =
              hasUsd
                ? 'USD'
                : response.data[0]
                    ?.code || 'USD';

            return fallbackCurrency;
          },
        );
      } catch (requestError) {
        if (isCancelled) {
          return;
        }

        console.error(
          'Error al cargar monedas:',
          requestError,
        );

        setError(
          'No pudimos cargar las monedas disponibles.',
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCurrencies();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      CURRENCY_STORAGE_KEY,
      selectedCurrency,
    );
  }, [selectedCurrency]);

  const setSelectedCurrency = useCallback(
    (currency: string) => {
      const normalizedCurrency =
        currency.toUpperCase();

      if (currencies.length > 0) {
        const isSupported =
          currencies.some(
            (item) =>
              item.code ===
              normalizedCurrency,
          );

        if (!isSupported) {
          return;
        }
      }

      setSelectedCurrencyState(
        normalizedCurrency,
      );
    },
    [currencies],
  );

  const value = useMemo(
    () => ({
      currencies,
      selectedCurrency,
      setSelectedCurrency,
      isLoading,
      error,
    }),
    [
      currencies,
      selectedCurrency,
      setSelectedCurrency,
      isLoading,
      error,
    ],
  );

  return (
    <CurrencyContext.Provider
      value={value}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
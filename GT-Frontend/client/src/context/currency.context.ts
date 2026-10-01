import { createContext } from 'react';

import type { Currency } from '../types/currency.types';

export interface CurrencyContextValue {
  currencies: Currency[];
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const CurrencyContext =
  createContext<CurrencyContextValue | undefined>(
    undefined,
  );
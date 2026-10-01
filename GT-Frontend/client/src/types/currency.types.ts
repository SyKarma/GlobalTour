export interface Currency {
  code: string;
  name: string;
}

export interface CurrencyMeta {
  source: 'frankfurter' | 'cache';
  stale: boolean;
}

export interface CurrenciesResponse {
  data: Currency[];
  meta: CurrencyMeta;
}

export interface LatestRatesParams {
  base?: string;
  quotes?: string;
}

export interface LatestRatesData {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface LatestRatesResponse {
  data: LatestRatesData;
  meta: CurrencyMeta;
}

export interface ConvertCurrencyParams {
  amount: number;
  from?: string;
  to: string;
}

export interface ConvertCurrencyData {
  amount: number;
  from: string;
  to: string;
  rate: number;
  result: number;
  date: string;
}

export interface ConvertCurrencyResponse {
  data: ConvertCurrencyData;
  meta: CurrencyMeta;
}

export interface CurrencyHistoryParams {
  from: string;
  to: string;
  base?: string;
  quote?: string;
}

export interface CurrencyHistoryPoint {
  date: string;
  rates: Record<string, number>;
}

export interface CurrencyHistoryData {
  base: string;
  quote: string | null;
  startDate: string;
  endDate: string;
  points: CurrencyHistoryPoint[];
}

export interface CurrencyHistoryResponse {
  data: CurrencyHistoryData;
  meta: CurrencyMeta;
}
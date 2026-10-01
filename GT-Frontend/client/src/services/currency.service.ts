import { apiClient } from '../api/client';

import type {
  ConvertCurrencyParams,
  ConvertCurrencyResponse,
  CurrenciesResponse,
  CurrencyHistoryParams,
  CurrencyHistoryResponse,
  LatestRatesParams,
  LatestRatesResponse,
} from '../types/currency.types';

export const getCurrencies =
  async (): Promise<CurrenciesResponse> => {
    const response =
      await apiClient.get<CurrenciesResponse>(
        '/api/currency/currencies',
      );

    return response.data;
  };

export const getLatestRates = async (
  params: LatestRatesParams = {},
): Promise<LatestRatesResponse> => {
  const response =
    await apiClient.get<LatestRatesResponse>(
      '/api/currency/latest',
      {
        params,
      },
    );

  return response.data;
};

export const convertCurrency = async (
  params: ConvertCurrencyParams,
): Promise<ConvertCurrencyResponse> => {
  const response =
    await apiClient.get<ConvertCurrencyResponse>(
      '/api/currency/convert',
      {
        params,
      },
    );

  return response.data;
};

export const getCurrencyHistory = async (
  params: CurrencyHistoryParams,
): Promise<CurrencyHistoryResponse> => {
  const response =
    await apiClient.get<CurrencyHistoryResponse>(
      '/api/currency/history',
      {
        params,
      },
    );

  return response.data;
};
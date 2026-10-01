import { apiClient } from '../api/client';

import type {
  HotelDetailResponse,
  HotelRatesParams,
  HotelRatesResponse,
  HotelSearchParams,
  HotelSearchResponse,
} from '../types/hotel.types';

export const searchHotels = async (
  params: HotelSearchParams,
): Promise<HotelSearchResponse> => {
  const response =
    await apiClient.get<HotelSearchResponse>(
      '/api/hotels/search',
      {
        params,
      },
    );

  return response.data;
};

export const getHotelById = async (
  hotelId: string,
): Promise<HotelDetailResponse> => {
  const response =
    await apiClient.get<HotelDetailResponse>(
      `/api/hotels/${hotelId}`,
    );

  return response.data;
};

export const getHotelRates = async (
  hotelId: string,
  params: HotelRatesParams,
): Promise<HotelRatesResponse> => {
  const response =
    await apiClient.get<HotelRatesResponse>(
      `/api/hotels/${hotelId}/rates`,
      {
        params,
      },
    );

  return response.data;
};
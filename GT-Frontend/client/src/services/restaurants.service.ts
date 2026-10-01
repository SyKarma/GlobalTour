import { apiClient } from '../api/client';

import type {
  RestaurantDetailResponse,
  RestaurantSearchParams,
  RestaurantSearchResponse,
} from '../types/restaurant.types';

export const searchRestaurants = async (
  params: RestaurantSearchParams,
): Promise<RestaurantSearchResponse> => {
  const response =
    await apiClient.get<RestaurantSearchResponse>(
      '/api/restaurants/search',
      {
        params,
      },
    );

  return response.data;
};

export const getRestaurantById = async (
  id: string,
): Promise<RestaurantDetailResponse> => {
  const response =
    await apiClient.get<RestaurantDetailResponse>(
      `/api/restaurants/${id}`,
    );

  return response.data;
};
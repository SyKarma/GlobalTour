import { apiClient } from '../api/client';

import type {
  CarDetailResponse,
  CarSearchParams,
  CarSearchResponse,
} from '../types/car.types';

export async function searchCars(
  params: CarSearchParams,
) {
  const response =
    await apiClient.get<CarSearchResponse>(
      '/api/cars/search',
      {
        params,
      },
    );

  return response.data;
}

export async function getCarById(
  id: string,
) {
  const response =
    await apiClient.get<CarDetailResponse>(
      `/api/cars/${encodeURIComponent(id)}`,
    );

  return response.data;
}
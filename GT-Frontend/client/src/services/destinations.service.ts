import { apiClient } from '../api/client';
import type { Destination } from '../types/destination.types';

export interface DestinationSearchParams {
  query?: string;
}

export const getDestinations = async (
  params?: DestinationSearchParams,
): Promise<Destination[]> => {
  const response = await apiClient.get<Destination[]>('/api/destinations', {
    params,
  });

  return response.data;
};
import { apiClient } from '../api/client';
import type {
  Destination,
  DestinationDetailResponse,
  DestinationSearchParams,
  DestinationSearchResponse,
} from '../types/destination.types';

export const searchDestinations = async (
  params: DestinationSearchParams = {},
): Promise<DestinationSearchResponse> => {
  const response = await apiClient.get<DestinationSearchResponse>(
    '/api/destinations',
    {
      params,
    },
  );

  return response.data;
};

export const getDestinationByIata = async (
  iata: string,
): Promise<Destination> => {
  const response = await apiClient.get<DestinationDetailResponse>(
    `/api/destinations/${iata.toUpperCase()}`,
  );

  return response.data.data;
};
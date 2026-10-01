import { apiClient } from '../api/client';

import type {
  FlightSearchParams,
  FlightSearchResponse,
} from '../types/flight.types';

export const searchFlights = async (
  params: FlightSearchParams,
): Promise<FlightSearchResponse> => {
  const response =
    await apiClient.get<FlightSearchResponse>(
      '/api/flights/search',
      {
        params,
      },
    );

  return response.data;
};
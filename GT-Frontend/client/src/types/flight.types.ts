export interface FlightOffer {
  origin: string;
  destination: string;

  originAirport: string | null;
  destinationAirport: string | null;

  price: number;
  currency: string;

  airline: string | null;
  airlineName: string | null;
  flightNumber: string | null;

  departureAt: string | null;
  returnAt: string | null;

  transfers: number;
  durationMinutes: number | null;

  deeplink: string | null;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;

  departureAt?: string;
  returnAt?: string;

  currency?: string;
  direct?: boolean;
  limit?: number;
}

export interface FlightResponseMeta {
  source: 'travelpayouts' | 'cache';
  stale: boolean;
  unavailable: boolean;
  currency: string;
  disclaimer: string;
}

export interface FlightSearchResponse {
  data: FlightOffer[];
  meta: FlightResponseMeta;
}
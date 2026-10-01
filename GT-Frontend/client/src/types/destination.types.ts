export interface Destination {
  id: string;
  cityName: string;
  countryName: string;
  countryCode: string;
  cityIata: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

export interface DestinationSearchParams {
  q?: string;
  country?: string;
  limit?: number;
}

export interface DestinationSearchMeta {
  count: number;
  featured: boolean;
}

export interface DestinationSearchResponse {
  data: Destination[];
  meta: DestinationSearchMeta;
}

export interface DestinationDetailResponse {
  data: Destination;
}
export type CarProvider = 'openstreetmap';

export type CarAmenity =
  | 'car_rental'
  | 'car_sharing';

export interface CarLinks {
  self: string;
  maps: string | null;
  website: string | null;
}

export interface CarSummary {
  id: string;
  name: string;
  brand: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  primaryType: string | null;
  types: string[];
  provider: CarProvider;
  href: string;
  links: CarLinks;
}

export interface CarDetail
  extends CarSummary {
  phone: string | null;
  internationalPhone: string | null;
  editorialSummary: string | null;
  weekdayHours: string[];
}

export interface CarSearchFilters {
  type: CarAmenity | null;
  q: string | null;
  hasWebsite: boolean;
}

export interface CarSearchMeta {
  source: 'overpass' | 'cache';
  stale: boolean;
  unavailable: boolean;

  iata: string | null;

  cityName: string;
  countryName: string | null;
  countryCode: string | null;

  radiusMeters: number;
  matched: number;

  filters: CarSearchFilters;

  attribution: string;
  disclaimer: string;
}

export interface CarSearchResponse {
  data: CarSummary[];
  meta: CarSearchMeta;
}

export interface CarDetailMeta {
  source: 'overpass' | 'cache';
  stale: boolean;
  attribution: string;
  disclaimer: string;
}

export interface CarDetailResponse {
  data: CarDetail;
  meta: CarDetailMeta;
}

export interface CarSearchParams {
  cityName: string;

  countryCode?: string;

  radius?: number;

  limit?: number;

  type?: CarAmenity;

  q?: string;

  hasWebsite?: boolean;
}
export interface RestaurantLinks {
  self: string;
  maps: string | null;
  website: string | null;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string | null;

  latitude: number | null;
  longitude: number | null;

  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;

  cuisine?: string[];

  primaryType: string | null;
  types: string[];

  openNow: boolean | null;

  provider: 'openstreetmap';

  href: string;

  links: RestaurantLinks;
}

export interface RestaurantDetail extends Restaurant {
  phone: string | null;
  internationalPhone: string | null;
  editorialSummary: string | null;
  weekdayHours: string[];
}

export interface RestaurantSearchMeta {
  source: 'overpass' | 'cache';
  stale: boolean;
  unavailable: boolean;

  iata: string | null;

  cityName: string;
  countryName: string | null;
  countryCode: string | null;

  radiusMeters: number;
  matched: number;

  filters: {
    type: string | null;
    cuisine: string | null;
    q: string | null;
    hasWebsite: boolean;
  };

  attribution: string;
}

export interface RestaurantSearchResponse {
  data: Restaurant[];
  meta: RestaurantSearchMeta;
}

export interface RestaurantDetailResponse {
  data: RestaurantDetail;

  meta: {
    source: 'overpass' | 'cache';
    stale: boolean;
    attribution: string;
  };
}

export interface RestaurantSearchParams {
  cityName: string;
  countryCode?: string;

  radius?: number;
  limit?: number;

  type?: 'restaurant' | 'cafe' | 'fast_food';

  cuisine?: string;

  q?: string;

  hasWebsite?: boolean;
}
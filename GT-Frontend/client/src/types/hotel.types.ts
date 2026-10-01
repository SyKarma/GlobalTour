export interface HotelLinks {
  self: string;
  rates: string;
  map: string | null;
}

export interface HotelSummary {
  id: string;
  name: string;

  city: string | null;
  country: string | null;
  address: string | null;

  latitude: number | null;
  longitude: number | null;

  starRating: number | null;
  rating: number | null;
  reviewCount: number | null;

  chain: string | null;

  thumbnail: string | null;
  mainPhoto: string | null;

  provider: 'liteapi';

  href: string;
  links: HotelLinks;
}

export interface HotelImage {
  url: string;
  caption: string | null;
}

export interface HotelDetail extends HotelSummary {
  description: string | null;
  amenities: string[];
  images: HotelImage[];
}

export interface HotelRate {
  name: string | null;
  board: string | null;
  maxOccupancy: number | null;
  price: number;
  currency: string;
}

export interface HotelSearchParams {
  countryCode: string;
  cityName: string;
  limit?: number;
}

export interface HotelSearchMeta {
  source: 'liteapi' | 'cache';
  stale: boolean;
  unavailable: boolean;
  total: number;
  disclaimer: string;
}

export interface HotelSearchResponse {
  data: HotelSummary[];
  meta: HotelSearchMeta;
}

export interface HotelDetailMeta {
  source: 'liteapi' | 'cache';
  stale: boolean;
}

export interface HotelDetailResponse {
  data: HotelDetail;
  meta: HotelDetailMeta;
}

export interface HotelRatesParams {
  checkin: string;
  checkout: string;

  currency?: string;
  adults?: number;
  guestNationality?: string;
}

export interface HotelRatesData {
  hotelId: string;
  checkin: string;
  checkout: string;
  currency: string;
  rates: HotelRate[];
}

export interface HotelRatesMeta {
  source: 'liteapi' | 'cache';
  stale: boolean;
  unavailable: boolean;
  disclaimer: string;
}

export interface HotelRatesResponse {
  data: HotelRatesData;
  meta: HotelRatesMeta;
}
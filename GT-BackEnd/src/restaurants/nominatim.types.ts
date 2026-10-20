export type NominatimAddress = {
  road?: string;
  house_number?: string;
  postcode?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  country?: string;
  country_code?: string;
};

export type NominatimHit = {
  osm_type?: string;
  osm_id?: number;
  category?: string;
  extratags?: Record<string, string> | null;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  addresstype?: string;
  type?: string;
  address?: NominatimAddress;
};

export type GeocodedPlace = {
  latitude: number;
  longitude: number;
  name: string;
  displayName: string;
  countryName: string | null;
  countryCode: string | null;
};

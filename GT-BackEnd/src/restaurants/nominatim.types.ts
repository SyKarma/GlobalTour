export type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  country?: string;
  country_code?: string;
};

export type NominatimHit = {
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

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
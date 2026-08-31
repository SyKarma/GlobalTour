export type DashboardSearchType =
  | 'flight'
  | 'hotel'
  | 'currency'
  | 'destination'
  | string;

export interface DashboardTypeCount {
  searchType: DashboardSearchType;
  count: number;
}

export interface DashboardIataCount {
  iata: string;
  cityName: string | null;
  countryName: string | null;
  countryCode: string | null;
  count: number;
}

export interface DashboardCountryCount {
  countryCode: string;
  countryName: string | null;
  count: number;
}

export interface DashboardRouteCount {
  originIata: string;
  destinationIata: string;
  originCityName: string | null;
  destinationCityName: string | null;
  count: number;
}

export interface DashboardDayCount {
  date: string;
  count: number;
}

export interface DashboardMonthCount {
  month: string;
  count: number;
}

export interface DashboardData {
  generatedAt: string;

  period: {
    days: number;
    from: string;
    to: string;
  };

  summary: {
    totalSearches: number;
    uniqueOrigins: number;
    uniqueDestinations: number;
    byType: DashboardTypeCount[];
  };

  topDestinations: DashboardIataCount[];
  topOrigins: DashboardIataCount[];
  topCountries: DashboardCountryCount[];
  topRoutes: DashboardRouteCount[];

  volumeByDay: DashboardDayCount[];
  travelMonths: DashboardMonthCount[];
}

export interface DashboardResponse {
  data: DashboardData;

  meta: {
    cached: boolean;
  };
}

export interface DashboardParams {
  days?: number;
  limit?: number;
}
export type TravelpayoutsCity = {
  code?: string;
  name?: string;
  country_code?: string;
  time_zone?: string;
  has_flightable_airport?: boolean;
  coordinates?: {
    lat?: number;
    lon?: number;
  };
};

export type TravelpayoutsAirport = {
  code?: string;
  name?: string;
  city_code?: string;
  country_code?: string;
  flightable?: boolean;
  iata_type?: string;
};

export type TravelpayoutsCountry = {
  code?: string;
  name?: string;
};

export type TravelpayoutsAirline = {
  code?: string;
  name?: string;
};

export type TravelpayoutsTicket = {
  origin?: string;
  destination?: string;
  origin_airport?: string;
  destination_airport?: string;
  price?: number;
  airline?: string;
  flight_number?: number | string;
  departure_at?: string;
  return_at?: string;
  transfers?: number;
  return_transfers?: number;
  duration?: number;
  link?: string;
};

export type TravelpayoutsSearchResponse = {
  success?: boolean;
  currency?: string;
  data?: TravelpayoutsTicket[] | Record<string, TravelpayoutsTicket>;
  error?: string;
};

export type TravelpayoutsGroupedResponse = {
  success?: boolean;
  currency?: string;
  data?: Record<string, TravelpayoutsTicket>;
  error?: string;
};

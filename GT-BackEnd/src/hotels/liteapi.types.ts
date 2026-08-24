export type LiteApiHotel = {
  id?: string;
  name?: string;
  hotelDescription?: string;
  country?: string;
  city?: string;
  address?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  stars?: number;
  starRating?: number;
  rating?: number;
  reviewCount?: number;
  currency?: string;
  chain?: string;
  hotelTypeId?: number;
  main_photo?: string;
  thumbnail?: string;
  hotelImages?: Array<{ url?: string; caption?: string; defaultImage?: boolean }>;
  hotelFacilities?: string[];
  facilities?: Array<{ name?: string; facilityId?: number }>;
};

export type LiteApiListResponse = {
  data?: LiteApiHotel[];
  total?: number;
};

export type LiteApiHotelResponse = {
  data?: LiteApiHotel;
};

export type LiteApiMoney = {
  amount?: number;
  currency?: string;
};

export type LiteApiRate = {
  name?: string;
  boardName?: string;
  boardType?: string;
  maxOccupancy?: number;
  adultCount?: number;
  retailRate?: {
    total?: LiteApiMoney[];
  };
};

export type LiteApiRoomType = {
  rates?: LiteApiRate[];
};

export type LiteApiHotelRates = {
  hotelId?: string;
  roomTypes?: LiteApiRoomType[];
};

export type LiteApiRatesResponse = {
  data?: LiteApiHotelRates[];
};

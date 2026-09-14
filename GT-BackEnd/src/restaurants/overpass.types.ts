export type OverpassElementType = 'node' | 'way' | 'relation';

export type OverpassTags = Record<string, string>;

export type OverpassElement = {
  type: OverpassElementType;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: OverpassTags;
};

export type OverpassResponse = {
  elements?: OverpassElement[];
  remark?: string;
};

export const FOOD_AMENITIES = ['restaurant', 'cafe', 'fast_food'] as const;
export type FoodAmenity = (typeof FOOD_AMENITIES)[number];

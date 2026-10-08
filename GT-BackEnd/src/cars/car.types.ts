export const CAR_AMENITIES = ['car_rental', 'car_sharing'] as const;
export type CarAmenity = (typeof CAR_AMENITIES)[number];

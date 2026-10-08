export type WishlistItemType =
  | 'flight'
  | 'hotel'
  | 'restaurant'
  | 'car'
  | 'destination';

export type WishlistMetadataValue =
  | string
  | number
  | boolean
  | null;

export interface WishlistItem {
  id: string;
  key: string;
  type: WishlistItemType;

  title: string;
  subtitle?: string | null;

  imageUrl?: string | null;
  href?: string | null;

  metadata: Record<
    string,
    WishlistMetadataValue
  >;

  createdAt: string;
}

export interface CreateWishlistItemInput {
  key: string;
  type: WishlistItemType;

  title: string;
  subtitle?: string | null;

  imageUrl?: string | null;
  href?: string | null;

  metadata?: Record<
    string,
    WishlistMetadataValue
  >;
}
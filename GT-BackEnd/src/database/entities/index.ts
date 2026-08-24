import { ApiCache } from './api-cache.entity';
import { CurrencyRate } from './currency-rate.entity';
import { Destination } from './destination.entity';
import { SearchHistory } from './search-history.entity';
import { UserPreference } from './user-preference.entity';
import { User } from './user.entity';
import { WishlistItem } from './wishlist-item.entity';

export const ALL_ENTITIES = [
  User,
  UserPreference,
  Destination,
  WishlistItem,
  SearchHistory,
  ApiCache,
  CurrencyRate,
];

export {
  ApiCache,
  CurrencyRate,
  Destination,
  SearchHistory,
  User,
  UserPreference,
  WishlistItem,
};

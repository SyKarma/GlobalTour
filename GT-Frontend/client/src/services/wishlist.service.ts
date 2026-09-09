import type {
  CreateWishlistItemInput,
  WishlistItem,
} from '../types/wishlist.types';

const STORAGE_PREFIX =
  'globaltour:wishlist';

export const WISHLIST_CHANGED_EVENT =
  'globaltour:wishlist-changed';

function storageKey(
  userId: string,
) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function createId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function notifyWishlistChanged(
  userId: string,
) {
  window.dispatchEvent(
    new CustomEvent(
      WISHLIST_CHANGED_EVENT,
      {
        detail: {
          userId,
        },
      },
    ),
  );
}

export function getWishlist(
  userId: string,
): WishlistItem[] {
  try {
    const raw =
      localStorage.getItem(
        storageKey(userId),
      );

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as WishlistItem[];
  } catch (error) {
    console.error(
      'Error al leer Wishlist:',
      error,
    );

    return [];
  }
}

function saveWishlist(
  userId: string,
  items: WishlistItem[],
) {
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify(items),
  );

  notifyWishlistChanged(
    userId,
  );
}

export function addWishlistItem(
  userId: string,
  input: CreateWishlistItemInput,
): WishlistItem {
  const current =
    getWishlist(userId);

  const existing =
    current.find(
      (item) =>
        item.key === input.key,
    );

  if (existing) {
    return existing;
  }

  const item: WishlistItem = {
    id: createId(),

    key: input.key,

    type: input.type,

    title: input.title.trim(),

    subtitle:
      input.subtitle ??
      null,

    imageUrl:
      input.imageUrl ??
      null,

    href:
      input.href ??
      null,

    metadata:
      input.metadata ??
      {},

    createdAt:
      new Date().toISOString(),
  };

  saveWishlist(
    userId,
    [
      item,
      ...current,
    ],
  );

  return item;
}

export function removeWishlistItem(
  userId: string,
  itemId: string,
) {
  const current =
    getWishlist(userId);

  saveWishlist(
    userId,
    current.filter(
      (item) =>
        item.id !== itemId,
    ),
  );
}

export function removeWishlistItemByKey(
  userId: string,
  key: string,
) {
  const current =
    getWishlist(userId);

  saveWishlist(
    userId,
    current.filter(
      (item) =>
        item.key !== key,
    ),
  );
}

export function isWishlistItemSaved(
  userId: string,
  key: string,
) {
  return getWishlist(
    userId,
  ).some(
    (item) =>
      item.key === key,
  );
}

export function toggleWishlistItem(
  userId: string,
  input: CreateWishlistItemInput,
) {
  const existing =
    getWishlist(
      userId,
    ).find(
      (item) =>
        item.key === input.key,
    );

  if (existing) {
    removeWishlistItem(
      userId,
      existing.id,
    );

    return {
      saved: false,
      item: null,
    };
  }

  return {
    saved: true,
    item: addWishlistItem(
      userId,
      input,
    ),
  };
}
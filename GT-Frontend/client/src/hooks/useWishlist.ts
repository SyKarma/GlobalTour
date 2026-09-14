import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
  removeWishlistItemByKey,
  toggleWishlistItem,
  WISHLIST_CHANGED_EVENT,
} from '../services/wishlist.service';

import type {
  CreateWishlistItemInput,
  WishlistItem,
} from '../types/wishlist.types';

import {
  useAuth,
} from './useAuth';

export function useWishlist() {
  const {
    user,
    isAuthenticated,
  } = useAuth();

  const userId =
    isAuthenticated &&
    user
      ? user.id
      : null;

  const [
    items,
    setItems,
  ] =
    useState<WishlistItem[]>(
      [],
    );

  const refresh =
    useCallback(() => {
      if (!userId) {
        setItems([]);

        return;
      }

      setItems(
        getWishlist(
          userId,
        ),
      );
    }, [
      userId,
    ]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const handleChange =
      () => {
        refresh();
      };

    const handleStorage =
      (event: StorageEvent) => {
        if (
          event.key ===
          `globaltour:wishlist:${userId}`
        ) {
          refresh();
        }
      };

    let isActive = true;

    queueMicrotask(() => {
      if (isActive) {
        refresh();
      }
    });

    window.addEventListener(
      WISHLIST_CHANGED_EVENT,
      handleChange,
    );

    window.addEventListener(
      'storage',
      handleStorage,
    );

    return () => {
      isActive = false;

      window.removeEventListener(
        WISHLIST_CHANGED_EVENT,
        handleChange,
      );

      window.removeEventListener(
        'storage',
        handleStorage,
      );
    };
  }, [
    refresh,
    userId,
  ]);

  const add =
    useCallback(
      (
        input:
          CreateWishlistItemInput,
      ) => {
        if (!userId) {
          return null;
        }

        return addWishlistItem(
          userId,
          input,
        );
      },
      [
        userId,
      ],
    );

  const remove =
    useCallback(
      (
        itemId: string,
      ) => {
        if (!userId) {
          return;
        }

        removeWishlistItem(
          userId,
          itemId,
        );
      },
      [
        userId,
      ],
    );

  const removeByKey =
    useCallback(
      (
        key: string,
      ) => {
        if (!userId) {
          return;
        }

        removeWishlistItemByKey(
          userId,
          key,
        );
      },
      [
        userId,
      ],
    );

  const toggle =
    useCallback(
      (
        input:
          CreateWishlistItemInput,
      ) => {
        if (!userId) {
          return {
            saved: false,
            item: null,
          };
        }

        return toggleWishlistItem(
          userId,
          input,
        );
      },
      [
        userId,
      ],
    );

  const savedKeys =
    useMemo(
      () =>
        new Set(
          items.map(
            (item) =>
              item.key,
          ),
        ),
      [
        items,
      ],
    );

  const isSaved =
    useCallback(
      (
        key: string,
      ) =>
        savedKeys.has(
          key,
        ),
      [
        savedKeys,
      ],
    );

  return {
    items,

    count:
      items.length,

    isAvailable:
      Boolean(
        userId,
      ),

    add,
    remove,
    removeByKey,
    toggle,
    isSaved,
    refresh,
  };
}
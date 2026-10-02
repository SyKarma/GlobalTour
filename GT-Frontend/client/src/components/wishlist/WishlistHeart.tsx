import type {
  MouseEvent,
} from 'react';

import {
  useTranslation,
} from 'react-i18next';

import {
  useAuth,
} from '../../hooks/useAuth';

import {
  useWishlist,
} from '../../hooks/useWishlist';

import type {
  CreateWishlistItemInput,
} from '../../types/wishlist.types';

interface WishlistHeartProps {
  item:
    CreateWishlistItemInput;

  className?:
    string;
}

function WishlistHeart({
  item,
  className = '',
}: WishlistHeartProps) {
  const {
    t,
  } =
    useTranslation();

  const {
    isAuthenticated,
    login,
  } =
    useAuth();

  const {
    toggle,
    isSaved,
  } =
    useWishlist();

  const saved =
    isSaved(
      item.key,
    );

  const handleClick = (
    event:
      MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      !isAuthenticated
    ) {
      login();

      return;
    }

    toggle(
      item,
    );
  };

  return (
    <button
      type="button"
      className={
        saved
          ? `gt-wishlist-heart gt-wishlist-heart-active ${className}`
          : `gt-wishlist-heart ${className}`
      }
      onClick={
        handleClick
      }
      aria-pressed={
        saved
      }
      aria-label={
        saved
          ? t(
              'wishlist.heart.removeAria',
              {
                title:
                  item.title,
              },
            )
          : t(
              'wishlist.heart.saveAria',
              {
                title:
                  item.title,
              },
            )
      }
      title={
        saved
          ? t(
              'wishlist.heart.remove',
            )
          : t(
              'wishlist.heart.save',
            )
      }
    >
      <HeartIcon
        filled={
          saved
        }
      />
    </button>
  );
}

function HeartIcon({
  filled,
}: {
  filled:
    boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={
        filled
          ? 'gt-heart-filled'
          : ''
      }
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export default WishlistHeart;
import {
  Link,
} from 'react-router-dom';

import {
  useAuth,
} from '../hooks/useAuth';

import {
  useWishlist,
} from '../hooks/useWishlist';

import type {
  WishlistItem,
  WishlistItemType,
} from '../types/wishlist.types';

function WishlistPage() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
  } = useAuth();

  const {
    items,
    count,
    remove,
  } = useWishlist();

  if (isLoading) {
    return (
      <main className="gt-wishlist-page">
        <div className="gt-wishlist-loading">
          <div className="gt-wishlist-spinner" />

          <p>
            Cargando tu Wishlist...
          </p>
        </div>
      </main>
    );
  }

  if (
    !isAuthenticated ||
    !user
  ) {
    return (
      <main className="gt-wishlist-page">
        <section className="gt-wishlist-guest">
          <div className="gt-wishlist-guest-icon">
            <HeartIcon />
          </div>

          <span>
            GLOBALTOUR WISHLIST
          </span>

          <h1>
            Guarda tus favoritos
          </h1>

          <p>
            Inicia sesión para guardar vuelos,
            hoteles, restaurantes y opciones de
            movilidad que quieras revisar después.
          </p>

          <button
            type="button"
            onClick={
              login
            }
          >
            Continuar con Google
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="gt-wishlist-page">
      <section className="gt-wishlist-hero">
        <div className="gt-wishlist-hero-inner">
          <span className="gt-wishlist-eyebrow">
            GLOBALTOUR · TUS FAVORITOS
          </span>

          <h1>
            Mi Wishlist
          </h1>

          <p>
            Guarda las opciones que más te
            interesan y compáralas cuando estés
            listo para organizar tu viaje.
          </p>

          <div className="gt-wishlist-count">
            <HeartIcon />

            <strong>
              {count}
            </strong>

            <span>
              {count === 1
                ? 'elemento guardado'
                : 'elementos guardados'}
            </span>
          </div>
        </div>
      </section>

      <section className="gt-wishlist-content">
        {items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="gt-wishlist-grid">
            {items.map(
              (item) => (
                <WishlistCard
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                  onRemove={
                    remove
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}

interface WishlistCardProps {
  item: WishlistItem;

  onRemove:
    (
      itemId: string,
    ) => void;
}

function WishlistCard({
  item,
  onRemove,
}: WishlistCardProps) {
  return (
    <article className="gt-wishlist-card">
      <div className="gt-wishlist-card-media">
        {item.imageUrl ? (
          <img
            src={
              item.imageUrl
            }
            alt={
              item.title
            }
          />
        ) : (
          <div className={`gt-wishlist-placeholder gt-wishlist-placeholder-${item.type}`}>
            <TypeIcon
              type={
                item.type
              }
            />
          </div>
        )}

        <span className={`gt-wishlist-type gt-wishlist-type-${item.type}`}>
          {typeLabel(
            item.type,
          )}
        </span>

        <button
          type="button"
          className="gt-wishlist-remove"
          onClick={() =>
            onRemove(
              item.id,
            )
          }
          aria-label={`Eliminar ${item.title} de Wishlist`}
          title="Eliminar de Wishlist"
        >
          <HeartFilledIcon />
        </button>
      </div>

      <div className="gt-wishlist-card-body">
        <h2>
          {item.title}
        </h2>

        {item.subtitle && (
          <p>
            {item.subtitle}
          </p>
        )}

        <div className="gt-wishlist-metadata">
          {Object.entries(
            item.metadata,
          )
            .slice(
              0,
              3,
            )
            .map(
              ([
                label,
                value,
              ]) =>
                value !==
                  null && (
                  <span
                    key={
                      label
                    }
                  >
                    <small>
                      {
                        formatLabel(
                          label,
                        )
                      }
                    </small>

                    <strong>
                      {String(
                        value,
                      )}
                    </strong>
                  </span>
                ),
            )}
        </div>

        <div className="gt-wishlist-card-footer">
          <small>
            Guardado{' '}
            {formatDate(
              item.createdAt,
            )}
          </small>

          {item.href && (
            <Link
              to={
                item.href
              }
            >
              Ver detalle
              <ArrowIcon />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyWishlist() {
  return (
    <div className="gt-wishlist-empty">
      <div>
        <HeartIcon />
      </div>

      <span>
        TU LISTA ESTÁ VACÍA
      </span>

      <h2>
        Comienza a guardar tus favoritos
      </h2>

      <p>
        Cuando encuentres algo que te guste,
        pulsa el corazón para agregarlo aquí.
      </p>

      <div className="gt-wishlist-empty-links">
        <Link to="/flights">
          Explorar vuelos
        </Link>

        <Link to="/hotels">
          Ver hospedaje
        </Link>

        <Link to="/restaurants">
          Restaurantes
        </Link>

        <Link to="/cars">
          Rent a Car
        </Link>
      </div>
    </div>
  );
}

function typeLabel(
  type: WishlistItemType,
) {
  switch (type) {
    case 'flight':
      return 'Vuelo';

    case 'hotel':
      return 'Hospedaje';

    case 'restaurant':
      return 'Restaurante';

    case 'car':
      return 'Rent a Car';

    case 'destination':
      return 'Destino';
  }
}

function formatLabel(
  value: string,
) {
  return value
    .replace(
      /([A-Z])/g,
      ' $1',
    )
    .replace(
      /_/g,
      ' ',
    )
    .trim()
    .replace(
      /^\w/,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  return new Intl.DateTimeFormat(
    'es-CR',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    date,
  );
}

function TypeIcon({
  type,
}: {
  type:
    WishlistItemType;
}) {
  switch (type) {
    case 'flight':
      return (
        <svg viewBox="0 0 24 24">
          <path d="m2 16 20-8-7 8v5l-3-3-4 2 1-5-7 1Z" />
        </svg>
      );

    case 'hotel':
      return (
        <svg viewBox="0 0 24 24">
          <path d="M4 21V4h12v17M16 9h4v12M8 8h4M8 12h4M8 16h4M2 21h20" />
        </svg>
      );

    case 'restaurant':
      return (
        <svg viewBox="0 0 24 24">
          <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8 0 2 1 3 3 3v7M17 3v11" />
        </svg>
      );

    case 'car':
      return (
        <svg viewBox="0 0 24 24">
          <path d="M5 17h14l1-5-2-5H6l-2 5 1 5ZM7 17v2M17 17v2M4 12h16" />
        </svg>
      );

    case 'destination':
      return (
        <svg viewBox="0 0 24 24">
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle
            cx="12"
            cy="10"
            r="2.5"
          />
        </svg>
      );
  }
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default WishlistPage;
import {
  Link,
} from 'react-router-dom';

import {
  useTranslation,
} from 'react-i18next';

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
    t,
  } =
    useTranslation();

  const {
    user,
    isAuthenticated,
    isLoading,
    login,
  } =
    useAuth();

  const {
    items,
    count,
    remove,
  } =
    useWishlist();

  if (
    isLoading
  ) {
    return (
      <main className="gt-wishlist-page">

        <div className="gt-wishlist-loading">

          <div className="gt-wishlist-spinner" />

          <p>
            {t(
              'wishlist.loading',
            )}
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
            {t(
              'wishlist.guest.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'wishlist.guest.title',
            )}
          </h1>

          <p>
            {t(
              'wishlist.guest.description',
            )}
          </p>

          <button
            type="button"
            onClick={
              login
            }
          >
            {t(
              'common.continueWithGoogle',
            )}
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
            {t(
              'wishlist.hero.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'wishlist.hero.title',
            )}
          </h1>

          <p>
            {t(
              'wishlist.hero.description',
            )}
          </p>

          <div className="gt-wishlist-count">

            <HeartIcon />

            <strong>
              {count}
            </strong>

            <span>
              {count === 1
                ? t(
                    'wishlist.hero.savedOne',
                  )
                : t(
                    'wishlist.hero.savedMany',
                  )}
            </span>

          </div>

        </div>

      </section>

      <section className="gt-wishlist-content">

        {items.length ===
        0 ? (
          <EmptyWishlist />
        ) : (
          <div className="gt-wishlist-grid">

            {items.map(
              (
                item,
              ) => (
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
  item:
    WishlistItem;

  onRemove:
    (
      itemId:
        string,
    ) => void;
}

function WishlistCard({
  item,
  onRemove,
}: WishlistCardProps) {
  const {
    t,
    i18n,
  } =
    useTranslation();

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
          <div
            className={`gt-wishlist-placeholder gt-wishlist-placeholder-${item.type}`}
          >
            <TypeIcon
              type={
                item.type
              }
            />
          </div>
        )}

        <span
          className={`gt-wishlist-type gt-wishlist-type-${item.type}`}
        >
          {typeLabel(
            item.type,
            t,
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
          aria-label={t(
            'wishlist.card.removeAria',
            {
              title:
                item.title,
            },
          )}
          title={t(
            'wishlist.card.remove',
          )}
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
                      {formatMetadataLabel(
                        label,
                        t,
                      )}
                    </small>

                    <strong>
                      {formatMetadataValue(
                        label,
                        value,
                        t,
                      )}
                    </strong>
                  </span>
                ),
            )}

        </div>

        <div className="gt-wishlist-card-footer">

          <small>
            {t(
              'wishlist.card.saved',
            )}{' '}

            {formatDate(
              item.createdAt,
              i18n.resolvedLanguage ??
                i18n.language,
            )}
          </small>

          {item.href && (
            <Link
              to={
                item.href
              }
            >
              {t(
                'wishlist.card.viewDetail',
              )}

              <ArrowIcon />
            </Link>
          )}

        </div>

      </div>

    </article>
  );
}

function EmptyWishlist() {
  const {
    t,
  } =
    useTranslation();

  return (
    <div className="gt-wishlist-empty">

      <div>
        <HeartIcon />
      </div>

      <span>
        {t(
          'wishlist.empty.eyebrow',
        )}
      </span>

      <h2>
        {t(
          'wishlist.empty.title',
        )}
      </h2>

      <p>
        {t(
          'wishlist.empty.description',
        )}
      </p>

      <div className="gt-wishlist-empty-links">

        <Link to="/flights">
          {t(
            'wishlist.empty.flights',
          )}
        </Link>

        <Link to="/hotels">
          {t(
            'wishlist.empty.hotels',
          )}
        </Link>

        <Link to="/restaurants">
          {t(
            'wishlist.empty.restaurants',
          )}
        </Link>

        <Link to="/cars">
          {t(
            'wishlist.empty.cars',
          )}
        </Link>

      </div>

    </div>
  );
}

function typeLabel(
  type:
    WishlistItemType,

  t:
    (
      key:
        string,
      options?:
        Record<
          string,
          unknown
        >,
    ) => string,
) {
  switch (
    type
  ) {
    case 'flight':
      return t(
        'wishlist.types.flight',
      );

    case 'hotel':
      return t(
        'wishlist.types.hotel',
      );

    case 'restaurant':
      return t(
        'wishlist.types.restaurant',
      );

    case 'car':
      return t(
        'wishlist.types.car',
      );

    case 'destination':
      return t(
        'wishlist.types.destination',
      );
  }
}

function formatMetadataLabel(
  value:
    string,

  t:
    (
      key:
        string,
      options?:
        Record<
          string,
          unknown
        >,
    ) => string,
) {
  const normalized =
    value
      .trim()
      .toLowerCase();

  const metadataKeys:
    Record<
      string,
      string
    > = {
      tipo:
        'wishlist.metadata.type',

      type:
        'wishlist.metadata.type',

      marca:
        'wishlist.metadata.brand',

      brand:
        'wishlist.metadata.brand',

      sitioweb:
        'wishlist.metadata.website',

      website:
        'wishlist.metadata.website',

      mapa:
        'wishlist.metadata.map',

      map:
        'wishlist.metadata.map',

      ciudad:
        'wishlist.metadata.city',

      city:
        'wishlist.metadata.city',

      pais:
        'wishlist.metadata.country',

      país:
        'wishlist.metadata.country',

      country:
        'wishlist.metadata.country',

      estrellas:
        'wishlist.metadata.stars',

      stars:
        'wishlist.metadata.stars',

      rating:
        'wishlist.metadata.rating',

      cadena:
        'wishlist.metadata.chain',

      chain:
        'wishlist.metadata.chain',

      cocina:
        'wishlist.metadata.cuisine',

      cuisine:
        'wishlist.metadata.cuisine',

      aerolinea:
        'wishlist.metadata.airline',

      aerolínea:
        'wishlist.metadata.airline',

      airline:
        'wishlist.metadata.airline',

      flightnumber:
        'wishlist.metadata.flightNumber',

      numerodevuelo:
        'wishlist.metadata.flightNumber',

      departure:
        'wishlist.metadata.departure',

      salida:
        'wishlist.metadata.departure',

      duration:
        'wishlist.metadata.duration',

      duracion:
        'wishlist.metadata.duration',

      duración:
        'wishlist.metadata.duration',

      stops:
        'wishlist.metadata.stops',

      escalas:
        'wishlist.metadata.stops',

      price:
        'wishlist.metadata.price',

      precio:
        'wishlist.metadata.price',
    };

  const compact =
    normalized
      .replace(
        /[_\s-]/g,
        '',
      );

  const translationKey =
    metadataKeys[
      normalized
    ] ??
    metadataKeys[
      compact
    ];

  if (
    translationKey
  ) {
    return t(
      translationKey,
    );
  }

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
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
}

function formatMetadataValue(
  label:
    string,

  value:
    unknown,

  t:
    (
      key:
        string,
      options?:
        Record<
          string,
          unknown
        >,
    ) => string,
) {
  if (
    typeof value ===
    'boolean'
  ) {
    return value
      ? t(
          'wishlist.metadata.yes',
        )
      : t(
          'wishlist.metadata.no',
        );
  }

  const text =
    String(
      value,
    );

  const normalizedLabel =
    label
      .trim()
      .toLowerCase();

  const normalizedValue =
    text
      .trim()
      .toLowerCase();

  if (
    normalizedLabel ===
      'tipo' ||
    normalizedLabel ===
      'type'
  ) {
    if (
      [
        'rent a car',
        'alquiler de autos',
        'aluguel de carros',
      ].includes(
        normalizedValue,
      )
    ) {
      return t(
        'cars.common.types.carRental',
      );
    }

    if (
      [
        'car sharing',
      ].includes(
        normalizedValue,
      )
    ) {
      return t(
        'cars.common.types.carSharing',
      );
    }

    if (
      [
        'restaurante',
        'restaurant',
      ].includes(
        normalizedValue,
      )
    ) {
      return t(
        'restaurants.common.types.restaurant',
      );
    }

    if (
      [
        'café',
        'cafe',
      ].includes(
        normalizedValue,
      )
    ) {
      return t(
        'restaurants.common.types.cafe',
      );
    }

    if (
      [
        'comida rápida',
        'fast food',
        'fast_food',
      ].includes(
        normalizedValue,
      )
    ) {
      return t(
        'restaurants.common.types.fastFood',
      );
    }
  }

  if (
    normalizedLabel ===
      'escalas' ||
    normalizedLabel ===
      'stops'
  ) {
    if (
      [
        'directo',
        'direct',
        'direto',
      ].includes(
        normalizedValue,
      )
    ) {
      return t(
        'flights.format.direct',
      );
    }
  }

  return text;
}

function getLocale(
  language:
    string |
    undefined,
) {
  const normalized =
    language
      ?.split(
        '-',
      )[0] ??
    'es';

  if (
    normalized ===
    'en'
  ) {
    return 'en-US';
  }

  if (
    normalized ===
    'pt'
  ) {
    return 'pt-BR';
  }

  return 'es-CR';
}

function formatDate(
  value:
    string,

  language:
    string |
    undefined,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    getLocale(
      language,
    ),
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric',
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
  switch (
    type
  ) {
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
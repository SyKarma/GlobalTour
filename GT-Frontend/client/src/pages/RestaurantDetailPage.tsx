import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  useTranslation,
} from 'react-i18next';

import i18n from '../i18n';

import {
  getRestaurantById,
} from '../services/restaurants.service';

import type {
  RestaurantDetail,
} from '../types/restaurant.types';

function RestaurantDetailPage() {
  const {
    t,
  } =
    useTranslation();

  const navigate =
    useNavigate();

  const {
    id,
  } =
    useParams<{
      id: string;
    }>();

  const [
    restaurant,
    setRestaurant,
  ] =
    useState<
      RestaurantDetail | null
    >(null);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const handleBack =
    () => {
      if (
        window.history.length >
        1
      ) {
        navigate(
          -1,
        );

        return;
      }

      navigate(
        '/restaurants',
      );
    };

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled =
      false;

    const loadRestaurant =
      async () => {
        try {
          setIsLoading(
            true,
          );

          setError(
            null,
          );

          const response =
            await getRestaurantById(
              id,
            );

          if (
            cancelled
          ) {
            return;
          }

          setRestaurant(
            response.data,
          );

          setError(
            null,
          );
        } catch (
          requestError
        ) {
          console.error(
            'Error loading restaurant:',
            requestError,
          );

          if (
            !cancelled
          ) {
            setRestaurant(
              null,
            );

            setError(
              'restaurants.detail.errors.loadMessage',
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void loadRestaurant();

    return () => {
      cancelled =
        true;
    };
  }, [
    id,
  ]);

  if (!id) {
    return (
      <main className="gt-restaurant-detail-page">

        <section className="gt-detail-error-state">

          <div className="gt-detail-error-icon gt-detail-error-orange">
            <RestaurantIcon />
          </div>

          <span>
            {t(
              'restaurants.detail.common.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'restaurants.detail.errors.title',
            )}
          </h1>

          <p>
            {t(
              'restaurants.detail.errors.missingId',
            )}
          </p>

          <button
            type="button"
            onClick={
              handleBack
            }
          >
            <ArrowLeftIcon />

            {t(
              'restaurants.detail.common.back',
            )}
          </button>

        </section>

      </main>
    );
  }

  if (
    isLoading
  ) {
    return (
      <main className="gt-restaurant-detail-page">

        <div className="gt-detail-loading-shell">

          <div className="gt-detail-loading-hero" />

          <div className="gt-detail-loading-grid">
            <div />
            <div />
          </div>

        </div>

      </main>
    );
  }

  if (
    error ||
    !restaurant
  ) {
    return (
      <main className="gt-restaurant-detail-page">

        <section className="gt-detail-error-state">

          <div className="gt-detail-error-icon gt-detail-error-orange">
            <RestaurantIcon />
          </div>

          <span>
            {t(
              'restaurants.detail.common.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'restaurants.detail.errors.title',
            )}
          </h1>

          <p>
            {error
              ? t(
                  error,
                )
              : t(
                  'restaurants.detail.errors.unavailable',
                )}
          </p>

          <button
            type="button"
            onClick={
              handleBack
            }
          >
            <ArrowLeftIcon />

            {t(
              'restaurants.detail.common.back',
            )}
          </button>

        </section>

      </main>
    );
  }

  const cuisines =
    (
      restaurant.cuisine ??
      []
    ).map(
      formatCuisine,
    );

  const hours =
    restaurant.weekdayHours ??
    [];

  const types =
    restaurant.types ??
    [];

  const mapsUrl =
    restaurant.links?.maps ??
    null;

  const websiteUrl =
    restaurant.links?.website ??
    null;

  const hasContact =
    Boolean(
      restaurant.phone,
    ) ||
    Boolean(
      restaurant.internationalPhone,
    );

  const hasCoordinates =
    typeof restaurant.latitude ===
      'number' &&
    typeof restaurant.longitude ===
      'number';

  const hasExtraInformation =
    Boolean(
      restaurant.editorialSummary,
    ) ||
    hours.length > 0;

  return (
    <main className="gt-restaurant-detail-page">

      <section className="gt-restaurant-detail-hero">

        <div className="gt-restaurant-detail-pattern gt-restaurant-detail-pattern-one" />

        <div className="gt-restaurant-detail-pattern gt-restaurant-detail-pattern-two" />

        <div className="gt-restaurant-detail-hero-inner">

          <button
            type="button"
            className="gt-detail-back-button gt-detail-back-light"
            onClick={
              handleBack
            }
          >
            <ArrowLeftIcon />

            {t(
              'restaurants.detail.common.back',
            )}
          </button>

          <div className="gt-restaurant-detail-hero-grid">

            <div className="gt-restaurant-detail-hero-copy">

              <span className="gt-restaurant-detail-eyebrow">
                {t(
                  'restaurants.detail.hero.eyebrow',
                )}
              </span>

              <div className="gt-restaurant-detail-icon">
                <RestaurantIcon />
              </div>

              <span className="gt-restaurant-detail-type">
                {formatRestaurantType(
                  restaurant.primaryType,
                )}
              </span>

              <h1>
                {
                  restaurant.name
                }
              </h1>

              <p>
                <LocationIcon />

                {restaurant.address ??
                  t(
                    'restaurants.detail.hero.addressUnavailable',
                  )}
              </p>

              {cuisines.length >
                0 && (
                <div className="gt-restaurant-detail-cuisines">

                  {cuisines.map(
                    (
                      cuisine,
                    ) => (
                      <span
                        key={
                          cuisine
                        }
                      >
                        {
                          cuisine
                        }
                      </span>
                    ),
                  )}

                </div>
              )}

            </div>

            <div className="gt-restaurant-detail-hero-actions">

              {mapsUrl && (
                <a
                  href={
                    mapsUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapIcon />

                  {t(
                    'restaurants.detail.hero.viewMap',
                  )}
                </a>
              )}

              {websiteUrl && (
                <a
                  href={
                    websiteUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalIcon />

                  {t(
                    'restaurants.detail.hero.website',
                  )}
                </a>
              )}

              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                >
                  <PhoneIcon />

                  {t(
                    'restaurants.detail.hero.call',
                  )}
                </a>
              )}

            </div>

          </div>

        </div>

      </section>

      <div className="gt-detail-content-shell">

        <section className="gt-restaurant-detail-layout">

          <div className="gt-detail-main-column">

            {restaurant.editorialSummary && (
              <article className="gt-detail-panel">

                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-orange">
                  {t(
                    'restaurants.detail.about.eyebrow',
                  )}
                </span>

                <h2>
                  {t(
                    'restaurants.detail.about.title',
                    {
                      name:
                        restaurant.name,
                    },
                  )}
                </h2>

                <p className="gt-detail-description">
                  {
                    restaurant.editorialSummary
                  }
                </p>

              </article>
            )}

            {hours.length >
              0 && (
              <article className="gt-detail-panel">

                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-orange">
                  {t(
                    'restaurants.detail.hours.eyebrow',
                  )}
                </span>

                <h2>
                  {t(
                    'restaurants.detail.hours.title',
                  )}
                </h2>

                <div className="gt-detail-hours-list">

                  {hours.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${item}-${index}`}
                      >
                        <ClockIcon />

                        <span>
                          {
                            item
                          }
                        </span>
                      </div>
                    ),
                  )}

                </div>

              </article>
            )}

            {!hasExtraInformation && (
              <article className="gt-detail-panel gt-detail-empty-panel">

                <InfoIcon />

                <h2>
                  {t(
                    'restaurants.detail.limited.title',
                  )}
                </h2>

                <p>
                  {t(
                    'restaurants.detail.limited.description',
                  )}
                </p>

              </article>
            )}

            {cuisines.length >
              0 && (
              <article className="gt-detail-panel">

                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-orange">
                  {t(
                    'restaurants.detail.cuisine.eyebrow',
                  )}
                </span>

                <h2>
                  {t(
                    'restaurants.detail.cuisine.title',
                  )}
                </h2>

                <div className="gt-restaurant-detail-food-grid">

                  {cuisines.map(
                    (
                      cuisine,
                    ) => (
                      <div
                        key={
                          cuisine
                        }
                      >
                        <FoodIcon />

                        <span>
                          {
                            cuisine
                          }
                        </span>
                      </div>
                    ),
                  )}

                </div>

              </article>
            )}

          </div>

          <aside className="gt-detail-sidebar">

            <article className="gt-detail-panel">

              <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-orange">
                {t(
                  'restaurants.detail.info.eyebrow',
                )}
              </span>

              <h2>
                {t(
                  'restaurants.detail.info.title',
                )}
              </h2>

              <div className="gt-detail-info-list">

                <DetailInfo
                  label={t(
                    'restaurants.detail.info.type',
                  )}
                  value={formatRestaurantType(
                    restaurant.primaryType,
                  )}
                />

                <DetailInfo
                  label={t(
                    'restaurants.detail.info.address',
                  )}
                  value={
                    restaurant.address ??
                    t(
                      'restaurants.detail.info.unavailable',
                    )
                  }
                />

                {hasCoordinates && (
                  <DetailInfo
                    label={t(
                      'restaurants.detail.info.coordinates',
                    )}
                    value={`${restaurant.latitude}, ${restaurant.longitude}`}
                  />
                )}

                {types.length >
                  0 && (
                  <DetailInfo
                    label={t(
                      'restaurants.detail.info.classification',
                    )}
                    value={types
                      .map(
                        formatCuisine,
                      )
                      .join(
                        ', ',
                      )}
                  />
                )}

              </div>

            </article>

            {hasContact && (
              <article className="gt-detail-panel">

                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-orange">
                  {t(
                    'restaurants.detail.contact.eyebrow',
                  )}
                </span>

                <h2>
                  {t(
                    'restaurants.detail.contact.title',
                  )}
                </h2>

                <div className="gt-detail-contact-list">

                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone}`}
                    >
                      <PhoneIcon />

                      <div>

                        <span>
                          {t(
                            'restaurants.detail.contact.phone',
                          )}
                        </span>

                        <strong>
                          {
                            restaurant.phone
                          }
                        </strong>

                      </div>

                    </a>
                  )}

                  {restaurant.internationalPhone &&
                    restaurant.internationalPhone !==
                      restaurant.phone && (
                    <a
                      href={`tel:${restaurant.internationalPhone}`}
                    >
                      <PhoneIcon />

                      <div>

                        <span>
                          {t(
                            'restaurants.detail.contact.internationalPhone',
                          )}
                        </span>

                        <strong>
                          {
                            restaurant.internationalPhone
                          }
                        </strong>

                      </div>

                    </a>
                  )}

                </div>

              </article>
            )}

            <article className="gt-detail-source-card gt-detail-source-orange">

              <GlobeIcon />

              <div>

                <span>
                  {t(
                    'restaurants.detail.source.label',
                  )}
                </span>

                <strong>
                  OpenStreetMap
                </strong>

                <small>
                  © OpenStreetMap contributors
                </small>

              </div>

            </article>

          </aside>

        </section>

      </div>

    </main>
  );
}

interface DetailInfoProps {
  label:
    string;

  value:
    string;
}

function DetailInfo({
  label,
  value,
}: DetailInfoProps) {
  return (
    <div className="gt-detail-info-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function formatRestaurantType(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return i18n.t(
      'restaurants.common.types.gastronomy',
    );
  }

  switch (
    value
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        '_',
      )
  ) {
    case 'restaurant':
      return i18n.t(
        'restaurants.common.types.restaurant',
      );

    case 'cafe':
      return i18n.t(
        'restaurants.common.types.cafe',
      );

    case 'fast_food':
      return i18n.t(
        'restaurants.common.types.fastFood',
      );

    default:
      return value;
  }
}

function formatCuisine(
  value:
    string,
) {
  return value
    .replace(
      /_/g,
      ' ',
    )
    .replace(
      /\b\w/g,
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
}

function RestaurantIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8 0 2 1 3 3 3v7M17 3v11" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M14 5h5v5m0-5-9 9M19 13v6H5V5h6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3h3l1.5 5-2 1.5a15 15 0 0 0 5 5l1.5-2L21 14v3c0 2-2 4-4 4C9 20 4 15 3 7c0-2 2-4 4-4Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 11v6M12 7h.01" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
      />

      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9M12 3c-3 3-4 6-4 9s1 6 4 9" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export default RestaurantDetailPage;
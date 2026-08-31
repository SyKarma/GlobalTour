import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  getRestaurantById,
} from '../services/restaurants.service';

import type {
  RestaurantDetail,
} from '../types/restaurant.types';

function RestaurantDetailPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const [restaurant, setRestaurant] =
    useState<RestaurantDetail | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    const loadRestaurant = async () => {
      try {
        const response =
          await getRestaurantById(id);

        if (!cancelled) {
          setRestaurant(response.data);
          setError(null);
        }
      } catch (requestError) {
        console.error(
          'Error loading restaurant:',
          requestError,
        );

        if (!cancelled) {
          setError(
            'No fue posible cargar la información del restaurante.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRestaurant();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <main className="restaurant-detail-page">
        <div className="restaurant-detail-container">
          <RestaurantDetailLoading />
        </div>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="restaurant-detail-page">
        <div className="restaurant-detail-container">
          <div className="restaurant-detail-error">
            <div className="restaurant-detail-error-icon">
              <RestaurantIcon />
            </div>

            <h1>
              No encontramos este restaurante
            </h1>

            <p>
              {error ??
                'El restaurante solicitado no está disponible.'}
            </p>

            <Link
              to="/restaurants"
              className="restaurant-detail-primary-action"
            >
              Volver a restaurantes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const cuisine =
    restaurant.cuisine ?? [];

  const cuisineLabel =
    cuisine.length > 0
      ? cuisine
          .map(formatCuisine)
          .join(' · ')
      : getCuisineFromTypes(
          restaurant.types,
        );

  const hasContact =
    Boolean(restaurant.phone) ||
    Boolean(
      restaurant.internationalPhone,
    );

  const hasHours =
    restaurant.weekdayHours.length > 0;

  return (
    <main className="restaurant-detail-page">
      <div className="restaurant-detail-container">
        <Link
          to="/restaurants"
          className="restaurant-detail-back"
        >
          <ArrowLeftIcon />

          Volver a restaurantes
        </Link>

        <section className="restaurant-detail-hero">
          <div className="restaurant-detail-hero-main">
            <div className="restaurant-detail-icon">
              <RestaurantIcon />
            </div>

            <div>
              <span className="restaurant-detail-type">
                {formatRestaurantType(
                  restaurant.primaryType,
                )}
              </span>

              <h1>
                {restaurant.name}
              </h1>

              {cuisineLabel && (
                <p className="restaurant-detail-cuisine">
                  {cuisineLabel}
                </p>
              )}

              <div className="restaurant-detail-location">
                <LocationIcon />

                <span>
                  {restaurant.address ??
                    'Dirección no disponible'}
                </span>
              </div>
            </div>
          </div>

          <div className="restaurant-detail-actions">
            {restaurant.links.maps && (
              <a
                href={
                  restaurant.links.maps
                }
                target="_blank"
                rel="noreferrer"
                className="restaurant-detail-secondary-action"
              >
                <MapIcon />

                Ver mapa
              </a>
            )}

            {restaurant.links.website && (
              <a
                href={
                  restaurant.links.website
                }
                target="_blank"
                rel="noreferrer"
                className="restaurant-detail-primary-action"
              >
                Sitio web

                <ExternalIcon />
              </a>
            )}
          </div>
        </section>

        <section className="restaurant-detail-grid">
          <div className="restaurant-detail-main-column">
            {restaurant.editorialSummary && (
              <article className="restaurant-detail-panel">
                <div className="restaurant-detail-panel-heading">
                  <InfoIcon />

                  <div>
                    <h2>
                      Acerca del lugar
                    </h2>

                    <p>
                      Información disponible
                      del establecimiento.
                    </p>
                  </div>
                </div>

                <div className="restaurant-detail-description">
                  {
                    restaurant.editorialSummary
                  }
                </div>
              </article>
            )}

            {hasHours && (
              <article className="restaurant-detail-panel">
                <div className="restaurant-detail-panel-heading">
                  <ClockIcon />

                  <div>
                    <h2>
                      Horario
                    </h2>

                    <p>
                      Horario publicado por
                      el establecimiento.
                    </p>
                  </div>
                </div>

                <div className="restaurant-hours-list">
                  {restaurant.weekdayHours.map(
                    (hours, index) => (
                      <div
                        key={`${hours}-${index}`}
                        className="restaurant-hours-item"
                      >
                        <ClockIcon />

                        <span>
                          {hours}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </article>
            )}

            {!restaurant.editorialSummary &&
              !hasHours && (
                <article className="restaurant-detail-panel restaurant-detail-no-info">
                  <div className="restaurant-detail-no-info-icon">
                    <InfoIcon />
                  </div>

                  <h2>
                    Información limitada
                  </h2>

                  <p>
                    OpenStreetMap todavía no
                    tiene descripción u horario
                    adicional para este lugar.
                  </p>
                </article>
              )}
          </div>

          <aside className="restaurant-detail-sidebar">
            <article className="restaurant-detail-panel">
              <h2>
                Información
              </h2>

              <div className="restaurant-detail-info-list">
                <DetailInfo
                  label="Tipo"
                  value={formatRestaurantType(
                    restaurant.primaryType,
                  )}
                />

                {cuisineLabel && (
                  <DetailInfo
                    label="Cocina"
                    value={cuisineLabel}
                  />
                )}

                <DetailInfo
                  label="Dirección"
                  value={
                    restaurant.address ??
                    'No disponible'
                  }
                />

                {restaurant.latitude !==
                  null &&
                  restaurant.longitude !==
                    null && (
                    <DetailInfo
                      label="Coordenadas"
                      value={`${restaurant.latitude}, ${restaurant.longitude}`}
                    />
                  )}
              </div>
            </article>

            {hasContact && (
              <article className="restaurant-detail-panel">
                <h2>
                  Contacto
                </h2>

                <div className="restaurant-detail-contact-list">
                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="restaurant-detail-contact"
                    >
                      <PhoneIcon />

                      <div>
                        <span>
                          Teléfono
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
                        className="restaurant-detail-contact"
                      >
                        <PhoneIcon />

                        <div>
                          <span>
                            Teléfono
                            internacional
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

            <article className="restaurant-detail-source">
              <span>
                Fuente de información
              </span>

              <strong>
                OpenStreetMap
              </strong>

              <small>
                © OpenStreetMap contributors
              </small>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}

interface DetailInfoProps {
  label: string;
  value: string;
}

function DetailInfo({
  label,
  value,
}: DetailInfoProps) {
  return (
    <div className="restaurant-detail-info-item">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function RestaurantDetailLoading() {
  return (
    <div className="restaurant-detail-loading">
      <div className="restaurant-detail-loading-header">
        <div className="restaurant-detail-loading-square" />

        <div>
          <div className="restaurant-detail-loading-line restaurant-detail-loading-small" />

          <div className="restaurant-detail-loading-line restaurant-detail-loading-title" />

          <div className="restaurant-detail-loading-line restaurant-detail-loading-medium" />
        </div>
      </div>

      <div className="restaurant-detail-loading-grid">
        <div className="restaurant-detail-loading-card" />

        <div className="restaurant-detail-loading-card" />
      </div>
    </div>
  );
}

function formatCuisine(
  value: string,
) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getCuisineFromTypes(
  types: string[],
) {
  const ignoredTypes = new Set([
    'restaurant',
    'cafe',
    'fast_food',
  ]);

  const cuisines =
    types.filter(
      (type) =>
        !ignoredTypes.has(type),
    );

  if (cuisines.length === 0) {
    return null;
  }

  return cuisines
    .slice(0, 4)
    .map(formatCuisine)
    .join(' · ');
}

function formatRestaurantType(
  type: string | null,
) {
  if (!type) {
    return 'Gastronomía';
  }

  const normalized =
    type.toLowerCase();

  if (normalized === 'restaurant') {
    return 'Restaurante';
  }

  if (normalized === 'cafe') {
    return 'Café';
  }

  if (
    normalized === 'fast food' ||
    normalized === 'fast_food'
  ) {
    return 'Comida rápida';
  }

  return type;
}

function RestaurantIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v7M4 3v5a3 3 0 0 0 6 0V3M7 11v10M15 3v18M15 3c3 0 5 2.5 5 6s-2 5-5 5" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />

      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5" />

      <path d="m19 5-9 9" />

      <path d="M19 13v6H5V5h6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />

      <path d="M12 11v6" />

      <path d="M12 7h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h3l1.5 5-2 1.5a15 15 0 0 0 5 5l1.5-2L21 14v3c0 2-2 4-4 4C9 20 4 15 3 7c0-2 2-4 4-4Z" />
    </svg>
  );
}

export default RestaurantDetailPage;
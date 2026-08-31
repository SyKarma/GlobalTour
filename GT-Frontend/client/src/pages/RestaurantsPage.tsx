import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import RestaurantSearchForm from '../components/restaurants/RestaurantSearchForm';

import type {
  RestaurantSearchValues,
} from '../components/restaurants/RestaurantSearchForm';

import {
  searchRestaurants,
} from '../services/restaurants.service';

import type {
  Restaurant,
  RestaurantSearchMeta,
  RestaurantSearchParams,
} from '../types/restaurant.types';

function RestaurantsPage() {
  const [searchParams] =
    useSearchParams();

  const navigate = useNavigate();

  const [restaurants, setRestaurants] =
    useState<Restaurant[]>([]);

  const [meta, setMeta] =
    useState<RestaurantSearchMeta | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const cityName =
    searchParams.get('cityName') ?? '';

  const countryCode =
    searchParams.get('countryCode') ?? '';

  const type =
    searchParams.get('type') ?? '';

  const cuisine =
    searchParams.get('cuisine') ?? '';

  const radius =
    Number(
      searchParams.get('radius') ?? 4000,
    ) || 4000;

  const hasWebsite =
    searchParams.get('hasWebsite') ===
    'true';

  const hasSearch =
    cityName.trim().length >= 2;

  useEffect(() => {
    if (!hasSearch) {
      return;
    }

    let cancelled = false;

    const loadRestaurants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params: RestaurantSearchParams =
          {
            cityName,
            radius,
            limit: 20,
          };

        if (countryCode) {
          params.countryCode =
            countryCode.toUpperCase();
        }

        if (
          type === 'restaurant' ||
          type === 'cafe' ||
          type === 'fast_food'
        ) {
          params.type = type;
        }

        if (cuisine) {
          params.cuisine =
            normalizeFilter(cuisine);
        }

        if (hasWebsite) {
          params.hasWebsite = true;
        }

        const response =
          await searchRestaurants(params);

        if (cancelled) {
          return;
        }

        setRestaurants(response.data);
        setMeta(response.meta);
        setError(null);
      } catch (requestError) {
        console.error(
          'Error searching restaurants:',
          requestError,
        );

        if (!cancelled) {
          setRestaurants([]);
          setMeta(null);

          setError(
            'No fue posible buscar restaurantes en este momento.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRestaurants();

    return () => {
      cancelled = true;
    };
  }, [
    cityName,
    countryCode,
    cuisine,
    hasSearch,
    hasWebsite,
    radius,
    type,
  ]);

  const handleSearch = (
    values: RestaurantSearchValues,
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      'cityName',
      values.cityName,
    );

    if (values.countryCode) {
      params.set(
        'countryCode',
        values.countryCode,
      );
    }

    params.set(
      'radius',
      String(values.radius),
    );

    if (values.type) {
      params.set(
        'type',
        values.type,
      );
    }

    if (values.cuisine) {
      params.set(
        'cuisine',
        normalizeFilter(
          values.cuisine,
        ),
      );
    }

    if (values.hasWebsite) {
      params.set(
        'hasWebsite',
        'true',
      );
    }

    navigate(
      `/restaurants?${params.toString()}`,
    );
  };

  const pageTitle = useMemo(() => {
    if (!meta) {
      return 'Restaurantes';
    }

    if (meta.countryName) {
      return `Restaurantes en ${meta.cityName}, ${meta.countryName}`;
    }

    return `Restaurantes en ${meta.cityName}`;
  }, [meta]);

  return (
    <main className="restaurants-page">
      <section className="restaurants-hero">
        <div className="restaurants-page-container">
          <span className="restaurants-eyebrow">
            Gastronomía en tu destino
          </span>

          <h1>
            Encuentra dónde comer durante
            tu viaje
          </h1>

          <p>
            Explora restaurantes, cafés y
            opciones de comida rápida cerca
            de tu destino.
          </p>

          <RestaurantSearchForm
            initialValues={{
              cityName,
              countryCode,
              type,
              cuisine,
              radius,
              hasWebsite,
            }}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>
      </section>

      <section className="restaurants-results-section">
        <div className="restaurants-page-container">
          {!hasSearch ? (
            <RestaurantWelcomeState />
          ) : error ? (
            <div className="restaurants-error-state">
              <h2>
                No pudimos cargar los
                restaurantes
              </h2>

              <p>{error}</p>
            </div>
          ) : (
            <>
              <header className="restaurants-results-header">
                <div>
                  <span className="restaurants-results-label">
                    Resultados
                  </span>

                  <h2>{pageTitle}</h2>

                  <p>
                    {isLoading
                      ? 'Buscando lugares...'
                      : `${restaurants.length} de ${
                          meta?.matched ??
                          restaurants.length
                        } lugares encontrados`}
                  </p>
                </div>

                {meta && (
                  <div className="restaurants-search-summary">
                    <span>
                      Radio
                    </span>

                    <strong>
                      {formatRadius(
                        meta.radiusMeters,
                      )}
                    </strong>
                  </div>
                )}
              </header>

              {isLoading &&
              restaurants.length === 0 ? (
                <RestaurantLoading />
              ) : restaurants.length > 0 ? (
                <div className="restaurants-grid">
                  {restaurants.map(
                    (restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={
                          restaurant
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="restaurants-empty-state">
                  <div className="restaurants-empty-icon">
                    <RestaurantIcon />
                  </div>

                  <h3>
                    No encontramos lugares
                  </h3>

                  <p>
                    Prueba aumentando el radio
                    de búsqueda o quitando
                    algunos filtros.
                  </p>
                </div>
              )}

              {meta?.attribution && (
                <div className="restaurants-attribution">
                  © OpenStreetMap contributors
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

function RestaurantCard({
  restaurant,
}: RestaurantCardProps) {
  const cuisine =
    restaurant.cuisine ?? [];

  const cuisineLabel =
    cuisine.length > 0
      ? cuisine
          .slice(0, 3)
          .map(formatCuisine)
          .join(' · ')
      : getCuisineFromTypes(
          restaurant.types,
        );

  return (
    <article className="restaurant-card">
      <div className="restaurant-card-top">
        <div className="restaurant-card-icon">
          <RestaurantIcon />
        </div>

        <div className="restaurant-card-heading">
          <span className="restaurant-type-badge">
            {formatRestaurantType(
              restaurant.primaryType,
            )}
          </span>

          <h3>
            {restaurant.name}
          </h3>
        </div>
      </div>

      {cuisineLabel && (
        <div className="restaurant-cuisine">
          <span>Cocina</span>

          <strong>
            {cuisineLabel}
          </strong>
        </div>
      )}

      <div className="restaurant-location">
        <LocationIcon />

        <span>
          {restaurant.address ??
            'Dirección no disponible'}
        </span>
      </div>

      <div className="restaurant-card-spacer" />

      <div className="restaurant-card-actions">
        {restaurant.links.maps && (
          <>
            <a
              href={restaurant.links.maps}
              target="_blank"
              rel="noreferrer"
              className="restaurant-secondary-button"
            >
              <MapIcon />

              Ver mapa
            </a>

            <Link
              to={`/restaurants/${restaurant.id}`}
              className="restaurant-detail-button"
            >
              Ver detalles
            </Link>
          </>
        )}

        {restaurant.links.website && (
          <a
            href={
              restaurant.links.website
            }
            target="_blank"
            rel="noreferrer"
            className="restaurant-primary-button"
          >
            Sitio web

            <ExternalIcon />
          </a>
        )}
      </div>
    </article>
  );
}

function RestaurantWelcomeState() {
  return (
    <div className="restaurants-welcome">
      <div className="restaurants-welcome-icon">
        <RestaurantIcon />
      </div>

      <h2>
        Descubre la gastronomía de tu
        próximo destino
      </h2>

      <p>
        Escribe una ciudad para encontrar
        restaurantes y otros establecimientos
        gastronómicos cercanos.
      </p>

      <div className="restaurants-feature-grid">
        <div>
          <strong>
            Restaurantes
          </strong>

          <span>
            Explora opciones para almorzar
            o cenar.
          </span>
        </div>

        <div>
          <strong>
            Cafés
          </strong>

          <span>
            Encuentra cafeterías cerca de
            tu destino.
          </span>
        </div>

        <div>
          <strong>
            Comida rápida
          </strong>

          <span>
            Localiza opciones prácticas y
            cercanas.
          </span>
        </div>
      </div>
    </div>
  );
}

function RestaurantLoading() {
  return (
    <div className="restaurants-loading-grid">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="restaurant-loading-card"
        >
          <div className="restaurant-loading-line restaurant-loading-short" />

          <div className="restaurant-loading-line restaurant-loading-title" />

          <div className="restaurant-loading-line" />

          <div className="restaurant-loading-line" />
        </div>
      ))}
    </div>
  );
}

function formatRadius(
  meters: number,
) {
  if (meters >= 1000) {
    return `${meters / 1000} km`;
  }

  return `${meters} m`;
}

function normalizeFilter(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
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

  const cuisineTypes =
    types.filter(
      (type) =>
        !ignoredTypes.has(type),
    );

  if (cuisineTypes.length === 0) {
    return null;
  }

  return cuisineTypes
    .slice(0, 3)
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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3v7M4 3v5a3 3 0 0 0 6 0V3M7 11v10M15 3v18M15 3c3 0 5 2.5 5 6s-2 5-5 5" />
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
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />

      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M14 5h5v5" />

      <path d="m19 5-9 9" />

      <path d="M19 13v6H5V5h6" />
    </svg>
  );
}

export default RestaurantsPage;
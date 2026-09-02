import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import RestaurantSearchForm, {
  type RestaurantSearchValues,
} from '../components/restaurants/RestaurantSearchForm';

import {
  searchRestaurants,
} from '../services/restaurants.service';

import type {
  RestaurantSearchMeta,
} from '../types/restaurant.types';

/*
 * Usamos directamente el tipo que devuelve
 * searchRestaurants().
 *
 * Así no dependemos de que exista un export
 * llamado RestaurantSummary.
 */
type RestaurantItem =
  Awaited<
    ReturnType<
      typeof searchRestaurants
    >
  >['data'][number];

function RestaurantsPage() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const [
    restaurants,
    setRestaurants,
  ] =
    useState<
      RestaurantItem[]
    >([]);

  const [meta, setMeta] =
    useState<RestaurantSearchMeta | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const cityName =
    searchParams.get(
      'cityName',
    ) ?? '';

  const countryCode =
    searchParams.get(
      'countryCode',
    ) ?? '';

  const type =
    searchParams.get(
      'type',
    ) ?? '';

  const cuisine =
    searchParams.get(
      'cuisine',
    ) ?? '';

  const radius =
    Number(
      searchParams.get(
        'radius',
      ),
    ) || 4000;

  const hasWebsite =
    searchParams.get(
      'hasWebsite',
    ) === 'true';

  /*
   * Restaurantes ya no depende
   * de DestinationAutocomplete.
   *
   * Solo necesitamos cityName.
   */
  const hasSearch =
    cityName.trim().length >= 2;

  useEffect(() => {
    if (!hasSearch) {
      return;
    }

    let cancelled = false;

    const loadRestaurants =
      async () => {
        setIsLoading(true);

        try {
          const response =
            await searchRestaurants({
              cityName:
                cityName.trim(),

              countryCode:
                countryCode.trim() ||
                undefined,

              radius,

              limit: 20,

              type:
                type ===
                  'restaurant' ||
                type ===
                  'cafe' ||
                type ===
                  'fast_food'
                  ? type
                  : undefined,

              cuisine:
                cuisine.trim() ||
                undefined,

              hasWebsite:
                hasWebsite ||
                undefined,
            });

          if (cancelled) {
            return;
          }

          setRestaurants(
            response.data,
          );

          setMeta(
            response.meta,
          );

          setError(null);
        } catch (
          requestError
        ) {
          console.error(
            'Error al buscar restaurantes:',
            requestError,
          );

          if (!cancelled) {
            setRestaurants(
              [],
            );

            setMeta(null);

            setError(
              'No fue posible buscar restaurantes en este momento.',
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(
              false,
            );
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
    type,
    cuisine,
    radius,
    hasWebsite,
    hasSearch,
  ]);

  const handleSearch = (
    values:
      RestaurantSearchValues,
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      'cityName',
      values.cityName.trim(),
    );

    /*
     * countryCode es opcional.
     */
    if (
      values.countryCode.trim()
    ) {
      params.set(
        'countryCode',
        values.countryCode
          .trim()
          .toUpperCase(),
      );
    }

    params.set(
      'radius',
      String(
        values.radius,
      ),
    );

    if (values.type) {
      params.set(
        'type',
        values.type,
      );
    }

    if (
      values.cuisine.trim()
    ) {
      params.set(
        'cuisine',
        values.cuisine.trim(),
      );
    }

    if (
      values.hasWebsite
    ) {
      params.set(
        'hasWebsite',
        'true',
      );
    }

    navigate(
      `/restaurants?${params.toString()}`,
    );
  };

  return (
    <main className="restaurants-page">
      <section className="restaurants-hero">
        <div className="restaurants-page-container">
          <span className="restaurants-eyebrow">
            GlobalTour Restaurantes
          </span>

          <h1>
            Descubre dónde comer en tu
            destino
          </h1>

          <p>
            Explora restaurantes,
            cafeterías y opciones de
            comida rápida disponibles
            cerca de la ciudad que
            visites.
          </p>

          <RestaurantSearchForm
            key={`${cityName}-${countryCode}-${type}-${cuisine}-${radius}-${hasWebsite}`}
            initialValues={{
              cityName,
              countryCode,

              type:
                type ===
                  'restaurant' ||
                type ===
                  'cafe' ||
                type ===
                  'fast_food'
                  ? type
                  : '',

              cuisine,
              radius,
              hasWebsite,
            }}
            onSearch={
              handleSearch
            }
            isLoading={
              isLoading
            }
          />
        </div>
      </section>

      <section className="restaurants-results-section">
        <div className="restaurants-page-container">
          {!hasSearch ? (
            <RestaurantsWelcome />
          ) : error ? (
            <div className="restaurants-error-state">
              <RestaurantIcon />

              <h2>
                No pudimos completar la
                búsqueda
              </h2>

              <p>
                {error}
              </p>
            </div>
          ) : isLoading ? (
            <RestaurantsLoading />
          ) : restaurants.length ===
            0 ? (
            <RestaurantsEmpty />
          ) : (
            <>
              <div className="restaurants-results-header">
                <div>
                  <span className="restaurants-results-label">
                    Resultados
                  </span>

                  <h2>
                    {meta?.cityName ??
                      cityName}

                    {meta?.countryName
                      ? `, ${meta.countryName}`
                      : ''}
                  </h2>

                  <p>
                    Opciones encontradas
                    dentro de un radio de{' '}
                    {formatDistance(
                      meta?.radiusMeters ??
                        radius,
                    )}
                    .
                  </p>
                </div>

                <div className="restaurants-search-summary">
                  <span>
                    Encontrados
                  </span>

                  <strong>
                    {meta?.matched ??
                      restaurants.length}
                  </strong>
                </div>
              </div>

              <div className="restaurants-grid">
                {restaurants.map(
                  (
                    restaurant,
                  ) => (
                    <RestaurantCard
                      key={
                        restaurant.id
                      }
                      restaurant={
                        restaurant
                      }
                    />
                  ),
                )}
              </div>

              <div className="restaurants-disclaimer">
                <p>
                  GlobalTour muestra
                  información geográfica
                  disponible públicamente.
                  Los horarios, precios,
                  disponibilidad y
                  reservas deben
                  confirmarse directamente
                  con cada establecimiento.
                </p>

                <span>
                  © OpenStreetMap
                  contributors
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

interface RestaurantCardProps {
  restaurant:
    RestaurantItem;
}

function RestaurantCard({
  restaurant,
}: RestaurantCardProps) {
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

      {restaurant.cuisine &&
        restaurant.cuisine
          .length > 0 && (
          <div className="restaurant-cuisine">
            <span>
              Cocina
            </span>

            <strong>
              {restaurant.cuisine
                .map(
                  formatCuisine,
                )
                .join(', ')}
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
        <Link
          to={`/restaurants/${restaurant.id}`}
          className="restaurant-detail-button"
        >
          Ver detalles
        </Link>

        {restaurant.links
          .maps && (
          <a
            href={
              restaurant.links
                .maps
            }
            target="_blank"
            rel="noreferrer"
            className="restaurant-secondary-button"
          >
            <MapIcon />

            Ver mapa
          </a>
        )}

        {restaurant.links
          .website && (
          <a
            href={
              restaurant.links
                .website
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

function RestaurantsWelcome() {
  return (
    <div className="restaurants-welcome">
      <div className="restaurants-welcome-icon">
        <RestaurantIcon />
      </div>

      <h2>
        Busca restaurantes por ciudad
      </h2>

      <p>
        Escribe una ciudad o localidad
        para descubrir opciones
        gastronómicas cercanas.
      </p>

      <div className="restaurants-feature-grid">
        <div>
          <strong>
            Restaurantes
          </strong>

          <span>
            Encuentra diferentes opciones
            para comer.
          </span>
        </div>

        <div>
          <strong>
            Cafeterías
          </strong>

          <span>
            Descubre cafés disponibles
            cerca de tu destino.
          </span>
        </div>

        <div>
          <strong>
            Información real
          </strong>

          <span>
            Datos geográficos obtenidos
            desde OpenStreetMap.
          </span>
        </div>
      </div>
    </div>
  );
}

function RestaurantsEmpty() {
  return (
    <div className="restaurants-empty-state">
      <div className="restaurants-empty-icon">
        <RestaurantIcon />
      </div>

      <h3>
        No encontramos restaurantes
      </h3>

      <p>
        Prueba aumentando el radio,
        eliminando filtros o buscando
        una ciudad cercana.
      </p>
    </div>
  );
}

function RestaurantsLoading() {
  return (
    <div className="restaurants-loading-grid">
      {Array.from({
        length: 6,
      }).map(
        (
          _,
          index,
        ) => (
          <div
            key={index}
            className="restaurant-loading-card"
          >
            <div className="restaurant-loading-line restaurant-loading-short" />

            <div className="restaurant-loading-line restaurant-loading-title" />

            <div className="restaurant-loading-line" />

            <div className="restaurant-loading-line" />
          </div>
        ),
      )}
    </div>
  );
}

function formatRestaurantType(
  value: string | null,
) {
  if (!value) {
    return 'Gastronomía';
  }

  switch (
    value.toLowerCase()
  ) {
    case 'restaurant':
      return 'Restaurante';

    case 'cafe':
      return 'Cafetería';

    case 'fast food':
    case 'fast_food':
      return 'Comida rápida';

    default:
      return value;
  }
}

function formatCuisine(
  value: string,
) {
  return value
    .replace(
      /_/g,
      ' ',
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatDistance(
  meters: number,
) {
  if (meters >= 1000) {
    return `${
      meters / 1000
    } km`;
  }

  return `${meters} m`;
}

function RestaurantIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3v7M10 3v7M7 7h3M8.5 10v11" />

      <path d="M15 3v18" />

      <path d="M15 3c3 2 3 7 0 9" />
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
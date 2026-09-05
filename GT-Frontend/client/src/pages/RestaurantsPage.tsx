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
  RestaurantAmenity,
  RestaurantSearchValues,
} from '../components/restaurants/RestaurantSearchForm';

import {
  searchRestaurants,
} from '../services/restaurants.service';

type RestaurantItem =
  Awaited<
    ReturnType<
      typeof searchRestaurants
    >
  >['data'][number];

type RestaurantMeta =
  Awaited<
    ReturnType<
      typeof searchRestaurants
    >
  >['meta'];

type RestaurantSortOption =
  | 'recommended'
  | 'name'
  | 'cuisine';

/*
 * =========================================
 * HELPERS
 * =========================================
 */

function isRestaurantAmenity(
  value: string | null,
): value is RestaurantAmenity {
  return (
    value ===
      'restaurant' ||
    value ===
      'cafe' ||
    value ===
      'fast_food'
  );
}

function formatRestaurantType(
  value: string | null,
) {
  if (!value) {
    return 'Gastronomía';
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
      return 'Restaurante';

    case 'cafe':
      return 'Café';

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
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
}

function formatRadius(
  meters: number,
) {
  if (
    meters >= 1000
  ) {
    return `${
      meters / 1000
    } km`;
  }

  return `${meters} m`;
}

/*
 * Devuelve siempre un arreglo seguro.
 * cuisine puede venir undefined.
 */
function getRestaurantCuisines(
  restaurant: RestaurantItem,
) {
  return (
    restaurant.cuisine ??
    []
  );
}

/*
 * =========================================
 * PAGE
 * =========================================
 */

function RestaurantsPage() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const [
    restaurants,
    setRestaurants,
  ] =
    useState<
      RestaurantItem[]
    >([]);

  const [
    meta,
    setMeta,
  ] =
    useState<RestaurantMeta | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    sortOption,
    setSortOption,
  ] =
    useState<RestaurantSortOption>(
      'recommended',
    );

  /*
   * =========================================
   * URL PARAMS
   * =========================================
   */

  const cityName =
    searchParams.get(
      'cityName',
    ) ?? '';

  const countryCode =
    searchParams.get(
      'countryCode',
    ) ?? '';

  const typeParam =
    searchParams.get(
      'type',
    );

  const cuisine =
    searchParams.get(
      'cuisine',
    ) ?? '';

  const radius =
    Number(
      searchParams.get(
        'radius',
      ) ??
        4000,
    );

  const hasWebsite =
    searchParams.get(
      'hasWebsite',
    ) === 'true';

  const type =
    isRestaurantAmenity(
      typeParam,
    )
      ? typeParam
      : '';

  const hasSearch =
    cityName
      .trim()
      .length >= 2;

  /*
   * =========================================
   * SEARCH HANDLER
   * =========================================
   */

  const handleSearch = (
    values:
      RestaurantSearchValues,
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      'cityName',
      values.cityName,
    );

    if (
      values.countryCode
    ) {
      params.set(
        'countryCode',
        values.countryCode,
      );
    }

    params.set(
      'radius',
      String(
        values.radius,
      ),
    );

    if (
      values.type
    ) {
      params.set(
        'type',
        values.type,
      );
    }

    if (
      values.cuisine
    ) {
      params.set(
        'cuisine',
        values.cuisine,
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

  /*
   * =========================================
   * LOAD RESTAURANTS
   * =========================================
   */

  useEffect(() => {
    if (!hasSearch) {
      return;
    }

    let isCancelled =
      false;

    const loadRestaurants =
      async () => {
        try {
          setIsLoading(
            true,
          );

          setError(
            null,
          );

          const response =
            await searchRestaurants(
              {
                cityName:
                  cityName.trim(),

                countryCode:
                  countryCode.trim() ||
                  undefined,

                radius,

                limit: 20,

                type:
                  type ||
                  undefined,

                cuisine:
                  cuisine.trim() ||
                  undefined,

                hasWebsite:
                  hasWebsite ||
                  undefined,
              },
            );

          if (
            isCancelled
          ) {
            return;
          }

          setRestaurants(
            response.data,
          );

          setMeta(
            response.meta,
          );

          setSortOption(
            'recommended',
          );
        } catch (
          requestError
        ) {
          if (
            isCancelled
          ) {
            return;
          }

          console.error(
            'Error al buscar restaurantes:',
            requestError,
          );

          setRestaurants(
            [],
          );

          setMeta(
            null,
          );

          setError(
            'No pudimos obtener restaurantes en este momento.',
          );
        } finally {
          if (
            !isCancelled
          ) {
            setIsLoading(
              false,
            );
          }
        }
      };

    void loadRestaurants();

    return () => {
      isCancelled =
        true;
    };
  }, [
    cityName,
    countryCode,
    radius,
    type,
    cuisine,
    hasWebsite,
    hasSearch,
  ]);

  /*
   * =========================================
   * SORT
   * =========================================
   */

  const sortedRestaurants =
    useMemo(() => {
      const result =
        [
          ...restaurants,
        ];

      if (
        sortOption ===
        'name'
      ) {
        result.sort(
          (
            a,
            b,
          ) =>
            a.name.localeCompare(
              b.name,
            ),
        );
      }

      if (
        sortOption ===
        'cuisine'
      ) {
        result.sort(
          (
            a,
            b,
          ) =>
            getRestaurantCuisines(
              b,
            ).length -
            getRestaurantCuisines(
              a,
            ).length,
        );
      }

      return result;
    }, [
      restaurants,
      sortOption,
    ]);

  /*
   * =========================================
   * INSIGHTS
   * =========================================
   */

  const websiteCount =
    useMemo(
      () =>
        restaurants.filter(
          (
            restaurant,
          ) =>
            Boolean(
              restaurant
                .links
                ?.website,
            ),
        ).length,

      [
        restaurants,
      ],
    );

  const mapCount =
    useMemo(
      () =>
        restaurants.filter(
          (
            restaurant,
          ) =>
            Boolean(
              restaurant
                .links
                ?.maps,
            ),
        ).length,

      [
        restaurants,
      ],
    );

  const cuisineCount =
    useMemo(() => {
      const cuisines =
        new Set<
          string
        >();

      restaurants.forEach(
        (
          restaurant,
        ) => {
          getRestaurantCuisines(
            restaurant,
          ).forEach(
            (
              item,
            ) => {
              cuisines.add(
                item,
              );
            },
          );
        },
      );

      return cuisines.size;
    }, [
      restaurants,
    ]);

  /*
   * =========================================
   * RENDER
   * =========================================
   */

  return (
    <main className="gt-restaurants-page">

      {/* =====================================
          HERO
      ====================================== */}

      <section className="gt-restaurants-hero">
        <div className="gt-restaurants-hero-overlay" />

        <div className="gt-restaurants-hero-inner">
          <span className="gt-restaurants-eyebrow">
            GLOBALTOUR · RESTAURANTES
          </span>

          <h1>
            {hasSearch
              ? `Sabores por descubrir en ${cityName}`
              : 'Descubre el sabor de cada destino'}
          </h1>

          <p>
            Explora restaurantes,
            cafeterías y opciones
            gastronómicas cerca de tu
            próximo destino.
          </p>

          <div className="gt-restaurants-hero-pills">
            <span>
              <RestaurantIcon />

              Restaurantes
            </span>

            <span>
              <CoffeeIcon />

              Cafeterías
            </span>

            <span>
              <FoodIcon />

              Cocina local
            </span>
          </div>
        </div>
      </section>

      {/* =====================================
          SEARCH
      ====================================== */}

      <section className="gt-restaurants-search-section">
        <div className="gt-restaurants-search-shell">
          <div className="gt-restaurants-search-heading">
            <div>
              <span>
                EXPLORAR GASTRONOMÍA
              </span>

              <strong>
                Encuentra lugares alrededor de tu destino
              </strong>
            </div>

            {hasSearch && (
              <span className="gt-restaurants-radius-badge">
                <RadiusIcon />

                Radio de{' '}

                {formatRadius(
                  radius,
                )}
              </span>
            )}
          </div>

          <RestaurantSearchForm
            key={`${cityName}-${countryCode}-${type}-${cuisine}-${radius}-${hasWebsite}`}
            initialValues={{
              cityName,
              countryCode,
              type,
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

      <div className="gt-restaurants-content">

        {/* =====================================
            START
        ====================================== */}

        {!hasSearch && (
          <section className="gt-restaurants-start-state">
            <div className="gt-restaurants-start-copy">
              <span className="gt-restaurants-section-eyebrow">
                EXPLORA CON EL PALADAR
              </span>

              <h2>
                Cada ciudad tiene algo distinto que probar
              </h2>

              <p>
                Busca una ciudad para
                descubrir restaurantes,
                cafeterías y sabores
                disponibles en la zona.
              </p>
            </div>

            <div className="gt-restaurants-start-grid">
              <article className="gt-restaurant-start-card gt-food-card-one">
                <RestaurantIcon />

                <span>
                  Comer
                </span>

                <strong>
                  Restaurantes
                </strong>

                <p>
                  Descubre lugares para
                  disfrutar una comida en
                  tu destino.
                </p>
              </article>

              <article className="gt-restaurant-start-card gt-food-card-two">
                <CoffeeIcon />

                <span>
                  Pausa
                </span>

                <strong>
                  Cafeterías
                </strong>

                <p>
                  Encuentra cafés y espacios
                  para hacer una pausa.
                </p>
              </article>

              <article className="gt-restaurant-start-card gt-food-card-three">
                <FoodIcon />

                <span>
                  Descubrir
                </span>

                <strong>
                  Sabores
                </strong>

                <p>
                  Filtra por cocina y
                  encuentra algo diferente.
                </p>
              </article>
            </div>
          </section>
        )}

        {/* =====================================
            LOADING
        ====================================== */}

        {hasSearch &&
          isLoading && (
          <section className="gt-restaurants-loading">
            <div className="gt-restaurants-loading-heading">
              <div className="gt-restaurants-loader" />

              <div>
                <h2>
                  Explorando {cityName}
                </h2>

                <p>
                  Estamos buscando lugares
                  gastronómicos en la zona.
                </p>
              </div>
            </div>

            <div className="gt-restaurants-skeleton-grid">
              {Array.from({
                length: 6,
              }).map(
                (
                  _,
                  index,
                ) => (
                  <div
                    key={
                      index
                    }
                    className="gt-restaurant-skeleton"
                  >
                    <div className="gt-restaurant-skeleton-visual" />

                    <div className="gt-restaurant-skeleton-body">
                      <div />
                      <div />
                      <div />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {/* =====================================
            ERROR
        ====================================== */}

        {hasSearch &&
          !isLoading &&
          error && (
          <section className="gt-restaurants-error-state">
            <div>
              !
            </div>

            <h2>
              No pudimos completar la búsqueda
            </h2>

            <p>
              {error}
            </p>
          </section>
        )}

        {/* =====================================
            EMPTY
        ====================================== */}

        {hasSearch &&
          !isLoading &&
          !error &&
          restaurants.length ===
            0 && (
          <section className="gt-restaurants-error-state">
            <div className="gt-restaurants-empty-icon">
              <SearchIcon />
            </div>

            <h2>
              No encontramos lugares
            </h2>

            <p>
              Intenta aumentar el radio
              de búsqueda o quitar alguno
              de los filtros.
            </p>
          </section>
        )}

        {/* =====================================
            RESULTS
        ====================================== */}

        {hasSearch &&
          !isLoading &&
          !error &&
          restaurants.length >
            0 && (
          <>
            {/* =================================
                RESULTS HEADER
            ================================== */}

            <section className="gt-restaurants-results-heading">
              <div>
                <span className="gt-restaurants-section-eyebrow">
                  LUGARES ENCONTRADOS
                </span>

                <h2>
                  {meta?.cityName ||
                    cityName}

                  {meta?.countryName
                    ? `, ${meta.countryName}`
                    : countryCode
                      ? `, ${countryCode}`
                      : ''}
                </h2>

                <p>
                  {restaurants.length}{' '}

                  {restaurants.length ===
                  1
                    ? 'lugar para explorar'
                    : 'lugares para explorar'}
                </p>
              </div>

              <div className="gt-restaurants-results-meta">
                {meta?.stale && (
                  <span>
                    Datos en caché
                  </span>
                )}

                {meta?.matched !==
                  undefined && (
                  <small>
                    {
                      meta.matched
                    }{' '}
                    coincidencias antes del límite
                  </small>
                )}
              </div>
            </section>

            {/* =================================
                INSIGHTS
            ================================== */}

            <section className="gt-restaurants-insight-grid">
              <article>
                <RestaurantIcon />

                <div>
                  <span>
                    Resultados
                  </span>

                  <strong>
                    {
                      restaurants.length
                    }
                  </strong>
                </div>
              </article>

              <article>
                <GlobeIcon />

                <div>
                  <span>
                    Con sitio web
                  </span>

                  <strong>
                    {
                      websiteCount
                    }
                  </strong>
                </div>
              </article>

              <article>
                <MapIcon />

                <div>
                  <span>
                    Con mapa
                  </span>

                  <strong>
                    {
                      mapCount
                    }
                  </strong>
                </div>
              </article>

              <article>
                <FoodIcon />

                <div>
                  <span>
                    Cocinas detectadas
                  </span>

                  <strong>
                    {
                      cuisineCount
                    }
                  </strong>
                </div>
              </article>
            </section>

            {/* =================================
                TOOLBAR
            ================================== */}

            <section className="gt-restaurants-toolbar">
              <div className="gt-restaurants-sort">
                <button
                  type="button"
                  className={
                    sortOption ===
                    'recommended'
                      ? 'gt-restaurant-sort-button gt-restaurant-sort-active'
                      : 'gt-restaurant-sort-button'
                  }
                  onClick={() =>
                    setSortOption(
                      'recommended',
                    )
                  }
                >
                  Recomendados
                </button>

                <button
                  type="button"
                  className={
                    sortOption ===
                    'name'
                      ? 'gt-restaurant-sort-button gt-restaurant-sort-active'
                      : 'gt-restaurant-sort-button'
                  }
                  onClick={() =>
                    setSortOption(
                      'name',
                    )
                  }
                >
                  A — Z
                </button>

                <button
                  type="button"
                  className={
                    sortOption ===
                    'cuisine'
                      ? 'gt-restaurant-sort-button gt-restaurant-sort-active'
                      : 'gt-restaurant-sort-button'
                  }
                  onClick={() =>
                    setSortOption(
                      'cuisine',
                    )
                  }
                >
                  Más información gastronómica
                </button>
              </div>

              <span>
                {
                  sortedRestaurants.length
                }{' '}
                resultados visibles
              </span>
            </section>

            {/* =================================
                RESTAURANT GRID
            ================================== */}

            <section className="gt-restaurants-grid">
              {sortedRestaurants.map(
                (
                  restaurant,
                  index,
                ) => (
                <RestaurantCard
                  key={
                    restaurant.id
                  }
                  restaurant={
                    restaurant
                  }
                  index={
                    index
                  }
                />
                ),
              )}
            </section>

            {meta?.attribution && (
              <p className="gt-restaurants-attribution">
                Datos de ubicación:{' '}

                {
                  meta.attribution
                }
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/*
 * =========================================
 * RESTAURANT CARD
 * =========================================
 */

interface RestaurantCardProps {
  restaurant:
    RestaurantItem;

  index:
    number;
}

function RestaurantCard({
  restaurant,
  index,
}: RestaurantCardProps) {
  /*
   * cuisine puede venir undefined,
   * por eso siempre usamos un arreglo
   * seguro.
   */
  const cuisines =
    getRestaurantCuisines(
      restaurant,
    )
      .slice(
        0,
        3,
      )
      .map(
        formatCuisine,
      );

  const visualClasses = [
    'gt-restaurant-visual-blue',
    'gt-restaurant-visual-orange',
    'gt-restaurant-visual-purple',
    'gt-restaurant-visual-green',
  ];

  const visualClass =
    visualClasses[
      index %
        visualClasses.length
    ];

  const websiteUrl =
    restaurant
      .links
      ?.website;

  const mapsUrl =
    restaurant
      .links
      ?.maps;

  return (
    <article className="gt-restaurant-card">

      {/* =====================================
          VISUAL
      ====================================== */}

      <div className={`gt-restaurant-card-visual ${visualClass}`}>
        <div className="gt-restaurant-visual-pattern" />

        <RestaurantIcon />

        <span>
          {formatRestaurantType(
            restaurant.primaryType,
          )}
        </span>

        {websiteUrl && (
          <div className="gt-restaurant-web-badge">
            Sitio web
          </div>
        )}
      </div>

      {/* =====================================
          BODY
      ====================================== */}

      <div className="gt-restaurant-card-body">
        <div className="gt-restaurant-card-heading">
          <span>
            {formatRestaurantType(
              restaurant.primaryType,
            )}
          </span>

          <h3>
            {
              restaurant.name
            }
          </h3>
        </div>

        {/* CUISINE */}

        {cuisines.length >
          0 && (
          <div className="gt-restaurant-cuisine-chips">
            {cuisines.map(
              (
                cuisineName,
              ) => (
              <span
                key={
                  cuisineName
                }
              >
                {
                  cuisineName
                }
              </span>
              ),
            )}
          </div>
        )}

        {/* ADDRESS */}

        <div className="gt-restaurant-address">
          <LocationIcon />

          <span>
            {restaurant.address ||
              'Ubicación disponible en el mapa'}
          </span>
        </div>

        <div className="gt-restaurant-card-spacer" />

        {/* ACTIONS */}

        <div className="gt-restaurant-card-actions">
          <Link
            to={`/restaurants/${restaurant.id}`}
            className="gt-restaurant-detail-button"
          >
            Ver detalles

            <ArrowIcon />
          </Link>

          {mapsUrl && (
            <a
              href={
                mapsUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="gt-restaurant-icon-button"
              aria-label="Ver en mapa"
            >
              <MapIcon />
            </a>
          )}

          {websiteUrl && (
            <a
              href={
                websiteUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="gt-restaurant-icon-button"
              aria-label="Abrir sitio web"
            >
              <ExternalIcon />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================
 * ICONS
 * =========================================
 */

function RestaurantIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10" />

      <path d="M17 3c-2 2-3 5-3 8 0 2 1 3 3 3v7M17 3v11" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 8h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z" />

      <path d="M16 10h2a2 2 0 0 1 0 4h-2" />

      <path d="M8 3v2M12 3v2" />
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

function RadiusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <circle
        cx="12"
        cy="12"
        r="8"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m16.5 16.5 4 4" />
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

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default RestaurantsPage;
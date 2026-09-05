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

import CarSearchForm from '../components/cars/CarSearchForm';

import type {
  CarSearchValues,
} from '../components/cars/CarSearchForm';

import {
  searchCars,
} from '../services/cars.service';

type CarItem =
  Awaited<
    ReturnType<
      typeof searchCars
    >
  >['data'][number];

type CarMeta =
  Awaited<
    ReturnType<
      typeof searchCars
    >
  >['meta'];

type CarSortOption =
  | 'recommended'
  | 'name'
  | 'information';

/*
 * =========================================
 * HELPERS
 * =========================================
 */

function isCarType(
  value: string,
): value is 'car_rental' | 'car_sharing' {
  return (
    value ===
      'car_rental' ||
    value ===
      'car_sharing'
  );
}

function formatCarType(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return 'Movilidad';
  }

  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /_/g,
        ' ',
      );

  if (
    normalized ===
    'car rental'
  ) {
    return 'Rent a Car';
  }

  if (
    normalized ===
    'car sharing'
  ) {
    return 'Car sharing';
  }

  return value;
}

function formatDistance(
  meters:
    number,
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

function normalize(
  value:
    string,
) {
  return value
    .trim()
    .toLowerCase();
}

function getCarTypes(
  car:
    CarItem,
) {
  return (
    car.types ??
    []
  );
}

function informationScore(
  car:
    CarItem,
) {
  let score = 0;

  if (
    car.address
  ) {
    score += 1;
  }

  if (
    car.brand
  ) {
    score += 1;
  }

  if (
    car.links?.website
  ) {
    score += 2;
  }

  if (
    car.links?.maps
  ) {
    score += 1;
  }

  if (
    getCarTypes(
      car,
    ).length > 0
  ) {
    score += 1;
  }

  return score;
}

/*
 * =========================================
 * PAGE
 * =========================================
 */

function CarsPage() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const [
    cars,
    setCars,
  ] =
    useState<
      CarItem[]
    >([]);

  const [
    meta,
    setMeta,
  ] =
    useState<CarMeta | null>(
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
    useState<CarSortOption>(
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
    ) ?? '';

  const q =
    searchParams.get(
      'q',
    ) ?? '';

  const radius =
    Number(
      searchParams.get(
        'radius',
      ),
    ) || 8000;

  const hasWebsite =
    searchParams.get(
      'hasWebsite',
    ) === 'true';

  const type:
    CarSearchValues['type'] =
      isCarType(
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
   * LOAD CARS
   * =========================================
   */

  useEffect(() => {
    if (!hasSearch) {
      return;
    }

    let cancelled =
      false;

    const loadCars =
      async () => {
        try {
          setIsLoading(
            true,
          );

          setError(
            null,
          );

          const response =
            await searchCars(
              {
                cityName:
                  cityName.trim(),

                countryCode:
                  countryCode.trim() ||
                  undefined,

                radius,

                limit:
                  20,

                type:
                  type ||
                  undefined,

                q:
                  q.trim() ||
                  undefined,

                hasWebsite:
                  hasWebsite ||
                  undefined,
              },
            );

          if (
            cancelled
          ) {
            return;
          }

          setCars(
            response.data ??
              [],
          );

          setMeta(
            response.meta ??
              null,
          );

          setSortOption(
            'recommended',
          );
        } catch (
          requestError
        ) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            'Error al buscar Rent a Car:',
            requestError,
          );

          setCars(
            [],
          );

          setMeta(
            null,
          );

          setError(
            'No fue posible buscar opciones de movilidad en este momento.',
          );
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

    void loadCars();

    return () => {
      cancelled =
        true;
    };
  }, [
    cityName,
    countryCode,
    type,
    q,
    radius,
    hasWebsite,
    hasSearch,
  ]);

  /*
   * =========================================
   * SEARCH
   * =========================================
   */

  const handleSearch = (
    values:
      CarSearchValues,
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
      values.q
    ) {
      params.set(
        'q',
        values.q,
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
      `/cars?${params.toString()}`,
    );
  };

  /*
   * =========================================
   * SORT
   * =========================================
   */

  const sortedCars =
    useMemo(() => {
      const result =
        [
          ...cars,
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
            (
              a.name ??
              ''
            ).localeCompare(
              b.name ??
                '',
            ),
        );
      }

      if (
        sortOption ===
        'information'
      ) {
        result.sort(
          (
            a,
            b,
          ) =>
            informationScore(
              b,
            ) -
            informationScore(
              a,
            ),
        );
      }

      return result;
    }, [
      cars,
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
        cars.filter(
          (
            car,
          ) =>
            Boolean(
              car.links
                ?.website,
            ),
        ).length,

      [
        cars,
      ],
    );

  const mapCount =
    useMemo(
      () =>
        cars.filter(
          (
            car,
          ) =>
            Boolean(
              car.links
                ?.maps,
            ),
        ).length,

      [
        cars,
      ],
    );

  const brandCount =
    useMemo(() => {
      const brands =
        new Set<
          string
        >();

      cars.forEach(
        (
          car,
        ) => {
          const brand =
            car.brand
              ?.trim();

          if (
            brand
          ) {
            brands.add(
              brand.toLowerCase(),
            );
          }
        },
      );

      return brands.size;
    }, [
      cars,
    ]);

  const sharingCount =
    useMemo(
      () =>
        cars.filter(
          (
            car,
          ) =>
            getCarTypes(
              car,
            ).includes(
              'car_sharing',
            ) ||
            car.primaryType
              ?.toLowerCase() ===
              'car sharing',
        ).length,

      [
        cars,
      ],
    );

  /*
   * =========================================
   * RENDER
   * =========================================
   */

  return (
    <main className="gt-cars-page">

      {/* =====================================
          HERO
      ====================================== */}

      <section className="gt-cars-hero">
        <div className="gt-cars-hero-overlay" />

        <div className="gt-cars-hero-inner">
          <span className="gt-cars-eyebrow">
            GLOBALTOUR · RENT A CAR
          </span>

          <h1>
            {hasSearch
              ? `Muévete por ${cityName} a tu manera`
              : 'Tu destino. Tu ruta. Tu libertad.'}
          </h1>

          <p>
            Encuentra oficinas de alquiler y
            servicios de movilidad cerca de tu
            destino para seguir explorando a tu
            propio ritmo.
          </p>

          <div className="gt-cars-hero-pills">
            <span>
              <CarIcon />

              Rent a Car
            </span>

            <span>
              <ShareIcon />

              Car sharing
            </span>

            <span>
              <MapIcon />

              Ubicaciones reales
            </span>
          </div>
        </div>
      </section>

      {/* =====================================
          SEARCH
      ====================================== */}

      <section className="gt-cars-search-section">
        <div className="gt-cars-search-shell">
          <div className="gt-cars-search-heading">
            <div>
              <span>
                BUSCAR MOVILIDAD
              </span>

              <strong>
                Encuentra opciones cerca de tu destino
              </strong>
            </div>

            {hasSearch && (
              <span className="gt-cars-radius-badge">
                <RadiusIcon />

                Radio de{' '}

                {formatDistance(
                  meta?.radiusMeters ??
                    radius,
                )}
              </span>
            )}
          </div>

          <CarSearchForm
            key={`${cityName}-${countryCode}-${type}-${q}-${radius}-${hasWebsite}`}
            initialValues={{
              cityName,
              countryCode,
              type,
              q,
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

      <div className="gt-cars-content">

        {/* =====================================
            START
        ====================================== */}

        {!hasSearch && (
          <section className="gt-cars-start-state">
            <div className="gt-cars-start-copy">
              <span className="gt-cars-section-eyebrow">
                EXPLORA SIN LÍMITES
              </span>

              <h2>
                Encuentra una opción para seguir tu propio camino
              </h2>

              <p>
                Busca una ciudad y descubre oficinas
                de alquiler y alternativas de movilidad
                disponibles en sus alrededores.
              </p>
            </div>

            <div className="gt-cars-start-grid">
              <article>
                <div className="gt-cars-start-icon">
                  <CarIcon />
                </div>

                <span>
                  Libertad
                </span>

                <strong>
                  Rent a Car
                </strong>

                <p>
                  Encuentra empresas y oficinas
                  de alquiler cerca de tu destino.
                </p>
              </article>

              <article>
                <div className="gt-cars-start-icon">
                  <ShareIcon />
                </div>

                <span>
                  Alternativas
                </span>

                <strong>
                  Car sharing
                </strong>

                <p>
                  Explora servicios de movilidad
                  compartida cuando estén disponibles.
                </p>
              </article>

              <article>
                <div className="gt-cars-start-icon">
                  <MapIcon />
                </div>

                <span>
                  Ubicación
                </span>

                <strong>
                  Encuentra el punto
                </strong>

                <p>
                  Abre directamente la ubicación
                  del proveedor en el mapa.
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
          <section className="gt-cars-loading">
            <div className="gt-cars-loading-heading">
              <div className="gt-cars-loader" />

              <div>
                <h2>
                  Buscando movilidad en {cityName}
                </h2>

                <p>
                  Estamos explorando proveedores
                  alrededor de tu destino.
                </p>
              </div>
            </div>

            <div className="gt-cars-skeleton-list">
              {[1, 2, 3].map(
                (
                  item,
                ) => (
                  <div
                    className="gt-car-skeleton"
                    key={
                      item
                    }
                  >
                    <div />

                    <div>
                      <span />
                      <span />
                      <span />
                    </div>

                    <div />
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
          <section className="gt-cars-error-state">
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
          cars.length ===
            0 && (
          <section className="gt-cars-error-state">
            <div className="gt-cars-empty-icon">
              <CarIcon />
            </div>

            <h2>
              No encontramos opciones cerca
            </h2>

            <p>
              Intenta aumentar el radio,
              quitar filtros o buscar otra ciudad.
            </p>
          </section>
        )}

        {/* =====================================
            RESULTS
        ====================================== */}

        {hasSearch &&
          !isLoading &&
          !error &&
          cars.length >
            0 && (
          <>
            {/* HEADER */}

            <section className="gt-cars-results-heading">
              <div>
                <span className="gt-cars-section-eyebrow">
                  MOVILIDAD ENCONTRADA
                </span>

                <h2>
                  {meta?.cityName ??
                    cityName}

                  {meta?.countryName
                    ? `, ${meta.countryName}`
                    : countryCode
                      ? `, ${countryCode}`
                      : ''}
                </h2>

                <p>
                  Opciones encontradas dentro de
                  un radio de{' '}

                  {formatDistance(
                    meta?.radiusMeters ??
                      radius,
                  )}
                </p>
              </div>

              <div className="gt-cars-results-meta">
                {meta?.stale && (
                  <span>
                    Datos en caché
                  </span>
                )}

                <small>
                  {meta?.matched ??
                    cars.length}{' '}
                  coincidencias
                </small>
              </div>
            </section>

            {/* INSIGHTS */}

            <section className="gt-cars-insight-grid">
              <article>
                <CarIcon />

                <div>
                  <span>
                    Resultados
                  </span>

                  <strong>
                    {
                      cars.length
                    }
                  </strong>
                </div>
              </article>

              <article>
                <BuildingIcon />

                <div>
                  <span>
                    Marcas detectadas
                  </span>

                  <strong>
                    {
                      brandCount
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
            </section>

            {/* SHARING NOTICE */}

            {sharingCount >
              0 && (
              <section className="gt-cars-sharing-notice">
                <ShareIcon />

                <div>
                  <strong>
                    También encontramos car sharing
                  </strong>

                  <span>
                    {sharingCount}{' '}
                    {sharingCount ===
                    1
                      ? 'opción corresponde'
                      : 'opciones corresponden'}{' '}
                    a movilidad compartida.
                  </span>
                </div>
              </section>
            )}

            {/* TOOLBAR */}

            <section className="gt-cars-toolbar">
              <div className="gt-cars-sort">
                <button
                  type="button"
                  className={
                    sortOption ===
                    'recommended'
                      ? 'gt-car-sort-button gt-car-sort-active'
                      : 'gt-car-sort-button'
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
                      ? 'gt-car-sort-button gt-car-sort-active'
                      : 'gt-car-sort-button'
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
                    'information'
                      ? 'gt-car-sort-button gt-car-sort-active'
                      : 'gt-car-sort-button'
                  }
                  onClick={() =>
                    setSortOption(
                      'information',
                    )
                  }
                >
                  Más información
                </button>
              </div>

              <span>
                {
                  sortedCars.length
                }{' '}
                resultados visibles
              </span>
            </section>

            {/* RESULTS */}

            <section className="gt-cars-results-list">
              {sortedCars.map(
                (
                  car,
                  index,
                ) => (
                <CarCard
                  key={
                    car.id
                  }
                  car={
                    car
                  }
                  index={
                    index
                  }
                />
                ),
              )}
            </section>

            <div className="gt-cars-disclaimer">
              <InfoIcon />

              <div>
                <p>
                  GlobalTour muestra ubicaciones de
                  servicios de alquiler y movilidad.
                  Los precios, disponibilidad y reservas
                  se consultan directamente con el proveedor.
                </p>

                <span>
                  {meta?.attribution ??
                    '© OpenStreetMap contributors'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/*
 * =========================================
 * CARD
 * =========================================
 */

interface CarCardProps {
  car:
    CarItem;

  index:
    number;
}

function CarCard({
  car,
  index,
}: CarCardProps) {
  const brand =
    car.brand?.trim() ??
    '';

  const name =
    car.name?.trim() ||
    'Servicio de movilidad';

  const showBrand =
    Boolean(
      brand,
    ) &&
    normalize(
      brand,
    ) !==
      normalize(
        name,
      );

  const mapsUrl =
    car.links?.maps ??
    null;

  const websiteUrl =
    car.links?.website ??
    null;

  const address =
    car.address?.trim() ||
    'Dirección no disponible';

  const typeLabel =
    formatCarType(
      car.primaryType,
    );

  const visualClasses = [
    'gt-car-visual-blue',
    'gt-car-visual-teal',
    'gt-car-visual-indigo',
    'gt-car-visual-cyan',
  ];

  const visualClass =
    visualClasses[
      index %
        visualClasses.length
    ];

  return (
    <article className="gt-car-result-card">

      {/* VISUAL */}

      <div className={`gt-car-result-visual ${visualClass}`}>
        <div className="gt-car-visual-road">
          <span />
          <span />
          <span />
        </div>

        <CarIcon />

        <span>
          {typeLabel}
        </span>
      </div>

      {/* CONTENT */}

      <div className="gt-car-result-content">
        <div className="gt-car-result-copy">
          <span className="gt-car-result-type">
            {typeLabel}
          </span>

          <h3>
            {name}
          </h3>

          {showBrand && (
            <p className="gt-car-result-brand">
              <BuildingIcon />

              {brand}
            </p>
          )}

          <div className="gt-car-result-location">
            <LocationIcon />

            <span>
              {address}
            </span>
          </div>

          <div className="gt-car-result-tags">
            {websiteUrl && (
              <span>
                <GlobeIcon />

                Sitio web
              </span>
            )}

            {mapsUrl && (
              <span>
                <MapIcon />

                Ubicación
              </span>
            )}

            {getCarTypes(
              car,
            ).map(
              (
                carType,
              ) => (
              <span
                key={
                  carType
                }
              >
                {formatCarType(
                  carType,
                )}
              </span>
              ),
            )}
          </div>
        </div>

        {/* ACTIONS */}

        <div className="gt-car-result-actions">
          <span className="gt-car-result-action-label">
            Más información
          </span>

          <strong>
            Consulta el proveedor
          </strong>

          <Link
            to={`/cars/${car.id}`}
            className="gt-car-detail-button"
          >
            Ver detalles

            <ArrowIcon />
          </Link>

          <div className="gt-car-external-actions">
            {mapsUrl && (
              <a
                href={
                  mapsUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver ubicación en el mapa"
              >
                <MapIcon />

                Mapa
              </a>
            )}

            {websiteUrl && (
              <a
                href={
                  websiteUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir sitio web"
              >
                <ExternalIcon />

                Web
              </a>
            )}
          </div>
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

function CarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 17h14l1-5-2-5H6l-2 5 1 5Z" />

      <path d="M7 17v2M17 17v2M4 12h16" />

      <circle
        cx="8"
        cy="14"
        r="1"
      />

      <circle
        cx="16"
        cy="14"
        r="1"
      />
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

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 21V5h10v16M14 9h6v12M2 21h20" />

      <path d="M8 9h2M8 13h2M8 17h2M17 13h1M17 17h1" />
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

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="6"
        cy="12"
        r="3"
      />

      <circle
        cx="18"
        cy="6"
        r="3"
      />

      <circle
        cx="18"
        cy="18"
        r="3"
      />

      <path d="m9 10.5 6-3M9 13.5l6 3" />
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

      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export default CarsPage;
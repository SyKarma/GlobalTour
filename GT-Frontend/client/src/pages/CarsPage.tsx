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

import {
  useTranslation,
} from 'react-i18next';

import i18n from '../i18n';

import CarSearchForm from '../components/cars/CarSearchForm';

import type {
  CarSearchValues,
} from '../components/cars/CarSearchForm';

import WishlistHeart from '../components/wishlist/WishlistHeart';

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

function isCarType(
  value: string,
): value is
  | 'car_rental'
  | 'car_sharing' {
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
    return i18n.t(
      'cars.common.types.mobility',
    );
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
    return i18n.t(
      'cars.common.types.carRental',
    );
  }

  if (
    normalized ===
    'car sharing'
  ) {
    return i18n.t(
      'cars.common.types.carSharing',
    );
  }

  return value;
}

function formatDistance(
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

function normalize(
  value: string,
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

function CarsPage() {
  const {
    t,
  } =
    useTranslation();

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
    useState<
      CarMeta | null
    >(null);

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
    useState<
      CarSortOption
    >(
      'recommended',
    );

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
            'Error searching rental cars:',
            requestError,
          );

          setCars(
            [],
          );

          setMeta(
            null,
          );

          setError(
            'cars.list.errors.loadMessage',
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

  return (
    <main className="gt-cars-page">

      <section className="gt-cars-hero">

        <div className="gt-cars-hero-overlay" />

        <div className="gt-cars-hero-inner">

          <span className="gt-cars-eyebrow">
            {t(
              'cars.list.hero.eyebrow',
            )}
          </span>

          <h1>
            {hasSearch
              ? t(
                  'cars.list.hero.cityTitle',
                  {
                    city:
                      cityName,
                  },
                )
              : t(
                  'cars.list.hero.title',
                )}
          </h1>

          <p>
            {t(
              'cars.list.hero.description',
            )}
          </p>

          <div className="gt-cars-hero-pills">

            <span>
              <CarIcon />

              {t(
                'cars.common.types.carRental',
              )}
            </span>

            <span>
              <ShareIcon />

              {t(
                'cars.common.types.carSharing',
              )}
            </span>

            <span>
              <MapIcon />

              {t(
                'cars.list.hero.realLocations',
              )}
            </span>

          </div>

        </div>

      </section>

      <section className="gt-cars-search-section">

        <div className="gt-cars-search-shell">

          <div className="gt-cars-search-heading">

            <div>

              <span>
                {t(
                  'cars.list.search.eyebrow',
                )}
              </span>

              <strong>
                {t(
                  'cars.list.search.title',
                )}
              </strong>

            </div>

            {hasSearch && (
              <span className="gt-cars-radius-badge">

                <RadiusIcon />

                {t(
                  'cars.list.search.radius',
                )}{' '}

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

        {!hasSearch && (
          <section className="gt-cars-start-state">

            <div className="gt-cars-start-copy">

              <span className="gt-cars-section-eyebrow">
                {t(
                  'cars.list.start.eyebrow',
                )}
              </span>

              <h2>
                {t(
                  'cars.list.start.title',
                )}
              </h2>

              <p>
                {t(
                  'cars.list.start.description',
                )}
              </p>

            </div>

            <div className="gt-cars-start-grid">

              <article>

                <div className="gt-cars-start-icon">
                  <CarIcon />
                </div>

                <span>
                  {t(
                    'cars.list.start.cards.rental.eyebrow',
                  )}
                </span>

                <strong>
                  {t(
                    'cars.common.types.carRental',
                  )}
                </strong>

                <p>
                  {t(
                    'cars.list.start.cards.rental.description',
                  )}
                </p>

              </article>

              <article>

                <div className="gt-cars-start-icon">
                  <ShareIcon />
                </div>

                <span>
                  {t(
                    'cars.list.start.cards.sharing.eyebrow',
                  )}
                </span>

                <strong>
                  {t(
                    'cars.common.types.carSharing',
                  )}
                </strong>

                <p>
                  {t(
                    'cars.list.start.cards.sharing.description',
                  )}
                </p>

              </article>

              <article>

                <div className="gt-cars-start-icon">
                  <MapIcon />
                </div>

                <span>
                  {t(
                    'cars.list.start.cards.location.eyebrow',
                  )}
                </span>

                <strong>
                  {t(
                    'cars.list.start.cards.location.title',
                  )}
                </strong>

                <p>
                  {t(
                    'cars.list.start.cards.location.description',
                  )}
                </p>

              </article>

            </div>

          </section>
        )}

        {hasSearch &&
          isLoading && (
          <section className="gt-cars-loading">

            <div className="gt-cars-loading-heading">

              <div className="gt-cars-loader" />

              <div>

                <h2>
                  {t(
                    'cars.list.loading.title',
                    {
                      city:
                        cityName,
                    },
                  )}
                </h2>

                <p>
                  {t(
                    'cars.list.loading.description',
                  )}
                </p>

              </div>

            </div>

            <div className="gt-cars-skeleton-list">

              {[
                1,
                2,
                3,
              ].map(
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

        {hasSearch &&
          !isLoading &&
          error && (
          <section className="gt-cars-error-state">

            <div>
              !
            </div>

            <h2>
              {t(
                'cars.list.errors.title',
              )}
            </h2>

            <p>
              {t(
                error,
              )}
            </p>

          </section>
        )}

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
              {t(
                'cars.list.empty.title',
              )}
            </h2>

            <p>
              {t(
                'cars.list.empty.description',
              )}
            </p>

          </section>
        )}

        {hasSearch &&
          !isLoading &&
          !error &&
          cars.length >
            0 && (
          <>

            <section className="gt-cars-results-heading">

              <div>

                <span className="gt-cars-section-eyebrow">
                  {t(
                    'cars.list.results.eyebrow',
                  )}
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
                  {t(
                    'cars.list.results.radiusDescription',
                    {
                      radius:
                        formatDistance(
                          meta?.radiusMeters ??
                            radius,
                        ),
                    },
                  )}
                </p>

              </div>

              <div className="gt-cars-results-meta">

                {meta?.stale && (
                  <span>
                    {t(
                      'cars.list.results.cached',
                    )}
                  </span>
                )}

                <small>
                  {meta?.matched ??
                    cars.length}{' '}

                  {t(
                    'cars.list.results.matches',
                  )}
                </small>

              </div>

            </section>

            <section className="gt-cars-insight-grid">

              <article>

                <CarIcon />

                <div>
                  <span>
                    {t(
                      'cars.list.insights.results',
                    )}
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
                    {t(
                      'cars.list.insights.brands',
                    )}
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
                    {t(
                      'cars.list.insights.website',
                    )}
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
                    {t(
                      'cars.list.insights.map',
                    )}
                  </span>

                  <strong>
                    {
                      mapCount
                    }
                  </strong>
                </div>

              </article>

            </section>

            {sharingCount >
              0 && (
              <section className="gt-cars-sharing-notice">

                <ShareIcon />

                <div>

                  <strong>
                    {t(
                      'cars.list.sharing.title',
                    )}
                  </strong>

                  <span>
                    {sharingCount}{' '}

                    {sharingCount ===
                    1
                      ? t(
                          'cars.list.sharing.one',
                        )
                      : t(
                          'cars.list.sharing.many',
                        )}
                  </span>

                </div>

              </section>
            )}

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
                  {t(
                    'cars.list.sort.recommended',
                  )}
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
                  {t(
                    'cars.list.sort.information',
                  )}
                </button>

              </div>

              <span>
                {
                  sortedCars.length
                }{' '}

                {t(
                  'cars.list.results.visibleResults',
                )}
              </span>

            </section>

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
                  {t(
                    'cars.list.disclaimer.text',
                  )}
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
  const {
    t,
  } =
    useTranslation();

  const brand =
    car.brand?.trim() ??
    '';

  const name =
    car.name?.trim() ||
    t(
      'cars.list.card.serviceFallback',
    );

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
    t(
      'cars.list.card.addressUnavailable',
    );

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

      <div className={`gt-car-result-visual ${visualClass}`}>

        <WishlistHeart
          item={{
            key:
              `car:${car.id}`,

            type:
              'car',

            title:
              name,

            subtitle:
              address,

            href:
              `/cars/${car.id}`,

            metadata: {
              tipo:
                typeLabel,

              marca:
                showBrand
                  ? brand
                  : null,

              sitioWeb:
                Boolean(
                  websiteUrl,
                ),

              mapa:
                Boolean(
                  mapsUrl,
                ),
            },
          }}
        />

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

                {t(
                  'cars.list.card.website',
                )}
              </span>
            )}

            {mapsUrl && (
              <span>
                <MapIcon />

                {t(
                  'cars.list.card.location',
                )}
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

        <div className="gt-car-result-actions">

          <span className="gt-car-result-action-label">
            {t(
              'cars.list.card.moreInformation',
            )}
          </span>

          <strong>
            {t(
              'cars.list.card.checkProvider',
            )}
          </strong>

          <Link
            to={`/cars/${car.id}`}
            className="gt-car-detail-button"
          >
            {t(
              'cars.list.card.viewDetails',
            )}

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
                aria-label={t(
                  'cars.list.card.viewMapAria',
                )}
              >
                <MapIcon />

                {t(
                  'cars.list.card.map',
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
                aria-label={t(
                  'cars.list.card.openWebsiteAria',
                )}
              >
                <ExternalIcon />

                {t(
                  'cars.list.card.web',
                )}
              </a>
            )}

          </div>

        </div>

      </div>

    </article>
  );
}

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
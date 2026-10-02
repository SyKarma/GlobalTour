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
  getCarById,
} from '../services/cars.service';

import type {
  CarDetail,
} from '../types/car.types';

function CarDetailPage() {
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
    car,
    setCar,
  ] =
    useState<
      CarDetail | null
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
        '/cars',
      );
    };

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled =
      false;

    const loadCar =
      async () => {
        try {
          setIsLoading(
            true,
          );

          setError(
            null,
          );

          const response =
            await getCarById(
              id,
            );

          if (
            cancelled
          ) {
            return;
          }

          setCar(
            response.data,
          );

          setError(
            null,
          );
        } catch (
          requestError
        ) {
          console.error(
            'Error loading rental car location:',
            requestError,
          );

          if (
            !cancelled
          ) {
            setCar(
              null,
            );

            setError(
              'cars.detail.errors.loadMessage',
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

    void loadCar();

    return () => {
      cancelled =
        true;
    };
  }, [
    id,
  ]);

  if (!id) {
    return (
      <main className="gt-car-detail-page">

        <section className="gt-detail-error-state">

          <div className="gt-detail-error-icon gt-detail-error-teal">
            <CarIcon />
          </div>

          <span>
            {t(
              'cars.detail.common.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'cars.detail.errors.title',
            )}
          </h1>

          <p>
            {t(
              'cars.detail.errors.missingId',
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
              'cars.detail.common.back',
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
      <main className="gt-car-detail-page">

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
    !car
  ) {
    return (
      <main className="gt-car-detail-page">

        <section className="gt-detail-error-state">

          <div className="gt-detail-error-icon gt-detail-error-teal">
            <CarIcon />
          </div>

          <span>
            {t(
              'cars.detail.common.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'cars.detail.errors.title',
            )}
          </h1>

          <p>
            {error
              ? t(
                  error,
                )
              : t(
                  'cars.detail.errors.unavailable',
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
              'cars.detail.common.back',
            )}
          </button>

        </section>

      </main>
    );
  }

  const name =
    car.name?.trim() ||
    t(
      'cars.detail.common.serviceFallback',
    );

  const brand =
    car.brand?.trim() ??
    '';

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

  const hours =
    car.weekdayHours ??
    [];

  const types =
    car.types ??
    [];

  const mapsUrl =
    car.links?.maps ??
    null;

  const websiteUrl =
    car.links?.website ??
    null;

  const hasContact =
    Boolean(
      car.phone,
    ) ||
    Boolean(
      car.internationalPhone,
    );

  const hasCoordinates =
    typeof car.latitude ===
      'number' &&
    typeof car.longitude ===
      'number';

  return (
    <main className="gt-car-detail-page">

      <section className="gt-car-detail-hero">

        <div className="gt-car-detail-road">
          <span />
          <span />
          <span />
        </div>

        <div className="gt-car-detail-hero-inner">

          <button
            type="button"
            className="gt-detail-back-button gt-detail-back-light"
            onClick={
              handleBack
            }
          >
            <ArrowLeftIcon />

            {t(
              'cars.detail.common.back',
            )}
          </button>

          <div className="gt-car-detail-hero-grid">

            <div>

              <span className="gt-car-detail-eyebrow">
                {t(
                  'cars.detail.hero.eyebrow',
                )}
              </span>

              <div className="gt-car-detail-icon">
                <CarIcon />
              </div>

              <span className="gt-car-detail-type">
                {formatCarType(
                  car.primaryType,
                )}
              </span>

              <h1>
                {name}
              </h1>

              {showBrand && (
                <p className="gt-car-detail-brand">

                  <BuildingIcon />

                  {brand}

                </p>
              )}

              <p className="gt-car-detail-address">

                <LocationIcon />

                {car.address ??
                  t(
                    'cars.detail.hero.addressUnavailable',
                  )}
              </p>

            </div>

            <div className="gt-car-detail-hero-actions">

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
                    'cars.detail.hero.viewMap',
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
                    'cars.detail.hero.website',
                  )}
                </a>
              )}

              {car.phone && (
                <a
                  href={`tel:${car.phone}`}
                >
                  <PhoneIcon />

                  {t(
                    'cars.detail.hero.call',
                  )}
                </a>
              )}

            </div>

          </div>

        </div>

      </section>

      <div className="gt-detail-content-shell">

        <section className="gt-car-detail-layout">

          <div className="gt-detail-main-column">

            {car.editorialSummary && (
              <article className="gt-detail-panel">

                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-teal">
                  {t(
                    'cars.detail.about.eyebrow',
                  )}
                </span>

                <h2>
                  {t(
                    'cars.detail.about.title',
                  )}
                </h2>

                <p className="gt-detail-description">
                  {
                    car.editorialSummary
                  }
                </p>

              </article>
            )}

            {hours.length >
              0 && (
              <article className="gt-detail-panel">

                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-teal">
                  {t(
                    'cars.detail.hours.eyebrow',
                  )}
                </span>

                <h2>
                  {t(
                    'cars.detail.hours.title',
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
                          {item}
                        </span>
                      </div>
                    ),
                  )}

                </div>

              </article>
            )}

            <article className="gt-car-provider-notice">

              <InfoIcon />

              <div>

                <span>
                  {t(
                    'cars.detail.notice.eyebrow',
                  )}
                </span>

                <h2>
                  {t(
                    'cars.detail.notice.title',
                  )}
                </h2>

                <p>
                  {t(
                    'cars.detail.notice.description',
                  )}
                </p>

              </div>

            </article>

          </div>

          <aside className="gt-detail-sidebar">

            <article className="gt-detail-panel">

              <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-teal">
                {t(
                  'cars.detail.info.eyebrow',
                )}
              </span>

              <h2>
                {t(
                  'cars.detail.info.title',
                )}
              </h2>

              <div className="gt-detail-info-list">

                <DetailInfo
                  label={t(
                    'cars.detail.info.service',
                  )}
                  value={formatCarType(
                    car.primaryType,
                  )}
                />

                {brand && (
                  <DetailInfo
                    label={t(
                      'cars.detail.info.brand',
                    )}
                    value={
                      brand
                    }
                  />
                )}

                <DetailInfo
                  label={t(
                    'cars.detail.info.address',
                  )}
                  value={
                    car.address ??
                    t(
                      'cars.detail.info.unavailable',
                    )
                  }
                />

                {types.length >
                  0 && (
                  <DetailInfo
                    label={t(
                      'cars.detail.info.classification',
                    )}
                    value={types
                      .map(
                        formatCarType,
                      )
                      .join(
                        ', ',
                      )}
                  />
                )}

                {hasCoordinates && (
                  <DetailInfo
                    label={t(
                      'cars.detail.info.coordinates',
                    )}
                    value={`${car.latitude}, ${car.longitude}`}
                  />
                )}

              </div>

            </article>

            {hasContact && (
              <article className="gt-detail-panel">

                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-teal">
                  {t(
                    'cars.detail.contact.eyebrow',
                  )}
                </span>

                <h2>
                  {t(
                    'cars.detail.contact.title',
                  )}
                </h2>

                <div className="gt-detail-contact-list">

                  {car.phone && (
                    <a
                      href={`tel:${car.phone}`}
                    >
                      <PhoneIcon />

                      <div>

                        <span>
                          {t(
                            'cars.detail.contact.phone',
                          )}
                        </span>

                        <strong>
                          {
                            car.phone
                          }
                        </strong>

                      </div>

                    </a>
                  )}

                  {car.internationalPhone &&
                    car.internationalPhone !==
                      car.phone && (
                    <a
                      href={`tel:${car.internationalPhone}`}
                    >
                      <PhoneIcon />

                      <div>

                        <span>
                          {t(
                            'cars.detail.contact.internationalPhone',
                          )}
                        </span>

                        <strong>
                          {
                            car.internationalPhone
                          }
                        </strong>

                      </div>

                    </a>
                  )}

                </div>

              </article>
            )}

            <article className="gt-detail-source-card gt-detail-source-teal">

              <GlobeIcon />

              <div>

                <span>
                  {t(
                    'cars.detail.source.label',
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

function normalize(
  value:
    string,
) {
  return value
    .trim()
    .toLowerCase();
}

function CarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 17h14l1-5-2-5H6l-2 5 1 5ZM7 17v2M17 17v2M4 12h16" />

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

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 21V5h10v16M14 9h6v12M2 21h20M8 9h2M8 13h2M8 17h2" />
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

export default CarDetailPage;
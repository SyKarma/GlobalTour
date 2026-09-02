import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  getCarById,
} from '../services/cars.service';

import type {
  CarDetail,
} from '../types/car.types';

function CarDetailPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const [car, setCar] =
    useState<CarDetail | null>(
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

    const loadCar = async () => {
      try {
        const response =
          await getCarById(id);

        if (!cancelled) {
          setCar(response.data);
          setError(null);
        }
      } catch (requestError) {
        console.error(
          'Error al cargar Rent a Car:',
          requestError,
        );

        if (!cancelled) {
          setError(
            'No fue posible cargar la información de esta ubicación.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCar();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <main className="car-detail-page">
        <div className="car-detail-container">
          <CarDetailLoading />
        </div>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="car-detail-page">
        <div className="car-detail-container">
          <div className="car-detail-error">
            <div className="car-detail-error-icon">
              <CarIcon />
            </div>

            <h1>
              No encontramos esta ubicación
            </h1>

            <p>
              {error ??
                'La ubicación solicitada no está disponible.'}
            </p>

            <Link
              to="/cars"
              className="car-detail-primary-action"
            >
              Volver a Rent a Car
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const hasContact =
    Boolean(car.phone) ||
    Boolean(car.internationalPhone);

  const hasHours =
    car.weekdayHours.length > 0;

  const showBrand =
    car.brand &&
    normalize(car.brand) !==
      normalize(car.name);

  return (
    <main className="car-detail-page">
      <div className="car-detail-container">
        <Link
          to="/cars"
          className="car-detail-back"
        >
          <ArrowLeftIcon />

          Volver a Rent a Car
        </Link>

        <section className="car-detail-hero">
          <div className="car-detail-hero-main">
            <div className="car-detail-icon">
              <CarIcon />
            </div>

            <div>
              <span className="car-detail-type">
                {formatCarType(
                  car.primaryType,
                )}
              </span>

              <h1>
                {car.name}
              </h1>

              {showBrand && (
                <p className="car-detail-brand">
                  {car.brand}
                </p>
              )}

              <div className="car-detail-location">
                <LocationIcon />

                <span>
                  {car.address ??
                    'Dirección no disponible'}
                </span>
              </div>
            </div>
          </div>

          <div className="car-detail-actions">
            {car.links.maps && (
              <a
                href={car.links.maps}
                target="_blank"
                rel="noreferrer"
                className="car-detail-secondary-action"
              >
                <MapIcon />

                Ver mapa
              </a>
            )}

            {car.links.website && (
              <a
                href={car.links.website}
                target="_blank"
                rel="noreferrer"
                className="car-detail-primary-action"
              >
                Sitio web

                <ExternalIcon />
              </a>
            )}
          </div>
        </section>

        <section className="car-detail-grid">
          <div className="car-detail-main-column">
            {car.editorialSummary && (
              <article className="car-detail-panel">
                <div className="car-detail-panel-heading">
                  <InfoIcon />

                  <div>
                    <h2>
                      Acerca de esta ubicación
                    </h2>

                    <p>
                      Información disponible
                      del proveedor.
                    </p>
                  </div>
                </div>

                <div className="car-detail-description">
                  {car.editorialSummary}
                </div>
              </article>
            )}

            {hasHours && (
              <article className="car-detail-panel">
                <div className="car-detail-panel-heading">
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

                <div className="car-hours-list">
                  {car.weekdayHours.map(
                    (hours, index) => (
                      <div
                        key={`${hours}-${index}`}
                        className="car-hours-item"
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

            {!car.editorialSummary &&
              !hasHours && (
                <article className="car-detail-panel car-detail-no-info">
                  <div className="car-detail-no-info-icon">
                    <InfoIcon />
                  </div>

                  <h2>
                    Información limitada
                  </h2>

                  <p>
                    OpenStreetMap todavía no
                    tiene descripción u horario
                    adicional para esta
                    ubicación.
                  </p>
                </article>
              )}
          </div>

          <aside className="car-detail-sidebar">
            <article className="car-detail-panel">
              <h2>
                Información
              </h2>

              <div className="car-detail-info-list">
                <DetailInfo
                  label="Tipo"
                  value={formatCarType(
                    car.primaryType,
                  )}
                />

                {car.brand && (
                  <DetailInfo
                    label="Empresa / Marca"
                    value={car.brand}
                  />
                )}

                <DetailInfo
                  label="Dirección"
                  value={
                    car.address ??
                    'No disponible'
                  }
                />

                {car.latitude !== null &&
                  car.longitude !== null && (
                    <DetailInfo
                      label="Coordenadas"
                      value={`${car.latitude}, ${car.longitude}`}
                    />
                  )}
              </div>
            </article>

            {hasContact && (
              <article className="car-detail-panel">
                <h2>
                  Contacto
                </h2>

                <div className="car-detail-contact-list">
                  {car.phone && (
                    <a
                      href={`tel:${car.phone}`}
                      className="car-detail-contact"
                    >
                      <PhoneIcon />

                      <div>
                        <span>
                          Teléfono
                        </span>

                        <strong>
                          {car.phone}
                        </strong>
                      </div>
                    </a>
                  )}

                  {car.internationalPhone &&
                    car.internationalPhone !==
                      car.phone && (
                      <a
                        href={`tel:${car.internationalPhone}`}
                        className="car-detail-contact"
                      >
                        <PhoneIcon />

                        <div>
                          <span>
                            Teléfono internacional
                          </span>

                          <strong>
                            {car.internationalPhone}
                          </strong>
                        </div>
                      </a>
                    )}
                </div>
              </article>
            )}

            <article className="car-detail-warning">
              <InfoIcon />

              <div>
                <strong>
                  Información de ubicación
                </strong>

                <p>
                  GlobalTour muestra puntos de
                  alquiler y movilidad. Los
                  precios, disponibilidad y
                  reservas deben consultarse
                  directamente con el proveedor.
                </p>
              </div>
            </article>

            <article className="car-detail-source">
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
    <div className="car-detail-info-item">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function CarDetailLoading() {
  return (
    <div className="car-detail-loading">
      <div className="car-detail-loading-header">
        <div className="car-detail-loading-square" />

        <div>
          <div className="car-detail-loading-line car-detail-loading-small" />

          <div className="car-detail-loading-line car-detail-loading-title" />

          <div className="car-detail-loading-line car-detail-loading-medium" />
        </div>
      </div>

      <div className="car-detail-loading-grid">
        <div className="car-detail-loading-card" />

        <div className="car-detail-loading-card" />
      </div>
    </div>
  );
}

function formatCarType(
  value: string | null,
) {
  if (!value) {
    return 'Movilidad';
  }

  const normalized =
    value.toLowerCase();

  if (
    normalized === 'car rental' ||
    normalized === 'car_rental'
  ) {
    return 'Rent a Car';
  }

  if (
    normalized === 'car sharing' ||
    normalized === 'car_sharing'
  ) {
    return 'Car sharing';
  }

  return value;
}

function normalize(
  value: string,
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

      <path d="M12 11v6" />

      <path d="M12 7h.01" />
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

export default CarDetailPage;
import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getCarById,
} from '../services/cars.service';

import type {
  CarDetail,
} from '../types/car.types';

function CarDetailPage() {
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
    useState<CarDetail | null>(
      null,
    );

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
    useState<string | null>(
      null,
    );

  /*
   * =========================================
   * BACK
   * =========================================
   */

  const handleBack = () => {
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

  /*
   * =========================================
   * LOAD CAR
   * =========================================
   */

  useEffect(() => {
    /*
     * El ID inexistente se resuelve
     * desde el render, no modificando
     * estado sincrónicamente aquí.
     */
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
            'Error al cargar Rent a Car:',
            requestError,
          );

          if (
            !cancelled
          ) {
            setCar(
              null,
            );

            setError(
              'No fue posible cargar la información de esta ubicación.',
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

  /*
   * =========================================
   * INVALID ID
   * =========================================
   */

  if (!id) {
    return (
      <main className="gt-car-detail-page">
        <section className="gt-detail-error-state">
          <div className="gt-detail-error-icon gt-detail-error-teal">
            <CarIcon />
          </div>

          <span>
            RENT A CAR
          </span>

          <h1>
            No encontramos esta ubicación
          </h1>

          <p>
            No se encontró el identificador de esta ubicación.
          </p>

          <button
            type="button"
            onClick={
              handleBack
            }
          >
            <ArrowLeftIcon />

            Volver a resultados
          </button>
        </section>
      </main>
    );
  }

  /*
   * =========================================
   * LOADING
   * =========================================
   */

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

  /*
   * =========================================
   * ERROR
   * =========================================
   */

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
            RENT A CAR
          </span>

          <h1>
            No encontramos esta ubicación
          </h1>

          <p>
            {error ??
              'La ubicación solicitada no está disponible.'}
          </p>

          <button
            type="button"
            onClick={
              handleBack
            }
          >
            <ArrowLeftIcon />

            Volver a resultados
          </button>
        </section>
      </main>
    );
  }

  /*
   * =========================================
   * SAFE DATA
   * =========================================
   */

  const name =
    car.name?.trim() ||
    'Servicio de movilidad';

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

      {/* =====================================
          HERO
      ====================================== */}

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

            Volver a resultados
          </button>

          <div className="gt-car-detail-hero-grid">
            <div>
              <span className="gt-car-detail-eyebrow">
                GLOBALTOUR · MOVILIDAD
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
                  'Dirección no disponible'}
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

                  Ver mapa
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

                  Sitio web
                </a>
              )}

              {car.phone && (
                <a
                  href={`tel:${car.phone}`}
                >
                  <PhoneIcon />

                  Llamar
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          BODY
      ====================================== */}

      <div className="gt-detail-content-shell">
        <section className="gt-car-detail-layout">

          {/* MAIN */}

          <div className="gt-detail-main-column">
            {car.editorialSummary && (
              <article className="gt-detail-panel">
                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-teal">
                  EL PROVEEDOR
                </span>

                <h2>
                  Acerca de esta ubicación
                </h2>

                <p className="gt-detail-description">
                  {car.editorialSummary}
                </p>
              </article>
            )}

            {hours.length >
              0 && (
              <article className="gt-detail-panel">
                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-teal">
                  HORARIO
                </span>

                <h2>
                  Horario publicado
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
                  IMPORTANTE
                </span>

                <h2>
                  Consulta directamente con el proveedor
                </h2>

                <p>
                  GlobalTour muestra ubicaciones de
                  alquiler y movilidad. Los precios,
                  vehículos disponibles y reservas
                  deben verificarse directamente con
                  la empresa.
                </p>
              </div>
            </article>
          </div>

          {/* SIDEBAR */}

          <aside className="gt-detail-sidebar">
            <article className="gt-detail-panel">
              <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-teal">
                INFORMACIÓN
              </span>

              <h2>
                Datos del proveedor
              </h2>

              <div className="gt-detail-info-list">
                <DetailInfo
                  label="Servicio"
                  value={formatCarType(
                    car.primaryType,
                  )}
                />

                {brand && (
                  <DetailInfo
                    label="Empresa / Marca"
                    value={
                      brand
                    }
                  />
                )}

                <DetailInfo
                  label="Dirección"
                  value={
                    car.address ??
                    'No disponible'
                  }
                />

                {types.length >
                  0 && (
                  <DetailInfo
                    label="Clasificación"
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
                    label="Coordenadas"
                    value={`${car.latitude}, ${car.longitude}`}
                  />
                )}
              </div>
            </article>

            {hasContact && (
              <article className="gt-detail-panel">
                <span className="gt-detail-panel-eyebrow gt-detail-panel-eyebrow-teal">
                  CONTACTO
                </span>

                <h2>
                  Contacta al proveedor
                </h2>

                <div className="gt-detail-contact-list">
                  {car.phone && (
                    <a
                      href={`tel:${car.phone}`}
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

            <article className="gt-detail-source-card gt-detail-source-teal">
              <GlobeIcon />

              <div>
                <span>
                  Fuente
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

/*
 * =========================================
 * DETAIL INFO
 * =========================================
 */

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

/*
 * =========================================
 * HELPERS
 * =========================================
 */

function formatCarType(
  value:
    string |
    null |
    undefined,
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

function normalize(
  value:
    string,
) {
  return value
    .trim()
    .toLowerCase();
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
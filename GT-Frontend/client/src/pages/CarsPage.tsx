import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import CarSearchForm, {
  type CarSearchValues,
} from '../components/cars/CarSearchForm';

import {
  searchCars,
} from '../services/cars.service';

import type {
  CarSearchMeta,
  CarSummary,
} from '../types/car.types';

function CarsPage() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const [cars, setCars] =
    useState<CarSummary[]>([]);

  const [meta, setMeta] =
    useState<CarSearchMeta | null>(
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

  /*
   * Cars ya no depende de
   * DestinationAutocomplete ni de IATA.
   *
   * La ciudad es suficiente.
   */
  const hasSearch =
    cityName.trim().length >= 2;

  useEffect(() => {
    if (!hasSearch) {
      return;
    }

    let cancelled = false;

    const loadCars =
      async () => {
        setIsLoading(true);

        try {
          const response =
            await searchCars({
              cityName:
                cityName.trim(),

              countryCode:
                countryCode.trim() ||
                undefined,

              radius,

              limit: 20,

              type:
                type ===
                  'car_rental' ||
                type ===
                  'car_sharing'
                  ? type
                  : undefined,

              q:
                q.trim() ||
                undefined,

              hasWebsite:
                hasWebsite ||
                undefined,
            });

          if (cancelled) {
            return;
          }

          setCars(
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
            'Error al buscar Rent a Car:',
            requestError,
          );

          if (!cancelled) {
            setCars([]);

            setMeta(null);

            setError(
              'No fue posible buscar opciones de Rent a Car en este momento.',
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

    void loadCars();

    return () => {
      cancelled = true;
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
      values.cityName.trim(),
    );

    /*
     * El país es opcional.
     * Si está vacío no lo mandamos.
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

    if (values.q.trim()) {
      params.set(
        'q',
        values.q.trim(),
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

  return (
    <main className="cars-page">
      <section className="cars-hero">
        <div className="cars-page-container">
          <span className="cars-eyebrow">
            GlobalTour Rent a Car
          </span>

          <h1>
            Encuentra opciones para
            moverte en tu destino
          </h1>

          <p>
            Explora oficinas de alquiler
            de vehículos y servicios de
            car sharing disponibles cerca
            de tu destino.
          </p>

          <CarSearchForm
            key={`${cityName}-${countryCode}-${type}-${q}-${radius}-${hasWebsite}`}
            initialValues={{
              cityName,
              countryCode,

              type:
                type ===
                  'car_rental' ||
                type ===
                  'car_sharing'
                  ? type
                  : '',

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

      <section className="cars-results-section">
        <div className="cars-page-container">
          {!hasSearch ? (
            <CarsWelcome />
          ) : error ? (
            <div className="cars-error-state">
              <CarIcon />

              <h2>
                No pudimos completar la
                búsqueda
              </h2>

              <p>
                {error}
              </p>
            </div>
          ) : isLoading ? (
            <CarsLoading />
          ) : cars.length ===
            0 ? (
            <CarsEmpty />
          ) : (
            <>
              <div className="cars-results-header">
                <div>
                  <span className="cars-results-label">
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

                <div className="cars-search-summary">
                  <span>
                    Encontrados
                  </span>

                  <strong>
                    {meta?.matched ??
                      cars.length}
                  </strong>
                </div>
              </div>

              <div className="cars-grid">
                {cars.map(
                  (car) => (
                    <CarCard
                      key={
                        car.id
                      }
                      car={car}
                    />
                  ),
                )}
              </div>

              <div className="cars-disclaimer">
                <p>
                  GlobalTour muestra
                  ubicaciones de servicios
                  de alquiler. La
                  disponibilidad, precios
                  y reservas se consultan
                  directamente con cada
                  proveedor.
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

interface CarCardProps {
  car: CarSummary;
}

function CarCard({
  car,
}: CarCardProps) {
  return (
    <article className="car-card">
      <div className="car-card-top">
        <div className="car-card-icon">
          <CarIcon />
        </div>

        <div className="car-card-heading">
          <span className="car-type-badge">
            {formatCarType(
              car.primaryType,
            )}
          </span>

          <h3>
            {car.name}
          </h3>

          {car.brand &&
            normalize(
              car.brand,
            ) !==
              normalize(
                car.name,
              ) && (
              <p className="car-brand">
                {car.brand}
              </p>
            )}
        </div>
      </div>

      <div className="car-location">
        <LocationIcon />

        <span>
          {car.address ??
            'Dirección no disponible'}
        </span>
      </div>

      <div className="car-card-spacer" />

      <div className="car-card-actions">
        <Link
          to={`/cars/${car.id}`}
          className="car-detail-button"
        >
          Ver detalles
        </Link>

        {car.links.maps && (
          <a
            href={
              car.links.maps
            }
            target="_blank"
            rel="noreferrer"
            className="car-secondary-button"
          >
            <MapIcon />

            Ver mapa
          </a>
        )}

        {car.links
          .website && (
          <a
            href={
              car.links
                .website
            }
            target="_blank"
            rel="noreferrer"
            className="car-primary-button"
          >
            Sitio web

            <ExternalIcon />
          </a>
        )}
      </div>
    </article>
  );
}

function CarsWelcome() {
  return (
    <div className="cars-welcome">
      <div className="cars-welcome-icon">
        <CarIcon />
      </div>

      <h2>
        Busca opciones de Rent a Car
      </h2>

      <p>
        Escribe una ciudad para
        descubrir empresas de alquiler
        de vehículos y servicios de car
        sharing cercanos.
      </p>

      <div className="cars-feature-grid">
        <div>
          <strong>
            Rent a Car
          </strong>

          <span>
            Encuentra oficinas de
            alquiler cercanas.
          </span>
        </div>

        <div>
          <strong>
            Car sharing
          </strong>

          <span>
            Consulta alternativas de
            movilidad compartida.
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

function CarsEmpty() {
  return (
    <div className="cars-empty-state">
      <div className="cars-empty-icon">
        <CarIcon />
      </div>

      <h3>
        No encontramos opciones
      </h3>

      <p>
        Prueba aumentando el radio o
        eliminando alguno de los filtros
        de búsqueda.
      </p>
    </div>
  );
}

function CarsLoading() {
  return (
    <div className="cars-loading-grid">
      {Array.from({
        length: 6,
      }).map(
        (
          _,
          index,
        ) => (
          <div
            key={index}
            className="car-loading-card"
          >
            <div className="car-loading-line car-loading-short" />

            <div className="car-loading-line car-loading-title" />

            <div className="car-loading-line" />

            <div className="car-loading-line" />
          </div>
        ),
      )}
    </div>
  );
}

function formatCarType(
  value: string | null,
) {
  if (!value) {
    return 'Movilidad';
  }

  if (
    value.toLowerCase() ===
    'car rental'
  ) {
    return 'Rent a Car';
  }

  if (
    value.toLowerCase() ===
    'car sharing'
  ) {
    return 'Car sharing';
  }

  return value;
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

export default CarsPage;
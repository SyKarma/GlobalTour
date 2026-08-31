import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import DestinationAutocomplete from '../destinations/DestinationAutocomplete';

import { searchDestinations } from '../../services/destinations.service';

import type {
  Destination,
} from '../../types/destination.types';

import type {
  CarAmenity,
} from '../../types/car.types';

export interface CarSearchValues {
  cityName: string;
  countryCode: string;
  type: CarAmenity | '';
  q: string;
  radius: number;
  hasWebsite: boolean;
}

interface CarSearchFormProps {
  initialValues?: Partial<CarSearchValues>;

  onSearch: (
    values: CarSearchValues,
  ) => void;

  isLoading?: boolean;
}

function CarSearchForm({
  initialValues,
  onSearch,
  isLoading = false,
}: CarSearchFormProps) {
  const [
    selectedDestination,
    setSelectedDestination,
  ] = useState<Destination | null>(
    null,
  );

  const [type, setType] =
    useState<CarAmenity | ''>(
      initialValues?.type ?? '',
    );

  const [q, setQ] = useState(
    initialValues?.q ?? '',
  );

  const [radius, setRadius] =
    useState(
      initialValues?.radius ?? 8000,
    );

  const [
    hasWebsite,
    setHasWebsite,
  ] = useState(
    initialValues?.hasWebsite ?? false,
  );

  useEffect(() => {
    const initialCity =
      initialValues?.cityName?.trim();

    if (!initialCity) {
      return;
    }

    let cancelled = false;

    const resolveDestination =
      async () => {
        try {
          const response =
            await searchDestinations({
              q: initialCity,
              country:
                initialValues?.countryCode ||
                undefined,
              limit: 10,
            });

          if (cancelled) {
            return;
          }

          const city =
            normalizeText(initialCity);

          const country =
            initialValues?.countryCode
              ?.trim()
              .toUpperCase();

          const exactMatch =
            response.data.find(
              (destination) =>
                normalizeText(
                  destination.cityName,
                ) === city &&
                (!country ||
                  destination.countryCode ===
                    country),
            );

          setSelectedDestination(
            exactMatch ??
              response.data[0] ??
              null,
          );
        } catch (error) {
          if (!cancelled) {
            console.error(
              'Error al resolver destino:',
              error,
            );
          }
        }
      };

    void resolveDestination();

    return () => {
      cancelled = true;
    };
  }, [
    initialValues?.cityName,
    initialValues?.countryCode,
  ]);

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedDestination) {
      return;
    }

    onSearch({
      cityName:
        selectedDestination.cityName,

      countryCode:
        selectedDestination.countryCode,

      type,

      q: q.trim(),

      radius,

      hasWebsite,
    });
  };

  return (
    <form
      className="car-search-form"
      onSubmit={handleSubmit}
    >
      <div className="car-search-main">
        <div className="car-destination-field">
          <DestinationAutocomplete
            label="Destino"
            placeholder="Busca una ciudad..."
            value={selectedDestination}
            onChange={
              setSelectedDestination
            }
          />
        </div>

        <button
          type="submit"
          className="car-search-button"
          disabled={
            isLoading ||
            !selectedDestination
          }
        >
          <SearchIcon />

          {isLoading
            ? 'Buscando...'
            : 'Buscar vehículos'}
        </button>
      </div>

      <div className="car-search-filters">
        <div className="car-filter-field">
          <label htmlFor="car-type">
            Tipo
          </label>

          <select
            id="car-type"
            value={type}
            onChange={(event) =>
              setType(
                event.target.value as
                  | CarAmenity
                  | '',
              )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="car_rental">
              Rent a Car
            </option>

            <option value="car_sharing">
              Car sharing
            </option>
          </select>
        </div>

        <div className="car-filter-field">
          <label htmlFor="car-company">
            Empresa
          </label>

          <input
            id="car-company"
            type="text"
            value={q}
            placeholder="Ej. Adobe, Hertz..."
            onChange={(event) =>
              setQ(event.target.value)
            }
          />
        </div>

        <div className="car-filter-field">
          <label htmlFor="car-radius">
            Radio
          </label>

          <select
            id="car-radius"
            value={radius}
            onChange={(event) =>
              setRadius(
                Number(
                  event.target.value,
                ),
              )
            }
          >
            <option value={2000}>
              2 km
            </option>

            <option value={4000}>
              4 km
            </option>

            <option value={8000}>
              8 km
            </option>

            <option value={15000}>
              15 km
            </option>

            <option value={25000}>
              25 km
            </option>

            <option value={50000}>
              50 km
            </option>
          </select>
        </div>

        <label className="car-website-filter">
          <input
            type="checkbox"
            checked={hasWebsite}
            onChange={(event) =>
              setHasWebsite(
                event.target.checked,
              )
            }
          />

          <span>
            Solo con sitio web
          </span>
        </label>
      </div>
    </form>
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

function normalizeText(
  value: string,
) {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .trim()
    .toLowerCase();
}

export default CarSearchForm;
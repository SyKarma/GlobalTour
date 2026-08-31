import {
  useEffect,
  useState,
} from 'react';

import DestinationAutocomplete from '../destinations/DestinationAutocomplete';

import { searchDestinations } from '../../services/destinations.service';

import type { Destination } from '../../types/destination.types';

export interface RestaurantSearchValues {
  cityName: string;
  countryCode: string;
  type: string;
  cuisine: string;
  radius: number;
  hasWebsite: boolean;
}

interface RestaurantSearchFormProps {
  initialValues?: Partial<RestaurantSearchValues>;

  onSearch: (
    values: RestaurantSearchValues,
  ) => void;

  isLoading?: boolean;
}

function RestaurantSearchForm({
  initialValues,
  onSearch,
  isLoading = false,
}: RestaurantSearchFormProps) {
  const [
    selectedDestination,
    setSelectedDestination,
  ] = useState<Destination | null>(
    null,
  );

  const [type, setType] = useState(
    initialValues?.type ?? '',
  );

  const [cuisine, setCuisine] =
    useState(
      initialValues?.cuisine ?? '',
    );

  const [radius, setRadius] =
    useState(
      initialValues?.radius ?? 4000,
    );

  const [
    hasWebsite,
    setHasWebsite,
  ] = useState(
    initialValues?.hasWebsite ?? false,
  );

  /*
   * Si llegamos desde una URL como:
   *
   * /restaurants?cityName=San+Jose&countryCode=CR
   *
   * buscamos el destino correspondiente para
   * reconstruir visualmente el autocomplete.
   */
  useEffect(() => {
    const initialCity =
      initialValues?.cityName?.trim();

    if (!initialCity) {
      return;
    }

    let cancelled = false;

    const resolveInitialDestination =
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

          const normalizedCity =
            normalizeText(initialCity);

          const normalizedCountry =
            initialValues?.countryCode
              ?.trim()
              .toUpperCase();

          const exactMatch =
            response.data.find(
              (destination) =>
                normalizeText(
                  destination.cityName,
                ) ===
                  normalizedCity &&
                (!normalizedCountry ||
                  destination.countryCode ===
                    normalizedCountry),
            );

          setSelectedDestination(
            exactMatch ??
              response.data[0] ??
              null,
          );
        } catch (error) {
          if (!cancelled) {
            console.error(
              'Error al resolver el destino inicial:',
              error,
            );
          }
        }
      };

    void resolveInitialDestination();

    return () => {
      cancelled = true;
    };
  }, [
    initialValues?.cityName,
    initialValues?.countryCode,
  ]);

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
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

      cuisine:
        cuisine.trim(),

      radius,

      hasWebsite,
    });
  };

  return (
    <form
      className="restaurant-search-form"
      onSubmit={handleSubmit}
    >
      <div className="restaurant-search-main">
        <div className="restaurant-destination-field">
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
          className="restaurant-search-button"
          disabled={
            isLoading ||
            !selectedDestination
          }
        >
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

          {isLoading
            ? 'Buscando...'
            : 'Buscar restaurantes'}
        </button>
      </div>

      <div className="restaurant-search-filters">
        <div className="restaurant-filter-field">
          <label htmlFor="restaurant-type">
            Tipo
          </label>

          <select
            id="restaurant-type"
            value={type}
            onChange={(event) =>
              setType(
                event.target.value,
              )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="restaurant">
              Restaurantes
            </option>

            <option value="cafe">
              Cafés
            </option>

            <option value="fast_food">
              Comida rápida
            </option>
          </select>
        </div>

        <div className="restaurant-filter-field">
          <label htmlFor="restaurant-cuisine">
            Cocina
          </label>

          <input
            id="restaurant-cuisine"
            type="text"
            placeholder="Ej. japonesa, italiana..."
            value={cuisine}
            onChange={(event) =>
              setCuisine(
                event.target.value,
              )
            }
          />
        </div>

        <div className="restaurant-filter-field">
          <label htmlFor="restaurant-radius">
            Radio
          </label>

          <select
            id="restaurant-radius"
            value={radius}
            onChange={(event) =>
              setRadius(
                Number(
                  event.target.value,
                ),
              )
            }
          >
            <option value={1000}>
              1 km
            </option>

            <option value={2000}>
              2 km
            </option>

            <option value={4000}>
              4 km
            </option>

            <option value={10000}>
              10 km
            </option>

            <option value={20000}>
              20 km
            </option>
          </select>
        </div>

        <label className="restaurant-website-filter">
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

export default RestaurantSearchForm;
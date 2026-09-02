import {
  useState,
  type FormEvent,
} from 'react';

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
  const [cityName, setCityName] =
    useState(
      initialValues?.cityName ?? '',
    );

  const [
    countryCode,
    setCountryCode,
  ] = useState(
    (
      initialValues?.countryCode ?? ''
    ).toUpperCase(),
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

  const cleanCity =
    cityName.trim();

  const cleanCountry =
    countryCode
      .trim()
      .toUpperCase();

  const isCountryValid =
    cleanCountry.length === 0 ||
    /^[A-Z]{2}$/.test(cleanCountry);

  const handleCountryChange = (
    value: string,
  ) => {
    setCountryCode(
      value
        .replace(
          /[^a-zA-Z]/g,
          '',
        )
        .slice(0, 2)
        .toUpperCase(),
    );
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      cleanCity.length < 2 ||
      !isCountryValid
    ) {
      return;
    }

    onSearch({
      cityName: cleanCity,
      countryCode: cleanCountry,
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
          <div className="car-location-fields">
            <div className="car-filter-field">
              <label htmlFor="car-city">
                Ciudad
              </label>

              <input
                id="car-city"
                type="text"
                value={cityName}
                maxLength={80}
                autoComplete="off"
                placeholder="Ej. Nicoya"
                onChange={(event) =>
                  setCityName(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="car-filter-field">
              <label htmlFor="car-country">
                País (opcional)
              </label>

              <input
                id="car-country"
                type="text"
                value={countryCode}
                maxLength={2}
                autoComplete="off"
                placeholder="CR"
                aria-label="Código ISO del país"
                onChange={(event) =>
                  handleCountryChange(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="car-search-button"
          disabled={
            isLoading ||
            cleanCity.length < 2 ||
            !isCountryValid
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

export default CarSearchForm;
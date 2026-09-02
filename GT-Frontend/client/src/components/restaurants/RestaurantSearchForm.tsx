import {
  useState,
  type FormEvent,
} from 'react';

export type RestaurantAmenity =
  | 'restaurant'
  | 'cafe'
  | 'fast_food';

export interface RestaurantSearchValues {
  cityName: string;
  countryCode: string;
  type: RestaurantAmenity | '';
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
    useState<
      RestaurantAmenity | ''
    >(
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

  const cleanCity =
    cityName.trim();

  const cleanCountry =
    countryCode
      .trim()
      .toUpperCase();

  const isCountryValid =
    cleanCountry.length === 0 ||
    /^[A-Z]{2}$/.test(
      cleanCountry,
    );

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
      countryCode:
        cleanCountry,
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
        <div className="restaurant-search-field">
          <label htmlFor="restaurant-city">
            Ciudad
          </label>

          <div className="restaurant-search-input-wrapper">
            <LocationIcon />

            <input
              id="restaurant-city"
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
        </div>

        <div className="restaurant-search-field">
          <label htmlFor="restaurant-country">
            País
          </label>

          <input
            id="restaurant-country"
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

        <button
          type="submit"
          className="restaurant-search-button"
          disabled={
            isLoading ||
            cleanCity.length < 2 ||
            !isCountryValid
          }
        >
          <SearchIcon />

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
                event.target.value as
                  | RestaurantAmenity
                  | '',
              )
            }
          >
            <option value="">
              Todos
            </option>

            <option value="restaurant">
              Restaurante
            </option>

            <option value="cafe">
              Café
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

export default RestaurantSearchForm;
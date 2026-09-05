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
  const [
    cityName,
    setCityName,
  ] =
    useState(
      initialValues?.cityName ??
        '',
    );

  const [
    countryCode,
    setCountryCode,
  ] =
    useState(
      (
        initialValues?.countryCode ??
        ''
      ).toUpperCase(),
    );

  const [
    type,
    setType,
  ] =
    useState<
      RestaurantAmenity | ''
    >(
      initialValues?.type ??
        '',
    );

  const [
    cuisine,
    setCuisine,
  ] =
    useState(
      initialValues?.cuisine ??
        '',
    );

  const [
    radius,
    setRadius,
  ] =
    useState(
      initialValues?.radius ??
        4000,
    );

  const [
    hasWebsite,
    setHasWebsite,
  ] =
    useState(
      initialValues?.hasWebsite ??
        false,
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
        .slice(
          0,
          2,
        )
        .toUpperCase(),
    );
  };

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      cleanCity.length < 2 ||
      !isCountryValid
    ) {
      return;
    }

    onSearch({
      cityName:
        cleanCity,

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
      className="restaurant-search-form gt-restaurant-search-form"
      onSubmit={
        handleSubmit
      }
    >
      {/* =====================================
          MAIN SEARCH
      ====================================== */}

      <div className="gt-restaurant-search-main">
        <label className="gt-restaurant-main-field gt-restaurant-city">
          <span>
            Ciudad
          </span>

          <div className="gt-restaurant-input-control">
            <LocationIcon />

            <input
              type="text"
              value={
                cityName
              }
              maxLength={
                80
              }
              autoComplete="off"
              placeholder="Ej. Nicoya"
              aria-label="Ciudad"
              onChange={(
                event,
              ) =>
                setCityName(
                  event.target
                    .value,
                )
              }
            />
          </div>
        </label>

        <label className="gt-restaurant-main-field gt-restaurant-country">
          <span>
            País
          </span>

          <div className="gt-restaurant-input-control">
            <GlobeIcon />

            <input
              type="text"
              value={
                countryCode
              }
              maxLength={
                2
              }
              autoComplete="off"
              placeholder="CR"
              aria-label="Código ISO del país"
              onChange={(
                event,
              ) =>
                handleCountryChange(
                  event.target
                    .value,
                )
              }
            />
          </div>
        </label>

        <button
          type="submit"
          className="gt-restaurant-search-button"
          disabled={
            isLoading ||
            cleanCity.length <
              2 ||
            !isCountryValid
          }
        >
          <SearchIcon />

          {isLoading
            ? 'Buscando...'
            : 'Buscar restaurantes'}
        </button>
      </div>

      {/* =====================================
          FILTERS
      ====================================== */}

      <div className="gt-restaurant-search-filters">
        <label className="gt-restaurant-filter-field">
          <span>
            Tipo de lugar
          </span>

          <div className="gt-restaurant-filter-control">
            <RestaurantIcon />

            <select
              value={
                type
              }
              onChange={(
                event,
              ) =>
                setType(
                  event.target
                    .value as
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
        </label>

        <label className="gt-restaurant-filter-field">
          <span>
            Cocina
          </span>

          <div className="gt-restaurant-filter-control">
            <FoodIcon />

            <input
              type="text"
              placeholder="Ej. italiana, japonesa..."
              value={
                cuisine
              }
              onChange={(
                event,
              ) =>
                setCuisine(
                  event.target
                    .value,
                )
              }
            />
          </div>
        </label>

        <label className="gt-restaurant-filter-field">
          <span>
            Área de búsqueda
          </span>

          <div className="gt-restaurant-filter-control">
            <RadiusIcon />

            <select
              value={
                radius
              }
              onChange={(
                event,
              ) =>
                setRadius(
                  Number(
                    event.target
                      .value,
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
        </label>

        <label className="gt-restaurant-website-filter">
          <input
            type="checkbox"
            checked={
              hasWebsite
            }
            onChange={(
              event,
            ) =>
              setHasWebsite(
                event.target
                  .checked,
              )
            }
          />

          <span className="gt-restaurant-checkbox">
            <CheckIcon />
          </span>

          <span>
            Solo lugares con sitio web
          </span>
        </label>
      </div>
    </form>
  );
}

/*
 * =========================================
 * ICONS
 * =========================================
 */

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

      <path d="M3 12h18" />

      <path d="M12 3c3 3 4 6 4 9s-1 6-4 9" />

      <path d="M12 3c-3 3-4 6-4 9s1 6 4 9" />
    </svg>
  );
}

function RestaurantIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10" />

      <path d="M17 3c-2 2-3 5-3 8 0 2 1 3 3 3v7M17 3v11" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
      />

      <circle
        cx="12"
        cy="12"
        r="3"
      />
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m6 12 4 4 8-8" />
    </svg>
  );
}

export default RestaurantSearchForm;
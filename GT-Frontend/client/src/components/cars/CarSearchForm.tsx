import {
  useState,
  type FormEvent,
} from 'react';

import {
  useTranslation,
} from 'react-i18next';

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
  const {
    t,
  } =
    useTranslation();

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
    useState<CarAmenity | ''>(
      initialValues?.type ??
        '',
    );

  const [
    q,
    setQ,
  ] =
    useState(
      initialValues?.q ??
        '',
    );

  const [
    radius,
    setRadius,
  ] =
    useState(
      initialValues?.radius ??
        8000,
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

      q:
        q.trim(),

      radius,

      hasWebsite,
    });
  };

  return (
    <form
      className="car-search-form gt-car-search-form"
      onSubmit={
        handleSubmit
      }
    >
      <div className="gt-car-search-main">

        <label className="gt-car-main-field gt-car-city-field">

          <span>
            {t(
              'cars.search.city',
            )}
          </span>

          <div className="gt-car-input-control">

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
              placeholder={t(
                'cars.search.cityPlaceholder',
              )}
              aria-label={t(
                'cars.search.city',
              )}
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

        <label className="gt-car-main-field gt-car-country-field">

          <span>
            {t(
              'cars.search.country',
            )}
          </span>

          <div className="gt-car-input-control">

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
              aria-label={t(
                'cars.search.countryAria',
              )}
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
          className="gt-car-search-button"
          disabled={
            isLoading ||
            cleanCity.length <
              2 ||
            !isCountryValid
          }
        >
          <SearchIcon />

          {isLoading
            ? t(
                'cars.search.searching',
              )
            : t(
                'cars.search.button',
              )}
        </button>

      </div>

      <div className="gt-car-search-filters">

        <label className="gt-car-filter-field">

          <span>
            {t(
              'cars.search.service',
            )}
          </span>

          <div className="gt-car-filter-control">

            <CarIcon />

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
                    | CarAmenity
                    | '',
                )
              }
            >
              <option value="">
                {t(
                  'cars.search.services.all',
                )}
              </option>

              <option value="car_rental">
                {t(
                  'cars.common.types.carRental',
                )}
              </option>

              <option value="car_sharing">
                {t(
                  'cars.common.types.carSharing',
                )}
              </option>
            </select>

          </div>

        </label>

        <label className="gt-car-filter-field">

          <span>
            {t(
              'cars.search.company',
            )}
          </span>

          <div className="gt-car-filter-control">

            <BuildingIcon />

            <input
              type="text"
              value={
                q
              }
              placeholder={t(
                'cars.search.companyPlaceholder',
              )}
              onChange={(
                event,
              ) =>
                setQ(
                  event.target
                    .value,
                )
              }
            />

          </div>

        </label>

        <label className="gt-car-filter-field">

          <span>
            {t(
              'cars.search.area',
            )}
          </span>

          <div className="gt-car-filter-control">

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

        </label>

        <label className="gt-car-website-filter">

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

          <span className="gt-car-checkbox">
            <CheckIcon />
          </span>

          <span>
            {t(
              'cars.search.websiteOnly',
            )}
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

export default CarSearchForm;
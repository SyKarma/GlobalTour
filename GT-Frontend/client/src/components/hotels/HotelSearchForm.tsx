import {
  useState,
  type FormEvent,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useCurrency,
} from '../../hooks/useCurrency';

export interface HotelSearchValues {
  cityName: string;
  countryCode: string;
  checkin: string;
  checkout: string;
  adults: string;
}

interface HotelSearchFormProps {
  initialValues?: Partial<HotelSearchValues>;
}

function HotelSearchForm({
  initialValues,
}: HotelSearchFormProps) {
  const navigate =
    useNavigate();

  const {
    selectedCurrency,
  } =
    useCurrency();

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
    checkin,
    setCheckin,
  ] =
    useState(
      initialValues?.checkin ??
        '',
    );

  const [
    checkout,
    setCheckout,
  ] =
    useState(
      initialValues?.checkout ??
        '',
    );

  const [
    adults,
    setAdults,
  ] =
    useState(
      initialValues?.adults ??
        '2',
    );

  const cleanCity =
    cityName.trim();

  const cleanCountry =
    countryCode
      .trim()
      .toUpperCase();

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

  const handleCheckinChange = (
    value: string,
  ) => {
    setCheckin(
      value,
    );

    if (
      checkout &&
      checkout <= value
    ) {
      setCheckout('');
    }
  };

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      cleanCity.length < 2 ||
      !/^[A-Z]{2}$/.test(
        cleanCountry,
      ) ||
      !checkin ||
      !checkout
    ) {
      return;
    }

    const params =
      new URLSearchParams({
        cityName:
          cleanCity,

        countryCode:
          cleanCountry,

        checkin,

        checkout,

        adults,

        currency:
          selectedCurrency,
      });

    navigate(
      `/hotels?${params.toString()}`,
    );
  };

  const isSearchDisabled =
    cleanCity.length < 2 ||
    !/^[A-Z]{2}$/.test(
      cleanCountry,
    ) ||
    !checkin ||
    !checkout;

  return (
    <form
      className="hotel-search gt-hotel-search"
      onSubmit={
        handleSubmit
      }
    >
      <div className="gt-hotel-search-row">

        {/* LOCATION */}

        <div className="gt-hotel-location-group">
          <label className="gt-hotel-search-field gt-hotel-city-field">
            <span>
              Ciudad
            </span>

            <div className="gt-hotel-input-control">
              <LocationIcon />

              <input
                type="text"
                aria-label="Ciudad de hospedaje"
                value={
                  cityName
                }
                maxLength={
                  80
                }
                autoComplete="off"
                placeholder="Ej. Madrid"
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

          <label className="gt-hotel-search-field gt-hotel-country-field">
            <span>
              País
            </span>

            <div className="gt-hotel-input-control">
              <GlobeIcon />

              <input
                type="text"
                aria-label="Código ISO del país"
                value={
                  countryCode
                }
                maxLength={
                  2
                }
                autoComplete="off"
                placeholder="ES"
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
        </div>

        {/* CHECK IN */}

        <label className="gt-hotel-search-field">
          <span>
            Check-in
          </span>

          <div className="gt-hotel-input-control">
            <CalendarIcon />

            <input
              type="date"
              aria-label="Fecha de check-in"
              value={
                checkin
              }
              onChange={(
                event,
              ) =>
                handleCheckinChange(
                  event.target
                    .value,
                )
              }
            />
          </div>
        </label>

        {/* CHECK OUT */}

        <label className="gt-hotel-search-field">
          <span>
            Check-out
          </span>

          <div className="gt-hotel-input-control">
            <CalendarIcon />

            <input
              type="date"
              aria-label="Fecha de check-out"
              value={
                checkout
              }
              min={
                checkin ||
                undefined
              }
              onChange={(
                event,
              ) =>
                setCheckout(
                  event.target
                    .value,
                )
              }
            />
          </div>
        </label>

        {/* GUESTS */}

        <label className="gt-hotel-search-field">
          <span>
            Huéspedes
          </span>

          <div className="gt-hotel-input-control">
            <GuestsIcon />

            <select
              value={
                adults
              }
              aria-label="Cantidad de adultos"
              onChange={(
                event,
              ) =>
                setAdults(
                  event.target
                    .value,
                )
              }
            >
              <option value="1">
                1 adulto
              </option>

              <option value="2">
                2 adultos
              </option>

              <option value="3">
                3 adultos
              </option>

              <option value="4">
                4 adultos
              </option>

              <option value="5">
                5 adultos
              </option>

              <option value="6">
                6 adultos
              </option>

              <option value="7">
                7 adultos
              </option>

              <option value="8">
                8 adultos
              </option>
            </select>
          </div>
        </label>

        {/* SEARCH */}

        <button
          className="gt-hotel-search-button"
          type="submit"
          disabled={
            isSearchDisabled
          }
        >
          <SearchIcon />

          <span>
            Buscar
          </span>
        </button>
      </div>
    </form>
  );
}

/*
 * =========================================
 * ICONS
 * =========================================
 */

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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />

      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function GuestsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3"
      />

      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
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

export default HotelSearchForm;
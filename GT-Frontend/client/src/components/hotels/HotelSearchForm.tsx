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

function HotelSearchForm() {
  const navigate = useNavigate();

  const {
    selectedCurrency,
  } = useCurrency();

  const [cityName, setCityName] =
    useState('');

  const [
    countryCode,
    setCountryCode,
  ] = useState('');

  const [checkin, setCheckin] =
    useState('');

  const [checkout, setCheckout] =
    useState('');

  const [adults, setAdults] =
    useState('2');

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
        .slice(0, 2)
        .toUpperCase(),
    );
  };

  const handleCheckinChange = (
    value: string,
  ) => {
    setCheckin(value);

    if (
      checkout &&
      checkout <= value
    ) {
      setCheckout('');
    }
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
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
        cityName: cleanCity,
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
      className="hotel-search"
      onSubmit={handleSubmit}
    >
      <div className="hotel-search-row">
        <div className="hotel-location-fields">
          <label className="search-box search-location">
            <span>Ciudad</span>

            <input
              type="text"
              aria-label="Ciudad de hospedaje"
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
          </label>

          <label className="search-box search-country">
            <span>País</span>

            <input
              type="text"
              aria-label="Código ISO del país"
              value={countryCode}
              maxLength={2}
              autoComplete="off"
              placeholder="CR"
              onChange={(event) =>
                handleCountryChange(
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        <label className="search-box search-date">
          <span>
            Check-in
          </span>

          <input
            type="date"
            aria-label="Fecha de check-in"
            value={checkin}
            onChange={(event) =>
              handleCheckinChange(
                event.target.value,
              )
            }
          />
        </label>

        <label className="search-box search-date">
          <span>
            Check-out
          </span>

          <input
            type="date"
            aria-label="Fecha de check-out"
            value={checkout}
            min={
              checkin ||
              undefined
            }
            onChange={(event) =>
              setCheckout(
                event.target.value,
              )
            }
          />
        </label>

        <label className="search-box search-travelers">
          <span>
            Huéspedes
          </span>

          <select
            value={adults}
            aria-label="Cantidad de adultos"
            onChange={(event) =>
              setAdults(
                event.target.value,
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
        </label>

        <button
          className="search-button"
          type="submit"
          disabled={
            isSearchDisabled
          }
        >
          Buscar hoteles
        </button>
      </div>
    </form>
  );
}

export default HotelSearchForm;
import {
  useState,
  type FormEvent,
} from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  useTranslation,
} from 'react-i18next';

import {
  useCurrency,
} from '../../hooks/useCurrency';

import {
  addDaysIso,
  getTodayIso,
  isPastDate,
} from '../../utils/dates';

/*
 * Hotel search works with any city, town or area name.
 * The backend geocodes the text, so it does not depend on
 * the airport list used by the flight search.
 */

function HotelSearchForm() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const {
    t,
  } =
    useTranslation();

  const {
    selectedCurrency,
  } =
    useCurrency();

  const today =
    getTodayIso();

  const initialCheckin =
    searchParams.get(
      'checkin',
    ) ?? '';

  const initialCheckout =
    searchParams.get(
      'checkout',
    ) ?? '';

  const [
    cityName,
    setCityName,
  ] =
    useState(
      searchParams.get(
        'cityName',
      ) ?? '',
    );

  const [
    checkin,
    setCheckin,
  ] =
    useState(
      isPastDate(
        initialCheckin,
      )
        ? ''
        : initialCheckin,
    );

  const [
    checkout,
    setCheckout,
  ] =
    useState(
      isPastDate(
        initialCheckout,
      )
        ? ''
        : initialCheckout,
    );

  const [
    adults,
    setAdults,
  ] =
    useState(
      searchParams.get(
        'adults',
      ) || '2',
    );

  const cleanCity =
    cityName.trim();

  const checkoutMin =
    addDaysIso(
      checkin ||
        today,
      1,
    );

  const handleCheckinChange =
    (
      value: string,
    ) => {
      setCheckin(
        value,
      );

      if (
        checkout &&
        checkout <=
          value
      ) {
        setCheckout(
          '',
        );
      }
    };

  const hasInvalidDates =
    isPastDate(
      checkin,
    ) ||
    (
      Boolean(
        checkin,
      ) &&
      Boolean(
        checkout,
      ) &&
      checkout <=
        checkin
    );

  const isSearchDisabled =
    cleanCity.length <
      2 ||
    !checkin ||
    !checkout ||
    hasInvalidDates;

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      isSearchDisabled
    ) {
      return;
    }

    const params =
      new URLSearchParams({
        cityName:
          cleanCity,

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

  return (
    <form
      className="hotel-search"
      onSubmit={
        handleSubmit
      }
    >
      <div className="hotel-search-row">

        <label className="search-box search-city">

          <span>
            {t(
              'forms.hotels.destination',
            )}
          </span>

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
              'forms.hotels.destinationPlaceholder',
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

        </label>

        <label className="search-box search-date">

          <span>
            {t(
              'forms.hotels.checkin',
            )}
          </span>

          <input
            type="date"
            aria-label={t(
              'forms.hotels.checkinAria',
            )}
            value={
              checkin
            }
            min={
              today
            }
            aria-invalid={isPastDate(
              checkin,
            )}
            onChange={(
              event,
            ) =>
              handleCheckinChange(
                event.target
                  .value,
              )
            }
          />

        </label>

        <label className="search-box search-date">

          <span>
            {t(
              'forms.hotels.checkout',
            )}
          </span>

          <input
            type="date"
            aria-label={t(
              'forms.hotels.checkoutAria',
            )}
            value={
              checkout
            }
            min={
              checkoutMin
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

        </label>

        <label className="search-box search-travelers">

          <span>
            {t(
              'forms.hotels.guests',
            )}
          </span>

          <select
            value={
              adults
            }
            aria-label={t(
              'forms.hotels.adultsAria',
            )}
            onChange={(
              event,
            ) =>
              setAdults(
                event.target
                  .value,
              )
            }
          >
            {Array.from(
              {
                length:
                  8,
              },
              (
                _,
                index,
              ) =>
                index + 1,
            ).map(
              (
                amount,
              ) => (
                <option
                  key={
                    amount
                  }
                  value={
                    amount
                  }
                >
                  {t(
                    'forms.hotels.adult',
                    {
                      count:
                        amount,
                    },
                  )}
                </option>
              ),
            )}
          </select>

        </label>

        <button
          className="search-button"
          type="submit"
          disabled={
            isSearchDisabled
          }
        >
          {t(
            'forms.hotels.search',
          )}
        </button>

      </div>
    </form>
  );
}

export default HotelSearchForm;

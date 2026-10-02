import {
  useState,
  type FormEvent,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useTranslation,
} from 'react-i18next';

import DestinationAutocomplete from '../destinations/DestinationAutocomplete';

import {
  useCurrency,
} from '../../hooks/useCurrency';

import type {
  Destination,
} from '../../types/destination.types';

function HotelSearchForm() {
  const navigate =
    useNavigate();

  const {
    t,
  } =
    useTranslation();

  const {
    selectedCurrency,
  } =
    useCurrency();

  const [
    destination,
    setDestination,
  ] =
    useState<Destination | null>(
      null,
    );

  const [
    checkin,
    setCheckin,
  ] =
    useState('');

  const [
    checkout,
    setCheckout,
  ] =
    useState('');

  const [
    adults,
    setAdults,
  ] =
    useState('2');

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

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !destination ||
      !checkin ||
      !checkout
    ) {
      return;
    }

    const params =
      new URLSearchParams({
        cityName:
          destination.cityName,

        countryCode:
          destination.countryCode,

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
    !destination ||
    !checkin ||
    !checkout;

  return (
    <form
      className="hotel-search"
      onSubmit={
        handleSubmit
      }
    >
      <div className="hotel-search-row">

        <DestinationAutocomplete
          label={t(
            'forms.hotels.destination',
          )}
          placeholder={t(
            'forms.hotels.destinationPlaceholder',
          )}
          value={
            destination
          }
          onChange={
            setDestination
          }
        />

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
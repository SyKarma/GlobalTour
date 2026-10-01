import {
  useEffect,
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
  getDestinationByIata,
} from '../../services/destinations.service';

import {
  useCurrency,
} from '../../hooks/useCurrency';

import type {
  Destination,
} from '../../types/destination.types';

interface TripSearchFormProps {
  initialDestinationIata?:
    | string
    | null;
}

function TripSearchForm({
  initialDestinationIata =
    null,
}: TripSearchFormProps) {
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
    origin,
    setOrigin,
  ] =
    useState<Destination | null>(
      null,
    );

  const [
    destination,
    setDestination,
  ] =
    useState<Destination | null>(
      null,
    );

  const [
    departureAt,
    setDepartureAt,
  ] =
    useState('');

  const [
    returnAt,
    setReturnAt,
  ] =
    useState('');

  /*
   * =========================================
   * PRESELECT RECOMMENDED DESTINATION
   * =========================================
   */

  useEffect(() => {
    if (
      !initialDestinationIata
    ) {
      return;
    }

    let cancelled =
      false;

    const loadDestination =
      async () => {
        try {
          const result =
            await getDestinationByIata(
              initialDestinationIata,
            );

          if (
            cancelled
          ) {
            return;
          }

          setDestination(
            result,
          );
        } catch (
          error
        ) {
          if (
            !cancelled
          ) {
            console.error(
              'Error loading destination:',
              error,
            );
          }
        }
      };

    void loadDestination();

    return () => {
      cancelled =
        true;
    };
  }, [
    initialDestinationIata,
  ]);

  /*
   * =========================================
   * DATES
   * =========================================
   */

  const handleDepartureChange =
    (
      value: string,
    ) => {
      setDepartureAt(
        value,
      );

      if (
        returnAt &&
        returnAt <
          value
      ) {
        setReturnAt(
          '',
        );
      }
    };

  /*
   * =========================================
   * SUBMIT
   * =========================================
   */

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !origin ||
      !destination ||
      !departureAt
    ) {
      return;
    }

    const params =
      new URLSearchParams({
        origin:
          origin.cityIata,

        destination:
          destination.cityIata,

        departureAt,

        currency:
          selectedCurrency,
      });

    if (
      returnAt
    ) {
      params.set(
        'returnAt',
        returnAt,
      );
    }

    navigate(
      `/flights?${params.toString()}`,
    );
  };

  const isSearchDisabled =
    !origin ||
    !destination ||
    !departureAt;

  return (
    <form
      className="trip-search"
      onSubmit={
        handleSubmit
      }
    >
      <div className="trip-search-row">

        <DestinationAutocomplete
          label={t(
            'forms.flights.origin',
          )}
          placeholder={t(
            'forms.flights.originPlaceholder',
          )}
          value={
            origin
          }
          onChange={
            setOrigin
          }
        />

        <DestinationAutocomplete
          label={t(
            'forms.flights.destination',
          )}
          placeholder={t(
            'forms.flights.destinationPlaceholder',
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
              'forms.flights.departure',
            )}
          </span>

          <input
            type="date"
            aria-label={t(
              'forms.flights.departureAria',
            )}
            value={
              departureAt
            }
            onChange={(
              event,
            ) =>
              handleDepartureChange(
                event.target
                  .value,
              )
            }
          />

        </label>

        <label className="search-box search-date">

          <span>
            {t(
              'forms.flights.return',
            )}
          </span>

          <input
            type="date"
            aria-label={t(
              'forms.flights.returnAria',
            )}
            value={
              returnAt
            }
            min={
              departureAt ||
              undefined
            }
            onChange={(
              event,
            ) =>
              setReturnAt(
                event.target
                  .value,
              )
            }
          />

        </label>

        <button
          type="submit"
          className="search-button"
          disabled={
            isSearchDisabled
          }
        >
          {t(
            'forms.flights.search',
          )}
        </button>

      </div>
    </form>
  );
}

export default TripSearchForm;
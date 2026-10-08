import {
  useState,
  type FormEvent,
} from 'react';

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

type TripType =
  | 'round-trip'
  | 'one-way';

export interface TravelPlanSearchParams {
  origin: string;
  destination: string;
  departureAt: string;
  returnAt?: string;
  currency: string;
}

interface TravelPlanSearchFormProps {
  onSearch: (
    params: TravelPlanSearchParams,
  ) => void;
}

function TravelPlanSearchForm({
  onSearch,
}: TravelPlanSearchFormProps) {
  const {
    t,
  } = useTranslation();

  const {
    selectedCurrency,
  } = useCurrency();

  const [
    tripType,
    setTripType,
  ] = useState<TripType>(
    'round-trip',
  );

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
    departureDate,
    setDepartureDate,
  ] =
    useState('');

  const [
    returnDate,
    setReturnDate,
  ] =
    useState('');

  const handleTripTypeChange = (
    value: TripType,
  ) => {
    setTripType(
      value,
    );

    if (
      value ===
      'one-way'
    ) {
      setReturnDate('');
    }
  };

  const handleDepartureDateChange = (
    value: string,
  ) => {
    setDepartureDate(
      value,
    );

    if (
      returnDate &&
      returnDate < value
    ) {
      setReturnDate('');
    }
  };

  const handleSwapLocations =
    () => {
      const previousOrigin =
        origin;

      setOrigin(
        destination,
      );

      setDestination(
        previousOrigin,
      );
    };

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !origin ||
      !destination ||
      !departureDate
    ) {
      return;
    }

    if (
      tripType ===
        'round-trip' &&
      !returnDate
    ) {
      return;
    }

    onSearch({
      origin:
        origin.cityIata,

      destination:
        destination.cityIata,

      departureAt:
        departureDate,

      returnAt:
        tripType ===
        'round-trip'
          ? returnDate
          : undefined,

      currency:
        selectedCurrency,
    });
  };

  const isSearchDisabled =
    !origin ||
    !destination ||
    !departureDate ||
    (
      tripType ===
        'round-trip' &&
      !returnDate
    );

  return (
    <section className="gt-travel-plan">

      <div className="gt-travel-plan-hero">

        <div className="gt-travel-plan-hero-overlay" />

        <div className="gt-travel-plan-hero-inner">

          <span className="gt-travel-plan-eyebrow">
            GLOBALTOUR
          </span>

          <h1>
            {t(
              'travelPlan.form.hero.titleLine1',
            )}

            <br />

            {t(
              'travelPlan.form.hero.titleLine2',
            )}
          </h1>

          <p>
            {t(
              'travelPlan.form.hero.description',
            )}
          </p>

        </div>

      </div>

      <div className="gt-travel-plan-search-section">

        <div className="gt-travel-plan-search-shell">

          <div className="gt-travel-plan-search-heading">

            <div>

              <span>
                {t(
                  'travelPlan.form.search.eyebrow',
                )}
              </span>

              <strong>
                {t(
                  'travelPlan.form.search.title',
                )}
              </strong>

            </div>

          </div>

          <div className="gt-travel-plan-trip-type">

            <button
              type="button"
              className={
                tripType ===
                'round-trip'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                handleTripTypeChange(
                  'round-trip',
                )
              }
            >
              {t(
                'travelPlan.form.tripType.roundTrip',
              )}
            </button>

            <button
              type="button"
              className={
                tripType ===
                'one-way'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                handleTripTypeChange(
                  'one-way',
                )
              }
            >
              {t(
                'travelPlan.form.tripType.oneWay',
              )}
            </button>

          </div>

          <form
            className="gt-travel-plan-form"
            onSubmit={
              handleSubmit
            }
          >

            <div className="gt-travel-plan-search-row">

              <div className="gt-travel-plan-field">

                <span className="gt-travel-plan-field-label">
                  {t(
                    'travelPlan.form.fields.origin',
                  )}
                </span>

                <DestinationAutocomplete
                  label=""
                  placeholder={t(
                    'forms.flights.originPlaceholder',
                  )}
                  value={
                    origin
                  }
                  onChange={
                    setOrigin
                  }
                  excludeIata={
                    destination?.cityIata
                  }
                />

              </div>

              <button
                type="button"
                className="gt-travel-plan-swap"
                aria-label={t(
                  'travelPlan.form.fields.swap',
                )}
                onClick={
                  handleSwapLocations
                }
                disabled={
                  !origin &&
                  !destination
                }
              >
                ⇄
              </button>

              <div className="gt-travel-plan-field">

                <span className="gt-travel-plan-field-label">
                  {t(
                    'travelPlan.form.fields.destination',
                  )}
                </span>

                <DestinationAutocomplete
                  label=""
                  placeholder={t(
                    'forms.flights.destinationPlaceholder',
                  )}
                  value={
                    destination
                  }
                  onChange={
                    setDestination
                  }
                  excludeIata={
                    origin?.cityIata
                  }
                />

              </div>

              <label className="gt-travel-plan-field">

                <span className="gt-travel-plan-field-label">
                  {t(
                    'travelPlan.form.fields.departure',
                  )}
                </span>

                <input
                  type="date"
                  value={
                    departureDate
                  }
                  aria-label={t(
                    'travelPlan.form.fields.departureAria',
                  )}
                  onChange={(
                    event,
                  ) =>
                    handleDepartureDateChange(
                      event.target.value,
                    )
                  }
                />

              </label>

              {tripType ===
                'round-trip' && (
                <label className="gt-travel-plan-field">

                  <span className="gt-travel-plan-field-label">
                    {t(
                      'travelPlan.form.fields.return',
                    )}
                  </span>

                  <input
                    type="date"
                    value={
                      returnDate
                    }
                    min={
                      departureDate ||
                      undefined
                    }
                    aria-label={t(
                      'travelPlan.form.fields.returnAria',
                    )}
                    onChange={(
                      event,
                    ) =>
                      setReturnDate(
                        event.target.value,
                      )
                    }
                  />

                </label>
              )}

              <button
                type="submit"
                className="gt-travel-plan-search-button"
                disabled={
                  isSearchDisabled
                }
              >
                {t(
                  'travelPlan.form.search.button',
                )}
              </button>

            </div>

          </form>

        </div>

      </div>

    </section>
  );
}

export default TravelPlanSearchForm;
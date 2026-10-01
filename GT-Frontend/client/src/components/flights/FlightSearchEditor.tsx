import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import DestinationAutocomplete from '../destinations/DestinationAutocomplete';
import { getDestinationByIata } from '../../services/destinations.service';
import { useCurrency } from '../../hooks/useCurrency';

import type { Destination } from '../../types/destination.types';

interface FlightSearchEditorProps {
  initialOriginIata: string;
  initialDestinationIata: string;
  initialDepartureAt?: string | null;
  initialReturnAt?: string | null;
}

type TripType = 'round-trip' | 'one-way';

function FlightSearchEditor({
  initialOriginIata,
  initialDestinationIata,
  initialDepartureAt,
  initialReturnAt,
}: FlightSearchEditorProps) {
  const navigate = useNavigate();

  const { t } = useTranslation();

  const { selectedCurrency } = useCurrency();

  const [isOpen, setIsOpen] =
    useState(false);

  const [isInitializing, setIsInitializing] =
    useState(true);

  const [origin, setOrigin] =
    useState<Destination | null>(null);

  const [destination, setDestination] =
    useState<Destination | null>(null);

  const [departureDate, setDepartureDate] =
    useState(
      initialDepartureAt || '',
    );

  const [returnDate, setReturnDate] =
    useState(
      initialReturnAt || '',
    );

  const [tripType, setTripType] =
    useState<TripType>(
      initialReturnAt
        ? 'round-trip'
        : 'one-way',
    );

  useEffect(() => {
    let isCancelled = false;

    const loadDestinations =
      async () => {
        try {
          setIsInitializing(true);

          const [
            originDestination,
            destinationDestination,
          ] = await Promise.all([
            getDestinationByIata(
              initialOriginIata,
            ),

            getDestinationByIata(
              initialDestinationIata,
            ),
          ]);

          if (isCancelled) {
            return;
          }

          setOrigin(
            originDestination,
          );

          setDestination(
            destinationDestination,
          );
        } catch (error) {
          if (isCancelled) {
            return;
          }

          console.error(
            'Error loading search destinations:',
            error,
          );
        } finally {
          if (!isCancelled) {
            setIsInitializing(
              false,
            );
          }
        }
      };

    void loadDestinations();

    return () => {
      isCancelled = true;
    };
  }, [
    initialOriginIata,
    initialDestinationIata,
  ]);

  const handleTripTypeChange = (
    value: TripType,
  ) => {
    setTripType(value);

    if (
      value ===
      'one-way'
    ) {
      setReturnDate('');
    }
  };

  const handleDepartureDateChange =
    (
      value: string,
    ) => {
      setDepartureDate(
        value,
      );

      if (
        returnDate &&
        returnDate <
          value
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

    const params =
      new URLSearchParams({
        origin:
          origin.cityIata,

        destination:
          destination.cityIata,

        departureAt:
          departureDate,

        currency:
          selectedCurrency,
      });

    if (
      tripType ===
        'round-trip' &&
      returnDate
    ) {
      params.set(
        'returnAt',
        returnDate,
      );
    }

    navigate(
      `/flights?${params.toString()}`,
    );

    setIsOpen(false);
  };

  const isSearchDisabled =
    isInitializing ||
    !origin ||
    !destination ||
    !departureDate ||
    (
      tripType ===
        'round-trip' &&
      !returnDate
    );

  return (
    <section className="flight-search-editor">

      <button
        type="button"
        className="flight-search-edit-button"
        onClick={() =>
          setIsOpen(
            (current) =>
              !current,
          )
        }
      >
        {isOpen
          ? t(
              'forms.flights.editor.closeSearch',
            )
          : t(
              'forms.flights.editor.modifySearch',
            )}
      </button>

      {isOpen && (
        <form
          className="flight-search-edit-form"
          onSubmit={
            handleSubmit
          }
        >

          <div className="flight-search-edit-options">

            <select
              value={
                tripType
              }
              aria-label={t(
                'forms.flights.editor.tripType',
              )}
              onChange={(
                event,
              ) =>
                handleTripTypeChange(
                  event.target
                    .value as TripType,
                )
              }
            >
              <option value="round-trip">
                {t(
                  'forms.flights.editor.roundTrip',
                )}
              </option>

              <option value="one-way">
                {t(
                  'forms.flights.editor.oneWay',
                )}
              </option>
            </select>

          </div>

          <div className="flight-search-edit-fields">

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
              excludeIata={
                destination?.cityIata
              }
            />

            <button
              type="button"
              className="swap-button"
              aria-label={t(
                'forms.flights.editor.swapLocations',
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
              excludeIata={
                origin?.cityIata
              }
            />

            <label className="search-box search-date">

              <span>
                {t(
                  'forms.flights.editor.departure',
                )}
              </span>

              <input
                type="date"
                value={
                  departureDate
                }
                aria-label={t(
                  'forms.flights.editor.departureAria',
                )}
                onChange={(
                  event,
                ) =>
                  handleDepartureDateChange(
                    event.target
                      .value,
                  )
                }
              />

            </label>

            {tripType ===
              'round-trip' && (
              <label className="search-box search-date">

                <span>
                  {t(
                    'forms.flights.editor.return',
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
                    'forms.flights.editor.returnAria',
                  )}
                  onChange={(
                    event,
                  ) =>
                    setReturnDate(
                      event.target
                        .value,
                    )
                  }
                />

              </label>
            )}

            <button
              type="submit"
              className="search-button"
              disabled={
                isSearchDisabled
              }
            >
              {t(
                'forms.flights.editor.search',
              )}
            </button>

          </div>
        </form>
      )}

    </section>
  );
}

export default FlightSearchEditor;
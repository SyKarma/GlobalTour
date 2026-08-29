import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

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
    useState(initialDepartureAt || '');

  const [returnDate, setReturnDate] =
    useState(initialReturnAt || '');

  const [tripType, setTripType] =
    useState<TripType>(
      initialReturnAt
        ? 'round-trip'
        : 'one-way',
    );

  useEffect(() => {
    let isCancelled = false;

    const loadDestinations = async () => {
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
          'Error cargando los destinos de la búsqueda:',
          error,
        );
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
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

    if (value === 'one-way') {
      setReturnDate('');
    }
  };

  const handleDepartureDateChange = (
    value: string,
  ) => {
    setDepartureDate(value);

    if (
      returnDate &&
      returnDate < value
    ) {
      setReturnDate('');
    }
  };

  const handleSwapLocations = () => {
    const previousOrigin = origin;

    setOrigin(destination);
    setDestination(previousOrigin);
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
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
      tripType === 'round-trip' &&
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
      tripType === 'round-trip' &&
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
      tripType === 'round-trip' &&
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
          ? 'Cerrar búsqueda'
          : 'Modificar búsqueda'}
      </button>

      {isOpen && (
        <form
          className="flight-search-edit-form"
          onSubmit={handleSubmit}
        >
          <div className="flight-search-edit-options">
            <select
              value={tripType}
              aria-label="Tipo de viaje"
              onChange={(event) =>
                handleTripTypeChange(
                  event.target
                    .value as TripType,
                )
              }
            >
              <option value="round-trip">
                Ida y vuelta
              </option>

              <option value="one-way">
                Solo ida
              </option>
            </select>
          </div>

          <div className="flight-search-edit-fields">
            <DestinationAutocomplete
              label="Origen"
              placeholder="¿Desde dónde viajas?"
              value={origin}
              onChange={setOrigin}
              excludeIata={
                destination?.cityIata
              }
            />

            <button
              type="button"
              className="swap-button"
              aria-label="Intercambiar origen y destino"
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
              label="Destino"
              placeholder="¿A dónde quieres ir?"
              value={destination}
              onChange={setDestination}
              excludeIata={
                origin?.cityIata
              }
            />

            <label className="search-box search-date">
              <span>
                Salida
              </span>

              <input
                type="date"
                value={
                  departureDate
                }
                aria-label="Fecha de salida"
                onChange={(event) =>
                  handleDepartureDateChange(
                    event.target.value,
                  )
                }
              />
            </label>

            {tripType ===
              'round-trip' && (
              <label className="search-box search-date">
                <span>
                  Regreso
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
                  aria-label="Fecha de regreso"
                  onChange={(event) =>
                    setReturnDate(
                      event.target.value,
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
              Buscar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default FlightSearchEditor;
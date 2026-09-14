import {
  useState,
  type FormEvent,
} from 'react';

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
  ] = useState<Destination | null>(
    null,
  );

  const [
    destination,
    setDestination,
  ] = useState<Destination | null>(
    null,
  );

  const [
    departureDate,
    setDepartureDate,
  ] = useState('');

  const [
    returnDate,
    setReturnDate,
  ] = useState('');

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

    onSearch({
      origin: origin.cityIata,
      destination: destination.cityIata,
      departureAt: departureDate,
      returnAt:
        tripType === 'round-trip'
          ? returnDate
          : undefined,
      currency: selectedCurrency,
    });
  };

  const isSearchDisabled =
    !origin ||
    !destination ||
    !departureDate ||
    (
      tripType === 'round-trip' &&
      !returnDate
    );

  return (
    <section className="gt-travel-plan">

      {/* HERO */}
      <div className="gt-travel-plan-hero">
        <div className="gt-travel-plan-hero-overlay" />

        <div className="gt-travel-plan-hero-inner">
          <span className="gt-travel-plan-eyebrow">
            GLOBALTOUR
          </span>

          <h1>
            Planifica tu viaje
            <br />
            desde un solo lugar
          </h1>

          <p>
            Encuentra tu vuelo y organiza los
            servicios que necesitas para disfrutar
            tu viaje.
          </p>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="gt-travel-plan-search-section">
        <div className="gt-travel-plan-search-shell">

          <div className="gt-travel-plan-search-heading">
            <div>
              <span>
                PLAN DE VIAJE
              </span>

              <strong>
                Busca tu próxima aventura
              </strong>
            </div>
          </div>

          <div className="gt-travel-plan-trip-type">

            <button
              type="button"
              className={
                tripType === 'round-trip'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                handleTripTypeChange(
                  'round-trip',
                )
              }
            >
              Ida y vuelta
            </button>

            <button
              type="button"
              className={
                tripType === 'one-way'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                handleTripTypeChange(
                  'one-way',
                )
              }
            >
              Solo ida
            </button>

          </div>

          <form
            className="gt-travel-plan-form"
            onSubmit={handleSubmit}
          >

            <div className="gt-travel-plan-search-row">

              {/* ORIGEN */}
              <div className="gt-travel-plan-field">
                <span className="gt-travel-plan-field-label">
                  ORIGEN
                </span>

                <DestinationAutocomplete
                  label=""
                  placeholder="¿Desde dónde viajas?"
                  value={origin}
                  onChange={setOrigin}
                  excludeIata={
                    destination?.cityIata
                  }
                />
              </div>

              {/* INTERCAMBIAR */}
              <button
                type="button"
                className="gt-travel-plan-swap"
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

              {/* DESTINO */}
              <div className="gt-travel-plan-field">
                <span className="gt-travel-plan-field-label">
                  DESTINO
                </span>

                <DestinationAutocomplete
                  label=""
                  placeholder="¿A dónde quieres ir?"
                  value={destination}
                  onChange={setDestination}
                  excludeIata={
                    origin?.cityIata
                  }
                />
              </div>

              {/* SALIDA */}
              <label className="gt-travel-plan-field">
                <span className="gt-travel-plan-field-label">
                  SALIDA
                </span>

                <input
                  type="date"
                  value={departureDate}
                  aria-label="Fecha de salida"
                  onChange={(event) =>
                    handleDepartureDateChange(
                      event.target.value,
                    )
                  }
                />
              </label>

              {/* REGRESO */}
              {tripType === 'round-trip' && (
                <label className="gt-travel-plan-field">
                  <span className="gt-travel-plan-field-label">
                    REGRESO
                  </span>

                  <input
                    type="date"
                    value={returnDate}
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

              {/* BUSCAR */}
              <button
                type="submit"
                className="gt-travel-plan-search-button"
                disabled={
                  isSearchDisabled
                }
              >
                Buscar vuelos
              </button>

            </div>

          </form>

        </div>
      </div>

    </section>
  );
}

export default TravelPlanSearchForm;
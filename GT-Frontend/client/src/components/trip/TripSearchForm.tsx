import { useState, type FormEvent } from 'react';
import DestinationAutocomplete from '../destinations/DestinationAutocomplete';
import type { Destination } from '../../types/destination.types';

type TripType = 'round-trip' | 'one-way';

function TripSearchForm() {
  const [tripType, setTripType] =
    useState<TripType>('round-trip');

  const [origin, setOrigin] =
    useState<Destination | null>(null);

  const [destination, setDestination] =
    useState<Destination | null>(null);

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!origin || !destination) {
      return;
    }

    console.log({
      origin: origin.cityIata,
      destination: destination.cityIata,
      tripType,
    });
  };

  const handleSwapLocations = () => {
    const previousOrigin = origin;

    setOrigin(destination);
    setDestination(previousOrigin);
  };

  return (
    <form
      className="trip-search"
      onSubmit={handleSubmit}
    >
      <div className="search-options">
        <select
          value={tripType}
          onChange={(event) =>
            setTripType(
              event.target.value as TripType,
            )
          }
          aria-label="Tipo de viaje"
        >
          <option value="round-trip">
            Ida y vuelta
          </option>

          <option value="one-way">
            Solo ida
          </option>
        </select>

        <select aria-label="Clase">
          <option value="economy">
            Económica
          </option>

          <option value="premium">
            Premium Economy
          </option>

          <option value="business">
            Business
          </option>

          <option value="first">
            Primera clase
          </option>
        </select>
      </div>

      <div className="main-search-row">
        <DestinationAutocomplete
          label="Origen"
          placeholder="¿Desde dónde viajas?"
          value={origin}
          onChange={setOrigin}
          excludeIata={destination?.cityIata}
        />

        <button
          type="button"
          className="swap-button"
          aria-label="Intercambiar origen y destino"
          onClick={handleSwapLocations}
          disabled={!origin && !destination}
        >
          ⇄
        </button>

        <DestinationAutocomplete
          label="Destino"
          placeholder="¿A dónde quieres ir?"
          value={destination}
          onChange={setDestination}
          excludeIata={origin?.cityIata}
        />

        <label className="search-box search-date">
          <span>Salida</span>

          <input
            type="date"
            aria-label="Fecha de salida"
          />
        </label>

        {tripType === 'round-trip' && (
          <label className="search-box search-date">
            <span>Regreso</span>

            <input
              type="date"
              aria-label="Fecha de regreso"
            />
          </label>
        )}

        <label className="search-box search-travelers">
          <span>Viajeros</span>

          <select
            defaultValue="1"
            aria-label="Cantidad de viajeros"
          >
            <option value="1">1 viajero</option>
            <option value="2">2 viajeros</option>
            <option value="3">3 viajeros</option>
            <option value="4">4 viajeros</option>
            <option value="5">5 viajeros</option>
          </select>
        </label>

        <button
          className="search-button"
          type="submit"
          disabled={!origin || !destination}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}

export default TripSearchForm;
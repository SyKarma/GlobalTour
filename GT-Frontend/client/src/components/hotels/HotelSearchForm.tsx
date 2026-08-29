import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import DestinationAutocomplete from '../destinations/DestinationAutocomplete';
import { useCurrency } from '../../hooks/useCurrency';

import type { Destination } from '../../types/destination.types';

function HotelSearchForm() {
  const navigate = useNavigate();

  const { selectedCurrency } = useCurrency();

  const [destination, setDestination] =
    useState<Destination | null>(null);

  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState('2');

  const handleCheckinChange = (value: string) => {
    setCheckin(value);

    if (checkout && checkout <= value) {
      setCheckout('');
    }
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !destination ||
      !checkin ||
      !checkout
    ) {
      return;
    }

    const params = new URLSearchParams({
      cityName: destination.cityName,
      countryCode: destination.countryCode,
      checkin,
      checkout,
      adults,
      currency: selectedCurrency,
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
      onSubmit={handleSubmit}
    >
      <div className="hotel-search-row">
        <DestinationAutocomplete
          label="Destino"
          placeholder="¿Dónde quieres hospedarte?"
          value={destination}
          onChange={setDestination}
        />

        <label className="search-box search-date">
          <span>Check-in</span>

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
          <span>Check-out</span>

          <input
            type="date"
            aria-label="Fecha de check-out"
            value={checkout}
            min={checkin || undefined}
            onChange={(event) =>
              setCheckout(
                event.target.value,
              )
            }
          />
        </label>

        <label className="search-box search-travelers">
          <span>Huéspedes</span>

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
          disabled={isSearchDisabled}
        >
          Buscar hoteles
        </button>
      </div>
    </form>
  );
}

export default HotelSearchForm;
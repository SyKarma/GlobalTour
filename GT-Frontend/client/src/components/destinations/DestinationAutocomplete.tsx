import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
} from 'react';
import { searchDestinations } from '../../services/destinations.service';
import type { Destination } from '../../types/destination.types';

interface DestinationAutocompleteProps {
  label: string;
  placeholder: string;
  value: Destination | null;
  onChange: (destination: Destination | null) => void;
  excludeIata?: string;
}

const DEBOUNCE_DELAY = 300;
const RESULT_LIMIT = 6;

function DestinationAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  excludeIata,
}: DestinationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Destination[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const selectedText = value
    ? `${value.cityName}, ${value.countryName}`
    : '';

  const inputValue =
    value && !isEditing ? selectedText : query;

  const scheduleSearch = (searchTerm: string) => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    setIsLoading(true);

    const requestId = ++requestIdRef.current;

    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await searchDestinations({
          q: searchTerm.trim() || undefined,
          limit: RESULT_LIMIT,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        const filteredResults = response.data.filter(
          (destination) =>
            destination.cityIata !== excludeIata,
        );

        setResults(filteredResults);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error(
          'Error al buscar destinos:',
          error,
        );

        setResults([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_DELAY);
  };

  const handleFocus = (
    event: FocusEvent<HTMLInputElement>,
  ) => {
    setIsOpen(true);

    // Muestra destinos destacados al abrir.
    scheduleSearch('');

    // Si ya había un destino seleccionado,
    // escribir reemplazará fácilmente el texto.
    event.currentTarget.select();
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    setIsEditing(true);
    setIsOpen(true);

    if (value) {
      onChange(null);
    }

    scheduleSearch(text);
  };

  const handleSelect = (destination: Destination) => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    requestIdRef.current += 1;

    onChange(destination);
    setQuery('');
    setResults([]);
    setIsEditing(false);
    setIsLoading(false);
    setIsOpen(false);
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      setIsOpen(false);
      setIsEditing(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="destination-autocomplete">
      <label className="search-box search-location">
        <span>{label}</span>

        <div className="search-value">
          {value && !isEditing && (
            <strong>{value.cityIata}</strong>
          )}

          <input
            type="text"
            value={inputValue}
            placeholder={placeholder}
            autoComplete="off"
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={(event) =>
              handleInputChange(event.target.value)
            }
          />
        </div>
      </label>

      {isOpen && (
        <div className="destination-dropdown">
          {isLoading ? (
            <div className="destination-empty">
              Buscando destinos...
            </div>
          ) : results.length > 0 ? (
            results.map((destination) => (
              <button
                key={destination.id}
                type="button"
                className="destination-option"
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={() =>
                  handleSelect(destination)
                }
              >
                <span className="destination-option-iata">
                  {destination.cityIata}
                </span>

                <span className="destination-option-info">
                  <strong>
                    {destination.cityName}
                  </strong>

                  <small>
                    {destination.countryName}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <div className="destination-empty">
              No se encontraron destinos.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DestinationAutocomplete;
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useTranslation,
} from 'react-i18next';

import {
  searchDestinations,
} from '../../services/destinations.service';

import type {
  Destination,
} from '../../types/destination.types';

interface DestinationAutocompleteProps {
  label: string;

  placeholder?: string;

  value:
    | Destination
    | null;

  onChange: (
    destination:
      | Destination
      | null,
  ) => void;

  /*
   * Permite excluir un destino.
   *
   * Ejemplo:
   * Si SJO está seleccionado como origen,
   * no debe aparecer como opción de destino.
   */
  excludeIata?: string;
}

function DestinationAutocomplete({
  label,
  placeholder = '',
  value,
  onChange,
  excludeIata,
}: DestinationAutocompleteProps) {
  const {
    t,
  } = useTranslation();

  const [
    query,
    setQuery,
  ] = useState('');

  const [
    results,
    setResults,
  ] = useState<
    Destination[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(false);

  const blurTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  /*
   * =========================================
   * NORMALIZED EXCLUDED IATA
   * =========================================
   */

  const normalizedExcludeIata =
    excludeIata
      ?.trim()
      .toUpperCase();

  /*
   * =========================================
   * DISPLAY VALUE
   * =========================================
   *
   * No necesitamos sincronizar value con
   * query mediante useEffect.
   *
   * Si existe un destino seleccionado,
   * mostramos directamente la información
   * proveniente de la prop value.
   */

  const inputValue =
    value
      ? `${value.cityName} (${value.cityIata})`
      : query;

  /*
   * =========================================
   * SEARCH DESTINATIONS
   * =========================================
   */

  useEffect(() => {
    const cleanQuery =
      query.trim();

    /*
     * Si ya existe un destino seleccionado,
     * no necesitamos realizar una búsqueda.
     */
    if (value) {
      return;
    }

    /*
     * Para menos de dos caracteres no
     * realizamos solicitudes.
     *
     * La limpieza visual se realiza desde
     * handleInputChange para evitar setState
     * síncrono dentro del efecto.
     */
    if (
      cleanQuery.length <
      2
    ) {
      return;
    }

    let cancelled =
      false;

    const timeout =
      window.setTimeout(
        async () => {
          try {
            setIsLoading(
              true,
            );

            setError(
              false,
            );

            const response =
              await searchDestinations(
                {
                  q:
                    cleanQuery,

                  limit:
                    10,
                },
              );

            if (
              cancelled
            ) {
              return;
            }

            /*
             * Excluimos el IATA que ya está
             * utilizado en el otro campo.
             *
             * Ejemplo:
             * Origen = SJO
             * Destino no mostrará SJO.
             */
            const filteredResults =
              response.data.filter(
                (
                  destination,
                ) =>
                  !normalizedExcludeIata ||
                  destination.cityIata
                    .trim()
                    .toUpperCase() !==
                    normalizedExcludeIata,
              );

            setResults(
              filteredResults,
            );

            setIsOpen(
              true,
            );
          } catch (
            requestError
          ) {
            if (
              cancelled
            ) {
              return;
            }

            console.error(
              'Error searching destinations:',
              requestError,
            );

            setResults(
              [],
            );

            setError(
              true,
            );

            setIsOpen(
              true,
            );
          } finally {
            if (
              !cancelled
            ) {
              setIsLoading(
                false,
              );
            }
          }
        },
        250,
      );

    return () => {
      cancelled =
        true;

      window.clearTimeout(
        timeout,
      );
    };
  }, [
    query,
    value,
    normalizedExcludeIata,
  ]);

  /*
   * =========================================
   * INPUT CHANGE
   * =========================================
   */

  const handleInputChange = (
    newValue: string,
  ) => {
    /*
     * Si había un destino seleccionado
     * y el usuario comienza a escribir,
     * quitamos esa selección.
     */
    if (value) {
      onChange(
        null,
      );
    }

    setQuery(
      newValue,
    );

    setError(
      false,
    );

    const cleanValue =
      newValue.trim();

    /*
     * No mostramos resultados para
     * búsquedas demasiado cortas.
     */
    if (
      cleanValue.length <
      2
    ) {
      setResults(
        [],
      );

      setIsLoading(
        false,
      );

      setIsOpen(
        false,
      );

      return;
    }

    setIsOpen(
      true,
    );
  };

  /*
   * =========================================
   * SELECT DESTINATION
   * =========================================
   */

  const handleSelect = (
    destination:
      Destination,
  ) => {
    /*
     * Protección adicional por si una opción
     * excluida llegara a entrar en la lista.
     */
    if (
      normalizedExcludeIata &&
      destination.cityIata
        .trim()
        .toUpperCase() ===
        normalizedExcludeIata
    ) {
      return;
    }

    onChange(
      destination,
    );

    /*
     * query puede limpiarse porque el texto
     * visible se deriva directamente de value.
     */
    setQuery(
      '',
    );

    setResults(
      [],
    );

    setError(
      false,
    );

    setIsLoading(
      false,
    );

    setIsOpen(
      false,
    );
  };

  /*
   * =========================================
   * FOCUS / BLUR
   * =========================================
   */

  const handleBlur =
    () => {
      blurTimer.current =
        setTimeout(
          () => {
            setIsOpen(
              false,
            );
          },
          150,
        );
    };

  const handleFocus =
    () => {
      if (
        blurTimer.current
      ) {
        clearTimeout(
          blurTimer.current,
        );
      }

      if (
        results.length >
          0 ||
        isLoading ||
        error
      ) {
        setIsOpen(
          true,
        );
      }
    };

  /*
   * =========================================
   * RENDER
   * =========================================
   */

  return (
    <div className="destination-autocomplete">

      <label className="search-box destination-search-box">

        <span>
          {label}
        </span>

        <input
          type="text"
          value={
            inputValue
          }
          placeholder={
            placeholder
          }
          autoComplete="off"
          onChange={(
            event,
          ) =>
            handleInputChange(
              event.target
                .value,
            )
          }
          onFocus={
            handleFocus
          }
          onBlur={
            handleBlur
          }
        />

      </label>

      {isOpen && (
        <div className="destination-autocomplete-dropdown">

          {isLoading && (
            <div className="destination-autocomplete-status">
              {t(
                'forms.autocomplete.searching',
              )}
            </div>
          )}

          {!isLoading &&
            error && (
              <div className="destination-autocomplete-status destination-autocomplete-error">
                {t(
                  'forms.autocomplete.error',
                )}
              </div>
            )}

          {!isLoading &&
            !error &&
            query
              .trim()
              .length >=
              2 &&
            results.length ===
              0 && (
              <div className="destination-autocomplete-status">
                {t(
                  'forms.autocomplete.empty',
                )}
              </div>
            )}

          {!isLoading &&
            !error &&
            results.map(
              (
                destination,
              ) => (
                <button
                  type="button"
                  className="destination-autocomplete-option"
                  key={
                    destination.id ??
                    destination.cityIata
                  }
                  onMouseDown={(
                    event,
                  ) => {
                    /*
                     * Evitamos que blur cierre la lista
                     * antes de registrar el clic.
                     */
                    event.preventDefault();

                    handleSelect(
                      destination,
                    );
                  }}
                >

                  <span className="destination-autocomplete-city">

                    <strong>
                      {
                        destination.cityName
                      }
                    </strong>

                    <small>
                      {
                        destination.countryName
                      }
                    </small>

                  </span>

                  <span className="destination-autocomplete-iata">
                    {
                      destination.cityIata
                    }
                  </span>

                </button>
              ),
            )}

        </div>
      )}

    </div>
  );
}

export default DestinationAutocomplete;
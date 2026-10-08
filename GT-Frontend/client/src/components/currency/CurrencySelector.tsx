import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useTranslation,
} from 'react-i18next';

import {
  useCurrency,
} from '../../hooks/useCurrency';

function CurrencySelector() {
  const {
    t,
  } =
    useTranslation();

  const {
    currencies,
    selectedCurrency,
    setSelectedCurrency,
    isLoading,
    error,
  } =
    useCurrency();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(
      false,
    );

  const [
    search,
    setSearch,
  ] =
    useState('');

  const wrapperRef =
    useRef<HTMLDivElement>(
      null,
    );

  const selectedCurrencyData =
    currencies.find(
      (
        currency,
      ) =>
        currency.code ===
        selectedCurrency,
    );

  const filteredCurrencies =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (
        !normalizedSearch
      ) {
        return currencies;
      }

      return currencies.filter(
        (
          currency,
        ) => {
          const code =
            currency.code.toLowerCase();

          const name =
            currency.name.toLowerCase();

          return (
            code.includes(
              normalizedSearch,
            ) ||
            name.includes(
              normalizedSearch,
            )
          );
        },
      );
    }, [
      currencies,
      search,
    ]);

  useEffect(() => {
    const handleClickOutside = (
      event:
        MouseEvent,
    ) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(
          false,
        );

        setSearch('');
      }
    };

    const handleEscape = (
      event:
        KeyboardEvent,
    ) => {
      if (
        event.key ===
        'Escape'
      ) {
        setIsOpen(
          false,
        );

        setSearch('');
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );

    document.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );

      document.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, []);

  const handleSelectCurrency = (
    currencyCode:
      string,
  ) => {
    setSelectedCurrency(
      currencyCode,
    );

    setSearch('');

    setIsOpen(
      false,
    );
  };

  return (
    <div
      className="currency-selector-wrapper"
      ref={
        wrapperRef
      }
    >
      <span className="currency-selector-label">
        {t(
          'currencySelector.label',
        )}
      </span>

      <div
        className={`currency-select-control ${
          error
            ? 'currency-select-error'
            : ''
        }`}
        title={
          error ??
          undefined
        }
      >
        <button
          type="button"
          className="currency-selector-trigger"
          onClick={() => {
            if (
              !isLoading
            ) {
              setIsOpen(
                (
                  current,
                ) =>
                  !current,
              );

              setSearch('');
            }
          }}
          disabled={
            isLoading
          }
          aria-label={t(
            'currencySelector.selectAria',
          )}
          aria-haspopup="listbox"
          aria-expanded={
            isOpen
          }
        >
          <svg
            className="currency-selector-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />

            <path
              d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9M12 3c-2.4 2.5-3.6 5.5-3.6 9s1.2 6.5 3.6 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <span className="currency-selector-current">
            {selectedCurrencyData?.code ??
              selectedCurrency}
          </span>

          <svg
            className={`currency-selector-chevron ${
              isOpen
                ? 'currency-selector-chevron-open'
                : ''
            }`}
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              d="M6 8l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isOpen &&
          !isLoading && (
          <div className="currency-dropdown">

            <div className="currency-search-wrapper">

              <svg
                className="currency-search-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="M16.5 16.5L21 21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              <input
                type="text"
                className="currency-search-input"
                placeholder={t(
                  'currencySelector.searchPlaceholder',
                )}
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }
                autoFocus
                aria-label={t(
                  'currencySelector.searchAria',
                )}
              />

            </div>

            <div
              className="currency-options-list"
              role="listbox"
              aria-label={t(
                'currencySelector.availableAria',
              )}
            >
              {filteredCurrencies.length >
              0 ? (
                filteredCurrencies.map(
                  (
                    currency,
                  ) => {
                    const isSelected =
                      currency.code ===
                      selectedCurrency;

                    return (
                      <button
                        key={
                          currency.code
                        }
                        type="button"
                        className={`currency-option ${
                          isSelected
                            ? 'currency-option-selected'
                            : ''
                        }`}
                        onClick={() =>
                          handleSelectCurrency(
                            currency.code,
                          )
                        }
                        role="option"
                        aria-selected={
                          isSelected
                        }
                      >
                        <span className="currency-option-code">
                          {
                            currency.code
                          }
                        </span>

                        <span className="currency-option-name">
                          {
                            currency.name
                          }
                        </span>

                        {isSelected && (
                          <svg
                            className="currency-option-check"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              d="M5 10.5l3 3 7-7"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}

                      </button>
                    );
                  },
                )
              ) : (
                <div className="currency-no-results">
                  {t(
                    'currencySelector.noResults',
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default CurrencySelector;
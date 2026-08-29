import { useCurrency } from '../../hooks/useCurrency';

function CurrencySelector() {
  const {
    currencies,
    selectedCurrency,
    setSelectedCurrency,
    isLoading,
    error,
  } = useCurrency();

  return (
    <div className="currency-selector-wrapper">
      <span className="currency-selector-label">
        Moneda
      </span>

      <div
        className={`currency-select-control ${
          error ? 'currency-select-error' : ''
        }`}
        title={error ?? undefined}
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

        <select
          className="currency-selector"
          value={selectedCurrency}
          onChange={(event) =>
            setSelectedCurrency(event.target.value)
          }
          disabled={isLoading}
          aria-label="Seleccionar moneda"
        >
          {isLoading && currencies.length === 0 ? (
            <option value={selectedCurrency}>
              {selectedCurrency}
            </option>
          ) : (
            currencies.map((currency) => (
              <option
                key={currency.code}
                value={currency.code}
              >
                {currency.code} — {currency.name}
              </option>
            ))
          )}
        </select>

        <svg
          className="currency-selector-chevron"
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
      </div>
    </div>
  );
}

export default CurrencySelector;
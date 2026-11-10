import {
  useState,
  type FormEvent,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useTranslation,
} from 'react-i18next';

/*
 * Quick search used in the home "Explorar" panel for
 * restaurants and car rentals. It builds the same URL as the
 * full search pages, so they open with the results loaded.
 */

type PlaceSearchKind =
  | 'restaurants'
  | 'cars';

interface PlaceSearchConfig {
  route: string;
  radius: number;
  typeLabelKey: string;
  typeOptions: Array<{
    value: string;
    labelKey: string;
  }>;
  extraParam: string;
  extraLabelKey: string;
  extraPlaceholderKey: string;
}

const CONFIG: Record<
  PlaceSearchKind,
  PlaceSearchConfig
> = {
  restaurants: {
    route:
      '/restaurants',
    radius:
      4000,
    typeLabelKey:
      'restaurants.search.placeType',
    typeOptions: [
      {
        value:
          '',
        labelKey:
          'restaurants.search.types.all',
      },
      {
        value:
          'restaurant',
        labelKey:
          'restaurants.common.types.restaurant',
      },
      {
        value:
          'cafe',
        labelKey:
          'restaurants.common.types.cafe',
      },
      {
        value:
          'fast_food',
        labelKey:
          'restaurants.common.types.fastFood',
      },
    ],
    extraParam:
      'cuisine',
    extraLabelKey:
      'restaurants.search.cuisine',
    extraPlaceholderKey:
      'restaurants.search.cuisinePlaceholder',
  },
  cars: {
    route:
      '/cars',
    radius:
      8000,
    typeLabelKey:
      'cars.search.service',
    typeOptions: [
      {
        value:
          '',
        labelKey:
          'cars.search.services.all',
      },
      {
        value:
          'car_rental',
        labelKey:
          'cars.common.types.carRental',
      },
      {
        value:
          'car_sharing',
        labelKey:
          'cars.common.types.carSharing',
      },
    ],
    extraParam:
      'q',
    extraLabelKey:
      'cars.search.company',
    extraPlaceholderKey:
      'cars.search.companyPlaceholder',
  },
};

interface PlaceQuickSearchFormProps {
  kind: PlaceSearchKind;
}

function PlaceQuickSearchForm({
  kind,
}: PlaceQuickSearchFormProps) {
  const navigate =
    useNavigate();

  const {
    t,
  } =
    useTranslation();

  const config =
    CONFIG[kind];

  const [
    cityName,
    setCityName,
  ] =
    useState('');

  const [
    type,
    setType,
  ] =
    useState('');

  const [
    extra,
    setExtra,
  ] =
    useState('');

  const cleanCity =
    cityName.trim();

  const isSearchDisabled =
    cleanCity.length <
    2;

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      isSearchDisabled
    ) {
      return;
    }

    const params =
      new URLSearchParams();

    params.set(
      'cityName',
      cleanCity,
    );

    params.set(
      'radius',
      String(
        config.radius,
      ),
    );

    if (type) {
      params.set(
        'type',
        type,
      );
    }

    const cleanExtra =
      extra.trim();

    if (cleanExtra) {
      params.set(
        config.extraParam,
        cleanExtra,
      );
    }

    navigate(
      `${config.route}?${params.toString()}`,
    );
  };

  return (
    <form
      className="place-search"
      onSubmit={
        handleSubmit
      }
    >
      <div className="place-search-row">

        <label className="search-box search-city">

          <span>
            {t(
              `${kind}.search.city`,
            )}
          </span>

          <input
            type="text"
            value={
              cityName
            }
            maxLength={
              80
            }
            autoComplete="off"
            placeholder={t(
              `${kind}.search.cityPlaceholder`,
            )}
            onChange={(
              event,
            ) =>
              setCityName(
                event.target
                  .value,
              )
            }
          />

        </label>

        <label className="search-box">

          <span>
            {t(
              config.typeLabelKey,
            )}
          </span>

          <select
            value={
              type
            }
            onChange={(
              event,
            ) =>
              setType(
                event.target
                  .value,
              )
            }
          >
            {config.typeOptions.map(
              (
                option,
              ) => (
                <option
                  key={
                    option.value ||
                    'all'
                  }
                  value={
                    option.value
                  }
                >
                  {t(
                    option.labelKey,
                  )}
                </option>
              ),
            )}
          </select>

        </label>

        <label className="search-box">

          <span>
            {t(
              config.extraLabelKey,
            )}
          </span>

          <input
            type="text"
            value={
              extra
            }
            maxLength={
              60
            }
            autoComplete="off"
            placeholder={t(
              config.extraPlaceholderKey,
            )}
            onChange={(
              event,
            ) =>
              setExtra(
                event.target
                  .value,
              )
            }
          />

        </label>

        <button
          type="submit"
          className="search-button"
          disabled={
            isSearchDisabled
          }
        >
          {t(
            `home.search.${kind}.button`,
          )}
        </button>

      </div>
    </form>
  );
}

export default PlaceQuickSearchForm;

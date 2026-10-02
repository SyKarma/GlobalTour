import {
  useTranslation,
} from 'react-i18next';

const languages = [
  {
    code: 'es',
    short: 'ES',
    label: 'Español',
  },
  {
    code: 'en',
    short: 'EN',
    label: 'English',
  },
  {
    code: 'pt',
    short: 'PT',
    label: 'Português',
  },
];

function LanguageSelector() {
  const {
    i18n,
  } =
    useTranslation();

  const currentLanguage =
    i18n.resolvedLanguage
      ?.split('-')[0] ||
    i18n.language
      ?.split('-')[0] ||
    'es';

  const selectedLanguage =
    languages.find(
      (language) =>
        language.code ===
        currentLanguage,
    ) ??
    languages[0];

  return (
    <div className="gt-language-selector">

      <span
        className="gt-language-globe"
        aria-hidden="true"
      >
        ◉
      </span>

      <span className="gt-language-code">
        {
          selectedLanguage.short
        }
      </span>

      <select
        className="gt-language-select"
        value={
          currentLanguage
        }
        onChange={(
          event,
        ) => {
          void i18n.changeLanguage(
            event.target.value,
          );
        }}
        aria-label="Language"
      >
        {languages.map(
          (
            language,
          ) => (
            <option
              key={
                language.code
              }
              value={
                language.code
              }
            >
              {
                language.label
              }
            </option>
          ),
        )}
      </select>

    </div>
  );
}

export default LanguageSelector;
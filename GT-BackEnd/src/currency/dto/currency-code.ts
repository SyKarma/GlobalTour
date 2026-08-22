import { Matches } from 'class-validator';

export const ISO_CURRENCY = /^[A-Z]{3}$/;

export function IsCurrencyCode() {
  return Matches(ISO_CURRENCY, {
    message: 'must be a 3-letter ISO 4217 currency code',
  });
}

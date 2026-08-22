import { Matches } from 'class-validator';

export const IATA_CODE = /^[A-Z]{3}$/;

export function IsIataCode() {
  return Matches(IATA_CODE, {
    message: 'must be a 3-letter IATA city or airport code',
  });
}

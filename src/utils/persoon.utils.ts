import { Persoon } from '../types/api.types'

export function getVolledigeNaam(persoon: Persoon): string {
  const delen = [
    persoon.roepnaam || persoon.voornamen,
    persoon.tussenvoegsel,
    persoon.achternaam
  ].filter(Boolean)
  return delen.join(' ')
}
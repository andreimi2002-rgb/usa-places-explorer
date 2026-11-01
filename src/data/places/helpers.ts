import type { ISODate, SectionFact } from '../../types';

/** Date all Phase 3 sources were read. */
export const CHECKED: ISODate = '2026-11-01';

/** A sourced fact for a place section. `asOf` defaults to the date we checked it. */
export const fact = (label: string, value: string, sourceId: string, asOf: ISODate = CHECKED): SectionFact => ({
  label,
  value,
  sourceId,
  asOf,
});

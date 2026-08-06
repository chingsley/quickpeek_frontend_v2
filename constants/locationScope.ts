import { LocationScope } from '@/types/question.types';

export type LocationScopeTier = {
  scope: LocationScope;
  /** market config key holding this tier's radius in km (null for ANYWHERE). */
  configKey:
    | 'radiusExactSpotKm'
    | 'radiusWalkingKm'
    | 'radiusNeighbourhoodKm'
    | 'radiusCityKm'
    | null;
  label: string;
  helper: string;
};

/**
 * Who may respond to a location-pinned question, tightest first. Radii are
 * NOT hardcoded here — they resolve from market config (server is the source
 * of truth); this table carries labels, copy and the config keys.
 */
export const LOCATION_SCOPE_TIERS: LocationScopeTier[] = [
  {
    scope: 'EXACT_SPOT',
    configKey: 'radiusExactSpotKm',
    label: 'At this exact spot',
    helper: 'Only people right at this location can answer',
  },
  {
    scope: 'WALKING',
    configKey: 'radiusWalkingKm',
    label: 'A short walk away',
    helper: "Only people within a few minutes' walk can answer",
  },
  {
    scope: 'NEIGHBOURHOOD',
    configKey: 'radiusNeighbourhoodKm',
    label: 'In this neighbourhood',
    helper: 'Only people in the surrounding area can answer',
  },
  {
    scope: 'CITY',
    configKey: 'radiusCityKm',
    label: 'Anywhere in this city',
    helper: 'Anyone in this city or region can answer',
  },
  {
    scope: 'ANYWHERE',
    configKey: null,
    label: 'Anyone can answer',
    helper: 'Location is shown for context only.',
  },
];

/** 0.3 → "300 m", 1 → "1 km". */
export const formatScopeRadius = (radiusKm: number): string =>
  radiusKm < 1 ? `${Math.round(radiusKm * 1000)} m` : `${radiusKm} km`;

/** Question-detail summary radii — always kilometres, e.g. 0.3 → "0.3km". */
const formatScopeRadiusKm = (radiusKm: number): string => `${radiusKm}km`;

const RESPONSE_ZONE_NAMES: Record<LocationScope, string> = {
  EXACT_SPOT: 'at address',
  WALKING: 'walking distance',
  NEIGHBOURHOOD: 'neighbourhood',
  CITY: 'city',
  ANYWHERE: 'anywhere',
};

/**
 * Resolves the display radius for a scope. Prefers the API value (live market
 * config at request time); falls back to client market config when absent.
 */
export const resolveScopeRadiusKm = (
  scope: LocationScope,
  scopeRadiusKm?: number | null,
  radii?: Record<string, number> | null,
): number | null => {
  if (scope === 'ANYWHERE') return null;
  if (scopeRadiusKm != null) return scopeRadiusKm;
  const tier = LOCATION_SCOPE_TIERS.find((t) => t.scope === scope);
  if (!tier?.configKey || !radii) return null;
  const fallback = radii[tier.configKey];
  return fallback != null ? fallback : null;
};

/** Helper line for a tier with its concrete resolved radius baked in. */
export const scopeRadiusHelper = (
  scope: LocationScope,
  radii: Record<string, number>,
): string => {
  const tier = LOCATION_SCOPE_TIERS.find((t) => t.scope === scope)!;
  if (!tier.configKey) return tier.helper;
  return `${tier.helper} (within ${formatScopeRadius(radii[tier.configKey])}).`;
};

/** Question-detail allowed-response copy — e.g. "Allowed response zone: at address (within 0.3km)". */
export const LOCATION_SCOPE_SUMMARY_PREFIX = 'Allowed response zone: ';

/** Bold segment after the prefix — e.g. "at address (within 0.3km)" or "anywhere." */
export const getLocationScopeSummaryValue = (
  scope: LocationScope,
  radiusKm?: number | null,
  radii?: Record<string, number> | null,
): string => {
  const zoneName = RESPONSE_ZONE_NAMES[scope];
  if (!zoneName) return '';
  if (scope === 'ANYWHERE') return `${zoneName}.`;
  const resolvedRadius = resolveScopeRadiusKm(scope, radiusKm, radii);
  const radiusPart =
    resolvedRadius != null ? ` (within ${formatScopeRadiusKm(resolvedRadius)})` : '';
  return `${zoneName}${radiusPart}`;
};

export const formatLocationScopeSummary = (
  scope: LocationScope,
  radiusKm?: number | null,
  radii?: Record<string, number> | null,
): string => {
  const value = getLocationScopeSummaryValue(scope, radiusKm, radii);
  if (!value) return '';
  return `${LOCATION_SCOPE_SUMMARY_PREFIX}${value}`;
};

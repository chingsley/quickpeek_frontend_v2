import {
  formatLocationScopeSummary,
  formatScopeRadius,
  getLocationScopeSummaryValue,
  LOCATION_SCOPE_TIERS,
  resolveScopeRadiusKm,
  scopeRadiusHelper,
} from '@/constants/locationScope';

describe('location scope constants', () => {
  it('lists the five tiers in order with labels and helpers', () => {
    expect(LOCATION_SCOPE_TIERS.map((t) => t.scope)).toEqual([
      'EXACT_SPOT',
      'WALKING',
      'NEIGHBOURHOOD',
      'CITY',
      'ANYWHERE',
    ]);
    for (const tier of LOCATION_SCOPE_TIERS) {
      expect(tier.label).toBeTruthy();
      expect(tier.helper).toBeTruthy();
    }
    expect(LOCATION_SCOPE_TIERS[4].configKey).toBeNull();
  });
});

describe('formatScopeRadius', () => {
  it('renders metres under a kilometre', () => {
    expect(formatScopeRadius(0.3)).toBe('300 m');
    expect(formatScopeRadius(0.1)).toBe('100 m');
  });

  it('renders kilometres at and above one', () => {
    expect(formatScopeRadius(1)).toBe('1 km');
    expect(formatScopeRadius(25)).toBe('25 km');
  });
});

describe('scopeRadiusHelper', () => {
  const radii = {
    radiusExactSpotKm: 0.3,
    radiusWalkingKm: 1,
    radiusNeighbourhoodKm: 5,
    radiusCityKm: 25,
  };

  it('appends the concrete radius for gated tiers', () => {
    expect(scopeRadiusHelper('EXACT_SPOT', radii)).toBe(
      'Only people right at this location can answer (within 300 m).',
    );
    expect(scopeRadiusHelper('CITY', radii)).toContain('25 km');
  });

  it('returns the helper alone for ANYWHERE', () => {
    expect(scopeRadiusHelper('ANYWHERE', radii)).toBe(
      'Location is shown for context only.',
    );
  });
});

describe('resolveScopeRadiusKm', () => {
  const radii = {
    radiusExactSpotKm: 0.3,
    radiusWalkingKm: 1,
    radiusNeighbourhoodKm: 5,
    radiusCityKm: 25,
  };

  it('prefers the API value over client market config', () => {
    expect(resolveScopeRadiusKm('CITY', 30, radii)).toBe(30);
  });

  it('falls back to client market config when API value is absent', () => {
    expect(resolveScopeRadiusKm('NEIGHBOURHOOD', null, radii)).toBe(5);
    expect(resolveScopeRadiusKm('NEIGHBOURHOOD', undefined, radii)).toBe(5);
  });

  it('returns null for ANYWHERE', () => {
    expect(resolveScopeRadiusKm('ANYWHERE', null, radii)).toBeNull();
  });
});

describe('getLocationScopeSummaryValue', () => {
  it('returns the bold zone descriptor for each tier', () => {
    expect(getLocationScopeSummaryValue('EXACT_SPOT', 0.3)).toBe(
      'at address (within 0.3km)',
    );
    expect(getLocationScopeSummaryValue('WALKING', 1)).toBe(
      'walking distance (within 1km)',
    );
    expect(getLocationScopeSummaryValue('NEIGHBOURHOOD', 5)).toBe(
      'neighbourhood (within 5km)',
    );
    expect(getLocationScopeSummaryValue('CITY', 25)).toBe('city (within 25km)');
    expect(getLocationScopeSummaryValue('ANYWHERE')).toBe('anywhere.');
  });
});

describe('formatLocationScopeSummary', () => {
  it('shows allowed-response zone and radius for gated scopes', () => {
    expect(formatLocationScopeSummary('EXACT_SPOT', 0.3)).toBe(
      'Allowed response zone: at address (within 0.3km)',
    );
    expect(formatLocationScopeSummary('WALKING', 1)).toBe(
      'Allowed response zone: walking distance (within 1km)',
    );
    expect(formatLocationScopeSummary('NEIGHBOURHOOD', 5)).toBe(
      'Allowed response zone: neighbourhood (within 5km)',
    );
    expect(formatLocationScopeSummary('CITY', 25)).toBe(
      'Allowed response zone: city (within 25km)',
    );
  });

  it('shows zone name only for ANYWHERE', () => {
    expect(formatLocationScopeSummary('ANYWHERE')).toBe(
      'Allowed response zone: anywhere.',
    );
  });

  it('falls back to client market config radii when API radius is absent', () => {
    expect(
      formatLocationScopeSummary('CITY', null, {
        radiusExactSpotKm: 0.3,
        radiusWalkingKm: 1,
        radiusNeighbourhoodKm: 5,
        radiusCityKm: 12,
      }),
    ).toBe('Allowed response zone: city (within 12km)');
  });
});

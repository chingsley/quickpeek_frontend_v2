import {
  formatLocationScopeSummary,
  formatScopeOptionLabel,
  formatScopeRadius,
  getLocationScopeSummaryValue,
  LOCATION_SCOPE_TIERS,
  resolveScopeRadiusKm,
  scopeRadiusHelper,
} from '@/constants/locationScope';

describe('location scope constants', () => {
  it('lists the five tiers in order with labels and helpers', () => {
    expect(LOCATION_SCOPE_TIERS.map((t) => t.scope)).toEqual([
      'AT_EXACT_ADDRESS',
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
    radiusAtExactAddressKm: 0.3,
    radiusWalkingKm: 1,
    radiusNeighbourhoodKm: 5,
    radiusCityKm: 25,
  };

  it('appends the concrete radius for gated tiers', () => {
    expect(scopeRadiusHelper('AT_EXACT_ADDRESS', radii)).toBe(
      'Only people at this exact address can answer (within 300 m).',
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
    radiusAtExactAddressKm: 0.3,
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

describe('formatScopeOptionLabel', () => {
  const radii = {
    radiusAtExactAddressKm: 0.3,
    radiusWalkingKm: 1,
    radiusNeighbourhoodKm: 5,
    radiusCityKm: 25,
  };

  it('formats ask-screen option labels with live radii', () => {
    expect(formatScopeOptionLabel('AT_EXACT_ADDRESS', radii)).toBe(
      'Responders at exact address (within 0.3km from address)',
    );
    expect(formatScopeOptionLabel('WALKING', radii)).toBe(
      'Responders within a walking distance (within 1km from address)',
    );
    expect(formatScopeOptionLabel('NEIGHBOURHOOD', radii)).toBe(
      'Responders within the neighbourhood of this location',
    );
    expect(formatScopeOptionLabel('CITY', radii)).toBe('Any responder within the city');
    expect(formatScopeOptionLabel('ANYWHERE', radii)).toBe(
      'Any responder can answer, location irrelevant',
    );
  });
});

describe('getLocationScopeSummaryValue', () => {
  it('returns the bold zone descriptor for each tier', () => {
    expect(getLocationScopeSummaryValue('AT_EXACT_ADDRESS', 0.3)).toBe(
      'at exact address (within 0.3km)',
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
    expect(formatLocationScopeSummary('AT_EXACT_ADDRESS', 0.3)).toBe(
      'Allowed response zone: at exact address (within 0.3km)',
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
        radiusAtExactAddressKm: 0.3,
        radiusWalkingKm: 1,
        radiusNeighbourhoodKm: 5,
        radiusCityKm: 12,
      }),
    ).toBe('Allowed response zone: city (within 12km)');
  });
});

import { getMarketConfig } from '@/services/config.services';
import TMarketConfig from '@/types/marketConfig.types';
import { create } from 'zustand';

interface MarketConfigState {
  config: TMarketConfig | null;
  loading: boolean;
  loadConfig: () => Promise<void>;
}

const DEFAULT_CONFIG: TMarketConfig = {
  nearMeRadiusKm: 5,
  radiusExactSpotKm: 0.3,
  radiusWalkingKm: 1,
  radiusNeighbourhoodKm: 5,
  radiusCityKm: 25,
};

/**
 * Single source of truth for market-wide display values. Loaded once on app
 * boot; the FE uses it for copy ("responders within X km of {address}").
 * Filter logic lives server-side — this store is purely for display.
 */
export const useMarketConfigStore = create<MarketConfigState>((set, get) => ({
  config: null,
  loading: false,

  loadConfig: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const config = await getMarketConfig();
      set({ config, loading: false });
    } catch (error) {
      console.error('Failed to load market config', error);
      // Fall back to defaults so downstream display text still works.
      set({ config: DEFAULT_CONFIG, loading: false });
    }
  },
}));

/** Convenience selector for the current near-me radius. */
export const selectNearMeRadiusKm = (state: MarketConfigState): number =>
  state.config?.nearMeRadiusKm ?? DEFAULT_CONFIG.nearMeRadiusKm;

/**
 * Resolves the location-scope tier radii from the (possibly absent) config.
 * Pure function — select `state.config` (stable reference) and derive with
 * this; a selector returning a fresh object would re-render-loop zustand.
 */
export const resolveScopeRadii = (config: TMarketConfig | null) => ({
  radiusExactSpotKm: config?.radiusExactSpotKm ?? DEFAULT_CONFIG.radiusExactSpotKm,
  radiusWalkingKm: config?.radiusWalkingKm ?? DEFAULT_CONFIG.radiusWalkingKm,
  radiusNeighbourhoodKm: config?.radiusNeighbourhoodKm ?? DEFAULT_CONFIG.radiusNeighbourhoodKm,
  radiusCityKm: config?.radiusCityKm ?? DEFAULT_CONFIG.radiusCityKm,
});

export type TMarketConfig = {
  /** Market-wide near-me radius in kilometers. Used for display text on the FE
   *  (filtering is performed server-side using this same value). */
  nearMeRadiusKm: number;
  reviewRevealWindowDays?: number;
  /** Location-scope tier radii (km), resolved server-side. */
  radiusAtExactAddressKm: number;
  radiusWalkingKm: number;
  radiusNeighbourhoodKm: number;
  radiusCityKm: number;
};

export default TMarketConfig;

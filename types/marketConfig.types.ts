export type TMarketConfig = {
  /** Market-wide near-me radius in kilometers. Used for display text on the FE
   *  (filtering is performed server-side using this same value). */
  nearMeRadiusKm: number;
};

export default TMarketConfig;

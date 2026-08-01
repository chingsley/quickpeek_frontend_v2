export type ReviewSortOrder = 'desc' | 'asc';

/**
 * Stable reorder of a review list by star count — 'desc' is best-first,
 * 'asc' is worst-first. Returns a new array; ties keep their input order
 * (which is the server's newest-first order).
 */
export const sortReviewsByStars = <T extends { stars: number }>(
  reviews: T[],
  order: ReviewSortOrder,
): T[] =>
  [...reviews].sort((a, b) => (order === 'desc' ? b.stars - a.stars : a.stars - b.stars));

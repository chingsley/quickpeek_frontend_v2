import { sortReviewsByStars } from '@/utils/review.utils';

const review = (id: string, stars: number) => ({ id, stars });

describe('sortReviewsByStars', () => {
  it('orders best to worst for desc', () => {
    const input = [review('a', 3), review('b', 5), review('c', 1), review('d', 4)];
    expect(sortReviewsByStars(input, 'desc').map((r) => r.id)).toEqual([
      'b',
      'd',
      'a',
      'c',
    ]);
  });

  it('orders worst to best for asc', () => {
    const input = [review('a', 3), review('b', 5), review('c', 1), review('d', 4)];
    expect(sortReviewsByStars(input, 'asc').map((r) => r.id)).toEqual([
      'c',
      'a',
      'd',
      'b',
    ]);
  });

  it('keeps the original order within equal star counts (stable)', () => {
    const input = [review('a', 4), review('b', 2), review('c', 4), review('d', 2)];
    expect(sortReviewsByStars(input, 'desc').map((r) => r.id)).toEqual([
      'a',
      'c',
      'b',
      'd',
    ]);
  });

  it('does not mutate the input array', () => {
    const input = [review('a', 1), review('b', 5)];
    sortReviewsByStars(input, 'desc');
    expect(input.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('handles empty and single-item lists', () => {
    expect(sortReviewsByStars([], 'desc')).toEqual([]);
    expect(sortReviewsByStars([review('a', 3)], 'asc').map((r) => r.id)).toEqual(['a']);
  });
});

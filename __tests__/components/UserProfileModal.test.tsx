import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import UserProfileModal from '@/components/UserProfileModal';
import { getPublicUserProfile } from '@/services/users.services';
import { TPublicReview, TPublicUserProfile } from '@/types/review.types';

jest.mock('@/services/users.services', () => ({
  getPublicUserProfile: jest.fn(),
}));

jest.mock('@/components/shared/BottomSheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? React.createElement(View, null, children) : null,
  };
});

jest.mock('@/components/UserAvatar', () => ({
  __esModule: true,
  default: () => null,
}));

const mockGetProfile = getPublicUserProfile as jest.Mock;

const review = (id: string, stars: number): TPublicReview => ({
  id,
  stars,
  comment: `comment-${id}`,
  raterRole: 'QUESTIONER',
  createdAt: '2026-07-15T10:30:00.000Z',
  revealedAt: null,
  rater: { id: `u-${id}`, name: `Rater ${id}`, username: `rater_${id}`, profileImageUrl: null },
});

const profile = (reviews: TPublicReview[]): TPublicUserProfile => ({
  id: 'u1',
  name: 'Responder One',
  username: 'resp1',
  profileImageUrl: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  asResponder: { averageRating: 3.3, reviewsCount: reviews.length },
  asQuestioner: { averageRating: 0, reviewsCount: 0 },
  questionsAnsweredCount: 10,
  questionsAskedCount: 2,
  reviews,
  reviewsPagination: { page: 1, limit: 20, total: reviews.length, hasMore: false },
});

const commentOrder = () =>
  screen.getAllByText(/^comment-/).map((node) => node.props.children as string);

const renderModal = (reviews: TPublicReview[]) => {
  mockGetProfile.mockResolvedValue(profile(reviews));
  return render(<UserProfileModal visible userId="u1" onClose={jest.fn()} />);
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('UserProfileModal review sorting', () => {
  it('shows reviews in server order with sort buttons below the title', async () => {
    renderModal([review('a', 2), review('b', 5), review('c', 3)]);

    expect(await screen.findByText('Reviews (3)')).toBeTruthy();
    expect(screen.getByText('Best first')).toBeTruthy();
    expect(screen.getByText('Worst first')).toBeTruthy();
    expect(commentOrder()).toEqual(['comment-a', 'comment-b', 'comment-c']);
  });

  it('reorders best to worst on "Best first"', async () => {
    renderModal([review('a', 2), review('b', 5), review('c', 3)]);
    fireEvent.press(await screen.findByText('Best first'));
    expect(commentOrder()).toEqual(['comment-b', 'comment-c', 'comment-a']);
  });

  it('reorders worst to best on "Worst first"', async () => {
    renderModal([review('a', 2), review('b', 5), review('c', 3)]);
    fireEvent.press(await screen.findByText('Worst first'));
    expect(commentOrder()).toEqual(['comment-a', 'comment-c', 'comment-b']);
  });

  it('hides the sort buttons when there is at most one review', async () => {
    renderModal([review('a', 4)]);
    expect(await screen.findByText('Reviews (1)')).toBeTruthy();
    expect(screen.queryByText('Best first')).toBeNull();
    expect(screen.queryByText('Worst first')).toBeNull();
  });

  it('hides the sort buttons when there are no reviews', async () => {
    renderModal([]);
    expect(await screen.findByText('No reviews yet.')).toBeTruthy();
    expect(screen.queryByText('Best first')).toBeNull();
  });
});

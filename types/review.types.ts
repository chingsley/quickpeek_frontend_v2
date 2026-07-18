export type TReviewEligibility = {
  canReview: boolean;
  alreadyReviewed: boolean;
  reviewSubmitted: boolean;
  reviewRevealed: boolean;
  unlockedReason: 'marked_answered' | 'activity_threshold' | null;
  unlocked: boolean;
};

export type TReview = {
  id: string;
  stars: number;
  comment: string | null;
  isRevealed: boolean;
  createdAt: string;
};

export type TPublicReview = {
  id: string;
  stars: number;
  comment: string | null;
  raterRole: string;
  createdAt: string;
  revealedAt: string | null;
  rater: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string | null;
  };
};

export type TPublicUserProfile = {
  id: string;
  name: string;
  username: string;
  profileImageUrl: string | null;
  createdAt: string;
  asResponder: { averageRating: number; reviewsCount: number };
  asQuestioner: { averageRating: number; reviewsCount: number };
  answersCount: number;
  questionsAskedCount: number;
  reviews: TPublicReview[];
  reviewsPagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

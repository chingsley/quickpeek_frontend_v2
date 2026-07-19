import TLocation from './location.types';

export type TRoleRating = {
  averageRating: number;
  reviewsCount: number;
};

export type TUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  deviceType: string;
  deviceToken: string;
  locationSharingEnabled: boolean;
  notificationsEnabled: boolean;
  isVerified?: boolean;
  isAdmin?: boolean;
  location?: TLocation;
  asResponder?: TRoleRating;
  asQuestioner?: TRoleRating;
  profileImageUrl?: string | null;
};

export default TUser;

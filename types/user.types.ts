import TLocation from "./location.types";

export type TUserRating = {
  averageRating: number;
  totalRating: number;
  answersCount: number;
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
  location?: TLocation;
  rating?: TUserRating;
  answersCount?: number;
};

export default TUser;

/**
 * A responder shown in the Browse Responders list. Returned by
 * GET /api/v1/users/nearby.
 */
export type TResponder = {
  userId: string;
  username: string;
  name: string;
  distance: number; // kilometers from the question location
  averageRating: number;
  totalRating: number;
  answersCount: number;
  notificationsEnabled: boolean;
  isOnline: boolean;
};

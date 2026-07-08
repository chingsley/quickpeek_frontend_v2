import Axios from '@/config/axios.config';
import TLocation from '@/types/location.types';
import { TResponder, TUser } from '@/types/user.types';

/**
 * GET /api/v1/users — the authenticated user's profile (includes rating).
 */
export const getUserProfile = async (): Promise<TUser> => {
  const response = await Axios.get('/users');
  return response.data.data as TUser;
};

/**
 * PUT /api/v1/users — update editable profile fields.
 */
export const updateUserProfile = async (updates: Partial<TUser>): Promise<TUser> => {
  const response = await Axios.put('/users', updates);
  return response.data.data as TUser;
};

/**
 * GET /api/v1/users/nearby — browse nearby responders for the questioner to
 * choose from. `sort` is 'rating' or 'proximity' (default).
 */
export const getNearbyResponders = async (
  lon: TLocation['longitude'],
  lat: TLocation['latitude'],
  sort: 'rating' | 'proximity' = 'proximity',
): Promise<TResponder[]> => {
  const response = await Axios.get(
    `/users/nearby?longitude=${lon}&latitude=${lat}&sort=${sort}`,
  );
  return response.data.data as TResponder[];
};

export default {
  getUserProfile,
  updateUserProfile,
  getNearbyResponders,
};

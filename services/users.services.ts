import Axios from '@/config/axios.config';
import TLocation from '@/types/location.types';
import { TPublicUserProfile } from '@/types/review.types';
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
 * POST /api/v1/users/profile-image — upload a profile picture.
 */
export const uploadProfileImage = async (imageUri: string): Promise<TUser> => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'profile.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  // @ts-ignore — React Native FormData append accepts this shape.
  formData.append('image', { uri: imageUri, name: filename, type });
  const response = await Axios.post('/users/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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

export const getPublicUserProfile = async (
  userId: string,
  page = 1,
  limit = 10,
): Promise<TPublicUserProfile> => {
  const response = await Axios.get(`/users/${userId}/profile?page=${page}&limit=${limit}`);
  return response.data.data as TPublicUserProfile;
};

export default {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  getNearbyResponders,
  getPublicUserProfile,
};

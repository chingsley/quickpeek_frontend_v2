import Axios from '@/config/axios.config';
import { TPublicUserProfile } from '@/types/review.types';
import { TUser } from '@/types/user.types';

export const getUserProfile = async (): Promise<TUser> => {
  const response = await Axios.get('/users');
  return response.data.data as TUser;
};

export const updateUserProfile = async (updates: Partial<TUser>): Promise<TUser> => {
  const response = await Axios.put('/users', updates);
  return response.data.data as TUser;
};

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

export const getPublicUserProfile = async (
  userId: string,
  page = 1,
  limit = 10,
): Promise<TPublicUserProfile> => {
  const response = await Axios.get(
    `/users/${userId}/profile?page=${page}&limit=${limit}&_t=${Date.now()}`,
  );
  const data = response.data?.data;
  if (!data?.id) {
    throw new Error('Invalid profile response');
  }
  return data as TPublicUserProfile;
};

export default {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  getPublicUserProfile,
};

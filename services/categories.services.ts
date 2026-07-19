import Axios from '@/config/axios.config';
import { TCategory } from '@/types/category.types';

export const getCategories = async (): Promise<TCategory[]> => {
  const response = await Axios.get('/categories');
  return response.data.data as TCategory[];
};

export default { getCategories };

import Axios from '@/config/axios.config';
import type TMarketConfig from '@/types/marketConfig.types';

export const getMarketConfig = async (): Promise<TMarketConfig> => {
  const response = await Axios.get('/config');
  return response.data.data as TMarketConfig;
};

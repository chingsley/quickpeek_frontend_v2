import Axios from "@/config/axios.config"; // Using configured axios instance

export const registerUser = async (userData: any) => {
  try {
    const response = await Axios.post('/users', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (credentials: any) => {
  try {
    const response = await Axios.post('/users/login', credentials);
    return response.data;
  } catch (error) {
    console.error('\nAxios.getUri(): ', Axios.getUri(), '\n');
    throw error;
  }
};

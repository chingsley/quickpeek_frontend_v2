import Axios from "@/config/axios.config"; // Using configured axios instance
import TLocation from "@/types/location.types";

export const postQuestion = async (questionData: any) => {
  try {
    const response = await Axios.post('/questions', questionData);
    return response.data;
  } catch (error) {
    console.log('\nAxios.getUri(): ', Axios.getUri(), '\n');
    throw error;
  }
};

export const getInboxQuestions = async () => {
  try {
    const response = await Axios.get('/questions/answered');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getNearbyQuestions = async (lon: TLocation["longitude"], lat: TLocation["latitude"]) => {
  try {
    const response = await Axios.get(`/questions/nearby?longitude=${lon}&latitude=${lat}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getOutboxQuestions = async () => {
  try {
    const response = await Axios.get('/questions');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const claimQuestion = async (questionId: string) => {
  try {
    const response = await Axios.post(`/questions/${questionId}/claim`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};


export default {
  postQuestion,
  getInboxQuestions,
  getOutboxQuestions,
  claimQuestion,
  getNearbyQuestions
};
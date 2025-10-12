import Axios from "@/config/axios.config"; // Using configured axios instance

export const postQuestion = async (questionData: any) => {
  try {
    console.log('\n>>>>>>>', Axios.getUri(), '\n>>>>>>>>>>>');
    const response = await Axios.post('/questions', questionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

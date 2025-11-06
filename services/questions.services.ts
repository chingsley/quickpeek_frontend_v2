import Axios from "@/config/axios.config"; // Using configured axios instance

export const postQuestion = async (questionData: any) => {
  try {
    console.log('\n•*********', Axios.getUri(), '\n•*********');
    const response = await Axios.post('/questions', questionData);
    return response.data;
  } catch (error) {
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

export const getOutboxQuestions = async () => {
  try {
    const response = await Axios.get('/questions');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

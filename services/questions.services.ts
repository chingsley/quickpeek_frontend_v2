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
    const questions = response.data.data;
    return (questions || []).map((q: any) => {
      const firstAnswer = q.answers?.[0];
      return {
        ...q,
        answers: undefined,
        answer: firstAnswer?.text ?? undefined,
        answerRating: firstAnswer?.rating ?? undefined,
        answerId: firstAnswer?.id ?? undefined,
        responderUsername: firstAnswer?.responderUsername ?? undefined,
        responderId: firstAnswer?.responderID ?? undefined,
        responderAverageRating: firstAnswer?.responderAverageRating ?? undefined,
      };
    });
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
    const questions = response.data.data;
    // Flatten: the backend returns an `answers` array per question.
    // Extract the first answer's data into flat fields for the FE model.
    return (questions || []).map((q: any) => {
      const firstAnswer = q.answers?.[0];
      return {
        ...q,
        answers: undefined,
        answer: firstAnswer?.text ?? undefined,
        answerRating: firstAnswer?.rating ?? undefined,
        answerId: firstAnswer?.id ?? undefined,
        responderUsername: firstAnswer?.responderUsername ?? undefined,
        responderId: firstAnswer?.responderID ?? undefined,
        responderAverageRating: firstAnswer?.responderAverageRating ?? undefined,
      };
    });
  } catch (error) {
    throw error;
  }
};

// --- Responder-Selection Flow ---

/**
 * GET /questions/assigned — the responder inbox: questions assigned to me.
 */
export const getAssignedQuestions = async () => {
  try {
    const response = await Axios.get('/questions/assigned');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * POST /questions/:questionId/assign — questioner picks a responder.
 */
export const assignQuestion = async (questionId: string, responderId: string, timeToRespondMs?: number) => {
  try {
    const response = await Axios.post(`/questions/${questionId}/assign`, { responderId, timeToRespondMs });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * POST /questions/:questionId/reassign — questioner re-chooses a responder
 * after the previous assignment's TTR expired.
 */
export const reassignQuestion = async (questionId: string, responderId: string, timeToRespondMs?: number) => {
  try {
    const response = await Axios.post(`/questions/${questionId}/reassign`, { responderId, timeToRespondMs });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * POST /questions/:questionId/answer — responder submits an answer.
 * Accepts an optional imageUrl (client-side uploaded) in addition to text.
 */
export const submitAnswer = async (questionId: string, text: string, imageUrl?: string) => {
  try {
    const response = await Axios.post(`/questions/${questionId}/answer`, { text, imageUrl });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * POST /questions/:questionId/answer with multipart/form-data for image upload.
 */
export const submitAnswerWithImage = async (questionId: string, text: string, imageUri: string) => {
  try {
    const formData = new FormData();
    formData.append('text', text);
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    // @ts-ignore — React Native FormData append accepts this shape.
    formData.append('image', { uri: imageUri, name: filename, type });
    const response = await Axios.post(`/questions/${questionId}/answer`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
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
  getNearbyQuestions,
  getAssignedQuestions,
  assignQuestion,
  reassignQuestion,
  submitAnswer,
  submitAnswerWithImage,
};

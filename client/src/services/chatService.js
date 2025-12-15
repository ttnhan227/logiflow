import api from './api';

const chatService = {
  getTripMessages: async (tripId) => {
    const res = await api.get(`/chat/trips/${tripId}/messages`);
    return res.data;
  },
  sendMessage: async ({ tripId, content }) => {
    const res = await api.post('/chat/messages', { tripId, content });
    return res.data;
  },
};

export default chatService;

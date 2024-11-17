import axios from 'axios';

const api = axios.create({
  baseURL: 'https://crm-app-xeno-1.onrender.com/api',
  withCredentials: true, // Include if cookies or authentication tokens are used
});

export const CampaignAPI = {
  getCampaigns: async (params = {}) =>
    (await api.get('/campaign', { params })).data,
  getCampaign: async (id: number) =>
    (await api.get(`/campaign/${id}`)).data,
  createCampaign: async (data: any) =>
    (await api.post('/campaign', data)).data,
  updateCampaign: async (id: number, data: any) =>
    (await api.put(`/campaign/${id}`, data)).data,
  deleteCampaign: async (id: number) =>
    (await api.delete(`/campaign/${id}`)).data,
  updateStats: async (id: number, stats: any) =>
    (await api.post(`/campaign/${id}/stats`, stats)).data,
};

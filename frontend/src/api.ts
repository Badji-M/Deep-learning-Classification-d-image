import axios from 'axios';

const API_BASE = '/api';

export const api = {
  async getMetadata() {
    const { data } = await axios.get(`${API_BASE}/metadata`);
    return data;
  },

  async getModels() {
    const { data } = await axios.get(`${API_BASE}/models`);
    return data;
  },

  async predict(file: File, modelName: string) {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await axios.post(
      `${API_BASE}/predict?model_name=${encodeURIComponent(modelName)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  async predictAll(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await axios.post(
      `${API_BASE}/predict_all`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
};

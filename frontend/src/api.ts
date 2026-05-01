import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const api = {
  async getMetadata() {
    const { data } = await axios.get(`${API_BASE}/api/metadata`);
    return data;
  },

  async getModels() {
    const { data } = await axios.get(`${API_BASE}/api/models`);
    return data;
  },

  async predict(file: File, modelName: string) {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await axios.post(
      `${API_BASE}/api/predict?model_name=${encodeURIComponent(modelName)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  async predictAll(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await axios.post(
      `${API_BASE}/api/predict_all`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  async getSampleImages() {
    const { data } = await axios.get(`${API_BASE}/api/sample-images`);
    return data;
  },

  getSampleImageURL(filename: string) {
    return `${API_BASE}/api/sample-images/${filename}`;
  },

  getPlotURL(filename: string) {
    return `${API_BASE}/api/plots/${filename}`;
  },
};

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAnimals = () => api.get('/animals');
export const createAnimal = (data) => api.post('/animals', data);

export default api;

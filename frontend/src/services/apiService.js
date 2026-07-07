import { backendApi, aiApi } from '../api/axiosConfig';

export const login = async (email, password) => {
  const response = await backendApi.post('/auth/signin', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const fetchIncomes = async (userId) => {
  const response = await backendApi.get(`/income/user/${userId}`);
  return response.data;
};

export const fetchExpenses = async (userId) => {
  const response = await backendApi.get(`/expense/user/${userId}`);
  return response.data;
};

export const getAIForecast = async (historicalData) => {
  const response = await aiApi.post('/forecast/income-expense', { historical_data: historicalData });
  return response.data;
};

export const getStabilityScore = async (financialData) => {
  const response = await aiApi.post('/stability-score', financialData);
  return response.data;
};

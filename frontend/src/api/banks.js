import apiClient from './client.js';

export async function searchBanks(query) {
  const res = await apiClient.get('/api/banks', {
    params: query ? { search: query } : {},
  });
  return res.data.banks;
}

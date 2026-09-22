import apiClient from './client.js';

export async function startConversion(uploadedFileId) {
  try {
    const res = await apiClient.post('/api/conversions', { uploadedFileId });
    return { success: true, conversion: res.data.conversion };
  } catch (err) {
    const data = err?.response?.data;
    return {
      success: false,
      message: data?.message || 'Conversion failed.',
      conversion: data?.conversion || null,
    };
  }
}

export async function listConversions() {
  const res = await apiClient.get('/api/conversions');
  return res.data.conversions;
}

export async function getConversion(conversionId) {
  const res = await apiClient.get(`/api/conversions/${conversionId}`);
  return res.data;
}

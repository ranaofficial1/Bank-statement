import apiClient from './client.js';

export async function uploadPdf({ file, bankId, onProgress }) {
  const formData = new FormData();
  formData.append('file', file);
  if (bankId) {
    formData.append('bankId', bankId);
  }

  const res = await apiClient.post('/api/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return res.data.file;
}

export async function verifyUploadPassword(fileId, password) {
  const res = await apiClient.post(`/api/uploads/${fileId}/verify-password`, {
    password,
  });
  return res.data.file;
}

export async function deleteUpload(fileId) {
  await apiClient.delete(`/api/uploads/${fileId}`);
}

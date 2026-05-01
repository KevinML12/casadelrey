import apiClient from './apiClient';

export async function downloadCsv(endpoint, filename) {
  try {
    const res = await apiClient.get(endpoint, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error al descargar CSV:', err);
    throw err;
  }
}

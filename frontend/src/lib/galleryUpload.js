import apiClient from './apiClient';
import { compressImageIfNeeded } from './compressImage';

export async function uploadGalleryFile(file) {
  if (!file.type.startsWith('image/')) throw new Error('Selecciona una fotografía.');
  const image = await compressImageIfNeeded(file);
  if (image.size > 10 * 1024 * 1024) throw new Error('La fotografía supera 10 MB.');
  const data = new FormData(); data.append('file', image);
  const result = await apiClient.post('/upload?folder=galeria', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  return result.data.url;
}

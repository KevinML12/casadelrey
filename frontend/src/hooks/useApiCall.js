import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function usePost({ url, onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: (data) => apiClient.post(url, data).then(r => r.data),
    onSuccess,
    onError,
  });
}

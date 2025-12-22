import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export const usePost = ({ url, onSuccess, onError }) => {
  return useMutation({
    mutationFn: (data) => apiClient.post(url, data),
    onSuccess,
    onError,
  });
};

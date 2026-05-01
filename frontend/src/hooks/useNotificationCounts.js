import { useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

export function useNotificationCounts(intervalMs = 60000) {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ unread_petitions: 0, pending_reports: 0, pending_volunteers: 0, total: 0 });

  const fetchCounts = () => {
    if (!user) return;
    const endpoint = user.role === 'leader' ? '/leader/notifications/counts' : '/admin/notifications/counts';
    apiClient.get(endpoint).then(r => setCounts(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchCounts();
    const id = setInterval(fetchCounts, intervalMs);
    return () => clearInterval(id);
  }, [user]);

  return counts;
}

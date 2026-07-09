import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

export const useDashboardData = (sessionId: string) => {
  return useQuery({
    queryKey: ['dashboard', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data } = await apiClient.get(`/dashboard/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useIncome = (sessionId: string) => {
  return useQuery({
    queryKey: ['income', sessionId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/income/${sessionId}`);
      return data;
    },
    enabled: !!sessionId
  });
};

export const useExpenses = (sessionId: string) => {
  return useQuery({
    queryKey: ['expenses', sessionId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/expenses/${sessionId}`);
      return data;
    },
    enabled: !!sessionId
  });
};

export const useAddExpense = (sessionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: any) => {
      const { data } = await apiClient.post(`/expenses/${sessionId}`, expense);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', sessionId] });
    }
  });
};

export const useAddIncome = (sessionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (income: any) => {
      const { data } = await apiClient.post(`/income/${sessionId}`, income);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', sessionId] });
    }
  });
};

export const useSchemes = () => {
  return useQuery({
    queryKey: ['schemes'],
    queryFn: async () => {
      const { data } = await apiClient.get('/schemes');
      return data;
    }
  });
};

export const useLoanMatches = (sessionId: string) => {
  return useQuery({
    queryKey: ['loan-matches', sessionId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/loan-matches/${sessionId}`);
      return data;
    },
    enabled: !!sessionId
  });
};

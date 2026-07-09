import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/bbps';

export const useBillers = () => {
  return useQuery({
    queryKey: ['billers'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/billers`);
      return data;
    }
  });
};

export const useFetchBill = () => {
  return useMutation({
    mutationFn: async (payload: { billerId: string; consumerNumber: string }) => {
      const { data } = await axios.post(`${API_URL}/fetch`, payload);
      return data;
    }
  });
};

export const usePayBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { userId: string; billId: string; billerId: string; amount: number }) => {
      const { data } = await axios.post(`${API_URL}/pay`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['history', variables.userId] });
    }
  });
};

export const useTransactionHistory = (userId: string | null) => {
  return useQuery({
    queryKey: ['history', userId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/history/${userId}`);
      return data;
    },
    enabled: !!userId
  });
};

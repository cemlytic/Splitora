import { api } from "./api";

export const userService = {
  getUserProfile: async (clerkId: string) => {
    const res = await api.get(`/users/${clerkId}`);
    return res.data;
  },
  deleteAccount: async (clerkId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/users/${clerkId}`);
    return res.data;
  },
  updatePaymentDetails: async (
    clerkId: string,
    data: { iban: string; bankAccountHolder: string },
  ) => {
    const res = await api.put(`/users/${clerkId}/payment-details`, data);
    return res.data;
  },
};
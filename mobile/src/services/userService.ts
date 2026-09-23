import { api } from "./api";

export const userService = {
  getUserProfile: async () => {
    const res = await api.get("/users/me");
    return res.data;
  },
  deleteAccount: async (): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>("/users/me");
    return res.data;
  },
  updatePaymentDetails: async (data: {
    iban: string;
    bankAccountHolder: string;
  }) => {
    const res = await api.put("/users/me/payment-details", data);
    return res.data;
  },
  updatePushToken: async (pushToken: string | null) => {
    const res = await api.post("/users/push-token", { pushToken });
    return res.data;
  },
};

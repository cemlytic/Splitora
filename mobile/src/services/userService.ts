import { api } from "./api";

export const userService = {
  deleteAccount: async (clerkId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/users/${clerkId}`);
    return res.data;
  },
};

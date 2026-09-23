import { api } from "./api";
import {
  CreateExpensePayload,
  Expense,
  GroupSummary,
  SettleUpPayload,
  UpdateExpensePayload,
} from "@/types";

export const expenseService = {
  getExpenses: async (groupId: string): Promise<Expense[]> => {
    const res = await api.get<Expense[]>(`/expenses/group/${groupId}`);
    return res.data;
  },

  getSummary: async (groupId: string): Promise<GroupSummary> => {
    const res = await api.get<GroupSummary>(
      `/expenses/group/${groupId}/summary`,
    );
    return res.data;
  },

  createExpense: async (
    groupId: string,
    payload: Omit<CreateExpensePayload, "groupId" | "clerkId">,
  ): Promise<Expense> => {
    const res = await api.post<Expense>(`/expenses/group/${groupId}`, payload);
    return res.data;
  },

  settleUp: async (
    groupId: string,
    receiverId: string,
    amount: number,
  ): Promise<{ message: string }> => {
    const res = await api.post(`/expenses/group/${groupId}/settle-up`, {
      receiverId,
      amount,
    });
    return res.data;
  },

  getExpenseById: async (expenseId: string): Promise<Expense> => {
    const res = await api.get<Expense>(`/expenses/${expenseId}`);
    return res.data;
  },

  deleteExpense: async (expenseId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/expenses/${expenseId}`);
    return res.data;
  },

  updateExpense: async (payload: Omit<UpdateExpensePayload, "clerkId">) => {
    const { expenseId, ...data } = payload;
    const res = await api.put(`/expenses/${expenseId}`, data);
    return res.data;
  },
};

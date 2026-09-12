import { api } from "./api";
import {
  CreateExpensePayload,
  Expense,
  GroupSummary,
  SettleUpPayload,
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

  createExpense: async (payload: CreateExpensePayload): Promise<Expense> => {
    const res = await api.post<Expense>("/expenses", payload);
    return res.data;
  },

  settleUp: async (payload: SettleUpPayload): Promise<{ message: string }> => {
    const res = await api.post("/expenses/settle-up", payload);
    return res.data;
  },

  getExpenseById: async (expenseId: string): Promise<Expense> => {
    const res = await api.get<Expense>(`/expenses/${expenseId}`);
    return res.data;
  },

  deleteExpense: async (
    expenseId: string,
    clerkId: string,
  ): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(
      `/expenses/${expenseId}`,
      {
        data: { clerkId },
      },
    );
    return res.data;
  },
};

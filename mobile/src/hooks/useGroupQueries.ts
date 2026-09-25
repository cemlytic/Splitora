import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "@/services/groupService";
import { expenseService } from "@/services/expenseService";
import { userService } from "@/services/userService";
import type { CreateExpensePayload, UpdateExpensePayload } from "@/types";

export const useUserGroups = () =>
  useQuery({
    queryKey: ["groups"],
    queryFn: groupService.getUserGroups,
  });

export const useGroup = (groupId: string | undefined) =>
  useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupService.getGroupById(groupId!),
    enabled: Boolean(groupId),
  });

export const useGroupExpenses = (groupId: string | undefined) =>
  useQuery({
    queryKey: ["expenses", groupId],
    queryFn: () => expenseService.getExpenses(groupId!),
    enabled: Boolean(groupId),
  });

export const useGroupSummary = (groupId: string | undefined) =>
  useQuery({
    queryKey: ["summary", groupId],
    queryFn: () => expenseService.getSummary(groupId!),
    enabled: Boolean(groupId),
  });

export const useExpense = (expenseId: string | undefined) =>
  useQuery({
    queryKey: ["expense", expenseId],
    queryFn: () => expenseService.getExpenseById(expenseId!),
    enabled: Boolean(expenseId),
  });

export const useUserProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: userService.getUserProfile,
  });

export const useCreateExpense = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateExpensePayload, "groupId">) =>
      expenseService.createExpense(groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["summary", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useUpdateExpense = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateExpensePayload) =>
      expenseService.updateExpense(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["summary", groupId] });
      queryClient.invalidateQueries({
        queryKey: ["expense", variables.expenseId],
      });
    },
  });
};

export const useDeleteExpense = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => expenseService.deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["summary", groupId] });
    },
  });
};

export const useSettleUp = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      receiverId,
      amount,
    }: {
      receiverId: string;
      amount: number;
    }) => expenseService.settleUp(groupId, receiverId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
    },
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => groupService.createGroup({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => groupService.joinGroup({ inviteCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupService.leaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupService.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

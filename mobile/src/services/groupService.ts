import { api } from "./api";
import { CreateGroupPayload, Group, JoinGroupPayload } from "@/types";

export const groupService = {
  getUserGroups: async (clerkId: string): Promise<Group[]> => {
    const response = await api.get<Group[]>(`/groups/user/${clerkId}`);
    return response.data;
  },

  createGroup: async (payload: CreateGroupPayload): Promise<Group> => {
    const response = await api.post<Group>("/groups", payload);
    return response.data;
  },

  joinGroup: async (payload: JoinGroupPayload): Promise<Group> => {
    const response = await api.post<Group>("/groups/join", payload);
    return response.data;
  },

  leaveGroup: async (groupId: string, clerkId: string) => {
    const res = await api.post(`/groups/${groupId}/leave`, {clerkId});
    return res.data;
  },

  deleteGroup: async (groupId: string, clerkId: string) => {
    const res = await api.delete(`/groups/${groupId}`, {
      data: { clerkId },
    });
    return res.data;
  },
};

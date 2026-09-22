import { api } from "./api";
import { CreateGroupPayload, Group, JoinGroupPayload } from "@/types";

export const groupService = {
  getUserGroups: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>("/groups/user/me");
    return response.data;
  },

  createGroup: async (
    payload: Omit<CreateGroupPayload, "clerkId">,
  ): Promise<Group> => {
    const response = await api.post<Group>("/groups", payload);
    return response.data;
  },

  joinGroup: async (
    payload: Omit<JoinGroupPayload, "clerkId">,
  ): Promise<Group> => {
    const response = await api.post<Group>("/groups/join", payload);
    return response.data;
  },

  leaveGroup: async (groupId: string) => {
    const res = await api.post(`/groups/${groupId}/leave`);
    return res.data;
  },

  deleteGroup: async (groupId: string) => {
    const res = await api.delete(`/groups/${groupId}`);
    return res.data;
  },
};

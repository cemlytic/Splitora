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
};

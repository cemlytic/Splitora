import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useUser } from "@clerk/expo";
import { api } from "@/services/api";

interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  iban?: string;
  bankAccountHolder?: string;
  pushToken?: string | null;
}

interface UserContextValue {
  currentUser: CurrentUser | null;
  isSynced: boolean;
  syncLoading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const sync = async () => {
    if (!user || !isLoaded || !isSignedIn) return;
    try {
      setSyncLoading(true);

      const email = user.primaryEmailAddress?.emailAddress || "";
      const name = user.fullName || user.firstName || "user";
      const avatarUrl = user.imageUrl || "";

      const res = await api.post("/users/sync", { email, name, avatarUrl });
      setCurrentUser(res.data);
      setIsSynced(true);
    } catch (error) {
      console.error("Error syncing", error);
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    sync();
  }, [isLoaded, isSignedIn, user?.id]);

  return (
    <UserContext.Provider
      value={{ currentUser, isSynced, syncLoading, refreshUser: sync }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within UserProvider");
  return ctx;
}

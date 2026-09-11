import { useState, useEffect } from "react";
import { useUser } from "@clerk/expo";
import { api } from "@/services/api";

export const useSyncUser = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isSynced, setIsSynced] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    const sync = async () => {
      if (!user || !isLoaded || !isSignedIn) return;

      try {
        setSyncLoading(true);
        const email = user.primaryEmailAddress?.emailAddress || "";
        const name = user.fullName || user.firstName || "user";
        const avatarUrl = user.imageUrl || "";

        await api.post("/users/sync", {
          clerkId: user.id,
          email,
          name,
          avatarUrl,
        });

        setIsSynced(true);
      } catch (error) {
        console.error("error syncing", error);
      } finally {
        setSyncLoading(false);
      }
    };
    sync();
  }, [isLoaded, isSignedIn, user?.id]);

  return { isSynced, syncLoading };
};

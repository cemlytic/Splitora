import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";

import SafeScreen from "@/components/SafeScreen";
import Header from "@/components/home/Header";
import HeroCard from "@/components/home/HeroCard";
import GroupList from "@/components/home/GroupList";
import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { groupService } from "@/services/groupService";
import type { Group } from "@/types";
import { useAppAlert } from "@/context/AlertContext";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { showAlert } = useAppAlert();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await groupService.getUserGroups(user.id);
      setGroups(data);
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGroups();
  }, [fetchGroups]);

  const handleSignOut = () => {
    showAlert({
      title: "Sign Out",
      message: "Are you sure you want to sign out of your account?",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error("Sign out error:", error);
            }
          },
        },
      ],
    });
  };

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas">
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0E7C66"
          />
        }
      >
        <Header user={user} onSignOut={handleSignOut} />

        {loading ? (
          <HomeSkeleton />
        ) : (
          <>
            <HeroCard groups={groups} />
            <GroupList groups={groups} loading={false} />
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

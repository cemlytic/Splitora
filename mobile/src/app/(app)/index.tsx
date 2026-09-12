import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

import SafeScreen from "@/components/SafeScreen";
import Header from "@/components/home/Header";
import HeroCard from "@/components/home/HeroCard";
import GroupList from "@/components/home/GroupList";
import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { groupService } from "@/services/groupService";
import type { Group } from "@/types";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

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
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
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
    ]);
  };

  if (!fontsLoaded) {
    return (
      <SafeScreen className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#0E7C66" />
      </SafeScreen>
    );
  }

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

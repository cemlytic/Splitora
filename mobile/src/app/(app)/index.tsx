import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import { ArrowRight, Building2 } from "lucide-react-native";

import SafeScreen from "@/components/SafeScreen";
import Header from "@/components/home/Header";
import HeroCard from "@/components/home/HeroCard";
import GroupList from "@/components/home/GroupList";
import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { groupService } from "@/services/groupService";
import { userService } from "@/services/userService";
import type { Group } from "@/types";
import { useAppAlert } from "@/context/AlertContext";

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { showAlert } = useAppAlert();

  const [groups, setGroups] = useState<Group[]>([]);
  const [hasMissingPaymentInfo, setHasMissingPaymentInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [groupsData, profileData] = await Promise.all([
        groupService.getUserGroups(user.id),
        userService.getUserProfile(user.id).catch(() => null),
      ]);

      setGroups(groupsData);

      if (!profileData?.iban || !profileData?.bankAccountHolder) {
        setHasMissingPaymentInfo(true);
      } else {
        setHasMissingPaymentInfo(false);
      }
    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

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
        <Header
          user={user}
          onSignOut={handleSignOut}
          hasMissingPaymentInfo={hasMissingPaymentInfo}
        />

        {!loading && hasMissingPaymentInfo && (
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            activeOpacity={0.85}
            className="mt-4 flex-row items-center justify-between rounded-2xl border border-coral/25 bg-coral/10 p-3.5"
          >
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-coral/15">
                <Building2 size={16} color="#FF6B4A" />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-xs text-ink"
                >
                  Add Settlement Details
                </Text>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                  className="text-[11px] text-muted"
                  numberOfLines={1}
                >
                  Add your IBAN so members can pay you directly.
                </Text>
              </View>
            </View>

            <View className="h-7 w-7 items-center justify-center rounded-full bg-cream border border-ink/8">
              <ArrowRight size={13} color="#1B1B1F" />
            </View>
          </TouchableOpacity>
        )}

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
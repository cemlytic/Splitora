import { useSyncUser } from "@/hooks/useSyncUser";
import { Stack } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { ScrollView, View } from "react-native";
import Skeleton from "@/components/skeletons/Skeleton";

export default function AppLayout() {
  const { isSynced, syncLoading } = useSyncUser();

  if (syncLoading && !isSynced) {
    return (
      <SafeScreen includeBottom className="flex-1 bg-canvas">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        >
          <View className="mt-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <View className="gap-2">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </View>
            </View>
            <Skeleton className="h-10 w-10 rounded-full" />
          </View>

          <HomeSkeleton />
        </ScrollView>
      </SafeScreen>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerShadowVisible: false,
        headerTintColor: "#0f172a",
        headerTitleStyle: { fontWeight: "600" },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="group/create" options={{ presentation: "modal" }} />
      <Stack.Screen name="group/join" options={{ presentation: "modal" }} />
      <Stack.Screen name="expense/create" options={{ presentation: "modal" }} />
      <Stack.Screen name="group/members" options={{ presentation: "modal" }} />
      <Stack.Screen name="expense/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

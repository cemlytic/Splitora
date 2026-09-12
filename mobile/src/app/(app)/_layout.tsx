import { useSyncUser } from "@/hooks/useSyncUser";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
  const { isSynced, syncLoading } = useSyncUser();

  if (syncLoading && !isSynced) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
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
      <Stack.Screen
        name="expense/[id]"
        options={{ presentation: "modal" }}
      ></Stack.Screen>
    </Stack>
  );
}

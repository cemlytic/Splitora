import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  LogOut,
  Mail,
  User as UserIcon,
  Trash2,
} from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import TopNavigation from "@/components/common/TopNavigation";

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const [deleting, setDeleting] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/login");
            } catch (error) {
              console.error("Sign out error:", error);
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and you will lose access to all your spaces.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await user?.delete();
              await signOut();
              router.replace("/login");
            } catch (error: any) {
              console.error("Delete account error:", error);
              Alert.alert(
                "Action Failed",
                error?.errors?.[0]?.message ||
                  "Could not delete your account at this moment.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (!fontsLoaded) return null;

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "No email provided";

  const fullName =
    user?.fullName ||
    (user?.firstName
      ? `${user.firstName} ${user?.lastName || ""}`.trim()
      : "Account");

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas px-6">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between py-3">
        <TopNavigation />

        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-base tracking-tight text-ink"
        >
          Account
        </Text>

        <View className="h-10 w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingBottom: 32,
        }}
        className="flex-1"
      >
        <View>
          <View className="mt-4 items-center rounded-3xl border border-ink/6 bg-cream p-6 shadow-sm">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={{ width: 72, height: 72, borderRadius: 36 }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View className="h-18 w-18 items-center justify-center rounded-full bg-teal">
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-2xl text-cream"
                >
                  {user?.firstName?.[0] || "U"}
                </Text>
              </View>
            )}

            <Text
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              className="mt-4 text-xl tracking-tight text-ink text-center"
            >
              {fullName}
            </Text>
          </View>

          <View className="mt-6">
            <Text
              style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
              className="mb-3 text-xs uppercase tracking-wider text-muted"
            >
              Profile Information
            </Text>

            <View className="rounded-2xl border border-ink/6 bg-cream overflow-hidden">
              <View className="flex-row items-center justify-between p-4 border-b border-ink/5">
                <View className="flex-row items-center gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-ink/5">
                    <UserIcon size={15} color="#1B1B1F" />
                  </View>
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                    className="text-xs text-muted"
                  >
                    Name
                  </Text>
                </View>

                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-sm text-ink max-w-45 text-right"
                  numberOfLines={1}
                >
                  {fullName}
                </Text>
              </View>

              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-ink/5">
                    <Mail size={15} color="#1B1B1F" />
                  </View>
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                    className="text-xs text-muted"
                  >
                    Email
                  </Text>
                </View>

                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-sm text-ink max-w-50 text-right"
                  numberOfLines={1}
                >
                  {email}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-8 gap-3">
            <TouchableOpacity
              onPress={handleSignOut}
              disabled={deleting}
              activeOpacity={0.8}
              className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-cream active:scale-[0.99]"
            >
              <LogOut size={16} color="#1B1B1F" strokeWidth={2} />
              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className="text-[15px] text-ink"
              >
                Sign Out
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleting}
              activeOpacity={0.8}
              className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-coral/30 bg-coral/10 active:scale-[0.99]"
            >
              {deleting ? (
                <ActivityIndicator color="#FF6B4A" />
              ) : (
                <>
                  <Trash2 size={16} color="#FF6B4A" strokeWidth={2} />
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    className="text-[15px] text-coral"
                  >
                    Delete Account
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-12 items-center">
          <Text
            style={{ fontFamily: "SpaceGrotesk_400Regular" }}
            className="text-xs text-muted"
          >
            © 2026 AppName. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

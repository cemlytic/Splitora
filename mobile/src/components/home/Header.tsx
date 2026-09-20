import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { LogOut, Settings } from "lucide-react-native";
import { useRouter } from "expo-router";

export interface HeaderUser {
  firstName?: string | null;
  imageUrl?: string | null;
}

interface HeaderProps {
  user: HeaderUser | null | undefined;
  onSignOut: () => void;
  hasMissingPaymentInfo?: boolean;
}

export default function Header({
  user,
  onSignOut,
  hasMissingPaymentInfo = false,
}: HeaderProps) {
  const router = useRouter();

  return (
    <View className="mt-2 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        {user?.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            style={{ width: 42, height: 42, borderRadius: 21 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-10.5 w-10.5 items-center justify-center rounded-full bg-teal shadow-sm">
            <Text
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              className="text-base text-cream"
            >
              {user?.firstName?.[0] || "U"}
            </Text>
          </View>
        )}

        <View>
          <Text
            style={{ fontFamily: "SpaceGrotesk_400Regular" }}
            className="text-[12px] tracking-wide text-muted"
          >
            Welcome back,
          </Text>
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-lg leading-6 text-ink"
          >
            {user?.firstName || "Friend"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2.5">
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          activeOpacity={0.75}
          className="relative h-10 w-10 items-center justify-center rounded-full border border-ink/8 bg-cream"
        >
          <Settings size={18} color="#1B1B1F" strokeWidth={2} />

          {hasMissingPaymentInfo && (
            <View className="absolute -top-0.5 -right-0.5 items-center justify-center">
              <View className="h-3.5 w-3.5 rounded-full border-2 border-canvas bg-coral shadow-sm" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSignOut}
          activeOpacity={0.75}
          className="h-10 w-10 items-center justify-center rounded-full border border-ink/8 bg-cream"
        >
          <LogOut size={16} color="#8A8680" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

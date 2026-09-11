import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { LogOut } from "lucide-react-native";

export interface HeaderUser {
  firstName?: string | null;
  imageUrl?: string | null;
}

interface HeaderProps {
  user: HeaderUser | null | undefined;
  onSignOut: () => void;
}

export default function Header({ user, onSignOut }: HeaderProps) {
  return (
    <View className="mt-2 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        {user?.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="cover"
          />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-teal">
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
            Welcome back
          </Text>
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-lg leading-6 text-ink"
          >
            {user?.firstName || "Friend"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onSignOut}
        activeOpacity={0.7}
        className="h-11 w-11 items-center justify-center rounded-full border border-ink/8 bg-cream"
      >
        <LogOut size={17} color="#8A8680" />
      </TouchableOpacity>
    </View>
  );
}

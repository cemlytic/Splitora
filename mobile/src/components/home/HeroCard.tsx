import { View, Text, TouchableOpacity } from "react-native";
import type { Group } from "@/types";
import { Hash, Plus } from "lucide-react-native";
import { useRouter } from "expo-router";

interface HeroCardProps {
  groups: Group[];
}

export default function HeroCard({ groups }: HeroCardProps) {
  const router = useRouter();

  return (
    <View className="mt-7 rounded-3xl border border-ink/6 bg-cream p-6 shadow-md">
      <View className="flex-row items-center justify-between">
        <Text
          style={{ fontFamily: "SpaceGrotesk_500Medium" }}
          className="text-xs uppercase tracking-wider text-muted"
        >
          Active Spaces
        </Text>
        <View className="flex-row items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1">
          <View className="h-1.5 w-1.5 rounded-full bg-teal" />
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-[11px] text-teal"
          >
            Live
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-baseline gap-2">
        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-5xl tracking-tight text-ink"
        >
          {groups.length}
        </Text>
        <Text
          style={{ fontFamily: "SpaceGrotesk_500Medium" }}
          className="text-sm text-muted"
        >
          {groups.length === 1 ? "shared group" : "shared groups"}
        </Text>
      </View>
      <View className="mt-6 flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.push("/group/create")}
          activeOpacity={0.85}
          style={{
            shadowColor: "#FF6B4A",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 3,
          }}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-coral py-3.5"
        >
          <Plus size={18} color="#1B1B1F" strokeWidth={2.5} />
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-[14px] text-ink"
          >
            New Group
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/group/join")}
          activeOpacity={0.85}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-canvas py-3.5"
        >
          <Hash size={16} color="#1B1B1F" strokeWidth={2} />
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-[14px] text-ink"
          >
            Join with Code
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


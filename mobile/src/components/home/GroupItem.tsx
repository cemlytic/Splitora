import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { Group } from "@/types";

interface GroupItemProps {
  group: Group;
  index: number;
}

export default function GroupItem({ group, index }: GroupItemProps) {
  const router = useRouter();
  const isEven = index % 2 === 0;
  const initial = group.name ? group.name[0].toUpperCase() : "G";
  const memberCount = group.members?.length || 1;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/group/${group._id}`)}
      activeOpacity={0.8}
      style={{
        shadowColor: "#1B1B1F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
      }}
      className="flex-row items-cemter justify-between rounded-2xl border border-ink/6 bg-cream p-4"
    >
      <View className="flex-row items-center gap-3.5">
        <View
          className={`h-12 w-12 items-center justify-center rounded-xl ${isEven ? "bg-teal/10" : "bg-coral/10"}`}
        >
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className={`text-base ${isEven ? "text-teal" : "text-coral"}`}
          >
            {initial}
          </Text>
        </View>

        <View>
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-[15px] text-ink"
          >
            {group.name}
          </Text>
          <Text
            style={{ fontFamily: "SpaceGrotesk_400Regular" }}
            className="mt-0.5 text-xs text-muted"
          >
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2.5">
        <View className="rounded-md border border-ink/8 bg-canvas px-2.5 py-1">
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-[11px] tracking-widest text-muted"
          >
            {group.inviteCode}
          </Text>
        </View>
        <ChevronRight size={16} color="#8A8680" />
      </View>
    </TouchableOpacity>
  );
}

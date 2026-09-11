import { View, Text, ActivityIndicator } from "react-native";
import { Users } from "lucide-react-native";
import type { Group } from "@/types";
import GroupItem from "./GroupItem";

interface GroupListProps {
  groups: Group[];
  loading: boolean;
}

export default function GroupList({ groups, loading }: GroupListProps) {
  return (
    <View className="mt-9">
      <View className="flex-row items-center justify-between">
        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-xl tracking-tight text-ink"
        >
          Your Groups
        </Text>
        <Text
          style={{ fontFamily: "SpaceGrotesk_500Medium" }}
          className="text-xs text-muted"
        >
          {groups.length} total
        </Text>
      </View>

      {loading ? (
        <View className="items-center justify-center py-16">
          <ActivityIndicator color="#0E7C66" />
        </View>
      ) : groups.length === 0 ? (
        <View className="mt-4 items-center justify-center rounded-3xl border border-dashed border-ink/15 bg-cream/40 px-6 py-10">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-ink/5">
            <Users size={22} color="#8A8680" />
          </View>
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="mt-4 text-base text-ink"
          >
            No groups joined yet
          </Text>
          <Text
            style={{ fontFamily: "SpaceGrotesk_400Regular" }}
            className="mt-1 max-w-65 text-center text-xs leading-5 text-muted"
          >
            Create a group for an upcoming trip or use an invite code to jump
            right into an existing tab.
          </Text>
        </View>
      ) : (
        <View className="mt-4 gap-3">
          {groups.map((group, index) => (
            <GroupItem key={group._id} group={group} index={index} />
          ))}
        </View>
      )}
    </View>
  );
}


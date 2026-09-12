import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { X, Users, ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { expenseService } from "@/services/expenseService";
import type { GroupSummary } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import MembersSkeleton from "@/components/skeletons/MembersSkeleton";

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    expenseService
      .getSummary(groupId)
      .then((data) => setSummary(data))
      .catch((error) =>
        console.error("Could not fetch members summary:", error),
      )
      .finally(() => setLoading(false));
  }, [groupId]);

  if (!fontsLoaded) {
    return (
      <SafeScreen className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#0E7C66" />
      </SafeScreen>
    );
  }

  const memberCount = summary?.balances.length || 0;

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas px-6">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="h-10 w-10 items-center justify-center rounded-full border border-ink/8 bg-cream"
        >
          <X size={18} color="#1B1B1F" />
        </TouchableOpacity>

        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-base tracking-tight text-ink"
        >
          Space Members
        </Text>

        <View className="h-10 w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-4 flex-1">
        {loading ? (
          <MembersSkeleton />
        ) : (
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <Text
                style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                className="text-xs uppercase tracking-wider text-muted"
              >
                Directory ({memberCount})
              </Text>
              <View className="flex-row items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1">
                <Users size={12} color="#8A8680" />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                  className="text-[11px] text-muted"
                >
                  {memberCount === 1
                    ? "1 active user"
                    : `${memberCount} active users`}
                </Text>
              </View>
            </View>

            <View className="gap-3 pb-8">
              {summary?.balances.map(({ user, netBalance }, index) => {
                const isLender = netBalance > 0;
                const isBorrower = netBalance < 0;
                const isEven = index % 2 === 0;

                return (
                  <View
                    key={user._id}
                    style={{
                      shadowColor: "#1B1B1F",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.03,
                      shadowRadius: 10,
                      elevation: 1,
                    }}
                    className="flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream p-4"
                  >
                    <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                      {user.avatarUrl ? (
                        <Image
                          source={{ uri: user.avatarUrl }}
                          style={{ width: 44, height: 44, borderRadius: 22 }}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View
                          className={`h-11 w-11 items-center justify-center rounded-2xl ${
                            isEven ? "bg-teal/15" : "bg-coral/15"
                          }`}
                        >
                          <Text
                            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                            className={`text-base ${isEven ? "text-teal" : "text-coral"}`}
                          >
                            {user.name ? user.name[0].toUpperCase() : "U"}
                          </Text>
                        </View>
                      )}

                      <View className="flex-1">
                        <Text
                          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                          className="text-[15px] text-ink"
                          numberOfLines={1}
                        >
                          {user.name}
                        </Text>
                        <Text
                          style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                          className="mt-0.5 text-xs text-muted"
                          numberOfLines={1}
                        >
                          {user.email}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end pl-2">
                      <Text
                        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                        className={`text-[15px] tracking-tight ${
                          isLender
                            ? "text-teal"
                            : isBorrower
                              ? "text-coral"
                              : "text-muted"
                        }`}
                      >
                        {isLender
                          ? `+${formatCurrency(netBalance)}`
                          : isBorrower
                            ? `-${formatCurrency(netBalance)}`
                            : "$0.00"}
                      </Text>

                      <View className="mt-1 flex-row items-center gap-1">
                        {isLender ? (
                          <ArrowDownLeft size={11} color="#0E7C66" />
                        ) : isBorrower ? (
                          <ArrowUpRight size={11} color="#FF6B4A" />
                        ) : null}
                        <Text
                          style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                          className={`text-[11px] ${
                            isLender
                              ? "text-teal"
                              : isBorrower
                                ? "text-coral"
                                : "text-muted"
                          }`}
                        >
                          {isLender
                            ? "gets back"
                            : isBorrower
                              ? "owes"
                              : "settled"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

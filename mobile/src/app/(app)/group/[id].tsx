import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/expo";
import * as Clipboard from "expo-clipboard";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  Plus,
  Share2,
  Copy,
  Check,
  KeyRound,
  Users,
} from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { expenseService } from "@/services/expenseService";
import { groupService } from "@/services/groupServices";
import type { Expense, Group, GroupSummary } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import BalanceHeroCard from "@/components/groups/BalanceHeroCard";
import GroupTabs, { type GroupTabType } from "@/components/groups/GroupTabs";
import ExpenseList from "@/components/groups/ExpenseList";
import DebtList from "@/components/groups/DebtList";
import TopNavigation from "@/components/common/TopNavigation";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<GroupTabType>("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const fetchData = useCallback(async () => {
    if (!id || !user?.id) return;
    try {
      const [expensesData, summaryData, userGroups] = await Promise.all([
        expenseService.getExpenses(id),
        expenseService.getSummary(id),
        groupService.getUserGroups(user.id),
      ]);
      setExpenses(expensesData);
      setSummary(summaryData);
      const currentGroup = userGroups.find((g) => g._id === id) || null;
      setGroup(currentGroup);
    } catch (error) {
      console.error("Failed to load group details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCopyCode = async () => {
    if (!group?.inviteCode) return;
    await Clipboard.setStringAsync(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    if (!group?.inviteCode) return;
    try {
      await Share.share({
        message: `Join our space "${group.name || "Split"}"! Use access key: ${group.inviteCode}`,
      });
    } catch (error) {
      console.error("Could not share code:", error);
    }
  };

  const handleSettleUp = (
    receiverClerkId: string,
    receiverName: string,
    amount: number,
  ) => {
    if (!user?.id || !id) return;

    Alert.alert(
      "Settle Balance",
      `Confirm payment of ${formatCurrency(amount)} to ${receiverName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Settled",
          style: "default",
          onPress: async () => {
            try {
              await expenseService.settleUp({
                groupId: id,
                payerClerkId: user.id,
                receiverClerkId,
              });
              fetchData();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Could not complete settlement.",
              );
            }
          },
        },
      ],
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <SafeScreen className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#0E7C66" />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between px-6 pt-2 pb-3">
        <TopNavigation />

        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="max-w-50 truncate text-center text-base tracking-tight text-ink"
          numberOfLines={1}
        >
          {group?.name || "Group Overview"}
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/group/members",
              params: { groupId: id },
            })
          }
          activeOpacity={0.7}
          className="h-10 w-10 items-center justify-center rounded-full border border-ink/8 bg-cream"
        >
          <Users size={17} color="#1B1B1F" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShareCode}
          disabled={!group?.inviteCode}
          activeOpacity={0.7}
          className="h-10 w-10 items-center justify-center rounded-full border border-ink/8 bg-cream"
        >
          <Share2 size={17} color="#1B1B1F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0E7C66"
          />
        }
      >
        <BalanceHeroCard summary={summary} currentUserId={user?.id} />

        {group?.inviteCode && (
          <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream/80 p-3.5 shadow-sm">
            <View className="flex-row items-center gap-2.5">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-ink/5">
                <KeyRound size={15} color="#1B1B1F" />
              </View>
              <View>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                  className="text-[11px] uppercase tracking-wider text-muted"
                >
                  Invite Code
                </Text>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-sm tracking-widest text-ink"
                >
                  {group.inviteCode}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCopyCode}
              activeOpacity={0.75}
              className={`flex-row items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all ${
                copied ? "border-teal bg-teal/10" : "border-ink/10 bg-canvas"
              }`}
            >
              {copied ? (
                <>
                  <Check size={13} color="#0E7C66" strokeWidth={2.5} />
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    className="text-xs text-teal"
                  >
                    Copied
                  </Text>
                </>
              ) : (
                <>
                  <Copy size={13} color="#1B1B1F" strokeWidth={2} />
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                    className="text-xs text-ink"
                  >
                    Copy
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <GroupTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          expensesCount={expenses.length}
          debtsCount={summary?.debts.length || 0}
        />

        {activeTab === "expenses" ? (
          <ExpenseList expenses={expenses} currentUserId={user?.id} />
        ) : (
          <DebtList
            summary={summary}
            currentUserId={user?.id}
            onSettleUp={handleSettleUp}
          />
        )}
      </ScrollView>

      <View className="absolute bottom-6 left-6 right-6">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(app)/expense/create",
              params: { groupId: id },
            })
          }
          activeOpacity={0.85}
          style={{
            shadowColor: "#FF6B4A",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.28,
            shadowRadius: 14,
            elevation: 4,
          }}
          className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-coral active:scale-[0.99]"
        >
          <Plus size={18} color="#1B1B1F" strokeWidth={2.5} />
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-[15px] text-ink"
          >
            Add Expense
          </Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/expo";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { ArrowLeft, Plus } from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { expenseService } from "@/services/expenseService";
import type { Expense, GroupSummary } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import BalanceHeroCard from "@/components/groups/BalanceHeroCard";
import GroupTabs, { type GroupTabType } from "@/components/groups/GroupTabs";
import ExpenseList from "@/components/groups/ExpenseList";
import DebtList from "@/components/groups/DebtList";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<GroupTabType>("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [expensesData, summaryData] = await Promise.all([
        expenseService.getExpenses(id),
        expenseService.getSummary(id),
      ]);
      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load group details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="h-10 w-10 items-center justify-center rounded-full border border-ink/8 bg-cream"
        >
          <ArrowLeft size={18} color="#1B1B1F" />
        </TouchableOpacity>

        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-base tracking-tight text-ink"
        >
          Group Overview
        </Text>

        <View className="h-10 w-10" />
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

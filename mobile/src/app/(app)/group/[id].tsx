import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  Plus,
  Share2,
  Copy,
  Check,
  KeyRound,
  Users,
  Download,
} from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { useCurrentUser } from "@/context/UserContext";
import {
  useGroup,
  useGroupExpenses,
  useGroupSummary,
  useSettleUp,
} from "@/hooks/useGroupQueries";
import BalanceHeroCard from "@/components/groups/BalanceHeroCard";
import GroupTabs, { type GroupTabType } from "@/components/groups/GroupTabs";
import ExpenseList from "@/components/groups/ExpenseList";
import DebtList from "@/components/groups/DebtList";
import QuickPayModal from "@/components/groups/QuickPayModal";
import TopNavigation from "@/components/common/TopNavigation";
import { hapticFeedback } from "@/utils/haptics";
import GroupDetailSkeleton from "@/components/skeletons/GroupDetailSkeleton";
import { useAppAlert } from "@/context/AlertContext";
import { exportGroupToCSV } from "@/utils/exportGroupReport";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { showAlert } = useAppAlert();

  const [activeTab, setActiveTab] = useState<GroupTabType>("expenses");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const groupQuery = useGroup(id);
  const expensesQuery = useGroupExpenses(id);
  const summaryQuery = useGroupSummary(id);
  const settleUpMutation = useSettleUp(id!);

  const [payModalData, setPayModalData] = useState<{
    visible: boolean;
    receiverName: string;
    receiverIban?: string;
    accountHolder?: string;
    amount: number;
    receiverId: string;
  }>({ visible: false, receiverName: "", amount: 0, receiverId: "" });

  const loading =
    groupQuery.isLoading || expensesQuery.isLoading || summaryQuery.isLoading;
  const refreshing =
    groupQuery.isRefetching ||
    expensesQuery.isRefetching ||
    summaryQuery.isRefetchError;

  const group = groupQuery.data ?? null;
  const expenses = expensesQuery.data ?? [];
  const summary = summaryQuery.data ?? null;

  const onRefresh = () => {
    groupQuery.refetch();
    expensesQuery.refetch();
    summaryQuery.refetch();
  };

  const handleCopyCode = async () => {
    if (!group?.inviteCode) return;
    await Clipboard.setStringAsync(group.inviteCode);
    hapticFeedback.success();
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

  const handleOpenPayModal = (debtInfo: {
    receiverId: string;
    receiverName: string;
    receiverIban?: string;
    accountHolder?: string;
    amount: number;
  }) => {
    setPayModalData({
      visible: true,
      receiverName: debtInfo.receiverName,
      receiverIban: debtInfo.receiverIban,
      accountHolder: debtInfo.accountHolder,
      amount: debtInfo.amount,
      receiverId: debtInfo.receiverId,
    });
  };

  const handleConfirmSettlement = async () => {
    if (!currentUser || !id || !payModalData.receiverId) return;

    try {
      await settleUpMutation.mutateAsync({
        receiverId: payModalData.receiverId,
        amount: payModalData.amount,
      });
      hapticFeedback.success();
      setPayModalData((prev) => ({ ...prev, visible: true }));
    } catch (error: any) {
      hapticFeedback.error();
      showAlert({
        title: "Settlement Error",
        message:
          error?.response?.data?.message ||
          "Could not complete settlement. Please try again.",
        type: "warning",
      });
    }
  };

  const handleExportReport = async () => {
    if (!group) return;
    try {
      setExporting(true);
      hapticFeedback.light();
      await exportGroupToCSV(group, expenses, summary);
    } catch (error: any) {
      hapticFeedback.error();
      showAlert({
        title: "Export failed",
        message: error?.message || "Could not export financial report.",
        type: "warning",
      });
    } finally {
      setExporting(false);
    }
  };

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

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleExportReport}
            disabled={exporting || loading}
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-full border border-ink/8 bg-cream"
          >
            <Download size={17} color="#1B1B1F" />
          </TouchableOpacity>

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
        {loading ? (
          <GroupDetailSkeleton />
        ) : (
          <>
            <BalanceHeroCard
              summary={summary}
              currentUserId={currentUser?._id}
            />

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
                    copied
                      ? "border-teal bg-teal/10"
                      : "border-ink/10 bg-canvas"
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
              <ExpenseList
                expenses={expenses}
                currentUserId={currentUser?._id}
              />
            ) : (
              <DebtList
                summary={summary}
                currentUserId={currentUser?._id}
                onSettleUp={handleOpenPayModal}
              />
            )}
          </>
        )}
      </ScrollView>

      {!loading && (
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
      )}

      <QuickPayModal
        visible={payModalData.visible}
        onClose={() => setPayModalData((prev) => ({ ...prev, visible: false }))}
        receiverName={payModalData.receiverName}
        receiverIban={payModalData.receiverIban}
        accountHolder={payModalData.accountHolder}
        amount={payModalData.amount}
        onConfirmSettlement={handleConfirmSettlement}
        loading={settleUpMutation.isPending}
      />
    </SafeScreen>
  );
}

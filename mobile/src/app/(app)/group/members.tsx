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
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
  Trash2,
  ShieldAlert,
  Crown,
} from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { useCurrentUser } from "@/context/UserContext";
import {
  useGroup,
  useGroupSummary,
  useLeaveGroup,
  useDeleteGroup,
} from "@/hooks/useGroupQueries";
import { formatCurrency } from "@/utils/formatCurrency";
import MembersSkeleton from "@/components/skeletons/MembersSkeleton";
import { useAppAlert } from "@/context/AlertContext";
import { hapticFeedback } from "@/utils/haptics";
import TopNavigation from "@/components/common/TopNavigation";

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { showAlert } = useAppAlert();

  const groupQuery = useGroup(groupId);
  const summaryQuery = useGroupSummary(groupId);
  const leaveGroupMutation = useLeaveGroup();
  const deleteGroupMutation = useDeleteGroup();

  const loading = groupQuery.isLoading || summaryQuery.isLoading;
  const actionLoading =
    leaveGroupMutation.isPending || deleteGroupMutation.isPending;
  const group = groupQuery.data ?? null;
  const summary = summaryQuery.data ?? null;

  const memberCount = summary?.balances.length || 0;
  const currentUserMongoId = currentUser?._id;

  const currentUserBalance =
    summary?.balances.find((b: any) => b.user?._id === currentUserMongoId)
      ?.netBalance || 0;

  const groupOwnerId =
    typeof group?.createdBy === "string"
      ? group.createdBy
      : (group?.createdBy as any)?._id;

  const isOwner = Boolean(groupOwnerId) && groupOwnerId === currentUserMongoId;

  const handleLeaveGroup = () => {
    if (!groupId || !currentUser) return;

    if (Math.abs(currentUserBalance) >= 0.01) {
      hapticFeedback.warning();
      showAlert({
        title: "Outstanding Balance",
        message:
          currentUserBalance < 0
            ? `You owe ${formatCurrency(Math.abs(currentUserBalance))}. Settle all debts before leaving this space.`
            : `You are owed ${formatCurrency(currentUserBalance)}. Collect your balance before leaving this space.`,
        type: "warning",
      });
      return;
    }

    hapticFeedback.warning();
    showAlert({
      title: "Leave Space",
      message:
        "Are you sure you want to leave this space? You will lose access to all shared records and history.",
      type: "destructive",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave Space",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveGroupMutation.mutateAsync(groupId);
              hapticFeedback.success();
              router.replace("/(app)");
            } catch (error: any) {
              hapticFeedback.error();
              showAlert({
                title: "Action Failed",
                message:
                  error?.response?.data?.message ||
                  "Could not leave space. Please try again.",
                type: "warning",
              });
            }
          },
        },
      ],
    });
  };

  const handleDeleteGroup = () => {
    if (!groupId || !currentUser) return;

    const hasUnsettledDebts = (summary?.debts?.length || 0) > 0;
    if (hasUnsettledDebts) {
      hapticFeedback.warning();
      showAlert({
        title: "Unsettled Balances",
        message:
          "This space cannot be deleted while there are pending debts between members. Settle all balances first.",
        type: "warning",
      });
      return;
    }

    hapticFeedback.warning();
    showAlert({
      title: "Delete Space",
      message:
        "Are you sure you want to permanently delete this space and all associated expenses? This action cannot be undone.",
      type: "destructive",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Space",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroupMutation.mutateAsync(groupId);
              hapticFeedback.success();
              router.replace("/(app)");
            } catch (error: any) {
              hapticFeedback.error();
              showAlert({
                title: "Action Failed",
                message:
                  error?.response?.data?.message ||
                  "Could not delete space. Please try again.",
                type: "warning",
              });
            }
          },
        },
      ],
    });
  };

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas px-6">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between py-3">
        <TopNavigation />
        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-base tracking-tight text-ink"
        >
          Space Directory
        </Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="mt-2 flex-1"
      >
        {loading ? (
          <MembersSkeleton />
        ) : (
          <>
            <View className="mb-3.5 flex-row items-center justify-between px-0.5">
              <Text
                style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                className="text-xs uppercase tracking-wider text-muted"
              >
                Members Directory
              </Text>
              <View className="flex-row items-center gap-1.5 rounded-full border border-ink/8 bg-cream px-2.5 py-1">
                <Users size={11} color="#0E7C66" />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-[11px] text-ink"
                >
                  {memberCount === 1 ? "1 Member" : `${memberCount} Members`}
                </Text>
              </View>
            </View>

            <View className="gap-2.5">
              {summary?.balances.map(({ user: member, netBalance }, index) => {
                const isLender = netBalance > 0.01;
                const isBorrower = netBalance < -0.01;
                const isSelf = member?._id === currentUserMongoId;
                const isMemberOwner = member?._id === groupOwnerId;

                return (
                  <View
                    key={member?._id || index}
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
                      {member?.avatarUrl ? (
                        <Image
                          source={{ uri: member.avatarUrl }}
                          style={{ width: 42, height: 42, borderRadius: 21 }}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View
                          className={`h-10 w-10 items-center justify-center rounded-2xl ${
                            isMemberOwner ? "bg-coral/15" : "bg-teal/15"
                          }`}
                        >
                          <Text
                            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                            className={`text-sm ${
                              isMemberOwner ? "text-coral" : "text-teal"
                            }`}
                          >
                            {member?.name ? member.name[0].toUpperCase() : "U"}
                          </Text>
                        </View>
                      )}

                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          <Text
                            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                            className="text-[14px] text-ink"
                            numberOfLines={1}
                          >
                            {member?.name}
                          </Text>
                          {isSelf && (
                            <Text
                              style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                              className="text-xs text-muted"
                            >
                              (You)
                            </Text>
                          )}
                          {isMemberOwner && (
                            <View className="flex-row items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5">
                              <Crown size={9} color="#D97706" />
                              <Text
                                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                                className="text-[9px] text-amber-700 uppercase tracking-wide"
                              >
                                Admin
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                          className="mt-0.5 text-xs text-muted"
                          numberOfLines={1}
                        >
                          {member?.email || "No email available"}
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
                              : "text-ink/60"
                        }`}
                      >
                        {isLender
                          ? `+${formatCurrency(netBalance)}`
                          : isBorrower
                            ? `-${formatCurrency(Math.abs(netBalance))}`
                            : "$0.00"}
                      </Text>

                      <View
                        className={`mt-1 flex-row items-center gap-1 rounded-md px-2 py-0.5 ${
                          isLender
                            ? "bg-teal/10"
                            : isBorrower
                              ? "bg-coral/10"
                              : "bg-ink/5"
                        }`}
                      >
                        {isLender ? (
                          <ArrowDownLeft size={10} color="#0E7C66" />
                        ) : isBorrower ? (
                          <ArrowUpRight size={10} color="#FF6B4A" />
                        ) : null}
                        <Text
                          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                          className={`text-[10px] uppercase tracking-wide ${
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

            <View className="mt-9">
              <Text
                style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                className="mb-3 text-xs uppercase tracking-wider text-muted px-0.5"
              >
                Space Management
              </Text>

              <View className="gap-3">
                {(!isOwner || memberCount === 1) && (
                  <TouchableOpacity
                    onPress={handleLeaveGroup}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                    className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-cream active:scale-[0.99]"
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#1B1B1F" />
                    ) : (
                      <>
                        <LogOut size={16} color="#1B1B1F" strokeWidth={2} />
                        <Text
                          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                          className="text-[14px] text-ink"
                        >
                          Leave Space
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {isOwner && (
                  <TouchableOpacity
                    onPress={handleDeleteGroup}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                    className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-coral/30 bg-coral/10 active:scale-[0.99]"
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#FF6B4A" />
                    ) : (
                      <>
                        <Trash2 size={16} color="#FF6B4A" strokeWidth={2} />
                        <Text
                          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                          className="text-[14px] text-coral"
                        >
                          Delete Space
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View className="mt-3.5 flex-row items-center justify-center gap-1.5 px-4">
                <ShieldAlert size={12} color="#8A8680" />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                  className="text-center text-[11px] text-muted"
                >
                  Members must have a zero net balance ($0.00) to leave or
                  delete this space.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

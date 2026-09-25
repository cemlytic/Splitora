import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCurrentUser } from "@/context/UserContext";
import {
  Trash2,
  Receipt,
  UserCheck,
  Edit3,
  Image as ImageIcon,
  X,
} from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { useExpense, useDeleteExpense } from "@/hooks/useGroupQueries";
import { formatCurrency } from "@/utils/formatCurrency";
import TopNavigation from "@/components/common/TopNavigation";
import { hapticFeedback } from "@/utils/haptics";
import ExpenseDetailSkeleton from "@/components/skeletons/ExpenseDetailSkeleton";
import { useAppAlert } from "@/context/AlertContext";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { showAlert } = useAppAlert();

  const [showFullReceipt, setShowFullReceipt] = useState(false);

  const { data: expense, isLoading: loading } = useExpense(id);
  const deleteExpenseMutation = useDeleteExpense(expense?.groupId ?? "");

  const isPayer = expense?.paidBy?._id === currentUser?._id;
  const isLocked = Boolean(expense?.locked);

  const handleEdit = () => {
    if (!expense) return;

    if (isLocked) {
      hapticFeedback.warning();
      showAlert({
        title: "Cannot Edit Expense",
        message:
          "This expense cannot be edited because settlements have already been recorded in this group after it was created.",
        type: "warning",
      });
      return;
    }

    hapticFeedback.light();
    router.push({
      pathname: "/(app)/expense/edit",
      params: { id: expense._id },
    });
  };

  const handleDelete = () => {
    if (!expense || !currentUser) return;

    hapticFeedback.warning();
    showAlert({
      title: "Delete Expense",
      message:
        "Are you sure you want to permanently remove this expense? Group balances will be updated automatically.",
      type: "destructive",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpenseMutation.mutateAsync(expense._id);
              hapticFeedback.success();
              router.back();
            } catch (error: any) {
              console.error("Delete error:", error?.response?.data || error);
              showAlert({
                title: "Deletion Failed",
                message:
                  error?.response?.data?.message ||
                  "Could not delete this expense at this moment.",
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
          Expense Breakdown
        </Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1"
      >
        {loading ? (
          <ExpenseDetailSkeleton />
        ) : !expense ? (
          <View className="items-center justify-center py-20">
            <Text
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              className="text-base text-ink"
            >
              Expense not found
            </Text>
            <TouchableOpacity onPress={() => router.back()} className="mt-4">
              <Text
                style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                className="text-sm text-teal"
              >
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View
              style={{
                shadowColor: "#1B1B1F",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.04,
                shadowRadius: 14,
                elevation: 2,
              }}
              className="mt-4 items-center rounded-3xl border border-ink/6 bg-cream p-6"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal/10">
                <Receipt size={22} color="#0E7C66" />
              </View>
              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className="mt-3 text-center text-2xl tracking-tight text-ink"
              >
                {expense.title}
              </Text>
              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className="mt-1 text-4xl tracking-tight text-ink"
              >
                {formatCurrency(expense.amount)}
              </Text>
              <View className="mt-4 flex-row items-center gap-1.5 rounded-full border border-ink/8 bg-canvas px-3.5 py-1.5">
                <UserCheck size={13} color="#0E7C66" />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                  className="text-xs text-muted"
                >
                  Paid by
                </Text>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-xs text-ink"
                >
                  {isPayer ? "You" : expense.paidBy?.name || "Member"}
                </Text>
              </View>
            </View>

            {expense.receiptUrl && (
              <View className="mt-7">
                <View className="mb-3 flex-row items-center justify-between px-0.5">
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                    className="text-xs uppercase tracking-wider text-muted"
                  >
                    Attached Proof
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Receipt size={11} color="#0E7C66" />
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                      className="text-[10px] text-teal tracking-wide"
                    >
                      RECEIPT ATTACHED
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.light();
                    setShowFullReceipt(true);
                  }}
                  activeOpacity={0.88}
                  className="group relative overflow-hidden rounded-3xl border border-ink/8 bg-cream p-2.5 shadow-sm"
                >
                  <Image
                    source={{ uri: expense.receiptUrl }}
                    style={{ width: "100%", height: 170, borderRadius: 18 }}
                    contentFit="cover"
                    transition={250}
                  />
                  <View className="absolute bottom-4 left-4 right-4 flex-row items-center justify-between rounded-2xl border border-white/20 bg-ink/75 px-3.5 py-2.5 backdrop-blur-md">
                    <View className="flex-row items-center gap-2">
                      <ImageIcon size={14} color="#FFF8F0" />
                      <Text
                        style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                        className="text-xs text-cream"
                      >
                        Receipt Invoice
                      </Text>
                    </View>
                    <Text
                      style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                      className="text-[11px] text-coral tracking-wide"
                    >
                      TAP TO EXPAND
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View className="mt-8">
              <View className="mb-3 flex-row items-center justify-between px-0.5">
                <Text
                  style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                  className="text-xs uppercase tracking-wider text-muted"
                >
                  Split Distribution
                </Text>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                  className="text-xs text-muted"
                >
                  {expense.splits.length} members
                </Text>
              </View>

              <View className="gap-2.5">
                {expense.splits.map((split, index) => {
                  const member = split.user;
                  const isSelf = member?._id === currentUser?._id;

                  return (
                    <View
                      key={index}
                      className="flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream p-3.5 shadow-sm"
                    >
                      <View className="flex-row items-center gap-3">
                        {member?.avatarUrl ? (
                          <Image
                            source={{ uri: member.avatarUrl }}
                            style={{ width: 36, height: 36, borderRadius: 18 }}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink/5">
                            <Text
                              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                              className="text-xs text-ink"
                            >
                              {member?.name
                                ? member.name[0].toUpperCase()
                                : "U"}
                            </Text>
                          </View>
                        )}
                        <View>
                          <Text
                            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                            className="text-[14px] text-ink"
                          >
                            {isSelf ? `${member?.name} (You)` : member?.name}
                          </Text>
                          <Text
                            style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                            className="text-[11px] text-muted"
                          >
                            {isSelf ? "Your share" : "Their share"}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <Text
                          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                          className="text-[14px] text-ink"
                        >
                          {formatCurrency(split.amount)}
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1 rounded-md bg-ink/5 px-2 py-0.5">
                          <Text
                            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                            className="text-[10px] tracking-wide text-muted"
                          >
                            SHARE
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {isPayer && (
              <View className="mt-9 flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={handleEdit}
                  disabled={deleteExpenseMutation.isPending}
                  activeOpacity={0.75}
                  className={`h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border active:scale-[0.99] ${
                    isLocked
                      ? "border-ink/10 bg-ink/5 opacity-50"
                      : "border-ink/15 bg-cream"
                  }`}
                >
                  <Edit3 size={16} color={isLocked ? "#8A8680" : "#1B1B1F"} />
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    className={`text-[14px] ${isLocked ? "text-muted" : "text-ink"}`}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={deleteExpenseMutation.isPending}
                  activeOpacity={0.75}
                  className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-coral/30 bg-coral/10 active:scale-[0.99]"
                >
                  {deleteExpenseMutation.isPending ? (
                    <ActivityIndicator color="#FF6B4A" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#FF6B4A" />
                      <Text
                        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                        className="text-[14px] text-coral"
                      >
                        Delete
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {expense?.receiptUrl && (
        <Modal
          visible={showFullReceipt}
          transparent
          statusBarTranslucent
          animationType="fade"
          onRequestClose={() => setShowFullReceipt(false)}
        >
          <View className="flex-1 items-center justify-center bg-ink/95 px-5">
            <Pressable
              onPress={() => setShowFullReceipt(false)}
              className="absolute inset-0"
            />
            <View className="absolute top-14 left-6 right-6 z-20 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 rounded-full border border-cream/15 bg-cream/10 px-3.5 py-1.5 backdrop-blur-md">
                <Receipt size={14} color="#FFF8F0" />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                  className="text-xs text-cream"
                >
                  {expense.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFullReceipt(false)}
                activeOpacity={0.8}
                className="h-10 w-10 items-center justify-center rounded-full border border-cream/15 bg-cream/10"
              >
                <X size={18} color="#FFF8F0" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
            <View className="h-[75%] w-full items-center justify-center overflow-hidden rounded-3xl">
              <Image
                source={{ uri: expense.receiptUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
                transition={200}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeScreen>
  );
}

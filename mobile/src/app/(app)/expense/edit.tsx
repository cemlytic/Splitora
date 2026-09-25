import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCurrentUser } from "@/context/UserContext";
import {
  Receipt,
  UtensilsCrossed,
  Car,
  Home,
  PartyPopper,
  Check,
  Users,
} from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import ReceiptPicker from "@/components/expenses/ReceiptPicker";
import {
  useExpense,
  useGroup,
  useUpdateExpense,
} from "@/hooks/useGroupQueries";
import { hapticFeedback } from "@/utils/haptics";
import { useAppAlert } from "@/context/AlertContext";
import TopNavigation from "@/components/common/TopNavigation";
import { formatCurrency } from "@/utils/formatCurrency";

const CATEGORIES = [
  { id: "general", label: "General", Icon: Receipt },
  { id: "food", label: "Food & Drinks", Icon: UtensilsCrossed },
  { id: "transport", label: "Transport", Icon: Car },
  { id: "house", label: "Rent & Home", Icon: Home },
  { id: "fun", label: "Outing & Fun", Icon: PartyPopper },
];

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { showAlert } = useAppAlert();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const expenseQuery = useExpense(id);
  const expense = expenseQuery.data;
  const fetching = expenseQuery.isLoading;

  const groupQuery = useGroup(expense?.groupId);
  const group = groupQuery.data ?? null;

  const updateExpenseMutation = useUpdateExpense(expense?.groupId ?? "");
  const loading = updateExpenseMutation.isPending;

  // expense yüklendiğinde form alanlarını bir kereye mahsus doldur.
  useEffect(() => {
    if (!expense) return;

    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setSelectedCategory(expense.category || "general");
    setReceiptImage(expense.receiptUrl || null);

    const activeIds = expense.splits.map((s) =>
      typeof s.user === "string" ? s.user : (s.user as any)._id,
    );
    setSelectedMemberIds(activeIds);
  }, [expense?._id]);

  const toggleMember = (memberId: string) => {
    hapticFeedback.light();
    setSelectedMemberIds((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSelectAll = () => {
    if (!group) return;
    hapticFeedback.light();
    const allIds = (group.members as any[]).map((m) =>
      typeof m === "string" ? m : m._id,
    );
    if (selectedMemberIds.length === allIds.length) {
      setSelectedMemberIds([allIds[0]]);
    } else {
      setSelectedMemberIds(allIds);
    }
  };

  const handleUpdate = async () => {
    const trimmedTitle = title.trim();
    const parsedAmount = parseFloat(amount.replace(",", "."));

    if (!trimmedTitle || isNaN(parsedAmount) || parsedAmount <= 0) {
      hapticFeedback.warning();
      showAlert({
        title: "Invalid Input",
        message: "Please enter a valid title and positive amount.",
        type: "warning",
      });
      return;
    }

    if (selectedMemberIds.length === 0) {
      hapticFeedback.warning();
      showAlert({
        title: "No Members Selected",
        message:
          "Please select at least one person to split this expense with.",
        type: "warning",
      });
      return;
    }

    if (!currentUser || !id) return;

    try {
      await updateExpenseMutation.mutateAsync({
        expenseId: id,
        title: trimmedTitle,
        amount: parsedAmount,
        category: selectedCategory,
        splitUserIds: selectedMemberIds,
        receiptUrl: receiptImage,
      });
      hapticFeedback.success();
      showAlert({
        title: "Changes Saved",
        message: "Your expense breakdown has been updated successfully.",
        type: "success",
        buttons: [
          {
            text: "Done",
            style: "default",
            onPress: () => router.back(),
          },
        ],
      });
    } catch (error: any) {
      console.error("Update expense error:", error);
      showAlert({
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          "Could not update this expense. Ensure no settlements have been paid.",
        type: "warning",
      });
    }
  };

  const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;
  const splitPerPerson =
    selectedMemberIds.length > 0 ? parsedAmount / selectedMemberIds.length : 0;
  const isFormValid =
    title.trim().length > 0 &&
    amount.trim().length > 0 &&
    selectedMemberIds.length > 0;

  const allSelected =
    group?.members && selectedMemberIds.length === group.members.length;

  if (fetching) {
    return (
      <SafeScreen
        includeBottom
        className="flex-1 bg-canvas items-center justify-center"
      >
        <ActivityIndicator size="small" color="#0E7C66" />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas px-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between py-3">
          <TopNavigation />

          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className="text-base tracking-tight text-ink"
          >
            Edit Expense
          </Text>

          <View className="h-10 w-10" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 28 }}
          className="flex-1"
        >
          <View className="mt-6 items-center justify-center rounded-3xl border border-ink/6 bg-cream py-8 px-4 shadow-sm">
            <Text
              style={{ fontFamily: "SpaceGrotesk_500Medium" }}
              className="text-xs uppercase tracking-wider text-muted"
            >
              Amount to Split
            </Text>

            <View className="mt-2 flex-row items-center justify-center">
              <Text
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                className="text-4xl text-ink mr-2"
              >
                $
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#8A8680"
                keyboardType="decimal-pad"
                selectionColor="#0E7C66"
                style={{
                  fontFamily: "SpaceGrotesk_700Bold",
                  fontSize: 46,
                  color: "#1B1B1F",
                  minWidth: 140,
                  textAlign: "center",
                }}
              />
            </View>

            {parsedAmount > 0 && (
              <View className="mt-3 flex-row items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3.5 py-1">
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-xs text-teal"
                >
                  {formatCurrency(splitPerPerson)}
                </Text>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                  className="text-xs text-teal/80"
                >
                  each ({selectedMemberIds.length} of{" "}
                  {group?.members?.length || 0})
                </Text>
              </View>
            )}
          </View>

          <View className="mt-7">
            <Text
              style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
              className="mb-2 text-xs uppercase tracking-wider text-muted"
            >
              Description
            </Text>

            <View
              className={`rounded-2xl border bg-cream px-4 py-3.5 transition-all ${
                isTitleFocused ? "border-ink/40 shadow-sm" : "border-ink/10"
              }`}
            >
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Sushi Dinner, Taxi to Hotel"
                placeholderTextColor="#8A8680"
                selectionColor="#FF6B4A"
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => setIsTitleFocused(false)}
                style={{
                  fontFamily: "SpaceGrotesk_500Medium",
                  fontSize: 15,
                  color: "#1B1B1F",
                }}
              />
            </View>
          </View>

          <View className="mt-7">
            <Text
              style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
              className="mb-3 text-xs uppercase tracking-wider text-muted"
            >
              Category
            </Text>

            <View className="flex-row flex-wrap gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const { Icon } = cat;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      hapticFeedback.light();
                      setSelectedCategory(cat.id);
                    }}
                    activeOpacity={0.75}
                    className={`flex-row items-center gap-2 rounded-xl px-3.5 py-2.5 border transition-all ${
                      isSelected
                        ? "bg-ink border-ink shadow-sm"
                        : "bg-cream border-ink/8"
                    }`}
                  >
                    <Icon
                      size={14}
                      color={isSelected ? "#FFF8F0" : "#8A8680"}
                      strokeWidth={isSelected ? 2.5 : 2}
                    />
                    <Text
                      style={{
                        fontFamily: isSelected
                          ? "SpaceGrotesk_700Bold"
                          : "SpaceGrotesk_500Medium",
                      }}
                      className={`text-xs ${
                        isSelected ? "text-cream" : "text-ink"
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <ReceiptPicker
            imageUri={receiptImage}
            onImageChange={setReceiptImage}
          />

          <View className="mt-7">
            <View className="flex-row items-center justify-between mb-3 px-0.5">
              <View className="flex-row items-center gap-2">
                <Users size={14} color="#1B1B1F" />
                <Text
                  style={{ fontFamily: "SpaceGrotesk_600SemiBold" }}
                  className="text-xs uppercase tracking-wider text-muted"
                >
                  Split With ({selectedMemberIds.length}/
                  {group?.members?.length || 0})
                </Text>
              </View>

              {group && (
                <TouchableOpacity
                  onPress={handleSelectAll}
                  activeOpacity={0.7}
                  className="rounded-lg bg-teal/10 px-2.5 py-1"
                >
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    className="text-[11px] text-teal tracking-wide"
                  >
                    {allSelected ? "DESELECT ALL" : "SELECT ALL"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="gap-2">
              {(group?.members as any[])?.map((member) => {
                const mId = typeof member === "string" ? member : member._id;
                const isSelected = selectedMemberIds.includes(mId);
                const isSelf = member?._id === currentUser?._id;
                const memberName = member?.name || "Member";
                const avatarUrl = member?.avatarUrl;

                return (
                  <TouchableOpacity
                    key={mId}
                    onPress={() => toggleMember(mId)}
                    activeOpacity={0.8}
                    className={`flex-row items-center justify-between rounded-2xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-teal/30 bg-cream shadow-sm"
                        : "border-ink/6 bg-cream/40 opacity-50"
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      {avatarUrl ? (
                        <Image
                          source={{ uri: avatarUrl }}
                          style={{ width: 34, height: 34, borderRadius: 17 }}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View
                          className={`h-8.5 w-8.5 items-center justify-center rounded-xl ${
                            isSelected ? "bg-teal/15" : "bg-ink/5"
                          }`}
                        >
                          <Text
                            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                            className={`text-xs ${
                              isSelected ? "text-teal" : "text-ink/60"
                            }`}
                          >
                            {memberName[0]?.toUpperCase() || "M"}
                          </Text>
                        </View>
                      )}

                      <View>
                        <Text
                          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                          className="text-[14px] text-ink"
                          numberOfLines={1}
                        >
                          {memberName}
                          {isSelf && (
                            <Text
                              style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                              className="text-muted text-xs"
                            >
                              {" "}
                              (You)
                            </Text>
                          )}
                        </Text>

                        {isSelected && parsedAmount > 0 && (
                          <Text
                            style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                            className="text-[11px] text-teal"
                          >
                            Owes {formatCurrency(splitPerPerson)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View
                      style={
                        isSelected
                          ? {
                              shadowColor: "#0E7C66",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.25,
                              shadowRadius: 4,
                              elevation: 2,
                            }
                          : undefined
                      }
                      className={`h-6 w-6 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? "border-teal bg-teal"
                          : "border-ink/20 bg-canvas"
                      }`}
                    >
                      {isSelected && (
                        <Check size={12} color="#FFF8F0" strokeWidth={3} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View className="mb-2 pt-2">
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={loading || !isFormValid}
            activeOpacity={0.85}
            style={
              isFormValid
                ? {
                    shadowColor: "#0E7C66",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 14,
                    elevation: 4,
                  }
                : undefined
            }
            className={`h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl ${
              isFormValid ? "bg-teal active:scale-[0.99]" : "bg-ink/10"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFF8F0" />
            ) : (
              <>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className={`text-[15px] ${
                    isFormValid ? "text-cream" : "text-muted"
                  }`}
                >
                  Save Changes
                </Text>
                <Check
                  size={16}
                  color={isFormValid ? "#FFF8F0" : "#8A8680"}
                  strokeWidth={2.5}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

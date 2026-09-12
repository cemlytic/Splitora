import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/expo";
import {
  ArrowLeft,
  Receipt,
  UtensilsCrossed,
  Car,
  Home,
  PartyPopper,
  Info,
  Check,
} from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { expenseService } from "@/services/expenseService";
import { hapticFeedback } from "@/utils/haptics";

const CATEGORIES = [
  { id: "general", label: "General", Icon: Receipt },
  { id: "food", label: "Food & Drinks", Icon: UtensilsCrossed },
  { id: "transport", label: "Transport", Icon: Car },
  { id: "house", label: "Rent & Home", Icon: Home },
  { id: "fun", label: "Outing & Fun", Icon: PartyPopper },
];

export default function CreateExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    const parsedAmount = parseFloat(amount.replace(",", "."));

    if (!trimmedTitle) {
      Alert.alert("Missing Details", "Please provide a name for this expense.");
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid expense amount greater than 0.",
      );
      return;
    }

    if (!user?.id || !groupId) {
      Alert.alert("Session Error", "Group reference or user profile missing.");
      return;
    }

    try {
      setLoading(true);
      await expenseService.createExpense({
        groupId,
        clerkId: user.id,
        title: trimmedTitle,
        amount: parsedAmount,
        category: selectedCategory,
      });
      hapticFeedback.success();

      router.back();
    } catch (error: any) {
      console.error(
        "Failed to create expense:",
        error?.response?.data || error,
      );
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not save the expense. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = title.trim().length > 0 && amount.trim().length > 0;

  return (
    <SafeScreen includeBottom className="flex-1 bg-canvas px-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between py-3">
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
            Add Expense
          </Text>

          <View className="h-10 w-10" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                autoFocus
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

          <View className="mt-8 flex-row items-start gap-3 rounded-2xl border border-teal/15 bg-teal/5 p-4">
            <Info size={16} color="#0E7C66" className="mt-0.5" />
            <Text
              style={{ fontFamily: "SpaceGrotesk_400Regular" }}
              className="flex-1 text-xs leading-5 text-teal"
            >
              This expense will be split evenly across all space members. You
              will be recorded as the sole payer.
            </Text>
          </View>
        </ScrollView>

        <View className="mb-2 pt-2">
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading || !isFormValid}
            activeOpacity={0.85}
            style={
              isFormValid
                ? {
                    shadowColor: "#FF6B4A",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 14,
                    elevation: 4,
                  }
                : undefined
            }
            className={`h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl ${
              isFormValid ? "bg-coral active:scale-[0.99]" : "bg-ink/10"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#1B1B1F" />
            ) : (
              <>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className={`text-[15px] ${
                    isFormValid ? "text-ink" : "text-muted"
                  }`}
                >
                  Save Expense
                </Text>
                <Check
                  size={16}
                  color={isFormValid ? "#1B1B1F" : "#8A8680"}
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

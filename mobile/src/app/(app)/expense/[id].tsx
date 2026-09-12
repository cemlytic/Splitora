import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/expo";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Clock,
  Receipt,
  UserCheck,
} from "lucide-react-native";
import SafeScreen from "@/components/SafeScreen";
import { expenseService } from "@/services/expenseService";
import type { Expense } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import TopNavigation from "@/components/common/TopNavigation";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (!id) return;
    expenseService
      .getExpenseById(id)
      .then((data) => setExpense(data))
      .catch((err) => {
        console.error("Failed to load expense details:", err);
        Alert.alert("Error", "Could not fetch expense details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    if (!expense || !user?.id) return;

    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense? All balances in this group will be automatically recalculated.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await expenseService.deleteExpense(expense._id, user.id);
              router.back();
            } catch (error: any) {
              console.error("Delete error:", error?.response?.data || error);
              Alert.alert(
                "Deletion Failed",
                error?.response?.data?.message ||
                  "Could not delete this expense.",
              );
            } finally {
              setDeleting(false);
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

  if (!expense) {
    return (
      <SafeScreen className="flex-1 items-center justify-center bg-canvas px-6">
        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-base text-ink"
        >
          Expense not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text
            style={{ fontFamily: "SpaceGrotesk_500Medium" }}
            className="text-sm text-teal"
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeScreen>
    );
  }

  const isPayer = expense.paidBy?.clerkId === user?.id;

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

        <View className="mt-8">
          <View className="mb-3 flex-row items-center justify-between">
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
              const isSelf = member?.clerkId === user?.id;

              return (
                <View
                  key={index}
                  className="flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream p-3.5"
                >
                  <View className="flex-row items-center gap-3">
                    {member?.avatarUrl ? (
                      <Image
                        source={{ uri: member.avatarUrl }}
                        style={{ width: 38, height: 38, borderRadius: 19 }}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink/5">
                        <Text
                          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                          className="text-xs text-ink"
                        >
                          {member?.name ? member.name[0].toUpperCase() : "U"}
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
                        {split.isSettled ? "Settled up" : "Pending payment"}
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

                    <View
                      className={`mt-1 flex-row items-center gap-1 rounded-md px-2 py-0.5 ${
                        split.isSettled ? "bg-teal/10" : "bg-coral/10"
                      }`}
                    >
                      {split.isSettled ? (
                        <CheckCircle2 size={10} color="#0E7C66" />
                      ) : (
                        <Clock size={10} color="#FF6B4A" />
                      )}
                      <Text
                        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                        className={`text-[10px] ${
                          split.isSettled ? "text-teal" : "text-coral"
                        }`}
                      >
                        {split.isSettled ? "SETTLED" : "OWES"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {isPayer && (
          <View className="mt-10">
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.75}
              className="h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-coral/30 bg-coral/10"
            >
              {deleting ? (
                <ActivityIndicator color="#FF6B4A" />
              ) : (
                <>
                  <Trash2 size={16} color="#FF6B4A" />
                  <Text
                    style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    className="text-[14px] text-coral"
                  >
                    Delete Expense
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

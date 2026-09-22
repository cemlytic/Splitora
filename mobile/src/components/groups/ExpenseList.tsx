import { View, Text, TouchableOpacity } from "react-native";
import { Receipt, CreditCard } from "lucide-react-native";
import type { Expense } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { useRouter } from "expo-router";

interface ExpenseListProps {
  expenses: Expense[];
  currentUserId: string | undefined;
}

export default function ExpenseList({
  expenses,
  currentUserId,
}: ExpenseListProps) {
  const router = useRouter();

  if (expenses.length === 0) {
    return (
      <View className="mt-5 items-center justify-center rounded-3xl border border-dashed border-ink/10 bg-cream/30 px-6 py-12">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-ink/5">
          <Receipt size={18} color="#8A8680" />
        </View>
        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="mt-3 text-sm text-ink"
        >
          No expenses logged yet
        </Text>
        <Text
          style={{ fontFamily: "SpaceGrotesk_400Regular" }}
          className="mt-1 text-center text-xs text-muted"
        >
          Tap the button below to log your first shared expense.
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-5 gap-3">
      {expenses.map((expense) => {
        const isPayer = expense.paidBy?._id === currentUserId;

        return (
          <TouchableOpacity
            key={expense._id}
            onPress={() => router.push(`/(app)/expense/${expense._id}`)}
            activeOpacity={0.75}
            style={{
              shadowColor: "#1B1B1F",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 1,
            }}
            className="flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream p-4"
          >
            <View className="flex-row items-center gap-3.5">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-ink/5">
                <CreditCard size={18} color="#1B1B1F" />
              </View>
              <View>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-[15px] text-ink"
                >
                  {expense.title}
                </Text>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_400Regular" }}
                  className="mt-0.5 text-xs text-muted"
                >
                  {isPayer
                    ? "Paid by you"
                    : `Paid by ${expense.paidBy?.name || "Member"}`}
                </Text>
              </View>
            </View>

            <Text
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              className="text-[15px] tracking-tight text-ink"
            >
              {formatCurrency(expense.amount)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
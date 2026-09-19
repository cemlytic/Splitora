import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import type { GroupSummary } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { hapticFeedback } from "@/utils/haptics";

interface DebtListProps {
  summary: GroupSummary | null;
  currentUserId: string | undefined;
  onSettleUp: (debtInfo: {
    receiverClerkId: string;
    receiverName: string;
    receiverIban?: string;
    accountHolder?: string;
    amount: number;
  }) => void;
}

export default function DebtList({
  summary,
  currentUserId,
  onSettleUp,
}: DebtListProps) {
  const debts = summary?.debts || [];

  if (debts.length === 0) {
    return (
      <View className="mt-5 items-center justify-center rounded-3xl border border-dashed border-teal/20 bg-teal/5 px-6 py-12">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-teal/15">
          <CheckCircle2 size={20} color="#0E7C66" />
        </View>
        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="mt-3 text-sm text-teal"
        >
          Everything is balanced
        </Text>
        <Text
          style={{ fontFamily: "SpaceGrotesk_400Regular" }}
          className="mt-1 text-center text-xs text-muted"
        >
          All settled up! No outstanding payments between members.
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-5 gap-3">
      {debts.map((debt: any, index: number) => {
        const iOwe = debt.from.clerkId === currentUserId;
        const owesMe = debt.to.clerkId === currentUserId;

        return (
          <View
            key={index}
            className="flex-row items-center justify-between rounded-2xl border border-ink/6 bg-cream p-4"
          >
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-1.5">
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-sm text-ink"
                >
                  {iOwe ? "You" : debt.from.name}
                </Text>
                <Text className="text-xs text-muted">→</Text>
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-sm text-ink"
                >
                  {owesMe ? "You" : debt.to.name}
                </Text>
              </View>

              <Text
                style={{ fontFamily: "SpaceGrotesk_500Medium" }}
                className="mt-1 text-xs text-muted"
              >
                Amount:{" "}
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className={
                    iOwe ? "text-coral" : owesMe ? "text-teal" : "text-ink"
                  }
                >
                  {formatCurrency(debt.amount)}
                </Text>
              </Text>
            </View>

            {iOwe && (
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  onSettleUp({
                    receiverClerkId: debt.to.clerkId,
                    receiverName: debt.to.name,
                    receiverIban: debt.to.iban,
                    accountHolder: debt.to.bankAccountHolder,
                    amount: debt.amount,
                  });
                }}
                activeOpacity={0.7}
                className="rounded-xl bg-coral px-3.5 py-2"
              >
                <Text
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                  className="text-xs text-ink"
                >
                  Settle Up
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

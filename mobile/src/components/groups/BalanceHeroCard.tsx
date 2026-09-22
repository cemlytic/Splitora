import { View, Text } from "react-native";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import type { GroupSummary } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

interface BalanceHeroCardProps {
  summary: GroupSummary | null;
  currentUserId: string | undefined;
}

export default function BalanceHeroCard({
  summary,
  currentUserId,
}: BalanceHeroCardProps) {
  const myBalanceItem = summary?.balances.find(
    (b) => b.user._id === currentUserId,
  );
  const myNet = myBalanceItem ? myBalanceItem.netBalance : 0;
  const isLender = myNet > 0;
  const isBorrower = myNet < 0;

  return (
    <View
      style={{
        shadowColor: "#1B1B1F",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 5,
      }}
      className="mt-3 rounded-3xl bg-ink p-6"
    >
      <View className="flex-row items-center justify-between">
        <Text
          style={{ fontFamily: "SpaceGrotesk_500Medium" }}
          className="text-xs uppercase tracking-wider text-cream/60"
        >
          Your Net Standing
        </Text>

        <View
          className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${
            isLender ? "bg-teal/20" : isBorrower ? "bg-coral/20" : "bg-cream/10"
          }`}
        >
          {isLender ? (
            <ArrowDownLeft size={12} color="#0E7C66" />
          ) : isBorrower ? (
            <ArrowUpRight size={12} color="#FF6B4A" />
          ) : null}
          <Text
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            className={`text-[11px] ${
              isLender
                ? "text-teal"
                : isBorrower
                  ? "text-coral"
                  : "text-cream/70"
            }`}
          >
            {isLender ? "You are owed" : isBorrower ? "You owe" : "Settled up"}
          </Text>
        </View>
      </View>
      <Text
        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
        className={`mt-2 text-4xl tracking-tight ${
          isLender ? "text-teal" : isBorrower ? "text-coral" : "text-cream"
        }`}
      >
        {isLender
          ? `+${formatCurrency(myNet)}`
          : isBorrower
            ? `-${formatCurrency(myNet)}`
            : "$0.00"}
      </Text>

      <View className="mt-5 flex-row items-center justify-between border-t border-cream/10 pt-3.5">
        <Text
          style={{ fontFamily: "SpaceGrotesk_400Regular" }}
          className="text-xs text-cream/70"
        >
          Total Group Spend
        </Text>
        <Text
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-sm text-cream"
        >
          {formatCurrency(summary?.totalExpense || 0)}
        </Text>
      </View>
    </View>
  );
}

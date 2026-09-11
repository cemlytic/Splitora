import { View, Text, TouchableOpacity } from "react-native";
import { Receipt, Scale } from "lucide-react-native";

export type GroupTabType = "expenses" | "balances";

interface GroupTabsProps {
  activeTab: GroupTabType;
  onTabChange: (tab: GroupTabType) => void;
  expensesCount: number;
  debtsCount: number;
}

export default function GroupTabs({
  activeTab,
  onTabChange,
  expensesCount,
  debtsCount,
}: GroupTabsProps) {
return (
    <View className="mt-7 flex-row rounded-2xl border border-ink/8 bg-cream/70 p-1.5">
    <TouchableOpacity
      onPress={() => onTabChange("expenses")}
      activeOpacity={0.8}
      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
        activeTab === "expenses" ? "bg-ink shadow-sm" : ""
      }`}
    >
      <Receipt
        size={14}
        color={activeTab === "expenses" ? "#FFF8F0" : "#8A8680"}
      />
      <Text
        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
        className={`text-xs ${
          activeTab === "expenses" ? "text-cream" : "text-muted"
        }`}
      >
        Expenses ({expensesCount})
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => onTabChange("balances")}
      activeOpacity={0.8}
      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
        activeTab === "balances" ? "bg-ink shadow-sm" : ""
      }`}
    >
      <Scale
        size={14}
        color={activeTab === "balances" ? "#FFF8F0" : "#8A8680"}
      />
      <Text
        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
        className={`text-xs ${
          activeTab === "balances" ? "text-cream" : "text-muted"
        }`}
      >
        Debts ({debtsCount})
      </Text>
    </TouchableOpacity>
  </View>
)
}

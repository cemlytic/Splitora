import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { Expense, Group, GroupSummary } from "@/types";

export const exportGroupToCSV = async (
  group: Group | null,
  expenses: Expense[],
  summary: GroupSummary | null,
) => {
  if (!group) return;

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sharing is not available on this device");
  }

  const lines: string[] = [];
  lines.push(`Space Financial Report: ${group.name}`);
  lines.push(`Generated At: ${new Date().toLocaleString()}`);
  lines.push(`Total Expenses: ${expenses.length}`);
  lines.push(`Total Volume: $${summary?.totalExpense?.toFixed(2) || "0.00"}`);
  lines.push("");

  lines.push("--- EXPENSES LOG ---");
  lines.push("Title,Category,Amount,Paid By,Date,Settled Status");

  expenses.forEach((exp) => {
    const title = `"${exp.title.replace(/"/g, '""')}"`;
    const category = exp.category || "other";
    const amount = exp.amount.toFixed(2);
    const paidBy = `"${exp.paidBy?.name || "Unknown"}"`;
    const date = exp.createdAt
      ? new Date(exp.createdAt).toLocaleDateString()
      : "N/A";
    const settledCount = exp.splits.filter((s) => s.isSettled).length;
    const totalSplits = exp.splits.length;
    const status =
      settledCount === totalSplits
        ? "Fully Settled"
        : `${settledCount}/${totalSplits} Settled`;

    lines.push(`${title},${category},${amount},${paidBy},${date},${status}`);
  });

  lines.push("");

  lines.push("--- UNSETTLED DEBTS ---");
  lines.push("Debtor (Owes),Creditor (Gets Back),Amount");

  if (!summary?.debts || summary.debts.length === 0) {
    lines.push("All settled up - No active debts,,");
  } else {
    summary.debts.forEach((debt) => {
      const fromName = `"${debt.from?.name || "Unknown"}"`;
      const toName = `"${debt.to?.name || "Unknown"}"`;
      const debtAmount = debt.amount.toFixed(2);
      lines.push(`${fromName},${toName},${debtAmount}`);
    });
  }

  const csvContent = "\uFEFF" + lines.join("\n");

  const sanitizedGroupName = group.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${sanitizedGroupName}_Report_${new Date().toISOString().split("T")[0]}.csv`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/csv",
    dialogTitle: `Export ${group.name} Report`,
    UTI: "public.comma-separated-values-text",
  });
};

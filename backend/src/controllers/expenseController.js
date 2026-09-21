import { Expense } from "../db/models/Expense.js";
import { Group } from "../db/models/Group.js";
import { User } from "../db/models/User.js";
import { sendPushNotifications } from "../utils/pushNotifications.js";

export const createExpense = async (req, res) => {
  try {
    const {
      groupId,
      clerkId,
      title,
      amount,
      category,
      splitUserIds,
      receiptUrl,
    } = req.body;

    if (!groupId || !clerkId || !title || !amount) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: groupId, clerkId, title, and amount are mandatory.",
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid transaction amount. Amount must be a positive numeric value.",
      });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Issuer account not found. Authorization declined.",
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Target expense group not found.",
      });
    }

    const isMember = group.members.some((member) => {
      const memberIdStr = member._id
        ? member._id.toString()
        : member.toString();
      return memberIdStr === user._id.toString();
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized transaction. User does not have membership in this group.",
      });
    }

    const allGroupMemberIds = group.members.map((m) =>
      m._id ? m._id.toString() : m.toString(),
    );

    let targetMemberIds = allGroupMemberIds;

    if (Array.isArray(splitUserIds) && splitUserIds.length > 0) {
      targetMemberIds = allGroupMemberIds.filter((id) =>
        splitUserIds.map((s) => s.toString()).includes(id),
      );

      if (targetMemberIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No eligible recipients selected for expense allocation.",
        });
      }
    }

    const memberCount = targetMemberIds.length;
    const splitAmount = Number((numericAmount / memberCount).toFixed(2));
    const payerIdStr = user._id.toString();

    const splits = targetMemberIds.map((memberIdStr) => {
      const isPayer = memberIdStr === payerIdStr;
      return {
        user: memberIdStr,
        amount: splitAmount,
        isSettled: isPayer,
      };
    });

    const newExpense = await Expense.create({
      groupId: group._id,
      title: title.trim(),
      amount: numericAmount,
      category: category || "general",
      paidBy: user._id,
      splits,
      receiptUrl: receiptUrl || null,
    });

    const populatedExpense = await Expense.findById(newExpense._id)
      .populate("paidBy", "name email clerkId avatarUrl")
      .populate("splits.user", "name email clerkId avatarUrl");

    const debtorUserIds = targetMemberIds.filter((id) => id !== payerIdStr);

    if (debtorUserIds.length > 0) {
      User.find({
        _id: { $in: debtorUserIds },
        pushToken: { $exists: true, $ne: null },
      })
        .select("_id name pushToken clerkId")
        .then(async (recipients) => {
          const validRecipients = recipients.filter(
            (r) => r.pushToken && r.pushToken.startsWith("ExponentPushToken"),
          );

          if (validRecipients.length === 0) {
            console.warn(
              `[PushService] No valid push tokens found for group: ${group._id.toString()}`,
            );
            return;
          }

          const messages = validRecipients.map((recipient) => ({
            to: recipient.pushToken,
            sound: "default",
            title: `${group.name}: New Expense Added`,
            body: `${user.name || "A member"} paid for "${title.trim()}". Your share: $${splitAmount}`,
            data: {
              type: "EXPENSE_CREATED",
              groupId: group._id.toString(),
              expenseId: newExpense._id.toString(),
            },
          }));

          console.info(
            `[PushService] Dispatching ${messages.length} push notification(s) for expense: ${newExpense._id.toString()}`,
          );

          const result = await sendPushNotifications(messages);
          console.info("[PushService] Delivery batch executed:", result);
        })
        .catch((error) =>
          console.error(
            "[PushService] Notification dispatch failure:",
            error.message,
          ),
        );
    }

    return res.status(201).json({
      success: true,
      message: "Expense recorded successfully.",
      data: populatedExpense,
    });
  } catch (error) {
    console.error("[ExpenseController:createExpense] Internal error:", error);
    return res.status(500).json({
      success: false,
      message:
        "An internal server error occurred while processing the expense.",
    });
  }
};

export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await Expense.find({ groupId })
      .populate("paidBy", "name email clerkId avatarUrl")
      .populate("splits.user", "name email clerkId avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching group expenses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupBalanceSummary = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate(
      "members",
      "name email avatarUrl clerkId iban bankAccountHolder",
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const expenses = await Expense.find({ groupId })
      .populate("paidBy", "name email clerkId avatarUrl iban bankAccountHolder")
      .populate(
        "splits.user",
        "name email clerkId avatarUrl iban bankAccountHolder",
      );

    const totalGroupExpense = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );

    const balances = {};

    group.members.forEach((member) => {
      balances[member._id.toString()] = {
        user: member,
        netBalance: 0,
      };
    });

    expenses.forEach((expense) => {
      if (!expense.paidBy) return;

      const payerId = expense.paidBy._id
        ? expense.paidBy._id.toString()
        : expense.paidBy.toString();

      if (!balances[payerId]) {
        balances[payerId] = {
          user: expense.paidBy,
          netBalance: 0,
        };
      }

      expense.splits.forEach((split) => {
        if (!split.user) return;

        const splitUserId = split.user._id
          ? split.user._id.toString()
          : split.user.toString();

        if (!balances[splitUserId]) {
          balances[splitUserId] = {
            user: split.user,
            netBalance: 0,
          };
        }

        if (!split.isSettled && splitUserId !== payerId) {
          balances[splitUserId].netBalance -= split.amount;
          balances[payerId].netBalance += split.amount;
        }
      });
    });

    const debtors = [];
    const creditors = [];

    Object.values(balances).forEach((item) => {
      const balance = Number(item.netBalance.toFixed(2));
      if (balance < -0.01) {
        debtors.push({ user: item.user, netBalance: balance });
      } else if (balance > 0.01) {
        creditors.push({ user: item.user, netBalance: balance });
      }
    });

    const debts = [];
    let debtIndex = 0;
    let creditIndex = 0;

    const workingDebtors = debtors.map((d) => ({ ...d }));
    const workingCreditors = creditors.map((c) => ({ ...c }));

    while (
      debtIndex < workingDebtors.length &&
      creditIndex < workingCreditors.length
    ) {
      const debtor = workingDebtors[debtIndex];
      const creditor = workingCreditors[creditIndex];

      const debtAmount = Math.min(
        Math.abs(debtor.netBalance),
        creditor.netBalance,
      );
      const roundedAmount = Number(debtAmount.toFixed(2));

      if (roundedAmount > 0) {
        debts.push({
          from: debtor.user,
          to: creditor.user,
          amount: roundedAmount,
        });
      }

      debtor.netBalance += debtAmount;
      creditor.netBalance -= debtAmount;

      if (Math.abs(debtor.netBalance) < 0.01) debtIndex++;
      if (creditor.netBalance < 0.01) creditIndex++;
    }

    return res.status(200).json({
      totalExpense: Number(totalGroupExpense.toFixed(2)),
      balances: Object.values(balances),
      debts,
    });
  } catch (error) {
    console.error("Error calculating summary:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const settleUp = async (req, res) => {
  try {
    const { groupId, payerClerkId, receiverClerkId } = req.body;

    if (!groupId || !payerClerkId || !receiverClerkId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [payer, receiver, group] = await Promise.all([
      User.findOne({ clerkId: payerClerkId }),
      User.findOne({ clerkId: receiverClerkId }),
      Group.findById(groupId),
    ]);

    if (!payer || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await Expense.updateMany(
      {
        groupId,
        paidBy: receiver._id,
        "splits.user": payer._id,
        "splits.isSettled": false,
      },
      {
        $set: { "splits.$[elem].isSettled": true },
      },
      {
        arrayFilters: [{ "elem.user": payer._id }],
      },
    );

    if (receiver.pushToken) {
      sendPushNotifications([
        {
          to: receiver.pushToken,
          sound: "default",
          title: "Payment Settled",
          body: `${payer.name || "A member"} settled their debt${group ? ` in "${group.name}"` : ""}.`,
          data: {
            type: "SETTLEMENT_CONFIRMED",
            groupId: groupId.toString(),
            payerClerkId,
          },
        },
      ]).catch((err) =>
        console.error(
          "[PushService] Settlement notification delivery failure:",
          err.message,
        ),
      );
    }

    res.status(200).json({
      message: "Debts settled successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error settling up", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "name email clerkId avatarUrl")
      .populate("splits.user", "name email clerkId avatarUrl");
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching expense detail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { clerkId, title, amount, category, splitUserIds, receiptUrl } =
      req.body;

    if (!clerkId || !title || !amount)
      return res.status(400).json({ message: "Missing fields" });

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (expense.paidBy.toString() !== user._id.toString())
      return res.status(403).json({ message: "You are not authorized." });

    const hasSettledPayments = expense.splits.some(
      (split) =>
        split.isSettled && split.user.toString() !== user._id.toString(),
    );

    if (hasSettledPayments)
      return res.status(400).json({
        message:
          "Cannot edit an expense with settled settlements. Settle payments exist.",
      });

    const group = await Group.findById(expense.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const allGroupMemberIds = group.members.map((m) =>
      m._id ? m._id.toString() : m.toString(),
    );

    let targetMemberIds = allGroupMemberIds;
    if (Array.isArray(splitUserIds) && splitUserIds.length > 0) {
      targetMemberIds = allGroupMemberIds.filter((id) =>
        splitUserIds.map((s) => s.toString()).includes(id),
      );

      if (targetMemberIds.length === 0) {
        return res.status(400).json({
          message: "At least one valid group member must be selected",
        });
      }
    }

    const memberCount = targetMemberIds.length;
    const splitAmount = Number((numericAmount / memberCount).toFixed(2));
    const payerIdStr = user._id.toString();

    const splits = targetMemberIds.map((memberIdStr) => {
      const isPayer = memberIdStr === payerIdStr;
      return {
        user: memberIdStr,
        amount: splitAmount,
        isSettled: isPayer,
      };
    });

    expense.title = title.trim();
    expense.amount = numericAmount;
    expense.category = category || expense.category;
    expense.splits = splits;

    if (receiptUrl !== undefined) {
      expense.receiptUrl = receiptUrl;
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email clerkId avatarUrl")
      .populate("splits.user", "name email clerkId avatarUrl");

    return res.status(200).json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const clerkId = req.query.clerkId || req.body?.clerkId;

    if (!clerkId) {
      return res.status(400).json({ message: "id is required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    if (expense.paidBy.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this expense" });
    }

    const hasSettledSplits = expense.splits.some(
      (split) =>
        split.isSettled && split.user.toString() !== user._id.toString(),
    );

    if (hasSettledSplits) {
      return res.status(400).json({
        message: "Cannot delete an expense that already has settled payments",
      });
    }

    await Expense.findByIdAndDelete(expenseId);
    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

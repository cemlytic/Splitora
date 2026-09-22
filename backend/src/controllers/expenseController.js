import { Expense } from "../db/models/Expense.js";
import { Group } from "../db/models/Group.js";
import { User } from "../db/models/User.js";
import { sendPushNotifications } from "../utils/pushNotifications.js";

const findExpenseAndCheckMembership = async (expenseId, userId) => {
  const expense = await Expense.findById(expenseId);
  if (!expense) return { error: 404, message: "Expense not found" };

  const group = await Group.findOne({ _id: expense.groupId, members: userId });
  if (!group) return { error: 403, message: "Not a member of this group" };

  return { expense, group };
};

export const createExpense = async (req, res) => {
  try {
    const { title, amount, category, splitUserIds, receiptUrl } = req.body;
    const group = req.group;
    const user = req.user;

    if (!title || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters: title and amount are mandatory",
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

    const allGroupMemberIds = group.members.map((m) => m.toString());

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

    const splits = targetMemberIds.map((memberIdStr) => ({
      user: memberIdStr,
      amount: splitAmount,
      isSettled: memberIdStr === payerIdStr,
    }));

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
      .populate("paidBy", "name emai avatarUrl")
      .populate("splits.user", "name emai avatarUrl");

    const debtorUserIds = targetMemberIds.filter((id) => id !== payerIdStr);

    if (debtorUserIds.length > 0) {
      const { User } = await import("../db/models/User.js");
      User.find({
        _id: { $in: debtorUserIds },
        pushToken: { $exists: true, $ne: null },
      })
        .select("_is name pushToken")
        .then(async (recipients) => {
          const validRecipients = recipients.filter(
            (r) => r.pushToken && r.pushToken.startsWith("ExponentPushToken"),
          );
          if (validRecipients.length === 0) return;

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

          await sendPushNotifications(messages);
        })
        .catch((error) =>
          console.error(
            "[PushService] Notificaiton dispatch failure: ",
            error.message,
          ),
        );
    }

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
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
    const expenses = await Expense.find({ groupId: req.group._id })
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
    const group = await Group.findById(req.group._id).populate(
      "members",
      "name email avatarUrl iban bankAccountHolder",
    );

    const expenses = await Expense.find({ groupId: req.group._id })
      .populate("paidBy", "name email  avatarUrl iban bankAccountHolder")
      .populate("splits.user", "name email avatarUrl iban bankAccountHolder");

    const totalGroupExpense = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );

    const balances = {};
    group.members.forEach((member) => {
      balances[member._id.toString()] = { user: member, netBalance: 0 };
    });

    expenses.forEach((expense) => {
      if (!expense.paidBy) return;
      const payerId = expense.paidBy._id.toString();
      if (!balances[payerId])
        balances[payerId] = { user: expense.paidBy, netBalance: 0 };

      expense.splits.forEach((split) => {
        if (!split.user) return;
        const splitUserId = split.user._id.toString();
        if (!balances[splitUserId])
          balances[splitUserId] = { user: split.user, netBalance: 0 };

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
      if (balance < -0.01)
        debtors.push({ user: item.user, netBalance: balance });
      else if (balance > 0.01)
        creditors.push({ user: item.user, netBalance: balance });
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
    const { receiverId } = req.body;
    const group = req.group;
    const payer = req.user;

    if (!receiverId)
      return res.status(400).json({ message: "receiverId is required" });

    const isReceiverMember = group.members.some(
      (m) => m.toString() === receiverId,
    );
    if (!isReceiverMember) {
      return res
        .status(400)
        .json({ message: "Receiver is not a member of this group." });
    }

    const result = await Expense.updateMany(
      {
        groupId: group._id,
        paidBy: receiverId,
        "splits.user": payer._id,
        "splits.isSettled": false,
      },
      { $set: { "splits.$[elem].isSettled": true } },
      { arrayFilters: [{ "elem.user": payer._id }] },
    );

    const { User } = await import("../db/models/User.js");
    const receiver = await User.findById(receiverId);

    if (receiver?.pushToken) {
      sendPushNotifications([
        {
          to: receiver.pushToken,
          sound: "default",
          title: "Payment Settled",
          body: `${payer.name || "A member"} settled their debt in "${group.name}".`,
          data: {
            type: "SETTLEMENT_CONFIRMED",
            groupId: group._id.toString(),
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
    const result = await findExpenseAndCheckMembership(expenseId, req.user._id);
    if (result.error) {
      return res.status(result.error).json({ message: result.message });
    }

    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "name email avatarUrl")
      .populate("splits.user", "name email avatarUrl");

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching expense detail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { title, amount, category, splitUserIds, receiptUrl } = req.body;
    const user = req.user;

    if (!title || !amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    const result = await findExpenseAndCheckMembership(expenseId, user._id);
    if (result.error) {
      return res.status(result.error).json({ message: result.message });
    }
    const { expense, group } = result;

    if (expense.paidBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized." });
    }

    const hasSettledPayments = expense.splits.some(
      (split) =>
        split.isSettled && split.user.toString() !== user._id.toString(),
    );
    if (hasSettledPayments) {
      return res.status(400).json({
        message:
          "Cannot edit an expense with settled settlements. Settle payments exist.",
      });
    }

    const allGroupMemberIds = group.members.map((m) => m.toString());
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

    expense.title = title.trim();
    expense.amount = numericAmount;
    expense.category = category || expense.category;
    expense.splits = targetMemberIds.map((memberIdStr) => ({
      user: memberIdStr,
      amount: splitAmount,
      isSettled: memberIdStr === payerIdStr,
    }));
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl;

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email avatarUrl")
      .populate("splits.user", "name email avatarUrl");

    return res.status(200).json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const user = req.user;

    const result = await findExpenseAndCheckMembership(expenseId, user._id);
    if (result.error) {
      return res.status(result.error).json({ message: result.message });
    }
    const { expense } = result;

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

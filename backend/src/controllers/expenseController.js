import { Expense } from "../db/models/Expense.js";
import { Group } from "../db/models/Group.js";
import { Settlement } from "../db/models/Settlement.js";
import { User } from "../db/models/User.js";
import { sendPushNotifications } from "../utils/pushNotifications.js";
import { toCents, toDollars, splitEvenly } from "../utils/money.js";
import { computeGroupBalances, simplifyDebts } from "../utils/balances.js";

const serializeExpense = (expenseDoc, extra = {}) => {
  const obj = expenseDoc.toObject ? expenseDoc.toObject() : expenseDoc;
  return {
    ...obj,
    amount: toDollars(obj.amountCents),
    splits: obj.splits.map((s) => ({
      ...s,
      amount: toDollars(s.amountCents),
    })),
    ...extra,
  };
};

const findExpenseAndCheckMembership = async (expenseId, userId) => {
  const expense = await Expense.findById(expenseId);
  if (!expense) return { error: 404, message: "Expense not found" };

  const group = await Group.findOne({ _id: expense.groupId, members: userId });
  if (!group) return { error: 403, message: "Not a member of this group" };

  return { expense, group };
};

const isExpenseLocked = async (expense) => {
  const laterSettlement = await Settlement.exists({
    groupId: expense.groupId,
    createdAt: { $gt: expense.createdAt },
  });
  return Boolean(laterSettlement);
};

export const createExpense = async (req, res) => {
  try {
    const { title, amount, category, splitUserIds, receiptUrl } = req.body;
    const group = req.group;
    const user = req.user;

    if (!title || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: title and amount are mandatory.",
      });
    }

    const amountCents = toCents(amount);
    if (!amountCents || amountCents <= 0) {
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

    const centsPerPerson = splitEvenly(amountCents, targetMemberIds.length);
    const splits = targetMemberIds.map((memberIdStr, index) => ({
      user: memberIdStr,
      amountCents: centsPerPerson[index],
    }));

    const newExpense = await Expense.create({
      groupId: group._id,
      title: title.trim(),
      amountCents,
      category: category || "general",
      paidBy: user._id,
      splits,
      receiptUrl: receiptUrl || null,
    });

    const populatedExpense = await Expense.findById(newExpense._id)
      .populate("paidBy", "name email avatarUrl")
      .populate("splits.user", "name email avatarUrl");

    const payerIdStr = user._id.toString();
    const debtorUserIds = targetMemberIds.filter((id) => id !== payerIdStr);

    if (debtorUserIds.length > 0) {
      User.find({
        _id: { $in: debtorUserIds },
        pushToken: { $exists: true, $ne: null },
      })
        .select("_id name pushToken")
        .then(async (recipients) => {
          const validRecipients = recipients.filter(
            (r) => r.pushToken && r.pushToken.startsWith("ExponentPushToken"),
          );
          if (validRecipients.length === 0) return;

          const messages = validRecipients.map((recipient) => ({
            to: recipient.pushToken,
            sound: "default",
            title: `${group.name}: New Expense Added`,
            body: `${user.name || "A member"} paid for "${title.trim()}".`,
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
            "[PushService] Notification dispatch failure:",
            error.message,
          ),
        );
    }

    return res.status(201).json({
      success: true,
      message: "Expense recorded successfully.",
      data: serializeExpense(populatedExpense),
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
      .populate("paidBy", "name email avatarUrl")
      .populate("splits.user", "name email avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json(expenses.map((e) => serializeExpense(e)));
  } catch (error) {
    console.error("Error fetching group expenses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupBalanceSummary = async (req, res) => {
  try {
    const group = req.group;

    const [members, expenses, settlements] = await Promise.all([
      User.find({ _id: { $in: group.members } }).select(
        "name email avatarUrl iban bankAccountHolder",
      ),
      Expense.find({ groupId: group._id })
        .populate("paidBy", "name email avatarUrl")
        .populate("splits.user", "name email avatarUrl"),
      Settlement.find({ groupId: group._id }),
    ]);

    const expensesInCents = expenses.map((e) => ({
      paidBy: e.paidBy,
      splits: e.splits,
    }));

    const balances = computeGroupBalances(
      members,
      expensesInCents,
      settlements,
    );
    const debts = simplifyDebts(balances);

    const totalExpenseCents = expenses.reduce(
      (sum, e) => sum + e.amountCents,
      0,
    );

    return res.status(200).json({
      totalExpense: toDollars(totalExpenseCents),
      balances: Object.values(balances).map((b) => ({
        user: b.user,
        netBalance: toDollars(b.netCents),
      })),
      debts: debts.map((d) => ({
        from: d.from,
        to: d.to,
        amount: toDollars(d.amountCents),
      })),
    });
  } catch (error) {
    console.error("Error calculating summary:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const settleUp = async (req, res) => {
  try {
    const { receiverId, amount } = req.body;
    const group = req.group;
    const payer = req.user;

    if (!receiverId || amount === undefined || amount === null) {
      return res
        .status(400)
        .json({ message: "receiverId and amount are required" });
    }

    if (receiverId === payer._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot settle up with yourself" });
    }

    const isReceiverMember = group.members.some(
      (m) => m.toString() === receiverId,
    );
    if (!isReceiverMember) {
      return res
        .status(400)
        .json({ message: "Receiver is not a member of this group" });
    }

    const amountCents = toCents(amount);
    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({ message: "Invalid settlement amount" });
    }

    const [members, expenses, settlements] = await Promise.all([
      User.find({ _id: { $in: group.members } }),
      Expense.find({ groupId: group._id }),
      Settlement.find({ groupId: group._id }),
    ]);

    const balances = computeGroupBalances(members, expenses, settlements);
    const payerBalance = balances[payer._id.toString()];
    const receiverBalance = balances[receiverId];

    if (!payerBalance || payerBalance.netCents >= -1) {
      return res
        .status(400)
        .json({ message: "You have no outstanding debt in this group" });
    }
    if (!receiverBalance || receiverBalance.netCents <= 1) {
      return res
        .status(400)
        .json({ message: "Receiver is not owed money in this group" });
    }

    const maxPossibleCents = Math.min(
      -payerBalance.netCents,
      receiverBalance.netCents,
    );
    if (amountCents > maxPossibleCents) {
      return res.status(400).json({
        message: `Amount exceeds what you can settle with this member ($${toDollars(maxPossibleCents)} max).`,
      });
    }

    await Settlement.create({
      groupId: group._id,
      from: payer._id,
      to: receiverId,
      amountCents,
    });

    const receiver = await User.findById(receiverId);
    if (receiver?.pushToken) {
      sendPushNotifications([
        {
          to: receiver.pushToken,
          sound: "default",
          title: "Payment Settled",
          body: `${payer.name || "A member"} paid you $${toDollars(amountCents)} in "${group.name}".`,
          data: { type: "SETTLEMENT_CONFIRMED", groupId: group._id.toString() },
        },
      ]).catch((err) =>
        console.error(
          "[PushService] Settlement notification delivery failure:",
          err.message,
        ),
      );
    }

    return res.status(200).json({ message: "Payment recorded successfully" });
  } catch (error) {
    console.error("Error settling up", error);
    return res.status(500).json({ message: "Internal server error" });
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

    const locked = await isExpenseLocked(expense);

    res.status(200).json(serializeExpense(expense, { locked }));
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

    if (!title || amount === undefined || amount === null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const amountCents = toCents(amount);
    if (!amountCents || amountCents <= 0) {
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

    if (await isExpenseLocked(expense)) {
      return res.status(400).json({
        message:
          "Cannot edit this expense because settlements have already been recorded after it.",
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

    const centsPerPerson = splitEvenly(amountCents, targetMemberIds.length);

    expense.title = title.trim();
    expense.amountCents = amountCents;
    expense.category = category || expense.category;
    expense.splits = targetMemberIds.map((memberIdStr, index) => ({
      user: memberIdStr,
      amountCents: centsPerPerson[index],
    }));
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl;

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email avatarUrl")
      .populate("splits.user", "name email avatarUrl");

    return res.status(200).json(serializeExpense(updatedExpense));
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

    if (await isExpenseLocked(expense)) {
      return res.status(400).json({
        message:
          "Cannot delete this expense because settlements have already been recorded after it.",
      });
    }

    await Expense.findByIdAndDelete(expenseId);
    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

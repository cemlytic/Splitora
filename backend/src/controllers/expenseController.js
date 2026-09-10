import { Expense } from "../db/models/Expense.js";
import { Group } from "../db/models/Group.js";
import { User } from "../db/models/User.js";

export const createExpense = async (req, res) => {
  try {
    const { groupId, clerkId, title, amount, category } = req.body;

    if (!groupId || !clerkId || !title || !amount) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "Paying user not found" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    console.log("İşlem Yapan User ID:", user._id.toString());
    console.log(
      "Gruptaki Üyeler:",
      group.members.map((m) => (m._id ? m._id.toString() : m.toString())),
    );

    const isMember = group.members.some((member) => {
      const memberIdStr = member._id
        ? member._id.toString()
        : member.toString();
      return memberIdStr === user._id.toString();
    });

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    const memberCount = group.members.length;
    const splitAmount = Number((numericAmount / memberCount).toFixed(2));

    const splits = group.members.map((member) => {
      const memberId = member._id || member;
      return {
        user: memberId,
        amount: splitAmount,
        isSettled: memberId.toString() === user._id.toString(),
      };
    });

    const newExpense = await Expense.create({
      groupId: group._id,
      title: title.trim(),
      amount: numericAmount,
      category: category || "other",
      paidBy: user._id,
      splits,
    });

    const populatedExpense = await Expense.findById(newExpense._id)
      .populate("paidBy", "name email clerkId avatarUrl")
      .populate("splits.user", "name email clerkId avatarUrl");

    res.status(201).json(populatedExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Internal server error" });
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
      "name email avatarUrl clerkId",
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const expenses = await Expense.find({ groupId });

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
      const payerId = expense.paidBy.toString();

      expense.splits.forEach((split) => {
        const splitUserId = split.user.toString();

        if (!split.isSettled) {
          if (balances[splitUserId]) {
            balances[splitUserId].netBalance -= split.amount;
          }
          if (balances[payerId]) {
            balances[payerId].netBalance += split.amount;
          }
        }
      });
    });

    const debtors = [];
    const creditors = [];

    Object.values(balances).forEach((item) => {
      const balance = Number(item.netBalance.toFixed(2));
      if (balance < 0) {
        debtors.push({ ...item, netBalance: balance });
      } else if (balance > 0) {
        creditors.push({ ...item, netBalance: balance }); // item yerine balance
      }
    });

    const debts = [];
    let debtIndex = 0; // const yerine let
    let creditIndex = 0; // const yerine let

    while (debtIndex < debtors.length && creditIndex < creditors.length) {
      const debtor = debtors[debtIndex];
      const creditor = creditors[creditIndex];

      // ModifiedPathsSnapshot yerine Math.abs
      const debtAmount = Math.min(
        Math.abs(debtor.netBalance),
        creditor.netBalance,
      );
      const roundedAmount = Number(debtAmount.toFixed(2));

      debts.push({
        from: debtor.user,
        to: creditor.user,
        amount: roundedAmount,
      });

      debtor.netBalance += debtAmount;
      creditor.netBalance -= debtAmount;

      if (Math.abs(debtor.netBalance) < 0.01) debtIndex++;
      if (creditor.netBalance < 0.01) creditIndex++;
    }

    res.status(200).json({
      totalExpense: Number(totalGroupExpense.toFixed(2)),
      balances: Object.values(balances),
      debts,
    });
  } catch (error) {
    console.error("Error calculating summary:", error); // Gerçek hatayı görmek için error eklendi
    res.status(500).json({ message: "Internal server error" });
  }
};

export const settleUp = async (req, res) => {
  try {
    const { groupId, payerClerkId, receiverClerkId } = req.body;

    if (!groupId || !payerClerkId || !receiverClerkId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const payer = await User.findOne({ clerkId: payerClerkId });
    const receiver = await User.findOne({ clerkId: receiverClerkId });

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

    res.status(200).json({
      message: "Debts settled successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error settling up", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

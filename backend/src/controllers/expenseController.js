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

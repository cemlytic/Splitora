import { Group } from "../db/models/Group.js";
import { User } from "../db/models/User.js";
import { Expense } from "../db/models/Expense.js";
import crypto from "crypto";

const generateInviteCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

export const createGroup = async (req, res) => {
  try {
    const { name, clerkId } = req.body;

    if (!name || !clerkId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    let inviteCode = generateInviteCode();
    while (await Group.findOne({ inviteCode })) {
      inviteCode = generateInviteCode();
    }

    const group = await Group.create({
      name,
      inviteCode,
      createdBy: user._id,
      members: [user._id],
    });

    res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { inviteCode, clerkId } = req.body;

    if (!inviteCode || !clerkId) {
      return res
        .status(400)
        .json({ error: "Invite code and clerkId are required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const group = await Group.findOne({
      inviteCode: String(inviteCode).toUpperCase(),
    });

    if (!group) {
      return res.status(400).json({ message: "Invalid code" });
    }

    const isAlreadyMember = group.members.some(
      (memberId) => memberId.toString() === user._id.toString(),
    );

    if (group.members.includes(user._id)) {
      return res
        .status(400)
        .json({ error: "You are already a member of this group" });
    }

    group.members.push(user._id);
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const groups = await Group.find({ members: user._id })
      .populate("members", "name email avatarUrl clerkId")
      .sort({ createdAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching user groups", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { clerkId } = req.body;

    if (!groupId || !clerkId)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isMember = group.members.some(
      (m) => m.toString() === user._id.toString(),
    );
    if (!isMember)
      return res
        .status(400)
        .json({ message: "You are not a member of this group." });

    const expenses = await Expense.find({ groupId });
    let netBalance = 0;

    expenses.forEach((expense) => {
      const isPayer = expense.paidBy.toString() === user._id.toString();

      expense.splits.forEach((split) => {
        const isSplitUser = split.user.toString() === user._id.toString();

        if (!split.isSettled) {
          if (isSplitUser && !isPayer) {
            netBalance -= split.amount;
          }
          if (isPayer && !isSplitUser) {
            netBalance += split.amount;
          }
        }
      });
    });

    if (Math.abs(netBalance) >= 0.01) {
      const formatted = Math.abs(netBalance).toFixed(2);
      const reason =
        netBalance < 0
          ? `You have outstanding debts ($${formatted}). Please settle up before leaving.`
          : `You have pending credits ($${formatted}). Please collect your balance before leaving.`;
      return res.status(400).json({ message: reason });
    }

    const isOwner = group.createdBy?.toString() === user._id.toString();
    if (isOwner && group.members.length > 0) {
      return res.status(400).json({
        message:
          "As the group creator, you cannot leave while other members are present. You can delete the space instead.",
      });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== user._id.toString(),
    );

    if (group.members.length === 0) {
      await Expense.deleteMany({ groupId: group._id });
      await Group.findByIdAndDelete(group._id);
      return res
        .status(200)
        .json({ message: "Group and history deleted as last member left." });
    }

    await group.save();
    return res.status(200).json({ message: "Successfully left the group." });
  } catch (error) {
    console.error("Error leaving group:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const clerkId = req.body?.clerkId || req.query?.clerkId;

    if (!groupId || !clerkId) {
      return res
        .status(400)
        .json({ message: "Group ID and Clerk ID are required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const creatorId = group.createdBy?.toString();
    const isOwner =
      creatorId === user._id.toString() ||
      creatorId === user.clerkId;

    if (!isOwner) {
      return res
        .status(403)
        .json({ message: "Only the group creator can delete this space" });
    }

    const expenses = await Expense.find({ groupId });
    const hasUnsettledSplits = expenses.some((exp) =>
      exp.splits.some(
        (s) => !s.isSettled && s.user.toString() !== user._id.toString(),
      ),
    );

    if (hasUnsettledSplits) {
      return res.status(400).json({
        message:
          "Cannot delete group with unsettled debts. All balances must be settled first.",
      });
    }

    await Expense.deleteMany({ groupId: group._id });
    await Group.findByIdAndDelete(group._id);

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

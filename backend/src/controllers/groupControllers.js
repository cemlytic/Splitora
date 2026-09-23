import { Group } from "../db/models/Group.js";
import { User } from "../db/models/User.js";
import { Expense } from "../db/models/Expense.js";
import { Settlement } from "../db/models/Settlement.js";
import { computeGroupBalances } from "../utils/balances.js";
import { toDollars } from "../utils/money.js";
import crypto from "crypto";

const generateInviteCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "name is required." });

    let inviteCode = generateInviteCode();
    while (await Group.findOne({ inviteCode })) {
      inviteCode = generateInviteCode();
    }

    const group = await Group.create({
      name,
      inviteCode,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(200).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: "Invite code is required." });
    }

    const group = await Group.findOne({
      inviteCode: String(inviteCode).toUpperCase(),
    });

    if (!group) return res.status(400).json({ message: "Invalid code." });

    const isAlreadyMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString(),
    );

    if (isAlreadyMember)
      return res
        .status(400)
        .json({ error: "You are already member of this group." });

    group.members.push(req.user._id);
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "name email avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching user groups", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const group = req.group;
    const userId = req.user._id;

    const [members, expenses, settlements] = await Promise.all([
      User.find({ _id: { $in: group.members } }),
      Expense.find({ groupId: group._id }),
      Settlement.find({ groupId: group._id }),
    ]);

    const balances = computeGroupBalances(members, expenses, settlements);
    const netCents = balances[userId.toString()]?.netCents || 0;

    if (Math.abs(netCents) >= 1) {
      const formatted = toDollars(Math.abs(netCents)).toFixed(2);
      const reason =
        netCents < 0
          ? `You have outstanding debts ($${formatted}). Please settle up before leaving.`
          : `You have pending credits ($${formatted}). Please collect your balance before leaving.`;
      return res.status(400).json({ message: reason });
    }

    const isOwner = group.createdBy?.toString() === userId.toString();
    if (isOwner && group.members.length > 1) {
      return res.status(400).json({
        message:
          "As the group creator, you cannot leave while other members are present. You can delete the space instead.",
      });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== userId.toString(),
    );

    if (group.members.length === 0) {
      await Expense.deleteMany({ groupId: group._id });
      await Group.findByIdAndDelete(group._id);
      return res
        .status(200)
        .json({ message: "Group and history deleted as last member left" });
    }

    await Group.save();
    return res.status(200).json({ message: "Succesfully left the group." });
  } catch (error) {
    console.error("Error leaving group:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const group = req.group;
    const userId = req.user._id;

    const isOwner = group.createdBy?.toString() === userId.toString();
    if (!isOwner)
      return res
        .status(403)
        .json({ message: "Only the group creator can delete this space." });

    const [members, expenses, settlements] = await Promise.all([
      User.find({ _id: { $in: group.members } }),
      Expense.find({ groupId: group._id }),
      Settlement.find({ groupId: group._id }),
    ]);

    const balances = computeGroupBalances(members, expenses, settlements);
    const hasOutstandingBalances = Object.values(balances).some(
      (b) => Math.abs(b.netCents) >= 1,
    );

    if (hasOutstandingBalances) {
      return res.status(400).json({
        message:
          "Cannot delete group with unsettled debts. All balances must be settled first.",
      });
    }

    await Expense.deleteMany({ groupId: group._id });
    await Settlement.deleteMany({ groupId: group._id });
    await Group.findByIdAndDelete(group._id);

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

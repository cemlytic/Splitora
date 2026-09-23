import { Group } from "../db/models/Group.js";
import { User } from "../db/models/User.js";
import { Expense } from "../db/models/Expense.js";
import { Settlement } from "../db/models/Settlement.js";
import { computeGroupBalances } from "../utils/balances.js";
import { toDollars } from "../utils/money.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { AppError } from "../utils/AppError.js";
import crypto from "crypto";

const generateInviteCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

export const createGroup = asyncHandler(async (req, res) => {
  const { name } = req.body;

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

  res.status(201).json(group);
});

export const joinGroup = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;

  const group = await Group.findOne({
    inviteCode: inviteCode.toUpperCase(),
  });

  if (!group) throw new AppError(400, "Invalid code.");

  const isAlreadyMember = group.members.some(
    (memberId) => memberId.toString() === req.user._id.toString(),
  );

  if (isAlreadyMember) {
    throw new AppError(400, "You are already a member of this group.");
  }

  group.members.push(req.user._id);
  await group.save();

  res.status(200).json(group);
});

export const getUserGroups = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const [groups, total] = await Promise.all([
    Group.find({ members: req.user._id })
      .populate("members", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Group.countDocuments({ members: req.user._id }),
  ]);

  res.status(200).json({
    data: groups,
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
});

export const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findOne({
    _id: req.params.groupId,
    members: req.user._id,
  }).populate("members", "name email avatarUrl");

  if (!group) throw new AppError(404, "Group not found");

  res.status(200).json(group);
});

export const leaveGroup = asyncHandler(async (req, res) => {
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
    throw new AppError(400, reason);
  }

  const isOwner = group.createdBy?.toString() === userId.toString();
  if (isOwner && group.members.length > 1) {
    throw new AppError(
      400,
      "As the group creator, you cannot leave while other members are present. You can delete the space instead.",
    );
  }

  group.members = group.members.filter(
    (m) => m.toString() !== userId.toString(),
  );

  if (group.members.length === 0) {
    await Expense.deleteMany({ groupId: group._id });
    await Settlement.deleteMany({ groupId: group._id });
    await Group.findByIdAndDelete(group._id);
    return res
      .status(200)
      .json({ message: "Group and history deleted as last member left" });
  }

  await group.save();
  return res.status(200).json({ message: "Successfully left the group." });
});

export const deleteGroup = asyncHandler(async (req, res) => {
  const group = req.group;
  const userId = req.user._id;

  const isOwner = group.createdBy?.toString() === userId.toString();
  if (!isOwner) {
    throw new AppError(403, "Only the group creator can delete this space.");
  }

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
    throw new AppError(
      400,
      "Cannot delete group with unsettled debts. All balances must be settled first.",
    );
  }

  await Expense.deleteMany({ groupId: group._id });
  await Settlement.deleteMany({ groupId: group._id });
  await Group.findByIdAndDelete(group._id);

  return res.status(200).json({ message: "Group deleted successfully" });
});

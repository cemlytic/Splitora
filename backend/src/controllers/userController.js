import { User } from "../db/models/User.js";
import { Group } from "../db/models/Group.js";
import { Expense } from "../db/models/Expense.js";
import { Settlement } from "../db/models/Settlement.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const syncUser = asyncHandler(async (req, res) => {
  const clerkId = req.clerkId;
  const { email, name, avatarUrl } = req.body;

  const user = await User.findOneAndUpdate(
    { clerkId },
    { email, name, avatarUrl },
    { returnDocument: "after", upsert: true },
  );

  res.status(200).json(user);
});

export const deleteUserAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Group.updateMany({ members: userId }, { $pull: { members: userId } });

  const emptyGroups = await Group.find({ members: { $size: 0 } });
  const emptyGroupIds = emptyGroups.map((g) => g._id);

  if (emptyGroups.length > 0) {
    await Expense.deleteMany({ groupId: { $in: emptyGroupIds } });
    await Settlement.deleteMany({ groupId: { $in: emptyGroupIds } });
    await Group.deleteMany({ _id: { $in: emptyGroupIds } });
  }

  await User.findByIdAndDelete(userId);

  return res
    .status(200)
    .json({ message: "User account and related references deleted." });
});

export const updatePushToken = asyncHandler(async (req, res) => {
  const { pushToken } = req.body;

  await User.findByIdAndUpdate(req.user._id, { pushToken: pushToken || null });

  return res.status(200).json({ message: "Push token updated successfully." });
});

export const updatePaymentDetails = asyncHandler(async (req, res) => {
  const { iban, bankAccountHolder } = req.body;
  const sanitizedIban = iban.replace(/\s+/g, "").toUpperCase();

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { iban: sanitizedIban, bankAccountHolder },
    { new: true },
  );

  return res.json(updatedUser);
});

export const getUserProfile = asyncHandler(async (req, res) => {
  return res.status(200).json(req.user);
});

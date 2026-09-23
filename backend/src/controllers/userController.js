import { User } from "../db/models/User.js";
import { Group } from "../db/models/Group.js";
import { Expense } from "../db/models/Expense.js";
import { Settlement } from "../db/models/Settlement.js";

export const syncUser = async (req, res) => {
  try {
    const clerkId = req.clerkId;
    const { email, name, avatarUrl } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOneAndUpdate(
      { clerkId },
      { email, name, avatarUrl },
      { returnDocument: "after", upsert: true },
    );

    res.status(200).json(user);
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error deleting account ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { pushToken: pushToken || null },
      { new: true },
    );

    return res
      .status(200)
      .json({ message: "Push token updated successfully." });
  } catch (error) {
    console.error("Error updating push token:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePaymentDetails = async (req, res) => {
  try {
    const { iban, bankAccountHolder } = req.body;

    const sanitizedIban = iban ? iban.replace(/\s+/g, "").toUpperCase() : "";

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        iban: sanitizedIban,
        bankAccountHolder: bankAccountHolder?.trim() || "",
      },
      { new: true },
    );

    return res.json(updatedUser);
  } catch (error) {
    console.error("Error updating payment details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserProfile = async (req, res) => {
  return res.status(200).json(req.user);
};

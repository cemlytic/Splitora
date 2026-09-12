import { User } from "../db/models/User.js";
import { Group } from "../db/models/Group.js";
import { Expense } from "../db/models/Expense.js";

export const syncUser = async (req, res) => {
  try {
    const { clerkId, email, name, avatarUrl } = req.body;

    if (!clerkId || !email || !name) {
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
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = user._id;

    await Group.updateMany({ members: userId }, { $pull: { members: userId } });

    const emptyGroups = await Group.find({ members: { $size: 0 } });
    const emptyGroupIds = emptyGroups.map((g) => g._id);

    if (emptyGroupIds.length > 0) {
      await Expense.deleteMany({ groupId: { $in: emptyGroupIds } });
      await Group.deleteMany({ _id: { $in: emptyGroupIds } });
    }

    await User.findByIdAndDelete(userId);

    return res
      .status(200)
      .json({ message: "User account and related references deleted" });
  } catch (error) {
    console.error("Error deleting account", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

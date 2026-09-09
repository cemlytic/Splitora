import { User } from "../db/models/User.js";

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

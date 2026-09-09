import { Group } from "../db/models/Group.js";
import { User } from "../db/models/User.js";
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

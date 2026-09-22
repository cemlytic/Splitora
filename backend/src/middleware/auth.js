import { clerkMiddleware, getAuth } from "@clerk/express";
import { User } from "../db/models/User.js";
import { Group } from "../db/models/Group.js";

export const clerk = clerkMiddleware();

export const requireUser = async (req, res, next) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(401).json({ message: "user not synced." });
  }

  req.user = user;
  next();
};

export const requireAuth = async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ message: "Unauhtorized." });
  req.clerkId = userId;
  next();
};

export const requireGroupMember = async (req, res, next) => {
  const { groupId } = req.params;

  const group = await Group.findOne({ _id: groupId, members: req.user._id });

  if (!group)
    return res.status(403).json({ message: "Not a member of this group." });

  req.group = group;
  next();
};

import { Router } from "express";
import {
  createGroup,
  joinGroup,
  getUserGroups,
  leaveGroup,
  deleteGroup,
} from "../controllers/groupControllers.js";
import { requireUser, requireGroupMember } from "../middleware/auth.js";

const router = Router();

router.post("/", requireUser, createGroup);
router.post("/join", requireUser, joinGroup);
router.post("/:groupId/leave", requireUser, requireGroupMember, leaveGroup);
router.get("/user/me", requireUser, getUserGroups);
router.delete("/:groupId", requireUser, requireGroupMember, deleteGroup);

export default router;

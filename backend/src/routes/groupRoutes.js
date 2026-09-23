import { Router } from "express";
import {
  createGroup,
  joinGroup,
  getUserGroups,
  getGroupById,
  leaveGroup,
  deleteGroup,
} from "../controllers/groupControllers.js";
import { requireUser, requireGroupMember } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createGroupSchema, joinGroupSchema } from "../validation/schemas.js";

const router = Router();

router.post("/", requireUser, validate(createGroupSchema), createGroup);
router.post("/join", requireUser, validate(joinGroupSchema), joinGroup);
router.get("/user/me", requireUser, getUserGroups);
router.get("/:groupId", requireUser, requireGroupMember, getGroupById);
router.post("/:groupId/leave", requireUser, requireGroupMember, leaveGroup);
router.delete("/:groupId", requireUser, requireGroupMember, deleteGroup);

export default router;

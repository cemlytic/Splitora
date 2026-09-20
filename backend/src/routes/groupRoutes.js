import { Router } from "express";
import {
  createGroup,
  joinGroup,
  getUserGroups,
  leaveGroup,
  deleteGroup,
} from "../controllers/groupControllers.js";

const router = Router();

router.post("/", createGroup);
router.post("/join", joinGroup);
router.post("/:groupId/leave", leaveGroup);
router.get("/user/:clerkId", getUserGroups);
router.delete("/:groupId", deleteGroup);

export default router;

import { Router } from "express";
import {
  createExpense,
  getGroupExpenses,
  getGroupBalanceSummary,
  settleUp,
  getExpenseById,
  deleteExpense,
  updateExpense,
} from "../controllers/expenseController.js";
import { requireUser, requireGroupMember } from "../middleware/auth.js";

const router = Router();

router.post("/group/:groupId", requireUser, requireGroupMember, createExpense);
router.post(
  "/group/:groupId/settle-up",
  requireUser,
  requireGroupMember,
  settleUp,
);
router.get(
  "/group/:groupId",
  requireUser,
  requireGroupMember,
  getGroupExpenses,
);
router.get(
  "/group/:groupId/summary",
  requireUser,
  requireGroupMember,
  getGroupBalanceSummary,
);
router.get("/:expenseId", requireUser, getExpenseById);
router.put("/:expenseId", requireUser, updateExpense);
router.delete("/:expenseId", requireUser, deleteExpense);

export default router;

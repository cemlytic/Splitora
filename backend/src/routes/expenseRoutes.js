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
import { validate } from "../middleware/validate.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
  settleUpSchema,
} from "../validation/schemas.js";

const router = Router();

router.post(
  "/group/:groupId",
  requireUser,
  requireGroupMember,
  validate(createExpenseSchema),
  createExpense,
);
router.post(
  "/group/:groupId/settle-up",
  requireUser,
  requireGroupMember,
  validate(settleUpSchema),
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
router.put(
  "/:expenseId",
  requireUser,
  validate(updateExpenseSchema),
  updateExpense,
);
router.delete("/:expenseId", requireUser, deleteExpense);

export default router;

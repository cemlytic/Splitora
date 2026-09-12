import { Router } from "express";
import {
  createExpense,
  getGroupExpenses,
  getGroupBalanceSummary,
  settleUp,
  getExpenseById,
  deleteExpense
} from "../controllers/expenseController.js";

const router = Router();

router.post("/", createExpense);
router.post("/settle-up", settleUp);
router.get("/group/:groupId", getGroupExpenses);
router.get("/group/:groupId/summary", getGroupBalanceSummary);
router.get("/:expenseId", getExpenseById);
router.delete("/:expenseId", deleteExpense);

export default router;

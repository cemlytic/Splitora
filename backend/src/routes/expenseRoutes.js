import { Router } from "express";
import {
  createExpense,
  getGroupExpenses,
} from "../controllers/expenseController.js";

const router = Router();

router.post("/", createExpense);
router.get("/group/:groupId", getGroupExpenses);

export default router;

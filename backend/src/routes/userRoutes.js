import { Router } from "express";
import {
  deleteUserAccount,
  getUserProfile,
  syncUser,
  updatePaymentDetails,
} from "../controllers/userController.js";

const router = Router();

router.post("/sync", syncUser);
router.get("/:clerkId", getUserProfile);
router.delete("/:clerkId", deleteUserAccount);
router.put("/:clerkId/payment-details", updatePaymentDetails);

export default router;

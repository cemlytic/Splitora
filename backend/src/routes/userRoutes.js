import { Router } from "express";
import {
  deleteUserAccount,
  getUserProfile,
  syncUser,
  updatePaymentDetails,
  updatePushToken,
} from "../controllers/userController.js";
import { requireAuth, requireUser } from "../middleware/auth.js";

const router = Router();

router.post("/sync", requireAuth, syncUser);
router.get("/me", requireUser, getUserProfile);
router.delete("/me", requireUser, deleteUserAccount);
router.put("/me/payment-details", requireUser, updatePaymentDetails);
router.post("/push-token", requireUser, updatePushToken);

export default router;

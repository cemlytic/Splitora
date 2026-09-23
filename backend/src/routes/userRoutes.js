import { Router } from "express";
import {
  deleteUserAccount,
  getUserProfile,
  syncUser,
  updatePaymentDetails,
  updatePushToken,
} from "../controllers/userController.js";
import { requireAuth, requireUser } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  syncUserSchema,
  updatePaymentDetailsSchema,
  updatePushTokenSchema,
} from "../validation/schemas.js";

const router = Router();

router.post("/sync", requireAuth, validate(syncUserSchema), syncUser);
router.get("/me", requireUser, getUserProfile);
router.delete("/me", requireUser, deleteUserAccount);
router.put(
  "/me/payment-details",
  requireUser,
  validate(updatePaymentDetailsSchema),
  updatePaymentDetails,
);
router.post(
  "/push-token",
  requireUser,
  validate(updatePushTokenSchema),
  updatePushToken,
);

export default router;

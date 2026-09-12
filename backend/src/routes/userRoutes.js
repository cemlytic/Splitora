import { Router } from "express";
import { deleteUserAccount, syncUser } from "../controllers/userController.js";

const router = Router();

router.post("/sync", syncUser);
router.delete("/:clerkId", deleteUserAccount);

export default router;

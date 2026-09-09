import { Router } from "express";
import {
  createGroup,
  joinGroup,
  getUserGroups
} from "../controllers/groupControllers.js";

const router = Router();

router.post("/", createGroup);
router.post("/join",joinGroup);
router.get("/user/:clerkId", getUserGroups)


export default router

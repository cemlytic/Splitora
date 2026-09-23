import "dotenv/config";
import express from "express";
import { clerk } from "../src/middleware/auth.js";
import userRoutes from "../src/routes/userRoutes.js";
import groupRoutes from "../src/routes/groupRoutes.js";
import expenseRoutes from "../src/routes/expenseRoutes.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

export const createTestApp = () => {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(clerk);

  app.use("/api/users", userRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use(errorHandler);

  return app;
};

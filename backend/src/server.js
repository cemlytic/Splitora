import express from "express";
import { env } from "./config/env.js";
import { connectDB } from "./db/db.js";
import { clerk } from "./middleware/auth.js";
import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(clerk);

app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);

app.use(errorHandler)
const PORT = env.PORT;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on ${PORT}`);
  });
});

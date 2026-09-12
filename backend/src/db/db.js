import mongoose from "mongoose";
import { env } from "../config/env.js";

export const connectDB = async () => {
  const uri = env.MONGODB_URI;
  if (!uri) return;
  mongoose.set("strictQuery", true);
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });
  mongoose.connection.on("error", (error) => {
    console.log("MongoDB error", error?.message || error);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("Mongodb disconnected");
  });
  await mongoose.connect(env.MONGODB_URI);
};

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    iban: {
      type: String,
      trim: true,
      default: "",
    },
    bankAccountHolder: {
      type: String,
      trim: true,
      default: "",
    },
    pushToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);

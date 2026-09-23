import mongoose from "mongoose";

const splitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amountCents: { type: Number, required: true },
  },
  { _id: false },
);

const expenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    amountCents: { type: Number, required: true },
    category: { type: String, default: "general" },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    splits: [splitSchema],
    receiptUrl: { type: String, default: null },
  },
  { timestamps: true },
);

export const Expense = mongoose.model("Expense", expenseSchema);

import { z } from "zod";

export const syncUserSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(100),
  avatarUrl: z.string().trim().optional().default(""),
});

export const updatePaymentDetailsSchema = z.object({
  iban: z.string().trim().min(1).max(42),
  bankAccountHolder: z.string().trim().min(1).max(100),
});

export const updatePushTokenSchema = z.object({
  pushToken: z.string().trim().min(1).nullable(),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().trim().min(4).max(10),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const amountSchema = z
  .union([z.number(), z.string()])
  .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: "amount must be a positive number",
  });

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  amount: amountSchema,
  category: z.string().trim().max(50).optional(),
  splitUserIds: z.array(z.string()).optional(),
  receiptUrl: z.string().nullable().optional(),
});

export const updateExpenseSchema = createExpenseSchema;

export const settleUpSchema = z.object({
  receiverId: z.string().min(1),
  amount: amountSchema,
});

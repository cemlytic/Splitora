export interface GroupMember {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Group {
  _id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupPayload {
  name: string;
  clerkId: string;
}

export interface JoinGroupPayload {
  inviteCode: string;
  clerkId: string;
}

export interface ExpenseSplit {
  user: GroupMember;
  amount: number;
  isSettled: boolean;
}

export interface Expense {
  _id: string;
  groupId: string;
  title: string;
  amount: number;
  category: string;
  paidBy: GroupMember;
  splits: ExpenseSplit[];
  createdAt: string;
}

export interface BalanceItem {
  user: GroupMember;
  netBalance: number;
}

export interface DebtItem {
  from: GroupMember;
  to: GroupMember;
  amount: number;
}

export interface GroupSummary {
  totalExpense: number;
  balances: BalanceItem[];
  debts: DebtItem[];
}

export interface CreateExpensePayload {
  groupId: string;
  clerkId: string;
  title: string;
  amount: number | string;
  category?: string;
  splitUserIds: string[];
}

export interface SettleUpPayload {
  groupId: string;
  payerClerkId: string;
  receiverClerkId: string;
}

export interface UpdateExpensePayload {
  expenseId: string;
  clerkId: string;
  title: string;
  amount: number;
  category?: string;
  splitUserIds: string[];
}

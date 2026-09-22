export interface GroupMember {
  _id: string;
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
}

export interface JoinGroupPayload {
  inviteCode: string;
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
  receiptUrl?: string | null;
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
  title: string;
  amount: number | string;
  category?: string;
  splitUserIds: string[];
  receiptUrl?: string | null;
}

export interface SettleUpPayload {
  receiverId: string;
}

export interface UpdateExpensePayload {
  expenseId: string;
  title: string;
  amount: number;
  category?: string;
  splitUserIds: string[];
  receiptUrl?: string | null;
}

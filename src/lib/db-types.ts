export type UUID = string;

export type Category = {
  id: UUID;
  user_id: UUID;
  name: string;
  is_default: boolean;
  created_at: string;
};

export type PaymentMethod = {
  id: UUID;
  user_id: UUID;
  name: string;
  is_default: boolean;
  created_at: string;
};

export type Person = {
  id: UUID;
  user_id: UUID;
  name: string;
  is_default: boolean;
  created_at: string;
};

export type MonthlyIncome = {
  id: UUID;
  user_id: UUID;
  month_key: string;
  income_cents: number;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: UUID;
  user_id: UUID;
  date: string;
  amount_cents: number;
  spent_where: string;
  category_id: UUID;
  payment_method_id: UUID;
  split_count: number;
  note: string | null;
  created_at: string;
};

export type ExpenseSplitPerson = {
  expense_id: UUID;
  person_id: UUID;
};

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type RecurringExpense = {
  id: UUID;
  user_id: UUID;
  start_date: string;
  end_date: string | null;
  recurrence: RecurrenceType;
  amount_cents: number;
  spent_where: string;
  category_id: UUID;
  payment_method_id: UUID;
  split_count: number;
  note: string | null;
  created_at: string;
};

export type RecurringSplitPerson = {
  recurring_expense_id: UUID;
  person_id: UUID;
};

export type Profile = {
  id: UUID;
  full_name: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type ExpenseWithRelations = {
  id: string;
  date: Date;
  amountCents: number;
  spentWhere: string;
  splitCount: number;
  note: string | null;
  createdAt: string;
  category: Category;
  paymentMethod: PaymentMethod;
  splitPeople: { person: Person }[];
  isRecurring: boolean;
  recurrenceLabel?: string;
};

import type {
  Category,
  Expense,
  ExpenseSplitPerson,
  ExpenseWithRelations,
  MonthlyIncome,
  PaymentMethod,
  Person,
  RecurringExpense,
  RecurringSplitPerson
} from '@/lib/db-types';
import { createClient } from '@/lib/supabase/server';
import {
  expandRecurringDates,
  getMonthBounds,
  recurrenceLabel,
  toMonthKey
} from '@/lib/utils';
import { roundCurrencyCents } from '@/lib/format';

export type GroupByOption = 'date' | 'category' | 'spentWhere';

const defaultCategories = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Subscriptions'];
const defaultPaymentMethods = ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking'];
const defaultPeople = ['Self', 'Partner', 'Friends'];

async function ensureDefaultConfig(userId: string) {
  const supabase = await createClient();
  const [{ count: categoryCount }, { count: paymentCount }, { count: personCount }] = await Promise.all([
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('payment_methods').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('people').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  ]);

  if ((categoryCount ?? 0) === 0) {
    await supabase.from('categories').insert(defaultCategories.map((name) => ({ user_id: userId, name, is_default: true })));
  }

  if ((paymentCount ?? 0) === 0) {
    await supabase
      .from('payment_methods')
      .insert(defaultPaymentMethods.map((name) => ({ user_id: userId, name, is_default: true })));
  }

  if ((personCount ?? 0) === 0) {
    await supabase.from('people').insert(defaultPeople.map((name) => ({ user_id: userId, name, is_default: true })));
  }
}

export async function getConfigOptions(userId: string) {
  await ensureDefaultConfig(userId);

  const supabase = await createClient();
  const [{ data: categories }, { data: paymentMethods }, { data: people }] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', userId).order('name', { ascending: true }),
    supabase.from('payment_methods').select('*').eq('user_id', userId).order('name', { ascending: true }),
    supabase.from('people').select('*').eq('user_id', userId).order('name', { ascending: true })
  ]);

  return {
    categories: (categories ?? []) as Category[],
    paymentMethods: (paymentMethods ?? []) as PaymentMethod[],
    people: (people ?? []) as Person[]
  };
}

export async function getMonthlyIncome(userId: string, monthKey?: string) {
  const resolvedMonthKey = monthKey ?? toMonthKey();
  const supabase = await createClient();
  const { data } = await supabase
    .from('monthly_incomes')
    .select('*')
    .eq('user_id', userId)
    .eq('month_key', resolvedMonthKey)
    .maybeSingle();

  return (data ?? null) as MonthlyIncome | null;
}

async function getOneTimeExpenses(userId: string, monthKey?: string) {
  const supabase = await createClient();
  const { start, end } = getMonthBounds(monthKey);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);

  const { data } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startIso)
    .lt('date', endIso)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  return (data ?? []) as Expense[];
}

async function getRecurringExpenses(userId: string, monthKey?: string) {
  const supabase = await createClient();
  const { start, end } = getMonthBounds(monthKey);
  const monthStart = start.toISOString().slice(0, 10);
  const monthEndInclusive = new Date(end.getTime() - 1).toISOString().slice(0, 10);

  const { data } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', userId)
    .lte('start_date', monthEndInclusive)
    .or(`end_date.is.null,end_date.gte.${monthStart}`)
    .order('created_at', { ascending: false });

  return (data ?? []) as RecurringExpense[];
}

export async function getRecurringTemplates(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data ?? []) as RecurringExpense[];
}

export async function getExpenses(userId: string, monthKey?: string) {
  const { start, end } = getMonthBounds(monthKey);
  const [config, incomeRecord, oneTimeExpenses, recurringExpenses] = await Promise.all([
    getConfigOptions(userId),
    getMonthlyIncome(userId, monthKey),
    getOneTimeExpenses(userId, monthKey),
    getRecurringExpenses(userId, monthKey)
  ]);

  const supabase = await createClient();
  const expenseIds = oneTimeExpenses.map((item) => item.id);
  const recurringIds = recurringExpenses.map((item) => item.id);

  const [{ data: expenseSplitRows }, { data: recurringSplitRows }] = await Promise.all([
    expenseIds.length
      ? supabase.from('expense_split_people').select('*').in('expense_id', expenseIds)
      : Promise.resolve({ data: [] as ExpenseSplitPerson[] }),
    recurringIds.length
      ? supabase.from('recurring_split_people').select('*').in('recurring_expense_id', recurringIds)
      : Promise.resolve({ data: [] as RecurringSplitPerson[] })
  ]);

  const categoryMap = new Map(config.categories.map((item) => [item.id, item]));
  const paymentMap = new Map(config.paymentMethods.map((item) => [item.id, item]));
  const personMap = new Map(config.people.map((item) => [item.id, item]));

  const splitMap = new Map<string, { person: Person }[]>();
  for (const row of (expenseSplitRows ?? []) as ExpenseSplitPerson[]) {
    const person = personMap.get(row.person_id);
    if (!person) continue;
    const current = splitMap.get(row.expense_id) ?? [];
    current.push({ person });
    splitMap.set(row.expense_id, current);
  }

  const recurringSplitMap = new Map<string, { person: Person }[]>();
  for (const row of (recurringSplitRows ?? []) as RecurringSplitPerson[]) {
    const person = personMap.get(row.person_id);
    if (!person) continue;
    const current = recurringSplitMap.get(row.recurring_expense_id) ?? [];
    current.push({ person });
    recurringSplitMap.set(row.recurring_expense_id, current);
  }

  const oneTime = oneTimeExpenses
    .map<ExpenseWithRelations | null>((expense) => {
      const category = categoryMap.get(expense.category_id);
      const paymentMethod = paymentMap.get(expense.payment_method_id);
      if (!category || !paymentMethod) return null;

      return {
        id: expense.id,
        date: new Date(`${expense.date}T00:00:00.000Z`),
        amountCents: expense.amount_cents,
        spentWhere: expense.spent_where,
        splitCount: expense.split_count,
        note: expense.note,
        createdAt: expense.created_at,
        category,
        paymentMethod,
        splitPeople: splitMap.get(expense.id) ?? [],
        isRecurring: false
      };
    })
    .filter(Boolean) as ExpenseWithRelations[];

  const recurringExpanded = recurringExpenses.flatMap<ExpenseWithRelations>((template) => {
    const category = categoryMap.get(template.category_id);
    const paymentMethod = paymentMap.get(template.payment_method_id);
    if (!category || !paymentMethod) return [];

    const dates = expandRecurringDates(template.start_date, template.recurrence, start, end, template.end_date);
    const splits = recurringSplitMap.get(template.id) ?? [];

    return dates.map((occurrenceDate) => ({
      id: `recurring:${template.id}:${occurrenceDate.toISOString().slice(0, 10)}`,
      date: occurrenceDate,
      amountCents: template.amount_cents,
      spentWhere: template.spent_where,
      splitCount: template.split_count,
      note: template.note,
      createdAt: template.created_at,
      category,
      paymentMethod,
      splitPeople: splits,
      isRecurring: true,
      recurrenceLabel: recurrenceLabel(template.recurrence)
    }));
  });

  const expenses = [...oneTime, ...recurringExpanded].sort((a, b) => {
    const byDate = b.date.getTime() - a.date.getTime();
    if (byDate !== 0) return byDate;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return { expenses, incomeRecord, config };
}

function ownShareForExpense(expense: ExpenseWithRelations) {
  return roundCurrencyCents(expense.amountCents / Math.max(expense.splitCount, 1));
}

export async function getDashboardData(userId: string, monthKey?: string) {
  const { expenses, incomeRecord } = await getExpenses(userId, monthKey);

  const totalSpentCents = expenses.reduce((sum, item) => sum + item.amountCents, 0);
  const ownShareSpentCents = expenses.reduce((sum, item) => sum + ownShareForExpense(item), 0);
  const splitExpenseCount = expenses.filter((item) => item.splitCount > 1).length;
  const recurringExpenseCount = expenses.filter((item) => item.isRecurring).length;
  const monthlyIncomeCents = incomeRecord?.income_cents ?? 0;
  const savingsCents = monthlyIncomeCents - ownShareSpentCents;

  const dailyTotals = new Map<string, number>();
  const categoryTotals = new Map<string, number>();

  for (const expense of expenses) {
    const dateKey = expense.date.toISOString().slice(0, 10);
    dailyTotals.set(dateKey, (dailyTotals.get(dateKey) ?? 0) + expense.amountCents);
    categoryTotals.set(expense.category.name, (categoryTotals.get(expense.category.name) ?? 0) + expense.amountCents);
  }

  const groupedDaily = [...dailyTotals.entries()]
    .map(([date, amountCents]) => ({ date, amountCents }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topCategories = [...categoryTotals.entries()]
    .map(([label, amountCents]) => ({ label, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 5);

  return {
    expenses,
    incomeRecord,
    summary: {
      totalSpentCents,
      ownShareSpentCents,
      monthlyIncomeCents,
      savingsCents,
      totalExpenseCount: expenses.length,
      splitExpenseCount,
      recurringExpenseCount
    },
    groupedDaily,
    topCategories
  };
}

export function buildGroupedExpenses(expenses: ExpenseWithRelations[], groupBy: GroupByOption) {
  const groups = new Map<
    string,
    {
      label: string;
      totalCents: number;
      items: ExpenseWithRelations[];
    }
  >();

  for (const expense of expenses) {
    let key = '';
    let label = '';

    if (groupBy === 'category') {
      key = expense.category.name;
      label = expense.category.name;
    } else if (groupBy === 'spentWhere') {
      key = expense.spentWhere;
      label = expense.spentWhere;
    } else {
      key = expense.date.toISOString().slice(0, 10);
      label = key;
    }

    const existing = groups.get(key);
    if (existing) {
      existing.totalCents += expense.amountCents;
      existing.items.push(expense);
    } else {
      groups.set(key, {
        label,
        totalCents: expense.amountCents,
        items: [expense]
      });
    }
  }

  return [...groups.values()].sort((a, b) => {
    if (groupBy === 'date') {
      return b.items[0].date.getTime() - a.items[0].date.getTime();
    }

    return b.totalCents - a.totalCents;
  });
}

export type DashboardPayload = Awaited<ReturnType<typeof getDashboardData>>;
export type ConfigPayload = Awaited<ReturnType<typeof getConfigOptions>>;
export type IncomeRecord = MonthlyIncome | null;

export async function getRecurringTemplatesWithLabels(userId: string) {
  const [templates, config] = await Promise.all([getRecurringTemplates(userId), getConfigOptions(userId)]);
  const categoryMap = new Map(config.categories.map((item) => [item.id, item.name]));
  const paymentMap = new Map(config.paymentMethods.map((item) => [item.id, item.name]));

  return templates.map((template) => ({
    ...template,
    categoryName: categoryMap.get(template.category_id) ?? 'Unknown',
    paymentMethodName: paymentMap.get(template.payment_method_id) ?? 'Unknown'
  }));
}

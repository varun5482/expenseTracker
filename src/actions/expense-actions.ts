'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatPhoneToE164, normalizeDateOnly, toMonthKey } from '@/lib/utils';

const createExpenseSchema = z.object({
  date: z.string().min(1),
  amount: z.coerce.number().positive(),
  spentWhere: z.string().trim().min(2).max(100),
  categoryId: z.string().uuid(),
  paymentMethodId: z.string().uuid(),
  splitCount: z.coerce.number().int().min(1).max(50),
  note: z.string().trim().max(160).optional().or(z.literal('')),
  splitPeople: z.array(z.string().uuid()).optional()
});

const incomeSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  income: z.coerce.number().min(0)
});

const optionSchema = z.object({
  name: z.string().trim().min(2).max(40)
});

const recurringExpenseSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().optional().or(z.literal('')),
  amount: z.coerce.number().positive(),
  spentWhere: z.string().trim().min(2).max(100),
  categoryId: z.string().uuid(),
  paymentMethodId: z.string().uuid(),
  splitCount: z.coerce.number().int().min(1).max(50),
  recurrence: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  note: z.string().trim().max(160).optional().or(z.literal('')),
  splitPeople: z.array(z.string().uuid()).optional()
});

async function clearExpenseSplitLinks(supabase: Awaited<ReturnType<typeof createClient>>, expenseId: string) {
  await supabase.from('expense_split_people').delete().eq('expense_id', expenseId);
}

async function clearRecurringSplitLinks(supabase: Awaited<ReturnType<typeof createClient>>, recurringExpenseId: string) {
  await supabase.from('recurring_split_people').delete().eq('recurring_expense_id', recurringExpenseId);
}

export async function createExpense(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = createExpenseSchema.safeParse({
    date: formData.get('date'),
    amount: formData.get('amount'),
    spentWhere: formData.get('spentWhere'),
    categoryId: formData.get('categoryId'),
    paymentMethodId: formData.get('paymentMethodId'),
    splitCount: formData.get('splitCount'),
    note: formData.get('note'),
    splitPeople: formData.getAll('splitPeople')
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid expense payload.');
  }

  const data = parsed.data;

  const { data: created, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      date: normalizeDateOnly(data.date),
      amount_cents: Math.round(data.amount * 100),
      spent_where: data.spentWhere,
      category_id: data.categoryId,
      payment_method_id: data.paymentMethodId,
      split_count: data.splitCount,
      note: data.note || null
    })
    .select('id')
    .single();

  if (error) throw error;

  await clearExpenseSplitLinks(supabase, created.id);

  if (data.splitPeople?.length) {
    const uniqueSplitPeople = [...new Set(data.splitPeople)];
    const { error: splitError } = await supabase.from('expense_split_people').insert(
      uniqueSplitPeople.map((personId) => ({
        expense_id: created.id,
        person_id: personId
      }))
    );

    if (splitError) throw splitError;
  }

  revalidatePath('/');
}

export async function createRecurringExpense(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = recurringExpenseSchema.safeParse({
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    amount: formData.get('amount'),
    spentWhere: formData.get('spentWhere'),
    categoryId: formData.get('categoryId'),
    paymentMethodId: formData.get('paymentMethodId'),
    splitCount: formData.get('splitCount'),
    recurrence: formData.get('recurrence'),
    note: formData.get('note'),
    splitPeople: formData.getAll('splitPeople')
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid recurring expense payload.');
  }

  const data = parsed.data;
  if (data.endDate && data.endDate < data.startDate) {
    throw new Error('End date must be after the start date.');
  }

  const { data: created, error } = await supabase
    .from('recurring_expenses')
    .insert({
      user_id: user.id,
      start_date: normalizeDateOnly(data.startDate),
      end_date: data.endDate || null,
      recurrence: data.recurrence,
      amount_cents: Math.round(data.amount * 100),
      spent_where: data.spentWhere,
      category_id: data.categoryId,
      payment_method_id: data.paymentMethodId,
      split_count: data.splitCount,
      note: data.note || null
    })
    .select('id')
    .single();

  if (error) throw error;

  await clearRecurringSplitLinks(supabase, created.id);

  if (data.splitPeople?.length) {
    const uniqueSplitPeople = [...new Set(data.splitPeople)];
    const { error: splitError } = await supabase.from('recurring_split_people').insert(
      uniqueSplitPeople.map((personId) => ({
        recurring_expense_id: created.id,
        person_id: personId
      }))
    );

    if (splitError) throw splitError;
  }

  revalidatePath('/');
}

export async function deleteRecurringExpense(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Recurring expense id missing.');

  await clearRecurringSplitLinks(supabase, id);
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/');
}

export async function upsertMonthlyIncome(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = incomeSchema.safeParse({
    monthKey: formData.get('monthKey') ?? toMonthKey(),
    income: formData.get('income')
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid income payload.');
  }

  const { error } = await supabase.from('monthly_incomes').upsert(
    {
      user_id: user.id,
      month_key: parsed.data.monthKey,
      income_cents: Math.round(parsed.data.income * 100)
    },
    { onConflict: 'user_id,month_key' }
  );

  if (error) throw error;

  revalidatePath('/');
}

export async function createCategory(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const parsed = optionSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) throw new Error('Invalid category name.');

  const { error } = await supabase.from('categories').insert({ user_id: user.id, name: parsed.data.name, is_default: false });
  if (error) throw error;

  revalidatePath('/settings');
  revalidatePath('/');
}

export async function deleteCategory(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Category id missing.');

  const [{ count: oneTimeCount }, { count: recurringCount }] = await Promise.all([
    supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('category_id', id),
    supabase.from('recurring_expenses').select('*', { count: 'exact', head: true }).eq('category_id', id)
  ]);

  if ((oneTimeCount ?? 0) > 0 || (recurringCount ?? 0) > 0) {
    throw new Error('This category is already used by expenses.');
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/settings');
  revalidatePath('/');
}

export async function createPaymentMethod(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const parsed = optionSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) throw new Error('Invalid payment method name.');

  const { error } = await supabase
    .from('payment_methods')
    .insert({ user_id: user.id, name: parsed.data.name, is_default: false });
  if (error) throw error;

  revalidatePath('/settings');
  revalidatePath('/');
}

export async function deletePaymentMethod(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Payment method id missing.');

  const [{ count: oneTimeCount }, { count: recurringCount }] = await Promise.all([
    supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('payment_method_id', id),
    supabase.from('recurring_expenses').select('*', { count: 'exact', head: true }).eq('payment_method_id', id)
  ]);

  if ((oneTimeCount ?? 0) > 0 || (recurringCount ?? 0) > 0) {
    throw new Error('This payment method is already used by expenses.');
  }

  const { error } = await supabase.from('payment_methods').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/settings');
  revalidatePath('/');
}

export async function createPerson(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const parsed = optionSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) throw new Error('Invalid person name.');

  const { error } = await supabase.from('people').insert({ user_id: user.id, name: parsed.data.name, is_default: false });
  if (error) throw error;

  revalidatePath('/settings');
  revalidatePath('/');
}

export async function deletePerson(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Person id missing.');

  const [{ count: oneTimeCount }, { count: recurringCount }] = await Promise.all([
    supabase.from('expense_split_people').select('*', { count: 'exact', head: true }).eq('person_id', id),
    supabase.from('recurring_split_people').select('*', { count: 'exact', head: true }).eq('person_id', id)
  ]);

  if ((oneTimeCount ?? 0) > 0 || (recurringCount ?? 0) > 0) {
    throw new Error('This person is already referenced by split expenses.');
  }

  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/settings');
  revalidatePath('/');
}

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(60),
  phone: z.string().trim().min(8).max(20)
});

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone')
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid profile payload.');
  }

  const fullName = parsed.data.fullName;
  const phone = formatPhoneToE164(parsed.data.phone);

  const { error } = await supabase.auth.updateUser({
    phone,
    data: {
      full_name: fullName,
      username_seed: fullName
    }
  });

  if (error) throw error;

  await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);

  revalidatePath('/');
  revalidatePath('/settings');
}

'use client';

import { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';

import { createExpense } from '@/actions/expense-actions';
import { SubmitButton } from '@/components/submit-button';
import { toDateInputValue } from '@/lib/utils';
import type { ConfigPayload } from '@/lib/queries';

type Props = {
  config: ConfigPayload;
};

export function AddExpenseForm({ config }: Props) {
  const [open, setOpen] = useState(true);
  const defaultDate = useMemo(() => toDateInputValue(new Date()), []);

  return (
    <section className="panel sticky-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Quick capture</p>
          <h2>Add expense</h2>
        </div>
        <button className="ghost-button" type="button" onClick={() => setOpen((value) => !value)}>
          <PlusCircle size={18} />
          <span>{open ? 'Hide form' : 'Open form'}</span>
        </button>
      </div>

      <form action={createExpense} className={`expense-form ${open ? 'is-open' : ''}`}>
        <div className="field-grid two-col">
          <label>
            <span>Date</span>
            <input defaultValue={defaultDate} name="date" required type="date" />
          </label>
          <label>
            <span>Amount</span>
            <input min="0" name="amount" placeholder="0.00" required step="0.01" type="number" />
          </label>
        </div>

        <label>
          <span>Spent where</span>
          <input name="spentWhere" placeholder="Zomato, Uber, Grocery store..." required type="text" />
        </label>

        <div className="field-grid two-col">
          <label>
            <span>Category</span>
            <select name="categoryId" required>
              <option value="">Select category</option>
              {config.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Mode of payment</span>
            <select name="paymentMethodId" required>
              <option value="">Select payment mode</option>
              {config.paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-grid two-col align-end">
          <label>
            <span>Divide by</span>
            <input defaultValue={1} max="50" min="1" name="splitCount" required type="number" />
          </label>

          <label>
            <span>Optional note</span>
            <input maxLength={160} name="note" placeholder="Dinner, fuel, coffee..." type="text" />
          </label>
        </div>

        <fieldset className="chip-fieldset">
          <legend>Split with</legend>
          <div className="chip-grid">
            {config.people.map((person) => (
              <label className="chip" key={person.id}>
                <input name="splitPeople" type="checkbox" value={person.id} />
                <span>{person.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <SubmitButton label="Save expense" pendingLabel="Saving expense..." />
      </form>
    </section>
  );
}

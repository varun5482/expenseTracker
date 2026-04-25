'use client';

import { useMemo, useState } from 'react';
import { Repeat } from 'lucide-react';

import { createRecurringExpense } from '@/actions/expense-actions';
import { SubmitButton } from '@/components/submit-button';
import { toDateInputValue } from '@/lib/utils';
import type { ConfigPayload } from '@/lib/queries';

export function RecurringExpenseForm({ config }: { config: ConfigPayload }) {
  const [open, setOpen] = useState(false);
  const defaultDate = useMemo(() => toDateInputValue(new Date()), []);

  return (
    <section className="panel sticky-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Automation</p>
          <h2>Add recurring expense</h2>
        </div>
        <button className="ghost-button" type="button" onClick={() => setOpen((value) => !value)}>
          <Repeat size={18} />
          <span>{open ? 'Hide recurring form' : 'Open recurring form'}</span>
        </button>
      </div>

      <form action={createRecurringExpense} className={`expense-form ${open ? 'is-open' : ''}`}>
        <div className="field-grid two-col">
          <label>
            <span>Start date</span>
            <input defaultValue={defaultDate} name="startDate" required type="date" />
          </label>
          <label>
            <span>End date (optional)</span>
            <input name="endDate" type="date" />
          </label>
        </div>

        <div className="field-grid two-col">
          <label>
            <span>Amount</span>
            <input min="0" name="amount" placeholder="0.00" required step="0.01" type="number" />
          </label>
          <label>
            <span>Recurrence</span>
            <select defaultValue="monthly" name="recurrence" required>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
        </div>

        <label>
          <span>Spent where</span>
          <input name="spentWhere" placeholder="Rent, SIP, Netflix, WiFi..." required type="text" />
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
            <input maxLength={160} name="note" placeholder="Auto debit, subscription..." type="text" />
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

        <SubmitButton label="Save recurring expense" pendingLabel="Saving recurring expense..." />
      </form>
    </section>
  );
}

import { upsertMonthlyIncome } from '@/actions/expense-actions';
import { SubmitButton } from '@/components/submit-button';
import { formatCurrencyFromCents } from '@/lib/format';
import type { IncomeRecord } from '@/lib/queries';

type Props = {
  monthKey: string;
  incomeRecord: IncomeRecord;
};

export function IncomeForm({ monthKey, incomeRecord }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Savings input</p>
          <h2>Monthly income</h2>
        </div>
        <span className="muted-pill">{incomeRecord ? formatCurrencyFromCents(incomeRecord.income_cents) : 'Not set'}</span>
      </div>

      <form action={upsertMonthlyIncome} className="inline-form">
        <input name="monthKey" type="hidden" value={monthKey} />
        <label className="grow">
          <span>Income for {monthKey}</span>
          <input
            defaultValue={incomeRecord ? incomeRecord.income_cents / 100 : ''}
            min="0"
            name="income"
            placeholder="Enter monthly income"
            required
            step="0.01"
            type="number"
          />
        </label>
        <SubmitButton label="Save income" pendingLabel="Saving..." />
      </form>
    </section>
  );
}

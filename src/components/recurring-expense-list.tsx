import { deleteRecurringExpense } from '@/actions/expense-actions';
import { formatCurrencyFromCents } from '@/lib/format';
import type { AwaitedRecurringTemplate } from '@/types/local';

export function RecurringExpenseList({ items }: { items: AwaitedRecurringTemplate[] }) {
  return (
    <section className="panel">
      <div className="panel-header panel-header--wrap">
        <div>
          <p className="eyebrow">Recurring rules</p>
          <h2>Active recurring expenses</h2>
        </div>
        <span className="muted-pill">{items.length} active</span>
      </div>

      {items.length === 0 ? (
        <p className="empty-state">No recurring rules yet.</p>
      ) : (
        <div className="config-list">
          {items.map((item) => (
            <div className="config-row config-row--stack" key={item.id}>
              <div>
                <strong>{item.spent_where}</strong>
                <p className="panel-copy">
                  {formatCurrencyFromCents(item.amount_cents)} · {item.recurrence} · {item.categoryName} · {item.paymentMethodName}
                </p>
                <small className="panel-copy">
                  Starts {item.start_date}
                  {item.end_date ? ` · ends ${item.end_date}` : ' · no end date'}
                </small>
              </div>
              <form action={deleteRecurringExpense}>
                <input name="id" type="hidden" value={item.id} />
                <button className="ghost-button danger-button" type="submit">
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import { formatCurrencyFromCents, formatDate } from '@/lib/format';
import { buildGroupedExpenses, type ExpenseWithRelations, type GroupByOption } from '@/lib/queries';

type Props = {
  expenses: ExpenseWithRelations[];
  groupBy: GroupByOption;
};

export function GroupedExpenseList({ expenses, groupBy }: Props) {
  const groups = buildGroupedExpenses(expenses, groupBy);

  return (
    <section className="panel">
      <div className="panel-header panel-header--wrap">
        <div>
          <p className="eyebrow">Organized view</p>
          <h2>Grouped expenses</h2>
        </div>
        <span className="muted-pill">Grouping: {groupBy}</span>
      </div>

      {groups.length === 0 ? (
        <p className="empty-state">No expenses found for the selected month.</p>
      ) : (
        <div className="group-stack">
          {groups.map((group) => (
            <article className="group-card" key={`${group.label}-${group.totalCents}`}>
              <header className="group-card__header">
                <div>
                  <h3>{groupBy === 'date' ? formatDate(new Date(group.label)) : group.label}</h3>
                  <p>{group.items.length} item(s)</p>
                </div>
                <strong>{formatCurrencyFromCents(group.totalCents)}</strong>
              </header>

              <div className="expense-items">
                {group.items.map((expense) => (
                  <div className="expense-item" key={expense.id}>
                    <div>
                      <strong>
                        {expense.spentWhere}
                        {expense.isRecurring ? <span className="pill-inline">{expense.recurrenceLabel} recurring</span> : null}
                      </strong>
                      <p>
                        {expense.category.name} · {expense.paymentMethod.name}
                        {expense.note ? ` · ${expense.note}` : ''}
                      </p>
                      <small>
                        {formatDate(expense.date)}
                        {expense.splitCount > 1
                          ? ` · split ${expense.splitCount} ways${expense.splitPeople.length ? ` with ${expense.splitPeople.map((item) => item.person.name).join(', ')}` : ''}`
                          : ' · not split'}
                      </small>
                    </div>
                    <div className="expense-item__amounts">
                      <strong>{formatCurrencyFromCents(expense.amountCents)}</strong>
                      {expense.splitCount > 1 ? (
                        <span>Your share: {formatCurrencyFromCents(Math.round(expense.amountCents / expense.splitCount))}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

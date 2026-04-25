import { formatCurrencyFromCents } from '@/lib/format';
import type { DashboardPayload } from '@/lib/queries';

export function TopCategories({ data }: { data: DashboardPayload }) {
  const maxValue = Math.max(...data.topCategories.map((item) => item.amountCents), 1);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Breakdown</p>
          <h2>Top categories</h2>
        </div>
      </div>

      {data.topCategories.length === 0 ? (
        <p className="empty-state">No category data yet.</p>
      ) : (
        <div className="stack-list">
          {data.topCategories.map((item) => (
            <div className="progress-row" key={item.label}>
              <div className="progress-row__copy">
                <strong>{item.label}</strong>
                <span>{formatCurrencyFromCents(item.amountCents)}</span>
              </div>
              <div className="progress-row__track">
                <div className="progress-row__fill" style={{ width: `${(item.amountCents / maxValue) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

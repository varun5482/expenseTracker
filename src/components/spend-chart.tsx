import { formatCurrencyFromCents, formatShortDate } from '@/lib/format';
import type { DashboardPayload } from '@/lib/queries';

export function SpendChart({ data }: { data: DashboardPayload }) {
  const maxDaily = Math.max(...data.groupedDaily.map((item) => item.amountCents), 1);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Snapshot</p>
          <h2>Daily spend trend</h2>
        </div>
      </div>

      <div className="chart-bars">
        {data.groupedDaily.length === 0 ? (
          <p className="empty-state">No expense entries yet for this month.</p>
        ) : (
          data.groupedDaily.slice(-10).map((item) => (
            <div className="chart-bar" key={item.date}>
              <span className="chart-bar__value">{formatCurrencyFromCents(item.amountCents)}</span>
              <div className="chart-bar__track">
                <div
                  className="chart-bar__fill"
                  style={{ height: `${Math.max((item.amountCents / maxDaily) * 100, 8)}%` }}
                />
              </div>
              <span className="chart-bar__label">{formatShortDate(new Date(item.date))}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

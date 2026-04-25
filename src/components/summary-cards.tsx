import { PiggyBank, ReceiptText, Repeat, Scale, Wallet } from 'lucide-react';

import { formatCurrencyFromCents } from '@/lib/format';
import type { DashboardPayload } from '@/lib/queries';

export function SummaryCards({ summary }: { summary: DashboardPayload['summary'] }) {
  const cards = [
    {
      label: 'Total spent',
      value: formatCurrencyFromCents(summary.totalSpentCents),
      hint: `${summary.totalExpenseCount} entries this month`,
      icon: ReceiptText
    },
    {
      label: 'Your share',
      value: formatCurrencyFromCents(summary.ownShareSpentCents),
      hint: `${summary.splitExpenseCount} split expenses`,
      icon: Scale
    },
    {
      label: 'Monthly income',
      value: formatCurrencyFromCents(summary.monthlyIncomeCents),
      hint: 'Used to calculate savings',
      icon: Wallet
    },
    {
      label: 'Recurring items',
      value: String(summary.recurringExpenseCount),
      hint: 'Expanded into this month view',
      icon: Repeat
    },
    {
      label: 'Savings left',
      value: formatCurrencyFromCents(summary.savingsCents),
      hint: summary.savingsCents >= 0 ? 'Still in the green' : 'Over the planned budget',
      icon: PiggyBank
    }
  ];

  return (
    <section className="summary-grid summary-grid--five">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className="summary-card" key={card.label}>
            <div className="summary-card__icon">
              <Icon size={18} />
            </div>
            <p>{card.label}</p>
            <h3>{card.value}</h3>
            <span>{card.hint}</span>
          </article>
        );
      })}
    </section>
  );
}

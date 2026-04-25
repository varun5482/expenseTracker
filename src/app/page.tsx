import { AddExpenseForm } from '@/components/add-expense-form';
import { GroupedExpenseList } from '@/components/grouped-expense-list';
import { IncomeForm } from '@/components/income-form';
import { RecurringExpenseForm } from '@/components/recurring-expense-form';
import { RecurringExpenseList } from '@/components/recurring-expense-list';
import { SpendChart } from '@/components/spend-chart';
import { SummaryCards } from '@/components/summary-cards';
import { TopCategories } from '@/components/top-categories';
import { requireUser } from '@/lib/auth';
import { getConfigOptions, getDashboardData, getRecurringTemplatesWithLabels, type GroupByOption } from '@/lib/queries';
import { toMonthKey } from '@/lib/utils';

type Props = {
  searchParams: Promise<{
    month?: string;
    groupBy?: GroupByOption;
  }>;
};

export default async function Page({ searchParams }: Props) {
  const user = await requireUser();
  const params = await searchParams;
  const monthKey = /^\d{4}-\d{2}$/.test(params.month ?? '') ? (params.month as string) : toMonthKey();
  const allowedGroups: GroupByOption[] = ['date', 'category', 'spentWhere'];
  const groupBy = allowedGroups.includes(params.groupBy as GroupByOption) ? (params.groupBy as GroupByOption) : 'date';

  const [dashboard, config, recurringTemplates] = await Promise.all([
    getDashboardData(user.id, monthKey),
    getConfigOptions(user.id),
    getRecurringTemplatesWithLabels(user.id)
  ]);

  return (
    <div className="page-stack">
      <section className="toolbar panel">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Track monthly spend, share, savings, and recurring commitments</h2>
        </div>

        <form className="toolbar-controls" method="get">
          <label>
            <span>Month</span>
            <input defaultValue={monthKey} name="month" type="month" />
          </label>
          <label>
            <span>Group by</span>
            <select defaultValue={groupBy} name="groupBy">
              <option value="date">Date</option>
              <option value="category">Category</option>
              <option value="spentWhere">Spent where</option>
            </select>
          </label>
          <button className="primary-button" type="submit">
            Apply
          </button>
        </form>
      </section>

      <SummaryCards summary={dashboard.summary} />

      <div className="content-grid">
        <div className="content-main">
          <IncomeForm incomeRecord={dashboard.incomeRecord} monthKey={monthKey} />
          <div className="panel-grid">
            <SpendChart data={dashboard} />
            <TopCategories data={dashboard} />
          </div>
          <GroupedExpenseList expenses={dashboard.expenses} groupBy={groupBy} />
          <RecurringExpenseList items={recurringTemplates} />
        </div>

        <aside className="content-side">
          <AddExpenseForm config={config} />
          <RecurringExpenseForm config={config} />
        </aside>
      </div>
    </div>
  );
}

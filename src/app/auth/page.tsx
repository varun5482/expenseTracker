import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { getCurrentUser } from '@/lib/auth';

export default async function AuthPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }

  return (
    <div className="page-stack auth-layout">
      <section className="panel auth-info">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Supabase powered</p>
            <h2>Private by default</h2>
          </div>
        </div>
        <p className="panel-copy">
          Your mobile number is used only for authentication. Expenses, income, categories, payment modes, split names, and recurring
          templates are stored against your user id with Row Level Security so each account can only access its own rows.
        </p>
        <div className="stack-list">
          <div className="progress-row__copy">
            <strong>Phone + password login</strong>
            <span>No OTP cost in this version.</span>
          </div>
          <div className="progress-row__copy">
            <strong>User-scoped configuration</strong>
            <span>Every dropdown list is unique to the signed-in user.</span>
          </div>
          <div className="progress-row__copy">
            <strong>Recurring expenses</strong>
            <span>Daily, weekly, monthly, quarterly, and yearly recurring templates roll into the dashboard automatically.</span>
          </div>
        </div>
      </section>
      <AuthForm />
    </div>
  );
}

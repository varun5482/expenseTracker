import Link from 'next/link';

import {
  createCategory,
  createPaymentMethod,
  createPerson,
  deleteCategory,
  deletePaymentMethod,
  deletePerson
} from '@/actions/expense-actions';
import { ProfileForm } from '@/components/profile-form';
import { SettingsOptionManager } from '@/components/settings-option-manager';
import { getCurrentProfile, requireUser } from '@/lib/auth';
import { getConfigOptions } from '@/lib/queries';

export default async function SettingsPage() {
  const user = await requireUser();
  const [config, profile] = await Promise.all([getConfigOptions(user.id), getCurrentProfile()]);

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-header panel-header--wrap">
          <div>
            <p className="eyebrow">App settings</p>
            <h2>Configure your private dropdown options</h2>
          </div>
          <Link className="ghost-button" href="/">
            Back to dashboard
          </Link>
        </div>
        <p className="panel-copy">
          Categories, payment modes, split names, and profile details are stored per user with Row Level Security.
        </p>
      </section>

      <ProfileForm phone={user.phone ?? ''} profile={profile} />

      <div className="settings-grid">
        <SettingsOptionManager
          createAction={createCategory}
          deleteAction={deleteCategory}
          description="These appear in the category dropdown while adding an expense."
          items={config.categories}
          placeholder="e.g. Rent"
          title="Categories"
        />
        <SettingsOptionManager
          createAction={createPaymentMethod}
          deleteAction={deletePaymentMethod}
          description="These appear in the mode of payment dropdown."
          items={config.paymentMethods}
          placeholder="e.g. Wallet"
          title="Payment methods"
        />
        <SettingsOptionManager
          createAction={createPerson}
          deleteAction={deletePerson}
          description="These names appear in the split-with list for shared expenses."
          items={config.people}
          placeholder="e.g. Roommate"
          title="People"
        />
      </div>
    </div>
  );
}

import { updateProfile } from '@/actions/expense-actions';
import { SubmitButton } from '@/components/submit-button';
import type { Profile } from '@/lib/db-types';

type Props = {
  profile: Profile | null;
  phone: string;
};

export function ProfileForm({ profile, phone }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Profile</h2>
        </div>
      </div>
      <p className="panel-copy">Your mobile number is used for sign-in. Expense rows stay keyed by user id, not by phone number.</p>

      <form action={updateProfile} className="inline-form inline-form--stack">
        <label className="grow">
          <span>Name</span>
          <input defaultValue={profile?.full_name ?? ''} name="fullName" required type="text" />
        </label>
        <label className="grow">
          <span>Mobile number</span>
          <input defaultValue={phone} name="phone" required type="tel" />
        </label>
        <SubmitButton label="Save profile" pendingLabel="Saving profile..." />
      </form>
      {profile ? <p className="panel-copy">Username: @{profile.username}</p> : null}
    </section>
  );
}

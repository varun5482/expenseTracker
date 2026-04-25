'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" disabled={pending} type="submit">
      {pending ? pendingLabel ?? 'Saving...' : label}
    </button>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { formatPhoneToE164 } from '@/lib/utils';

function slugifyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
}

export function AuthForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const phone = formatPhoneToE164(String(formData.get('phone') ?? ''));
      const password = String(formData.get('password') ?? '');

      if (mode === 'register') {
        const fullName = String(formData.get('fullName') ?? '').trim();
        const confirmPassword = String(formData.get('confirmPassword') ?? '');

        if (password !== confirmPassword) {
          throw new Error('Password and confirm password must match.');
        }

        if (fullName.length < 2) {
          throw new Error('Please enter your name.');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          phone,
          password,
          options: {
            data: {
              full_name: fullName,
              username_seed: slugifyName(fullName)
            }
          }
        });

        if (signUpError) throw signUpError;

        const { error: signInError } = await supabase.auth.signInWithPassword({ phone, password });
        if (signInError) throw signInError;

        setSuccess('Account created. Redirecting to your dashboard...');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ phone, password });
        if (signInError) throw signInError;

        setSuccess('Signed in. Redirecting...');
      }

      router.replace('/');
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Authentication failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card panel">
      <div className="panel-header panel-header--wrap">
        <div>
          <p className="eyebrow">Secure access</p>
          <h2>{mode === 'login' ? 'Login with mobile number' : 'Create your account'}</h2>
        </div>
        <div className="segmented-toggle" role="tablist" aria-label="Auth mode">
          <button
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'segmented-toggle__item is-active' : 'segmented-toggle__item'}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'segmented-toggle__item is-active' : 'segmented-toggle__item'}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>
      </div>

      <p className="panel-copy">
        Use your mobile number as the unique sign-in identifier. The app stores expense data against your authenticated user id,
        while the phone number stays in Supabase Auth instead of in expense records.
      </p>

      <form
        action={async (formData) => {
          await onSubmit(formData);
        }}
        className="expense-form is-open"
      >
        {mode === 'register' ? (
          <label>
            <span>Name</span>
            <input autoComplete="name" name="fullName" placeholder="Varun Mukherjee" required type="text" />
          </label>
        ) : null}

        <label>
          <span>Mobile number</span>
          <input autoComplete="tel" name="phone" placeholder="9876543210 or +919876543210" required type="tel" />
        </label>

        <label>
          <span>Preferred password</span>
          <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} name="password" required type="password" />
        </label>

        {mode === 'register' ? (
          <label>
            <span>Confirm password</span>
            <input autoComplete="new-password" minLength={8} name="confirmPassword" required type="password" />
          </label>
        ) : null}

        {error ? <p className="form-status form-status--error">{error}</p> : null}
        {success ? <p className="form-status form-status--success">{success}</p> : null}

        <button className="primary-button" disabled={loading} type="submit">
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
    </section>
  );
}

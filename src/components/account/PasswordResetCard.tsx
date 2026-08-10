'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

/**
 * Password change, delegated to Firebase.
 *
 * Sends a reset link rather than accepting a new password in-page: the
 * application never handles the credential, and the emailed link proves
 * control of the address.
 */
export function PasswordResetCard({ email }: { email: string }) {
  const { resetPassword, configured } = useAuth();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSend() {
    setState('sending');
    try {
      await resetPassword(email);
      setState('sent');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the email.');
      setState('error');
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-200">
      <h2 className="font-display text-lg font-semibold text-sand-900">Password</h2>

      {state === 'sent' ? (
        <Alert variant="success" className="mt-3">
          A password reset link is on its way to {email}. It expires in one hour.
        </Alert>
      ) : (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-sand-600">
            We will email you a secure link to set a new password.
          </p>

          {state === 'error' && (
            <Alert variant="error" className="mt-3">
              {message}
            </Alert>
          )}

          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="mt-4"
            loading={state === 'sending'}
            disabled={!configured}
            onClick={handleSend}
          >
            Send reset link
          </Button>
        </>
      )}
    </section>
  );
}

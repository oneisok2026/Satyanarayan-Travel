'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export function VerifyEmailNotice({ email }: { email: string }) {
  const { sendVerificationEmail } = useAuth();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleResend() {
    setState('sending');
    try {
      await sendVerificationEmail();
      setState('sent');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not send the email.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <Alert variant="success" title="Verification email sent">
        Check <strong>{email}</strong> and follow the link to verify your address.
      </Alert>
    );
  }

  return (
    <Alert variant="warning" title="Verify your email address">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          We sent a verification link to <strong>{email}</strong>.
        </span>
        <Button
          size="sm"
          variant="outline"
          loading={state === 'sending'}
          onClick={handleResend}
        >
          Resend email
        </Button>
      </div>
      {state === 'error' && <p className="mt-2 text-xs">{message}</p>}
    </Alert>
  );
}

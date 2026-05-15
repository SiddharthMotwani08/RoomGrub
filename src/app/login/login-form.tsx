'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signup } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('created') ? 'login' : 'login');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupState, signupAction] = useFormState(signup, null);

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setLoginError('');
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setLoginError('Invalid email or password');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <Card className="pocket-card w-full max-w-md border-emerald-100/60 shadow-2xl shadow-emerald-900/10 ring-2 ring-emerald-500/10">
      <CardHeader className="space-y-1 sm:text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Pocket</CardTitle>
        <CardDescription className="text-slate-600">Roommate splits without spreadsheet pain.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100/90 p-1 ring-1 ring-slate-200/80">
          <button
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            onClick={() => setMode('signup')}
            type="button"
          >
            Signup
          </button>
        </div>

        {mode === 'login' ? (
          <form action={handleLogin} className="space-y-4">
            {searchParams.get('created') && (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Account created. Log in now.</p>
            )}
            {loginError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loginError}</p>}
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-900/15 hover:from-emerald-500 hover:to-teal-500" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-xs text-slate-500">Demo: sid@pocket.test / password123</p>
          </form>
        ) : (
          <form action={signupAction} className="space-y-4">
            {signupState?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{signupState.error}</p>}
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input id="signup-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-900/15 hover:from-emerald-500 hover:to-teal-500"
            >Create account</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

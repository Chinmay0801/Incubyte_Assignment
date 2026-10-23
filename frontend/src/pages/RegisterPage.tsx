import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/useAuth';
import { errorMessage } from '../utils/format';

const MIN_PASSWORD_LENGTH = 8;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const validationError = (): string | null => {
    if (!form.name.trim() || !form.email.trim() || !form.password) return 'Fill in your name, email and password.';
    if (form.password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
    if (form.password !== form.confirm) return "Passwords don't match.";
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = validationError();
    setError(problem);
    if (problem) return;

    setIsSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create an account" intro="Browse the lot and buy vehicles that are in stock.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="register-name" className="field-label">Full name</label>
          <input id="register-name" autoComplete="name" className="field-input" value={form.name} onChange={(e) => set('name')(e.target.value)} />
        </div>
        <div>
          <label htmlFor="register-email" className="field-label">Email</label>
          <input id="register-email" type="email" autoComplete="email" className="field-input" value={form.email} onChange={(e) => set('email')(e.target.value)} />
        </div>
        <div>
          <label htmlFor="register-password" className="field-label">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            className="field-input"
            value={form.password}
            onChange={(e) => set('password')(e.target.value)}
            aria-describedby="register-password-hint"
          />
          <p id="register-password-hint" className="mt-1 text-xs text-asphalt-500">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        </div>
        <div>
          <label htmlFor="register-confirm" className="field-label">Confirm password</label>
          <input id="register-confirm" type="password" autoComplete="new-password" className="field-input" value={form.confirm} onChange={(e) => set('confirm')(e.target.value)} />
        </div>
        {error && (
          <p role="alert" className="rounded-md border border-stamp/60 bg-stamp/10 px-3 py-2 text-sm text-sticker">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-sm text-asphalt-300">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-paint underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

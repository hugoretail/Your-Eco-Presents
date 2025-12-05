
'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState<string|null>(null);
  const [remember, setRemember] = useState<boolean>(false);
  const router = useRouter();
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const confirmed = params?.get('confirmed');
  const already = params?.get('already');

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess(false);
  const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password, remember }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Identifiants invalides'); return; }
  setSuccess(true);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-changed'));
  }
    setRole(data.role || null);
    setTimeout(() => {
      if (data.role === 'ADMIN') router.push('/admin');
      else router.push('/');
    }, 1200);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-6 rounded-2xl border border-neutral-200 bg-white/95 p-8 shadow-lg backdrop-blur">
        <h1 className="text-3xl font-extrabold tracking-tight title-gradient mb-2">Connexion</h1>
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-neutral-800 mb-1">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-bold text-neutral-800 mb-1">Mot de passe</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Mot de passe"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e)=>setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-neutral-800">Rester connecté</span>
          </label>
        </div>
  {error && <p className="text-base text-red-700 font-semibold rounded-lg border border-red-200 bg-red-50 px-3 py-2">{error}</p>}
        {success && (
          <p className="text-base text-emerald-700 font-semibold rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            Connecté. Redirection… {role === 'ADMIN' ? 'Admin' : 'Accueil'}
          </p>
        )}
        {confirmed && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-base text-emerald-700 font-semibold">Email confirmé. Vous pouvez maintenant vous connecter.</p>}
        {already && <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-700 font-semibold">Ce compte est déjà confirmé.</p>}
        <button className="w-full rounded-lg bg-emerald-600 py-2 text-lg font-bold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition">Se connecter</button>
        <p className="text-sm text-neutral-600 text-center mt-2">Pas encore de compte ? <a href="/register" className="text-emerald-700 underline font-semibold">Créer un compte</a></p>
      </form>
    </div>
  );
}

"use client";
import { useEffect, useState } from 'react';

type UserInfo = {
  email: string;
  displayName?: string | null;
  preferences?: any | null;
  newsletterOptIn?: boolean;
};

export default function AccountPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pref, setPref] = useState<any>({ theme: 'light', emailNotifications: false });
  const [displayName, setDisplayName] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const me = await fetch('/api/auth/me').then(r=>r.json());
      if (!me?.authenticated) { setLoading(false); return; }
      setUser(me.user);
      setDisplayName(me.user.displayName ?? '');
      setNewsletter(!!me.user.newsletterOptIn);
      try { setPref(me.user.preferences ? JSON.parse(me.user.preferences) : { theme: 'light', emailNotifications: false }); } catch { setPref({}); }
      const sg = await fetch('/api/account/saved').then(r=>r.json()).catch(()=>({items:[]}));
      setSaved(Array.isArray(sg.items) ? sg.items : []);
      setLoading(false);
    }
    load();
  }, []);

  async function saveProfile() {
    setMessage('');
    const res = await fetch('/api/account/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName, preferences: pref, newsletterOptIn: newsletter }) });
    const j = await res.json();
    setMessage(res.ok ? 'Profil mis à jour.' : (j.error || 'Erreur'));
  }

  async function savePassword() {
    setMessage('');
    if (!password || password !== password2) { setMessage('Les mots de passe ne correspondent pas.'); return; }
    const res = await fetch('/api/account/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const j = await res.json();
    setMessage(res.ok ? 'Mot de passe mis à jour.' : (j.error || 'Erreur'));
    setPassword(''); setPassword2('');
  }

  async function deleteAccount() {
    if (!confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) return;
    const res = await fetch('/api/account/delete', { method: 'DELETE' });
    if (res.ok) {
      window.location.href = '/';
    } else {
      const j = await res.json().catch(()=>({} as any));
      alert(j.error || 'Erreur lors de la suppression.');
    }
  }

  if (loading) return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10">Chargement…</div>;
  if (!user) return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10">Non connecté.</div>;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 space-y-10">
      <div>
  <h1 className="text-3xl font-extrabold tracking-tight title-gradient">Mon compte</h1>
  <p className="text-neutral-800 mt-1">Gérez vos informations, préférences et idées enregistrées.</p>
      </div>

      {message && <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-800 text-sm">{message}</div>}

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold mb-3 text-neutral-900">Profil</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-neutral-900">Email</label>
              <input value={user.email} disabled className="mt-1 w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-900">Nom d’affichage</label>
              <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Ex: Hugo" className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-600" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-900">
              <input type="checkbox" checked={newsletter} onChange={e=>setNewsletter(e.target.checked)} /> Recevoir des idées & actus (optionnel)
            </label>
            <button onClick={saveProfile} className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold">Enregistrer</button>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold mb-3 text-neutral-900">Mot de passe</h2>
          <div className="space-y-3">
            <input type="password" placeholder="Nouveau mot de passe" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-600" />
            <input type="password" placeholder="Confirmer" value={password2} onChange={e=>setPassword2(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-600" />
            <button onClick={savePassword} className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-semibold">Mettre à jour</button>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold mb-3 text-neutral-900">Préférences</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-900">Thème</span>
              <select value={pref.theme ?? 'light'} onChange={e=>setPref({...pref, theme: e.target.value})} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900">
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="system">Système</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-900">
              <input type="checkbox" checked={!!pref.emailNotifications} onChange={e=>setPref({...pref, emailNotifications: e.target.checked})} /> Notifications email
            </label>
          </div>
          <div className="mt-3">
            <button onClick={saveProfile} className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold">Enregistrer</button>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold mb-3 text-neutral-900">Cadeaux enregistrés</h2>
          {saved.length === 0 ? (
            <p className="text-sm text-neutral-800">Aucun favori pour le moment.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((s:any)=> (
                <div key={s.id} className="rounded-lg border border-neutral-200 p-3 bg-white">
                  <div className="aspect-video rounded bg-neutral-100 overflow-hidden mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.product?.image || '/products/placeholder.jpg'} alt={s.product?.name || 'Produit'} className="w-full h-full object-cover" />
                  </div>
                  <div className="font-semibold text-neutral-900">{s.product?.name}</div>
                  {s.note && <div className="text-xs text-neutral-800 mt-1">{s.note}</div>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold mb-3 text-red-700">Danger zone</h2>
          <p className="text-sm text-neutral-700">Supprimer définitivement votre compte et toutes les données associées.</p>
          <button onClick={deleteAccount} className="mt-3 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-semibold">Supprimer mon compte</button>
        </section>
      </div>
    </div>
  );
}
